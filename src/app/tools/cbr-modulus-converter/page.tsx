// src/app/tools/cbr-modulus-converter/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "CBR to Stiffness Modulus Converter | Construction Tool | Ebrora",
  description: "Convert California Bearing Ratio (CBR) to subgrade stiffness modulus and vice versa using Powell (TRL/DMRB), AASHTO, and South African methods. DMRB HD 26 subgrade classification, soil reference table, interactive CBR vs modulus chart, and PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/cbr-modulus-converter" },
  openGraph: { title: "CBR to Stiffness Modulus Converter | Ebrora", url: "https://www.ebrora.com/tools/cbr-modulus-converter", type: "website" },
};

const CBRClient = dynamic(() => import("@/components/cbr-modulus-converter/CBRModulusConverterClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse space-y-4 py-8"><div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div><div className="h-64 bg-gray-50 rounded-xl"/></div>,
});

export default function CBRModulusConverterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "CBR to Stiffness Modulus Converter", url: "https://www.ebrora.com/tools/cbr-modulus-converter", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "CBR to Modulus Converter" }]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">CBR to Stiffness Modulus Converter</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Convert California Bearing Ratio (CBR) to subgrade stiffness modulus and vice versa. Three conversion methods (Powell/DMRB, AASHTO, South African), DMRB HD 26 subgrade classification, 23 common soil type reference table, interactive chart, and PDF export.
          </p>
        </div>
        <CBRClient />
      </div>
    </>
  );
}
