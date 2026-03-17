// src/app/api/admin/import-talks/route.ts
// ================================================================
// TOOLBOX TALK AUTO-IMPORTER
//
// Visit: https://ebrora.com/api/admin/import-talks?key=YOUR_SECRET
//
// Scans public/toolbox-talks/ for HTML files and creates database
// records for any that don't already exist. Safe to run repeatedly.
// ================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// ── Security: set this in your Vercel environment variables ──
// Go to Vercel → Settings → Environment Variables → Add:
//   Name:  IMPORT_SECRET
//   Value: (any random string you choose, e.g. "ebrora-import-2026")
//
// Then visit: /api/admin/import-talks?key=ebrora-import-2026

const CODE_TO_CATEGORY_SLUG: Record<string, string> = {
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

function parseFilename(filename: string) {
  const match = filename.match(
    /^(TBT-([A-Z]{3})-(\d{3}))-(.+)-toolbox-talk\.html$/
  );
  if (!match) return null;
  return {
    ref: match[1],
    categoryCode: match[2],
    num: parseInt(match[3], 10),
    slug: match[4],
    filename,
  };
}

function extractTitle(filePath: string): string | null {
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();
  } catch {
    // fall through
  }
  return null;
}

function slugToTitle(slug: string): string {
  const lower = new Set(["and", "or", "of", "at", "in", "for", "the", "to", "a", "an"]);
  return slug
    .split("-")
    .map((w, i) => (i === 0 || !lower.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export async function GET(request: NextRequest) {
  // ── Auth check ──
  const key = request.nextUrl.searchParams.get("key");
  const secret = process.env.IMPORT_SECRET;

  if (!secret || key !== secret) {
    return NextResponse.json(
      { error: "Unauthorised. Add ?key=YOUR_IMPORT_SECRET to the URL." },
      { status: 401 }
    );
  }

  const tbtDir = path.join(process.cwd(), "public", "toolbox-talks");
  const results: { created: string[]; skipped: string[]; errors: string[] } = {
    created: [],
    skipped: [],
    errors: [],
  };

  // Check directory exists
  if (!fs.existsSync(tbtDir)) {
    return NextResponse.json(
      { error: "public/toolbox-talks/ directory not found" },
      { status: 404 }
    );
  }

  // Get all TBT HTML files
  const allFiles = fs
    .readdirSync(tbtDir)
    .filter((f) => f.startsWith("TBT-") && f.endsWith("-toolbox-talk.html"));

  // Load categories from DB
  const categories = await prisma.toolboxCategory.findMany();
  const catBySlug: Record<string, (typeof categories)[0]> = {};
  for (const cat of categories) {
    catBySlug[cat.slug] = cat;
  }

  // Process each file
  for (const file of allFiles) {
    const parsed = parseFilename(file);

    if (!parsed) {
      results.errors.push(`Bad filename: ${file}`);
      continue;
    }

    const catSlug = CODE_TO_CATEGORY_SLUG[parsed.categoryCode];
    if (!catSlug) {
      results.errors.push(`Unknown code "${parsed.categoryCode}": ${file}`);
      continue;
    }

    const category = catBySlug[catSlug];
    if (!category) {
      results.errors.push(`Category "${catSlug}" not in DB: ${file}`);
      continue;
    }

    // Check if already exists
    const existing = await prisma.toolboxTalk.findFirst({
      where: { categoryId: category.id, slug: parsed.slug },
    });

    if (existing) {
      results.skipped.push(`${parsed.ref} — ${existing.title}`);
      continue;
    }

    // Extract title from HTML
    const htmlPath = path.join(tbtDir, file);
    const title = extractTitle(htmlPath) || slugToTitle(parsed.slug);

    let fileSize: number | null = null;
    try {
      fileSize = fs.statSync(htmlPath).size;
    } catch {
      // ignore
    }

    try {
      await prisma.toolboxTalk.create({
        data: {
          categoryId: category.id,
          title,
          slug: parsed.slug,
          description: `${title} toolbox talk for construction site teams.`,
          fileName: file,
          blobUrl: null,
          fileSize,
          isFree: true,
          isPublished: true,
          order: parsed.num,
        },
      });
      results.created.push(`${parsed.ref} — ${title}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.errors.push(`Failed ${parsed.ref}: ${msg}`);
    }
  }

  return NextResponse.json({
    summary: {
      filesScanned: allFiles.length,
      created: results.created.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
    created: results.created,
    skipped: results.skipped,
    errors: results.errors,
  });
}
