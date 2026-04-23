// src/lib/site-photo-stamp/geolocation.ts
//
// Thin wrappers around browser geolocation and BigDataCloud reverse geocoding.
//
// BigDataCloud client endpoint:
//   https://api.bigdatacloud.net/data/reverse-geocode-client
// Public, keyless, CORS-enabled, and generous rate limits — standard choice
// for client-side reverse geocoding without managing an API key.
//
// All functions fail gracefully: denial, timeout, and network failure all
// resolve to null so the caller can continue without location.

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

/**
 * Reverse-geocode a lat/lon into a human-readable UK-style address.
 * Returns null on any failure — the caller falls back to coords-only display.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const ctrl = new AbortController();
    const killer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(killer);
    if (!resp.ok) return null;
    const data = await resp.json();
    return formatBdcAddress(data);
  } catch {
    return null;
  }
}

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
