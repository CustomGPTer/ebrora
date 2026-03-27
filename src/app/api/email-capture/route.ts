// src/app/api/email-capture/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 captures per IP per hour
    const ip = getClientIp(request);
    const { allowed } = rateLimit(ip, "email-capture", RATE_LIMITS.emailCapture);
    if (!allowed) {
      // Silently accept to avoid leaking rate limit info
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { email, source, sourceId } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if already captured from this source
    const existing = await prisma.emailCapture.findFirst({
      where: {
        email: trimmedEmail,
        source: source || null,
      },
    });

    if (!existing) {
      await prisma.emailCapture.create({
        data: {
          email: trimmedEmail,
          source: source || null,
          sourceId: sourceId || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email capture error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
