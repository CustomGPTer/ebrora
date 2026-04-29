// src/lib/site-photo-stamp/geolocation.ts
//
// Thin wrappers around browser geolocation and reverse geocoding.
//
// Reverse geocoding strategy:
//   1. BigDataCloud's client endpoint (primary) — public, keyless,
//      CORS-enabled, ~100k req/day free tier. Each attempt gets one
//      silent retry on transient failure.
//   2. OpenStreetMap Nominatim (fallback) — free, keyless, CORS-enabled.
//      Usage policy asks for ~1 req/sec and a descriptive User-Agent;
//      we're well under the ceiling. Same retry policy.
//   3. Give up → return null. The UI then shows a gentle "Address
//      unavailable" message and the stamp falls back to coords only.
//
// Every attempt has a per-request timeout so a hung endpoint can't stall
// the whole pipeline. All errors are swallowed and converted to null —
// callers never see exceptions from this module.

export interface Coords {
  lat: number;
  lon: number;
  /** Accuracy radius in metres (if known). */
  accuracy?: number;
}

/** Request device location. Returns null on denial, timeout, or unavailable. */
export function getCurrentLocation(timeoutMs = 8000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    let done = false;
    const finish = (c: Coords | null) => {
      if (done) return;
      done = true;
      resolve(c);
    };

    // Additional safety timer — iOS Safari sometimes never calls the
    // geolocation callbacks after a permission dialog timeout.
    const killer = setTimeout(() => finish(null), timeoutMs + 500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(killer);
        finish({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        clearTimeout(killer);
        finish(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

// ─── Reverse geocoding (cascade with retries) ──────────────────

/** Per-attempt timeout in ms. Total worst case = 2 * (BDC + Nominatim) ≈ 24s. */
const PROVIDER_TIMEOUT_MS = 6000;
/** Wait between the first failed attempt and its retry, in ms. */
const RETRY_DELAY_MS = 800;

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = PROVIDER_TIMEOUT_MS): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const killer = setTimeout(() => ctrl.abort(), timeoutMs);
    const resp = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(killer);
    return resp;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Try a single reverse-geocode provider up to twice — once immediately,
 * once after RETRY_DELAY_MS on transient failure. Returns null if both
 * attempts fail; the caller then falls through to the next provider.
 */
async function tryProvider(
  fetcher: (lat: number, lon: number) => Promise<string | null>,
  lat: number,
  lon: number
): Promise<string | null> {
  const first = await fetcher(lat, lon);
  if (first) return first;
  await sleep(RETRY_DELAY_MS);
  return fetcher(lat, lon);
}

// ─── Provider 1: BigDataCloud ────────────────────────────────

async function fetchBigDataCloud(lat: number, lon: number): Promise<string | null> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const resp = await fetchWithTimeout(url);
  if (!resp || !resp.ok) return null;
  try {
    const data = (await resp.json()) as Record<string, unknown>;
    return formatBdcAddress(data);
  } catch {
    return null;
  }
}

// ─── Provider 2: OpenStreetMap Nominatim ─────────────────────

async function fetchNominatim(lat: number, lon: number): Promise<string | null> {
  // Nominatim's usage policy asks for a descriptive User-Agent. Browsers
  // silently override User-Agent, but Nominatim also accepts a `email=`
  // query param or descriptive referrer — our origin header fulfils that.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const resp = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
  });
  if (!resp || !resp.ok) return null;
  try {
    const data = (await resp.json()) as Record<string, unknown>;
    return formatNominatimAddress(data);
  } catch {
    return null;
  }
}

// ─── Provider 3: Photon (Komoot, OSM-backed) ─────────────────
//
// Independent OSM-derived index from BDC and Nominatim — when both of
// those drop a request (rate limiting, regional outage), Photon often
// still resolves. Free, key-less, GeoJSON response shape.

async function fetchPhoton(lat: number, lon: number): Promise<string | null> {
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en`;
  const resp = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
  });
  if (!resp || !resp.ok) return null;
  try {
    const data = (await resp.json()) as Record<string, unknown>;
    return formatPhotonAddress(data);
  } catch {
    return null;
  }
}

// ─── Public entry point ──────────────────────────────────────

/**
 * Reverse-geocode a lat/lon into a human-readable address.
 * Cascades BigDataCloud → Nominatim → Photon with a retry on each.
 * Returns null only if all six attempts fail, at which point the UI
 * will show a generic "Address unavailable" message and the stamp
 * will render with coords only.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const fromBdc = await tryProvider(fetchBigDataCloud, lat, lon);
  if (fromBdc) return fromBdc;
  const fromNominatim = await tryProvider(fetchNominatim, lat, lon);
  if (fromNominatim) return fromNominatim;
  const fromPhoton = await tryProvider(fetchPhoton, lat, lon);
  if (fromPhoton) return fromPhoton;
  return null;
}

// ─── Address formatters ──────────────────────────────────────

/**
 * Compose a concise, Timemark-style address line from BigDataCloud output.
 * Prefers: "<locality>, <city> <postcode>" and falls back to whatever's
 * populated. Returns a plain string (no country suffix unless outside UK).
 */
function formatBdcAddress(d: Record<string, unknown>): string | null {
  const street = str(d.localityInfo, "street") || str(d, "streetName") || "";
  const number = str(d, "streetNumber");
  const locality = str(d, "locality") || "";
  const city = str(d, "city") || str(d, "principalSubdivision") || "";
  const postcode = str(d, "postcode") || "";
  const country = str(d, "countryCode") || "";

  const streetLine = [number, street].filter(Boolean).join(" ");
  const parts = [streetLine, locality, city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const head = parts.join(", ");
  const tail = [postcode, country !== "GB" ? country : ""].filter(Boolean).join(" ").trim();

  const out = [head, tail].filter(Boolean).join(" ").trim();
  return out.length > 0 ? out : null;
}

/**
 * Compose a concise address line from Nominatim's jsonv2 response.
 * Nominatim's schema is different from BDC — fields live under `address`
 * and use OSM's tag names (road, house_number, suburb, town, city,
 * postcode, country_code). We build the same shape as BDC's output so
 * downstream formatting stays consistent regardless of provider.
 */
function formatNominatimAddress(d: Record<string, unknown>): string | null {
  const addr = (d.address && typeof d.address === "object")
    ? (d.address as Record<string, unknown>)
    : {};

  const number = str(addr, "house_number");
  const street = str(addr, "road") || str(addr, "pedestrian") || str(addr, "footway") || "";
  // Nominatim layers locality from finest to coarsest — pick the first populated.
  const locality =
    str(addr, "suburb") ||
    str(addr, "neighbourhood") ||
    str(addr, "hamlet") ||
    str(addr, "village") ||
    "";
  const city =
    str(addr, "city") ||
    str(addr, "town") ||
    str(addr, "municipality") ||
    str(addr, "county") ||
    str(addr, "state") ||
    "";
  const postcode = str(addr, "postcode") || "";
  const country = (str(addr, "country_code") || "").toUpperCase();

  const streetLine = [number, street].filter(Boolean).join(" ");
  const parts = [streetLine, locality, city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const head = parts.join(", ");
  const tail = [postcode, country !== "GB" ? country : ""].filter(Boolean).join(" ").trim();

  const out = [head, tail].filter(Boolean).join(" ").trim();
  if (out.length > 0) return out;

  // Nominatim always returns a top-level `display_name` — coarse, but
  // better than nothing when no structured fields came back.
  const display = str(d, "display_name");
  return display.length > 0 ? display : null;
}

/**
 * Compose a concise address line from Photon's GeoJSON response.
 * Photon returns a FeatureCollection — we use the first feature's
 * `properties` block. Field names mirror OSM (street, housenumber,
 * postcode, city, country, countrycode), so the structure parallels
 * Nominatim's `address` block but lives one level shallower.
 */
function formatPhotonAddress(d: Record<string, unknown>): string | null {
  const features = Array.isArray(d.features) ? (d.features as unknown[]) : [];
  const first = features[0];
  if (!first || typeof first !== "object") return null;
  const props =
    (first as Record<string, unknown>).properties &&
    typeof (first as Record<string, unknown>).properties === "object"
      ? ((first as Record<string, unknown>).properties as Record<string, unknown>)
      : {};

  const number = str(props, "housenumber");
  const street = str(props, "street") || str(props, "name") || "";
  const locality = str(props, "district") || str(props, "suburb") || "";
  const city =
    str(props, "city") ||
    str(props, "town") ||
    str(props, "village") ||
    str(props, "county") ||
    str(props, "state") ||
    "";
  const postcode = str(props, "postcode") || "";
  const country = (str(props, "countrycode") || "").toUpperCase();

  const streetLine = [number, street].filter(Boolean).join(" ");
  const parts = [streetLine, locality, city]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  const head = parts.join(", ");
  const tail = [postcode, country !== "GB" ? country : ""].filter(Boolean).join(" ").trim();

  const out = [head, tail].filter(Boolean).join(" ").trim();
  return out.length > 0 ? out : null;
}

// ─── helpers ────────────────────────────────────────────────────

function str(obj: unknown, key: string): string {
  if (!obj || typeof obj !== "object") return "";
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

// ─── Coord formatting ───────────────────────────────────────────

/** Format decimal degrees to "54.024454°N, 2.825112°W" style. */
export function formatCoordsDecimal(lat: number, lon: number, precision = 6): string {
  const la = `${Math.abs(lat).toFixed(precision)}°${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(precision)}°${lon >= 0 ? "E" : "W"}`;
  return `${la}, ${lo}`;
}

/** Format decimal degrees as DMS: 54°01'28.0"N, 2°49'30.4"W */
export function formatCoordsDms(lat: number, lon: number): string {
  const fmt = (v: number, pos: string, neg: string) => {
    const ref = v >= 0 ? pos : neg;
    const abs = Math.abs(v);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(1);
    return `${deg}°${String(min).padStart(2, "0")}'${sec.padStart(4, "0")}"${ref}`;
  };
  return `${fmt(lat, "N", "S")}, ${fmt(lon, "E", "W")}`;
}
