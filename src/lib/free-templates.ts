// src/lib/free-templates.ts
// FILE-BASED TEMPLATE SCANNER
// Reads /public/free-templates/ at build time to discover all templates.
// No database required — the folder structure IS the data.
//
// FOLDER CONVENTION:
//   /public/free-templates/{category-slug}/{subcategory-slug}/{filename}.xlsx
//   /public/free-templates/{category-slug}/{subcategory-slug}/_meta.json   (optional)
//   /public/free-templates/{category-slug}/{subcategory-slug}/{filename}.preview.png (optional)
//
// SUPPORTED FILE TYPES:
//   .xlsx, .xlsm, .docx, .pptx, .pdf
//
// TITLE GENERATION:
//   1. If _meta.json exists with a "files" key containing the filename, use that title
//   2. Otherwise: strip extension, replace dashes with spaces, title-case each word

import fs from "fs";
import path from "path";
import {
  FT_CATEGORIES,
  getCategoryBySlug,
  getSubcategoryBySlug,
} from "@/data/free-template-categories";
import type { FtCategory, FtSubcategory } from "@/data/free-template-categories";

// ── Types ──

export interface FtTemplateFile {
  /** Display title (from _meta.json or auto-generated from filename) */
  title: string;
  /** URL-safe slug derived from filename without extension */
  slug: string;
  /** Original filename with extension */
  fileName: string;
  /** File extension without dot, lowercase: xlsx, xlsm, docx, pptx, pdf */
  fileType: string;
  /** Human-readable file type label */
  fileTypeLabel: string;
  /** File size in bytes */
  fileSize: number;
  /** SEO description (from _meta.json or auto-generated) */
  description: string;
  /** SEO keywords (from _meta.json or empty) */
  keywords: string;
  /** Path relative to /public/ for direct download */
  publicPath: string;
  /** Whether a .preview.png exists alongside the file */
  hasPreview: boolean;
  /** Path to preview image relative to /public/ (if exists) */
  previewPath: string | null;
  /** Parent category slug */
  categorySlug: string;
  /** Parent subcategory slug */
  subcategorySlug: string;
  /** Full URL path: /free-templates/{cat}/{subcat}/{slug} */
  href: string;
}

export interface FtSubcategoryWithFiles {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  templates: FtTemplateFile[];
  href: string;
}

export interface FtCategoryWithFiles {
  name: string;
  slug: string;
  description: string;
  order: number;
  subcategories: FtSubcategoryWithFiles[];
  totalTemplates: number;
  href: string;
}

interface MetaJson {
  /** Override title for the folder (subcategory) level */
  title?: string;
  /** Override description for the folder (subcategory) level */
  description?: string;
  /** Override keywords for the folder (subcategory) level */
  keywords?: string;
  /** Per-file overrides keyed by filename */
  files?: Record<
    string,
    {
      title?: string;
      description?: string;
      keywords?: string;
    }
  >;
}

// ── Constants ──

const SUPPORTED_EXTENSIONS = new Set([
  ".xlsx",
  ".xlsm",
  ".docx",
  ".pptx",
  ".pdf",
]);

const FILE_TYPE_LABELS: Record<string, string> = {
  xlsx: "Excel",
  xlsm: "Excel (Macros)",
  docx: "Word",
  pptx: "PowerPoint",
  pdf: "PDF",
};

const BASE_DIR = path.join(process.cwd(), "data", "free-templates");

// ── Utility functions ──

/** Convert "fire-risk-assessment-checklist" → "Fire Risk Assessment Checklist" */
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => {
      // Keep short words lowercase unless first word
      const lower = word.toLowerCase();
      if (["and", "or", "the", "in", "on", "of", "for", "to", "a"].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    // Capitalise first word regardless
    .replace(/^./, (c) => c.toUpperCase());
}

/** Read and parse _meta.json from a directory, returns null if not found */
function readMeta(dirPath: string): MetaJson | null {
  const metaPath = path.join(dirPath, "_meta.json");
  try {
    if (fs.existsSync(metaPath)) {
      const raw = fs.readFileSync(metaPath, "utf-8");
      return JSON.parse(raw) as MetaJson;
    }
  } catch {
    // Silently ignore malformed _meta.json
  }
  return null;
}

/** Get file size in bytes, returns 0 if file doesn't exist */
function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/** Check if a preview image exists for a given file */
function findPreview(filePath: string): string | null {
  // Convention: {filename}.preview.png alongside the file
  const previewPath = filePath + ".preview.png";
  if (fs.existsSync(previewPath)) {
    return previewPath;
  }
  // Also check for .preview.jpg
  const jpgPath = filePath + ".preview.jpg";
  if (fs.existsSync(jpgPath)) {
    return jpgPath;
  }
  return null;
}

// ── Core scanning functions ──

/**
 * Scan a subcategory directory for template files.
 * Returns an array of FtTemplateFile objects.
 */
function scanSubcategoryDir(
  dirPath: string,
  categorySlug: string,
  subcategorySlug: string,
  meta: MetaJson | null
): FtTemplateFile[] {
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const templates: FtTemplateFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    // Skip preview images and _meta.json
    if (entry.name.includes(".preview.")) continue;
    if (entry.name === "_meta.json") continue;

    const fileNameNoExt = path.basename(entry.name, ext);
    const slug = fileNameNoExt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const fileType = ext.slice(1); // remove the dot
    const filePath = path.join(dirPath, entry.name);
    const fileSize = getFileSize(filePath);
    const preview = findPreview(filePath);

    // Title: check _meta.json files override first, then auto-generate
    const fileMeta = meta?.files?.[entry.name];
    const title = fileMeta?.title || slugToTitle(fileNameNoExt);
    const description =
      fileMeta?.description ||
      `Free ${FILE_TYPE_LABELS[fileType] || fileType.toUpperCase()} template: ${title}. Download for UK construction sites.`;
    const keywords = fileMeta?.keywords || "";

    // Public path for download (relative to /public/)
    const publicPath = `/free-templates/${categorySlug}/${subcategorySlug}/${entry.name}`;

    // Preview path (relative to /public/)
    const previewPath = preview
      ? `/free-templates/${categorySlug}/${subcategorySlug}/${path.basename(preview)}`
      : null;

    templates.push({
      title,
      slug,
      fileName: entry.name,
      fileType,
      fileTypeLabel: FILE_TYPE_LABELS[fileType] || fileType.toUpperCase(),
      fileSize,
      description,
      keywords,
      publicPath,
      hasPreview: !!preview,
      previewPath,
      categorySlug,
      subcategorySlug,
      href: `/free-templates/${categorySlug}/${subcategorySlug}/${slug}`,
    });
  }

  // Sort alphabetically by title
  templates.sort((a, b) => a.title.localeCompare(b.title));

  return templates;
}

/**
 * Scan all categories and subcategories, returning the full data structure.
 * Called at build time by page components.
 */
export function scanAllTemplates(): FtCategoryWithFiles[] {
  const results: FtCategoryWithFiles[] = [];

  for (const cat of FT_CATEGORIES) {
    const catDir = path.join(BASE_DIR, cat.slug);
    const subcats: FtSubcategoryWithFiles[] = [];

    for (const subcat of cat.subcategories) {
      const subcatDir = path.join(catDir, subcat.slug);
      const meta = readMeta(subcatDir);
      const templates = scanSubcategoryDir(subcatDir, cat.slug, subcat.slug, meta);

      subcats.push({
        name: meta?.title || subcat.name,
        slug: subcat.slug,
        description: meta?.description || subcat.description,
        categorySlug: cat.slug,
        templates,
        href: `/free-templates/${cat.slug}/${subcat.slug}`,
      });
    }

    const totalTemplates = subcats.reduce((sum, sc) => sum + sc.templates.length, 0);

    results.push({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      order: cat.order,
      subcategories: subcats,
      totalTemplates,
      href: `/free-templates/${cat.slug}`,
    });
  }

  return results;
}

/**
 * Get a single category with all its subcategories and templates.
 */
export function getCategoryWithFiles(categorySlug: string): FtCategoryWithFiles | null {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return null;

  const catDir = path.join(BASE_DIR, cat.slug);
  const subcats: FtSubcategoryWithFiles[] = [];

  for (const subcat of cat.subcategories) {
    const subcatDir = path.join(catDir, subcat.slug);
    const meta = readMeta(subcatDir);
    const templates = scanSubcategoryDir(subcatDir, cat.slug, subcat.slug, meta);

    subcats.push({
      name: meta?.title || subcat.name,
      slug: subcat.slug,
      description: meta?.description || subcat.description,
      categorySlug: cat.slug,
      templates,
      href: `/free-templates/${cat.slug}/${subcat.slug}`,
    });
  }

  const totalTemplates = subcats.reduce((sum, sc) => sum + sc.templates.length, 0);

  return {
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    order: cat.order,
    subcategories: subcats,
    totalTemplates,
    href: `/free-templates/${cat.slug}`,
  };
}

/**
 * Get a single subcategory with its templates.
 */
export function getSubcategoryWithFiles(
  categorySlug: string,
  subcategorySlug: string
): FtSubcategoryWithFiles | null {
  const cat = getCategoryBySlug(categorySlug);
  const subcat = getSubcategoryBySlug(categorySlug, subcategorySlug);
  if (!cat || !subcat) return null;

  const subcatDir = path.join(BASE_DIR, cat.slug, subcat.slug);
  const meta = readMeta(subcatDir);
  const templates = scanSubcategoryDir(subcatDir, cat.slug, subcat.slug, meta);

  return {
    name: meta?.title || subcat.name,
    slug: subcat.slug,
    description: meta?.description || subcat.description,
    categorySlug: cat.slug,
    templates,
    href: `/free-templates/${cat.slug}/${subcat.slug}`,
  };
}

/**
 * Get a single template file by its slug within a subcategory.
 */
export function getTemplateBySlug(
  categorySlug: string,
  subcategorySlug: string,
  templateSlug: string
): FtTemplateFile | null {
  const subcat = getSubcategoryWithFiles(categorySlug, subcategorySlug);
  if (!subcat) return null;
  return subcat.templates.find((t) => t.slug === templateSlug) || null;
}

/**
 * Get total template count across all categories.
 */
export function getTotalTemplateCount(): number {
  const all = scanAllTemplates();
  return all.reduce((sum, cat) => sum + cat.totalTemplates, 0);
}

/**
 * Get all template files as a flat array (for search, sitemap, etc.)
 */
export function getAllTemplatesFlat(): FtTemplateFile[] {
  const all = scanAllTemplates();
  return all.flatMap((cat) => cat.subcategories.flatMap((sc) => sc.templates));
}

/**
 * Format file size for display: "1.2 MB", "450 KB", etc.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
