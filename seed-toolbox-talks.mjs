// seed-toolbox-talks.mjs
// =====================================================
// ONE-SHOT IMPORT SCRIPT — Run this once to populate
// the database with all your toolbox talk HTML files.
//
// USAGE:
//   1. Copy this file into your project root (same level as package.json)
//   2. Run:  node seed-toolbox-talks.mjs
//   3. Done — all talks will appear on the site
//
// REQUIRES: @prisma/client already installed & schema pushed
// =====================================================

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Path to your toolbox talk HTML files
const TBT_DIR = path.join(__dirname, "public", "toolbox-talks");

// ── STEP 1: Map 3-letter codes to category slugs ──────────────────
// This maps the short code in filenames (e.g. TBT-WWT-001)
// to the category slug in your database.
// These match the 60 categories on your /toolbox-talks page.
const CODE_TO_CATEGORY_SLUG = {
  ENV: "environmental",
  WAH: "working-at-height",
  EXC: "excavations",
  BUR: "buried-services",
  CSP: "confined-spaces",
  LFT: "lifting-operations",
  PLT: "plant-and-equipment",
  TRF: "traffic-management",
  MAN: "manual-handling",
  COS: "coshh",
  ELE: "electrical-safety",
  FIR: "fire-safety",
  HOT: "hot-works",
  TWK: "temporary-works",
  SCF: "scaffolding",
  CON: "concrete-and-formwork",
  STE: "steel-erection",
  DEM: "demolition",
  PPE: "ppe",
  LOT: "loto",
  PTW: "permit-to-work",
  WAT: "water-safety",
  ASB: "asbestos",
  DUS: "dust-and-silica",
  OCC: "occupational-health",
  MEC: "meica",
  SLP: "slips-trips-and-falls",
  LON: "lone-working",
  WEL: "welfare-and-site-setup",
  SEA: "seasonal-and-weather",
  HWY: "highways",
  RAI: "rail-works",
  WWT: "wastewater-treatment",
  UTL: "utilities",
  GRW: "groundworks",
  PIL: "piling-and-foundations",
  TUN: "tunnelling",
  MAR: "marine-and-coastal",
  BLD: "building-and-structural",
  INT: "interior-finishing",
  MBS: "mechanical-building-services",
  EBS: "electrical-building-services",
  TRD: "trade-specific",
  LND: "landscaping",
  SUR: "surveying",
  QMS: "quality-and-inspection",
  INC: "incident-management",
  BEH: "behavioural-safety",
  CDM: "cdm",
  EMG: "emergency-preparedness",
  ROA: "road-construction",
  PIP: "pipelines",
  REM: "remediation",
  ENE: "energy-and-renewables",
  BRD: "bridges",
  DAM: "dams-and-flood-defence",
  WLD: "welding",
  ACC: "access-and-temporary-structures",
  NIG: "night-working",
  SUB: "subcontractor-safety",
};

// ── STEP 2: Parse filename into components ─────────────────────────
// Filename pattern: TBT-{CODE}-{NUM}-{slug-words}-toolbox-talk.html
function parseFilename(filename) {
  // Match: TBT-WWT-001-wastewater-treatment-works-safety-awareness-toolbox-talk.html
  const match = filename.match(
    /^(TBT-([A-Z]{3})-(\d{3}))-(.+)-toolbox-talk\.html$/
  );
  if (!match) return null;

  const ref = match[1]; // TBT-WWT-001
  const categoryCode = match[2]; // WWT
  const num = parseInt(match[3], 10); // 1
  const slugPart = match[4]; // wastewater-treatment-works-safety-awareness

  return { ref, categoryCode, num, slug: slugPart, filename };
}

// ── STEP 3: Extract title from HTML <h1> tag ───────────────────────
function extractTitle(filePath) {
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();
  } catch (e) {
    // Fall through to slug-based title
  }
  return null;
}

// ── STEP 4: Convert slug to title case (fallback) ──────────────────
function slugToTitle(slug) {
  const lowerWords = new Set([
    "and", "or", "of", "at", "in", "for", "the", "to", "a", "an",
  ]);
  return slug
    .split("-")
    .map((word, i) => {
      const upper = word.charAt(0).toUpperCase() + word.slice(1);
      // Keep acronyms uppercase
      if (word === word.toUpperCase() && word.length <= 5) return word;
      return i === 0 || !lowerWords.has(word) ? upper : word;
    })
    .join(" ");
}

// ── MAIN ───────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Scanning", TBT_DIR, "for toolbox talk HTML files...\n");

  // Check directory exists
  if (!fs.existsSync(TBT_DIR)) {
    console.error("❌ Directory not found:", TBT_DIR);
    console.error("   Make sure you run this from your project root.");
    process.exit(1);
  }

  // Get all TBT HTML files
  const allFiles = fs.readdirSync(TBT_DIR).filter((f) => f.startsWith("TBT-") && f.endsWith("-toolbox-talk.html"));

  console.log(`📄 Found ${allFiles.length} TBT files\n`);

  if (allFiles.length === 0) {
    console.log("No TBT files found. Check your filename pattern.");
    process.exit(0);
  }

  // Load all categories from database
  const categories = await prisma.toolboxCategory.findMany();
  console.log(`📂 Found ${categories.length} categories in database\n`);

  // Build lookup: slug -> category
  const catBySlug = {};
  for (const cat of categories) {
    catBySlug[cat.slug] = cat;
  }

  // Track results
  let created = 0;
  let skipped = 0;
  let errors = 0;
  const missingCategories = new Set();

  for (const file of allFiles) {
    const parsed = parseFilename(file);

    if (!parsed) {
      console.log(`⚠️  Skipped (bad filename pattern): ${file}`);
      errors++;
      continue;
    }

    // Find category
    const catSlug = CODE_TO_CATEGORY_SLUG[parsed.categoryCode];
    if (!catSlug) {
      console.log(`⚠️  Unknown category code "${parsed.categoryCode}" in: ${file}`);
      missingCategories.add(parsed.categoryCode);
      errors++;
      continue;
    }

    const category = catBySlug[catSlug];
    if (!category) {
      console.log(`⚠️  Category slug "${catSlug}" not found in database for: ${file}`);
      missingCategories.add(parsed.categoryCode);
      errors++;
      continue;
    }

    // Extract title from HTML, or fall back to slug
    const htmlPath = path.join(TBT_DIR, file);
    const title = extractTitle(htmlPath) || slugToTitle(parsed.slug);

    // Get file size
    let fileSize = null;
    try {
      const stat = fs.statSync(htmlPath);
      fileSize = stat.size;
    } catch (e) {}

    // Upsert: create if not exists, skip if already there
    try {
      const existing = await prisma.toolboxTalk.findFirst({
        where: {
          categoryId: category.id,
          slug: parsed.slug,
        },
      });

      if (existing) {
        console.log(`⏭️  Already exists: ${parsed.ref} — ${title}`);
        skipped++;
        continue;
      }

      await prisma.toolboxTalk.create({
        data: {
          categoryId: category.id,
          title: title,
          slug: parsed.slug,
          description: `${title} toolbox talk for construction site teams.`,
          fileName: file,
          blobUrl: null, // served from public/ folder, not blob storage
          fileSize: fileSize,
          isFree: true,
          isPublished: true,
          order: parsed.num,
        },
      });

      console.log(`✅ Created: ${parsed.ref} — ${title} → ${catSlug}`);
      created++;
    } catch (e) {
      console.log(`❌ Error creating ${parsed.ref}: ${e.message}`);
      errors++;
    }
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("📊 IMPORT SUMMARY");
  console.log("═".repeat(60));
  console.log(`   ✅ Created:  ${created}`);
  console.log(`   ⏭️  Skipped:  ${skipped} (already existed)`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log(`   📄 Total:    ${allFiles.length}`);

  if (missingCategories.size > 0) {
    console.log(`\n   ⚠️  Missing category codes: ${[...missingCategories].join(", ")}`);
    console.log("   → Add these to CODE_TO_CATEGORY_SLUG in this script");
  }

  console.log("\n🎉 Done! Your toolbox talks should now appear on the site.");
  console.log("   You may need to redeploy on Vercel for the changes to show.\n");
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
