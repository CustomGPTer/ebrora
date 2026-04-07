// src/app/tools/first-aid-needs-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "First Aid Needs Assessment Calculator | Free Construction Tool | Ebrora",
  description: "Calculate minimum first aid requirements per HSE L74 and the First-Aid Regulations 1981. FAW/EFAW ratios by risk level, shift coverage matrix, BS 8599-1 kit checklist, AED recommendations, supplementary equipment for specific hazards, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/first-aid-needs-calculator" },
  openGraph: { title: "First Aid Needs Assessment Calculator | Ebrora", description: "HSE L74 first aid needs assessment with shift coverage, kit checklist, AED recommendations, and PDF export.", url: "https://www.ebrora.com/tools/first-aid-needs-calculator", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const FirstAidNeedsCalculatorClient = dynamic(() => import("@/components/first-aid-needs-calculator/FirstAidNeedsCalculatorClient"), {
  ssr: false, loading: () => (
    <div className="animate-pulse space-y-4 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-12 bg-gray-50 rounded-xl" /><div className="h-48 bg-gray-50 rounded-xl" />
    </div>
  ),
});

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "First Aid Needs Assessment Calculator", description: "Calculate minimum first aid requirements per HSE L74 with shift coverage, BS 8599-1 kit checklist, AED recommendations, and PDF export.", url: "https://www.ebrora.com/tools/first-aid-needs-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function FirstAidNeedsCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "First Aid Needs Assessment Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">First Aid Needs Assessment Calculator</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate minimum first aid requirements per HSE L74 and the Health and Safety (First-Aid) Regulations 1981. FAW/EFAW ratios by risk level, multi-shift coverage matrix, BS 8599-1:2019 kit checklist, AED recommendations, supplementary equipment for 8 specific hazard types, optional current provision comparison, and professional PDF export.
          </p>
        </div>
        <FirstAidNeedsCalculatorClient />
      </div>
    </>
  );
}
