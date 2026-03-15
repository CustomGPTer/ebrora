// src/app/tools/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { ContentGrid } from "@/components/shared/ContentGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

export const metadata: Metadata = {
  title: {
    absolute: "Free Construction Calculators & Safety Tools | Ebrora",
  },
  description:
    "Free interactive tools for construction site teams. Manual handling calculator, fire risk assessment, materials converter, and confined space category calculator.",
  alternates: {
    canonical: "https://ebrora.com/tools",
  },
  openGraph: {
    title: "Free Construction Calculators & Safety Tools | Ebrora",
    description: "Free interactive calculators for construction health and safety.",
    url: "https://ebrora.com/tools",
    type: "website",
    images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Construction Calculators & Safety Tools | Ebrora",
    description:
      "Free interactive construction calculators and safety tools for UK site teams.",
    images: ["https://ebrora.com/og-image.jpg"],
  },
};

const toolsPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Free Construction Calculators & Safety Tools",
  description:
    "Free interactive calculators and tools for UK construction site teams. Based on HSE methodologies and UK regulations.",
  url: "https://ebrora.com/tools",
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://ebrora.com",
  },
};

export default async function ToolsPage() {
  const tools = await prisma.freeTool.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsPageSchema) }}
      />
      <PageHero
        badge="Free Tools"
        title="Construction Calculators"
        subtitle="Interactive tools for site supervisors, foremen, and safety professionals. Based on HSE methodologies and UK regulations."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools" }]} />
        <ContentGrid columns={2}>
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.route || `/tools/${tool.slug}`}
              className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#1B5745]/30 hover:shadow-md transition-all duration-200"
            >
              {/* Header bar */}
              <div className="bg-gradient-to-r from-[#1B5745] to-[#236b55] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4.5 h-4.5 text-white/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-white">Calculator</span>
                </div>
                <StatusBadge status={tool.status as "COMING_SOON" | "LIVE"} />
              </div>
              {/* Body */}
              <div className="p-5">
                <h2 className="text-base font-bold text-gray-900 group-hover:text-[#1B5745] transition-colors">
                  {tool.name}
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">
                  {tool.description}
                </p>
                {/* Features list */}
                {tool.features && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tool.features
                      .split(",")
                      .slice(0, 4)
                      .map((feature, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100"
                        >
                          {feature.trim()}
                        </span>
                      ))}
                  </div>
                )}
                {/* Footer */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <span className="text-xs font-semibold text-[#1B5745]">
                    {tool.status === "LIVE" ? "Use now" : "Coming soon"} &rarr;
                  </span>
                  {tool.gumroadUrl && (
                    <span className="text-[11px] text-gray-400">
                      Excel version available
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </ContentGrid>
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
