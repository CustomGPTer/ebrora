// src/app/tools/fatigue-risk-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Fatigue Risk Calculator (Shift Patterns) | Free Construction Tool | Ebrora",
  description:
    "Assess shift pattern fatigue risk using the HSE RR446 model. Weekly or rotation patterns up to 28 days, fatigue index chart, cumulative sleep debt tracking, relative risk multipliers, Working Time Regulations compliance check, preset patterns, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/fatigue-risk-calculator" },
  openGraph: {
    title: "Fatigue Risk Calculator (Shift Patterns) | Ebrora",
    description: "HSE RR446 fatigue risk scoring for construction shift patterns with WTR compliance and PDF export.",
    url: "https://www.ebrora.com/tools/fatigue-risk-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const FatigueRiskCalculatorClient = dynamic(
  () => import("@/components/fatigue-risk-calculator/FatigueRiskCalculatorClient"),
  { ssr: false, loading: () => (
    <div className="animate-pulse space-y-4 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" />
    </div>
  )}
);

const pageSchema = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "Fatigue Risk Calculator (Shift Patterns)",
  description: "Assess shift pattern fatigue risk using HSE RR446 model. Weekly or rotation patterns, fatigue index, sleep debt, risk multipliers, WTR compliance, and PDF export.",
  url: "https://www.ebrora.com/tools/fatigue-risk-calculator",
  applicationCategory: "UtilitiesApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function FatigueRiskCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Fatigue Risk Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Fatigue Risk Calculator (Shift Patterns)</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Assess shift pattern fatigue risk using the HSE RR446 model. Enter weekly or rotation patterns up to 28 days with preset templates. Fatigue index chart, cumulative sleep debt tracking, relative risk multipliers, Working Time Regulations compliance check, and professional landscape PDF export.
          </p>
        </div>
        <FatigueRiskCalculatorClient />
      </div>
    </>
  );
}
