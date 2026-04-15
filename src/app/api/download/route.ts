// src/app/api/download/route.ts
// Records a content download and returns the blob URL.
// Auth required. Tier-based limits enforced (rolling 30-day window).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import { TIER_LIMITS } from "@/lib/constants";
import { resolveEffectiveTier } from "@/lib/payments/resolve-tier";
import { checkDailyFairUsage } from "@/lib/fair-usage";
import type { FairUsageFeature } from "@/lib/constants";
import { validateOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "contentType and contentId are required" },
        { status: 400 }
      );
    }

    if (!["TOOLBOX_TALK", "FREE_TEMPLATE"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid contentType" },
        { status: 400 }
      );
    }

    // Get user tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    const tier = resolveEffectiveTier(user?.subscription) as keyof typeof TIER_LIMITS;

    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;

    // Enforce rolling 30-day download limit
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (contentType === "TOOLBOX_TALK") {
      const limit = limits.tbtDownloadsPerMonth;
      if (typeof limit === "number") {
        const count = await prisma.contentDownload.count({
          where: {
            userId: session.user.id,
            contentType: "TOOLBOX_TALK",
            downloadedAt: { gte: thirtyDaysAgo },
          },
        });
        if (count >= limit) {
          return NextResponse.json(
            {
              error: "Download limit reached",
              code: "LIMIT_REACHED",
              used: count,
              limit,
              tier,
              message: `You've used all ${limit} toolbox talk downloads this period. Upgrade for more.`,
            },
            { status: 429 }
          );
        }
      }
    }

    if (contentType === "FREE_TEMPLATE") {
      const limit = limits.templateDownloadsPerMonth;
      if (typeof limit === "number") {
        const count = await prisma.contentDownload.count({
          where: {
            userId: session.user.id,
            contentType: "FREE_TEMPLATE",
            downloadedAt: { gte: thirtyDaysAgo },
          },
        });
        if (count >= limit) {
          return NextResponse.json(
            {
              error: "Download limit reached",
              code: "LIMIT_REACHED",
              used: count,
              limit,
              tier,
              message: `You've used all ${limit} free template downloads this period. Upgrade for more.`,
            },
            { status: 429 }
          );
        }
      }
    }

    // Daily fair-usage check (Unlimited plan only)
    const fairFeature: FairUsageFeature = contentType === 'TOOLBOX_TALK' ? 'tbtDownloads' : 'templateDownloads';
    const fairUsage = await checkDailyFairUsage(session.user.id, tier, fairFeature);
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

    // Get client IP for tracking
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Build download record
    const data: {
      contentType: ContentType;
      email?: string;
      userId?: string;
      ipAddress: string;
      toolboxTalkId?: string;
      freeTemplateId?: string;
    } = {
      contentType: contentType as ContentType,
      email: user?.email || null,
      userId: session.user.id,
      ipAddress,
    };

    if (contentType === "TOOLBOX_TALK") {
      data.toolboxTalkId = contentId;
    } else if (contentType === "FREE_TEMPLATE") {
      data.freeTemplateId = contentId;
    }

    await prisma.contentDownload.create({ data });

    // Look up the blob URL to return
    let downloadUrl: string | null = null;

    if (contentType === "TOOLBOX_TALK") {
      const talk = await prisma.toolboxTalk.findUnique({
        where: { id: contentId },
        select: { blobUrl: true },
      });
      downloadUrl = talk?.blobUrl || null;
    } else if (contentType === "FREE_TEMPLATE") {
      const template = await prisma.freeTemplate.findUnique({
        where: { id: contentId },
        select: { blobUrl: true },
      });
      downloadUrl = template?.blobUrl || null;
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
  } catch (error) {
    console.error("Download tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
