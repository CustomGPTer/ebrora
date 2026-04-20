// src/data/coordinate-converter.ts
// OS Grid (OSGB36) ↔ WGS84 (Lat/Long) Coordinate Converter
// Uses the 7-parameter Helmert datum transformation (~5m accuracy)
// Reference: Ordnance Survey "A Guide to Coordinate Systems in Great Britain"

// ─── Types ───────────────────────────────────────────────────
export type InputMode = "osgrid" | "latlong";
export type LatLongFormat = "decimal" | "dms";
export type Precision = "10m" | "1m" | "0.1m";

export interface ConversionResult {
  gridRef: string;          // e.g. "SJ 35123 36789"
  easting: number;
  northing: number;
  latDec: number;
  lonDec: number;
  latDMS: string;
  lonDMS: string;
  gridLetters: string;      // e.g. "SJ"
  valid: boolean;
  error?: string;
  method: string;
}

export interface BatchRow {
  input: string;
  result: ConversionResult | null;
  error?: string;
}

// ─── Ellipsoid & Projection Constants ────────────────────────

// Airy 1830 ellipsoid (used by OSGB36)
const AIRY_A  = 6377563.396;   // semi-major axis
const AIRY_B  = 6356256.909;   // semi-minor axis
const AIRY_E2 = 1 - (AIRY_B * AIRY_B) / (AIRY_A * AIRY_A);

// GRS80 / WGS84 ellipsoid
const WGS_A  = 6378137.0;
const WGS_B  = 6356752.3141;
const WGS_E2 = 1 - (WGS_B * WGS_B) / (WGS_A * WGS_A);

// National Grid Transverse Mercator projection
const N0 = -100000;           // northing of true origin
const E0 = 400000;            // easting of true origin
const F0 = 0.9996012717;      // scale factor on central meridian
const PHI0 = 49 * Math.PI / 180;  // latitude of true origin (49°N)
const LAM0 = -2 * Math.PI / 180;  // longitude of true origin (2°W)

// Helmert transformation parameters (OSGB36 -> WGS84)
// Position vector (Bursa-Wolf) convention, matching PROJ +towgs84 string
// Source: Ordnance Survey, standard EPSG:27700 definition
const TX = 446.448, TY = -125.157, TZ = 542.060;   // translations (m)
const RX = 0.1502 * Math.PI / (180 * 3600);          // rotations (rad)
const RY = 0.2470 * Math.PI / (180 * 3600);
const RZ = 0.8421 * Math.PI / (180 * 3600);
const S1 = 1 + (-20.4894e-6);                        // scale factor

// Inverse Helmert (WGS84 -> OSGB36) — negate translations & rotations
const ITX = -TX, ITY = -TY, ITZ = -TZ;
const IRX = -RX, IRY = -RY, IRZ = -RZ;
const IS1 = 1 / S1;

// ─── OS Grid Letter Lookup ───────────────────────────────────
const GRID_LETTERS: Record<string, [number, number]> = {};
const L1 = "VWXYZ".split("").reverse();   // rows from S
const L2 = "ABCDEFGHJKLMNOPQRSTUVWXYZ".split("").filter(c => c !== "I");

// Build lookup: first letter = 500km square, second = 100km square
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 5; j++) {
    const e500 = j * 500000 - 1000000;
    const n500 = i * 500000 - 500000;
    for (let ii = 0; ii < 5; ii++) {
      for (let jj = 0; jj < 5; jj++) {
        const letters = L1[i] + "ABCDEFGHJKLMNOPQRSTUVWXYZ".split("").filter(c => c !== "I")[ii * 5 + jj];
        // Wait, let me redo this properly
        void letters; // discard
      }
    }
  }
}

// Simpler approach — build the standard OS grid letter pairs
function buildGridLetters() {
  // The National Grid uses two letters. The first divides into 500km squares,
  // the second into 100km squares within the 500km square.
  // Grid origin is at 0,0 (southwest corner of grid square SV)
  // Letters go A-Z (no I) in rows of 5, bottom-left to top-right
  const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ"; // no I
  // First letter grid (500km): columns 0-4 from W, rows 0-4 from S
  // S=0, N=1, H=2 for the rows that cover GB; T=0, O=1, J=2 for cols? 
  // Actually the standard approach:
  // The grid is indexed from a false origin at (E: -1,000,000, N: -500,000)
  // Each 500km square has a letter, each 100km sub-square has a second letter
  
  // Pre-computed standard pairs used in GB:
  const pairs: Record<string, [number, number]> = {
    SV: [0, 0], SW: [100000, 0], SX: [200000, 0], SY: [300000, 0], SZ: [400000, 0],
    TV: [500000, 0], TW: [600000, 0],
    SR: [100000, 100000], SS: [200000, 100000], ST: [300000, 100000], SU: [400000, 100000],
    TQ: [500000, 100000], TR: [600000, 100000],
    SM: [100000, 200000], SN: [200000, 200000], SO: [300000, 200000], SP: [400000, 200000],
    TL: [500000, 200000], TM: [600000, 200000],
    SH: [100000, 300000], SJ: [200000, 300000], SK: [300000, 300000],
    TF: [400000, 300000], TG: [500000, 300000],
    SC: [100000, 400000], SD: [200000, 400000], SE: [300000, 400000],
    TA: [400000, 400000],
    NW: [100000, 500000], NX: [200000, 500000], NY: [300000, 500000], NZ: [400000, 500000],
    OV: [500000, 500000],
    NR: [100000, 600000], NS: [200000, 600000], NT: [300000, 600000], NU: [400000, 600000],
    NM: [100000, 700000], NN: [200000, 700000], NO: [300000, 700000],
    NH: [100000, 800000], NJ: [200000, 800000], NK: [300000, 800000],
    NC: [100000, 900000], ND: [200000, 900000],
    NA: [0, 900000], NB: [100000, 900000],
    HW: [100000, 1000000], HX: [200000, 1000000], HY: [300000, 1000000], HZ: [400000, 1000000],
    HP: [400000, 1200000], HT: [300000, 1100000], HU: [400000, 1100000],
  };
  // Fix NA/NB/NC/ND
  pairs["NA"] = [0, 900000];
  pairs["NB"] = [100000, 900000];
  pairs["NC"] = [100000, 900000]; // already set above, overwrite:
  // Let me just use the algorithmic approach
  return pairs;
}

// Algorithmic grid letter decode
function gridLetterToEN(letters: string): [number, number] | null {
  if (letters.length !== 2) return null;
  const l1 = letters[0].toUpperCase();
  const l2 = letters[1].toUpperCase();
  
  // OS National Grid skips the letter 'I' in both positions. Returning -1
  // for any input containing 'I' causes gridLetterToEN to return null below.
  // (Bug fix: previously letterIndex returned 8 for both 'I' and 'J', so any
  //  reference like "IA" would silently decode as the "JA" grid square.)
  const letterIndex = (c: string): number => {
    if (c === "I") return -1;                      // reject 'I'
    const code = c.charCodeAt(0) - 65;             // A=0
    if (code < 0 || code > 25) return -1;          // only A-Z valid
    return code > 8 ? code - 1 : code;             // skip I in indexing
  };
  
  const i1 = letterIndex(l1);
  const i2 = letterIndex(l2);
  if (i1 < 0 || i1 > 24 || i2 < 0 || i2 > 24) return null;
  
  // First letter: 500km grid from false origin
  const col1 = i1 % 5;
  const row1 = 4 - Math.floor(i1 / 5);
  // Second letter: 100km grid within 500km square
  const col2 = i2 % 5;
  const row2 = 4 - Math.floor(i2 / 5);
  
  const easting = (col1 * 5 + col2) * 100000 - 1000000;
  const northing = (row1 * 5 + row2) * 100000 - 500000;
  
  return [easting, northing];
}

// Reverse: E/N to grid letters
function enToGridLetters(e: number, n: number): string | null {
  const e100 = Math.floor(e / 100000);
  const n100 = Math.floor(n / 100000);
  
  // Offset from false origin
  const eIdx = e100 + 10; // +1000000/100000
  const nIdx = n100 + 5;  // +500000/100000
  
  if (eIdx < 0 || eIdx > 24 || nIdx < 0 || nIdx > 24) return null;
  
  const col1 = Math.floor(eIdx / 5);
  const row1 = Math.floor(nIdx / 5);
  const col2 = eIdx % 5;
  const row2 = nIdx % 5;
  
  const indexToLetter = (col: number, row: number): string => {
    const idx = (4 - row) * 5 + col;
    return idx >= 8 ? String.fromCharCode(66 + idx) : String.fromCharCode(65 + idx);
  };
  
  return indexToLetter(col1, row1) + indexToLetter(col2, row2);
}

// ─── Transverse Mercator: E/N -> Lat/Lon on Airy ────────────
function enToLatLonAiry(E: number, N: number): [number, number] {
  const a = AIRY_A, b = AIRY_B, e2 = AIRY_E2;
  const n = (a - b) / (a + b);
  const n2 = n * n, n3 = n * n2;
  
  // Iterate to find phi'
  let phi = PHI0;
  let M = 0;
  do {
    phi = (N - N0 - M) / (a * F0) + phi;
    const dphi = phi - PHI0;
    M = b * F0 * (
      (1 + n + 1.25 * n2 + 1.25 * n3) * dphi
      - (3 * n + 3 * n2 + 21 / 8 * n3) * Math.sin(dphi) * Math.cos(phi + PHI0)
      + (15 / 8 * n2 + 15 / 8 * n3) * Math.sin(2 * dphi) * Math.cos(2 * (phi + PHI0))
      - (35 / 24 * n3) * Math.sin(3 * dphi) * Math.cos(3 * (phi + PHI0))
    );
  } while (Math.abs(N - N0 - M) >= 0.00001);
  
  const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);
  const nu = a * F0 / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;
  
  const tan2 = tanPhi * tanPhi;
  const tan4 = tan2 * tan2;
  const tan6 = tan4 * tan2;
  const sec = 1 / cosPhi;
  const nu3 = nu * nu * nu;
  const nu5 = nu3 * nu * nu;
  const nu7 = nu5 * nu * nu;
  
  const VII  = tanPhi / (2 * rho * nu);
  const VIII = tanPhi / (24 * rho * nu3) * (5 + 3 * tan2 + eta2 - 9 * tan2 * eta2);
  const IX   = tanPhi / (720 * rho * nu5) * (61 + 90 * tan2 + 45 * tan4);
  const X    = sec / nu;
  const XI   = sec / (6 * nu3) * (nu / rho + 2 * tan2);
  const XII  = sec / (120 * nu5) * (5 + 28 * tan2 + 24 * tan4);
  const XIIA = sec / (5040 * nu7) * (61 + 662 * tan2 + 1320 * tan4 + 720 * tan6);
  
  const dE = E - E0;
  const dE2 = dE * dE;
  
  const lat = phi - VII * dE2 + VIII * dE2 * dE2 - IX * dE2 * dE2 * dE2;
  const lon = LAM0 + X * dE - XI * dE * dE2 + XII * dE * dE2 * dE2 - XIIA * dE * dE2 * dE2 * dE2;
  
  return [lat, lon]; // radians
}

// ─── Transverse Mercator: Lat/Lon on Airy -> E/N ────────────
function latLonAiryToEN(latRad: number, lonRad: number): [number, number] {
  const a = AIRY_A, b = AIRY_B, e2 = AIRY_E2;
  const n = (a - b) / (a + b);
  const n2 = n * n, n3 = n * n2;
  
  const phi = latRad, lam = lonRad;
  const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);
  const cos3 = cosPhi * cosPhi * cosPhi;
  const cos5 = cos3 * cosPhi * cosPhi;
  const tan2 = tanPhi * tanPhi;
  const tan4 = tan2 * tan2;
  
  const nu = a * F0 / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;
  
  const dphi = phi - PHI0;
  const M = b * F0 * (
    (1 + n + 1.25 * n2 + 1.25 * n3) * dphi
    - (3 * n + 3 * n2 + 21 / 8 * n3) * Math.sin(dphi) * Math.cos(phi + PHI0)
    + (15 / 8 * n2 + 15 / 8 * n3) * Math.sin(2 * dphi) * Math.cos(2 * (phi + PHI0))
    - (35 / 24 * n3) * Math.sin(3 * dphi) * Math.cos(3 * (phi + PHI0))
  );
  
  const I    = M + N0;
  const II   = nu / 2 * sinPhi * cosPhi;
  const III  = nu / 24 * sinPhi * cos3 * (5 - tan2 + 9 * eta2);
  const IIIA = nu / 720 * sinPhi * cos5 * (61 - 58 * tan2 + tan4);
  const IV   = nu * cosPhi;
  const V    = nu / 6 * cos3 * (nu / rho - tan2);
  const VI   = nu / 120 * cos5 * (5 - 18 * tan2 + tan4 + 14 * eta2 - 58 * tan2 * eta2);
  
  const dLam = lam - LAM0;
  const dLam2 = dLam * dLam;
  
  const N2 = I + II * dLam2 + III * dLam2 * dLam2 + IIIA * dLam2 * dLam2 * dLam2;
  const E2 = E0 + IV * dLam + V * dLam * dLam2 + VI * dLam * dLam2 * dLam2;
  
  return [E2, N2];
}

// ─── Helmert 3D Transformation ───────────────────────────────
function geographicToCartesian(lat: number, lon: number, a: number, e2: number): [number, number, number] {
  const sinLat = Math.sin(lat), cosLat = Math.cos(lat);
  const sinLon = Math.sin(lon), cosLon = Math.cos(lon);
  const nu = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  return [
    nu * cosLat * cosLon,
    nu * cosLat * sinLon,
    nu * (1 - e2) * sinLat,
  ];
}

function cartesianToGeographic(x: number, y: number, z: number, a: number, e2: number): [number, number] {
  const b2 = a * a * (1 - e2);
  const bv = Math.sqrt(b2);
  const p = Math.sqrt(x * x + y * y);
  let lat = Math.atan2(z, p * (1 - e2));
  
  for (let i = 0; i < 20; i++) {
    const sinLat = Math.sin(lat);
    const nu = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    const newLat = Math.atan2(z + e2 * nu * sinLat, p);
    if (Math.abs(newLat - lat) < 1e-15) break;
    lat = newLat;
  }
  
  const lon = Math.atan2(y, x);
  return [lat, lon];
}

function helmertTransform(
  x: number, y: number, z: number,
  tx: number, ty: number, tz: number,
  rx: number, ry: number, rz: number,
  s: number
): [number, number, number] {
  return [
    tx + s * (x - rz * y + ry * z),
    ty + s * (rz * x + y - rx * z),
    tz + s * (-ry * x + rx * y + z),
  ];
}

// ─── Public Conversion Functions ─────────────────────────────

/** Convert OS Grid E/N to WGS84 lat/lon (decimal degrees) */
export function osGridToLatLon(easting: number, northing: number): [number, number] {
  // Step 1: E/N -> Lat/Lon on Airy 1830 (OSGB36)
  const [latRad, lonRad] = enToLatLonAiry(easting, northing);
  
  // Step 2: Geographic -> Cartesian (Airy)
  const [x, y, z] = geographicToCartesian(latRad, lonRad, AIRY_A, AIRY_E2);
  
  // Step 3: Helmert OSGB36 -> WGS84
  const [wx, wy, wz] = helmertTransform(x, y, z, TX, TY, TZ, RX, RY, RZ, S1);
  
  // Step 4: Cartesian -> Geographic (WGS84)
  const [wLat, wLon] = cartesianToGeographic(wx, wy, wz, WGS_A, WGS_E2);
  
  return [wLat * 180 / Math.PI, wLon * 180 / Math.PI];
}

/** Convert WGS84 lat/lon (decimal degrees) to OS Grid E/N */
export function latLonToOsGrid(latDeg: number, lonDeg: number): [number, number] {
  const latRad = latDeg * Math.PI / 180;
  const lonRad = lonDeg * Math.PI / 180;
  
  // Step 1: Geographic -> Cartesian (WGS84)
  const [x, y, z] = geographicToCartesian(latRad, lonRad, WGS_A, WGS_E2);
  
  // Step 2: Helmert WGS84 -> OSGB36
  const [ox, oy, oz] = helmertTransform(x, y, z, ITX, ITY, ITZ, IRX, IRY, IRZ, IS1);
  
  // Step 3: Cartesian -> Geographic (Airy)
  const [oLat, oLon] = cartesianToGeographic(ox, oy, oz, AIRY_A, AIRY_E2);
  
  // Step 4: Lat/Lon on Airy -> E/N
  return latLonAiryToEN(oLat, oLon);
}

// ─── Formatting Helpers ──────────────────────────────────────

export function decToDMS(dec: number, isLat: boolean): string {
  const sign = dec < 0 ? -1 : 1;
  const abs = Math.abs(dec);
  const d = Math.floor(abs);
  const mFull = (abs - d) * 60;
  const m = Math.floor(mFull);
  const s = ((mFull - m) * 60).toFixed(2);
  const dir = isLat ? (sign >= 0 ? "N" : "S") : (sign >= 0 ? "E" : "W");
  return `${d}\u00B0${String(m).padStart(2, "0")}'${String(s).padStart(5, "0")}"${dir}`;
}

export function dmsToDecimal(dms: string): number | null {
  // Accepts: 53°28'51"N, 53 28 51 N, 53-28-51N, etc.
  const cleaned = dms.trim().toUpperCase();
  const match = cleaned.match(/^(-?\d+)[°\s-]+(\d+)['\s-]+(\d+\.?\d*)["\s]*([NSEW]?)$/);
  if (!match) return null;
  
  const d = parseFloat(match[1]);
  const m = parseFloat(match[2]);
  const s = parseFloat(match[3]);
  const dir = match[4];
  
  let dec = Math.abs(d) + m / 60 + s / 3600;
  if (dir === "S" || dir === "W" || d < 0) dec = -dec;
  return dec;
}

export function formatGridRef(easting: number, northing: number, precision: Precision): string {
  const letters = enToGridLetters(easting, northing);
  if (!letters) return `E: ${Math.round(easting)}, N: ${Math.round(northing)}`;
  
  const e100 = Math.floor(easting / 100000) * 100000;
  const n100 = Math.floor(northing / 100000) * 100000;
  const eRem = easting - e100;
  const nRem = northing - n100;
  
  switch (precision) {
    case "10m": {
      const eStr = String(Math.floor(eRem / 10)).padStart(4, "0");
      const nStr = String(Math.floor(nRem / 10)).padStart(4, "0");
      return `${letters} ${eStr} ${nStr}`;
    }
    case "1m": {
      const eStr = String(Math.floor(eRem)).padStart(5, "0");
      const nStr = String(Math.floor(nRem)).padStart(5, "0");
      return `${letters} ${eStr} ${nStr}`;
    }
    case "0.1m": {
      const eStr = (eRem).toFixed(1).replace(".", "").padStart(6, "0");
      const nStr = (nRem).toFixed(1).replace(".", "").padStart(6, "0");
      return `${letters} ${eStr} ${nStr}`;
    }
  }
}

// ─── Input Parsing ───────────────────────────────────────────

export function parseGridRef(input: string): { easting: number; northing: number } | null {
  const s = input.trim().toUpperCase().replace(/,/g, "");
  
  // Try "E: 351234, N: 367890" or "351234 367890" (full numeric)
  const numMatch = s.match(/^E?\s*:?\s*(\d{5,7})\s*[,\s]\s*N?\s*:?\s*(\d{5,7})$/);
  if (numMatch) {
    return { easting: parseFloat(numMatch[1]), northing: parseFloat(numMatch[2]) };
  }
  
  // Try letter prefix: "SJ 1234 5678", "SJ12345678", "SJ 12345 67890"
  const letterMatch = s.match(/^([A-Z]{2})\s*(\d+)\s*(\d+)?$/);
  if (letterMatch) {
    const letters = letterMatch[1];
    const origin = gridLetterToEN(letters);
    if (!origin) return null;
    
    let eDigits: string, nDigits: string;
    if (letterMatch[3]) {
      // Two separate number groups
      eDigits = letterMatch[2];
      nDigits = letterMatch[3];
    } else {
      // Single block — split in half
      const digits = letterMatch[2];
      if (digits.length % 2 !== 0) return null;
      const half = digits.length / 2;
      eDigits = digits.slice(0, half);
      nDigits = digits.slice(half);
    }
    
    // Pad to 5 digits (1m precision) by adding trailing zeros
    const padTo5 = (d: string) => {
      if (d.length > 5) {
        // Sub-metre precision: treat as metres with decimal
        return parseFloat(d.slice(0, 5) + "." + d.slice(5));
      }
      return parseFloat(d.padEnd(5, "0"));
    };
    
    return {
      easting: origin[0] + padTo5(eDigits),
      northing: origin[1] + padTo5(nDigits),
    };
  }
  
  return null;
}

export function parseLatLon(input: string): { lat: number; lon: number } | null {
  const s = input.trim();
  
  // Try DMS: "53°28'51"N, 2°14'33"W" or "53°28'51"N 2°14'33"W"
  const dmsMatch = s.match(/(-?\d+[°\s-]+\d+['\s-]+\d+\.?\d*["\s]*[NSEW]?)\s*[,\s]\s*(-?\d+[°\s-]+\d+['\s-]+\d+\.?\d*["\s]*[NSEW]?)/i);
  if (dmsMatch) {
    const lat = dmsToDecimal(dmsMatch[1]);
    const lon = dmsToDecimal(dmsMatch[2]);
    if (lat !== null && lon !== null) return { lat, lon };
  }
  
  // Try decimal: "53.4808, -2.2426" or "53.4808 -2.2426"
  const decMatch = s.match(/^(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)$/);
  if (decMatch) {
    return { lat: parseFloat(decMatch[1]), lon: parseFloat(decMatch[2]) };
  }
  
  return null;
}

// ─── Main Conversion ─────────────────────────────────────────

export function convertFromGrid(easting: number, northing: number, precision: Precision): ConversionResult {
  if (easting < 0 || easting > 700000 || northing < 0 || northing > 1300000) {
    return { gridRef: "", easting, northing, latDec: 0, lonDec: 0, latDMS: "", lonDMS: "", gridLetters: "", valid: false, error: "Coordinates outside the UK National Grid", method: "Helmert 7-parameter" };
  }
  
  const [lat, lon] = osGridToLatLon(easting, northing);
  const letters = enToGridLetters(easting, northing) || "";
  
  return {
    gridRef: formatGridRef(easting, northing, precision),
    easting: Math.round(easting * 10) / 10,
    northing: Math.round(northing * 10) / 10,
    latDec: Math.round(lat * 1e8) / 1e8,
    lonDec: Math.round(lon * 1e8) / 1e8,
    latDMS: decToDMS(lat, true),
    lonDMS: decToDMS(lon, false),
    gridLetters: letters,
    valid: true,
    method: "Helmert 7-parameter (~5m accuracy)",
  };
}

export function convertFromLatLon(lat: number, lon: number, precision: Precision): ConversionResult {
  if (lat < 49 || lat > 61 || lon < -8 || lon > 2) {
    return { gridRef: "", easting: 0, northing: 0, latDec: lat, lonDec: lon, latDMS: "", lonDMS: "", gridLetters: "", valid: false, error: "Coordinates outside the UK coverage area", method: "Helmert 7-parameter" };
  }
  
  const [easting, northing] = latLonToOsGrid(lat, lon);
  const letters = enToGridLetters(easting, northing) || "";
  
  return {
    gridRef: formatGridRef(easting, northing, precision),
    easting: Math.round(easting * 10) / 10,
    northing: Math.round(northing * 10) / 10,
    latDec: Math.round(lat * 1e8) / 1e8,
    lonDec: Math.round(lon * 1e8) / 1e8,
    latDMS: decToDMS(lat, true),
    lonDMS: decToDMS(lon, false),
    gridLetters: letters,
    valid: true,
    method: "Helmert 7-parameter (~5m accuracy)",
  };
}

// ─── UK Outline SVG Path (simplified) ────────────────────────
// Approximate bounding box: lat 49.9-58.7, lon -6.4 to 1.8
export const UK_BOUNDS = { minLat: 49.9, maxLat: 58.7, minLon: -6.4, maxLon: 1.8 };

// Simplified UK outline as SVG polygon points (lat/lon pairs projected to simple equirectangular)
// This is a very simplified outline for visual sanity check only
export const UK_OUTLINE = "M 148,10 L 155,15 160,12 165,20 170,18 175,25 180,30 178,40 185,50 190,55 195,58 198,65 195,75 200,85 195,95 190,100 185,110 180,115 175,120 178,130 185,140 190,150 195,155 200,165 205,175 200,185 195,195 185,200 175,210 165,215 155,225 150,235 145,240 135,245 125,250 118,255 110,260 100,265 95,270 85,275 80,280 75,288 70,293 65,298 58,305 50,310 45,320 38,328 30,335 25,340 20,348 18,355 15,360 12,365 10,370 15,375 20,378 30,380 40,375 50,370 55,365 60,355 65,348 75,340 85,335 90,328 100,320 110,315 115,308 120,300 128,295 135,290 140,280 148,270 155,260 160,250 165,240 168,230 172,220 175,210 180,200 185,190 188,180 190,170 185,160 180,150 178,140 175,130 170,120 168,110 165,100 160,90 155,80 150,70 148,60 145,50 142,40 140,30 142,20 148,10 Z";

// Better approach: just draw approximate outline from key coastal points
export const UK_COAST_POINTS: [number, number][] = [
  // Start SW England, go clockwise
  [50.07, -5.71], [50.27, -5.05], [50.55, -4.19], [50.37, -3.53], [50.62, -2.46],
  [50.72, -1.31], [50.77, -0.77], [50.87, 0.27], [51.10, 1.09], [51.38, 1.42],
  [51.95, 1.46], [52.49, 1.73], [52.94, 1.30], [53.09, 0.34], [53.55, 0.08],
  [53.74, -0.07], [54.09, -0.17], [54.50, -0.61], [54.64, -1.17], [55.00, -1.44],
  [55.38, -1.56], [55.77, -1.98], [56.33, -2.59], [56.71, -2.07], [57.14, -2.06],
  [57.48, -1.77], [57.69, -3.38], [58.44, -3.10], [58.60, -5.03], [57.81, -5.27],
  [57.47, -5.65], [56.77, -5.65], [56.45, -5.40], [55.88, -5.78], [55.43, -5.60],
  [54.97, -5.15], [54.63, -4.88], [54.33, -4.37], [54.05, -3.20], [53.83, -3.05],
  [53.35, -3.11], [53.23, -3.13], [53.25, -4.38], [53.10, -4.57], [52.73, -4.08],
  [52.13, -4.69], [51.88, -5.24], [51.68, -4.96], [51.58, -3.77], [51.38, -3.20],
  [51.18, -3.64], [51.20, -4.18], [51.00, -4.21], [50.83, -4.55], [50.34, -4.76],
  [50.07, -5.71],
];
