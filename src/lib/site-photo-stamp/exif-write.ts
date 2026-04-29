// src/lib/site-photo-stamp/exif-write.ts
//
// Zero-dependency EXIF writer.
//
// The capture pipeline downscales every photo through a canvas, which
// strips all EXIF — Samsung Gallery / Google Photos then can't pin the
// saved file on a map or sort it chronologically with the rest of the
// camera roll. This module rebuilds a minimal EXIF block and splices it
// into the final stamped JPEG so it behaves like a normal camera photo.
//
// We write only what we have on hand from our own resolved metadata —
// no device fingerprinting (no Make / Model / serial / ISO carry-through):
//
//   IFD0
//     0x0112 Orientation         SHORT       1   (pixels are baked upright)
//     0x0131 Software            ASCII       "Ebrora Site Photo Stamp"
//     0x0132 DateTime            ASCII       "YYYY:MM:DD HH:MM:SS"
//     0x8769 ExifIFDPointer      LONG        offset to ExifIFD
//     0x8825 GPSInfoIFDPointer   LONG        offset to GPS IFD (when present)
//   ExifIFD
//     0x9000 ExifVersion         UNDEFINED   "0230"
//     0x9003 DateTimeOriginal    ASCII       "YYYY:MM:DD HH:MM:SS"
//     0x9004 DateTimeDigitized   ASCII       "YYYY:MM:DD HH:MM:SS"
//   GPS IFD (only when lat/lon are present)
//     0x0000 GPSVersionID        BYTE[4]     2,3,0,0
//     0x0001 GPSLatitudeRef      ASCII       "N" / "S"
//     0x0002 GPSLatitude         RATIONAL[3] deg, min, sec (sec × 10000)
//     0x0003 GPSLongitudeRef     ASCII       "E" / "W"
//     0x0004 GPSLongitude        RATIONAL[3] deg, min, sec (sec × 10000)
//
// Format reference: https://exiftool.org/TagNames/EXIF.html

const SOFTWARE_TAG = "Ebrora Site Photo Stamp";

export interface ExifInjectMeta {
  /** ISO 8601 timestamp (e.g. "2026-04-29T11:22:00.000Z"). */
  timestamp: string;
  /** Decimal latitude. Omitted = no GPS IFD written. */
  lat?: number;
  /** Decimal longitude. Omitted = no GPS IFD written. */
  lon?: number;
}

/**
 * Inject EXIF metadata into a JPEG blob. Strips any pre-existing APP1
 * EXIF segment and inserts a fresh one immediately after the SOI marker.
 */
export async function injectExif(jpegBlob: Blob, meta: ExifInjectMeta): Promise<Blob> {
  const original = new Uint8Array(await jpegBlob.arrayBuffer());

  // Sanity check — must be a JPEG (FFD8).
  if (original.length < 4 || original[0] !== 0xff || original[1] !== 0xd8) {
    return jpegBlob; // Not a JPEG; bail without modifying.
  }

  // Strip any existing APP1 EXIF segments so we don't duplicate.
  const stripped = stripExifSegments(original);

  // Build the new APP1 EXIF segment.
  const app1 = buildExifApp1(meta);

  // Splice: SOI (2 bytes) + new APP1 + remainder of stripped.
  const out = new Uint8Array(2 + app1.length + (stripped.length - 2));
  out.set(stripped.subarray(0, 2), 0);
  out.set(app1, 2);
  out.set(stripped.subarray(2), 2 + app1.length);

  return new Blob([out], { type: "image/jpeg" });
}

// ─── JPEG segment editing ─────────────────────────────────────

/**
 * Walk the JPEG segments and return a copy with any APP1 EXIF
 * segments removed. Other APPn segments (JFIF, ICC profile, etc) are
 * preserved untouched.
 */
function stripExifSegments(buf: Uint8Array): Uint8Array {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const keep: Array<[number, number]> = []; // [startInclusive, endExclusive]
  let i = 0;

  // SOI
  keep.push([0, 2]);
  i = 2;

  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) break; // Malformed — bail and keep the rest.
    const marker = (buf[i] << 8) | buf[i + 1];

    // Start of Scan / End of Image — entropy-coded data follows;
    // pass everything through untouched from here.
    if (marker === 0xffda || marker === 0xffd9) {
      keep.push([i, buf.length]);
      i = buf.length;
      break;
    }

    // Standalone markers without length payload (RST0–RST7, TEM).
    if (marker === 0xff01 || (marker >= 0xffd0 && marker <= 0xffd7)) {
      keep.push([i, i + 2]);
      i += 2;
      continue;
    }

    if (i + 4 > buf.length) break;
    const size = view.getUint16(i + 2);
    const segEnd = i + 2 + size;
    if (segEnd > buf.length) break;

    const isApp1Exif =
      marker === 0xffe1 &&
      i + 10 <= buf.length &&
      buf[i + 4] === 0x45 && // 'E'
      buf[i + 5] === 0x78 && // 'x'
      buf[i + 6] === 0x69 && // 'i'
      buf[i + 7] === 0x66;   // 'f'

    if (!isApp1Exif) {
      keep.push([i, segEnd]);
    }
    i = segEnd;
  }

  // If we ran out before SOS/EOI, keep whatever's left so we don't
  // truncate the encoded image data.
  if (i < buf.length) {
    keep.push([i, buf.length]);
  }

  // Concatenate the kept ranges into a fresh buffer.
  const total = keep.reduce((n, [s, e]) => n + (e - s), 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const [s, e] of keep) {
    out.set(buf.subarray(s, e), cursor);
    cursor += e - s;
  }
  return out;
}

// ─── EXIF APP1 builder ─────────────────────────────────────────

/**
 * Build a complete APP1 segment containing an EXIF block. Returned
 * bytes start with the 0xFFE1 marker and are ready to splice into a
 * JPEG file immediately after the SOI.
 *
 * Byte order is big-endian ("MM") to match what most cameras write,
 * which keeps the bytes readable in a hex dump and matches the
 * conventions used by piexifjs / ExifTool.
 */
function buildExifApp1(meta: ExifInjectMeta): Uint8Array {
  const exifDateTime = isoToExifDateTime(meta.timestamp);
  const hasGps = meta.lat != null && meta.lon != null;

  // ── ExifIFD entries ─────────────────────────────────────────
  // (count entries first — values referenced by offset are placed
  //  after all the IFDs in a shared "value pool" at the end.)
  const exifIfdEntries: IfdEntry[] = [
    {
      tag: 0x9000, // ExifVersion
      type: 7, // UNDEFINED
      count: 4,
      inlineBytes: ascii4("0230"),
    },
    {
      tag: 0x9003, // DateTimeOriginal
      type: 2, // ASCII
      count: 20,
      poolBytes: asciiNullTerminated(exifDateTime),
    },
    {
      tag: 0x9004, // DateTimeDigitized
      type: 2, // ASCII
      count: 20,
      poolBytes: asciiNullTerminated(exifDateTime),
    },
  ];

  // ── GPS IFD entries ─────────────────────────────────────────
  const gpsIfdEntries: IfdEntry[] = [];
  if (hasGps) {
    const lat = meta.lat as number;
    const lon = meta.lon as number;
    const latRef = lat >= 0 ? "N" : "S";
    const lonRef = lon >= 0 ? "E" : "W";
    const latDms = decimalToDmsRationals(Math.abs(lat));
    const lonDms = decimalToDmsRationals(Math.abs(lon));

    gpsIfdEntries.push(
      {
        tag: 0x0000, // GPSVersionID
        type: 1, // BYTE
        count: 4,
        inlineBytes: new Uint8Array([2, 3, 0, 0]),
      },
      {
        tag: 0x0001, // GPSLatitudeRef
        type: 2, // ASCII
        count: 2,
        inlineBytes: ascii4(latRef + "\0"),
      },
      {
        tag: 0x0002, // GPSLatitude
        type: 5, // RATIONAL
        count: 3,
        poolBytes: rationalsToBytes(latDms),
      },
      {
        tag: 0x0003, // GPSLongitudeRef
        type: 2,
        count: 2,
        inlineBytes: ascii4(lonRef + "\0"),
      },
      {
        tag: 0x0004, // GPSLongitude
        type: 5,
        count: 3,
        poolBytes: rationalsToBytes(lonDms),
      },
    );
  }

  // ── IFD0 entries ────────────────────────────────────────────
  // ExifIFDPointer / GPSInfoIFDPointer are LONG offsets that must be
  // resolved once we know the final layout. We mark them with a
  // sentinel tag and patch the value bytes after layout.
  const ifd0Entries: IfdEntry[] = [
    {
      tag: 0x0112, // Orientation
      type: 3, // SHORT
      count: 1,
      inlineBytes: shortAsBytes(1), // upright — pixels are baked
    },
    {
      tag: 0x0131, // Software
      type: 2,
      count: SOFTWARE_TAG.length + 1,
      poolBytes: asciiNullTerminated(SOFTWARE_TAG),
    },
    {
      tag: 0x0132, // DateTime
      type: 2,
      count: 20,
      poolBytes: asciiNullTerminated(exifDateTime),
    },
    {
      tag: 0x8769, // ExifIFDPointer (LONG, value patched later)
      type: 4,
      count: 1,
      inlineBytes: longAsBytes(0),
      pointerKind: "exif",
    },
  ];
  if (hasGps) {
    ifd0Entries.push({
      tag: 0x8825, // GPSInfoIFDPointer
      type: 4,
      count: 1,
      inlineBytes: longAsBytes(0),
      pointerKind: "gps",
    });
  }

  // ── Lay out the TIFF block ──────────────────────────────────
  // TIFF starts with: byte order (2) + magic (2) + IFD0 offset (4) = 8 bytes.
  // Then: IFD0 (count + N×12 + nextOffset) = 2 + N×12 + 4
  // Then: ExifIFD = 2 + M×12 + 4
  // Then (if GPS): GPS IFD = 2 + K×12 + 4
  // Then: shared value pool with all entries' poolBytes.

  const TIFF_HEADER = 8;
  const ifd0Size = 2 + ifd0Entries.length * 12 + 4;
  const exifIfdSize = 2 + exifIfdEntries.length * 12 + 4;
  const gpsIfdSize = hasGps ? 2 + gpsIfdEntries.length * 12 + 4 : 0;

  const ifd0Offset = 8;
  const exifIfdOffset = TIFF_HEADER + ifd0Size;
  const gpsIfdOffset = exifIfdOffset + exifIfdSize;
  const valuePoolStart = (hasGps ? gpsIfdOffset + gpsIfdSize : exifIfdOffset + exifIfdSize);

  // Walk every entry once to assign value-pool offsets (for entries whose
  // value is too large to fit inline in the 4-byte slot of the IFD entry).
  let cursor = valuePoolStart;
  const allEntries = [...ifd0Entries, ...exifIfdEntries, ...gpsIfdEntries];
  for (const entry of allEntries) {
    if (entry.poolBytes) {
      entry.assignedPoolOffset = cursor;
      cursor += entry.poolBytes.length;
      // Pool entries must start on word boundaries — pad to even length.
      if (cursor % 2 !== 0) cursor += 1;
    }
  }
  const tiffSize = cursor;

  // Patch the IFD0 pointer entries now that exifIfdOffset / gpsIfdOffset
  // are known. (These values are LONGs that fit inline.)
  for (const e of ifd0Entries) {
    if (e.pointerKind === "exif") e.inlineBytes = longAsBytes(exifIfdOffset);
    if (e.pointerKind === "gps") e.inlineBytes = longAsBytes(gpsIfdOffset);
  }

  // ── Serialize ───────────────────────────────────────────────
  const tiff = new Uint8Array(tiffSize);
  const tiffView = new DataView(tiff.buffer);

  // Byte order = big-endian ("MM"), magic 0x002A, IFD0 offset = 8.
  tiff[0] = 0x4d;
  tiff[1] = 0x4d;
  tiffView.setUint16(2, 0x002a);
  tiffView.setUint32(4, ifd0Offset);

  writeIfd(tiff, tiffView, ifd0Offset, ifd0Entries, /* nextIfdOffset = */ 0);
  writeIfd(tiff, tiffView, exifIfdOffset, exifIfdEntries, 0);
  if (hasGps) writeIfd(tiff, tiffView, gpsIfdOffset, gpsIfdEntries, 0);

  // Pour pool bytes.
  for (const e of allEntries) {
    if (e.poolBytes && e.assignedPoolOffset != null) {
      tiff.set(e.poolBytes, e.assignedPoolOffset);
    }
  }

  // ── Wrap as APP1 ────────────────────────────────────────────
  // APP1 marker (FFE1) + 2-byte length + "Exif\0\0" (6 bytes) + TIFF block.
  // Length covers everything from the length field itself onwards
  // (so length = 2 + 6 + tiff.length).
  const app1Length = 2 + 6 + tiff.length;
  if (app1Length > 0xffff) {
    // Should never happen — our payload is always tiny. Bail safely
    // by returning a zero-length array; caller will fall back gracefully.
    return new Uint8Array(0);
  }

  const out = new Uint8Array(2 + app1Length);
  out[0] = 0xff;
  out[1] = 0xe1;
  out[2] = (app1Length >> 8) & 0xff;
  out[3] = app1Length & 0xff;
  out[4] = 0x45; // 'E'
  out[5] = 0x78; // 'x'
  out[6] = 0x69; // 'i'
  out[7] = 0x66; // 'f'
  out[8] = 0x00;
  out[9] = 0x00;
  out.set(tiff, 10);
  return out;
}

// ─── IFD entry helpers ────────────────────────────────────────

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  /** Bytes for the value field when it fits in 4 bytes inline. */
  inlineBytes?: Uint8Array;
  /** Bytes for values that must live in the post-IFD value pool. */
  poolBytes?: Uint8Array;
  /** Internal: offset assigned during layout (only when poolBytes set). */
  assignedPoolOffset?: number;
  /** Internal: marks IFD0 entries whose value is a pointer to be patched. */
  pointerKind?: "exif" | "gps";
}

function writeIfd(
  tiff: Uint8Array,
  view: DataView,
  ifdOffset: number,
  entries: IfdEntry[],
  nextIfdOffset: number,
): void {
  view.setUint16(ifdOffset, entries.length);
  let entryOffset = ifdOffset + 2;
  for (const e of entries) {
    view.setUint16(entryOffset, e.tag);
    view.setUint16(entryOffset + 2, e.type);
    view.setUint32(entryOffset + 4, e.count);
    if (e.poolBytes) {
      view.setUint32(entryOffset + 8, e.assignedPoolOffset!);
    } else {
      const v = e.inlineBytes ?? new Uint8Array(4);
      // Copy up to 4 bytes; pad to 4 with zeros.
      tiff[entryOffset + 8] = v[0] ?? 0;
      tiff[entryOffset + 9] = v[1] ?? 0;
      tiff[entryOffset + 10] = v[2] ?? 0;
      tiff[entryOffset + 11] = v[3] ?? 0;
    }
    entryOffset += 12;
  }
  view.setUint32(entryOffset, nextIfdOffset);
}

// ─── Value encoders ────────────────────────────────────────────

function shortAsBytes(value: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = (value >> 8) & 0xff;
  out[1] = value & 0xff;
  return out;
}

function longAsBytes(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = (value >>> 24) & 0xff;
  out[1] = (value >>> 16) & 0xff;
  out[2] = (value >>> 8) & 0xff;
  out[3] = value & 0xff;
  return out;
}

function ascii4(s: string): Uint8Array {
  const out = new Uint8Array(4);
  for (let i = 0; i < Math.min(4, s.length); i++) {
    out[i] = s.charCodeAt(i) & 0xff;
  }
  return out;
}

function asciiNullTerminated(s: string): Uint8Array {
  const out = new Uint8Array(s.length + 1);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  // out[s.length] is already 0
  return out;
}

function rationalsToBytes(rationals: Array<[number, number]>): Uint8Array {
  const out = new Uint8Array(rationals.length * 8);
  const view = new DataView(out.buffer);
  for (let i = 0; i < rationals.length; i++) {
    view.setUint32(i * 8, rationals[i][0]);
    view.setUint32(i * 8 + 4, rationals[i][1]);
  }
  return out;
}

/**
 * Convert a positive decimal degree to three EXIF rationals:
 * degrees / 1, minutes / 1, seconds × 10000 / 10000.
 *
 * Fractional precision of 1/10000 second ≈ 0.003 m at the equator —
 * vastly more than civilian GPS hardware delivers, so this never loses
 * useful precision.
 */
function decimalToDmsRationals(decimal: number): Array<[number, number]> {
  const deg = Math.floor(decimal);
  const minFloat = (decimal - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  const secScaled = Math.round(sec * 10000);
  return [
    [deg, 1],
    [min, 1],
    [secScaled, 10000],
  ];
}

/**
 * Convert ISO 8601 "2026-04-29T11:22:00Z" → EXIF "2026:04:29 11:22:00".
 * EXIF DateTime fields are local time without zone info — we render
 * from the timestamp as-is and leave zone handling to the caller.
 */
function isoToExifDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Unparseable input — return a zero string so the field still
    // carries the expected 19-byte payload rather than corrupting EXIF.
    return "0000:00:00 00:00:00";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}
