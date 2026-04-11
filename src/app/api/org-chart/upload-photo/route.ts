// src/app/api/org-chart/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_SIZE = 0.5 * 1024 * 1024; // 0.5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          message:
            "Photo must be under 0.5 MB. Try resizing at https://imageresizer.com or https://tinypng.com (both free).",
        },
        { status: 413 }
      );
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const pathname = `org-charts/photos/${session.user.id}/${Date.now()}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
