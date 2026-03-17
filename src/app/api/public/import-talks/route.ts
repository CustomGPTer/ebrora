// src/app/api/public/import-talks/route.ts
// ================================================================
// TOOLBOX TALK AUTO-IMPORTER (v2 — no filesystem access needed)
//
// Visit: https://www.ebrora.com/api/public/import-talks?key=YOUR_SECRET
//
// Reads from tbt-manifest.json and creates database records.
// Safe to run repeatedly — skips existing records.
// ================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import manifest from "@/data/tbt-manifest.json";

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

interface ManifestEntry {
  code: string;
  num: number;
  slug: string;
  title: string;
  file: string;
}

export async function GET(request: NextRequest) {
  // Auth check
  const key = request.nextUrl.searchParams.get("key");
  const secret = process.env.IMPORT_SECRET;

  if (!secret || key !== secret) {
    return NextResponse.json(
      { error: "Unauthorised. Add ?key=YOUR_IMPORT_SECRET to the URL." },
      { status: 401 }
    );
  }

  const entries = manifest as ManifestEntry[];
  const results: { created: string[]; skipped: string[]; errors: string[] } = {
    created: [],
    skipped: [],
    errors: [],
  };

  // Load categories from DB
  const categories = await prisma.toolboxCategory.findMany();
  const catBySlug: Record<string, (typeof categories)[0]> = {};
  for (const cat of categories) {
    catBySlug[cat.slug] = cat;
  }

  // Process each manifest entry
  for (const entry of entries) {
    const catSlug = CODE_TO_CATEGORY_SLUG[entry.code];
    if (!catSlug) {
      results.errors.push(`Unknown code "${entry.code}": ${entry.file}`);
      continue;
    }

    const category = catBySlug[catSlug];
    if (!category) {
      results.errors.push(`Category "${catSlug}" not in DB: ${entry.file}`);
      continue;
    }

    // Check if already exists
    const existing = await prisma.toolboxTalk.findFirst({
      where: { categoryId: category.id, slug: entry.slug },
    });

    if (existing) {
      results.skipped.push(`TBT-${entry.code}-${String(entry.num).padStart(3, "0")} — ${existing.title}`);
      continue;
    }

    try {
      await prisma.toolboxTalk.create({
        data: {
          categoryId: category.id,
          title: entry.title,
          slug: entry.slug,
          description: `${entry.title} toolbox talk for construction site teams.`,
          fileName: entry.file,
          blobUrl: null,
          fileSize: null,
          isFree: true,
          isPublished: true,
          order: entry.num,
        },
      });
      results.created.push(`TBT-${entry.code}-${String(entry.num).padStart(3, "0")} — ${entry.title}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.errors.push(`Failed TBT-${entry.code}-${String(entry.num).padStart(3, "0")}: ${msg}`);
    }
  }

  return NextResponse.json({
    summary: {
      manifestEntries: entries.length,
      created: results.created.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
    created: results.created,
    skipped: results.skipped,
    errors: results.errors,
  });
}
