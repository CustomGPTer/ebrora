// src/lib/site-photo-stamp/unique-id.ts
//
// Short unique record ID generator. 13 characters of Crockford base-32 gives
// ~65 bits of entropy (collision-safe for personal device use) with no
// ambiguous chars (I/L/O/U removed), human-readable and shareable over SMS.
//
// Matches the visual format used by photo-stamp apps like Timemark
// (e.g. NWCYH33XNH4UDB).

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Generate a 13-character Crockford base-32 record ID. */
export function generateUniqueId(): string {
  const bytes = new Uint8Array(9); // 72 bits → 13 chars (5 bits each) with spare
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback: Math.random (never hit in browsers, but keeps TS happy).
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // Treat bytes as a bit stream; read 5 bits at a time.
  let bits = 0;
  let bitCount = 0;
  let out = "";
  for (let i = 0; i < bytes.length && out.length < 13; i++) {
    bits = (bits << 8) | bytes[i];
    bitCount += 8;
    while (bitCount >= 5 && out.length < 13) {
      bitCount -= 5;
      const idx = (bits >>> bitCount) & 0x1f;
      out += CROCKFORD[idx];
    }
  }
  return out;
}
