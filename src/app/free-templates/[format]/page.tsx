// src/app/free-templates/[format]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateFormat } from "@prisma/client";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { CategoryCard } from "@/components/shared/CategoryCard";
import { ContentGrid } from "@/components/shared/ContentGrid";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

const FORMAT_MAP: Record<
  string,
  { label: string; dbFormat: TemplateFormat; description: string }
> = {
  excel: {
    label: "Excel",
    dbFormat: TemplateFormat.EXCEL,
    description:
      "Free Excel spreadsheet templates for construction project management, health and safety, quality, commercial, and site management.",
  },
  word: {
    label: "Word",
    dbFormat: TemplateFormat.WORD,
    description:
      "Free Word document templates for construction including temporary works, subcontractor management, document control, and meeting minutes.",
  },
  powerpoint: {
    label: "PowerPoint",
    dbFormat: TemplateFormat.POWERPOINT,
    description:
      "Free PowerPoint presentation templates for construction reporting, handover packs, and management summaries.",
  },
};

interface PageProps {
  params: Promise<{ format: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { format } = await params;
  const config = FORMAT_MAP[format];
  if (!config) return { title: "Not Found | Ebrora" };
  return {
    title: {
      absolute: `Free ${config.label} Templates for Construction | Ebrora`,
    },
    description: config.description,
    alternates: {
      canonical: `https://ebrora.com/free-templates/${format}`,
    },
    openGraph: {
      title: `Free ${config.label} Templates for Construction | Ebrora`,
      description: config.description,
      url: `https://ebrora.com/free-templates/${format}`,
      type: "website",
      images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Free ${config.label} Templates for Construction | Ebrora`,
      description: config.description,
      images: ["https://ebrora.com/og-image.jpg"],
    },
  };
}

export function generateStaticParams() {
  return [{ format: "excel" }, { format: "word" }, { format: "powerpoint" }];
}

export default async function TemplateFormatPage({ params }: PageProps) {
  const { format } = await params;
  const config = FORMAT_MAP[format];
  if (!config) notFound();

  const categories = await prisma.freeTemplateCategory.findMany({
    where: { format: config.dbFormat },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { templates: { where: { isPublished: true } } },
      },
    },
  });

  return (
    <>
      <PageHero
        badge={`Free ${config.label} Templates`}
        title={`${config.label} Templates`}
        subtitle={config.description}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav
          items={[
            { label: "Free Templates", href: "/free-templates" },
            { label: config.label },
          ]}
        />
        {categories.length === 0 ? (
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
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Categories coming soon</h2>
            <p className="text-sm text-gray-500 mt-1">
              We are preparing {config.label} templates. Check back soon.
            </p>
          </div>
        ) : (
          <ContentGrid columns={3}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                title={cat.name}
                description={cat.description || ""}
                href={`/free-templates/${format}/${cat.slug}`}
                count={cat._count.templates}
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
    </>
  );
}
