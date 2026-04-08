// src/app/construction-sign-maker/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";

function BuilderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-32" />
        ))}
      </div>
    </div>
  );
}

const SignMakerClient = dynamic(
  () => import("@/components/sign-maker/SignMakerClient"),
  { ssr: false, loading: () => <BuilderSkeleton /> }
);

export const metadata: Metadata = {
  title:
    "Construction Sign Maker | Free ISO 7010 Safety Signs | Ebrora",
  description:
    "Create and download professional construction safety signs with 300 ISO 7010 compliant icons. Prohibition, warning, mandatory, safe condition and fire signs. A4 & A3, portrait or landscape. Free for signed-in users.",
  alternates: {
    canonical: "https://www.ebrora.com/construction-sign-maker",
  },
  openGraph: {
    title: "Construction Sign Maker | Free ISO 7010 Safety Signs | Ebrora",
    description:
      "Create professional construction signs with 300+ ISO 7010 icons. Download print-ready A4 & A3 PDFs. Free for signed-in users.",
    url: "https://www.ebrora.com/construction-sign-maker",
    type: "website",
    images: [
      { url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Sign Maker | Free ISO 7010 Safety Signs | Ebrora",
    description:
      "Create professional construction signs with 300+ ISO 7010 icons. Free print-ready PDFs.",
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Construction Sign Maker",
  description:
    "Create and download professional construction safety signs with 300 ISO 7010 compliant icons across prohibition, warning, mandatory, safe condition and fire categories.",
  url: "https://www.ebrora.com/construction-sign-maker",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
  featureList: [
    "300 ISO 7010 compliant safety sign icons",
    "Prohibition, warning, mandatory, safe condition and fire categories",
    "Custom text-only signs with colour picker",
    "A4 and A3 paper sizes",
    "Portrait and landscape orientation",
    "3 font choices: Standard, Narrow, Impact",
    "4 text sizes with up to 4 lines",
    "Multi-sign batch PDF export",
    "Print-ready 300dpi PDF output",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are the safety sign icons ISO 7010 compliant?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All 300 icons are sourced from the ISO 7010 standard covering prohibition (P-series), warning (W-series), mandatory (M-series), safe condition (E-series) and fire equipment (F-series) categories.",
      },
    },
    {
      "@type": "Question",
      name: "What paper sizes are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A4 (210×297mm) and A3 (297×420mm) in both portrait and landscape orientation. PDFs are exported at 300dpi for crisp print quality.",
      },
    },
    {
      "@type": "Question",
      name: "Is the Construction Sign Maker free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the sign maker is completely free for all signed-in Ebrora users. You can create and download as many signs as you need.",
      },
    },
    {
      "@type": "Question",
      name: "Can I create multi-sign batch PDFs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Add multiple signs to a batch and download them as a single PDF with one sign per page. All signs in a batch share the same paper size and orientation.",
      },
    },
    {
      "@type": "Question",
      name: "Can I make custom text-only signs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Custom / Text Only option lets you create signs with any background colour, border colour and text colour — ideal for site rules boards, directional information or bespoke notices.",
      },
    },
  ],
};

export default function ConstructionSignMakerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-700">
              Live
            </span>
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-blue-50 text-blue-600">
              Free
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Construction Sign Maker
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-3xl mx-auto leading-relaxed">
            Create professional safety signs with 300 ISO 7010 compliant icons. Choose a
            category, pick an icon, add your text, and download print-ready A4 or A3 PDFs.
          </p>
        </div>

        {/* Builder */}
        <SignMakerClient />

        {/* SEO Content */}
        <div className="mt-16 max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              ISO 7010 Compliant Construction Signs
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every icon in this sign maker is sourced from the ISO 7010 international
              standard for graphical safety symbols. ISO 7010 defines five categories of
              safety sign — prohibition (red circle with diagonal bar), warning (yellow
              triangle), mandatory (blue circle), safe condition (green rectangle) and fire
              equipment (red rectangle) — each using standardised colours, shapes and
              pictograms designed for instant recognition regardless of language.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              How to Use the Sign Maker
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Start by selecting a sign category, then choose from the available ISO 7010
              icons within that category. Add up to four lines of custom text in your
              choice of three bold, legible fonts. Adjust the text size, choose between A4
              and A3 paper, and select portrait or landscape orientation. The live preview
              updates instantly so you can see exactly how your sign will print. When
              you&apos;re happy, download the sign as a print-ready PDF rendered at 300dpi for
              crisp results on any printer.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Batch Sign Production
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Need multiple signs for a site set-up? Use the batch feature to add several
              signs to a queue, then download them all as a single multi-page PDF — one
              sign per page, ready to print and laminate.
            </p>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {(faqSchema.mainEntity as any[]).map((faq: any, i: number) => (
                <details
                  key={i}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden group"
                >
                  <summary className="px-4 py-3 text-sm font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between hover:bg-gray-50">
                    {faq.name}
                    <svg
                      className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
