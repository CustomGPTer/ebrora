// src/app/tools/ladder-stepladder-justification-tool/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Ladder / Stepladder Justification Tool | Construction Tool | Ebrora",
  description: "Work at Height Regulations 2005 hierarchy-of-control assessment. Step through 8 safer access options before ladders or stepladders can be justified: avoid at height, MEWP, scaffold, mobile tower, podium, hop-up, stepladder, leaning ladder. Tailored reasons per option, full audit trail, pre-use checklists, and white-label PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/ladder-stepladder-justification-tool" },
  openGraph: { title: "Ladder / Stepladder Justification Tool | Ebrora", description: "WAH Regs 2005 hierarchy assessment. Force consideration of every safer option before ladders are justified. Full audit trail and pre-use checklists.", url: "https://www.ebrora.com/tools/ladder-stepladder-justification-tool", type: "website", images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }] },
};

const ToolClient = dynamic(
  () => import("@/components/ladder-stepladder-justification-tool/LadderStepladderJustificationToolClient"),
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

const pageSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ladder / Stepladder Justification Tool", description: "Work at Height Regulations 2005 hierarchy-of-control assessment. Step through 8 safer access options before ladders or stepladders can be justified. Full audit trail, pre-use checklists, and white-label PDF export.", url: "https://www.ebrora.com/tools/ladder-stepladder-justification-tool", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" } };

export default function LadderStepladderJustificationToolPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Ladder / Stepladder Justification Tool" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Ladder / Stepladder Justification Tool</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Work at Height Regulations 2005 hierarchy assessment. Force consideration of every safer access option before ladders or stepladders can be justified. 8-stage hierarchy, tailored rejection reasons per option, full audit trail, pre-use checklists, and white-label PDF export.
          </p>
        </div>
        <ToolClient />
      </div>
    </>
  );
}
