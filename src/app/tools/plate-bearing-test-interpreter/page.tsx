// src/app/tools/plate-bearing-test-interpreter/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Plate Bearing Test Interpreter | Free Construction Tool | Ebrora",
  description:
    "Interpret plate bearing test results per DIN 18134. Calculate Ev1 and Ev2 deformation modulus, Ev2/Ev1 ratio, pass/fail against target, CBR equivalent. Load-settlement curves, multi-test comparison, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/plate-bearing-test-interpreter" },
  openGraph: {
    title: "Plate Bearing Test Interpreter | Ebrora",
    description:
      "Plate bearing test interpretation tool for construction earthworks. DIN 18134 Ev1/Ev2 deformation modulus, compaction quality assessment, CBR correlation, and PDF export.",
    url: "https://www.ebrora.com/tools/plate-bearing-test-interpreter",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const PlateBearingTestClient = dynamic(
  () => import("@/components/plate-bearing-test-interpreter/PlateBearingTestClient"),
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
        <div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Plate Bearing Test Interpreter",
  description:
    "Interpret plate bearing test results per DIN 18134. Calculate Ev1 and Ev2 deformation modulus from load-settlement data, Ev2/Ev1 compaction quality ratio, CBR equivalent, multi-test comparison with pass/fail assessment, and professional PDF export.",
  url: "https://www.ebrora.com/tools/plate-bearing-test-interpreter",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function PlateBearingTestInterpreterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Plate Bearing Test Interpreter" }]} />

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
            Plate Bearing Test Interpreter
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Interpret plate bearing test results per DIN 18134. Calculate Ev1 and Ev2 deformation modulus, Ev2/Ev1 compaction quality ratio, pass/fail against 20 target presets, CBR equivalent, load-settlement curves with hysteresis loop, multi-test comparison, and professional PDF export.
          </p>
        </div>

        <PlateBearingTestClient />
      </div>
    </>
  );
}
