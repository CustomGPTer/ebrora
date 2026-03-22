// src/app/free-templates/[category]/[subcategory]/[template]/page.tsx
// INDIVIDUAL TEMPLATE PAGE — A4 preview viewer + download button
// e.g. /free-templates/health-and-safety/fire-safety/fire-risk-assessment-checklist
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTemplateBySlug,
  getSubcategoryWithFiles,
  formatFileSize,
} from "@/lib/free-templates";
import {
  FT_CATEGORIES,
  getCategoryBySlug,
  getSubcategoryBySlug,
} from "@/data/free-template-categories";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import {
  RAMS_BUILDER_UPSELL,
  DEFAULT_PRODUCT_UPSELL,
} from "@/data/upsell-config";
import { TemplatePreviewClient } from "@/components/free-templates/TemplatePreviewClient";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    template: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    category: catSlug,
    subcategory: subSlug,
    template: tplSlug,
  } = await params;
  const cat = getCategoryBySlug(catSlug);
  const subcat = getSubcategoryBySlug(catSlug, subSlug);
  const template = getTemplateBySlug(catSlug, subSlug, tplSlug);
  if (!cat || !subcat || !template) return { title: "Not Found | Ebrora" };

  const title = template.title.includes("Ebrora")
    ? template.title
    : `${template.title} | Free Download | Ebrora`;
  const description = template.description;

  return {
    title: { absolute: title },
    description,
    keywords: template.keywords || undefined,
    alternates: {
      canonical: `https://www.ebrora.com${template.href}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.ebrora.com${template.href}`,
      type: "website",
      images: template.previewPath
        ? [
            {
              url: `https://www.ebrora.com${template.previewPath}`,
              width: 595,
              height: 842,
            },
          ]
        : [
            {
              url: "https://www.ebrora.com/og-image.jpg",
              width: 1200,
              height: 630,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: template.previewPath
        ? [`https://www.ebrora.com${template.previewPath}`]
        : ["https://www.ebrora.com/og-image.jpg"],
    },
  };
}

export function generateStaticParams() {
  const params: Array<{
    category: string;
    subcategory: string;
    template: string;
  }> = [];

  for (const cat of FT_CATEGORIES) {
    for (const subcat of cat.subcategories) {
      const sc = getSubcategoryWithFiles(cat.slug, subcat.slug);
      if (sc) {
        for (const tpl of sc.templates) {
          params.push({
            category: cat.slug,
            subcategory: subcat.slug,
            template: tpl.slug,
          });
        }
      }
    }
  }

  return params;
}

/** File type colour classes */
const FILE_BADGE: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  xlsx: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "📊" },
  xlsm: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "📊" },
  docx: { bg: "bg-blue-50", text: "text-blue-600", icon: "📄" },
  pptx: { bg: "bg-orange-50", text: "text-orange-600", icon: "📽️" },
  pdf: { bg: "bg-red-50", text: "text-red-500", icon: "📕" },
};

export default async function TemplatePage({ params }: PageProps) {
  const {
    category: catSlug,
    subcategory: subSlug,
    template: tplSlug,
  } = await params;
  const cat = getCategoryBySlug(catSlug);
  const subcat = getSubcategoryBySlug(catSlug, subSlug);
  const template = getTemplateBySlug(catSlug, subSlug, tplSlug);
  if (!cat || !subcat || !template) notFound();

  const badge = FILE_BADGE[template.fileType] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    icon: "📎",
  };

  // Get related templates from same subcategory (excluding current)
  const subcatData = getSubcategoryWithFiles(catSlug, subSlug);
  const relatedTemplates = (subcatData?.templates || [])
    .filter((t) => t.slug !== template.slug)
    .slice(0, 3);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Free Templates", href: "/free-templates" },
            { label: cat.name, href: `/free-templates/${catSlug}` },
            {
              label: subcat.name,
              href: `/free-templates/${catSlug}/${subSlug}`,
            },
            { label: template.title },
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main content area */}
          <div className="flex-1 min-w-0">
            {/* Title bar */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-14 h-14 rounded-xl ${badge.bg} flex items-center justify-center shrink-0`}
              >
                <span className="text-2xl">{badge.icon}</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {template.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}
                  >
                    .{template.fileType}
                  </span>
                  <span className="text-xs text-gray-400">
                    {template.fileTypeLabel}
                  </span>
                  {template.fileSize > 0 && (
                    <span className="text-xs text-gray-400">
                      {formatFileSize(template.fileSize)}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1B5745] bg-[#1B5745]/8 px-2 py-0.5 rounded-full">
                    Free
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {template.description}
            </p>

            {/* A4 Preview Viewer — Client component handles auth-based watermarking */}
            <TemplatePreviewClient
              templateTitle={template.title}
              previewPath={template.previewPath}
              publicPath={template.publicPath}
              fileType={template.fileType}
              fileTypeLabel={template.fileTypeLabel}
              fileSize={template.fileSize}
              categorySlug={catSlug}
              subcategorySlug={subSlug}
              templateSlug={template.slug}
            />

            {/* Related templates */}
            {relatedTemplates.length > 0 && (
              <div className="mt-10">
                <h2 className="text-sm font-bold text-gray-900 mb-4">
                  More {subcat.name} templates
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedTemplates.map((rel) => {
                    const relBadge = FILE_BADGE[rel.fileType] || {
                      bg: "bg-gray-50",
                      text: "text-gray-600",
                      icon: "📎",
                    };
                    return (
                      <a
                        key={rel.slug}
                        href={rel.href}
                        className="group block bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1B5745]/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${relBadge.bg} ${relBadge.text}`}
                          >
                            .{rel.fileType}
                          </span>
                        </div>
                        <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-[#1B5745] transition-colors">
                          {rel.title}
                        </h3>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0 space-y-5">
            <UpsellBanner
              title={RAMS_BUILDER_UPSELL.title}
              description={RAMS_BUILDER_UPSELL.description}
              href={RAMS_BUILDER_UPSELL.gumroadUrl}
              variant="sidebar"
            />
            <UpsellBanner
              title={DEFAULT_PRODUCT_UPSELL.title}
              description={DEFAULT_PRODUCT_UPSELL.description}
              href={DEFAULT_PRODUCT_UPSELL.gumroadUrl}
              variant="sidebar"
            />
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DigitalDocument",
            name: template.title,
            description: template.description,
            url: `https://www.ebrora.com${template.href}`,
            fileFormat:
              template.fileType === "pdf"
                ? "application/pdf"
                : `application/vnd.openxmlformats-officedocument.${
                    template.fileType === "docx"
                      ? "wordprocessingml.document"
                      : template.fileType === "xlsx" ||
                        template.fileType === "xlsm"
                      ? "spreadsheetml.sheet"
                      : "presentationml.presentation"
                  }`,
            isAccessibleForFree: true,
            publisher: {
              "@type": "Organization",
              name: "Ebrora",
              url: "https://www.ebrora.com",
            },
          }),
        }}
      />
    </>
  );
}
