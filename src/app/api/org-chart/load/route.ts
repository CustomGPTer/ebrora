// src/app/api/org-chart/load/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const record = await prisma.orgChart.findUnique({
      where: { userId: session.user.id },
    });

    if (!record || !record.blobUrl) {
      return NextResponse.json({ chartData: null, shareId: null });
    }

    // Check if expired
    if (new Date() > record.expiresAt) {
      return NextResponse.json({ chartData: null, shareId: null, expired: true });
    }

    // Fetch the JSON from blob
    const res = await fetch(record.blobUrl);
    if (!res.ok) {
      return NextResponse.json({ chartData: null, shareId: null });
    }

    const chartData = await res.json();

    return NextResponse.json({
      chartData,
      shareId: record.shareId,
      expiresAt: record.expiresAt,
    });
  } catch (error: any) {
    console.error("Org chart load error:", error);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}
