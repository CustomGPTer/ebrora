// src/app/api/org-chart/save/route.ts
// Saves org chart JSON data to Vercel Blob with 3-month rolling expiry
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import prisma from "@/lib/prisma";

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { chartData } = await req.json();
    if (!chartData) {
      return NextResponse.json({ error: "Missing chartData" }, { status: 400 });
    }

    const userId = session.user.id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + THREE_MONTHS_MS);

    // Check for existing chart — delete old blob if exists
    const existing = await prisma.orgChart.findUnique({
      where: { userId },
      select: { blobUrl: true },
    });

    if (existing?.blobUrl) {
      try {
        await del(existing.blobUrl);
      } catch {
        // Old blob may already be gone
      }
    }

    // Upload new chart JSON to blob
    const jsonBuffer = Buffer.from(JSON.stringify(chartData), "utf-8");
    const blob = await put(
      `org-charts/${userId}/${Date.now()}.json`,
      jsonBuffer,
      { access: "public", contentType: "application/json" }
    );

    // Collect photo URLs for cleanup tracking
    const photoUrls = (chartData.people || [])
      .map((p: any) => p.photo)
      .filter((url: string) => url && url.startsWith("http"));

    // Upsert the DB record
    const record = await prisma.orgChart.upsert({
      where: { userId },
      create: {
        userId,
        blobUrl: blob.url,
        photoBlobUrls: photoUrls,
        lastSavedAt: now,
        expiresAt,
      },
      update: {
        blobUrl: blob.url,
        photoBlobUrls: photoUrls,
        lastSavedAt: now,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      shareId: record.shareId,
      expiresAt: record.expiresAt,
    });
  } catch (error: any) {
    console.error("Org chart save error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
