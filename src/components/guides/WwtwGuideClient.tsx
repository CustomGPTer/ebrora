// src/components/guides/WwtwGuideClient.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import type { GuideSection, GuideSubsystem, GuideSubsection } from "@/data/guides/types";
import { GuideDownloadGate } from "./GuideDownloadGate";
import { CostOfDefectsCalculator, StandardsMatrix, SystemMapOverview, ScreenSizingCalculator, GritChamberCalculator, PumpDutyExplorer, StormTankCalculator, PSTSizingCalculator, SludgePumpingCalculator, ASPProcessCalculator, MBRFluxCalculator, AerationDemandCalculator, SludgeThickeningCalculator, LiquorsReturnCalculator, ElectricalLoadEstimator, ChemicalDosingCalculator, GlossarySearch, RASSASCalculator, MCERTSFlowChecker, OdourVentilationCalculator, CarbonEstimator, StageChecklist, TricklingFilterCalculator, HSTSizingCalculator, ICAIOCountEstimator, CDMDutyHolderChecker, ScreeningsVolumeEstimator, CakeStorageCalculator } from "./interactives";

/* ─── Checklist subsystem IDs (rendered with StageChecklist component) ─── */
const CHECKLIST_SUBSYSTEMS = new Set([
  "primary-treatment-checklist-hold-points",
  "secondary-treatment-checklist-hold-points",
  "sludge-stage-checklist-and-hold-points",
  "sitewide-checklist-and-close-out",
]);

/* ─── Map of subsystem IDs to interactive components ─── */
const SUBSYSTEM_INTERACTIVES: Record<string, React.ReactNode> = {
  // Pre-Treatment
  "fine-screens": <ScreenSizingCalculator />,
  "screenings-handling-washcompaction": <ScreeningsVolumeEstimator />,
  "grit-removal-free-vortex": <GritChamberCalculator />,
  "inlet-pumps-wet-well": <PumpDutyExplorer />,
  "storm-overflow-storm-tanks-structure-hydraulics": <StormTankCalculator />,
  // Primary Treatment
  "primary-settlement-tanks-psts": <PSTSizingCalculator />,
  "primary-sludge-scum-removal-pumping": <SludgePumpingCalculator />,
  // Secondary Treatment
  "activated-sludge-process-asp": <ASPProcessCalculator />,
  "membrane-bioreactor-mbr": <MBRFluxCalculator />,
  "percolating-trickling-filters": <TricklingFilterCalculator />,
  "humus-settlement-tanks-hsts": <HSTSizingCalculator />,
  "rassas-systems-return-and-waste-activated-sludge": <RASSASCalculator />,
  "aeration-systems-blowers-diffusers-do-control": <AerationDemandCalculator />,
  // Sludge Treatment
  "sludge-thickening-sas": <SludgeThickeningCalculator />,
  "storage-loading-and-logistics": <CakeStorageCalculator />,
  "liquors-return-and-side-stream-treatment": <LiquorsReturnCalculator />,
  // Sitewide Systems
  "mcerts-flow-measurement-and-final-effluent-monitoring": <MCERTSFlowChecker />,
  "odour-control-and-ventilation-covers-ducting-scrubbers-biofi": <OdourVentilationCalculator />,
  "electrical-power-standby-generation-and-earthing": <ElectricalLoadEstimator />,
  "ica-scada-telemetry-and-cybersecurity": <ICAIOCountEstimator />,
  "chemical-storage-bunding-and-delivery": <ChemicalDosingCalculator />,
  "programme-cost-and-carbon": <CarbonEstimator />,
  "cdm-2015-roles-design-risk-and-hs-file": <CDMDutyHolderChecker />,
};

/* ─── Icon map (inline SVGs to avoid dependency) ─── */
const ICONS: Record<string, React.ReactNode> = {
  BookOpen: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  TrendingUp: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Map: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  Filter: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Layers: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Zap: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Database: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  Settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Book: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  FileText: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

/* ─── Simple markdown-ish renderer ─── */
function renderContent(raw: string) {
  if (!raw) return null;

  const blocks = raw.split(/\n\n+/);
  const elements: React.ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // Table block
    if (trimmed.includes("---") && trimmed.includes("|")) return; // skip raw tables

    // Bullet list
    if (/^[-•]\s/m.test(trimmed)) {
      const items = trimmed
        .split(/\n/)
        .filter((l) => /^[-•]\s/.test(l.trim()))
        .map((l) => l.replace(/^[-•]\s+/, "").trim());

      if (items.length > 0) {
        elements.push(
          <ul key={bi} className="space-y-2 my-4">
            {items.map((item, ii) => (
              <li key={ii} className="flex gap-3 text-gray-700 leading-relaxed text-[15px]">
                <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-[#1B5B50]/50" />
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
              </li>
            ))}
          </ul>
        );
        return;
      }
    }

    // Numbered list
    if (/^\d+[.:]\s/m.test(trimmed)) {
      const items = trimmed
        .split(/\n/)
        .filter((l) => /^\d+[.:]\s/.test(l.trim()))
        .map((l) => l.replace(/^\d+[.:]\s+/, "").trim());

      if (items.length > 0) {
        elements.push(
          <ol key={bi} className="space-y-2 my-4 list-decimal list-inside">
            {items.map((item, ii) => (
              <li key={ii} className="text-gray-700 leading-relaxed text-[15px] pl-1">
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
              </li>
            ))}
          </ol>
        );
        return;
      }
    }

    // Note/callout
    if (trimmed.startsWith("**Note**") || trimmed.startsWith("Note:")) {
      elements.push(
        <div key={bi} className="my-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-4 py-3">
          <p className="text-sm text-amber-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.replace(/^\*\*Note\*\*\s*/, "").replace(/^Note:\s*/, "")) }} />
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={bi} className="text-gray-700 leading-relaxed text-[15px] my-3" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />
    );
  });

  return <>{elements}</>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/---/g, "—")
    .replace(/--/g, "–");
}

/* ─── Subsection card (design considerations, common errors, etc.) ─── */
function SubsectionCard({ sub, isOpen, onToggle }: { sub: GuideSubsection; isOpen: boolean; onToggle: () => void }) {
  const isError = /error/i.test(sub.title);
  const isDesign = /design/i.test(sub.title);
  const isConstruction = /construction/i.test(sub.title);
  const isCommissioning = /commissioning/i.test(sub.title);
  const isHowItWorks = /how it works/i.test(sub.title);
  const isChecklist = /checklist|hold point|record/i.test(sub.title);

  let accent = "border-gray-200 bg-white";
  let badge = "";
  let badgeColor = "";

  if (isHowItWorks) {
    accent = "border-blue-200 bg-blue-50/40";
    badge = "Overview";
    badgeColor = "bg-blue-100 text-blue-700";
  } else if (isError) {
    accent = "border-red-200 bg-red-50/30";
    badge = "Common Errors";
    badgeColor = "bg-red-100 text-red-700";
  } else if (isDesign) {
    accent = "border-emerald-200 bg-emerald-50/30";
    badge = "Design";
    badgeColor = "bg-emerald-100 text-emerald-700";
  } else if (isConstruction) {
    accent = "border-orange-200 bg-orange-50/30";
    badge = "Construction";
    badgeColor = "bg-orange-100 text-orange-700";
  } else if (isCommissioning) {
    accent = "border-purple-200 bg-purple-50/30";
    badge = "Commissioning";
    badgeColor = "bg-purple-100 text-purple-700";
  } else if (isChecklist) {
    accent = "border-[#1B5B50]/20 bg-[#1B5B50]/5";
    badge = "Checklist";
    badgeColor = "bg-[#1B5B50]/10 text-[#1B5B50]";
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${accent}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {badge && (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
          <span className="font-medium text-gray-900 text-sm truncate">
            {sub.title}
          </span>
        </div>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-inherit">
          <div className="pt-4">
            {renderContent(sub.content)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Subsystem block (e.g. Fine Screens, PSTs) ─── */
function SubsystemBlock({
  subsystem,
  sectionColor,
}: {
  subsystem: GuideSubsystem;
  sectionColor: string;
}) {
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSub = (id: string) => {
    setOpenSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (openSubs.size === subsystem.subsections.length) {
      setOpenSubs(new Set());
    } else {
      setOpenSubs(new Set(subsystem.subsections.map((s) => s.id)));
    }
  };

  return (
    <div
      id={`subsystem-${subsystem.id}`}
      className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm guide-subsystem"
    >
      {/* Subsystem header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-8 rounded-full shrink-0"
            style={{ backgroundColor: sectionColor }}
          />
          <h3 className="text-lg font-bold text-gray-900">{subsystem.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {subsystem.subsections.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {subsystem.subsections.length} sections
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Intro content */}
          {subsystem.content && (
            <div className="px-6 py-4 bg-gray-50/50">
              {renderContent(subsystem.content)}
            </div>
          )}

          {/* Interactive component (if available for this subsystem) */}
          {SUBSYSTEM_INTERACTIVES[subsystem.id] && (
            <div className="px-6" data-guide-no-print>
              {SUBSYSTEM_INTERACTIVES[subsystem.id]}
            </div>
          )}

          {/* Stage checklist (replaces normal subsections for checklist subsystems) */}
          {CHECKLIST_SUBSYSTEMS.has(subsystem.id) && (
            <div className="px-6 pb-4">
              <StageChecklist subsystem={subsystem} stageColor={sectionColor} />
            </div>
          )}

          {/* Subsections (skip for checklists — StageChecklist handles them) */}
          {subsystem.subsections.length > 0 && !CHECKLIST_SUBSYSTEMS.has(subsystem.id) && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Sections
                </span>
                <button
                  onClick={expandAll}
                  className="text-xs font-medium text-[#1B5B50] hover:text-[#144840] transition-colors"
                >
                  {openSubs.size === subsystem.subsections.length ? "Collapse all" : "Expand all"}
                </button>
              </div>
              <div className="space-y-3">
                {subsystem.subsections.map((sub) => (
                  <SubsectionCard
                    key={sub.id}
                    sub={sub}
                    isOpen={openSubs.has(sub.id)}
                    onToggle={() => toggleSub(sub.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Section renderer ─── */
function SectionBlock({ section }: { section: GuideSection }) {
  return (
    <div id={`section-${section.id}`} className="scroll-mt-24 guide-section">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${section.color}15`, color: section.color }}
        >
          {ICONS[section.icon] || ICONS.FileText}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
          )}
        </div>
      </div>

      {/* Section intro content */}
      {section.content && (
        <div className="mb-6">{renderContent(section.content)}</div>
      )}

      {/* ─── Interactive components by section ─── */}
      <div data-guide-no-print>
        {section.id === "the-cost-of-defects" && <CostOfDefectsCalculator />}
        {section.id === "standards-snapshot" && <StandardsMatrix />}
        {section.id === "modern-wwtw-system-map-overview" && <SystemMapOverview />}
        {section.id === "acronyms-and-glossary" && <GlossarySearch glossaryContent={section.content} />}
      </div>

      {/* Direct subsections (for Standards Snapshot, Cost of Defects, etc.) */}
      {section.directSubsections && section.directSubsections.length > 0 && (
        <div className="space-y-3 mb-8">
          {section.directSubsections.map((sub) => (
            <DirectSubsectionCard key={sub.id} sub={sub} sectionColor={section.color} />
          ))}
        </div>
      )}

      {/* Subsystems */}
      {section.subsystems.length > 0 && (
        <div className="space-y-4">
          {section.subsystems.map((subsystem) => (
            <SubsystemBlock
              key={subsystem.id}
              subsystem={subsystem}
              sectionColor={section.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Direct subsection card (no parent subsystem) ─── */
function DirectSubsectionCard({ sub, sectionColor }: { sub: GuideSubsection; sectionColor: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: sectionColor }} />
          <span className="font-medium text-gray-900 text-[15px]">{sub.title}</span>
        </div>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {renderContent(sub.content)}
        </div>
      )}
    </div>
  );
}

/* ─── Sidebar navigation ─── */
function GuideSidebar({
  sections,
  activeSection,
  onNavigate,
  isOpen,
  onClose,
}: {
  sections: GuideSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 lg:transform-none
          lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:z-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-y-auto overscroll-contain
        `}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
          <span className="font-semibold text-gray-900 text-sm">Contents</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Guide title */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <Link href="/guides" className="text-xs text-[#1B5B50] font-medium hover:underline mb-1 inline-block">
            ← All Guides
          </Link>
          <h3 className="text-sm font-bold text-gray-900 leading-snug mt-1">
            Design, Safety &amp; Quality Guide
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">WWTW · Edition 1</p>
        </div>

        {/* Navigation tree */}
        <nav className="p-3 space-y-0.5">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const isExpanded = expandedSections.has(section.id);
            const hasChildren = section.subsystems.length > 0;

            return (
              <div key={section.id}>
                <button
                  onClick={() => {
                    onNavigate(section.id);
                    if (hasChildren) toggleSection(section.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all
                    ${isActive
                      ? "bg-[#1B5B50]/8 text-[#1B5B50] font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${section.color}15`,
                      color: section.color,
                    }}
                  >
                    <span className="scale-75">{ICONS[section.icon] || ICONS.FileText}</span>
                  </span>
                  <span className="truncate flex-1 text-[13px]">{section.title}</span>
                  {hasChildren && (
                    <svg
                      className={`w-3 h-3 shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {/* Subsystem links */}
                {isExpanded && hasChildren && (
                  <div className="ml-8 mt-0.5 space-y-0.5 pb-1">
                    {section.subsystems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onNavigate(section.id, sub.id);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-gray-500 hover:text-[#1B5B50] hover:bg-[#1B5B50]/5 rounded-md transition-colors truncate"
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/* ─── Main client component ─── */
interface WwtwGuideClientProps {
  sections: GuideSection[];
  meta: {
    slug: string;
    title: string;
    subtitle: string;
    edition: string;
    sectionCount: number;
  };
}

export function WwtwGuideClient({ sections, meta }: WwtwGuideClientProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            setActiveSection(id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    const sectionEls = document.querySelectorAll("[id^='section-']");
    sectionEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const navigateTo = useCallback((sectionId: string, subsystemId?: string) => {
    const targetId = subsystemId ? `subsystem-${subsystemId}` : `section-${sectionId}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  }, []);

  // Simple search across all content
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 3) return [];
    const q = searchQuery.toLowerCase();
    const results: { sectionId: string; sectionTitle: string; subsystemTitle?: string; snippet: string }[] = [];

    for (const section of sections) {
      // Search section content
      if (section.content?.toLowerCase().includes(q)) {
        const idx = section.content.toLowerCase().indexOf(q);
        const snippet = section.content.slice(Math.max(0, idx - 40), idx + 80);
        results.push({ sectionId: section.id, sectionTitle: section.title, snippet: `...${snippet}...` });
      }
      // Search subsystems
      for (const sub of section.subsystems) {
        const allContent = [sub.content, ...sub.subsections.map((ss) => ss.content)].join(" ");
        if (allContent.toLowerCase().includes(q)) {
          const idx = allContent.toLowerCase().indexOf(q);
          const snippet = allContent.slice(Math.max(0, idx - 40), idx + 80);
          results.push({
            sectionId: section.id,
            sectionTitle: section.title,
            subsystemTitle: sub.title,
            snippet: `...${snippet}...`,
          });
        }
      }
      if (results.length >= 12) break;
    }
    return results;
  }, [searchQuery, sections]);

  // Count totals
  const totalSubsystems = sections.reduce((acc, s) => acc + s.subsystems.length, 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent pointer-events-none guide-progress-bar">
        <div
          className="h-full bg-gradient-to-r from-[#1B5B50] to-[#2A7A6C] transition-all duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 sm:pt-14 sm:pb-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm">
            <Link href="/" className="text-gray-400 hover:text-[#1B5B50] transition-colors">Home</Link>
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/guides" className="text-gray-400 hover:text-[#1B5B50] transition-colors">Guides</Link>
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-700 font-medium">WWTW Guide</span>
          </nav>

          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#1B5B50] bg-[#1B5B50]/8 px-3 py-1 rounded-full mb-4">
            Interactive Guide
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            {meta.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mt-3 leading-relaxed max-w-3xl">
            {meta.subtitle}
          </p>
          <p className="text-sm text-gray-400 mt-2 font-medium">{meta.edition}</p>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {sections.length} sections
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#1B5B50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {totalSubsystems}+ subsystems
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm guide-toolbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 h-12">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search guide..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(e.target.value.length >= 3);
              }}
              onFocus={() => searchQuery.length >= 3 && setSearchOpen(true)}
              className="w-full h-8 pl-8 pr-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50]/20 transition-all outline-none"
            />
            <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Search results dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigateTo(result.sectionId);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="text-xs font-semibold text-[#1B5B50]">
                      {result.sectionTitle}
                      {result.subsystemTitle && <span className="text-gray-400"> → {result.subsystemTitle}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{result.snippet}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section quick-jump */}
          <div className="hidden sm:flex items-center gap-1">
            {sections.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => navigateTo(s.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeSection === s.id
                    ? "bg-[#1B5B50]/10 text-[#1B5B50]"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
                title={s.title}
              >
                {s.title.length > 14 ? s.title.slice(0, 12) + "…" : s.title}
              </button>
            ))}
          </div>

          {/* PDF download */}
          <div className="ml-auto guide-download-btn">
            <GuideDownloadGate guideSlug={meta.slug} guideTitle={meta.title} />
          </div>
        </div>
      </div>

      {/* Click outside search closes it */}
      {searchOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setSearchOpen(false)} />
      )}

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-72 shrink-0 guide-sidebar">
            <GuideSidebar
              sections={sections}
              activeSection={activeSection}
              onNavigate={navigateTo}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Mobile sidebar */}
          <div className="lg:hidden guide-sidebar">
            <GuideSidebar
              sections={sections}
              activeSection={activeSection}
              onNavigate={navigateTo}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Content */}
          <div ref={contentRef} className="flex-1 min-w-0 space-y-16 guide-content">
            {sections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-8 pb-4 text-center">
              <p className="text-sm text-gray-400">
                This guide is provided for reference only and does not replace contract documents, permits or statutory duties.
              </p>
              <p className="text-xs text-gray-300 mt-2">
                Always undertake competent design checks, RAMS, ITPs and permit-to-work controls before construction or commissioning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
