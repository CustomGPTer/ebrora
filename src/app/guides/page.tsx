// src/app/guides/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Technical Guides for UK Construction | Ebrora",
  description:
    "Free interactive technical guides for UK construction and infrastructure. Covers wastewater treatment works design, safety and quality — with interactive diagrams, calculators and checklists. Built for site teams, designers and commissioning engineers.",
  alternates: {
    canonical: "https://www.ebrora.com/guides",
  },
  openGraph: {
    title: "Technical Guides for UK Construction | Ebrora",
    description:
      "Free interactive technical guides for UK construction and infrastructure. Wastewater treatment works design, safety and quality.",
    url: "https://www.ebrora.com/guides",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const guides = [
  {
    slug: "wwtw-design-safety-quality",
    title: "Design, Safety & Quality Guide",
    subtitle: "Wastewater Treatment Works",
    edition: "Edition 1 · 2025",
    description:
      "Comprehensive interactive guide covering the full lifecycle of a UK municipal wastewater treatment works — from pre-treatment through sludge handling. Includes interactive system maps, sizing calculators, cost escalation models, checklists and hold points for every stage.",
    sections: [
      "Standards Snapshot",
      "Cost of Defects",
      "System Map Overview",
      "Pre-Treatment",
      "Primary Treatment",
      "Secondary (Biological) Treatment",
      "Sludge Removal & Treatment",
      "All-Stage Systems & Governance",
      "Glossary",
    ],
    stats: {
      stages: 5,
      subsystems: 30,
      checklists: 6,
      interactives: 15,
    },
    color: "#1B5B50",
  },
];

export default function GuidesPage() {
  return (
    <>
      <PageHero
        badge="Technical Guides"
        title={
          <>
            Interactive Technical Guides
            <br />
            <span className="text-gray-400 font-semibold mt-2 inline-block">
              Built for UK Construction &amp; Infrastructure
            </span>
          </>
        }
        subtitle="Deep-dive reference guides with interactive diagrams, calculators, checklists and hold points. Written by practitioners, designed for site teams, designers and commissioning engineers."
        centered
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Guides" }]} />

        <div className="grid gap-8 mt-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#1B5B50]/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Top colour bar */}
              <div
                className="h-1.5"
                style={{ background: `linear-gradient(90deg, ${guide.color}, ${guide.color}88)` }}
              />

              <div className="p-6 sm:p-8 lg:p-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#1B5B50] bg-[#1B5B50]/8 px-3 py-1 rounded-full mb-3">
                      {guide.subtitle}
                    </span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-[#1B5B50] transition-colors">
                      {guide.title}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 font-medium">
                      {guide.edition}
                    </p>
                  </div>
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#1B5B50]/8 flex items-center justify-center group-hover:bg-[#1B5B50] transition-colors">
                    <svg
                      className="w-5 h-5 text-[#1B5B50] group-hover:text-white transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-8 max-w-3xl">
                  {guide.description}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Treatment Stages", value: guide.stats.stages },
                    { label: "Subsystems Covered", value: `${guide.stats.subsystems}+` },
                    { label: "Stage Checklists", value: guide.stats.checklists },
                    { label: "Interactive Elements", value: `${guide.stats.interactives}+` },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50 rounded-xl px-4 py-3 text-center"
                    >
                      <div className="text-2xl font-bold text-[#1B5B50]">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section pills */}
                <div className="flex flex-wrap gap-2">
                  {guide.sections.map((section) => (
                    <span
                      key={section}
                      className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
