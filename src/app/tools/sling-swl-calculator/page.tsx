// src/app/tools/sling-swl-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Sling / Lifting Gear SWL Calculator | Free Construction Tool | Ebrora",
  description:
    "Calculate the effective Safe Working Load (SWL) of multi-leg sling sets. BS EN 13414 / 818-4 / 1492 combined mode factors, capacity curve chart, utilisation gauge, and professional PDF export. Free for UK construction site teams.",
  alternates: { canonical: "https://www.ebrora.com/tools/sling-swl-calculator" },
  openGraph: {
    title: "Sling / Lifting Gear SWL Calculator | Ebrora",
    description: "Free sling SWL calculator. Chain, wire rope, and textile slings. BS EN 13414 / 818-4 / 1492 combined mode factors, capacity curve, utilisation gauge, and PDF export.",
    url: "https://www.ebrora.com/tools/sling-swl-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const SlingSWLCalculatorClient = dynamic(
  () => import("@/components/sling-swl-calculator/SlingSWLCalculatorClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Sling / Lifting Gear SWL Calculator", description: "Calculate the effective Safe Working Load (SWL) of multi-leg sling sets per BS EN 13414 / 818-4 / 1492 combined mode factors. Chain, wire rope, and textile slings. Capacity curve chart, utilisation gauge, risk banding, and professional PDF export.", url: "https://www.ebrora.com/tools/sling-swl-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function SlingSWLCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Sling / Lifting Gear SWL Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Sling / Lifting Gear SWL Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate the effective Safe Working Load of multi-leg sling sets. Enter sling type, number of legs, single-leg SWL, and the included angle to get instant capacity, utilisation, and risk assessment with a professional PDF export.
          </p>
        </div>
        <SlingSWLCalculatorClient />
      </div>
    </>
  );
}
