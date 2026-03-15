// src/app/toolbox-talks/[category]/[talk]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { ContentGrid } from "@/components/shared/ContentGrid";
import { DownloadCard } from "@/components/shared/DownloadCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  TOOLBOX_UPSELLS,
  DEFAULT_PRODUCT_UPSELL,
  RAMS_BUILDER_UPSELL,
} from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ category: string; talk: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: catSlug, talk: talkSlug } = await params;

  const talk = await prisma.toolboxTalk.findFirst({
    where: { slug: talkSlug, category: { slug: catSlug } },
    include: { category: true },
  });

  if (!talk) return { title: "Talk Not Found | Ebrora" };

  return {
    title: `${talk.title} | ${talk.category.name} Toolbox Talk | Ebrora`,
    description: talk.description || `Free ${talk.title} toolbox talk for construction site teams. Download as PDF.`,
    openGraph: {
      title: `${talk.title} | Ebrora Toolbox Talks`,
      description: talk.description || `Free toolbox talk on ${talk.title}.`,
      url: `https://ebrora.com/toolbox-talks/${catSlug}/${talkSlug}`,
      type: "article",
            images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
    },
        alternates: {
                canonical: `https://ebrora.com/toolbox-talks/${catSlug}/${talkSlug}`,
        },
        twitter: {
                card: "summary_large_image",
                title: `${talk.title} | Ebrora Toolbox Talks`,
                description: talk.description || `Free ${talk.title} toolbox talk for construction site teams.`,
                images: ["https://ebrora.com/og-image.jpg"],
        },
  };
}

export default async function ToolboxTalkPage({ params }: PageProps) {
  const { category: catSlug, talk: talkSlug } = await params;

  const talk = await prisma.toolboxTalk.findFirst({
    where: {
      slug: talkSlug,
      category: { slug: catSlug },
      isPublished: true,
    },
    include: { category: true },
  });

  if (!talk) notFound();

  // Related talks from same category (excluding current)
  const relatedTalks = await prisma.toolboxTalk.findMany({
    where: {
      categoryId: talk.categoryId,
      isPublished: true,
      id: { not: talk.id },
    },
    orderBy: { order: "asc" },
    take: 3,
  });

  const upsells = TOOLBOX_UPSELLS[catSlug] || [DEFAULT_PRODUCT_UPSELL];

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Toolbox Talks", href: "/toolbox-talks" },
            { label: talk.category.name, href: `/toolbox-talks/${catSlug}` },
            { label: talk.title },
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={talk.isFree ? "FREE" : "LOCKED"} />
              <span className="text-xs text-gray-400">{talk.category.code}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {talk.title}
            </h1>

            {talk.description && (
              <p className="text-base text-gray-500 mt-3 leading-relaxed max-w-2xl">
                {talk.description}
              </p>
            )}

            {/* File info */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
                PDF Document
              </div>
              {talk.fileSize && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                  </svg>
                  {formatFileSize(talk.fileSize)}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {new Date(talk.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Download section */}
            <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
              {talk.isFree && talk.blobUrl ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Ready to download</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Free PDF, no sign-up required</p>
                  </div>
                  <a
                    href={talk.blobUrl}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              ) : talk.isFree ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">This talk is being prepared and will be available for download soon.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <h3 className="text-sm font-bold text-gray-900">Sign up to download</h3>
                    </div>
                    <p className="text-xs text-gray-500">Enter your email for instant access to this toolbox talk</p>
                  </div>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#164a3b] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    Unlock with Email
                  </button>
                </div>
              )}
            </div>

            {/* Related talks */}
            {relatedTalks.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">
                    More {talk.category.name} talks
                  </h2>
                  <Link
                    href={`/toolbox-talks/${catSlug}`}
                    className="text-xs font-semibold text-[#1B5745] hover:text-[#143f33] transition-colors"
                  >
                    View all &rarr;
                  </Link>
                </div>
                <ContentGrid columns={3}>
                  {relatedTalks.map((related) => (
                    <DownloadCard
                      key={related.id}
                      title={related.title}
                      description={related.description || undefined}
                      fileSize={related.fileSize || undefined}
                      isFree={related.isFree}
                      isLocked={!related.isFree}
                    />
                  ))}
                </ContentGrid>
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
            "@type": "CreativeWork",
            name: talk.title,
            description: talk.description,
            url: `https://ebrora.com/toolbox-talks/${catSlug}/${talkSlug}`,
            encodingFormat: "application/pdf",
            isAccessibleForFree: talk.isFree,
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
