// src/app/free-templates/[category]/[subcategory]/page.tsx
// SUBCATEGORY PAGE — Shows individual template file cards
// e.g. /free-templates/health-and-safety/fire-safety → shows template files
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSubcategoryWithFiles,
  formatFileSize,
} from "@/lib/free-templates";
import {
  FT_CATEGORIES,
  getCategoryBySlug,
} from "@/data/free-template-categories";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import {
  RAMS_BUILDER_UPSELL,
  DEFAULT_PRODUCT_UPSELL,
} from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ category: string; subcategory: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: catSlug, subcategory: subSlug } = await params;
  const cat = getCategoryBySlug(catSlug);
  const subcat = getSubcategoryWithFiles(catSlug, subSlug);
  if (!cat || !subcat) return { title: "Not Found | Ebrora" };

  const title = `Free ${subcat.name} Templates | ${cat.name} | Ebrora`;
  const description =
    subcat.description ||
    `Free ${subcat.name} templates for UK construction sites.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://www.ebrora.com/free-templates/${catSlug}/${subSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.ebrora.com/free-templates/${catSlug}/${subSlug}`,
      type: "website",
      images: [
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
      images: ["https://www.ebrora.com/og-image.jpg"],
    },
  };
}

export function generateStaticParams() {
  return FT_CATEGORIES.flatMap((c) =>
    c.subcategories.map((sc) => ({
      category: c.slug,
      subcategory: sc.slug,
    }))
  );
}

/** File type colour classes */
const FILE_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  xlsx: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Excel" },
  xlsm: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    label: "Excel (Macros)",
  },
  docx: { bg: "bg-blue-50", text: "text-blue-600", label: "Word" },
  pptx: { bg: "bg-orange-50", text: "text-orange-600", label: "PowerPoint" },
  pdf: { bg: "bg-red-50", text: "text-red-500", label: "PDF" },
};

export default async function FreeTemplateSubcategoryPage({
  params,
}: PageProps) {
  const { category: catSlug, subcategory: subSlug } = await params;
  const cat = getCategoryBySlug(catSlug);
  const subcat = getSubcategoryWithFiles(catSlug, subSlug);
  if (!cat || !subcat) notFound();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-300 mb-3">
            {cat.name}
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#ffffff" }}
          >
            {subcat.name}
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto">
            {subcat.description}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Free Templates", href: "/free-templates" },
            { label: cat.name, href: `/free-templates/${catSlug}` },
            { label: subcat.name },
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {subcat.templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Templates coming soon
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  We are preparing templates for this category. Check back
                  soon or browse other categories.
                </p>
                <Link
                  href={`/free-templates/${catSlug}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#1B5745] hover:text-[#143f33] transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                  Back to {cat.name}
                </Link>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    <strong className="text-gray-900">
                      {subcat.templates.length}
                    </strong>{" "}
                    template{subcat.templates.length !== 1 ? "s" : ""}{" "}
                    available
                  </span>
                </div>

                {/* Template cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subcat.templates.map((template) => {
                    const style = FILE_TYPE_STYLES[template.fileType] || {
                      bg: "bg-gray-50",
                      text: "text-gray-600",
                      label: template.fileType.toUpperCase(),
                    };

                    return (
                      <Link
                        key={template.slug}
                        href={template.href}
                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#1B5745]/30 hover:shadow-md transition-all duration-200"
                      >
                        {/* Preview thumbnail or placeholder */}
                        <div
                          className={`h-32 ${style.bg} flex items-center justify-center relative`}
                        >
                          {template.hasPreview ? (
                            <img
                              src={template.previewPath || ""}
                              alt={`Preview of ${template.title}`}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <svg
                                className={`w-10 h-10 ${style.text}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                />
                              </svg>
                              <span
                                className={`text-xs font-semibold ${style.text}`}
                              >
                                {style.label}
                              </span>
                            </div>
                          )}
                          {/* File type badge */}
                          <span
                            className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                          >
                            .{template.fileType}
                          </span>
                        </div>

                        <div className="p-4">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#1B5745] transition-colors">
                            {template.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                            <span className="text-[11px] text-gray-400">
                              {style.label}
                              {template.fileSize > 0 &&
                                ` · ${formatFileSize(template.fileSize)}`}
                            </span>
                            <span className="text-[11px] font-semibold text-[#1B5745]">
                              Preview →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            <UpsellBanner
              title={RAMS_BUILDER_UPSELL.title}
              description={RAMS_BUILDER_UPSELL.description}
              href={RAMS_BUILDER_UPSELL.gumroadUrl}
              variant="bottom"
            />
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
            "@type": "CollectionPage",
            name: `Free ${subcat.name} Templates`,
            description: subcat.description,
            url: `https://www.ebrora.com/free-templates/${catSlug}/${subSlug}`,
            isPartOf: {
              "@type": "CollectionPage",
              name: `Free ${cat.name} Templates`,
              url: `https://www.ebrora.com/free-templates/${catSlug}`,
            },
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
