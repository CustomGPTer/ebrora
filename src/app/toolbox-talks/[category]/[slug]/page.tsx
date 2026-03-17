// src/app/toolbox-talks/[category]/[slug]/page.tsx
// This route handles BOTH:
//   - Subfolder view: /toolbox-talks/pipelines/general → shows all talks in "General" subfolder
//   - Talk view:      /toolbox-talks/pipelines/pipeline-safety-awareness → shows single A4 talk
// Determined by checking if slug matches a subfolder name first, then a talk slug.

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllCategories,
  getCategoryBySlug,
  getSubfolder,
  getTalkBySlug,
  isSubfolderSlug,
} from "@/data/tbt-structure";
import { TbtA4Viewer } from "@/components/toolbox-talks/TbtA4Viewer";
import { TbtDownloadButton } from "@/components/toolbox-talks/TbtDownloadButton";
import { UpsellBanner } from "@/components/shared/UpsellBanner";
import { RAMS_BUILDER_UPSELL } from "@/data/upsell-config";

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: catSlug, slug } = await params;
  const cat = getCategoryBySlug(catSlug);
  if (!cat) return { title: "Not Found | Ebrora" };

  // Is it a subfolder?
  if (isSubfolderSlug(catSlug, slug)) {
    const sub = getSubfolder(catSlug, slug);
    if (!sub) return { title: "Not Found | Ebrora" };
    return {
      title: `${sub.name} — ${cat.name} Toolbox Talks | Ebrora`,
      description: `Free ${sub.name.toLowerCase()} toolbox talks from the ${cat.name} category. Download as PDF for site briefings.`,
      alternates: { canonical: `https://ebrora.com/toolbox-talks/${catSlug}/${slug}` },
      openGraph: {
        title: `${sub.name} — ${cat.name} Toolbox Talks | Ebrora`,
        description: `Free ${sub.name.toLowerCase()} toolbox talks for construction site teams.`,
        url: `https://ebrora.com/toolbox-talks/${catSlug}/${slug}`,
        type: "website",
        images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
      },
    };
  }

  // Is it a talk?
  const result = getTalkBySlug(catSlug, slug);
  if (!result) return { title: "Not Found | Ebrora" };

  return {
    title: `${result.talk.title} | ${cat.name} Toolbox Talk | Ebrora`,
    description: `Free ${result.talk.title} toolbox talk for construction site teams. Download as PDF, ready to use on site.`,
    alternates: { canonical: `https://ebrora.com/toolbox-talks/${catSlug}/${slug}` },
    openGraph: {
      title: `${result.talk.title} | Ebrora Toolbox Talks`,
      description: `Free toolbox talk: ${result.talk.title}. Download as PDF.`,
      url: `https://ebrora.com/toolbox-talks/${catSlug}/${slug}`,
      type: "article",
      images: [{ url: "https://ebrora.com/og-image.jpg", width: 1200, height: 630 }],
    },
  };
}

export function generateStaticParams() {
  const params: Array<{ category: string; slug: string }> = [];
  for (const cat of getAllCategories()) {
    for (const sub of cat.subfolders) {
      // Subfolder routes
      params.push({ category: cat.slug, slug: sub.slug });
      // Talk routes
      for (const talk of sub.talks) {
        params.push({ category: cat.slug, slug: talk.slug });
      }
    }
  }
  return params;
}

export default async function SlugPage({ params }: PageProps) {
  const { category: catSlug, slug } = await params;
  const cat = getCategoryBySlug(catSlug);
  if (!cat) notFound();

  // ─── SUBFOLDER VIEW ──────────────────────────────────────────────────────────
  if (isSubfolderSlug(catSlug, slug)) {
    const sub = getSubfolder(catSlug, slug);
    if (!sub) notFound();

    return (
      <>
        {/* Minimal hero */}
        <section className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-semibold text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
                {String(cat.number).padStart(2, "0")}-{cat.code}
              </span>
              <span className="text-emerald-300/50">/</span>
              <span className="text-xs font-semibold text-emerald-200">{sub.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: '#ffffff' }}>
              {sub.name}
            </h1>
            <p className="text-sm text-emerald-100/70">
              {cat.name} &rsaquo; {sub.name} &mdash;{" "}
              {sub.talks.length > 0
                ? `${sub.talks.length} toolbox talk${sub.talks.length !== 1 ? "s" : ""} available`
                : `${sub.expectedTalks.length} talks planned`}
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm flex-wrap">
            <Link href="/toolbox-talks" className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">
              All Categories
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={`/toolbox-talks/${catSlug}`} className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">
              {cat.name}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">{sub.name}</span>
          </div>

          {sub.talks.length > 0 ? (
            <>
              {/* A4 talk grid — side by side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {sub.talks.map((talk) => (
                  <div key={talk.ref} id={talk.slug} className="scroll-mt-24">
                    {/* Talk title bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">{talk.title}</h2>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">{talk.ref}</p>
                      </div>
                      <Link
                        href={`/toolbox-talks/${catSlug}/${talk.slug}`}
                        className="text-xs font-medium text-[#1B5745] hover:text-[#143f33] transition-colors"
                      >
                        Full view &rarr;
                      </Link>
                    </div>

                    {/* A4 card */}
                    <TbtA4Viewer htmlFile={talk.htmlFile} title={talk.title} />

                    {/* Download button */}
                    <div className="mt-4">
                      <TbtDownloadButton htmlFile={talk.htmlFile} title={talk.title} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Coming soon state */
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Coming Soon</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-2">
                We are preparing {sub.expectedTalks.length} toolbox talk{sub.expectedTalks.length !== 1 ? "s" : ""} for this section.
              </p>
              <div className="mt-6 max-w-md mx-auto text-left">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Planned topics</p>
                <ul className="space-y-1">
                  {sub.expectedTalks.slice(0, 10).map((t, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                      {t}
                    </li>
                  ))}
                  {sub.expectedTalks.length > 10 && (
                    <li className="text-xs text-gray-400 italic pl-3">
                      + {sub.expectedTalks.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Upsell */}
          <div className="mt-12">
            <UpsellBanner
              title={RAMS_BUILDER_UPSELL.title}
              description={RAMS_BUILDER_UPSELL.description}
              href={RAMS_BUILDER_UPSELL.gumroadUrl}
              variant="bottom"
            />
          </div>
        </div>
      </>
    );
  }

  // ─── INDIVIDUAL TALK VIEW ──────────────────────────────────────────────────────
  const result = getTalkBySlug(catSlug, slug);
  if (!result) notFound();

  const { talk, subfolder } = result;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
          <Link href="/toolbox-talks" className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">
            All Categories
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/toolbox-talks/${catSlug}`} className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">
            {cat.name}
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/toolbox-talks/${catSlug}/${subfolder.slug}`} className="text-[#1B5745] hover:text-[#143f33] font-medium transition-colors">
            {subfolder.name}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">{talk.title}</span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {talk.ref}
            </span>
            <span className="text-xs text-[#1B5745] font-semibold bg-[#1B5745]/8 px-2 py-0.5 rounded-full">
              FREE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {talk.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {cat.name} &rsaquo; {subfolder.name}
          </p>
        </div>

        {/* A4 viewer (full width, single column) */}
        <TbtA4Viewer htmlFile={talk.htmlFile} title={talk.title} />

        {/* Download section */}
        <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">Download this toolbox talk</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Free PDF download &mdash; 5 downloads per day
              </p>
            </div>
            <TbtDownloadButton htmlFile={talk.htmlFile} title={talk.title} />
          </div>
        </div>

        {/* Upsell */}
        <div className="mt-12">
          <UpsellBanner
            title={RAMS_BUILDER_UPSELL.title}
            description={RAMS_BUILDER_UPSELL.description}
            href={RAMS_BUILDER_UPSELL.gumroadUrl}
            variant="bottom"
          />
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: talk.title,
            description: `Free ${talk.title} toolbox talk for construction site teams.`,
            url: `https://ebrora.com/toolbox-talks/${catSlug}/${slug}`,
            encodingFormat: "application/pdf",
            isAccessibleForFree: true,
            publisher: {
              "@type": "Organization",
              name: "Ebrora",
              url: "https://ebrora.com",
            },
          }),
        }}
      />
    </>
  );
}
