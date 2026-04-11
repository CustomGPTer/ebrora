// src/app/tools/org-chart-generator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Org Chart Generator | Free Construction Tool | Ebrora",
  description: "Build professional organisation charts with drag-and-drop, multiple layouts, colour coding by job family or management level, photo support, and PDF export. Free for UK construction teams.",
  alternates: { canonical: "https://www.ebrora.com/tools/org-chart-generator" },
  openGraph: { title: "Org Chart Generator | Ebrora", description: "Free interactive org chart builder with drag-and-drop, multiple layouts, job family colour coding, and professional PDF export.", url: "https://www.ebrora.com/tools/org-chart-generator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const OrgChartClient = dynamic(
  () => import("@/components/org-chart-generator/OrgChartClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" /><div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Org Chart Generator", description: "Build professional organisation charts with drag-and-drop, multiple layouts, colour coding, and PDF export.", url: "https://www.ebrora.com/tools/org-chart-generator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function OrgChartGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Org Chart Generator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Org Chart Generator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Build professional organisation charts with drag-and-drop positioning,
            multiple layouts, colour coding, and PDF export. Your chart is saved
            for 3&nbsp;months and resets on every change.
          </p>
          <p className="text-sm text-amber-600 mt-1 lg:hidden">
            This tool is designed for desktop use. Editing is not available on mobile devices.
          </p>
        </div>
        <OrgChartClient />
      </div>
    </>
  );
}
