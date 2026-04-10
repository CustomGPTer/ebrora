// src/app/tools/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/shared/PageHero";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";
import ToolsHubClient from "@/components/tools/ToolsHubClient";

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

export default async function ToolsPage() {
  const tools = await prisma.freeTool.findMany({
    orderBy: { order: "asc" },
  });

  // Serialize for client component
  const toolData = tools.map(t => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    features: t.features,
    status: t.status,
    route: t.route,
    order: t.order,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsPageSchema) }}
      />
      <PageHero
        badge="Free Tools"
        title={<>Construction Calculators<br /><span className="text-gray-400 font-semibold mt-2 inline-block">The Biggest Selection of Construction Tools Available</span></>}
        subtitle="Free interactive calculators for health & safety, temporary works, earthworks, materials, plant, programme, commercial, environmental, utilities, surveying, quality & testing, training, water & wastewater, and MEICA. Built for site supervisors, foremen, engineers, and safety professionals. Based on HSE methodologies and UK regulations."
        centered
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools" }]} />

        <ToolsHubClient tools={toolData} />

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
