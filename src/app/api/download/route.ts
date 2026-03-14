// src/app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, contentId, email, userId } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "contentType and contentId are required" },
        { status: 400 }
      );
    }

    // Validate contentType
    if (!["TOOLBOX_TALK", "FREE_TEMPLATE"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid contentType" },
        { status: 400 }
      );
    }

    // Get client IP for basic tracking
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Build download record
    const data: {
      contentType: ContentType;
      email?: string;
      userId?: string;
      ipAddress: string;
      toolboxTalkId?: string;
      freeTemplateId?: string;
    } = {
      contentType: contentType as ContentType,
      email: email || null,
      userId: userId || null,
      ipAddress,
    };

    if (contentType === "TOOLBOX_TALK") {
      data.toolboxTalkId = contentId;
    } else if (contentType === "FREE_TEMPLATE") {
      data.freeTemplateId = contentId;
    }

    await prisma.contentDownload.create({ data });

    // Look up the blob URL to return
    let downloadUrl: string | null = null;

    if (contentType === "TOOLBOX_TALK") {
      const talk = await prisma.toolboxTalk.findUnique({
        where: { id: contentId },
        select: { blobUrl: true },
      });
      downloadUrl = talk?.blobUrl || null;
    } else if (contentType === "FREE_TEMPLATE") {
      const template = await prisma.freeTemplate.findUnique({
        where: { id: contentId },
        select: { blobUrl: true },
      });
      downloadUrl = template?.blobUrl || null;
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
  } catch (error) {
    console.error("Download tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
