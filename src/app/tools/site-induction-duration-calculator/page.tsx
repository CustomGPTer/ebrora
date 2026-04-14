// src/app/tools/site-induction-duration-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Site Induction Duration Calculator | Free Construction Tool | Ebrora",
  description: "Calculate recommended site induction duration based on project type, site hazards, CDM status, and client requirements. Generates a professional agenda breakdown, refresher schedule, and comprehension test recommendation per CDM 2015, HSWA 1974, and MHSWR 1999.",
  alternates: { canonical: "https://www.ebrora.com/tools/site-induction-duration-calculator" },
  openGraph: { title: "Site Induction Duration Calculator | Ebrora", description: "Calculate recommended site induction duration with professional PDF export. CDM 2015, HSWA 1974, MHSWR 1999, CIS 36.", url: "https://www.ebrora.com/tools/site-induction-duration-calculator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const SiteInductionDurationCalculatorClient = dynamic(
  () => import("@/components/site-induction-duration-calculator/SiteInductionDurationCalculatorClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Site Induction Duration Calculator", description: "Calculate recommended site induction duration based on project type, site hazards, CDM status, and client requirements. Generates agenda breakdown, refresher schedule, and comprehension test recommendation per CDM 2015, HSWA 1974, MHSWR 1999, and CIS 36.", url: "https://www.ebrora.com/tools/site-induction-duration-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function SiteInductionDurationCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Site Induction Duration Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Site Induction Duration Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">Calculate the recommended site induction duration based on project type, site hazards, CDM status, and client requirements. Generates a professional agenda with time breakdowns, refresher schedule, and PDF export.</p>
        </div>
        <SiteInductionDurationCalculatorClient />
      </div>
    </>
  );
}
