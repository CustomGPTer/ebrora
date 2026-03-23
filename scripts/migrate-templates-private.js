#!/usr/bin/env node
// =============================================================================
// scripts/migrate-templates-private.js
// ONE-TIME MIGRATION: Move template files from public/ to data/ (private)
//
// What it does:
//   1. Creates data/free-templates/ mirroring the public/ folder structure
//   2. Moves downloadable files (.xlsx, .xlsm, .docx, .pptx, .pdf) to data/
//   3. Moves _meta.json files to data/
//   4. Leaves preview images (.preview.png, .preview.jpg) in public/
//   5. Leaves .gitkeep files in public/
//   6. Prints a summary of everything moved
//
// Run from project root:
//   node scripts/migrate-templates-private.js
//
// Safe to run multiple times — skips files that already exist in data/.
// =============================================================================

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(process.cwd(), "public", "free-templates");
const PRIVATE_DIR = path.join(process.cwd(), "data", "free-templates");

const TEMPLATE_EXTENSIONS = new Set([
  ".xlsx",
  ".xlsm",
  ".docx",
  ".pptx",
  ".pdf",
]);

let moved = 0;
let skipped = 0;
let kept = 0;
let errors = 0;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function shouldMove(fileName) {
  // Move template files
  const ext = path.extname(fileName).toLowerCase();
  if (TEMPLATE_EXTENSIONS.has(ext)) return true;

  // Move _meta.json
  if (fileName === "_meta.json") return true;

  return false;
}

function isPreview(fileName) {
  return fileName.includes(".preview.");
}

function processDirectory(publicPath, privatePath, relativePath) {
  if (!fs.existsSync(publicPath)) return;

  ensureDir(privatePath);

  const entries = fs.readdirSync(publicPath, { withFileTypes: true });

  for (const entry of entries) {
    const publicEntryPath = path.join(publicPath, entry.name);
    const privateEntryPath = path.join(privatePath, entry.name);
    const relativeEntryPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      processDirectory(publicEntryPath, privateEntryPath, relativeEntryPath);
      continue;
    }

    if (!entry.isFile()) continue;

    // Preview images stay in public/
    if (isPreview(entry.name)) {
      console.log(`  KEEP (preview)  ${relativeEntryPath}`);
      kept++;
      continue;
    }

    // .gitkeep stays in public/
    if (entry.name === ".gitkeep") {
      kept++;
      continue;
    }

    // Template files and _meta.json move to data/
    if (shouldMove(entry.name)) {
      if (fs.existsSync(privateEntryPath)) {
        console.log(`  SKIP (exists)   ${relativeEntryPath}`);
        skipped++;
        continue;
      }

      try {
        // Copy to private dir
        fs.copyFileSync(publicEntryPath, privateEntryPath);
        // Delete from public dir
        fs.unlinkSync(publicEntryPath);
        console.log(`  MOVED           ${relativeEntryPath}`);
        moved++;
      } catch (err) {
        console.error(`  ERROR           ${relativeEntryPath}: ${err.message}`);
        errors++;
      }
      continue;
    }

    // Unknown file — leave in place and warn
    console.log(`  KEEP (unknown)  ${relativeEntryPath}`);
    kept++;
  }
}

// ── Main ──

console.log("");
console.log("=================================================================");
console.log("  TEMPLATE MIGRATION: public/free-templates → data/free-templates");
console.log("=================================================================");
console.log("");

if (!fs.existsSync(PUBLIC_DIR)) {
  console.log("No public/free-templates/ directory found. Nothing to migrate.");
  process.exit(0);
}

console.log(`Source:      ${PUBLIC_DIR}`);
console.log(`Destination: ${PRIVATE_DIR}`);
console.log("");

ensureDir(PRIVATE_DIR);
processDirectory(PUBLIC_DIR, PRIVATE_DIR, "");

console.log("");
console.log("-----------------------------------------------------------------");
console.log(`  Moved:   ${moved} file(s) to data/free-templates/`);
console.log(`  Skipped: ${skipped} file(s) (already in data/)`);
console.log(`  Kept:    ${kept} file(s) in public/ (previews, .gitkeep, etc.)`);
if (errors > 0) {
  console.log(`  Errors:  ${errors}`);
}
console.log("-----------------------------------------------------------------");

if (moved > 0) {
  console.log("");
  console.log("Done! Template files are now private.");
  console.log("Preview images remain in public/free-templates/ for SEO pages.");
  console.log("Downloads are now served through /api/download/template/ only.");
}

if (moved === 0 && skipped === 0) {
  console.log("");
  console.log("No template files found to migrate.");
  console.log("When you add templates, put them directly in data/free-templates/");
  console.log("and put preview images in public/free-templates/.");
}

console.log("");
