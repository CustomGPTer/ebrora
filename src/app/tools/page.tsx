// src/app/tools/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

export const metadata: Metadata = {
  title: {
    absolute: "Free Construction Calculators & Safety Tools | Ebrora",
  },
  description:
    "Free interactive tools for construction site teams. Materials converter, manual handling calculator, fire risk assessment, and confined space category calculator.",
  alternates: {
    canonical: "https://www.ebrora.com/tools",
  },
  openGraph: {
    title: "Free Construction Calculators & Safety Tools | Ebrora",
    description: "Free interactive calculators for construction health and safety.",
    url: "https://www.ebrora.com/tools",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Construction Calculators & Safety Tools | Ebrora",
    description:
      "Free interactive construction calculators and safety tools for UK site teams.",
    images: ["https://www.ebrora.com/og-image.jpg"],
  },
};

const toolsPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Free Construction Calculators & Safety Tools",
  description:
    "Free interactive calculators and tools for UK construction site teams. Based on HSE methodologies and UK regulations.",
  url: "https://www.ebrora.com/tools",
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
};

/* Tool-specific icons and accent colours */
const TOOL_META: Record<
  string,
  { icon: string; accent: string; accentLight: string }
> = {
  "manual-handling-calculator": {
    icon: "🏋️",
    accent: "#2563EB",
    accentLight: "rgba(37,99,235,0.08)",
  },
  "fire-risk-assessment": {
    icon: "🔥",
    accent: "#DC2626",
    accentLight: "rgba(220,38,38,0.08)",
  },
  "materials-converter": {
    icon: "⚖️",
    accent: "#1B5745",
    accentLight: "rgba(27,87,69,0.08)",
  },
  "confined-space-calculator": {
    icon: "🕳️",
    accent: "#7C3AED",
    accentLight: "rgba(124,58,237,0.08)",
  },
};

const DEFAULT_META = {
  icon: "🔧",
  accent: "#1B5745",
  accentLight: "rgba(27,87,69,0.08)",
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

        {/* Tool cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
          {tools.map((tool, idx) => {
            const meta = TOOL_META[tool.slug] || DEFAULT_META;
            const isLive = tool.status === "LIVE";
            const features = tool.features
              ? tool.features.split(",").map((f: string) => f.trim())
              : [];

            return (
              <Link
                key={tool.id}
                href={tool.route || `/tools/${tool.slug}`}
                className="group relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden text-gray-900 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] hover:border-transparent"
                style={
                  {
                    "--tool-accent": meta.accent,
                    "--tool-light": meta.accentLight,
                  } as React.CSSProperties
                }
              >
                {/* Gradient overlay */}
                <div
                  className="absolute top-0 left-0 right-0 h-[60px] rounded-t-xl transition-[height] duration-300 pointer-events-none group-hover:h-[80px]"
                  style={{
                    background: `linear-gradient(180deg, ${meta.accentLight} 0%, transparent 100%)`,
                  }}
                />

                {/* Card body */}
                <div className="relative z-[1] p-4 flex-1 flex flex-col">
                  {/* Top row: icon + badges */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center text-base bg-white border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:scale-105">
                      {meta.icon}
                    </div>
                    <div className="flex gap-1 flex-wrap pt-0.5">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Coming Soon
                        </span>
                      )}
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        Free
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-[var(--tool-accent)] transition-colors duration-200">
                    {tool.name}
                  </h2>

                  {/* Description */}
                  <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
                    {tool.description}
                  </p>

                  {/* Feature tags */}
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto mb-0">
                      {features.slice(0, 4).map((feature: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100"
                        >
                          {feature}
                        </span>
                      ))}
                      {features.length > 4 && (
                        <span className="text-[10px] font-medium text-gray-400 px-1 py-0.5">
                          +{features.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="relative z-[1] px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: meta.accent }}
                    />
                    <span className="text-[11px] font-semibold text-gray-400">
                      {isLive ? "Interactive calculator" : "In development"}
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: meta.accent }}
                  >
                    →
                  </span>
                </div>
              </Link>
            );
          })}
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
