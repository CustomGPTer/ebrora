// src/lib/photo-editor/fonts/glyph-picker-data.ts
//
// Static catalogue of special characters surfaced through the FontPanel's
// Glyph tab. Deliberately curated rather than a full Unicode dump — the
// goal is to cover the punctuation / currency / math / arrow / symbol
// glyphs people actually want to drop into a photo caption, not to be a
// character map.
//
// In Session 4 the picker appends to the selected layer's last run as a
// temporary affordance (no inline editing yet — that's Session 5). When
// Session 5 lands the cursor + selection-range UI, we'll re-wire the
// picker to insert at the caret instead.
//
// All characters are stored as their literal Unicode code points so the
// picker can render them directly. Surrogate pairs are not used here —
// every entry is a single BMP code point.

export interface GlyphGroup {
  id: string;
  label: string;
  glyphs: readonly string[];
}

export const GLYPH_GROUPS: readonly GlyphGroup[] = [
  {
    id: "punctuation",
    label: "Punctuation",
    glyphs: [
      "—", "–", "…", "·", "•", "¶", "§", "†", "‡", "¿", "¡",
      "‘", "’", "“", "”", "‚", "„", "‹", "›", "«", "»",
      "(", ")", "[", "]", "{", "}", "⟨", "⟩",
      "©", "®", "™", "&", "@", "#", "*", "/",
    ],
  },
  {
    id: "currency",
    label: "Currency",
    glyphs: [
      "$", "€", "£", "¥", "¢", "₹", "₽", "₩", "₺", "₪",
      "ƒ", "₨", "₦", "₱", "₫", "₴", "₣", "₡", "₲", "₵",
      "฿", "₸", "₼", "₿", "៛",
    ],
  },
  {
    id: "math",
    label: "Math",
    glyphs: [
      "+", "−", "×", "÷", "±", "∓", "≈", "≠", "≡", "≤", "≥",
      "<", ">", "∞", "π", "√", "∛", "∑", "∏", "∫", "∂", "∇",
      "∝", "°", "′", "″", "%", "‰",
      "¼", "½", "¾", "⅓", "⅔", "⅛", "⅜", "⅝", "⅞",
      "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹",
    ],
  },
  {
    id: "arrows",
    label: "Arrows",
    glyphs: [
      "←", "→", "↑", "↓", "↔", "↕", "↖", "↗", "↘", "↙",
      "⇐", "⇒", "⇑", "⇓", "⇔", "⇕",
      "⬅", "➡", "⬆", "⬇", "⬉", "⬈", "⬊", "⬋",
      "⤴", "⤵", "↩", "↪", "⏎", "↶", "↷",
      "⟵", "⟶", "⟷",
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    glyphs: [
      "★", "☆", "✦", "✧", "✪", "✯", "✱", "✲", "✳", "✴", "✵",
      "♥", "♡", "♦", "♢", "♣", "♧", "♠", "♤",
      "●", "○", "◉", "◎", "◯", "◼", "◻", "◾", "◽", "▪", "▫",
      "▲", "△", "▼", "▽", "◀", "▶", "◁", "▷",
      "✓", "✔", "✗", "✘", "☑", "☒", "❌", "❎",
      "♪", "♫", "♬", "♩",
      "☀", "☁", "☂", "☃", "❄", "☔", "☘",
      "☎", "✉", "✏", "✂", "⌚", "⌛", "⚙", "⚡", "⚠", "⛔",
      "♻", "♾", "⚓", "⚖", "⚒", "⚔", "⚙",
    ],
  },
];

/** Total glyph count across all groups. Used by the panel footer. */
export function totalGlyphCount(): number {
  let n = 0;
  for (const g of GLYPH_GROUPS) n += g.glyphs.length;
  return n;
}
