// src/app/tools/lone-worker-risk-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Lone Worker Risk Score Calculator | Construction Tool | Ebrora",
  description:
    "Score lone worker risk using HSE INDG73 methodology with multiplicative risk model. 8 weighted risk factors, radar chart, risk gauge, what-if comparison, pre-start checklist, BS 8484 device recommendations, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/lone-worker-risk-calculator" },
  openGraph: {
    title: "Lone Worker Risk Score Calculator | Ebrora",
    description:
      "HSE INDG73 lone worker risk scoring tool with radar chart, what-if comparison, and white-label PDF export.",
    url: "https://www.ebrora.com/tools/lone-worker-risk-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const LoneWorkerRiskCalculatorClient = dynamic(
  () => import("@/components/lone-worker-risk-calculator/LoneWorkerRiskCalculatorClient"),
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
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Lone Worker Risk Score Calculator",
  description:
    "Score lone worker risk using HSE INDG73 methodology with multiplicative risk model. 8 weighted factors, radar chart, risk gauge, what-if comparison, BS 8484 recommendations, and white-label PDF.",
  url: "https://www.ebrora.com/tools/lone-worker-risk-calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function LoneWorkerRiskCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Lone Worker Risk Score Calculator" }]} />

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Lone Worker Risk Score Calculator
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Score lone worker risk using HSE INDG73 methodology with a multiplicative risk model. 8 weighted risk factors covering activity type, remoteness, communication, duration, and more. Radar chart, risk gauge, what-if comparison, BS 8484 device recommendations, pre-start checklist, and white-label PDF export.
          </p>
        </div>

        <LoneWorkerRiskCalculatorClient />
      </div>
    </>
  );
}
