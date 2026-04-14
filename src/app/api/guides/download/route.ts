// src/app/api/guides/download/route.ts
// Checks auth + subscription tier for guide PDF downloads.
// Returns download URL for paid users; 401/403 for free/unauthenticated.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveTier } from "@/lib/payments/resolve-tier";

// Tiers that can download guide PDFs
const PAID_TIERS = new Set(["STARTER", "STANDARD", "PROFESSIONAL", "UNLIMITED"]);

// Map guide slugs to their PDF file paths (add entries as PDFs are generated)
const GUIDE_PDFS: Record<string, string> = {
  "wwtw-design-safety-quality": "/guides/wwtw-design-safety-quality-guide.pdf",
};

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug || !GUIDE_PDFS[slug]) {
      return NextResponse.json(
        { error: "Guide not found" },
        { status: 404 }
      );
    }

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
    });

    const tier = resolveEffectiveTier(subscription);

    if (!PAID_TIERS.has(tier)) {
      return NextResponse.json(
        { error: "Upgrade required", code: "UPGRADE_REQUIRED", tier },
        { status: 403 }
      );
    }

    // Return download URL
    return NextResponse.json({
      downloadUrl: GUIDE_PDFS[slug],
      tier,
    });
  } catch (error) {
    console.error("Guide download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
