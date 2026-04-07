// src/components/shared/UpsellBanner.tsx
import Link from "next/link";

interface UpsellBannerProps {
  title: string;
  description: string;
  href: string;
  price?: string;
  variant?: "sidebar" | "inline" | "bottom";
}

export function UpsellBanner({
  title,
  description,
  href,
  price,
  variant = "sidebar",
}: UpsellBannerProps) {
  if (variant === "bottom") {
    return (
      <div className="mt-12 bg-[#faf9f7] border border-[#e0ddd7] rounded-2xl p-8 sm:p-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1B5745] rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5de8b5] animate-pulse" />
            Now live
          </span>
          <h3 className="font-extrabold text-gray-900 leading-tight" style={{ fontSize: '24px' }}>{title}</h3>
          <p className="text-sm text-gray-500 max-w-lg leading-relaxed">{description}</p>
          <Link
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#1B5745] text-white text-sm font-bold rounded-xl hover:bg-[#164a3b] transition-colors"
          >
            {price ? `View - ${price}` : "Try RAMS Builder"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="bg-[#1B5745]/5 border border-[#1B5745]/10 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
        <div className="w-10 h-10 rounded-lg bg-[#1B5745]/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#1B5745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <Link
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="shrink-0 text-xs font-semibold text-[#1B5745] hover:text-[#143f33] transition-colors"
        >
          {price ? `From ${price}` : "View"} &rarr;
        </Link>
      </div>
    );
  }

  // Default: sidebar variant
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#1B5745] px-5 py-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="text-sm font-semibold text-white">Premium</span>
        </div>
      </div>
      <div className="p-5">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{description}</p>
        {price && (
          <p className="text-xs text-[#1B5745] font-semibold mt-3">{price}</p>
        )}
        <Link
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1B5745] text-white text-xs font-semibold rounded-lg hover:bg-[#164a3b] transition-colors"
        >
          {href.startsWith("http") ? "View on Gumroad" : "View Template"}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {href.startsWith("http") ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            )}
          </svg>
        </Link>
      </div>
    </div>
  );
}
