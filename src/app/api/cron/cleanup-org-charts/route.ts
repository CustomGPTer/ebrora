// src/app/api/cron/cleanup-org-charts/route.ts
// Deletes expired org charts from Vercel Blob (3-month expiry)
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/cleanup-org-charts", "schedule": "0 3 * * *" }] }
import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const expired = await prisma.orgChart.findMany({
      where: { expiresAt: { lt: new Date() } },
    });

    let deleted = 0;
    let errors = 0;

    for (const chart of expired) {
      try {
        if (chart.blobUrl) await del(chart.blobUrl);
        if (chart.photoBlobUrls) {
          for (const url of chart.photoBlobUrls as string[]) {
            try { await del(url); } catch {}
          }
        }
        await prisma.orgChart.delete({ where: { id: chart.id } });
        deleted++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ deleted, errors, total: expired.length });
  } catch (error: any) {
    console.error("Org chart cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
