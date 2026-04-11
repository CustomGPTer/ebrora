// src/app/api/org-chart/public/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const shareId = req.nextUrl.searchParams.get("id");
    if (!shareId) {
      return NextResponse.json({ error: "Missing share ID" }, { status: 400 });
    }

    const record = await prisma.orgChart.findUnique({
      where: { shareId },
    });

    if (!record || !record.blobUrl) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "Chart has expired" }, { status: 410 });
    }

    const res = await fetch(record.blobUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Chart data unavailable" }, { status: 404 });
    }

    const chartData = await res.json();
    return NextResponse.json({ chartData });
  } catch (error: any) {
    console.error("Public org chart error:", error);
    return NextResponse.json({ error: "Failed to load chart" }, { status: 500 });
  }
}
