// src/app/toolbox-talks/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { getAllCategories, getAvailableTalkCount, getTotalExpectedCount, getAllAvailableTalks } from "@/data/tbt-structure";
import { TbtSearch } from "@/components/toolbox-talks/TbtSearch";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

export const metadata: Metadata = {
  title: "Free Toolbox Talks for Construction Sites | 60 Categories | Ebrora",
  description:
    "Download over 1,500 free toolbox talks across 60 health and safety categories for UK construction sites. Covering excavations, working at height, COSHH, confined spaces, pipelines, MEICA and more. PDF format, ready to use on site.",
  alternates: {
    canonical: "https://ebrora.com/toolbox-talks",
  },
  openGraph: {
    title: "Free Toolbox Talks for Construction Sites | Ebrora",
    description:
      "Over 1,500 free toolbox talks across 60 H&S categories. PDF format, ready to brief your site team.",
    url: "https://ebrora.com/toolbox-talks",
    type: "website",
    images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Toolbox Talks for Construction Sites | Ebrora",
    description:
      "Over 1,500 free toolbox talks across 60 health and safety categories. PDF format, ready to use on site.",
    images: ["https://ebrora.com/og-image.jpg"],
  },
};

export default function ToolboxTalksPage() {
  const categories = getAllCategories();
  const availableCount = getAvailableTalkCount();
  const totalExpected = getTotalExpectedCount();
  const searchItems = getAllAvailableTalks();

  return (
    <>
      {/* Minimal hero */}
      <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-300 mb-3">
            Free Resources
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: '#ffffff' }}>
            Construction Toolbox Talks
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto">
            Toolbox Talks across {categories.length} categories.
            Download as PDF, ready to brief your site team.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search bar */}
        <TbtSearch items={searchItems} />

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </span>
            <span className="text-sm text-gray-600">
              <strong className="text-gray-900">{categories.length}</strong> categories
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
            <span className="text-sm text-gray-600">
              <strong className="text-gray-900">{availableCount}</strong> available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </span>
            <span className="text-sm text-gray-600">
              <strong className="text-gray-900">5</strong> free downloads / day
            </span>
          </div>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const talkCount = cat.subfolders.reduce((sum, s) => sum + s.talks.length, 0);
            const expectedCount = cat.subfolders.reduce((sum, s) => sum + s.expectedTalks.length, 0);

            return (
              <Link
                key={cat.code}
                href={`/toolbox-talks/${cat.slug}`}
                className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B5745]/40 hover:shadow-md transition-all"
              >
                {/* Folder icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B5745]/8 flex items-center justify-center group-hover:bg-[#1B5745]/15 transition-colors">
                    <svg className="w-5 h-5 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    {String(cat.number).padStart(2, "0")}-{cat.code}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-gray-900 group-hover:text-[#1B5745] transition-colors mb-1 leading-tight">
                  {cat.name}
                </h2>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                  {cat.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>{cat.subfolders.length} sub-folder{cat.subfolders.length !== 1 ? "s" : ""}</span>
                  <span className="w-px h-3 bg-gray-200" />
                  <span>
                    {talkCount > 0 ? (
                      <span className="text-[#1B5745] font-semibold">{talkCount} available</span>
                    ) : (
                      `${expectedCount} planned`
                    )}
                  </span>
                </div>

                {/* Arrow indicator */}
                <svg className="absolute right-4 bottom-5 w-4 h-4 text-gray-300 group-hover:text-[#1B5745] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            );
          })}
        </div>

        {/* Bottom upsell */}
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
            name: "Free Toolbox Talks for Construction Sites",
            description: `Over ${totalExpected.toLocaleString()} toolbox talks across ${categories.length} health and safety categories for UK construction.`,
            url: "https://ebrora.com/toolbox-talks",
            publisher: {
              "@type": "Organization",
              name: "Ebrora",
              url: "https://ebrora.com",
            },
          }),
        }}
      />
    </>
  );
}
