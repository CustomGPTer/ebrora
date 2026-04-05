// src/app/tools/access-equipment-selector/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function SelectorSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-ebrora-light/30 rounded-xl h-14" />
      <div className="bg-gray-50 rounded-xl h-48" />
      <div className="h-1.5 bg-gray-100 rounded-full" />
      <div className="bg-gray-50 rounded-xl h-64" />
      <div className="border-2 border-dashed border-gray-200 rounded-xl h-24" />
    </div>
  );
}

const AccessEquipmentClient = dynamic(
  () => import("@/components/access-equipment/AccessEquipmentClient"),
  { ssr: false, loading: () => <SelectorSkeleton /> }
);

export const metadata: Metadata = {
  title:
    "Access Equipment Selector | Free Working at Height Tool | Ebrora",
  description:
    "HSE hierarchy-compliant access equipment selector for UK construction. Enter your site conditions and get ranked recommendations for the safest reasonably practicable access equipment — scaffold, MEWPs, towers, and more. Free, instant, print-ready PDF output.",
  alternates: {
    canonical: "https://www.ebrora.com/tools/access-equipment-selector",
  },
  openGraph: {
    title: "Access Equipment Selector | Ebrora",
    description:
      "Free interactive tool for selecting the safest access equipment. HSE hierarchy compliant — 14 equipment types, automated ranking, print-ready PDF assessment.",
    url: "https://www.ebrora.com/tools/access-equipment-selector",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
};

export default function AccessEquipmentSelectorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <BreadcrumbNav
        items={[
          { label: "Free Tools", href: "/tools" },
          { label: "Access Equipment Selector" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Access Equipment Selector
        </h1>
        <p className="text-base text-gray-500 mt-2 leading-relaxed max-w-2xl">
          Intelligent decision-support tool for selecting the safest reasonably
          practicable access equipment. Complete the site conditions below and
          get HSE hierarchy-compliant recommendations — ranked, justified, and
          ready to attach to your RAMS.
        </p>
      </div>

      <AccessEquipmentClient />
    </div>
  );
}
