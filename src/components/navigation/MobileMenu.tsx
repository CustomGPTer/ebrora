// src/components/navigation/MobileMenu.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
    const pathname = usePathname();
    const { data: session, status } = useSession();

  function isActive(href: string): boolean {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
  }

  const isResourcesActive =
        isActive("/toolbox-talks") ||
        isActive("/tools") ||
        isActive("/free-templates");

  return (
        <>
          {/* Backdrop overlay */}
              <div
                        className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                        onClick={onClose}
                        aria-hidden="true"
                      />
        
          {/* Full-screen panel */}
              <div
                        className={`fixed inset-0 z-[210] bg-white transition-all duration-300 ease-out lg:hidden ${
                                    isOpen
                                      ? "opacity-100 translate-y-0"
                                      : "opacity-0 -translate-y-4 pointer-events-none"
                        }`}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation menu"
                      >
                {/* Header */}
                      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
                                <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                                            <span className="w-8 h-8 rounded-lg bg-[#1B5B50] flex items-center justify-center text-white text-xs font-bold">
                                                          E
                                            </span>
                                            <span
                                                            className="text-[#1B5B50] text-lg font-bold tracking-tight"
                                                            style={{ fontFamily: "'Playfair Display', serif" }}
                                                          >
                                                          Ebrora
                                            </span>
                                </Link>
                                <button
                                              onClick={onClose}
                                              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                              aria-label="Close menu"
                                            >
                                            <svg
                                                            className="w-5 h-5 text-gray-500"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                          >
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                </button>
                      </div>
              
                {/* Navigation content */}
                      <div className="overflow-y-auto h-[calc(100%-4rem)] flex flex-col">
                        {/* Primary nav links */}
                                <div className="px-4 py-5 space-y-1">
                                  {/* Templates */}
                                            <Link
                                                            href="/#products"
                                                            onClick={onClose}
                                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                                                                              isActive("/#products")
                                                                                ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                : "text-gray-800 hover:bg-gray-50"
                                                            }`}
                                                          >
                                                          <svg className="w-5 h-5 text-[#1B5B50]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                                          </svg>
                                                          <span className="text-base font-medium">Templates</span>
                                            </Link>
                                
                                  {/* Blog */}
                                            <Link
                                                            href="/blog"
                                                            onClick={onClose}
                                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                                                                              isActive("/blog")
                                                                                ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                : "text-gray-800 hover:bg-gray-50"
                                                            }`}
                                                          >
                                                          <svg className="w-5 h-5 text-[#1B5B50]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                                                          </svg>
                                                          <span className="text-base font-medium">Blog</span>
                                            </Link>
                                
                                  {/* Resources accordion */}
                                            <div>
                                                          <button
                                                                            onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
                                                                            className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-colors ${
                                                                                                isResourcesActive
                                                                                                  ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                                  : "text-gray-800 hover:bg-gray-50"
                                                                            }`}
                                                                            aria-expanded={isResourcesExpanded}
                                                                          >
                                                                          <span className="flex items-center gap-3">
                                                                                            <svg className="w-5 h-5 text-[#1B5B50]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                                                              </svg>
                                                                                            <span className="text-base font-medium">Resources</span>
                                                                          </span>
                                                                          <svg
                                                                                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
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
                                            
                                              {/* Sub-links */}
                                                          <div
                                                                            className={`overflow-hidden transition-all duration-200 ${
                                                                                                isResourcesExpanded ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"
                                                                            }`}
                                                                          >
                                                                          <div className="ml-8 space-y-0.5 py-1">
                                                                                            <Link
                                                                                                                  href="/toolbox-talks"
                                                                                                                  onClick={onClose}
                                                                                                                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                                                                                                          isActive("/toolbox-talks")
                                                                                                                                            ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                                                                            : "text-gray-600 hover:text-[#1B5B50] hover:bg-gray-50"
                                                                                                                    }`}
                                                                                                                >
                                                                                                                Toolbox Talks
                                                                                              </Link>
                                                                                            <Link
                                                                                                                  href="/tools"
                                                                                                                  onClick={onClose}
                                                                                                                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                                                                                                          isActive("/tools")
                                                                                                                                            ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                                                                            : "text-gray-600 hover:text-[#1B5B50] hover:bg-gray-50"
                                                                                                                    }`}
                                                                                                                >
                                                                                                                Free Tools
                                                                                              </Link>
                                                                                            <Link
                                                                                                                  href="/free-templates"
                                                                                                                  onClick={onClose}
                                                                                                                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                                                                                                          isActive("/free-templates")
                                                                                                                                            ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                                                                            : "text-gray-600 hover:text-[#1B5B50] hover:bg-gray-50"
                                                                                                                    }`}
                                                                                                                >
                                                                                                                Free Templates
                                                                                              </Link>
                                                                          </div>
                                                          </div>
                                            </div>
                                
                                  {/* FAQ */}
                                            <Link
                                                            href="/faq"
                                                            onClick={onClose}
                                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                                                                              isActive("/faq")
                                                                                ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                : "text-gray-800 hover:bg-gray-50"
                                                            }`}
                                                          >
                                                          <svg className="w-5 h-5 text-[#1B5B50]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                                          </svg>
                                                          <span className="text-base font-medium">FAQ</span>
                                            </Link>
                                
                                  {/* About */}
                                            <Link
                                                            href="/#about"
                                                            onClick={onClose}
                                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                                                                              isActive("/#about")
                                                                                ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                : "text-gray-800 hover:bg-gray-50"
                                                            }`}
                                                          >
                                                          <svg className="w-5 h-5 text-[#1B5B50]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                          </svg>
                                                          <span className="text-base font-medium">About</span>
                                            </Link>
                                
                                  {/* Contact */}
                                            <Link
                                                            href="/#contact"
                                                            onClick={onClose}
                                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                                                                              isActive("/#contact")
                                                                                ? "text-[#1B5B50] bg-[#1B5B50]/5"
                                                                                : "text-gray-800 hover:bg-gray-50"
                                                            }`}
                                                          >
                                                          <svg className="w-5 h-5 text-[#1B5B50]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                          </svg>
                                                          <span className="text-base font-medium">Contact</span>
                                            </Link>
                                </div>
                      
                        {/* Bottom section — sits right after nav links */}
                                <div className="px-4 pb-6 space-y-3 border-t border-gray-100 pt-4">
                                  {/* RAMS Builder CTA */}
                                            <Link
                                                            href="/rams-builder"
                                                            onClick={onClose}
                                                            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-[#1B5B50] text-white text-sm font-semibold rounded-xl hover:bg-[#144840] transition-colors shadow-sm"
                                                          >
                                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                          </svg>
                                                          RAMS Builder
                                                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                                                                          New
                                                          </span>
                                            </Link>
                                
                                  {/* Login / Account */}
                                  {status !== "loading" &&
                                                  (session ? (
                                                                    <div className="flex gap-2">
                                                                                      <Link
                                                                                                            href="/account"
                                                                                                            onClick={onClose}
                                                                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#1B5B50] border border-[#1B5B50]/20 rounded-xl hover:bg-[#1B5B50]/5 transition-colors"
                                                                                                          >
                                                                                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                                                                            </svg>
                                                                                                          Account
                                                                                        </Link>
                                                                                      <button
                                                                                                            onClick={() => {
                                                                                                                                    signOut();
                                                                                                                                    onClose();
                                                                                                              }}
                                                                                                            className="px-4 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                                                                                          >
                                                                                                          Sign out
                                                                                        </button>
                                                                    </div>
                                                                  ) : (
                                                                    <Link
                                                                                        href="/auth/login"
                                                                                        onClick={onClose}
                                                                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-[#1B5B50] border border-[#1B5B50]/20 rounded-xl hover:bg-[#1B5B50]/5 transition-colors"
                                                                                      >
                                                                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                                                                        </svg>
                                                                                      Login / Register
                                                                    </Link>
                                                                  ))}
                                
                                  {/* Footer text */}
                                            <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
                                                          Professional construction templates and tools built by site teams, for site teams.
                                            </p>
                                </div>
                      </div>
              </div>
        </>
      );
}
