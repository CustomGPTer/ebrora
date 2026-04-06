// src/app/tools/fire-risk-score-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Fire Risk Score Calculator | Free Construction Tool | Ebrora",
  description:
    "Score fire risk on construction sites using PAS 79 methodology and the Fire Safety Order 2005. 5×5 risk matrix, three site types, action plan generator, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/fire-risk-score-calculator" },
  openGraph: {
    title: "Fire Risk Score Calculator | Ebrora",
    description:
      "PAS 79 fire risk scoring tool for site offices, live construction sites, and occupied buildings. 5×5 risk matrix with professional PDF output.",
    url: "https://www.ebrora.com/tools/fire-risk-score-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const FireRiskScoreClient = dynamic(
  () => import("@/components/fire-risk-score-calculator/FireRiskScoreClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Fire Risk Score Calculator",
  description:
    "PAS 79 / Fire Safety Order 2005 fire risk scoring tool for construction sites with 5×5 risk matrix, action plans, and professional PDF export.",
  url: "https://www.ebrora.com/tools/fire-risk-score-calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function FireRiskScoreCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Fire Risk Score Calculator" }]} />

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
            Fire Risk Score Calculator
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Score fire risk using PAS 79 methodology aligned to the Regulatory Reform (Fire Safety) Order 2005. Choose your site type, answer section questions, and generate a prioritised action plan with professional PDF export.
          </p>
        </div>

        <FireRiskScoreClient />
      </div>
    </>
  );
}
