// src/app/free-templates/[category]/page.tsx
// CATEGORY PAGE — Shows subcategory tiles for a single category
// e.g. /free-templates/health-and-safety → shows Fire Safety, COSHH, WAH, etc.
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryWithFiles } from "@/lib/free-templates";
import { FT_CATEGORIES } from "@/data/free-template-categories";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { ToolboxTalksSidebarCard } from "@/components/shared/PremiumUpsellCards";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = getCategoryWithFiles(slug);
  if (!cat) return { title: "Not Found | Ebrora" };

  const title = `Free ${cat.name} Templates for Construction | Ebrora`;
  const description =
    cat.description ||
    `Free ${cat.name} templates for UK construction sites. Download Excel, Word, and PDF templates.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://www.ebrora.com/free-templates/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.ebrora.com/free-templates/${slug}`,
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
  return FT_CATEGORIES.map((c) => ({ category: c.slug }));
}

export default async function FreeTemplateCategoryPage({
  params,
}: PageProps) {
  const { category: slug } = await params;
  const cat = getCategoryWithFiles(slug);
  if (!cat) notFound();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-300 mb-3">
            Free Templates
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#ffffff" }}
          >
            {cat.name}
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto">
            {cat.description}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Free Templates", href: "/free-templates" },
            { label: cat.name },
          ]}
        />

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#1B5745]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            </span>
            <span className="text-sm text-gray-600">
              <strong className="text-gray-900">
                {cat.subcategories.length}
              </strong>{" "}
              sub-categor{cat.subcategories.length !== 1 ? "ies" : "y"}
            </span>
          </div>
          {cat.totalTemplates > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-[#1B5745]"
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
              </span>
              <span className="text-sm text-gray-600">
                <strong className="text-gray-900">
                  {cat.totalTemplates}
                </strong>{" "}
                templates available
              </span>
            </div>
          )}
        </div>

        {/* Subcategory grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.subcategories.map((sc) => (
            <Link
              key={sc.slug}
              href={sc.href}
              className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B5745]/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B5745]/8 flex items-center justify-center group-hover:bg-[#1B5745]/15 transition-colors">
                  <svg
                    className="w-5 h-5 text-[#1B5745]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                    />
                  </svg>
                </div>
                {sc.templates.length > 0 && (
                  <span className="text-[10px] font-semibold text-[#1B5745] bg-[#1B5745]/8 px-2 py-0.5 rounded-full">
                    {sc.templates.length}
                  </span>
                )}
              </div>

              <h2 className="text-[15px] font-bold text-gray-900 group-hover:text-[#1B5745] transition-colors mb-1 leading-tight">
                {sc.name}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                {sc.description}
              </p>

              {/* Show first 3 template names if available */}
              {sc.templates.length > 0 && (
                <ul className="mb-3 space-y-0.5">
                  {sc.templates.slice(0, 3).map((t) => (
                    <li
                      key={t.slug}
                      className="text-xs text-gray-400 flex items-center gap-1.5 leading-relaxed"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                      {t.title}
                    </li>
                  ))}
                  {sc.templates.length > 3 && (
                    <li className="text-xs text-gray-300 italic pl-2.5">
                      + {sc.templates.length - 3} more
                    </li>
                  )}
                </ul>
              )}

              <svg
                className="absolute right-4 bottom-5 w-4 h-4 text-gray-300 group-hover:text-[#1B5745] group-hover:translate-x-0.5 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>
          ))}
        </div>

        <UpsellBanner
          title={RAMS_BUILDER_UPSELL.title}
          description={RAMS_BUILDER_UPSELL.description}
          href={RAMS_BUILDER_UPSELL.gumroadUrl}
          variant="bottom"
        />

        <div className="mt-5 max-w-xs">
          <ToolboxTalksSidebarCard />
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Free ${cat.name} Templates`,
            description: cat.description,
            url: `https://www.ebrora.com/free-templates/${slug}`,
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
