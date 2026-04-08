// src/app/tools/sling-swl-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function CalculatorSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-24" />)}
      </div>
      <div className="flex gap-2"><div className="bg-gray-100 rounded-lg h-8 w-24" /><div className="bg-gray-100 rounded-lg h-8 w-24" /></div>
      <div className="border border-gray-200 rounded-xl overflow-hidden"><div className="bg-gray-50 h-10" />{[...Array(3)].map((_, i) => <div key={i} className="border-t border-gray-100 h-12" />)}</div>
    </div>
  );
}

const SlingSWLCalculatorClient = dynamic(
  () => import("@/components/sling-swl-calculator/SlingSWLCalculatorClient"),
  { ssr: false, loading: () => <CalculatorSkeleton /> }
);

export const metadata: Metadata = {
  title: "Sling / Lifting Gear SWL Calculator | Free Lifting Tool | Ebrora",
  description:
    "Calculate the effective Safe Working Load (SWL) of multi-leg sling sets. Mode factors, angle reduction per LEEA guidance, capacity curve chart, utilisation gauge, and professional PDF export. Free for UK construction site teams.",
  alternates: { canonical: "https://www.ebrora.com/tools/sling-swl-calculator" },
  openGraph: {
    title: "Sling / Lifting Gear SWL Calculator | Ebrora",
    description: "Free sling SWL calculator. Chain, wire rope, and textile slings. LEEA angle factors, capacity curve, utilisation gauge, and PDF export.",
    url: "https://www.ebrora.com/tools/sling-swl-calculator",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function SlingSWLCalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Sling / Lifting Gear SWL Calculator" }]} />
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Free
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Sling / Lifting Gear SWL Calculator</h1>
        <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
          Calculate the effective Safe Working Load of multi-leg sling sets.
          Enter sling type, number of legs, single-leg SWL, and the included
          angle to get instant capacity, utilisation, and risk assessment
          with a professional PDF export.
        </p>
      </div>
      <SlingSWLCalculatorClient />
    </div>
  );
}
