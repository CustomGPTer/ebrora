'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll listener — adds 'scrolled' class when scrollY > 10
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav className={`nav${isScrolled ? ' scrolled' : ''}`} id="nav">
        <div className="container">
          <Link href="/" className="nav__logo">
            <span className="nav__logo-icon">E</span>
            Ebrora
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav__links">
            <a href="/#products" className="nav__link">Templates</a>
            <Link href="/rams-builder" className="nav__link">RAMS Builder</Link>
            <Link href="/blog" className="nav__link">Blog</Link>
            <Link href="/faq" className="nav__link">FAQ</Link>
            <a href="/#about" className="nav__link">About</a>
            <a href="/#contact" className="nav__link">Contact</a>
          </div>

          {/* Hamburger Button */}
          <button
            className={`nav__hamburger${isMobileMenuOpen ? ' open' : ''}`}
            ref={hamburgerRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`nav__mobile-menu${isMobileMenuOpen ? ' open' : ''}`}
        ref={mobileMenuRef}
      >
        <a href="/#products" onClick={closeMobileMenu}>Templates</a>
        <Link href="/rams-builder" onClick={closeMobileMenu}>RAMS Builder</Link>
        <Link href="/blog" onClick={closeMobileMenu}>Blog</Link>
        <Link href="/faq" onClick={closeMobileMenu}>FAQ</Link>
        <a href="/#about" onClick={closeMobileMenu}>About</a>
        <a href="/#contact" onClick={closeMobileMenu}>Contact</a>
      </div>
    </>
  );
}
