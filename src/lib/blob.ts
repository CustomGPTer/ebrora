// src/lib/blob.ts
// Vercel Blob storage utility for file uploads and management

import { put, del, list, head } from "@vercel/blob";

/**
 * Upload a file to Vercel Blob storage
 * Returns the blob URL and metadata
 */
export async function uploadToBlob(
  file: File | Buffer,
  pathname: string,
  options?: {
    contentType?: string;
    access?: "public";
  }
) {
  try {
    const blob = await put(pathname, file, {
      access: options?.access || "public",
      contentType: options?.contentType,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  } catch (error) {
    console.error("Blob upload error:", error);
    return {
      success: false,
      url: null,
      pathname: null,
      contentType: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFromBlob(url: string) {
  try {
    await del(url);
    return { success: true };
  } catch (error) {
    console.error("Blob delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * List files in Vercel Blob storage with optional prefix filter
 */
export async function listBlobs(prefix?: string) {
  try {
    const result = await list({ prefix });
    return {
      success: true,
      blobs: result.blobs,
      hasMore: result.hasMore,
      cursor: result.cursor,
    };
  } catch (error) {
    console.error("Blob list error:", error);
    return {
      success: false,
      blobs: [],
      hasMore: false,
      cursor: null,
      error: error instanceof Error ? error.message : "List failed",
    };
  }
}

/**
 * Get metadata for a specific blob
 */
export async function getBlobMetadata(url: string) {
  try {
    const metadata = await head(url);
    return {
      success: true,
      ...metadata,
    };
  } catch (error) {
    console.error("Blob head error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Head request failed",
    };
  }
}

/**
 * Generate a structured pathname for content uploads
 *
 * Examples:
 *   getContentPath("toolbox-talks", "fire-safety", "fire-extinguisher-types.pdf")
 *   => "toolbox-talks/fire-safety/fire-extinguisher-types.pdf"
 *
 *   getContentPath("free-templates", "excel/health-and-safety", "risk-assessment.xlsx")
 *   => "free-templates/excel/health-and-safety/risk-assessment.xlsx"
 */
export function getContentPath(
  section: "toolbox-talks" | "free-templates",
  category: string,
  filename: string
): string {
  // Sanitise filename: lowercase, replace spaces with hyphens, remove special chars
  const sanitised = filename
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "");

  return `${section}/${category}/${sanitised}`;
}

/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
