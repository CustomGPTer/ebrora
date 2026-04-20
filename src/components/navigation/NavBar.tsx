// src/components/navigation/NavBar.tsx
// Option B — Grouped dropdowns, "Get started" CTA, 48×48 hamburger
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MobileMenu } from "./MobileMenu";
import { ProductsDropdown } from "./ProductsDropdown";
import { ResourcesDropdown } from "./ResourcesDropdown";
import { ToolsDropdown } from "./ToolsDropdown";

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"products" | "resources" | "tools" | null>(null);
  const pathname = usePathname();
  const productsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const { data: session, status } = useSession();

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Click outside closes dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (!productsRef.current?.contains(t) && !resourcesRef.current?.contains(t) && !toolsRef.current?.contains(t)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  // Hover helpers
  const handleEnter = (which: "products" | "resources" | "tools") => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(which);
  };
  const handleLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 180);
  };

  // Active state
  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const isProductsActive =
    isActive("/rams-builder") ||
    isActive("/products") ||
    pathname.includes("-builder");

  const isToolsActive = isActive("/tools");

  const isResourcesActive =
    isActive("/toolbox-talks") ||
    isActive("/free-templates") ||
    isActive("/faq") ||
    isActive("/guides") ||
    isActive("/construction-sign-maker");

  const linkClass = (active: boolean) =>
    `relative text-sm font-medium transition-colors duration-200 ${
      active ? "text-[#1B5B50]" : "text-gray-700 hover:text-[#1B5B50]"
    }`;

  const underlineClass = (active: boolean) =>
    `absolute -bottom-1 left-0 h-0.5 bg-[#1B5B50] transition-all duration-200 ${
      active ? "w-full" : "w-0 group-hover:w-full"
    }`;

  const chevronIcon = (isOpen: boolean) => (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[500] transition-all duration-300 ${
          isScrolled
            ? "bg-white/97 shadow-sm backdrop-blur-md border-b border-gray-100"
            : "bg-white border-b border-gray-100"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span
                className="w-9 h-9 rounded-lg bg-[#1B5B50] flex items-center justify-center text-white text-sm font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                E
              </span>
              <span
                className="text-[#1B5B50] text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ebrora
              </span>
            </Link>

            {/* ── Desktop links (≥1024px) ── */}
            <div className="hidden lg:flex items-center gap-7">
              {/* Products dropdown */}
              <div
                ref={productsRef}
                className="relative"
                onMouseEnter={() => handleEnter("products")}
                onMouseLeave={handleLeave}
              >
                <button
                  onClick={() => setOpenDropdown(openDropdown === "products" ? null : "products")}
                  className={`group flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                    isProductsActive ? "text-[#1B5B50]" : "text-gray-700 hover:text-[#1B5B50]"
                  }`}
                  aria-expanded={openDropdown === "products"}
                  aria-haspopup="true"
                >
                  Products
                  {chevronIcon(openDropdown === "products")}
                </button>
                {/* Invisible hover bridge */}
                {openDropdown === "products" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 h-2" />
                )}
                <ProductsDropdown
                  isOpen={openDropdown === "products"}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>

              {/* Resources dropdown */}
              <div
                ref={resourcesRef}
                className="relative"
                onMouseEnter={() => handleEnter("resources")}
                onMouseLeave={handleLeave}
              >
                <button
                  onClick={() => setOpenDropdown(openDropdown === "resources" ? null : "resources")}
                  className={`group flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                    isResourcesActive ? "text-[#1B5B50]" : "text-gray-700 hover:text-[#1B5B50]"
                  }`}
                  aria-expanded={openDropdown === "resources"}
                  aria-haspopup="true"
                >
                  Resources
                  {chevronIcon(openDropdown === "resources")}
                </button>
                {openDropdown === "resources" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 h-2" />
                )}
                <ResourcesDropdown
                  isOpen={openDropdown === "resources"}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>

              {/* Calculators and Tools dropdown */}
              <div
                ref={toolsRef}
                className="relative"
                onMouseEnter={() => handleEnter("tools")}
                onMouseLeave={handleLeave}
              >
                <button
                  onClick={() => setOpenDropdown(openDropdown === "tools" ? null : "tools")}
                  className={`group flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                    isToolsActive ? "text-[#1B5B50]" : "text-gray-700 hover:text-[#1B5B50]"
                  }`}
                  aria-expanded={openDropdown === "tools"}
                  aria-haspopup="true"
                >
                  Calculators and Tools
                  {chevronIcon(openDropdown === "tools")}
                </button>
                {openDropdown === "tools" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[640px] h-2" />
                )}
                <ToolsDropdown
                  isOpen={openDropdown === "tools"}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>

              {/* Visualise — intentionally hidden from navigation.
                  Route still exists at /visualise for direct access only. */}

              {/* Blog */}
              <Link href="/blog" className={`group ${linkClass(isActive("/blog"))}`}>
                Blog
                <span className={underlineClass(isActive("/blog"))} />
              </Link>

              {/* Pricing */}
              <Link href="/pricing" className={`group ${linkClass(isActive("/pricing"))}`}>
                Pricing
                <span className={underlineClass(isActive("/pricing"))} />
              </Link>
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Desktop: Login + Get started (≥1024px) */}
              <div className="hidden lg:flex items-center gap-2.5">
                {status === "loading" ? (
                  <div className="w-16 h-9 bg-gray-100 rounded-lg animate-pulse" />
                ) : session ? (
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#1B5B50] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Account
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#1B5B50] transition-colors"
                  >
                    Login
                  </Link>
                )}
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1B5B50] rounded-lg hover:bg-[#144840] transition-colors shadow-sm"
                >
                  Get started
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>

              {/* Tablet + Mobile: compact CTA + auth (<1024px) */}
              <div className="flex lg:hidden items-center gap-1.5">
                {status !== "loading" && session && (
                  <Link
                    href="/account"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1B5B50] border border-[#1B5B50]/20 rounded-md hover:bg-[#1B5B50]/5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Account
                  </Link>
                )}
                {status !== "loading" && !session && (
                  <Link
                    href="/pricing"
                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-[#1B5B50] rounded-md hover:bg-[#144840] transition-colors"
                  >
                    Get started
                  </Link>
                )}
              </div>

              {/* ── Hamburger — 48×48, thick bars, big touch target (<1024px) ── */}
              <button
                className="lg:hidden relative w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors -mr-1"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileOpen}
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <span
                    className={`block h-[2.5px] w-6 bg-gray-800 rounded-full transition-all duration-300 origin-center ${
                      isMobileOpen ? "rotate-45 translate-y-[9px]" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2.5px] w-6 bg-gray-800 rounded-full transition-all duration-300 ${
                      isMobileOpen ? "opacity-0 scale-0" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2.5px] w-6 bg-gray-800 rounded-full transition-all duration-300 origin-center ${
                      isMobileOpen ? "-rotate-45 -translate-y-[9px]" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/tablet full-screen menu */}
      <MobileMenu isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Spacer so page content doesn't sit under the fixed nav */}
      <div className="h-16" />
    </>
  );
}
