// src/components/navigation/MobileMenu.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const isResourcesActive =
    isActive("/toolbox-talks") ||
    isActive("/tools") ||
    isActive("/free-templates");

  const linkClasses = (href: string) =>
    `block px-4 py-3.5 text-base font-medium rounded-lg transition-colors ${
      isActive(href)
        ? "text-[#1B5745] bg-[#1B5745]/5"
        : "text-gray-700 hover:text-[#1B5745] hover:bg-gray-50"
    }`;

  const resourcesSubLinkClasses = (href: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive(href)
        ? "text-[#1B5745] bg-[#1B5745]/5"
        : "text-gray-600 hover:text-[#1B5745] hover:bg-gray-50"
    }`;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#1B5745] flex items-center justify-center text-white text-xs font-bold">
              E
            </span>
            <span
              className="text-[#1B5745] text-lg font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ebrora
            </span>
          </Link>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <div className="overflow-y-auto h-[calc(100%-4rem)] px-3 py-4">
          <div className="space-y-1">
            <Link href="/#products" onClick={onClose} className={linkClasses("/#products")}>
              Templates
            </Link>

            {/* Resources accordion */}
            <div>
              <button
                onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-base font-medium rounded-lg transition-colors ${
                  isResourcesActive
                    ? "text-[#1B5745] bg-[#1B5745]/5"
                    : "text-gray-700 hover:text-[#1B5745] hover:bg-gray-50"
                }`}
                aria-expanded={isResourcesExpanded}
              >
                Resources
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isResourcesExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Sub-links with smooth expand */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isResourcesExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="ml-3 pl-3 border-l-2 border-[#1B5745]/20 space-y-0.5 py-1">
                  <Link
                    href="/toolbox-talks"
                    onClick={onClose}
                    className={resourcesSubLinkClasses("/toolbox-talks")}
                  >
                    <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div>
                      <span className="block text-sm font-semibold">Toolbox Talks</span>
                      <span className="block text-xs text-gray-400 mt-0.5">27 safety categories</span>
                    </div>
                  </Link>

                  <Link
                    href="/tools"
                    onClick={onClose}
                    className={resourcesSubLinkClasses("/tools")}
                  >
                    <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
                    </svg>
                    <div>
                      <span className="block text-sm font-semibold">Free Tools</span>
                      <span className="block text-xs text-gray-400 mt-0.5">Interactive calculators</span>
                    </div>
                  </Link>

                  <Link
                    href="/free-templates"
                    onClick={onClose}
                    className={resourcesSubLinkClasses("/free-templates")}
                  >
                    <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                    </svg>
                    <div>
                      <span className="block text-sm font-semibold">Free Templates</span>
                      <span className="block text-xs text-gray-400 mt-0.5">Excel, Word, PowerPoint</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/blog" onClick={onClose} className={linkClasses("/blog")}>
              Blog
            </Link>

            <Link href="/faq" onClick={onClose} className={linkClasses("/faq")}>
              FAQ
            </Link>

            <Link href="/#about" onClick={onClose} className={linkClasses("/#about")}>
              About
            </Link>

            <Link href="/#contact" onClick={onClose} className={linkClasses("/#contact")}>
              Contact
            </Link>
          </div>

          {/* RAMS Builder CTA */}
          <div className="mt-6 px-2">
            <Link
              href="/rams-builder"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1B5745] text-white text-sm font-semibold rounded-xl hover:bg-[#164a3b] transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              RAMS Builder
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                New
              </span>
            </Link>
          </div>

          {/* Footer info */}
          <div className="mt-8 px-4 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed">
              Professional construction templates and tools built by site teams, for site teams.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
