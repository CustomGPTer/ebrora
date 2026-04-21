// src/app/tools/fire-extinguisher-selector/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Fire Extinguisher Selector | Free Construction Tool | Ebrora",
  description: "Select and size portable fire extinguishers per BS 5306-8:2023, RRFSO 2005, and BS EN 3. Multi-area assessment, full suitability matrix, siting calculations, signage schedule, inspection checklist, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/fire-extinguisher-selector" },
  openGraph: { title: "Fire Extinguisher Selector | Ebrora", description: "Select portable fire extinguishers per BS 5306-8:2023. Multi-area assessment with siting calculations, suitability matrix, signage requirements, and inspection schedule.", url: "https://www.ebrora.com/tools/fire-extinguisher-selector", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const ToolClient = dynamic(
  () => import("@/components/fire-extinguisher-selector/FireExtinguisherSelectorClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Fire Extinguisher Selector", description: "Select and size portable fire extinguishers per BS 5306-8:2023 and RRFSO 2005. Multi-area assessment with full suitability matrix, siting calculations, signage schedule, and inspection checklist.", url: "https://www.ebrora.com/tools/fire-extinguisher-selector", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function FireExtinguisherSelectorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Fire Extinguisher Selector" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Fire Extinguisher Selector</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">Select, size, and position portable fire extinguishers per BS 5306-8:2023 and RRFSO 2005. Multi-area assessment with full suitability matrix, siting calculations, and professional PDF export.</p>
        </div>
        <ToolClient />
      </div>
    </>
  );
}
