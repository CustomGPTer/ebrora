// src/lib/free-templates.ts
// FILE-BASED TEMPLATE SCANNER — FLAT FOLDER CONVENTION
// Reads /data/free-templates/ at build time to discover all templates.
// No database required — the folder IS the data.
//
// FLAT FILENAME CONVENTION:
//   /data/free-templates/{category-slug}--{subcategory-slug}--{template-name}.xlsx
//
// Drop a file into data/free-templates/ using the -- convention and it
// automatically appears in the correct category and subcategory on the site.
//
// SUPPORTED FILE TYPES:
//   .xlsx, .xlsm, .docx, .pptx, .pdf
//
// TITLE GENERATION:
//   Strip the category and subcategory prefixes, remove extension,
//   replace dashes with spaces, title-case each word.

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
  /** Display title (auto-generated from filename) */
  title: string;
  /** URL-safe slug derived from template-name portion of filename */
  slug: string;
  /** Original full filename with extension (e.g. cat--subcat--name.xlsx) */
  fileName: string;
  /** File extension without dot, lowercase: xlsx, xlsm, docx, pptx, pdf */
  fileType: string;
  /** Human-readable file type label */
  fileTypeLabel: string;
  /** File size in bytes */
  fileSize: number;
  /** SEO description (auto-generated) */
  description: string;
  /** SEO keywords */
  keywords: string;
  /** Download API path */
  publicPath: string;
  /** Whether a .preview.png exists alongside the file */
  hasPreview: boolean;
  /** Path to preview image (if exists) */
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
      const lower = word.toLowerCase();
      if (["and", "or", "the", "in", "on", "of", "for", "to", "a"].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
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
  const previewPath = filePath + ".preview.png";
  if (fs.existsSync(previewPath)) {
    return previewPath;
  }
  const jpgPath = filePath + ".preview.jpg";
  if (fs.existsSync(jpgPath)) {
    return jpgPath;
  }
  return null;
}

// ── Parsed flat file entry ──

interface ParsedFlatFile {
  categorySlug: string;
  subcategorySlug: string;
  templateNameSlug: string;
  fileName: string;
  ext: string;
  filePath: string;
}

/**
 * Parse a flat filename like "civils-and-earthworks--concrete-works--concrete-cube-test-results-log.xlsx"
 * Returns null if the filename doesn't match the convention or has an unsupported extension.
 */
function parseFlatFilename(fileName: string): ParsedFlatFile | null {
  const ext = path.extname(fileName).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return null;

  const nameNoExt = path.basename(fileName, ext);
  const parts = nameNoExt.split("--");
  if (parts.length < 3) return null;

  // First segment = category slug, second = subcategory slug,
  // remaining segments (joined back with --) = template name
  const categorySlug = parts[0].trim();
  const subcategorySlug = parts[1].trim();
  const templateNameSlug = parts.slice(2).join("--").trim();

  if (!categorySlug || !subcategorySlug || !templateNameSlug) return null;

  return {
    categorySlug,
    subcategorySlug,
    templateNameSlug,
    fileName,
    ext,
    filePath: path.join(BASE_DIR, fileName),
  };
}

/**
 * Scan the flat data/free-templates/ directory and build a lookup map:
 * Map<categorySlug, Map<subcategorySlug, FtTemplateFile[]>>
 */
function scanFlatDir(): Map<string, Map<string, FtTemplateFile[]>> {
  const result = new Map<string, Map<string, FtTemplateFile[]>>();

  if (!fs.existsSync(BASE_DIR)) return result;

  const entries = fs.readdirSync(BASE_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".")) continue;
    if (entry.name.includes(".preview.")) continue;

    const parsed = parseFlatFilename(entry.name);
    if (!parsed) continue;

    const { categorySlug, subcategorySlug, templateNameSlug, fileName, ext, filePath } = parsed;

    const fileType = ext.slice(1);
    const fileSize = getFileSize(filePath);
    const preview = findPreview(filePath);
    const slug = templateNameSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const title = slugToTitle(templateNameSlug);
    const description = `Free ${FILE_TYPE_LABELS[fileType] || fileType.toUpperCase()} template: ${title}. Download for UK construction sites.`;

    const previewPath = preview
      ? `/free-templates/previews/${path.basename(preview)}`
      : null;

    const template: FtTemplateFile = {
      title,
      slug,
      fileName,
      fileType,
      fileTypeLabel: FILE_TYPE_LABELS[fileType] || fileType.toUpperCase(),
      fileSize,
      description,
      keywords: "",
      publicPath: `/api/download/template/${categorySlug}/${subcategorySlug}/${slug}`,
      hasPreview: !!preview,
      previewPath,
      categorySlug,
      subcategorySlug,
      href: `/free-templates/${categorySlug}/${subcategorySlug}/${slug}`,
    };

    // Insert into nested map
    if (!result.has(categorySlug)) {
      result.set(categorySlug, new Map());
    }
    const catMap = result.get(categorySlug)!;
    if (!catMap.has(subcategorySlug)) {
      catMap.set(subcategorySlug, []);
    }
    catMap.get(subcategorySlug)!.push(template);
  }

  // Sort templates within each subcategory
  for (const catMap of result.values()) {
    for (const templates of catMap.values()) {
      templates.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  return result;
}

// ── Core scanning functions ──

/**
 * Scan all categories and subcategories, returning the full data structure.
 * Called at build time by page components.
 */
export function scanAllTemplates(): FtCategoryWithFiles[] {
  const flatMap = scanFlatDir();
  const results: FtCategoryWithFiles[] = [];

  for (const cat of FT_CATEGORIES) {
    const catFiles = flatMap.get(cat.slug);
    const subcats: FtSubcategoryWithFiles[] = [];

    for (const subcat of cat.subcategories) {
      const templates = catFiles?.get(subcat.slug) || [];

      subcats.push({
        name: subcat.name,
        slug: subcat.slug,
        description: subcat.description,
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

  const flatMap = scanFlatDir();
  const catFiles = flatMap.get(cat.slug);
  const subcats: FtSubcategoryWithFiles[] = [];

  for (const subcat of cat.subcategories) {
    const templates = catFiles?.get(subcat.slug) || [];

    subcats.push({
      name: subcat.name,
      slug: subcat.slug,
      description: subcat.description,
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

  const flatMap = scanFlatDir();
  const templates = flatMap.get(cat.slug)?.get(subcat.slug) || [];

  return {
    name: subcat.name,
    slug: subcat.slug,
    description: subcat.description,
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
