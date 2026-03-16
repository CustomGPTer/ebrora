// src/app/toolbox-talks/[category]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllCategories, getCategoryBySlug } from "@/data/tbt-structure";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Category Not Found | Ebrora" };

  return {
    title: `${cat.name} Toolbox Talks | Free Downloads | Ebrora`,
    description: cat.description,
    alternates: { canonical: `https://ebrora.com/toolbox-talks/${slug}` },
    openGraph: {
      title: `${cat.name} Toolbox Talks | Ebrora`,
      description: cat.description,
      url: `https://ebrora.com/toolbox-talks/${slug}`,
      type: "website",
      images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.name} Toolbox Talks | Ebrora`,
      description: cat.description,
      images: ["https://ebrora.com/og-image.jpg"],
    },
  };
}

export function generateStaticParams() {
  return getAllCategories().map((cat) => ({ category: cat.slug }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const totalAvailable = cat.subfolders.reduce((s, sub) => s + sub.talks.length, 0);
  const totalExpected = cat.subfolders.reduce((s, sub) => s + sub.expectedTalks.length, 0);

  return (
    <>
      {/* Minimal hero */}
      <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono font-semibold text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
              {String(cat.number).padStart(2, "0")}-{cat.code}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {cat.name} Toolbox Talks
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl">
            {cat.description}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb + back */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/toolbox-talks"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B5745] hover:text-[#143f33] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Categories
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">{cat.name}</span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-100 text-sm text-gray-600">
          <span>
            <strong className="text-gray-900">{cat.subfolders.length}</strong> sub-folder{cat.subfolders.length !== 1 ? "s" : ""}
          </span>
          <span className="w-px h-4 bg-gray-200" />
          <span>
            <strong className="text-gray-900">{totalAvailable}</strong> available
            <span className="text-gray-400 ml-1">/ {totalExpected} planned</span>
          </span>
        </div>

        {/* Subfolder grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.subfolders.map((sub) => {
            const hasContent = sub.talks.length > 0;

            return (
              <Link
                key={sub.slug}
                href={`/toolbox-talks/${cat.slug}/${sub.slug}`}
                className={`group relative border rounded-xl p-5 transition-all ${
                  hasContent
                    ? "bg-white border-gray-200 hover:border-[#1B5745]/40 hover:shadow-md"
                    : "bg-gray-50/50 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      hasContent
                        ? "bg-[#1B5745]/8 group-hover:bg-[#1B5745]/15"
                        : "bg-gray-100"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${hasContent ? "text-[#1B5745]" : "text-gray-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                </div>

                <h2
                  className={`text-sm font-bold mb-1 leading-tight transition-colors ${
                    hasContent
                      ? "text-gray-900 group-hover:text-[#1B5745]"
                      : "text-gray-600"
                  }`}
                >
                  {sub.name}
                </h2>

                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-2">
                  {hasContent ? (
                    <span className="text-[#1B5745] font-semibold">
                      {sub.talks.length} available
                    </span>
                  ) : (
                    <span>{sub.expectedTalks.length} planned</span>
                  )}
                </div>

                {!hasContent && (
                  <span className="absolute top-4 right-4 text-[9px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}

                {hasContent && (
                  <svg className="absolute right-4 bottom-5 w-4 h-4 text-gray-300 group-hover:text-[#1B5745] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>

        {/* Upsell */}
        <div className="mt-12">
          <UpsellBanner
            title={RAMS_BUILDER_UPSELL.title}
            description={RAMS_BUILDER_UPSELL.description}
            href={RAMS_BUILDER_UPSELL.gumroadUrl}
            variant="bottom"
          />
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${cat.name} Toolbox Talks`,
            description: cat.description,
            url: `https://ebrora.com/toolbox-talks/${slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: "Ebrora",
              url: "https://ebrora.com",
            },
          }),
        }}
      />
    </>
  );
}
