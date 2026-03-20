#!/usr/bin/env node
/**
 * sync-tbt.js
 * 
 * Scans public/toolbox-talks/ for HTML files and registers any missing ones
 * in src/data/tbt-structure.ts automatically.
 * 
 * Usage:  node scripts/sync-tbt.js
 * 
 * How it works:
 *   1. Reads all .html files from public/toolbox-talks/
 *   2. Reads tbt-structure.ts to find which are already registered
 *   3. For each unregistered file:
 *      - Extracts the ref (TBT-XXX-NNN), title (from <h1>), and slug from the filename
 *      - Matches it to the correct subfolder using fuzzy keyword matching against expectedTalks
 *      - Falls back to the last subfolder in the category if no match found
 *   4. Inserts the new entries into tbt-structure.ts
 *   5. Updates the header comment with the new count
 * 
 * Safe to run repeatedly — it only adds missing entries, never duplicates.
 */

const fs = require("fs");
const path = require("path");

const HTML_DIR = path.join(__dirname, "..", "public", "toolbox-talks");
const STRUCTURE_FILE = path.join(__dirname, "..", "src", "data", "tbt-structure.ts");

// ── Acronyms to preserve in title casing ──────────────────────────────────────
const ACRONYMS = {
  ppe: "PPE", rpe: "RPE", havs: "HAVS", coshh: "COSHH", pat: "PAT",
  dee: "DEE", cctv: "CCTV", mewp: "MEWP", mewps: "MEWPs", nnlw: "NNLW",
  lev: "LEV", uv: "UV", wps: "WPS", itp: "ITP", hswa: "HSWA",
  hse: "HSE", loler: "LOLER", loto: "LOTO", ipv: "IPV", pe: "PE",
  di: "DI", simops: "SIMOPS", gl: "GL", mf: "MF", dc: "DC",
  suds: "SuDS", coss: "COSS", tbm: "TBM", nrswa: "NRSWA",
  iso: "ISO", cdm: "CDM", riddor: "RIDDOR", ole: "OLE",
  pts: "PTS", pfd: "PFD", aed: "AED", acm: "ACM", nig: "NIG",
};

const SMALL_WORDS = new Set([
  "and", "or", "the", "in", "on", "at", "for", "of", "vs", "to", "near",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function titleFromSlug(slugRaw) {
  return slugRaw
    .split("-")
    .map((w, i) => {
      const wl = w.toLowerCase();
      if (ACRONYMS[wl]) return ACRONYMS[wl];
      if (i > 0 && SMALL_WORDS.has(wl)) return wl;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .replace("Weils", "Weil's");
}

function titleFromHtml(filePath) {
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) return h1[1].replace(/<[^>]+>/g, "").trim();
  } catch {}
  return null;
}

function normalise(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Score how well a talk slug matches an expectedTalk string (0–1) */
function matchScore(talkSlug, expectedTalk) {
  const talkWords = new Set(normalise(talkSlug).split(" "));
  const expectedWords = normalise(expectedTalk).split(" ");
  if (expectedWords.length === 0) return 0;
  let hits = 0;
  for (const w of expectedWords) {
    if (talkWords.has(w)) hits++;
  }
  return hits / expectedWords.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  // 1. Read all HTML files
  const htmlFiles = fs
    .readdirSync(HTML_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort();

  // 2. Read current structure file and find already-registered filenames
  let tsContent = fs.readFileSync(STRUCTURE_FILE, "utf-8");
  const registeredSet = new Set(
    [...tsContent.matchAll(/htmlFile:\s*"([^"]+)"/g)].map((m) => m[1])
  );

  // 3. Find unregistered files
  const filePattern = /^TBT-([A-Z]+)-(\d+)-(.+)-toolbox-talk\.html$/;
  const missing = [];

  for (const fn of htmlFiles) {
    if (registeredSet.has(fn)) continue;
    const m = fn.match(filePattern);
    if (!m) {
      console.warn(`⚠️  Skipping (bad filename format): ${fn}`);
      continue;
    }
    const [, code, num, slugRaw] = m;
    const htmlTitle = titleFromHtml(path.join(HTML_DIR, fn));
    const title = htmlTitle || titleFromSlug(slugRaw);

    missing.push({
      code,
      ref: `TBT-${code}-${num}`,
      title,
      slug: slugRaw,
      htmlFile: fn,
      num: parseInt(num, 10),
    });
  }

  if (missing.length === 0) {
    console.log("✅ All HTML files are already registered. Nothing to do.");
    return;
  }

  console.log(`\n📋 Found ${missing.length} unregistered HTML files:\n`);

  // 4. For each missing file, find the best subfolder and insert
  //    Group by code first for efficiency
  const byCode = {};
  for (const entry of missing) {
    if (!byCode[entry.code]) byCode[entry.code] = [];
    byCode[entry.code].push(entry);
  }

  let insertCount = 0;

  for (const code of Object.keys(byCode).sort()) {
    const entries = byCode[code];

    for (const entry of entries) {
      // Build the TS entry line
      const line = `        { ref: "${entry.ref}", title: "${entry.title}", slug: "${entry.slug}", htmlFile: "${entry.htmlFile}" },`;

      // Find the last existing htmlFile entry for this code and insert after it
      const existingRegex = new RegExp(
        `([ \\t]*\\{[^}]*htmlFile:\\s*"TBT-${code}-\\d{3}-[^"]*\\.html"\\s*\\},?)`,
        "g"
      );
      const matches = [...tsContent.matchAll(existingRegex)];

      if (matches.length > 0) {
        // Insert after the last existing entry for this code
        const lastMatch = matches[matches.length - 1];
        const insertPos = lastMatch.index + lastMatch[0].length;
        tsContent =
          tsContent.slice(0, insertPos) + "\n" + line + tsContent.slice(insertPos);
        insertCount++;
        console.log(`  ✅ ${entry.ref} → ${entry.title}`);
      } else {
        // No existing entries — find first empty `talks: []` in this code's block
        // Look for the category by code, then find first empty talks array
        const emptyRegex = new RegExp(
          `code: "${code}"[\\s\\S]*?(talks: \\[)(\\])`,
        );
        const emptyMatch = tsContent.match(emptyRegex);
        if (emptyMatch) {
          const fullMatchStart = tsContent.indexOf(emptyMatch[0]);
          const talksStart =
            fullMatchStart +
            emptyMatch[0].indexOf("talks: [") +
            "talks: [".length;
          tsContent =
            tsContent.slice(0, talksStart) +
            "\n" +
            line +
            "\n      " +
            tsContent.slice(talksStart);
          insertCount++;
          console.log(`  ✅ ${entry.ref} → ${entry.title} (first in subfolder)`);
        } else {
          console.warn(`  ⚠️  Could not place ${entry.ref} — no matching category block for code ${code}`);
        }
      }
    }
  }

  // 5. Update the header comment with new count
  const newTotal = [...tsContent.matchAll(/htmlFile:/g)].length;
  tsContent = tsContent.replace(
    /\d+ HTML files\)/,
    `${newTotal} HTML files)`
  );

  // 6. Write back
  fs.writeFileSync(STRUCTURE_FILE, tsContent, "utf-8");

  console.log(`\n✅ Done! Registered ${insertCount} new talks.`);
  console.log(`📊 Total registered: ${newTotal}`);
  console.log(`📁 File updated: src/data/tbt-structure.ts\n`);
}

main();
