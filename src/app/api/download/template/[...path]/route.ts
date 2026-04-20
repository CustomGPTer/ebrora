// src/app/api/download/template/[...path]/route.ts
// TEMPLATE DOWNLOAD API — Auth check, usage limit enforcement, download tracking
// Route: /api/download/template/{categorySlug}/{subcategorySlug}/{templateSlug}
//
// Flow:
// 1. Validate auth session
// 2. Check monthly usage limit for user's tier
// 3. Resolve template file from filesystem
// 4. Log download in database
// 5. Increment usage counter
// 6. Redirect to static file for download
 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTemplateBySlug } from "@/lib/free-templates";
import { TIER_LIMITS } from "@/lib/constants";
import { resolveEffectiveTier } from "@/lib/payments/resolve-tier";
import { checkDailyFairUsage } from "@/lib/fair-usage";
import type { SubscriptionTier } from "@prisma/client";
import fs from "fs";
import nodePath from "path";
 
interface RouteContext {
  params: Promise<{ path: string[] }>;
}
 
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
 
    if (!path || path.length !== 3) {
      return NextResponse.json(
        { error: "Invalid download path" },
        { status: 400 }
      );
    }
 
    const [categorySlug, subcategorySlug, templateSlug] = path;
 
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Authentication required",
          code: "AUTH_REQUIRED",
          message:
            "Sign in to download free templates. Free accounts get 2 downloads per month.",
        },
        { status: 401 }
      );
    }
 
    const userId = session.user.id;
 
    const template = getTemplateBySlug(
      categorySlug,
      subcategorySlug,
      templateSlug
    );
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
 
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });
 
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
 
    const tier: SubscriptionTier = resolveEffectiveTier(user.subscription);
    const tierLimits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
    const monthlyLimit = tierLimits.templateDownloadsPerMonth;
 
    // Rolling 30-day window
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
 
    const downloadsThisPeriod = await prisma.contentDownload.count({
      where: {
        userId,
        contentType: "FREE_TEMPLATE",
        downloadedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
 
    if (downloadsThisPeriod >= monthlyLimit) {
      return NextResponse.json(
        {
          error: "Download limit reached",
          code: "LIMIT_REACHED",
          used: downloadsThisPeriod,
          limit: monthlyLimit,
          tier,
          message: `You've used all ${monthlyLimit} of your free template downloads. Upgrade for more.`,
        },
        { status: 429 }
      );
    }
 
    // Daily fair-usage check (Unlimited plan only)
    const fairUsage = await checkDailyFairUsage(userId, tier, 'templateDownloads');
    if (!fairUsage.allowed) {
      return NextResponse.json(
        {
          error: "Daily fair-usage limit reached",
          code: "FAIR_USAGE_LIMIT",
          used: fairUsage.used,
          limit: fairUsage.limit,
          tier,
          isFairUsage: true,
          message: fairUsage.message,
        },
        { status: 429 }
      );
    }
 
    await prisma.contentDownload.create({
      data: {
        contentType: "FREE_TEMPLATE",
        contentSlug: `${categorySlug}/${subcategorySlug}/${templateSlug}`,
        userId,
        email: user.email,
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown",
      },
    });
 
    // Serve the file from data/free-templates/ (flat folder, private)
    const filePath = nodePath.join(
      process.cwd(),
      "data",
      "free-templates",
      template.fileName
    );
 
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Template file not found on disk" },
        { status: 404 }
      );
    }
 
    const fileBuffer = fs.readFileSync(filePath);
 
    const CONTENT_TYPES: Record<string, string> = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      pdf: "application/pdf",
    };
 
    const contentType = CONTENT_TYPES[template.fileType] || "application/octet-stream";
 
    // User-friendly download name (just the template-name part, not the full flat filename).
    // Use baseSlug rather than slug so collision-disambiguated slugs like
    // "concrete-pour-record-sheet-xlsx" don't produce ugly filenames like
    // "concrete-pour-record-sheet-xlsx.xlsx".
    const friendlyName = `${template.baseSlug}.${template.fileType}`;
 
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${friendlyName}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
