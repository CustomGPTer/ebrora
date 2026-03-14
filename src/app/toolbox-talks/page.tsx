// src/app/toolbox-talks/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/shared/PageHero";
import { CategoryCard } from "@/components/shared/CategoryCard";
import { ContentGrid } from "@/components/shared/ContentGrid";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

export const metadata: Metadata = {
  title: "Free Toolbox Talks for Construction | Ebrora",
  description:
    "Download free toolbox talks across 27 health and safety categories. Covering working at height, manual handling, excavations, fire safety, confined spaces and more. PDF format, ready to use on site.",
  openGraph: {
    title: "Free Toolbox Talks for Construction | Ebrora",
    description:
      "Download free toolbox talks across 27 health and safety categories. PDF format, ready to use on site.",
    url: "https://ebrora.com/toolbox-talks",
    type: "website",
  },
};

export default async function ToolboxTalksPage() {
  const categories = await prisma.toolboxCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { talks: { where: { isPublished: true } } },
      },
    },
  });

  return (
    <>
      <PageHero
        badge="Free Resources"
        title="Toolbox Talks"
        subtitle="Download free health and safety toolbox talks across 27 categories. PDF format, ready to brief your site team."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Toolbox Talks" }]} />

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1B5745]/8 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
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
              <strong className="text-gray-900">
                {categories.reduce((sum, cat) => sum + cat._count.talks, 0)}
              </strong>{" "}
              talks available
            </span>
          </div>
        </div>

        {/* Category grid */}
        <ContentGrid columns={3}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.name}
              description={category.description || ""}
              href={`/toolbox-talks/${category.slug}`}
              code={category.code}
              count={category._count.talks}
            />
          ))}
        </ContentGrid>

        {/* Bottom upsell */}
        <UpsellBanner
          title={RAMS_BUILDER_UPSELL.title}
          description={RAMS_BUILDER_UPSELL.description}
          href={RAMS_BUILDER_UPSELL.gumroadUrl}
          variant="bottom"
        />
      </div>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Free Toolbox Talks for Construction",
            description:
              "Download free toolbox talks across 27 health and safety categories for construction site teams.",
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
