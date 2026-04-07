// src/app/tools/[slug]/page.tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { TOOL_UPSELLS, RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await prisma.freeTool.findUnique({ where: { slug } });

  if (!tool) return { title: "Tool Not Found | Ebrora" };

  return {
    title: `${tool.name} | Free Construction Tool | Ebrora`,
    description: tool.description || `Free ${tool.name} for construction site teams.`,
    openGraph: {
      title: `${tool.name} | Ebrora`,
      description: tool.description || undefined,
      url: `https://ebrora.com/tools/${slug}`,
      type: "website",
    },
  };
}

// Slugs that have their own dedicated route — exclude from dynamic [slug]
const DEDICATED_ROUTES = ["materials-converter", "access-equipment-selector", "manual-handling-calculator", "fuel-usage-calculator", "wbgt-heat-stress-calculator", "fire-risk-score-calculator", "plant-pre-use-checksheet", "construction-productivity-calculator", "concrete-volume-calculator", "aggregate-calculator", "excavation-spoil-calculator", "trench-backfill-calculator", "brick-block-calculator", "concrete-pour-planner", "hav-calculator", "confined-space-calculator", "welfare-facilities-calculator", "dust-silica-calculator", "noise-exposure-calculator", "slip-risk-calculator", "cbr-modulus-converter", "topsoil-calculator", "drainage-pipe-flow-calculator", "uv-index-exposure-checker", "cold-stress-wind-chill-calculator", "lone-worker-risk-calculator", "fatigue-risk-calculator", "first-aid-needs-calculator", "scaffold-load-calculator", "formwork-pressure-calculator"];

export async function generateStaticParams() {
  const tools = await prisma.freeTool.findMany({ select: { slug: true } });
  return tools
    .filter((t) => !DEDICATED_ROUTES.includes(t.slug))
    .map((t) => ({ slug: t.slug }));
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  // Redirect to dedicated route if one exists
  if (DEDICATED_ROUTES.includes(slug)) {
    redirect(`/tools/${slug}`);
  }

  const tool = await prisma.freeTool.findUnique({ where: { slug } });

  if (!tool) notFound();

  const upsell = TOOL_UPSELLS[slug];
  const features = tool.features ? tool.features.split(",").map((f) => f.trim()) : [];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Free Tools", href: "/tools" },
            { label: tool.name },
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={tool.status as "COMING_SOON" | "LIVE"} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {tool.name}
            </h1>

            <p className="text-base text-gray-500 mt-3 leading-relaxed max-w-2xl">
              {tool.description}
            </p>

            {/* Features */}
            {features.length > 0 && (
              <div className="mt-8">
                <h2 className="text-base font-bold text-gray-900 mb-4">Key Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50">
                      <svg className="w-4.5 h-4.5 text-[#1B5745] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coming Soon / Tool area */}
            {tool.status === "COMING_SOON" ? (
              <div className="mt-10 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                  We are building this tool as an interactive web calculator. Want to be notified when it launches?
                </p>

                {/* Notify form placeholder */}
                <div className="mt-5 flex flex-col sm:flex-row items-center gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-[#1B5745] focus:ring-1 focus:ring-[#1B5745]/20 outline-none"
                  />
                  <button className="shrink-0 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors">
                    Notify Me
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-3">No spam. One email when this tool goes live.</p>

                {/* Excel version CTA */}
                {tool.gumroadUrl && (
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Need this tool now?{" "}
                      <a
                        href={tool.gumroadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#1B5745] hover:text-[#143f33] transition-colors"
                      >
                        Get the full Excel version &rarr;
                      </a>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-8">
                <p className="text-sm text-gray-500 text-center">
                  Interactive calculator will appear here when live.
                </p>
              </div>
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
            {upsell && (
              <UpsellBanner
                title={upsell.title}
                description={upsell.description}
                href={upsell.gumroadUrl}
                price={upsell.price}
                variant="sidebar"
              />
            )}
            <UpsellBanner
              title={RAMS_BUILDER_UPSELL.title}
              description={RAMS_BUILDER_UPSELL.description}
              href={RAMS_BUILDER_UPSELL.gumroadUrl}
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
            "@type": "SoftwareApplication",
            name: tool.name,
            description: tool.description,
            url: `https://ebrora.com/tools/${slug}`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
            publisher: { "@type": "Organization", name: "Ebrora", url: "https://ebrora.com" },
          }),
        }}
      />
    </>
  );
}
