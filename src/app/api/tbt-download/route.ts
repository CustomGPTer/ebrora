// src/app/api/tbt-download/route.ts
// Generates PDF from HTML toolbox talk using headless Chrome
// Rate limited: 5 downloads per IP per day (server-side)

import { NextRequest, NextResponse } from "next/server";

// ─── In-memory rate limiter ──────────────────────────────────────────────────
// NOTE: This resets on cold starts. For production persistence, swap to
// Vercel KV: import { kv } from '@vercel/kv' and use kv.get/kv.set with TTL.
const DAILY_LIMIT = 5;
const downloadCounts = new Map<string, { count: number; date: string }>();

function getRateLimitKey(ip: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${ip}:${today}`;
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(ip);
  const today = new Date().toISOString().slice(0, 10);
  const entry = downloadCounts.get(key);

  if (!entry || entry.date !== today) {
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_LIMIT - entry.count - 1 };
}

function recordDownload(ip: string): void {
  const key = getRateLimitKey(ip);
  const today = new Date().toISOString().slice(0, 10);
  const entry = downloadCounts.get(key);

  if (!entry || entry.date !== today) {
    downloadCounts.set(key, { count: 1, date: today });
  } else {
    entry.count++;
  }

  // Cleanup old entries (keep memory tidy)
  for (const [k, v] of downloadCounts.entries()) {
    if (v.date !== today) downloadCounts.delete(k);
  }
}

// ─── PDF generation ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlFile, title } = body;

    if (!htmlFile || typeof htmlFile !== "string") {
      return NextResponse.json({ error: "Missing htmlFile parameter" }, { status: 400 });
    }

    // Validate filename to prevent path traversal
    if (!/^TBT-[A-Z]+-\d+-[\w-]+-toolbox-talk\.html$/.test(htmlFile)) {
      return NextResponse.json({ error: "Invalid file reference" }, { status: 400 });
    }

    // Rate limit check
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Daily download limit reached",
          remaining: 0,
          limit: DAILY_LIMIT,
          message: "You can download up to 5 toolbox talks per day. Downloads reset at midnight.",
        },
        {
          status: 429,
          headers: {
            "X-Downloads-Remaining": "0",
            "X-Downloads-Limit": String(DAILY_LIMIT),
          },
        }
      );
    }

    // Build the full URL for the HTML file
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ebrora.com";
    const htmlUrl = `${baseUrl}/toolbox-talks/${htmlFile}`;

    // Launch headless Chrome
    let browser;
    try {
      // Use @sparticuz/chromium for Vercel serverless
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } catch {
      // Fallback for local development: use regular puppeteer
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

      // Navigate to the HTML file
      await page.goto(htmlUrl, {
        waitUntil: "networkidle0",
        timeout: 15000,
      });

      // Generate PDF — margins set to 0 because the HTML files
      // handle their own A4 layout via @media print CSS
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });

      await browser.close();

      // Record the download against the IP
      recordDownload(ip);

      // Return the PDF
      const safeTitle = (title || "toolbox-talk")
        .replace(/[^a-zA-Z0-9 -]/g, "")
        .replace(/\s+/g, "-");

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
          "X-Downloads-Remaining": String(remaining),
          "X-Downloads-Limit": String(DAILY_LIMIT),
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

// GET handler for rate limit check (used by client to show remaining count)
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { remaining } = checkRateLimit(ip);

  return NextResponse.json({
    remaining,
    limit: DAILY_LIMIT,
  });
}
