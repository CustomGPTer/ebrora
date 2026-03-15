// src/app/free-templates/[format]/[category]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateFormat } from "@prisma/client";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { ContentGrid } from "@/components/shared/ContentGrid";
import { DownloadCard } from "@/components/shared/DownloadCard";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL, DEFAULT_PRODUCT_UPSELL } from "@/data/upsell-config";

const FORMAT_LABEL: Record<string, string> = {
  excel: "Excel",
  word: "Word",
  powerpoint: "PowerPoint",
};

const FORMAT_DB: Record<string, TemplateFormat> = {
  excel: TemplateFormat.EXCEL,
  word: TemplateFormat.WORD,
  powerpoint: TemplateFormat.POWERPOINT,
};

interface PageProps {
  params: Promise<{ format: string; category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { format, category: catSlug } = await params;
  const dbFormat = FORMAT_DB[format];
  if (!dbFormat) return { title: "Not Found | Ebrora" };

  const category = await prisma.freeTemplateCategory.findUnique({
    where: { format_slug: { format: dbFormat, slug: catSlug } },
  });
  if (!category) return { title: "Not Found | Ebrora" };

  const title = `Free ${category.name} ${FORMAT_LABEL[format]} Templates | Ebrora`;
  const description =
    category.description ||
    `Free ${FORMAT_LABEL[format]} templates for ${category.name} in UK construction.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://ebrora.com/free-templates/${format}/${catSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://ebrora.com/free-templates/${format}/${catSlug}`,
      type: "website",
      images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://ebrora.com/og-image.jpg"],
    },
  };
}

export default async function TemplateCategoryPage({ params }: PageProps) {
  const { format, category: catSlug } = await params;
  const dbFormat = FORMAT_DB[format];
  const label = FORMAT_LABEL[format];
  if (!dbFormat || !label) notFound();

  const category = await prisma.freeTemplateCategory.findUnique({
    where: { format_slug: { format: dbFormat, slug: catSlug } },
    include: {
      templates: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!category) notFound();

  return (
    <>
      <PageHero
        badge={`Free ${label} Templates`}
        title={category.name}
        subtitle={category.description || undefined}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Free Templates", href: "/free-templates" },
            { label, href: `/free-templates/${format}` },
            { label: category.name },
          ]}
        />
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 min-w-0">
            {category.templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-300"
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
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Templates coming soon</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  We are preparing templates for this category. Check back soon or browse other
                  categories.
                </p>
              </div>
            ) : (
              <ContentGrid columns={3}>
                {category.templates.map((template) => (
                  <DownloadCard
                    key={template.id}
                    title={template.title}
                    description={template.description || undefined}
                    fileSize={template.fileSize || undefined}
                    isFree={false}
                    isLocked={true}
                  />
                ))}
              </ContentGrid>
            )}
            <UpsellBanner
              title={RAMS_BUILDER_UPSELL.title}
              description={RAMS_BUILDER_UPSELL.description}
              href={RAMS_BUILDER_UPSELL.gumroadUrl}
              variant="bottom"
            />
          </div>
          <div className="lg:w-72 shrink-0 space-y-5">
            <UpsellBanner
              title={RAMS_BUILDER_UPSELL.title}
              description={RAMS_BUILDER_UPSELL.description}
              href={RAMS_BUILDER_UPSELL.gumroadUrl}
              variant="sidebar"
            />
            <UpsellBanner
              title={DEFAULT_PRODUCT_UPSELL.title}
              description={DEFAULT_PRODUCT_UPSELL.description}
              href={DEFAULT_PRODUCT_UPSELL.gumroadUrl}
              variant="sidebar"
            />
          </div>
        </div>
      </div>
    </>
  );
}
