// src/components/Footer.tsx
import Link from 'next/link';
import { FooterYear } from '@/components/FooterYear';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1B5B50] flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                E
              </span>
              <span
                className="text-white text-base sm:text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ebrora
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4 sm:mb-5">
              Professional Excel templates built specifically for construction and civil engineering professionals.
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="https://www.linkedin.com/in/ebrora/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-[#1B5B50] hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="sm:w-4 sm:h-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://x.com/EbroraSheets"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-[#1B5B50] hover:text-white transition-colors"
                aria-label="X (Twitter)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="sm:w-4 sm:h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UCQy-rQ3Ye1kIPpT19A1c0lg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-[#1B5B50] hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="sm:w-4 sm:h-4">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Company</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <a href="/#about" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">About</a>
              <a href="/#contact" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a>
              <a href="mailto:hello@ebrora.com" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Email Support</a>
              <Link href="/faq" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Legal</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Link href="/faq" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Help Centre</Link>
              <Link href="/refund-policy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</Link>
              <Link href="/terms-of-service" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy-policy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            &copy; <FooterYear /> Ebrora. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
