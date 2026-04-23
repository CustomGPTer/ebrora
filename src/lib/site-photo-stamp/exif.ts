// src/lib/site-photo-stamp/exif.ts
//
// Minimal zero-dependency EXIF reader.
//
// We only extract the three fields that matter for Site Photo Stamp:
//   • DateTimeOriginal  (EXIF IFD tag 0x9003) — when the photo was taken
//   • Orientation       (IFD0 tag 0x0112)     — so we can rotate to upright
//   • GPS lat/lon       (GPS IFD tags 0x0001–0x0004) — original location
//
// Supports JPEG only. Other formats return `{}`.
//
// Format reference: https://exiftool.org/TagNames/EXIF.html
//                   https://www.media.mit.edu/pia/Research/deepview/exif.html

export interface ExifData {
  /** ISO 8601 timestamp derived from DateTimeOriginal, or undefined. */
  timestamp?: string;
  /** EXIF orientation code (1–8). 1 = upright. Undefined if missing. */
  orientation?: number;
  /** Decimal degrees. Undefined if no GPS tags. */
  latitude?: number;
  /** Decimal degrees. Undefined if no GPS tags. */
  longitude?: number;
}

// ─── Entry ──────────────────────────────────────────────────────

export async function readExif(file: File | Blob): Promise<ExifData> {
  try {
    if (file.type && !/jpe?g/i.test(file.type)) return {};
    // Most cameras put EXIF inside the first 256KB. Read a generous slice
    // rather than the whole file to keep this fast on large originals.
    const maxRead = Math.min(file.size, 512 * 1024);
    const buffer = await file.slice(0, maxRead).arrayBuffer();
    return parseJpegExif(buffer);
  } catch {
    return {};
  }
}

// ─── JPEG segment walker ────────────────────────────────────────

function parseJpegExif(buffer: ArrayBuffer): ExifData {
  const view = new DataView(buffer);
  // JPEG must start with FFD8.
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;
    // All markers begin with 0xFF; some are standalone (no length), most have
    // a big-endian length field following the marker.
    if ((marker & 0xff00) !== 0xff00) return {};

    // Standalone markers without length (SOI/EOI/RSTn/TEM).
    if (marker === 0xffd9 || marker === 0xffda) return {}; // SOS or EOI — EXIF not found

    const size = view.getUint16(offset);
    offset += 2;

    // APP1 with "Exif\0\0" signature.
    if (marker === 0xffe1 && offset + 6 <= view.byteLength) {
      const sig =
        String.fromCharCode(view.getUint8(offset)) +
        String.fromCharCode(view.getUint8(offset + 1)) +
        String.fromCharCode(view.getUint8(offset + 2)) +
        String.fromCharCode(view.getUint8(offset + 3));
      if (sig === "Exif") {
        return parseTiffBlock(buffer, offset + 6);
      }
    }

    offset += size - 2;
  }
  return {};
}

// ─── TIFF (inside APP1) parser ──────────────────────────────────

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  valueOffset: number;
}

function parseTiffBlock(buffer: ArrayBuffer, tiffStart: number): ExifData {
  const view = new DataView(buffer);
  if (tiffStart + 8 > view.byteLength) return {};

  const endian = view.getUint16(tiffStart);
  const little = endian === 0x4949; // "II"
  if (!little && endian !== 0x4d4d) return {};

  // 0x002A magic follows endianness marker.
  const magic = view.getUint16(tiffStart + 2, little);
  if (magic !== 0x002a) return {};

  const ifd0Offset = view.getUint32(tiffStart + 4, little);

  const out: ExifData = {};

  const ifd0 = readIfd(view, tiffStart, tiffStart + ifd0Offset, little);
  for (const e of ifd0.entries) {
    if (e.tag === 0x0112) {
      // Orientation — single SHORT
      out.orientation = readShort(view, e.valueOffset, little);
    }
  }

  // Find the EXIF IFD pointer (tag 0x8769 in IFD0).
  const exifIfdPtr = ifd0.entries.find((e) => e.tag === 0x8769);
  if (exifIfdPtr) {
    const exifIfd = readIfd(view, tiffStart, tiffStart + exifIfdPtr.valueOffset, little);
    for (const e of exifIfd.entries) {
      if (e.tag === 0x9003) {
        const s = readAsciiValue(view, tiffStart, e, little);
        const iso = parseExifDate(s);
        if (iso) out.timestamp = iso;
      }
    }
  }

  // GPS IFD pointer is tag 0x8825 in IFD0.
  const gpsIfdPtr = ifd0.entries.find((e) => e.tag === 0x8825);
  if (gpsIfdPtr) {
    const gpsIfd = readIfd(view, tiffStart, tiffStart + gpsIfdPtr.valueOffset, little);
    const gps = parseGps(view, tiffStart, gpsIfd.entries, little);
    if (gps) {
      out.latitude = gps.lat;
      out.longitude = gps.lon;
    }
  }

  return out;
}

// ─── IFD helpers ────────────────────────────────────────────────

function readIfd(view: DataView, tiffStart: number, ifdOffset: number, little: boolean) {
  const entries: IfdEntry[] = [];
  if (ifdOffset + 2 > view.byteLength) return { entries };
  const count = view.getUint16(ifdOffset, little);
  const entrySize = 12;
  for (let i = 0; i < count; i++) {
    const entryOffset = ifdOffset + 2 + i * entrySize;
    if (entryOffset + entrySize > view.byteLength) break;
    const tag = view.getUint16(entryOffset, little);
    const type = view.getUint16(entryOffset + 2, little);
    const c = view.getUint32(entryOffset + 4, little);
    const valueOffset = view.getUint32(entryOffset + 8, little);
    entries.push({ tag, type, count: c, valueOffset });
  }
  // The raw valueOffset for small types is the inline value itself, not a
  // pointer — so we leave it to consumers to interpret.
  return { entries };
}

function readShort(view: DataView, value: number, little: boolean): number {
  // Inline SHORT — the low 2 bytes of the 4-byte "value offset" field.
  // (DataView read treats the value as stored at the raw entry offset,
  // but since we captured `valueOffset` as a uint32, we need to shift.)
  if (little) return value & 0xffff;
  return (value >>> 16) & 0xffff;
}

function readAsciiValue(
  view: DataView,
  tiffStart: number,
  entry: IfdEntry,
  _little: boolean
): string {
  // For ASCII, count = number of bytes including final null.
  if (entry.count <= 4) {
    // Value is stored inline in the 4-byte field.
    // Rebuild the raw bytes from valueOffset respecting endianness is
    // awkward; safer to peek at the 4 raw bytes at the entry's value field.
    // We re-derive by reading uint8s at the right offset; but valueOffset
    // already holds the uint32 value. Bytes are in little-endian if
    // 'little' is true. For readability use bit ops:
    return "";
  }
  const start = tiffStart + entry.valueOffset;
  let out = "";
  for (let i = 0; i < entry.count - 1 && start + i < view.byteLength; i++) {
    const c = view.getUint8(start + i);
    if (c === 0) break;
    out += String.fromCharCode(c);
  }
  return out;
}

// ─── Date parsing ───────────────────────────────────────────────

function parseExifDate(s: string): string | null {
  // EXIF format: "YYYY:MM:DD HH:MM:SS"
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  // Treat as local time (EXIF has no timezone). Use local-ISO form.
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(se)
  );
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

// ─── GPS parsing ────────────────────────────────────────────────

function parseGps(
  view: DataView,
  tiffStart: number,
  entries: IfdEntry[],
  little: boolean
): { lat: number; lon: number } | null {
  const getEntry = (tag: number) => entries.find((e) => e.tag === tag);

  const latRefEntry = getEntry(0x0001);
  const latEntry = getEntry(0x0002);
  const lonRefEntry = getEntry(0x0003);
  const lonEntry = getEntry(0x0004);
  if (!latRefEntry || !latEntry || !lonRefEntry || !lonEntry) return null;

  const latRef = readGpsRef(latRefEntry, little);
  const lonRef = readGpsRef(lonRefEntry, little);

  const lat = readGpsCoord(view, tiffStart, latEntry, little);
  const lon = readGpsCoord(view, tiffStart, lonEntry, little);
  if (lat == null || lon == null) return null;

  return {
    lat: latRef === "S" ? -lat : lat,
    lon: lonRef === "W" ? -lon : lon,
  };
}

function readGpsRef(entry: IfdEntry, little: boolean): string {
  // ASCII type, count usually 2 (letter + null). Value is inline.
  const byte = little ? entry.valueOffset & 0xff : (entry.valueOffset >>> 24) & 0xff;
  return String.fromCharCode(byte).toUpperCase();
}

function readGpsCoord(
  view: DataView,
  tiffStart: number,
  entry: IfdEntry,
  little: boolean
): number | null {
  // GPS coord is 3 RATIONALs (deg, min, sec). RATIONAL = 8 bytes = 2×uint32.
  const start = tiffStart + entry.valueOffset;
  if (start + 24 > view.byteLength) return null;
  const read = (i: number) => {
    const num = view.getUint32(start + i * 8, little);
    const den = view.getUint32(start + i * 8 + 4, little);
    return den === 0 ? 0 : num / den;
  };
  const deg = read(0);
  const min = read(1);
  const sec = read(2);
  return deg + min / 60 + sec / 3600;
}
