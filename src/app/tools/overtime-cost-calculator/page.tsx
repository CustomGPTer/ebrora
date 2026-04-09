// src/app/tools/overtime-cost-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Overtime Cost Calculator | Free Construction Tool | Ebrora",
  description:
    "Calculate overtime costs, premiums, and effective hourly rates for construction teams. Multi-group support, CIJC/NAECI presets, employer on-costs (NIC, pension, CITB), hire-vs-overtime breakeven, stacked bar/line/pie charts, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/overtime-cost-calculator" },
  openGraph: {
    title: "Overtime Cost Calculator | Ebrora",
    description:
      "Construction overtime cost analysis tool. Multi-group, preset patterns, on-costs, charts, hire-vs-OT comparison, and PDF export.",
    url: "https://www.ebrora.com/tools/overtime-cost-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const OvertimeCostCalculatorClient = dynamic(
  () => import("@/components/overtime-cost-calculator/OvertimeCostCalculatorClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-12 bg-gray-50 rounded-xl" />
        <div className="h-48 bg-gray-50 rounded-xl" />
        <div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Overtime Cost Calculator",
  description:
    "Calculate overtime costs, premiums, effective hourly rates, and hire-vs-overtime breakeven for construction teams. CIJC and NAECI presets, employer on-costs, multi-group support, interactive charts, and professional PDF export.",
  url: "https://www.ebrora.com/tools/overtime-cost-calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function OvertimeCostCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Overtime Cost Calculator" }]} />

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Free
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Overtime Cost Calculator
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate overtime costs, premiums, and effective hourly rates for construction teams. CIJC and NAECI presets, multi-group support, employer on-costs (NIC, pension, CITB levy), hire-vs-overtime breakeven analysis, interactive charts, and professional PDF export.
          </p>
        </div>

        <OvertimeCostCalculatorClient />
      </div>
    </>
  );
}
