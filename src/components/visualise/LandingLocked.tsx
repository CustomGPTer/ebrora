// =============================================================================
// LandingLocked — shown to logged-out users and FREE-tier users.
// Static art-directed SVG mockups in the hero, feature grid, and tier CTA.
// =============================================================================

import Link from 'next/link';

type LandingMode = 'signed-out' | 'free-tier';

interface Props {
  mode: LandingMode;
}

export default function LandingLocked({ mode }: Props) {
  const ctaHref = mode === 'signed-out' ? '/auth/register' : '/pricing#starter';
  const ctaLabel = mode === 'signed-out' ? 'Sign up free' : 'Upgrade to Starter';
  const subCta = mode === 'signed-out' ? 'Already have an account? Log in' : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A44C] bg-[#FDF6E8] px-3 py-1 rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A44C]" />
                New — AI visual document creator
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1B5B50] leading-tight">
                Paste text.
                <br />
                Get diagrams.
              </h1>
              <p className="text-lg text-gray-600 mt-6 max-w-xl leading-relaxed">
                Visualise turns a short description of your work into professional
                construction diagrams &mdash; flowcharts, CDM hierarchies, RACI matrices,
                risk matrices, timelines, and more. A growing library of presets.
                Fully editable canvas.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1B5B50] text-white font-semibold hover:bg-[#144840] transition-colors"
                >
                  {ctaLabel}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-[#1B5B50] text-[#1B5B50] font-semibold hover:bg-[#E6F0EE] transition-colors"
                >
                  See pricing
                </Link>
              </div>
              {subCta ? (
                <p className="text-sm text-gray-500 mt-4">
                  <Link href="/auth/login" className="underline hover:text-[#1B5B50]">
                    {subCta}
                  </Link>
                </p>
              ) : null}
            </div>

            {/* Hero mockup */}
            <div className="relative">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1B5B50]">Built for UK construction</h2>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Construction-specific presets alongside the standard flowcharts and charts
            &mdash; everything picks up your brand palette and exports cleanly for reports
            and submissions.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="AI preset matching"
            body="Paste a paragraph, get 1–3 diagrams automatically. GPT-4 picks presets, palettes, and labels from your text."
            mockup={<FeatureMockAi />}
          />
          <FeatureCard
            title="Construction domain"
            body="CDM 2015 hierarchies, RACI matrices, risk scoring, hierarchy of controls, NEC workflows, permit-to-work flows."
            mockup={<FeatureMockConstruction />}
          />
          <FeatureCard
            title="Editable canvas"
            body="Figma-grade multi-select, snap-to-grid, alignment guides. Drag, resize, recolour, inline-edit text."
            mockup={<FeatureMockCanvas />}
          />
          <FeatureCard
            title="Export-ready"
            body="PNG, SVG, or PDF. White-label with your logo per export. A4 or A3, portrait or landscape."
            mockup={<FeatureMockExport />}
          />
          <FeatureCard
            title="6 palettes"
            body="Ebrora Primary, Gold, Hi-Vis, Slate, Mono, Earth. Pick manually or let the AI match the content."
            mockup={<FeatureMockPalettes />}
          />
          <FeatureCard
            title="Drafts & history"
            body="Save up to 3 drafts per user, 3-month rolling expiry. Pick up where you left off on any device."
            mockup={<FeatureMockDrafts />}
          />
        </div>
      </section>

      {/* ── Quota table ────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1B5B50]">Visualise is paid-only</h2>
            <p className="text-gray-600 mt-2 max-w-xl mx-auto">
              Independent monthly quota &mdash; doesn&apos;t share the usage cap on our
              document-generator tools.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tier</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Visualise uses / month</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Drafts</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">White-label export</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-500">Free</td>
                  <td className="py-3 px-4 text-gray-500">Locked</td>
                  <td className="py-3 px-4 text-gray-500">&mdash;</td>
                  <td className="py-3 px-4 text-gray-500">&mdash;</td>
                </tr>
                <tr className="border-b border-gray-100 bg-[#E6F0EE]/40">
                  <td className="py-3 px-4 font-semibold text-[#1B5B50]">Starter</td>
                  <td className="py-3 px-4">4</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4">Yes</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-semibold text-[#1B5B50]">Professional</td>
                  <td className="py-3 px-4">8</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4">Yes</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#1B5B50]">Unlimited</td>
                  <td className="py-3 px-4">20</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1B5B50] text-white font-semibold hover:bg-[#144840] transition-colors"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({ title, body, mockup }: { title: string; body: string; mockup: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#7EBFB2] hover:shadow-md transition-all">
      <div className="aspect-[16/9] bg-gray-50 rounded-lg border border-gray-100 mb-4 overflow-hidden flex items-center justify-center">
        {mockup}
      </div>
      <h3 className="text-lg font-semibold text-[#1B5B50] mb-1">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Hero mockup — a document shell with a flow diagram and a chart ───────────

function HeroMockup() {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-xl p-4 lg:p-6">
      {/* Mock browser chrome */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
        <div className="ml-auto text-[10px] text-gray-400 font-mono">ebrora.com/visualise</div>
      </div>

      {/* Mock generate bar */}
      <div className="bg-[#F9FAFB] border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-gray-200 rounded-full w-3/4 mb-1.5" />
          <div className="h-1.5 bg-gray-200 rounded-full w-1/2" />
        </div>
        <div className="flex-shrink-0 px-3 py-1.5 bg-[#1B5B50] text-white text-[10px] font-semibold rounded">
          Generate
        </div>
      </div>

      {/* Mock visual 1 — flow */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Handover sequence
        </div>
        <svg viewBox="0 0 400 90" className="w-full h-auto">
          <defs>
            <marker id="hm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2A7A6C" />
            </marker>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={12 + i * 98} y={25} width={80} height={40} rx={6} fill="#1B5B50" />
              <text
                x={12 + i * 98 + 40}
                y={50}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#E6F0EE"
              >
                {['Commission', 'Test', 'Sign off', 'Hand over'][i]}
              </text>
              {i < 3 ? (
                <line
                  x1={12 + i * 98 + 80 + 2}
                  y1={45}
                  x2={12 + (i + 1) * 98 - 4}
                  y2={45}
                  stroke="#2A7A6C"
                  strokeWidth="2"
                  markerEnd="url(#hm-arrow)"
                />
              ) : null}
            </g>
          ))}
        </svg>
      </div>

      {/* Mock visual 2 — bar chart */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Cost allocation
        </div>
        <svg viewBox="0 0 400 90" className="w-full h-auto">
          <line x1="30" y1="78" x2="390" y2="78" stroke="#B5DAD2" strokeWidth="1" />
          {[
            { h: 50, label: 'Prelims' },
            { h: 68, label: 'Ground' },
            { h: 42, label: 'MEICA' },
            { h: 22, label: 'Comm.' },
            { h: 14, label: 'O/H' },
          ].map((bar, i) => (
            <g key={i}>
              <rect x={40 + i * 70} y={78 - bar.h} width={50} height={bar.h} rx={2} fill="#D4A44C" />
              <text
                x={40 + i * 70 + 25}
                y={88}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                fill="#6B7280"
              >
                {bar.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Feature mockups — small decorative SVGs for each feature card ───────────

function FeatureMockAi() {
  return (
    <svg viewBox="0 0 160 90" className="w-[85%] h-auto">
      <rect x="10" y="12" width="140" height="18" rx="3" fill="#E6F0EE" />
      <rect x="14" y="17" width="80" height="2" rx="1" fill="#1B5B50" />
      <rect x="14" y="22" width="60" height="2" rx="1" fill="#7EBFB2" />
      <line x1="80" y1="36" x2="80" y2="46" stroke="#1B5B50" strokeWidth="1.5" strokeDasharray="2 2" />
      <rect x="22" y="50" width="36" height="24" rx="3" fill="#1B5B50" />
      <rect x="62" y="50" width="36" height="24" rx="3" fill="#2A7A6C" />
      <rect x="102" y="50" width="36" height="24" rx="3" fill="#4A9A8A" />
    </svg>
  );
}

function FeatureMockConstruction() {
  return (
    <svg viewBox="0 0 160 90" className="w-[85%] h-auto">
      <rect x="68" y="8" width="24" height="10" rx="2" fill="#1B5B50" />
      <rect x="36" y="30" width="36" height="10" rx="2" fill="#2A7A6C" />
      <rect x="88" y="30" width="36" height="10" rx="2" fill="#2A7A6C" />
      <rect x="36" y="52" width="36" height="10" rx="2" fill="#4A9A8A" />
      <rect x="88" y="52" width="36" height="10" rx="2" fill="#4A9A8A" />
      <rect x="68" y="74" width="24" height="10" rx="2" fill="#7EBFB2" />
      <line x1="80" y1="18" x2="80" y2="24" stroke="#7EBFB2" />
      <line x1="54" y1="24" x2="106" y2="24" stroke="#7EBFB2" />
      <line x1="54" y1="24" x2="54" y2="30" stroke="#7EBFB2" />
      <line x1="106" y1="24" x2="106" y2="30" stroke="#7EBFB2" />
    </svg>
  );
}

function FeatureMockCanvas() {
  return (
    <svg viewBox="0 0 160 90" className="w-[85%] h-auto">
      <defs>
        <pattern id="fcgrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="160" height="90" fill="url(#fcgrid)" />
      <rect x="30" y="20" width="50" height="30" rx="3" fill="#1B5B50" fillOpacity="0.85" />
      <rect x="85" y="45" width="50" height="30" rx="3" fill="#D4A44C" fillOpacity="0.85" />
      <circle cx="30" cy="20" r="3" fill="#fff" stroke="#1B5B50" strokeWidth="1.5" />
      <circle cx="80" cy="20" r="3" fill="#fff" stroke="#1B5B50" strokeWidth="1.5" />
      <circle cx="80" cy="50" r="3" fill="#fff" stroke="#1B5B50" strokeWidth="1.5" />
      <circle cx="30" cy="50" r="3" fill="#fff" stroke="#1B5B50" strokeWidth="1.5" />
      <line x1="80" y1="20" x2="135" y2="20" stroke="#D4A44C" strokeDasharray="2 2" strokeWidth="0.75" />
    </svg>
  );
}

function FeatureMockExport() {
  return (
    <svg viewBox="0 0 160 90" className="w-[75%] h-auto">
      <rect x="20" y="14" width="90" height="62" rx="4" fill="#FFFFFF" stroke="#1B5B50" strokeWidth="1.5" />
      <rect x="26" y="20" width="40" height="4" rx="1" fill="#1B5B50" />
      <rect x="26" y="30" width="78" height="2" rx="1" fill="#B5DAD2" />
      <rect x="26" y="36" width="78" height="2" rx="1" fill="#B5DAD2" />
      <rect x="26" y="46" width="30" height="20" rx="2" fill="#D4A44C" />
      <rect x="60" y="46" width="44" height="20" rx="2" fill="#1B5B50" />
      <path d="M 115 40 L 135 40 L 135 60 L 115 60 Z" fill="none" stroke="#1B5B50" strokeWidth="1.5" />
      <text x="125" y="53" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill="#1B5B50">PDF</text>
    </svg>
  );
}

function FeatureMockPalettes() {
  const palettes = [
    ['#1B5B50', '#2A7A6C', '#4A9A8A', '#7EBFB2'],
    ['#D4A44C', '#E0B86B', '#EBCB8B', '#F4DEB0'],
    ['#FF6600', '#FFAA00', '#FFCC00', '#00AA44'],
    ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6'],
    ['#1A1A1A', '#4D4D4D', '#808080', '#B3B3B3'],
    ['#5C4033', '#8B6F47', '#A89078', '#C4AE99'],
  ];
  return (
    <svg viewBox="0 0 160 90" className="w-[85%] h-auto">
      {palettes.map((p, i) => (
        <g key={i} transform={`translate(16, ${6 + i * 13})`}>
          {p.map((c, j) => (
            <rect key={j} x={j * 30} y={0} width={28} height={10} rx={2} fill={c} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function FeatureMockDrafts() {
  return (
    <svg viewBox="0 0 160 90" className="w-[85%] h-auto">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${10 + i * 48}, 16)`}>
          <rect width="42" height="58" rx="4" fill="#FFFFFF" stroke="#B5DAD2" strokeWidth="1" />
          <rect x={6} y={6} width={30} height={22} rx={2} fill={['#1B5B50', '#2A7A6C', '#4A9A8A'][i]} fillOpacity="0.25" />
          <rect x={6} y={34} width={30} height={2} rx={1} fill="#1B5B50" />
          <rect x={6} y={40} width={20} height={2} rx={1} fill="#7EBFB2" />
          <rect x={6} y={46} width={24} height={2} rx={1} fill="#7EBFB2" />
        </g>
      ))}
    </svg>
  );
}
