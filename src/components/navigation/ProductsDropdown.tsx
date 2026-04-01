// src/components/navigation/ProductsDropdown.tsx
"use client";

import Link from "next/link";

interface ProductsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const products = [
  {
    title: "RAMS Builder",
    description: "Generate full RAMS documents with AI-powered interviews",
    href: "/rams-builder",
    badge: "Flagship",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "AI Document Tools",
    description: "35+ tools — COSHH, ITPs, lift plans, permits, and more",
    href: "/",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: "Premium Templates",
    description: "Professional Excel templates for construction management",
    href: "/products",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
];

export function ProductsDropdown({ isOpen, onClose }: ProductsDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]"
      role="menu"
    >
      <div className="p-2">
        {products.map((item) => (
          <Link
            key={item.href + item.title}
            href={item.href}
            onClick={onClose}
            className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
            role="menuitem"
          >
            <span className="mt-0.5 w-9 h-9 rounded-lg bg-[#1B5B50]/8 flex items-center justify-center text-[#1B5B50] opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
              {item.icon}
            </span>
            <div className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1B5B50] transition-colors">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1B5B50] text-white px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                {item.description}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5">
        <Link
          href="/pricing"
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-semibold text-[#1B5B50] hover:text-[#144840] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          View plans & pricing
        </Link>
      </div>
    </div>
  );
}
