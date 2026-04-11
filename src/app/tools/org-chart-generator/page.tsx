// src/app/tools/org-chart-generator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function ChartSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-24" />
        ))}
      </div>
      <div className="bg-gray-100 rounded-xl h-[500px]" />
    </div>
  );
}

const OrgChartClient = dynamic(
  () => import("@/components/org-chart-generator/OrgChartClient"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const metadata: Metadata = {
  title:
    "Org Chart Generator | Free Organisation Chart Builder | Ebrora",
  description:
    "Build professional organisation charts with drag-and-drop, multiple layouts, colour coding by job family or management level, photo support, and PDF export. Free for UK construction teams.",
  alternates: {
    canonical: "https://www.ebrora.com/tools/org-chart-generator",
  },
  openGraph: {
    title: "Org Chart Generator | Ebrora",
    description:
      "Free interactive org chart builder with drag-and-drop, multiple layouts, job family colour coding, and professional PDF export.",
    url: "https://www.ebrora.com/tools/org-chart-generator",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Org Chart Generator",
  description:
    "Build professional organisation charts with drag-and-drop, multiple layouts, and PDF export.",
  url: "https://www.ebrora.com/tools/org-chart-generator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
};

export default function OrgChartGeneratorPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <BreadcrumbNav
        items={[
          { label: "Free Tools", href: "/tools" },
          { label: "Org Chart Generator" },
        ]}
      />
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Org Chart Generator
        </h1>
        <p className="text-base text-gray-500 mt-2 leading-relaxed max-w-2xl mx-auto">
          Build professional organisation charts with drag-and-drop positioning,
          multiple layouts, colour coding, and PDF export. Your chart is saved
          for 3&nbsp;months and resets on every change.
        </p>
        <p className="text-sm text-amber-600 mt-1 lg:hidden">
          ⚠️ This tool is designed for desktop use. Editing is not available on mobile devices.
        </p>
      </div>
      <OrgChartClient />
    </div>
  );
}
