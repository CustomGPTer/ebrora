'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  type: 'Template' | 'Toolbox Talk' | 'AI Builder' | 'Free Template' | 'Free Tool' | 'Blog';
  href: string;
  meta: string;
}

const SEARCH_TYPES = ['AI Builder', 'Toolbox Talk', 'Free Template', 'Template', 'Free Tool', 'Blog'] as const;

const TYPE_BADGE_CLASS: Record<SearchItem['type'], string> = {
  'AI Builder':     'hp-badge--ai-builder',
  'Template':       'hp-badge--template',
  'Toolbox Talk':   'hp-badge--toolbox-talk',
  'Free Template':  'hp-badge--free-template',
  'Free Tool':      'hp-badge--free-tool',
  'Blog':           'hp-badge--blog',
};

const TYPE_GROUP_LABEL: Record<SearchItem['type'], string> = {
  'AI Builder':     'AI Builders',
  'Template':       'Premium Templates',
  'Toolbox Talk':   'Toolbox Talks',
  'Free Template':  'Free Templates',
  'Free Tool':      'Free Tools',
  'Blog':           'Blog & Guides',
};

const MAX_PER_GROUP = 2;

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

/* ── Search type icons ── */
function SearchTypeIcon({ type }: { type: SearchItem['type'] }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#1B5B50', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'AI Builder':
      return (<svg {...props}><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /><path d="M18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25z" /></svg>);
    case 'Template':
      return (<svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case 'Toolbox Talk':
      return (<svg {...props}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>);
    case 'Free Template':
      return (<svg {...props}><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
    case 'Free Tool':
      return (<svg {...props}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></svg>);
    case 'Blog':
      return (<svg {...props}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>);
  }
}

/* ── AI sparkle icon (shared across AI tool cards) ── */
const AiSparkleIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

/* ── Categorised AI tool grid — pulls from tool-config.ts as single source of truth ── */
import { AI_TOOL_CONFIGS, AI_TOOLS_BY_CATEGORY } from '@/lib/ai-tools/tool-config';
import type { AiToolSlug } from '@/lib/ai-tools/types';

type ToolCategory = 'Health & Safety' | 'Quality' | 'Commercial' | 'Programme';

const CATEGORY_ACCENT: Record<ToolCategory, string> = {
  'Health & Safety': '#DC2626',
  'Quality':         '#1D6FB8',
  'Commercial':      '#065F46',
  'Programme':       '#0F766E',
};

const CATEGORY_ACCENT_LIGHT: Record<ToolCategory, string> = {
  'Health & Safety': 'rgba(220,38,38,0.08)',
  'Quality':         'rgba(29,111,184,0.08)',
  'Commercial':      'rgba(6,95,70,0.08)',
  'Programme':       'rgba(15,118,110,0.08)',
};

/* Icon map: tool-config iconType → emoji */
const TOOL_ICON: Record<string, string> = {
  shield: '🛡️', clipboard: '📋', alert: '⚠️', eye: '👁️', chat: '💬',
  lock: '🔒', warning: '⚡', crane: '🏗️', siren: '🚨', check: '✅',
  file: '📄', shovel: '⛏️', hardhat: '👷', bell: '🔔', 'x-circle': '❌',
  pound: '💷', calendar: '📅', leaf: '🌱', noise: '🔊', invoice: '🧾',
  search: '🔍', clock: '⏱️', letter: '✉️', 'question-circle': '❓',
  timesheet: '📊', carbon: '🌍',
};

/* Popular tools — shown with a "Popular" badge */
const POPULAR_SLUGS = new Set<string>(['coshh', 'manual-handling', 'tbt-generator', 'confined-spaces']);

interface HomepageToolCard {
  title: string;
  desc: string;
  href: string;
  icon: string;
  isUpload: boolean;
  isPopular: boolean;
  slug: string;
}

/* Build categorised tools dynamically from tool-config */
function buildCategorisedTools(): Record<ToolCategory, HomepageToolCard[]> {
  const result: Record<ToolCategory, HomepageToolCard[]> = {
    'Health & Safety': [
      /* RAMS Builder is separate from AI tools — always first */
      { title: 'RAMS Builder', desc: '10 industry formats. AI-generated risk assessments and method statements, CDM 2015 compliant.', href: '/rams-builder', icon: '🛡️', isUpload: false, isPopular: true, slug: 'rams' },
    ],
    'Quality': [],
    'Commercial': [],
    'Programme': [],
  };

  for (const [category, slugs] of Object.entries(AI_TOOLS_BY_CATEGORY)) {
    const cat = category as ToolCategory;
    for (const slug of slugs) {
      const config = AI_TOOL_CONFIGS[slug as AiToolSlug];
      if (!config) continue;
      const firstSentence = config.description.split('. ')[0] + '.';
      const desc = firstSentence.length > 140 ? firstSentence.slice(0, 137) + '...' : firstSentence;
      result[cat].push({
        title: config.name,
        desc,
        href: config.route,
        icon: TOOL_ICON[config.iconType] || '📄',
        isUpload: config.requiresUpload ?? false,
        isPopular: POPULAR_SLUGS.has(slug),
        slug,
      });
    }
  }
  return result;
}

const CATEGORISED_TOOLS = buildCategorisedTools();
const ALL_CATEGORIES: ToolCategory[] = ['Health & Safety', 'Quality', 'Commercial', 'Programme'];

/* ── Resource cards (shown below the categorised AI tools grid) ── */
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
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('Health & Safety');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<SearchItem['type'] | ''>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const counter4 = useCounter(30);
  const counter5 = useCounter(500);

  /* ── Grouped search: max MAX_PER_GROUP results per type, ordered by type priority ── */
  const getGroupedResults = useCallback(
    (query: string, filterType: SearchItem['type'] | ''): SearchItem[] => {
      const q = query.toLowerCase();
      let pool = searchItems;
      if (filterType) pool = pool.filter((item) => item.type === filterType);

      // Score each item
      const scored = pool
        .map((item) => {
          const label = item.label.toLowerCase();
          let score = 0;
          if (label === q) score = 100;
          else if (label.startsWith(q)) score = 80;
          else if (label.includes(q)) score = 60;
          else {
            const words = q.split(/\s+/);
            const matches = words.filter((w) => label.includes(w)).length;
            score = (matches / words.length) * 40;
          }
          return { item, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score);

      // If filtering by type, just return top results
      if (filterType) return scored.slice(0, 8).map((s) => s.item);

      // Group by type, max MAX_PER_GROUP per type
      const grouped: SearchItem[] = [];
      const counts: Partial<Record<SearchItem['type'], number>> = {};
      for (const { item } of scored) {
        const c = counts[item.type] || 0;
        if (c < MAX_PER_GROUP) {
          grouped.push(item);
          counts[item.type] = c + 1;
        }
        if (grouped.length >= 12) break;
      }
      return grouped;
    },
    [searchItems]
  );

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        const results = getGroupedResults(value.trim(), activeFilter);
        setSuggestions(results);
        setShowDropdown(true);
      }, 200);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleFilterChange = (type: SearchItem['type'] | '') => {
    setActiveFilter(type);
    setActiveIndex(-1);
    if (searchInput.trim().length >= 2) {
      const results = getGroupedResults(searchInput.trim(), type);
      setSuggestions(results);
      setShowDropdown(true);
    }
  };

  const handleSelect = (item: SearchItem) => {
    setSearchInput('');
    setShowDropdown(false);
    setSuggestions([]);
    router.push(item.href);
  };

  const handleSearch = () => {
    // Stay on homepage — show dropdown with results or "no results"
    if (searchInput.trim().length >= 2) {
      const results = getGroupedResults(searchInput.trim(), activeFilter);
      setSuggestions(results);
      setShowDropdown(true);
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

  // Build grouped sections for display
  const groupedSections = React.useMemo(() => {
    const sections: { type: SearchItem['type']; label: string; items: SearchItem[] }[] = [];
    const typeOrder: SearchItem['type'][] = ['AI Builder', 'Toolbox Talk', 'Free Template', 'Template', 'Free Tool', 'Blog'];
    for (const t of typeOrder) {
      const items = suggestions.filter((s) => s.type === t);
      if (items.length > 0) {
        sections.push({ type: t, label: TYPE_GROUP_LABEL[t], items });
      }
    }
    return sections;
  }, [suggestions]);

  // Flat list for keyboard navigation (matches render order)
  const flatSuggestions = React.useMemo(() => {
    return groupedSections.flatMap((s) => s.items);
  }, [groupedSections]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
          <span className="hp-hero__badge">
            <svg className="w-4 h-4" style={{ display: 'inline', width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Enterprise-Grade AI — Fraction of the Cost
          </span>
          <h1 className="hp-hero__title">
            The Most Powerful AI Construction Tools Available
          </h1>
          <p className="hp-hero__subtitle">
            Comparable platforms charge £200+ per month for a single tool.
            Ebrora gives you an entire suite of AI-powered document generators — RAMS,
            COSHH, ITPs, manual handling, DSE, confined spaces, and more — all built
            specifically for UK construction by people who actually work on site.
            Every output is regulation-compliant and ready to use.
          </p>

          {/* Site-wide search */}
          <div className="hp-search-wrapper" ref={wrapperRef}>
            <div className="hp-search">
              <svg className="hp-search__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search everything…"
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => {
                  if (searchInput.trim().length >= 2) {
                    const results = getGroupedResults(searchInput.trim(), activeFilter);
                    setSuggestions(results);
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
            </div>

            {/* Type filter pills */}
            <div className="hp-search-filters">
              <button
                className={`hp-filter-pill${activeFilter === '' ? ' hp-filter-pill--active' : ''}`}
                onClick={() => handleFilterChange('')}
              >
                All
              </button>
              {SEARCH_TYPES.map((t) => (
                <button
                  key={t}
                  className={`hp-filter-pill${activeFilter === t ? ' hp-filter-pill--active' : ''}`}
                  onClick={() => handleFilterChange(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Grouped dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                id="hp-search-listbox"
                role="listbox"
                aria-label="Search suggestions"
                className="hp-search-dropdown"
              >
                {suggestions.length === 0 ? (
                  <div className="hp-search-dropdown__empty">
                    No results found for &ldquo;{searchInput}&rdquo;
                    {activeFilter && <> in {activeFilter}</>}
                  </div>
                ) : (
                  groupedSections.map((section) => (
                    <div key={section.type}>
                      <div className="hp-search-dropdown__group-label">{section.label}</div>
                      {section.items.map((item) => {
                        const flatIdx = flatSuggestions.indexOf(item);
                        return (
                          <button
                            key={`${item.type}-${item.href}`}
                            id={`hp-search-opt-${flatIdx}`}
                            role="option"
                            aria-selected={flatIdx === activeIndex}
                            className={`hp-search-dropdown__item${flatIdx === activeIndex ? ' hp-search-dropdown__item--active' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelect(item);
                            }}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                          >
                            <span className="hp-search-dropdown__icon"><SearchTypeIcon type={item.type} /></span>
                            <span className="hp-search-dropdown__info">
                              <span className="hp-search-dropdown__title">{item.label}</span>
                              <span className="hp-search-dropdown__type">{item.meta}</span>
                            </span>
                            <span className={`hp-search-dropdown__badge ${TYPE_BADGE_CLASS[item.type]}`}>
                              {item.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
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

      {/* ━━━ AI TOOLS — CATEGORISED TAB GRID ━━━ */}
      <section className="hp-section" ref={fadeRef1}>
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-section-badge">AI Document Generators</span>
            <h2 className="hp-section-title">30 AI Tools Across 4 Categories</h2>
            <p className="hp-section-sub">Every tool is built specifically for UK construction. Regulation-compliant outputs, ready to use on site.</p>
          </div>

          {/* Category tabs */}
          <div className="hp-cat-tabs">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`hp-cat-tab${activeCategory === cat ? ' hp-cat-tab--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? { borderColor: CATEGORY_ACCENT[cat], color: CATEGORY_ACCENT[cat] } : undefined}
              >
                <span className="hp-cat-tab__label">{cat}</span>
                <span
                  className="hp-cat-tab__count"
                  style={activeCategory === cat ? { background: CATEGORY_ACCENT[cat], color: '#fff' } : undefined}
                >
                  {CATEGORISED_TOOLS[cat].length}
                </span>
              </button>
            ))}
          </div>

          {/* Tool cards grid — A3 Gradient Fade Top */}
          <div className="hp-tools-grid">
            {CATEGORISED_TOOLS[activeCategory].map((tool, idx) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="hp-a3-card"
                style={{ animationDelay: `${idx * 50}ms`, '--cat-color': CATEGORY_ACCENT[activeCategory], '--cat-light': CATEGORY_ACCENT_LIGHT[activeCategory] } as React.CSSProperties}
              >
                {/* Gradient fade overlay */}
                <div className="hp-a3-card__gradient" />

                {/* Card body */}
                <div className="hp-a3-card__inner">
                  <div className="hp-a3-card__top">
                    <div className="hp-a3-card__icon">{tool.icon}</div>
                    <div className="hp-a3-card__badges">
                      <span className="hp-a3-card__badge--ai"><AiSparkleIcon /> AI</span>
                      {tool.isPopular && (
                        <span className="hp-a3-card__badge--popular">★ Popular</span>
                      )}
                      {tool.isUpload && (
                        <span className="hp-a3-card__badge--upload">↑ Upload</span>
                      )}
                    </div>
                  </div>
                  <h3 className="hp-a3-card__title">{tool.title}</h3>
                  <p className="hp-a3-card__desc">{tool.desc}</p>
                </div>

                {/* Footer */}
                <div className="hp-a3-card__foot">
                  <div className="hp-a3-card__dot-label">
                    <div className="hp-a3-card__dot" style={{ background: CATEGORY_ACCENT[activeCategory] }} />
                    <span className="hp-a3-card__cat-name">{activeCategory}</span>
                  </div>
                  <span className="hp-a3-card__arrow" style={{ color: CATEGORY_ACCENT[activeCategory] }}>→</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Resources row */}
          <div className="hp-resources-row">
            {HUB_CARDS.map((card, idx) => (
              <Link
                key={idx}
                href={card.href}
                className={`hp-resource-card ${card.accent}`}
              >
                {card.badge && <span className="hp-resource-card__badge">{card.badge}</span>}
                <div className="hp-resource-card__icon">{card.icon}</div>
                <div className="hp-resource-card__body">
                  <span className="hp-resource-card__title">{card.title}</span>
                  <span className="hp-resource-card__stat">
                    <strong>{card.stat}</strong> {card.statLabel}
                  </span>
                </div>
                <svg className="hp-resource-card__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ AI TOOLS SUITE CALLOUT ━━━ */}
      <section className="hp-rams" ref={fadeRef2}>
        <div className="hp-container">
          <div className="hp-rams__inner">
            <div className="hp-rams__content">
              <span className="hp-rams__badge">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Enterprise-Grade AI — Fraction of the Cost
              </span>
              <h2 className="hp-rams__title">The Most Powerful AI Construction Tools Available</h2>
              <p className="hp-rams__desc">
                Comparable platforms charge £200+ per month for a single tool.
                Ebrora gives you an entire suite of AI-powered document generators — RAMS,
                COSHH, ITPs, manual handling, DSE, confined spaces, and more — all built 
                specifically for UK construction by people who actually work on site.
                Every output is regulation-compliant and ready to use.
              </p>
              <ul className="hp-rams__features">
                <li>30 AI document generators across 4 categories</li>
                <li>H&amp;S, Quality, Commercial, and Programme tools</li>
                <li>CDM 2015, COSHH Regs, NEC, JCT &amp; BS compliant outputs</li>
                <li>Download as professional Word and Excel documents</li>
                <li>Standard from £9.99/month — Standard &amp; Professional plans</li>
              </ul>
              <Link href="/rams-builder" className="hp-rams__cta">
                Try RAMS Builder Free
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
            <div className="hp-stats__item" ref={counter4.ref}>
              <span className="hp-stats__number">{counter4.count}+</span>
              <span className="hp-stats__label">AI Tools</span>
            </div>
            <div className="hp-stats__item" ref={counter1.ref}>
              <span className="hp-stats__number">{counter1.count}+</span>
              <span className="hp-stats__label">Premium Templates</span>
            </div>
            <div className="hp-stats__item" ref={counter5.ref}>
              <span className="hp-stats__number">{counter5.count}+</span>
              <span className="hp-stats__label">Free Templates</span>
            </div>
            <div className="hp-stats__item" ref={counter2.ref}>
              <span className="hp-stats__number">{counter2.count.toLocaleString()}+</span>
              <span className="hp-stats__label">Toolbox Talks</span>
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
              { icon: '🏗️', title: 'Industry Expertise', desc: 'Every AI tool, template, and toolbox talk is designed by practising construction professionals who understand UK site workflows, CDM 2015, NEC contracts, and British Standards.' },
              { icon: '⚡', title: 'Instant Results', desc: 'Generate professional documents in minutes with our AI tools, download ready-to-use Excel templates, or brief your team with toolbox talks — no lengthy setup required.' },
              { icon: '🛡️', title: 'Compliance Built In', desc: 'All outputs are designed around HSE guidance, CDM 2015, COSHH, LOLER, PUWER, NEC, JCT, and relevant British Standards so your paperwork stands up to audit.' },
              { icon: '💻', title: 'Works Everywhere', desc: 'AI-generated documents download as Word and Excel files. Templates work in Microsoft Excel and Google Sheets. Access everything from desktop, tablet, or mobile.' },
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
