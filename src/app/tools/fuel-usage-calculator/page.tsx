// src/app/tools/fuel-usage-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function CalculatorSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-24" />)}
      </div>
      <div className="flex gap-2"><div className="bg-gray-100 rounded-lg h-8 w-24" /><div className="bg-gray-100 rounded-lg h-8 w-24" /></div>
      <div className="border border-gray-200 rounded-xl overflow-hidden"><div className="bg-gray-50 h-10" />{[...Array(3)].map((_, i) => <div key={i} className="border-t border-gray-100 h-12" />)}</div>
    </div>
  );
}

const FuelUsageCalculatorClient = dynamic(
  () => import("@/components/fuel-usage-calculator/FuelUsageCalculatorClient"),
  { ssr: false, loading: () => <CalculatorSkeleton /> }
);

export const metadata: Metadata = {
  title: "Fuel Usage Calculator | Free Plant Fuel Planning Tool | Ebrora",
  description:
    "Calculate fuel usage, cost, and carbon emissions for construction plant. 370+ machines from Caterpillar, Komatsu, Hitachi, Volvo, JCB, and more. Multi-machine planning with daily/weekly breakdowns. Free for UK construction site teams.",
  alternates: { canonical: "https://www.ebrora.com/tools/fuel-usage-calculator" },
  openGraph: {
    title: "Fuel Usage Calculator | Ebrora",
    description: "Free construction plant fuel calculator. 370+ machines, multi-machine planning, cost and carbon reporting, professional PDF export.",
    url: "https://www.ebrora.com/tools/fuel-usage-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function FuelUsageCalculatorPage() {
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Fuel Usage Calculator",
    description: "Calculate fuel usage, cost, and carbon emissions for construction plant. 370+ machines from Caterpillar, Komatsu, Hitachi, Volvo, JCB, and more.",
    url: "https://www.ebrora.com/tools/fuel-usage-calculator",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Fuel Usage Calculator" }]} />
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Fuel Usage Calculator</h1>
          <p className="text-base text-gray-500 mt-2 leading-relaxed max-w-2xl">
            Plan fuel usage, cost, and carbon emissions for your site plant.
            Search 370+ machines by make, model, or type — add multiple items,
            set duty cycles and hours, and get instant daily and weekly breakdowns
            with a professional PDF export.
          </p>
        </div>
        <FuelUsageCalculatorClient />
      </div>
    </>
  );
}
