// src/app/api/org-chart/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { del } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function DELETE(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const record = await prisma.orgChart.findUnique({
      where: { userId: session.user.id },
    });

    if (!record) {
      return NextResponse.json({ success: true, message: "No chart to delete" });
    }

    // Delete blob
    if (record.blobUrl) {
      try { await del(record.blobUrl); } catch {}
    }

    // Delete any stored photo blobs
    if (record.photoBlobUrls) {
      const urls = record.photoBlobUrls as string[];
      for (const url of urls) {
        try { await del(url); } catch {}
      }
    }

    // Delete DB record
    await prisma.orgChart.delete({ where: { userId: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Org chart clear error:", error);
    return NextResponse.json({ error: "Clear failed" }, { status: 500 });
  }
}
