// src/app/guides/wwtw-design-safety-quality/page.tsx
import { Metadata } from "next";
import { wwtwGuideSections, GUIDE_META } from "@/data/guides";
import { WwtwGuideClient } from "@/components/guides/WwtwGuideClient";

export const metadata: Metadata = {
  title: "WWTW Design, Safety & Quality Guide | Ebrora",
  description:
    "Free interactive guide for UK wastewater treatment works. Covers pre-treatment, primary, secondary, sludge and sitewide systems with interactive diagrams, sizing calculators, cost models, checklists and hold points. Based on CESWI 8, WIMES, MCERTS and CDM 2015.",
  alternates: {
    canonical: "https://www.ebrora.com/guides/wwtw-design-safety-quality",
  },
  openGraph: {
    title: "WWTW Design, Safety & Quality Guide | Ebrora",
    description:
      "Interactive guide for UK wastewater treatment works covering all stages from pre-treatment to sludge with calculators, diagrams and checklists.",
    url: "https://www.ebrora.com/guides/wwtw-design-safety-quality",
    type: "article",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
};

const guideSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: GUIDE_META.title,
  description:
    "Practical guidance for design, construction and commissioning of UK municipal wastewater treatment works.",
  url: "https://www.ebrora.com/guides/wwtw-design-safety-quality",
  publisher: {
    "@type": "Organization",
    name: "Ebrora",
    url: "https://www.ebrora.com",
  },
  about: {
    "@type": "Thing",
    name: "Wastewater Treatment Works",
  },
};

export default function WwtwGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }}
      />
      <WwtwGuideClient sections={wwtwGuideSections} meta={GUIDE_META} />
    </>
  );
}
