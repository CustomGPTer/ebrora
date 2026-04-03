// src/app/api/usage/template/route.ts
// USAGE CHECK API — Returns current template download usage for logged-in user
// Used by the TemplatePreviewClient to display the "remaining downloads" counter
//
// IMPORTANT: The window calculation here MUST match the enforcement in
// /api/download/template/[...path]/route.ts — both use a rolling 30-day window.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/constants";
import { resolveEffectiveTier } from "@/lib/payments/resolve-tier";

const ROLLING_DAYS = 30;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        authenticated: false,
        used: 0,
        limit: 0,
        remaining: 0,
        tier: null,
      });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const tier = resolveEffectiveTier(user?.subscription ?? null);
    const tierLimits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
    const monthlyLimit = tierLimits.templateDownloadsPerMonth;

    // Rolling 30-day window — matches enforcement in /api/download/template/[...path]
    const thirtyDaysAgo = new Date(Date.now() - ROLLING_DAYS * 24 * 60 * 60 * 1000);

    const downloadsThisPeriod = await prisma.contentDownload.count({
      where: {
        userId,
        contentType: "FREE_TEMPLATE",
        downloadedAt: { gte: thirtyDaysAgo },
      },
    });

    // For rolling windows, "resets" = when the oldest download in the window ages out.
    // Only relevant when the user is at or near their limit.
    let resetsAt: string | null = null;

    if (downloadsThisPeriod >= monthlyLimit) {
      const oldest = await prisma.contentDownload.findFirst({
        where: {
          userId,
          contentType: "FREE_TEMPLATE",
          downloadedAt: { gte: thirtyDaysAgo },
        },
        orderBy: { downloadedAt: "asc" },
        select: { downloadedAt: true },
      });

      if (oldest) {
        const resetDate = new Date(oldest.downloadedAt.getTime() + ROLLING_DAYS * 24 * 60 * 60 * 1000);
        resetsAt = resetDate.toISOString();
      }
    }

    return NextResponse.json({
      authenticated: true,
      used: downloadsThisPeriod,
      limit: monthlyLimit,
      remaining: Math.max(0, monthlyLimit - downloadsThisPeriod),
      tier,
      ...(resetsAt ? { resetsAt } : {}),
    });
  } catch (error) {
    console.error("Usage check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
