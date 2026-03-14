// src/components/navigation/NavBar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMenu } from "./MobileMenu";
import { ResourcesDropdown } from "./ResourcesDropdown";

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const pathname = usePathname();
  const resourcesRef = useRef<HTMLDivElement>(null);
  const resourcesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsResourcesOpen(false);
  }, [pathname]);

  // Close resources dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resourcesRef.current &&
        !resourcesRef.current.contains(event.target as Node)
      ) {
        setIsResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleResourcesEnter = () => {
    if (resourcesTimeoutRef.current) {
      clearTimeout(resourcesTimeoutRef.current);
    }
    setIsResourcesOpen(true);
  };

  const handleResourcesLeave = () => {
    resourcesTimeoutRef.current = setTimeout(() => {
      setIsResourcesOpen(false);
    }, 150);
  };

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navLinkClasses = (href: string) =>
    `relative text-sm font-medium transition-colors duration-200 ${
      isActive(href)
        ? "text-[#1B5745]"
        : "text-gray-700 hover:text-[#1B5745]"
    }`;

  const activeUnderline = (href: string) =>
    `absolute -bottom-1 left-0 h-0.5 bg-[#1B5745] transition-all duration-200 ${
      isActive(href) ? "w-full" : "w-0 group-hover:w-full"
    }`;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/97 shadow-sm backdrop-blur-md border-b border-gray-100"
            : "bg-white border-b border-gray-100"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="w-9 h-9 rounded-lg bg-[#1B5745] flex items-center justify-center text-white text-sm font-bold">
                E
              </span>
              <span className="text-[#1B5745] text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ebrora
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-7">
              <Link href="/#products" className={`group ${navLinkClasses("/#products")}`}>
                Templates
                <span className={activeUnderline("/#products")} />
              </Link>

              {/* Resources dropdown */}
              <div
                ref={resourcesRef}
                className="relative"
                onMouseEnter={handleResourcesEnter}
                onMouseLeave={handleResourcesLeave}
              >
                <button
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                  className={`group flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                    isActive("/toolbox-talks") ||
                    isActive("/tools") ||
                    isActive("/free-templates")
                      ? "text-[#1B5745]"
                      : "text-gray-700 hover:text-[#1B5745]"
                  }`}
                  aria-expanded={isResourcesOpen}
                  aria-haspopup="true"
                >
                  Resources
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isResourcesOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <ResourcesDropdown
                  isOpen={isResourcesOpen}
                  onClose={() => setIsResourcesOpen(false)}
                />
              </div>

              <Link href="/blog" className={`group ${navLinkClasses("/blog")}`}>
                Blog
                <span className={activeUnderline("/blog")} />
              </Link>

              <Link href="/rams-builder" className={`group ${navLinkClasses("/rams-builder")}`}>
                <span className="flex items-center gap-1.5">
                  RAMS Builder
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#1B5745] text-white px-1.5 py-0.5 rounded">
                    New
                  </span>
                </span>
                <span className={activeUnderline("/rams-builder")} />
              </Link>

              <Link href="/faq" className={`group ${navLinkClasses("/faq")}`}>
                FAQ
                <span className={activeUnderline("/faq")} />
              </Link>

              <Link href="/#about" className={`group ${navLinkClasses("/#about")}`}>
                About
                <span className={activeUnderline("/#about")} />
              </Link>

              <Link href="/#contact" className={`group ${navLinkClasses("/#contact")}`}>
                Contact
                <span className={activeUnderline("/#contact")} />
              </Link>
            </div>

            {/* Hamburger button - mobile/tablet */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-0.5 w-5 bg-gray-700 rounded-full transition-all duration-300 origin-center ${
                    isMobileOpen ? "rotate-45 translate-y-[7px]" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-gray-700 rounded-full transition-all duration-300 ${
                    isMobileOpen ? "opacity-0 scale-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-gray-700 rounded-full transition-all duration-300 origin-center ${
                    isMobileOpen ? "-rotate-45 -translate-y-[7px]" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Spacer so content doesn't go under fixed nav */}
      <div className="h-16" />
    </>
  );
}
