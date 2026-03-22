// src/app/api/usage/template/route.ts
// USAGE CHECK API — Returns current template download usage for logged-in user
// Used by the TemplatePreviewClient to display the "remaining downloads" counter

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/constants";
import type { SubscriptionTier } from "@prisma/client";

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

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        used: 0,
        limit: 5,
        remaining: 5,
        tier: "FREE",
      });
    }

    const tier: SubscriptionTier = user.subscription?.tier || "FREE";
    const tierLimits = TIER_LIMITS[tier];
    const monthlyLimit =
      "templateDownloadsPerMonth" in tierLimits
        ? (tierLimits as Record<string, unknown>)
            .templateDownloadsPerMonth as number
        : 5;

    // Calculate period start
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
        downloadedAt: { gte: periodStart },
      },
    });

    // Next reset date
    const nextReset = new Date(periodStart);
    nextReset.setMonth(nextReset.getMonth() + 1);

    return NextResponse.json({
      authenticated: true,
      used: downloadsThisPeriod,
      limit: monthlyLimit,
      remaining: Math.max(0, monthlyLimit - downloadsThisPeriod),
      tier,
      resetsAt: nextReset.toISOString(),
    });
  } catch (error) {
    console.error("Usage check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
