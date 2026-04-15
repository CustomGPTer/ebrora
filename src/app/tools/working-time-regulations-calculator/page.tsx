// src/app/tools/working-time-regulations-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Working Time Regulations Calculator | Free Construction Tool | Ebrora",
  description: "Check compliance with the Working Time Regulations 1998. Maximum weekly hours, night worker limits, rest breaks, daily and weekly rest, annual leave entitlement, under-18 rules, and opt-out validity. RAG-rated compliance output with corrective actions and PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/working-time-regulations-calculator" },
  openGraph: { title: "Working Time Regulations Calculator | Ebrora", description: "WTR 1998 compliance checker with shift pattern analysis, night worker detection, break compliance, and corrective actions.", url: "https://www.ebrora.com/tools/working-time-regulations-calculator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const ToolClient = dynamic(
  () => import("@/components/working-time-regulations-calculator/WorkingTimeRegulationsCalculatorClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Working Time Regulations Calculator", description: "Check compliance with the Working Time Regulations 1998. Maximum weekly hours, night worker limits, rest breaks, daily and weekly rest, annual leave entitlement, under-18 rules, opt-out validity, and corrective actions with PDF export.", url: "https://www.ebrora.com/tools/working-time-regulations-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function WorkingTimeRegulationsCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Working Time Regulations Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Working Time Regulations Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Check compliance with the Working Time Regulations 1998. Analyse shift patterns for maximum weekly hours, night worker limits, rest breaks, daily and weekly rest periods, and annual leave entitlement. Full under-18 young worker rules, opt-out validity guidance, and RAG-rated corrective actions with PDF export.
          </p>
        </div>
        <ToolClient />
      </div>
    </>
  );
}
