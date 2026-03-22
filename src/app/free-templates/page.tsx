// src/app/free-templates/page.tsx
// FREE TEMPLATES LANDING — Shows 20 category tiles
// File-based system: scans /public/free-templates/ at build time
import { Metadata } from "next";
import Link from "next/link";
import { scanAllTemplates } from "@/lib/free-templates";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

export const metadata: Metadata = {
  title: {
    absolute:
      "Free Construction Templates | Excel, Word & PowerPoint | Ebrora",
  },
  description:
    "Download free construction templates across 20 categories. Risk assessments, ITPs, Gantt charts, MEICA records, commissioning checklists, and more. Excel, Word, PowerPoint, and PDF — all free for UK construction professionals.",
  alternates: {
    canonical: "https://www.ebrora.com/free-templates",
  },
  openGraph: {
    title: "Free Construction Templates | Ebrora",
    description:
      "Free Excel, Word, PowerPoint, and PDF templates for UK construction teams. 20 categories covering H&S, quality, environmental, MEICA, civils, and more.",
    url: "https://www.ebrora.com/free-templates",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Construction Templates | Ebrora",
    description:
      "Free construction templates across 20 categories. Excel, Word, PowerPoint, and PDF formats.",
    images: ["https://www.ebrora.com/og-image.jpg"],
  },
};

const freeTemplatesSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Free Construction Templates",
  description:
    "Free professional construction templates covering health and safety, quality, environmental, programme, commercial, MEICA, civils, and more.",
  url: "https://www.ebrora.com/free-templates",
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
};

export default function FreeTemplatesPage() {
  const categories = scanAllTemplates();
  const totalTemplates = categories.reduce(
    (sum, cat) => sum + cat.totalTemplates,
    0
  );
  const totalSubcats = categories.reduce(
    (sum, cat) => sum + cat.subcategories.length,
    0
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(freeTemplatesSchema),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-300 mb-3">
            Free Downloads
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#ffffff" }}
          >
            Free Construction Templates
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/80 max-w-2xl mx-auto">
            Professional templates across {categories.length} categories.
            Excel, Word, PowerPoint, and PDF — ready to use on site.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Templates" }]} />

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
              <strong className="text-gray-900">{categories.length}</strong>{" "}
              categories
            </span>
          </div>
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
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                />
              </svg>
            </span>
            <span className="text-sm text-gray-600">
              <strong className="text-gray-900">{totalSubcats}</strong>{" "}
              sub-categories
            </span>
          </div>
          {totalTemplates > 0 && (
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
                <strong className="text-gray-900">{totalTemplates}</strong>{" "}
                templates available
              </span>
            </div>
          )}
        </div>

        {/* Category grid — 20 tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B5745]/40 hover:shadow-md transition-all"
            >
              {/* Folder icon */}
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
                {cat.totalTemplates > 0 && (
                  <span className="text-[10px] font-semibold text-[#1B5745] bg-[#1B5745]/8 px-2 py-0.5 rounded-full">
                    {cat.totalTemplates}
                  </span>
                )}
              </div>

              <h2 className="text-[15px] font-bold text-gray-900 group-hover:text-[#1B5745] transition-colors mb-1 leading-tight">
                {cat.name}
              </h2>

              {/* Show first 3 subcategory names as preview */}
              <ul className="mb-3 space-y-0.5">
                {cat.subcategories.slice(0, 3).map((sc) => (
                  <li
                    key={sc.slug}
                    className="text-xs text-gray-400 flex items-center gap-1.5 leading-relaxed"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                    {sc.name}
                  </li>
                ))}
                {cat.subcategories.length > 3 && (
                  <li className="text-xs text-gray-300 italic pl-2.5">
                    + {cat.subcategories.length - 3} more
                  </li>
                )}
              </ul>

              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span>
                  {cat.subcategories.length} sub-categor
                  {cat.subcategories.length !== 1 ? "ies" : "y"}
                </span>
              </div>

              {/* Arrow */}
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

        {/* SEO copy */}
        <div className="max-w-3xl mx-auto mt-12 mb-8 text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            Our free template library covers the full range of construction
            site documentation — from health and safety risk assessments and
            permits to work, through to commercial valuations, MEICA
            commissioning records, and project handover checklists. Every
            template is designed by practising UK construction professionals
            and formatted for immediate use on site.
          </p>
          <p>
            Templates are available in Excel (.xlsx, .xlsm), Word (.docx),
            PowerPoint (.pptx), and PDF formats. Preview each template
            before downloading — logged-in users get clean, unwatermarked
            A4 previews. Free accounts include 5 downloads per month, with
            Standard and Professional plans offering 30 and 50 downloads
            respectively.
          </p>
        </div>

        <UpsellBanner
          title={RAMS_BUILDER_UPSELL.title}
          description={RAMS_BUILDER_UPSELL.description}
          href={RAMS_BUILDER_UPSELL.gumroadUrl}
          variant="bottom"
        />
      </div>
    </>
  );
}
