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
  type: 'Template' | 'Toolbox Talks' | 'Free Tool' | 'Blog';
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

/* ── Search type icons ── */
function SearchTypeIcon({ type }: { type: SearchItem['type'] }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#1B5B50', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'Template':
      return (<svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case 'Toolbox Talks':
      return (<svg {...props}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>);
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

/* ── Categorised AI tool grid data ── */
type ToolCategory = 'Health & Safety' | 'Quality' | 'Commercial' | 'Programme';

interface AiToolCard {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  isNew?: boolean;
  isUpload?: boolean;
}

const CATEGORY_ACCENT: Record<ToolCategory, string> = {
  'Health & Safety': '#DC2626',
  'Quality':         '#1D6FB8',
  'Commercial':      '#065F46',
  'Programme':       '#0F766E',
};

const CATEGORISED_TOOLS: Record<ToolCategory, AiToolCard[]> = {
  'Health & Safety': [
    { title: 'RAMS Builder',           desc: '10 industry formats. AI-generated risk assessments and method statements, CDM 2015 compliant.',    href: '/rams-builder',               badge: 'AI' },
    { title: 'COSHH Assessment',       desc: 'AI looks up the SDS and builds a regulation-compliant assessment for any hazardous substance.',    href: '/coshh-builder',              badge: 'AI' },
    { title: 'Manual Handling RA',     desc: 'TILE methodology risk assessments. Task, individual, load, and environment analysis.',              href: '/manual-handling-builder',    badge: 'AI' },
    { title: 'DSE Assessment',         desc: 'Workstation assessments for office and site welfare. Posture, screen setup, and lighting.',         href: '/dse-builder',                badge: 'AI' },
    { title: 'Toolbox Talk Generator', desc: 'Bespoke, site-specific toolbox talks for any activity or hazard. Briefing-ready with attendance.',  href: '/tbt-builder',                badge: 'AI' },
    { title: 'Confined Space RA',      desc: 'Atmospheric hazards, entry permits, rescue plans, gas monitoring, and communication requirements.', href: '/confined-spaces-builder',    badge: 'AI' },
    { title: 'Incident Report',        desc: 'Root cause analysis, 5 Whys, RIDDOR assessment, corrective actions, and lessons learned.',         href: '/incident-report-builder',    badge: 'AI' },
    { title: 'Lift Plan',              desc: 'Load details, crane specification, radius charts, exclusion zones, and appointed persons.',         href: '/lift-plan-builder',          badge: 'AI' },
    { title: 'Emergency Response Plan',desc: 'Site-specific plans covering fire, first aid, environmental spills, and evacuation procedures.',    href: '/emergency-response-builder', badge: 'AI' },
    { title: 'Permit to Dig',          desc: 'Utility searches, CAT & Genny scanning, hand-dig zones, and safe digging methods. HSG47 aligned.', href: '/permit-to-dig-builder',      badge: 'AI' },
    { title: 'POWRA',                  desc: 'Quick point of work risk assessments. Hazards, controls, stop conditions, and team sign-on.',       href: '/powra-builder',              badge: 'AI' },
    { title: 'CDM Compliance Checker', desc: 'Gap analysis across all CDM 2015 duty holder responsibilities. HSE L153 aligned narrative report.', href: '/cdm-checker-builder',        badge: 'AI', isNew: true },
    { title: 'Noise Assessment',       desc: 'BS 5228-1:2009 compliant. Predict noise levels at receptors, assess impacts, specify mitigation.', href: '/noise-assessment-builder',   badge: 'AI', isNew: true },
    { title: 'Safety Alert Generator', desc: 'Turn incidents and near misses into professional safety bulletins. Immediate distribution ready.', href: '/safety-alert-builder',       badge: 'AI', isNew: true },
    { title: 'RAMS Review Tool',       desc: 'Upload your RAMS for AI review against HSE guidance and CDM 2015. Gaps and improvements identified.', href: '/rams-review-builder',     badge: 'AI', isNew: true, isUpload: true },
  ],
  'Quality': [
    { title: 'ITP Generator',          desc: 'Hold points, witness points, review points, and sign-off matrices for any works package.',          href: '/itp-builder',               badge: 'AI' },
    { title: 'Quality Checklist',      desc: 'Activity-specific inspection checklists with acceptance criteria, hold points, and BS standards.',  href: '/quality-checklist-builder', badge: 'AI' },
    { title: 'NCR Generator',          desc: 'Non-conformance reports with root cause analysis, corrective actions, and close-out verification.', href: '/ncr-builder',               badge: 'AI' },
  ],
  'Commercial': [
    { title: 'Scope of Works',             desc: 'Formal subcontractor scope documents. Inclusions, exclusions, interfaces, and deliverables.',      href: '/scope-of-works-builder',          badge: 'AI' },
    { title: 'Early Warning Notice',       desc: 'NEC-compliant early warnings with cost, programme, and quality impact assessment.',                href: '/early-warning-builder',           badge: 'AI' },
    { title: 'CE Notification',            desc: 'NEC compensation event notifications with clause references, programme, and cost implications.',   href: '/ce-notification-builder',         badge: 'AI' },
    { title: 'Quotation Generator',        desc: 'Professional subcontractor quotations to Tier 1 standards. BoQ, inclusions, exclusions, terms.',   href: '/quote-generator-builder',         badge: 'AI', isNew: true },
    { title: 'Delay Notification Letter',  desc: 'NEC & JCT compliant delay notifications. Clause references, programme impact, entitlement.',       href: '/delay-notification-builder',      badge: 'AI', isNew: true },
    { title: 'Variation Confirmation',     desc: 'Formally confirm verbal variations in writing. Cost and time impact, request for written instruction.', href: '/variation-confirmation-builder', badge: 'AI', isNew: true },
    { title: 'RFI Generator',             desc: 'Formal Requests for Information with drawing references, clear question, and non-response impact.', href: '/rfi-generator-builder',           badge: 'AI', isNew: true },
    { title: 'Payment Application',       desc: 'Structured interim valuations with BoQ, variations, retention, and CIS. HGCRA compliant.',          href: '/payment-application-builder',     badge: 'AI', isNew: true },
    { title: 'Daywork Sheet',             desc: 'CECA Schedule of Dayworks 2011 compliant. Labour, plant, materials, supervision, and overheads.',   href: '/daywork-sheet-builder',           badge: 'AI', isNew: true },
  ],
  'Programme': [
    { title: 'Programme Checker',      desc: 'Upload your programme for a RAG-rated AI review. Logic, sequencing, WBS, critical path, milestones.', href: '/programme-checker-builder', badge: 'AI', isNew: true, isUpload: true },
    { title: 'Carbon Footprint',       desc: 'ICE v3.2 activity-based carbon assessment. Materials, plant, transport, waste, reduction opportunities.', href: '/carbon-footprint-builder', badge: 'AI', isNew: true },
    { title: 'Carbon Reduction Plan',  desc: 'PPN 06/21 compliant Carbon Reduction Plans for public sector and Tier 1 framework bids.',              href: '/carbon-reduction-plan-builder', badge: 'AI', isNew: true },
  ],
};

const ALL_CATEGORIES: ToolCategory[] = ['Health & Safety', 'Quality', 'Commercial', 'Programme'];

/* ── Legacy non-AI hub cards (shown below the categorised AI tools grid) ── */
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
    desc: 'AI-generated risk assessments and method statements. 10 industry formats, CDM 2015 compliant, ready in minutes.',
    href: '/rams-builder',
    icon: <AiSparkleIcon />,
    stat: '10',
    statLabel: 'formats',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'COSHH Assessment',
    desc: 'Generate COSHH assessments for hazardous substances. Covers exposure routes, control measures, and PPE requirements.',
    href: '/coshh-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'ITP Generator',
    desc: 'Inspection and test plans tailored to your works. Hold points, witness points, and sign-off matrices built in.',
    href: '/itp-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Manual Handling RA',
    desc: 'Manual handling risk assessments using TILE methodology. Task, individual, load, and environment analysis.',
    href: '/manual-handling-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'DSE Assessment',
    desc: 'Display screen equipment assessments for office and site welfare. Workstation setup, posture, and eye strain checks.',
    href: '/dse-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Toolbox Talk Generator',
    desc: 'Generate bespoke toolbox talks for any activity or hazard. Site-specific, briefing-ready, and branded to your project.',
    href: '/tbt-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Confined Spaces',
    desc: 'Confined space risk assessments covering atmospheric hazards, entry permits, rescue plans, and monitoring requirements.',
    href: '/confined-spaces-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Incident Report',
    desc: 'Incident investigation reports with root cause analysis, 5 Whys methodology, RIDDOR assessment, and corrective actions.',
    href: '/incident-report-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Lift Plan',
    desc: 'Structured lift plans covering load details, crane specification, exclusion zones, appointed persons, and communication.',
    href: '/lift-plan-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Emergency Response Plan',
    desc: 'Site-specific emergency response plans covering fire, first aid, environmental spills, and evacuation procedures.',
    href: '/emergency-response-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Quality Checklist',
    desc: 'Activity-specific quality inspection checklists with hold points, acceptance criteria, and reference standards.',
    href: '/quality-checklist-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Scope of Works',
    desc: 'Subcontractor scope of works with inclusions, exclusions, interfaces, programme constraints, and deliverables.',
    href: '/scope-of-works-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Permit to Dig',
    desc: 'Permit to dig documents covering utility searches, CAT & Genny scanning, hand-dig zones, and safe digging methods.',
    href: '/permit-to-dig-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'POWRA',
    desc: 'Point of work risk assessments — quick field-level assessments with hazards, controls, stop conditions, and team sign-on.',
    href: '/powra-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'Early Warning Notice',
    desc: 'NEC-compliant early warning notices with risk description, cost and programme impact, and proposed mitigation.',
    href: '/early-warning-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'NCR Generator',
    desc: 'Non-conformance reports with root cause analysis, corrective and preventive actions, disposition, and close-out.',
    href: '/ncr-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
  },
  {
    title: 'CE Notification',
    desc: 'NEC compensation event notifications with clause references, programme impact, cost implications, and entitlement basis.',
    href: '/ce-notification-builder',
    icon: <AiSparkleIcon />,
    stat: 'AI',
    statLabel: 'generated',
    accent: 'hp-card--ai',
    badge: 'AI',
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
  const counter4 = useCounter(29);

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
                      <span className="hp-search-dropdown__icon"><SearchTypeIcon type={item.type} /></span>
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
            <Link href="/rams-builder" className="hp-pill">RAMS Builder</Link>
            <Link href="/coshh-builder" className="hp-pill">COSHH</Link>
            <Link href="/itp-builder" className="hp-pill">ITP Generator</Link>
            <Link href="/toolbox-talks" className="hp-pill">Toolbox Talks</Link>
            <Link href="/products" className="hp-pill">Excel Templates</Link>
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
                <li>29 AI document generators across 4 categories</li>
                <li>H&amp;S, Quality, Commercial, and Programme tools</li>
                <li>CDM 2015, COSHH Regs, NEC, JCT &amp; BS compliant outputs</li>
                <li>Download as professional Word and Excel documents</li>
                <li>Standard from £X/month — Standard &amp; Professional plans</li>
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
              <span className="hp-stats__label">AI Tools</span>
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
