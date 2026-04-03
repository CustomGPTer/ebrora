// src/app/api/tbt-download/route.ts
// Generates PDF from HTML toolbox talk using headless Chrome.
// Auth required. Tier-based monthly limits enforced.
// IP rate limit kept as additional abuse prevention.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/constants";
import { resolveEffectiveTier } from "@/lib/payments/resolve-tier";

// ─── In-memory IP rate limiter (abuse prevention, not primary limit) ─────────
const IP_DAILY_LIMIT = 10; // generous daily cap per IP as abuse prevention
const downloadCounts = new Map<string, { count: number; date: string }>();

function checkIpRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ip}:${today}`;
  const entry = downloadCounts.get(key);

  if (!entry || entry.date !== today) {
    return { allowed: true, remaining: IP_DAILY_LIMIT - 1 };
  }
  if (entry.count >= IP_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: IP_DAILY_LIMIT - entry.count - 1 };
}

function recordIpDownload(ip: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ip}:${today}`;
  const entry = downloadCounts.get(key);

  if (!entry || entry.date !== today) {
    downloadCounts.set(key, { count: 1, date: today });
  } else {
    entry.count++;
  }

  // Cleanup old entries
  for (const [k, v] of downloadCounts.entries()) {
    if (v.date !== today) downloadCounts.delete(k);
  }
}

// ─── PDF generation ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Authentication required",
          code: "AUTH_REQUIRED",
          message: "Sign in to download toolbox talks. Free accounts get 2 downloads per month.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { htmlFile, title } = body;

    if (!htmlFile || typeof htmlFile !== "string") {
      return NextResponse.json({ error: "Missing htmlFile parameter" }, { status: 400 });
    }

    // Validate filename to prevent path traversal
    if (!/^TBT-[A-Z]+-\d+-[\w-]+-toolbox-talk\.html$/.test(htmlFile)) {
      return NextResponse.json({ error: "Invalid file reference" }, { status: 400 });
    }

    // Tier-based limit check (rolling 30-day window)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    const tier = resolveEffectiveTier(user?.subscription) as keyof typeof TIER_LIMITS;

    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
    const monthlyLimit = limits.tbtDownloadsPerMonth;

    if (typeof monthlyLimit === "number") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const count = await prisma.contentDownload.count({
        where: {
          userId: session.user.id,
          contentType: "TOOLBOX_TALK",
          downloadedAt: { gte: thirtyDaysAgo },
        },
      });

      if (count >= monthlyLimit) {
        return NextResponse.json(
          {
            error: "Monthly download limit reached",
            code: "LIMIT_REACHED",
            used: count,
            limit: monthlyLimit,
            tier,
            message: `You've used all ${monthlyLimit} toolbox talk downloads this month. Upgrade for more.`,
          },
          { status: 429 }
        );
      }
    }

    // IP abuse prevention (secondary)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed: ipAllowed } = checkIpRateLimit(ip);
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many downloads. Please try again tomorrow." },
        { status: 429 }
      );
    }

    // Build the full URL for the HTML file
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ebrora.com";
    const htmlUrl = `${baseUrl}/toolbox-talks/${htmlFile}`;

    // Launch headless Chrome
    let browser;
    try {
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } catch {
      try {
        const puppeteer = (await import("puppeteer-core")).default;
        browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          executablePath:
            process.platform === "win32"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : process.platform === "darwin"
              ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
              : "/usr/bin/google-chrome-stable",
        });
      } catch {
        return NextResponse.json(
          { error: "PDF generation unavailable. Use the Print button instead." },
          { status: 503 }
        );
      }
    }

    try {
      const page = await browser.newPage();

      await page.goto(htmlUrl, {
        waitUntil: "networkidle0",
        timeout: 15000,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      await browser.close();

      // Record the download — both IP and DB
      recordIpDownload(ip);

      // Record in contentDownload table for tier tracking
      try {
        await prisma.contentDownload.create({
          data: {
            contentType: "TOOLBOX_TALK",
            userId: session.user.id,
            email: user?.email || null,
            ipAddress: ip,
          },
        });
      } catch (dbErr) {
        console.warn("Failed to record TBT download in DB:", dbErr);
        // Don't fail the download if DB write fails
      }

      // Return the PDF
      const safeTitle = (title || "toolbox-talk")
        .replace(/[^a-zA-Z0-9 -]/g, "")
        .replace(/\s+/g, "-");

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      await browser.close();
      console.error("PDF generation error:", err);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("TBT download error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET handler for remaining downloads check
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ remaining: 0, limit: 0, authenticated: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });

  const tier = resolveEffectiveTier(user?.subscription) as keyof typeof TIER_LIMITS;

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
  const monthlyLimit = limits.tbtDownloadsPerMonth;

  if (typeof monthlyLimit !== "number") {
    return NextResponse.json({ remaining: 999, limit: "unlimited", authenticated: true });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const count = await prisma.contentDownload.count({
    where: {
      userId: session.user.id,
      contentType: "TOOLBOX_TALK",
      downloadedAt: { gte: thirtyDaysAgo },
    },
  });

  return NextResponse.json({
    remaining: Math.max(0, monthlyLimit - count),
    limit: monthlyLimit,
    used: count,
    tier,
    authenticated: true,
  });
}
