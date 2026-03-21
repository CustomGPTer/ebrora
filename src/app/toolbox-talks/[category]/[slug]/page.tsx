// src/app/toolbox-talks/[category]/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TBT_CATEGORIES,
  getTalkBySlug,
  isSubfolderSlug,
  type TbtSubfolder,
  type TbtTalk,
} from "@/data/tbt-structure";
import { TbtA5Viewer } from "@/components/toolbox-talks/TbtA5Viewer";
import { TbtA4Viewer } from "@/components/toolbox-talks/TbtA4Viewer";
import { TbtDownloadButton } from "@/components/toolbox-talks/TbtDownloadButton";

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

/* —— helpers —— */

function findCategoryAndSub(
  categorySlug: string,
  subSlug: string
): {
  category: (typeof TBT_CATEGORIES)[number];
  sub: TbtSubfolder;
} | null {
  const category = TBT_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category) return null;
  const sub = category.subfolders.find((s) => s.slug === subSlug);
  if (!sub) return null;
  return { category, sub };
}

/* —— metadata —— */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: catSlug, slug } = await params;

  // subfolder page
  const subResult = findCategoryAndSub(catSlug, slug);
  if (subResult) {
    const { category, sub } = subResult;
    return {
      title: `${sub.name} — ${category.name} Toolbox Talks | Ebrora`,
      description: `Free ${sub.name.toLowerCase()} toolbox talks from the ${category.name} category. Download as PDF for site briefings.`,
      alternates: {
        canonical: `https://www.ebrora.com/toolbox-talks/${catSlug}/${slug}`,
      },
      openGraph: {
        title: `${sub.name} — ${category.name} Toolbox Talks | Ebrora`,
        description: `Free ${sub.name.toLowerCase()} toolbox talks for construction site teams.`,
        url: `https://www.ebrora.com/toolbox-talks/${catSlug}/${slug}`,
        images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
        type: "website",
      },
    };
  }

  // single talk page
  const talkResult = getTalkBySlug(catSlug, slug);
  if (talkResult) {
    const { talk, subfolder, category } = talkResult;
    return {
      title: `${talk.title} — ${category.name} Toolbox Talks | Ebrora`,
      description: `${talk.title} toolbox talk from the ${category.name} category. Free download as PDF.`,
      alternates: {
        canonical: `https://www.ebrora.com/toolbox-talks/${catSlug}/${slug}`,
      },
      openGraph: {
        title: `${talk.title} — ${category.name} Toolbox Talks | Ebrora`,
        description: `${talk.title} toolbox talk. Free PDF for site briefings.`,
        url: `https://www.ebrora.com/toolbox-talks/${catSlug}/${slug}`,
        images: [{ url: "https://www.ebrora.com/og-image.jpg", width: 1200, height: 630 }],
        type: "website",
      },
    };
  }

  return { title: "Not Found | Ebrora" };
}

/* —— page component —— */

export default async function SlugPage({ params }: PageProps) {
  const { category: catSlug, slug } = await params;

  /* ---- Try subfolder first ---- */
  const subResult = findCategoryAndSub(catSlug, slug);
  if (subResult) {
    const { category, sub } = subResult;
    return (
      <>
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-semibold text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
                {category.code}
              </span>
              <span className="text-emerald-300/50">/</span>
              <span className="text-xs font-semibold text-emerald-200">
                {sub.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: "#ffffff" }}>
              {sub.name}
            </h1>
            <p className="text-sm text-emerald-100/70">
              {category.name} \u203A {sub.name} —{" "}
              {sub.talks.length} toolbox talk{sub.talks.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-8 text-sm flex-wrap">
            <Link href="/toolbox-talks" className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">All Categories</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/toolbox-talks/${catSlug}`} className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">{category.name}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">{sub.name}</span>
          </div>

          {/* A5 Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sub.talks.map((talk: TbtTalk) => (
              <div key={talk.ref} id={talk.slug} className="scroll-mt-24">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{talk.title}</h2>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">{talk.ref}</p>
                  </div>
                  <Link href={`/toolbox-talks/${catSlug}/${talk.slug}`} className="text-xs font-medium text-[#1B5745] hover:text-[#143f33] transition-colors">
                    Full view
                  </Link>
                </div>
                <TbtA5Viewer htmlFile={talk.htmlFile} title={talk.title} />
                <div className="mt-3">
                  <TbtDownloadButton htmlFile={talk.htmlFile} title={talk.title} />
                </div>
              </div>
            ))}
          </div>

          {/* RAMS Builder upsell */}
          <div className="mt-12">
            <div className="mt-12 bg-gradient-to-r from-[#1B5745] to-[#236b55] rounded-2xl p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-white" style={{ fontSize: "20px" }}>RAMS Builder</h3>
                  <p className="text-sm text-white/80 mt-1 leading-relaxed">
                    Generate professional Risk Assessment and Method Statements in minutes. 10 document formats, site-specific content, instant Word download.
                  </p>
                </div>
                <Link href="/rams-builder" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#1B5745] text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                  Learn More
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---- Try individual talk ---- */
  const talkResult = getTalkBySlug(catSlug, slug);
  if (talkResult) {
    const { talk, subfolder, category } = talkResult;
    return (
      <>
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-semibold text-emerald-300 bg-white/10 px-2 py-0.5 rounded">{category.code}</span>
              <span className="text-emerald-300/50">/</span>
              <span className="text-xs font-semibold text-emerald-200">{subfolder.name}</span>
              <span className="text-emerald-300/50">/</span>
              <span className="text-xs font-mono text-emerald-200/70">{talk.ref}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: "#ffffff" }}>{talk.title}</h1>
            <p className="text-sm text-emerald-100/70">{category.name} \u203A {subfolder.name} \u203A {talk.title}</p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-8 text-sm flex-wrap">
            <Link href="/toolbox-talks" className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">All Categories</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/toolbox-talks/${catSlug}`} className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">{category.name}</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/toolbox-talks/${catSlug}/${subfolder.slug}`} className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">{subfolder.name}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">{talk.title}</span>
          </div>

          {/* A4 full-size viewer */}
          <div className="max-w-4xl mx-auto">
            <TbtA4Viewer htmlFile={talk.htmlFile} title={talk.title} />

            {/* Download / Print */}
            <div className="mt-6">
              <TbtDownloadButton htmlFile={talk.htmlFile} title={talk.title} />
            </div>
          </div>

          {/* RAMS Builder upsell */}
          <div className="mt-12">
            <div className="mt-12 bg-gradient-to-r from-[#1B5745] to-[#236b55] rounded-2xl p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-white" style={{ fontSize: "20px" }}>RAMS Builder</h3>
                  <p className="text-sm text-white/80 mt-1 leading-relaxed">
                    Generate professional Risk Assessment and Method Statements in minutes. 10 document formats, site-specific content, instant Word download.
                  </p>
                </div>
                <Link href="/rams-builder" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#1B5745] text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                  Learn More
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---- nothing matched ---- */
  notFound();
}
