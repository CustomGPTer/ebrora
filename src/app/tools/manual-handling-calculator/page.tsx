// src/app/tools/manual-handling-calculator/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

function CalculatorSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-ebrora-light/30 rounded-xl h-14" />
      <div className="bg-gray-50 rounded-xl h-56" />
      <div className="border border-blue-200 rounded-xl h-48" />
      <div className="border border-gray-200 rounded-xl h-32" />
    </div>
  );
}

const ManualHandlingCalculatorClient = dynamic(
  () => import("@/components/manual-handling-calculator/ManualHandlingCalculatorClient"),
  { ssr: false, loading: () => <CalculatorSkeleton /> }
);

export const metadata: Metadata = {
  title:
    "Manual Handling Risk Score Calculator | Free MAC & RAPP Tool | Ebrora",
  description:
    "Score manual handling tasks using HSE MAC and RAPP methodologies. 120+ civil engineering task library, automatic risk banding with HSE colour-coded output, suggested controls, re-score workflow, and professional PDF export. Free for UK construction site teams.",
  alternates: {
    canonical: "https://www.ebrora.com/tools/manual-handling-calculator",
  },
  openGraph: {
    title: "Manual Handling Risk Score Calculator | Ebrora",
    description:
      "Free MAC and RAPP manual handling risk calculator. 120+ tasks, HSE colour-coded scoring, suggested controls, PDF export.",
    url: "https://www.ebrora.com/tools/manual-handling-calculator",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
};

export default function ManualHandlingCalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <BreadcrumbNav
        items={[
          { label: "Free Tools", href: "/tools" },
          { label: "Manual Handling Calculator" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Manual Handling Risk Score Calculator
        </h1>
        <p className="text-base text-gray-500 mt-2 leading-relaxed max-w-2xl">
          Quick supervisor assessment combining HSE MAC (lift, carry, team
          handling) and RAPP (push and pull) methodologies. Select your task,
          score the risk factors, apply controls, and download a professional
          PDF assessment.
        </p>
      </div>

      <ManualHandlingCalculatorClient />
    </div>
  );
}
