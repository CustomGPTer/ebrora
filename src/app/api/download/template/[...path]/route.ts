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
import type { SubscriptionTier } from "@prisma/client";

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
            "Sign in to download free templates. Free accounts get 5 downloads per month.",
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

    const tier: SubscriptionTier = user.subscription?.tier || "FREE";
    const tierLimits = TIER_LIMITS[tier];

    const monthlyLimit =
      "templateDownloadsPerMonth" in tierLimits
        ? (tierLimits as Record<string, unknown>)
            .templateDownloadsPerMonth as number
        : 5;

    const now = new Date();
    let periodStart: Date;

    if (user.subscription?.current_period_start) {
      periodStart = new Date(user.subscription.current_period_start);
      while (periodStart < now) {
        const next = new Date(periodStart);
        next.setMonth(next.getMonth() + 1);
        if (next > now) break;
        periodStart = next;
      }
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const downloadsThisPeriod = await prisma.contentDownload.count({
      where: {
        userId,
        contentType: "FREE_TEMPLATE",
        downloadedAt: {
          gte: periodStart,
        },
      },
    });

    if (downloadsThisPeriod >= monthlyLimit) {
      const nextReset = new Date(periodStart);
      nextReset.setMonth(nextReset.getMonth() + 1);

      return NextResponse.json(
        {
          error: "Monthly download limit reached",
          code: "LIMIT_REACHED",
          used: downloadsThisPeriod,
          limit: monthlyLimit,
          tier,
          resetsAt: nextReset.toISOString(),
          message: `You've used all ${monthlyLimit} of your free template downloads this month. Upgrade for more, or come back after ${nextReset.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`,
        },
        { status: 429 }
      );
    }

    await prisma.contentDownload.create({
      data: {
        contentType: "FREE_TEMPLATE",
        userId,
        email: user.email,
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown",
      },
    });

    const downloadUrl = template.publicPath;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: template.fileName,
      remaining: monthlyLimit - downloadsThisPeriod - 1,
      limit: monthlyLimit,
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
