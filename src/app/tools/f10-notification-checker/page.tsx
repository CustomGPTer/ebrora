// src/app/tools/f10-notification-checker/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "F10 Notification Checker | Paid Construction Tool | Ebrora",
  description:
    "Determine whether a construction project requires F10 notification to HSE under CDM 2015 reg 6. Covers notifiability thresholds, update triggers, domestic client duty transfer, and site display obligations. Auto-computed person-days, countdown timeline, F10 field checklist, and professional PDF export with integrated site display stub.",
  alternates: { canonical: "https://www.ebrora.com/tools/f10-notification-checker" },
  openGraph: {
    title: "F10 Notification Checker | Ebrora",
    description:
      "CDM 2015 reg 6 F10 notifiability, update and display decision tool. Auto-computed person-days, F10 field checklist, PDF export.",
    url: "https://www.ebrora.com/tools/f10-notification-checker",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const F10NotificationCheckerClient = dynamic(
  () => import("@/components/f10-notification-checker/F10NotificationCheckerClient"),
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
  name: "F10 Notification Checker",
  description:
    "CDM 2015 reg 6 F10 notification decision tool for UK construction projects. Covers the reg 6(1) notifiability thresholds (30 working days, 20 simultaneous workers, 500 person-days), reg 6(2) update triggers, reg 7 domestic client duty transfer, and reg 6(4) site display obligations. Auto-computed person-days from planned duration and workforce, countdown timeline, F10 field checklist cross-referenced to CDM 2015 Schedule 1, HSE portal reference, and professional PDF export including an integrated A4 site display stub.",
  url: "https://www.ebrora.com/tools/f10-notification-checker",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function F10NotificationCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Free Tools", href: "/tools" }, { label: "F10 Notification Checker" }]} />

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Paid
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            F10 Notification Checker
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            CDM 2015 reg 6 notification decision tool. Auto-computed person-days, countdown timeline, update and display checks, F10 field checklist, and professional PDF export including an integrated A4 site display notice.
          </p>
        </div>

        <F10NotificationCheckerClient />
      </div>
    </>
  );
}
