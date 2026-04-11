// src/app/tools/printable-paper/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Free Printable Paper | Graph Paper, Grid Paper, Engineering Paper | Ebrora",
  description:
    "200+ free printable paper templates for engineers, surveyors, and construction professionals. Square grid, dot grid, isometric, hexagonal, lined, engineering section, logarithmic, polar, and surveying paper. A4 and A3, portrait and landscape, custom colours, title blocks, and scale rulers. Download as PDF.",
  alternates: { canonical: "https://www.ebrora.com/tools/printable-paper" },
  openGraph: {
    title: "Free Printable Paper for Construction Professionals | Ebrora",
    description: "200+ free printable graph paper, grid paper, engineering paper, and surveying templates. A4/A3, custom colours, instant PDF download.",
    url: "https://www.ebrora.com/tools/printable-paper",
    type: "website",
    images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
  },
  keywords: [
    "free graph paper", "printable grid paper", "engineering paper", "section paper",
    "isometric paper", "dot grid paper", "hexagonal paper", "polar graph paper",
    "semi-log paper", "log-log paper", "Smith chart", "surveying level book",
    "construction paper templates", "A4 graph paper", "A3 graph paper",
    "free printable paper", "engineering drawing paper", "cross section paper",
    "Cornell notes paper", "lined paper", "computation pad",
  ],
};

const PrintablePaperClient = dynamic(
  () => import("@/components/printable-paper/PrintablePaperClient"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-8">
        <div className="flex gap-2 overflow-hidden">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-10 w-24 bg-gray-100 rounded-lg shrink-0" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}</div>
          <div className="lg:col-span-3"><div className="h-[500px] bg-gray-50 rounded-xl" /></div>
        </div>
      </div>
    ),
  }
);

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Free Printable Paper Generator",
  description: "200+ free printable paper templates including square grid, dot grid, isometric, hexagonal, lined, engineering section, logarithmic, polar, and surveying paper. A4 and A3 sizes, portrait and landscape, custom grid colours, paper tints, title blocks, and scale rulers. Instant PDF download with no sign-up required.",
  url: "https://www.ebrora.com/tools/printable-paper",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  publisher: { "@type": "Organization", name: "Ebrora", url: "https://www.ebrora.com" },
};

export default function PrintablePaperPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BreadcrumbNav items={[{ label: "Tools", href: "/tools" }, { label: "Printable Paper" }]} />

        {/* ── SEO Hero ──────────────────────────────────────── */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-[#1B5745] via-[#1B5745] to-[#143F33] rounded-2xl px-6 py-8 sm:py-10 text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20">
                Free
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
              Free Printable Paper for Construction Professionals
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
              200+ paper templates designed for engineers, surveyors, foremen, and project managers.
              Square grid, dot grid, isometric, hexagonal, engineering section, logarithmic, polar, and surveying paper.
              A4 and A3 sizes with custom colours, title blocks, and scale rulers.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Graph Paper", "Dot Grid", "Isometric", "Engineering Section", "Semi-Log", "Polar", "Level Book", "Cross-Section"].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <PrintablePaperClient />
      </div>
    </>
  );
}
