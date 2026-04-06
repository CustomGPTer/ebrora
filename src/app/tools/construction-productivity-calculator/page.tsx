// src/app/tools/construction-productivity-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Construction Productivity Calculator | Free Construction Tool | Ebrora",
  description:
    "Calculate daily productivity outputs for 9 UK civil engineering task types. Steel fixing, pipe laying, muck shift, formwork, concreting, kerb laying, piling, road base, and asphalt. Full calculation chain with professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/construction-productivity-calculator" },
  openGraph: {
    title: "Construction Productivity Calculator | Ebrora",
    description: "9 task types, full factor chain, days-to-complete, combined summary PDF. Based on Spon's and CIRIA norms.",
    url: "https://www.ebrora.com/tools/construction-productivity-calculator",
    type: "website",
  },
};

const ConstructionProductivityClient = dynamic(
  () => import("@/components/construction-productivity-calculator/ConstructionProductivityClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="flex gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg" />)}</div>
        <div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Construction Productivity Calculator",
  description: "Daily productivity calculator for 9 UK civil engineering task types with full factor chain and professional PDF export.",
  url: "https://www.ebrora.com/tools/construction-productivity-calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function ConstructionProductivityCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Construction Productivity Calculator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Construction Productivity Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Estimate daily outputs for 9 UK civil engineering task types. Based on Spon&apos;s, CIRIA and industry norms with full calculation chain visibility, days-to-complete planning, and professional PDF export. All rates overridable.
          </p>
        </div>
        <ConstructionProductivityClient />
      </div>
    </>
  );
}
