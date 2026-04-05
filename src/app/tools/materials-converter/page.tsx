// src/app/tools/materials-converter/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function ConverterSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-24" />
        ))}
      </div>
      <div className="flex gap-2">
        <div className="bg-gray-100 rounded-lg h-8 w-24" />
        <div className="bg-gray-100 rounded-lg h-8 w-24" />
        <div className="flex-1" />
        <div className="bg-gray-100 rounded-lg h-8 w-28" />
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 h-10" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-t border-gray-100 h-12" />
        ))}
      </div>
      <div className="border-2 border-dashed border-gray-200 rounded-xl h-12" />
    </div>
  );
}

const MaterialsConverterClient = dynamic(
  () => import("@/components/materials-converter/MaterialsConverterClient"),
  { ssr: false, loading: () => <ConverterSkeleton /> }
);

export const metadata: Metadata = {
  title: "Civil Engineering Materials Converter | Free Construction Tool | Ebrora",
  description:
    "Convert between tonnes, m³, kg, litres, m², bulk bags and wagon loads for 100+ civil engineering materials. Includes loose and compacted densities, cost estimating, and embodied carbon calculations using ICE v3 emission factors.",
  alternates: {
    canonical: "https://www.ebrora.com/tools/materials-converter",
  },
  openGraph: {
    title: "Civil Engineering Materials Converter | Ebrora",
    description:
      "Free interactive converter for 100+ civil engineering materials. Aggregates, soils, concrete, asphalt — with cost estimating and ICE v3 carbon calculations.",
    url: "https://www.ebrora.com/tools/materials-converter",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Engineering Materials Converter | Ebrora",
    description:
      "Free converter for 100+ civil engineering materials with cost and carbon calculations.",
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Civil Engineering Materials Converter",
  description:
    "Convert between tonnes, m³, kg, litres, m², bulk bags and wagon loads for 100+ civil engineering materials with cost estimating and embodied carbon calculations.",
  url: "https://www.ebrora.com/tools/materials-converter",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
  featureList: [
    "100+ civil engineering materials",
    "Unit conversion between tonnes, m³, kg, L, m², bags, loads",
    "Loose vs compacted density switching",
    "Cost estimating with editable rates",
    "ICE v3 embodied carbon calculations",
    "Category subtotals and grand totals",
    "CSV export",
  ],
};

export default function MaterialsConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <BreadcrumbNav
          items={[
            { label: "Free Tools", href: "/tools" },
            { label: "Materials Converter" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-700">
              Live
            </span>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-blue-50 text-blue-600">
              Free
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Civil Engineering Materials Converter
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-3xl leading-relaxed">
            Convert between tonnes, m³, kg, litres, m², bulk bags and wagon loads for 100+ civil
            engineering materials — with built-in cost estimating and ICE v3 embodied carbon
            calculations.
          </p>
        </div>

        {/* Converter */}
        <MaterialsConverterClient />
      </div>
    </>
  );
}
