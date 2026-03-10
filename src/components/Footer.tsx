import Link from 'next/link';
import { FooterYear } from '@/components/FooterYear';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand Column */}
          <div className="footer__brand">
            <Link href="/" className="nav__logo">
              <span className="nav__logo-icon">E</span>
              Ebrora
            </Link>
            <p>Professional Excel templates built specifically for construction and civil engineering professionals.</p>
            <div className="social-links">
              <a
                href="https://www.linkedin.com/in/ebrora/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://x.com/EbroraSheets"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="X (Twitter)"
                title="X (Twitter)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UCQy-rQ3Ye1kIPpT19A1c0lg"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="YouTube"
                title="YouTube"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories Column */}
          <div>
            <h4>Categories</h4>
            <div className="footer__links">
              <a href="/#products">HSE &amp; Safety</a>
              <a href="/#products">Project Management</a>
              <a href="/#products">Asset &amp; Facility</a>
              <a href="/#products">Wastewater</a>
              <a href="/#products">Cost &amp; Finance</a>
              <a href="/#products">Planning &amp; Programming</a>
              <a href="/#products">Inspection &amp; Testing</a>
              <a href="/#products">Registers &amp; Logs</a>
            </div>
          </div>

          {/* Resources Column */}
          <div>
            <h4>Resources</h4>
            <div className="footer__links">
              <Link href="/blog">Blog</Link>
              <Link href="/faq">FAQ</Link>
              <a href="/#contact">Contact Us</a>
              <a href="/#previews">Free PDF Previews</a>
            </div>
          </div>

          {/* Support Column */}
          <div>
            <h4>Support</h4>
            <div className="footer__links">
              <Link href="/faq">Help Centre</Link>
              <a href="mailto:hello@ebrora.com">Email Support</a>
              <Link href="/refund-policy">Refund Policy</Link>
              <Link href="/terms-of-service">Terms of Service</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer__bottom">
          <span className="footer__copyright">
            &copy; <FooterYear /> Ebrora. All rights reserved.
          </span>
          <div className="footer__bottom-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
