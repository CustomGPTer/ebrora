// src/app/tools/org-chart-generator/share/[shareId]/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";

const OrgChartViewer = dynamic(
  () => import("@/components/org-chart-generator/OrgChartViewer"),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-100 rounded-xl h-[600px] max-w-[1400px] mx-auto mt-12" /> }
);

export const metadata: Metadata = {
  title: "Shared Org Chart | Ebrora",
  description: "View a shared organisation chart on Ebrora.",
};

export default function SharedOrgChartPage({
  params,
}: {
  params: { shareId: string };
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Organisation Chart
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Shared via{" "}
          <a href="https://www.ebrora.com/tools/org-chart-generator" className="text-blue-600 hover:underline">
            Ebrora Org Chart Generator
          </a>
        </p>
      </div>
      <OrgChartViewer shareId={params.shareId} />
    </div>
  );
}
