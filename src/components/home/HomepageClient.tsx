'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Review } from '@/lib/types';
import type { BlogPost } from '@/data/posts';
import AboutSection from '@/components/home/AboutSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import ContactSection from '@/components/home/ContactSection';

export interface SearchItem {
  label: string;
  type: 'Template' | 'Toolbox Talks' | 'Free Tool' | 'Blog';
  icon: string;
  href: string;
  meta: string;
}

interface HomepageClientProps {
  templateCount: number;
  categoryCount: number;
  reviews: Review[];
  latestPosts: BlogPost[];
  searchItems: SearchItem[];
}

/* ── Animated counter hook ── */
function useCounter(target: number, duration: number = 1600) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ── Fade-in on scroll hook ── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('hp-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ── Hub card data ── */
const HUB_CARDS = [
  {
    title: 'Premium Templates',
    desc: 'Professional Excel templates for construction project management, health and safety, MEICA tracking, and more.',
    href: '/products',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375" />
      </svg>
    ),
    stat: '55+',
    statLabel: 'templates',
    accent: 'hp-card--templates',
  },
  {
    title: 'RAMS Builder',
    desc: 'AI-powered risk assessments and method statements. Choose from 10 industry formats, generate in minutes.',
    href: '/rams-builder',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    stat: 'AI',
    statLabel: 'powered',
    accent: 'hp-card--rams',
    badge: 'New',
  },
  {
    title: 'Toolbox Talks',
    desc: 'Free health and safety briefings across 60 categories. PDF format, ready to brief your team on site.',
    href: '/toolbox-talks',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
      </svg>
    ),
    stat: '1,500+',
    statLabel: 'talks',
    accent: 'hp-card--tbt',
    badge: 'Free',
  },
  {
    title: 'Free Templates',
    desc: 'Download free construction templates in Excel, Word, and PowerPoint. Sign up for instant access.',
    href: '/free-templates',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    stat: '3',
    statLabel: 'formats',
    accent: 'hp-card--free',
    badge: 'Free',
  },
  {
    title: 'Free Tools',
    desc: 'Interactive calculators for manual handling, fire risk, confined spaces, and materials conversion.',
    href: '/tools',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
      </svg>
    ),
    stat: '4+',
    statLabel: 'tools',
    accent: 'hp-card--tools',
    badge: 'Free',
  },
  {
    title: 'Blog & Guides',
    desc: 'Expert articles on construction safety, RAMS, productivity tracking, Excel tips, and site management.',
    href: '/blog',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    stat: '11+',
    statLabel: 'articles',
    accent: 'hp-card--blog',
  },
];

export default function HomepageClient({
  templateCount,
  categoryCount,
  reviews,
  latestPosts,
  searchItems,
}: HomepageClientProps) {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const fadeRef1 = useFadeIn();
  const fadeRef2 = useFadeIn();
  const fadeRef3 = useFadeIn();
  const fadeRef4 = useFadeIn();
  const fadeRef5 = useFadeIn();
  const fadeRef6 = useFadeIn();

  const counter1 = useCounter(templateCount);
  const counter2 = useCounter(1500);
  const counter3 = useCounter(categoryCount);
  const counter4 = useCounter(500);

  const getResults = useCallback(
    (query: string): SearchItem[] => {
      const q = query.toLowerCase();
      return searchItems.filter((item) => item.label.toLowerCase().includes(q));
    },
    [searchItems]
  );

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    setActiveIndex(-1);
    if (value.trim().length >= 2) {
      const results = getResults(value.trim());
      setSuggestions(results.slice(0, 5));
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (item: SearchItem) => {
    setSearchInput('');
    setShowDropdown(false);
    setSuggestions([]);
    router.push(item.href);
  };

  const handleSearch = () => {
    setShowDropdown(false);
    if (searchInput.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* ━━━ HERO ━━━ */}
      <section className="hp-hero">
        <div className="hp-hero__bg" />
        <div className="hp-hero__content">
          <span className="hp-hero__badge">Built by site teams, for site teams</span>
          <h1 className="hp-hero__title">
            The UK Construction<br />
            Professional&apos;s <span className="hp-hero__accent">Toolkit</span>
          </h1>
          <p className="hp-hero__subtitle">
            Premium Excel templates, AI-powered RAMS, 1,500+ free toolbox talks, 
            interactive calculators, and expert guides — everything your site team 
            needs, CDM 2015 compliant and ready to use.
          </p>

          {/* Site-wide search */}
          <div className="hp-search" style={{ position: 'relative' }}>
            <svg className="hp-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search templates, toolbox talks, tools, guides…"
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (searchInput.trim().length >= 2) {
                  const results = getResults(searchInput.trim());
                  setSuggestions(results.slice(0, 5));
                  setShowDropdown(true);
                }
              }}
              onKeyDown={handleKeyDown}
              aria-label="Search the whole site"
              aria-expanded={showDropdown && suggestions.length > 0}
              aria-haspopup="listbox"
              aria-controls="hp-search-listbox"
              aria-activedescendant={activeIndex >= 0 ? `hp-search-opt-${activeIndex}` : undefined}
              autoComplete="off"
            />
            <button onClick={handleSearch}>Search</button>

            {showDropdown && (
              <div
                ref={dropdownRef}
                id="hp-search-listbox"
                role="listbox"
                aria-label="Search suggestions"
                className="hp-search-dropdown"
              >
                {suggestions.length === 0 ? (
                  <div className="hp-search-dropdown__empty">No results found</div>
                ) : (
                  suggestions.map((item, idx) => (
                    <button
                      key={`${item.type}-${item.href}`}
                      id={`hp-search-opt-${idx}`}
                      role="option"
                      aria-selected={idx === activeIndex}
                      className={`hp-search-dropdown__item${idx === activeIndex ? ' hp-search-dropdown__item--active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="hp-search-dropdown__icon">{item.icon}</span>
                      <span className="hp-search-dropdown__info">
                        <span className="hp-search-dropdown__title">{item.label}</span>
                        <span className="hp-search-dropdown__type">{item.type}</span>
                      </span>
                      {item.meta && (
                        <span className="hp-search-dropdown__meta">{item.meta}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="hp-hero__pills">
            <Link href="/products" className="hp-pill">Gantt Charts</Link>
            <Link href="/products" className="hp-pill">RAMS</Link>
            <Link href="/toolbox-talks" className="hp-pill">Toolbox Talks</Link>
            <Link href="/products" className="hp-pill">Inspection Registers</Link>
            <Link href="/tools" className="hp-pill">Calculators</Link>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST BAR ━━━ */}
      <div className="hp-trust">
        <div className="hp-trust__inner">
          <span className="hp-trust__stars">★★★★★</span>
          <span>4.9/5 average rating</span>
          <span className="hp-trust__sep">•</span>
          <span>Trusted by 500+ professionals</span>
          <span className="hp-trust__sep">•</span>
          <span>Instant download</span>
          <span className="hp-trust__sep">•</span>
          <span>Windows &amp; Mac compatible</span>
        </div>
      </div>

      {/* ━━━ HUB GRID ━━━ */}
      <section className="hp-section" ref={fadeRef1}>
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-section-badge">Explore Ebrora</span>
            <h2 className="hp-section-title">Everything You Need to Run a Better Site</h2>
            <p className="hp-section-subtitle">
              From premium Excel templates and AI-generated RAMS documents to free toolbox talks and 
              interactive safety calculators — one platform built for UK construction professionals.
            </p>
          </div>

          <div className="hp-hub-grid">
            {HUB_CARDS.map((card, idx) => (
              <Link
                key={idx}
                href={card.href}
                className={`hp-hub-card ${card.accent}`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {card.badge && <span className="hp-hub-card__badge">{card.badge}</span>}
                <div className="hp-hub-card__icon">{card.icon}</div>
                <h3 className="hp-hub-card__title">{card.title}</h3>
                <p className="hp-hub-card__desc">{card.desc}</p>
                <div className="hp-hub-card__footer">
                  <span className="hp-hub-card__stat">
                    <strong>{card.stat}</strong> {card.statLabel}
                  </span>
                  <svg className="hp-hub-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ RAMS BUILDER CALLOUT ━━━ */}
      <section className="hp-rams" ref={fadeRef2}>
        <div className="hp-container">
          <div className="hp-rams__inner">
            <div className="hp-rams__content">
              <span className="hp-rams__badge">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI-Powered
              </span>
              <h2 className="hp-rams__title">Generate Professional RAMS in Minutes</h2>
              <p className="hp-rams__desc">
                Stop spending days writing risk assessments and method statements from scratch. 
                Our AI-powered RAMS Builder generates comprehensive, CDM 2015 compliant documents 
                tailored to your specific project — choose from 10 industry-standard formats 
                including client-branded outputs.
              </p>
              <ul className="hp-rams__features">
                <li>10 professional RAMS formats</li>
                <li>AI-generated, site-specific content</li>
                <li>CDM 2015 &amp; BS compliant outputs</li>
                <li>Download as Word document</li>
                <li>Free tier available — no card required</li>
              </ul>
              <Link href="/rams-builder" className="hp-rams__cta">
                Try RAMS Builder
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="hp-rams__visual">
              <div className="hp-rams__mockup">
                <div className="hp-rams__mockup-bar">
                  <span /><span /><span />
                </div>
                <div className="hp-rams__mockup-body">
                  <div className="hp-rams__mockup-line hp-rams__mockup-line--title" />
                  <div className="hp-rams__mockup-line hp-rams__mockup-line--subtitle" />
                  <div className="hp-rams__mockup-divider" />
                  <div className="hp-rams__mockup-line" />
                  <div className="hp-rams__mockup-line" />
                  <div className="hp-rams__mockup-line hp-rams__mockup-line--short" />
                  <div className="hp-rams__mockup-divider" />
                  <div className="hp-rams__mockup-line" />
                  <div className="hp-rams__mockup-line hp-rams__mockup-line--short" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ STATS ━━━ */}
      <section className="hp-stats">
        <div className="hp-container">
          <div className="hp-stats__grid">
            <div className="hp-stats__item" ref={counter1.ref}>
              <span className="hp-stats__number">{counter1.count}+</span>
              <span className="hp-stats__label">Premium Templates</span>
            </div>
            <div className="hp-stats__item" ref={counter2.ref}>
              <span className="hp-stats__number">{counter2.count.toLocaleString()}+</span>
              <span className="hp-stats__label">Toolbox Talks</span>
            </div>
            <div className="hp-stats__item" ref={counter3.ref}>
              <span className="hp-stats__number">{counter3.count}</span>
              <span className="hp-stats__label">Categories</span>
            </div>
            <div className="hp-stats__item" ref={counter4.ref}>
              <span className="hp-stats__number">{counter4.count}+</span>
              <span className="hp-stats__label">Professionals Served</span>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ WHY EBRORA ━━━ */}
      <section className="hp-section hp-section--alt" ref={fadeRef3}>
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-section-badge">Why Ebrora</span>
            <h2 className="hp-section-title">Built by Construction Professionals</h2>
          </div>
          <div className="hp-features-grid">
            {[
              { icon: '🏗️', title: 'Industry Expertise', desc: 'Every template and tool is designed by practising construction professionals who understand UK site workflows, CDM 2015, and British Standards.' },
              { icon: '⚡', title: 'Instant Access', desc: 'Download templates immediately. No lengthy onboarding, no complex setup. Open in Excel and start using on site within minutes.' },
              { icon: '🛡️', title: 'Compliance Built In', desc: 'Templates are designed around HSE guidance, CDM 2015 regulations, LOLER, PUWER, and relevant British Standards so your paperwork stands up to audit.' },
              { icon: '💻', title: 'Works Everywhere', desc: 'All templates are fully compatible with Microsoft Excel on Windows and Mac, and most work in Google Sheets. VBA features require Excel desktop.' },
            ].map((f, i) => (
              <div key={i} className="hp-feature-card">
                <span className="hp-feature-card__icon">{f.icon}</span>
                <h3 className="hp-feature-card__title">{f.title}</h3>
                <p className="hp-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ REVIEWS ━━━ */}
      <section className="hp-section" ref={fadeRef4}>
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-section-badge">Testimonials</span>
            <h2 className="hp-section-title">What Construction Teams Say</h2>
          </div>
          <div className="hp-reviews-grid">
            {reviews.map((review, idx) => (
              <div key={idx} className="hp-review-card">
                <div className="hp-review-card__stars">{'★'.repeat(review.stars)}</div>
                <p className="hp-review-card__text">&ldquo;{review.text}&rdquo;</p>
                <div className="hp-review-card__author">
                  <span className="hp-review-card__name">{review.author}</span>
                  <span className="hp-review-card__role">{review.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ LATEST BLOG POSTS ━━━ */}
      <section className="hp-section hp-section--alt" ref={fadeRef5}>
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-section-badge">From the Blog</span>
            <h2 className="hp-section-title">Expert Guides &amp; Construction Insights</h2>
          </div>
          <div className="hp-blog-grid">
            {latestPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="hp-blog-card">
                <div className="hp-blog-card__image">
                  <Image
                    src={`/${post.featuredImage}`}
                    alt={post.title}
                    width={600}
                    height={340}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </div>
                <div className="hp-blog-card__body">
                  <span className="hp-blog-card__date">{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <h3 className="hp-blog-card__title">{post.title}</h3>
                  <p className="hp-blog-card__excerpt">{post.excerpt.slice(0, 120)}…</p>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/blog" className="hp-text-link">
              View all articles →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ ABOUT ━━━ */}
      <div ref={fadeRef6}>
        <AboutSection templateCount={templateCount} categoryCount={categoryCount} />
      </div>

      {/* ━━━ NEWSLETTER ━━━ */}
      <NewsletterSection />

      {/* ━━━ CONTACT ━━━ */}
      <ContactSection />
    </>
  );
}
