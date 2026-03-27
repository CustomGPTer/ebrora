'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

/* ──────────────────────────────────────────────
   Shared hook — starts light trace on scroll,
   dims to subtle glow after 15s
   ────────────────────────────────────────────── */
function useTraceOnView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('prem-tracing');
          timer = setTimeout(() => el.classList.add('prem-traced'), 15500);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [threshold]);
  return ref;
}

/* ──────────────────────────────────────────────
   RAMS Builder — Main Content Banner
   (Below the template grid, full width)
   ────────────────────────────────────────────── */
export function RamsBuilderBanner() {
  const bannerRef = useTraceOnView();

  return (
    <>
      <style>{premiumStyles}</style>
      <div className="prem-banner-wrap prem-trace mt-12" ref={bannerRef}>
        <div className="prem-banner-inner rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(61,217,164,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(61,217,164,0.06) 0%, transparent 40%)'
          }} />

          <div className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-5">
            <div className="prem-stars-icon">
              <span className="prem-sparkle" />
              <span className="prem-sparkle" />
              <span className="prem-sparkle" />
              <SparklesIcon className="w-[22px] h-[22px] text-emerald-300 relative z-[1]" />
            </div>

            <span className="inline-flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              <span className="prem-pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-300" />
              AI-Powered
            </span>

            <div>
              <h3 className="font-bold text-white" style={{ fontSize: '22px' }}>RAMS Builder</h3>
              <p className="text-sm text-white/75 mt-1.5 leading-relaxed max-w-lg mx-auto">
                Create a full professional RAMS in under 3 minutes. 10 document formats, site-specific content, instant Word download.
              </p>
            </div>

            <Link
              href="/rams-builder"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1B5745] text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Try RAMS Builder
              <ArrowIcon />
            </Link>

            <div className="flex items-center justify-center gap-4 sm:gap-5 mt-1 text-[12px] text-white/40">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Under 3 min
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                10 formats
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Instant .docx
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────
   Premium Sidebar — wraps both cards, handles
   alignment with template grid top + equal heights
   ────────────────────────────────────────────── */
export function PremiumSidebar() {
  return (
    <>
      <style>{premiumStyles}</style>
      <div className="lg:w-72 shrink-0 flex flex-col gap-5 pt-[57px]">
        <AIToolsSidebarCard />
        <BrowseTemplatesSidebarCard />
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────
   AI Construction Tools — Sidebar Card
   ────────────────────────────────────────────── */
export function AIToolsSidebarCard() {
  const cardRef = useTraceOnView();

  return (
    <div className="prem-sidebar-wrap prem-trace prem-equal-card rounded-xl overflow-hidden shadow-sm" ref={cardRef}>
      <div className="bg-gradient-to-r from-[#0f2d22] to-[#1B5745] px-5 py-3 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="prem-stars-mini">
            <SparklesIcon className="w-4 h-4 text-emerald-300 relative z-[1]" />
          </div>
          <span className="text-sm font-semibold text-white">AI-Powered</span>
        </div>
      </div>
      <div className="prem-sidebar-body p-5 bg-white border border-gray-200 border-t-0 rounded-b-xl">
        <h4 className="text-sm font-bold text-gray-900">AI Construction Tools</h4>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          13+ AI-powered tools for UK construction. RAMS, safety alerts, COSHH assessments, RFIs and more — professional output in minutes.
        </p>
        <Link
          href="/tools"
          className="prem-sidebar-cta mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-[#1B5745] to-[#236b55] text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all duration-200 hover:-translate-y-0.5"
        >
          Explore AI Tools
          <ArrowSmIcon />
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Browse All Templates — Sidebar Card
   ────────────────────────────────────────────── */
export function BrowseTemplatesSidebarCard() {
  const cardRef = useTraceOnView();

  return (
    <div className="prem-sidebar-wrap prem-trace prem-equal-card rounded-xl overflow-hidden shadow-sm" ref={cardRef}>
      <div className="bg-gradient-to-r from-[#0f2d22] to-[#1B5745] px-5 py-3 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="prem-stars-mini">
            <GridIcon className="w-4 h-4 text-emerald-300 relative z-[1]" />
          </div>
          <span className="text-sm font-semibold text-white">Premium</span>
        </div>
      </div>
      <div className="prem-sidebar-body p-5 bg-white border border-gray-200 border-t-0 rounded-b-xl">
        <h4 className="text-sm font-bold text-gray-900">Browse All Templates</h4>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Professional Excel templates built for construction site teams. Gantt charts, trackers, registers, check sheets and more.
        </p>
        <Link
          href="/products"
          className="prem-sidebar-cta mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-[#1B5745] to-[#236b55] text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all duration-200 hover:-translate-y-0.5"
        >
          View All Templates
          <ArrowSmIcon />
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   SVG icons
   ────────────────────────────────────────────── */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ArrowSmIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Shared CSS — light trace border + glisten
   ────────────────────────────────────────────── */
const premiumStyles = `
  @property --prem-trace {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: true;
  }

  .prem-trace {
    position: relative;
    --prem-trace: 0deg;
  }
  .prem-trace.prem-tracing {
    animation: premTraceAround 15s linear forwards;
  }

  @keyframes premTraceAround {
    from { --prem-trace: 0deg; }
    to   { --prem-trace: 360deg; }
  }

  .prem-trace::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.5px;
    background: conic-gradient(
      from -90deg,
      rgba(61,217,164,0.35) 0deg,
      rgba(61,217,164,0.4) calc(var(--prem-trace) - 40deg),
      rgba(61,217,164,0.65) calc(var(--prem-trace) - 20deg),
      rgba(180,255,220,0.85) calc(var(--prem-trace) - 10deg),
      rgba(220,255,240,0.95) calc(var(--prem-trace) - 5deg),
      #fff calc(var(--prem-trace) - 2deg),
      #fff calc(var(--prem-trace) + 2deg),
      rgba(220,255,240,0.95) calc(var(--prem-trace) + 5deg),
      rgba(180,255,220,0.6) calc(var(--prem-trace) + 8deg),
      transparent calc(var(--prem-trace) + 12deg),
      transparent 360deg
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: 20;
    pointer-events: none;
    opacity: 0;
    transition: opacity 2.5s ease-out;
  }

  .prem-trace.prem-tracing::before {
    opacity: 1;
  }

  .prem-trace.prem-traced::before {
    background: rgba(61,217,164,0.5);
    opacity: 0.3;
  }

  .prem-banner-wrap::before {
    padding: 2px;
  }

  .prem-banner-inner {
    background: linear-gradient(135deg, #0f2d22 0%, #1B5745 50%, #236b55 100%);
    border: 1px solid rgba(61, 217, 164, 0.08);
  }
  .prem-banner-wrap {
    border-radius: 16px;
  }

  .prem-sidebar-wrap {
    border-radius: 12px;
  }
  .prem-equal-card {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .prem-sidebar-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .prem-sidebar-body p {
    flex: 1;
  }
  .prem-sidebar-cta {
    margin-top: auto;
  }

  .prem-stars-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    position: relative;
    overflow: hidden;
  }
  .prem-stars-icon::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0%, transparent 40%,
      rgba(255,255,255,0.5) 45%,
      rgba(255,255,255,0.8) 50%,
      rgba(255,255,255,0.5) 55%,
      transparent 60%, transparent 100%
    );
    animation: premGlisten 3s ease-in-out infinite;
    z-index: 2;
    opacity: 0.6;
  }

  .prem-stars-mini {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .prem-stars-mini::after {
    content: '';
    position: absolute;
    top: -100%;
    left: -100%;
    width: 300%;
    height: 300%;
    background: conic-gradient(
      from 0deg,
      transparent 0%, transparent 42%,
      rgba(255,255,255,0.6) 48%,
      rgba(255,255,255,0.9) 50%,
      rgba(255,255,255,0.6) 52%,
      transparent 58%, transparent 100%
    );
    animation: premGlisten 3.5s ease-in-out infinite;
    z-index: 2;
    opacity: 0.5;
  }

  @keyframes premGlisten {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .prem-sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #fff;
    pointer-events: none;
    z-index: 3;
    animation: premSparkleFloat 2.5s ease-in-out infinite;
  }
  .prem-sparkle:nth-child(1) { top: 6px; left: 10px; animation-delay: 0s; }
  .prem-sparkle:nth-child(2) { top: 14px; right: 8px; animation-delay: 0.8s; }
  .prem-sparkle:nth-child(3) { bottom: 10px; left: 18px; animation-delay: 1.6s; }

  @keyframes premSparkleFloat {
    0%, 100% { opacity: 0; transform: scale(0); }
    30%      { opacity: 1; transform: scale(1); }
    70%      { opacity: 1; transform: scale(1); }
    100%     { opacity: 0; transform: scale(0); }
  }

  .prem-pulse-dot {
    animation: premPulseDot 2s ease-in-out infinite;
  }
  @keyframes premPulseDot {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50%      { opacity: 1; transform: scale(1.2); }
  }
`;
