// src/app/tools/plant-pre-use-checksheet/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Plant Pre-Use Check Sheet Creator | Free Construction Tool | Ebrora",
  description:
    "Generate PUWER-compliant pre-use inspection check sheets for 28 plant types. Weekly Mon–Sun grid, fleet mode for multiple machines, blank PDF download for site printing, and CPCS/NPORS expiry tracking.",
  alternates: { canonical: "https://www.ebrora.com/tools/plant-pre-use-checksheet" },
  openGraph: {
    title: "Plant Pre-Use Check Sheet Creator | Ebrora",
    description: "28 plant types, 25 check items each, fleet mode, blank PDF download for site printing.",
    url: "https://www.ebrora.com/tools/plant-pre-use-checksheet",
    type: "website",
  },
};

const PlantPreUseChecksheetClient = dynamic(
  () => import("@/components/plant-pre-use-checksheet/PlantPreUseChecksheetClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-10 bg-gray-100 rounded-lg w-64" />
        <div className="h-20 bg-gray-50 rounded-xl" />
        <div className="h-96 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Plant Pre-Use Check Sheet Creator",
  description: "PUWER-compliant pre-use inspection check sheets for 28 construction plant types with fleet mode and blank PDF download.",
  url: "https://www.ebrora.com/tools/plant-pre-use-checksheet",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function PlantPreUseChecksheetPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Plant Pre-Use Check Sheet Creator" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Plant Pre-Use Check Sheet Creator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Generate PUWER-compliant daily pre-use inspection check sheets for 28 plant types. Weekly Mon–Sun grid with ✓/✗/N/A marking, fleet mode for multiple machines, blank PDF download for site printing, and CPCS/NPORS card expiry tracking.
          </p>
        </div>
        <PlantPreUseChecksheetClient />
      </div>
    </>
  );
}
