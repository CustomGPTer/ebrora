// src/app/toolbox-talks/[category]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { ContentGrid } from "@/components/shared/ContentGrid";
import { DownloadCard } from "@/components/shared/DownloadCard";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import {h
  TOOLBOX_UPSELLS,
  DEFAULT_PRODUCT_UPSELL,
  RAMS_BUILDER_UPSELL,
} from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await prisma.toolboxCategory.findUnique({
    where: { slug },
  });

  if (!category) return { title: "Category Not Found | Ebrora" };

  return {
    title: `${category.name} Toolbox Talks | Free Downloads | Ebrora`,
    description: category.description || `Download free ${category.name} toolbox talks for construction site teams. PDF format, ready to use.`,
    openGraph: {
      title: `${category.name} Toolbox Talks | Ebrora`,
      description: category.description || `Free ${category.name} toolbox talks for construction.`,
      url: `https://ebrora.com/toolbox-talks/${slug}`,
      type: "website",
            images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
    },
        alternates: {
                canonical: `https://ebrora.com/toolbox-talks/${slug}`,
        },
        twitter: {
                card: "summary_large_image",
                title: `${category.name} Toolbox Talks | Ebrora`,
                description: category.description || `Free ${category.name} toolbox talks for construction site teams.`,
                images: ["https://ebrora.com/og-image.jpg"],
        },
  };
}

export async function generateStaticParams() {
  const categories = await prisma.toolboxCategory.findMany({
    select: { slug: true },
  });
  return categories.map((cat) => ({ category: cat.slug }));
}

export default async function ToolboxCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;

  const category = await prisma.toolboxCategory.findUnique({
    where: { slug },
    include: {
      talks: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!category) notFound();

  const upsells = TOOLBOX_UPSELLS[slug] || [DEFAULT_PRODUCT_UPSELL];
  const freeTalks = category.talks.filter((t) => t.isFree);
  const gatedTalks = category.talks.filter((t) => !t.isFree);

  return (
    <>
      <PageHero
        badge={category.code}
        title={`${category.name} Toolbox Talks`}
        subtitle={category.description || undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Toolbox Talks", href: "/toolbox-talks" },
            { label: category.name },
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {category.talks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">No talks yet</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  We are currently preparing toolbox talks for this category. Check back soon or browse other categories.
                </p>
              </div>
            ) : (
              <>
                {/* Free talks */}
                {freeTalks.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-base font-bold text-gray-900">Free Downloads</h2>
                      <span className="text-xs font-semibold text-[#1B5745] bg-[#1B5745]/8 px-2 py-0.5 rounded-full">
                        {freeTalks.length}
                      </span>
                    </div>
                    <ContentGrid columns={3}>
                      {freeTalks.map((talk) => (
                        <DownloadCard
                          key={talk.id}
                          title={talk.title}
                          description={talk.description || undefined}
                          fileSize={talk.fileSize || undefined}
                          isFree={true}
                          isLocked={false}
                          downloadUrl={talk.blobUrl || undefined}
                        />
                      ))}
                    </ContentGrid>
                  </div>
                )}

                {/* Inline upsell between sections */}
                {freeTalks.length > 0 && gatedTalks.length > 0 && upsells[0] && (
                  <div className="mb-10">
                    <UpsellBanner
                      title={upsells[0].title}
                      description={upsells[0].description}
                      href={upsells[0].gumroadUrl}
                      price={upsells[0].price}
                      variant="inline"
                    />
                  </div>
                )}

                {/* Gated talks */}
                {gatedTalks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-base font-bold text-gray-900">Sign Up to Download</h2>
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {gatedTalks.length}
                      </span>
                    </div>
                    <ContentGrid columns={3}>
                      {gatedTalks.map((talk) => (
                        <DownloadCard
                          key={talk.id}
                          title={talk.title}
                          description={talk.description || undefined}
                          fileSize={talk.fileSize || undefined}
                          isFree={false}
                          isLocked={true}
                        />
                      ))}
                    </ContentGrid>
                  </div>
                )}
              </>
            )}

            {/* Bottom upsell */}
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
            {upsells.map((item, i) => (
              <UpsellBanner
                key={i}
                title={item.title}
                description={item.description}
                href={item.gumroadUrl}
                price={item.price}
                variant="sidebar"
              />
            ))}
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
            name: `${category.name} Toolbox Talks`,
            description: category.description,
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
