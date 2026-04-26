// src/lib/photo-editor/stickers/cdn-url.ts
//
// Twemoji CDN URL builder. Twemoji on jsdelivr lays SVGs out by codepoint
// hex, lowercased, with multi-codepoint sequences (flags, ZWJ) joined by
// "-". Examples:
//
//   1f600                — grinning face
//   1f1ec-1f1e7          — flag-UK (regional indicator G + B)
//   1f469-200d-1f4bb     — woman technologist (ZWJ sequence)
//
// We accept the codepoint string in either form ("1F600" or "1f600") and
// normalise to lowercase. The "@latest" tag follows the Twemoji repo's
// most-recent release; pin to a specific tag if reproducibility ever
// becomes an issue (Session 6 ships unpinned — Twemoji's emoji set is
// append-only at the codepoints we ship in catalogue.ts).
//
// CSP note: this URL pattern requires `img-src` to include
// `https://cdn.jsdelivr.net`. Documented in SESSION-6-README.md.

const CDN_BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg";

/** Build the absolute Twemoji SVG URL for a codepoint string.
 *  Accepts "1F600", "1f600", "1f1ec-1f1e7" (case-insensitive). */
export function twemojiUrl(codepoint: string): string {
  return `${CDN_BASE}/${codepoint.toLowerCase()}.svg`;
}
