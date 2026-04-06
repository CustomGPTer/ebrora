// src/app/tools/noise-exposure-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Noise Exposure Calculator (LEP,d) | Construction Tool | Ebrora",
  description: "Calculate daily personal noise exposure LEP,d for construction activities per the Control of Noise at Work Regulations 2005, HSE L108, and ISO 9612. 90+ activity database, HPE attenuation (SNR method), action value checks, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/noise-exposure-calculator" },
  openGraph: { title: "Noise Exposure Calculator (LEP,d) | Ebrora", url: "https://www.ebrora.com/tools/noise-exposure-calculator", type: "website" },
};

const NoiseClient = dynamic(() => import("@/components/noise-exposure-calculator/NoiseExposureCalculatorClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function NoiseExposureCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Noise Exposure Calculator (LEP,d)", url: "https://www.ebrora.com/tools/noise-exposure-calculator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Noise Exposure Calculator" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Noise Exposure Calculator (LEP,d)</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Calculate daily personal noise exposure LEP,d for construction operatives. {ACTIVITY_DATABASE_COUNT}+ activity database with manual entry, HPE attenuation using the SNR method with real-world derating, exposure action value checks, and white-label PDF assessment export.
          </p>
        </div>
        <NoiseClient />
      </div>
    </>
  );
}

const ACTIVITY_DATABASE_COUNT = 90;
