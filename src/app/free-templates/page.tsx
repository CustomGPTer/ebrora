// src/app/free-templates/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

export const metadata: Metadata = {
  title: {
    absolute: "Free Construction Templates in Excel, Word & PPT | Ebrora",
  },
  description:
    "Download free construction templates across 15 categories. Excel spreadsheets, Word documents, and PowerPoint presentations for site management, health and safety, quality, and more.",
  alternates: {
    canonical: "https://ebrora.com/free-templates",
  },
  openGraph: {
    title: "Free Construction Templates in Excel, Word & PPT | Ebrora",
    description: "Free Excel, Word, and PowerPoint templates for construction teams.",
    url: "https://ebrora.com/free-templates",
    type: "website",
    images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Construction Templates in Excel, Word & PPT | Ebrora",
    description:
      "Free construction templates for site management, health and safety, quality and more.",
    images: ["https://ebrora.com/og-image.jpg"],
  },
};

const freeTemplatesSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Free Construction Templates",
  description:
    "Free professional construction templates in Excel, Word, and PowerPoint. Covering site management, health and safety, quality and more.",
  url: "https://ebrora.com/free-templates",
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://ebrora.com",
  },
};

const FORMAT_CARDS = [
  {
    format: "excel",
    label: "Excel",
    dbFormat: "EXCEL" as const,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 8l3.5 4L8 16M13 8l3.5 4L13 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    colour: "emerald",
    bgClass: "bg-emerald-50 border-emerald-100",
    iconClass: "text-emerald-600",
    hoverClass: "hover:border-emerald-300 hover:shadow-emerald-100/50",
  },
  {
    format: "word",
    label: "Word",
    dbFormat: "WORD" as const,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 8l2.5 8L12 10l2.5 6L17 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    colour: "blue",
    bgClass: "bg-blue-50 border-blue-100",
    iconClass: "text-blue-600",
    hoverClass: "hover:border-blue-300 hover:shadow-blue-100/50",
  },
  {
    format: "powerpoint",
    label: "PowerPoint",
    dbFormat: "POWERPOINT" as const,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 7v10M9 7h3.5a3 3 0 010 6H9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    colour: "orange",
    bgClass: "bg-orange-50 border-orange-100",
    iconClass: "text-orange-600",
    hoverClass: "hover:border-orange-300 hover:shadow-orange-100/50",
  },
];

export default async function FreeTemplatesPage() {
  // Get category counts per format
  const categoryCounts = await prisma.freeTemplateCategory.groupBy({
    by: ["format"],
    _count: { id: true },
  });
  const countMap: Record<string, number> = {};
  for (const row of categoryCounts) {
    countMap[row.format] = row._count.id;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(freeTemplatesSchema) }}
      />
      <PageHero
        badge="Free Downloads"
        title="Free Templates"
        subtitle="Professional construction templates in Excel, Word, and PowerPoint. Sign up with your email for instant access."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Templates" }]} />
        {/* Format cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FORMAT_CARDS.map((card) => (
            <Link
              key={card.format}
              href={`/free-templates/${card.format}`}
              className={`group block border rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 hover:shadow-lg ${card.bgClass} ${card.hoverClass}`}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-sm ${card.iconClass}`}
              >
                {card.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-4">{card.label}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {countMap[card.dbFormat] || 0} categories
              </p>
              <span className="inline-block mt-4 text-xs font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">
                Browse templates &rarr;
              </span>
            </Link>
          ))}
        </div>
        {/* How it works */}
        <div className="mt-14 text-center">
          <h2 className="text-lg font-bold text-gray-900">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 max-w-3xl mx-auto">
            {[
              { step: "1", title: "Choose a template", desc: "Browse by format and category" },
              { step: "2", title: "Sign up", desc: "Enter your email for instant access" },
              { step: "3", title: "Download", desc: "Get the file and start using it" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-[#1B5745] text-white text-sm font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 mt-2">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
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
