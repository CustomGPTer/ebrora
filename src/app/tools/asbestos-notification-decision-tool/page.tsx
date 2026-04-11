// src/app/tools/asbestos-notification-decision-tool/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Asbestos Notification Decision Tool | Free Construction Tool | Ebrora",
  description:
    "Determine whether planned work requires an HSE-licensed asbestos contractor, ASB5 notification, or 4-stage clearance under CAR 2012. Comprehensive decision tree covering all ACM types, survey requirements, licensed/NNLW/non-licensed classification, duty holder responsibilities, and professional PDF export.",
  alternates: { canonical: "https://www.ebrora.com/tools/asbestos-notification-decision-tool" },
  openGraph: {
    title: "Asbestos Notification Decision Tool | Ebrora",
    description: "CAR 2012 asbestos notification decision tree. Licensed, NNLW, and non-licensed work classification with ASB5 requirements and PDF export.",
    url: "https://www.ebrora.com/tools/asbestos-notification-decision-tool",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const AsbestosClient = dynamic(
  () => import("@/components/asbestos-notification-decision-tool/AsbestosNotificationDecisionToolClient"),
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

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Asbestos Notification Decision Tool",
  description: "Determine whether planned work requires an HSE-licensed asbestos contractor, ASB5 notification, or 4-stage clearance under the Control of Asbestos Regulations 2012. Covers all ACM types, survey requirements, work categories, duty holder responsibilities, and record keeping obligations.",
  url: "https://www.ebrora.com/tools/asbestos-notification-decision-tool",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function AsbestosNotificationDecisionToolPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "Asbestos Notification Decision Tool" }]} />
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Asbestos Notification Decision Tool</h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            Determine whether planned work requires an HSE-licensed contractor, ASB5 notification, or 4-stage clearance under CAR 2012. Covers all ACM types, survey requirements, work categories, duty holder responsibilities, and professional PDF export.
          </p>
        </div>
        <AsbestosClient />
      </div>
    </>
  );
}
