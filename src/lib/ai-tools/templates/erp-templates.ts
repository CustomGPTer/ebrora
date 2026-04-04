// =============================================================================
// EMERGENCY RESPONSE PLAN — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard  (green #059669, comprehensive ERP, ~3pp)
// T2 — Quick Reference   (red #B91C1C, lamination-ready, ~2pp)
// T3 — Role-Based        (navy #1E3A5F, organised by role, ~2pp)
// T4 — Multi-Scenario    (amber #92400E, scenario cards, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ErpTemplateSlug } from '@/lib/erp/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const GREEN = '059669'; const GREEN_SUB = 'A7F3D0'; const GREEN_BG = 'ECFDF5';
const RED_A = 'B91C1C'; const RED_SUB = 'FCA5A5'; const RED_BG = 'FEF2F2';
const NAVY = '1E3A5F'; const NAVY_SUB = '93C5FD';
const AMBER_A = '92400E'; const AMBER_SUB = 'FDE68A';
const RED = 'DC2626'; const AMBER = 'D97706'; const GREEN_RAG = '059669';
const BLUE = '2563EB'; const PURPLE = '7C3AED'; const TEAL = '0D9488';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ────────────────────────────────────────────────────────────
interface ErpData {
  documentRef: string; issueDate: string; reviewDate: string;
  preparedBy: string; projectName: string; siteAddress: string;
  gridRef: string; what3Words: string;
  principalContractor: string; client: string;
  workingHours: string; peakWorkforce: string; siteSpecificHazards: string;
  emergencyRoles: Array<{ role: string; name: string; contact: string; responsibilities: string }>;
  communicationCascade: Array<{ order: string; contact: string; nameRole: string; number: string; when: string }>;
  primaryMuster: string; secondaryMuster: string;
  evacuationSignal: string; allClearSignal: string;
  headcountMethod: string; visitorProcedure: string;
  scenarios: Array<{ id: string; name: string; severity: string; steps: Array<{ step: string; action: string; responsibility: string; notes: string }> }>;
  flowScenarios: Array<{ id: string; name: string; severity: string; trigger: string; immediate: string; escalate: string; recover: string; triggerResp: string; immediateResp: string; escalateResp: string; recoverResp: string }>;
  roleCards: Array<{ role: string; icon: string; scenarioActions: Array<{ scenario: string; actions: string; contact: string; equipment: string }>; weeklyDuties: string }>;
  actionCards: Array<{ scenario: string; colour: string; steps: string }>;
  nearestFireStation: string; nearestAE: string;
  hospitalName: string; hospitalDistance: string;
  siteAccessForEmergency: string;
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): ErpData {
  const sv = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const av = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: sv('documentRef', 'ERP-001'), issueDate: sv('issueDate'), reviewDate: sv('reviewDate'),
    preparedBy: sv('preparedBy'), projectName: sv('projectName'), siteAddress: sv('siteAddress'),
    gridRef: sv('gridRef'), what3Words: sv('what3Words'),
    principalContractor: sv('principalContractor'), client: sv('client'),
    workingHours: sv('workingHours'), peakWorkforce: sv('peakWorkforce'),
    siteSpecificHazards: sv('siteSpecificHazards'),
    emergencyRoles: av('emergencyRoles'), communicationCascade: av('communicationCascade'),
    primaryMuster: sv('primaryMuster'), secondaryMuster: sv('secondaryMuster'),
    evacuationSignal: sv('evacuationSignal'), allClearSignal: sv('allClearSignal'),
    headcountMethod: sv('headcountMethod'), visitorProcedure: sv('visitorProcedure'),
    scenarios: av('scenarios'), flowScenarios: av('flowScenarios'),
    roleCards: av('roleCards'), actionCards: av('actionCards'),
    nearestFireStation: sv('nearestFireStation'), nearestAE: sv('nearestAE'),
    hospitalName: sv('hospitalName'), hospitalDistance: sv('hospitalDistance'),
    siteAccessForEmergency: sv('siteAccessForEmergency'),
    additionalNotes: sv('additionalNotes'),
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: string[][]): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(hh => hh.width),
    rows: [
      new TableRow({ children: headers.map(hh => hdrCell(hh.text, hh.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) => txtCell(cell || '', headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined })),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] {
  const w = ratios.map(r => Math.round(W * r));
  w[w.length - 1] = W - w.slice(0, -1).reduce((a, b) => a + b, 0);
  return w;
}

// Scenario card — coloured left border with title and numbered steps
function scenarioCard(title: string, steps: string[], borderColor: string): (Paragraph | Table)[] {
  const border = { style: BorderStyle.SINGLE, size: 18, color: borderColor };
  const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: borderColor };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const result: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { before: 200, after: 40 },
      border: { left: border, top: thinBorder, right: thinBorder },
      shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
      indent: { left: 80 },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: BODY, font: 'Arial', color: borderColor })],
    }),
  ];
  steps.forEach((step, i) => {
    result.push(new Paragraph({
      spacing: { after: 20 },
      border: { left: border, right: thinBorder, ...(i === steps.length - 1 ? { bottom: thinBorder } : {}) },
      indent: { left: 360 },
      children: [
        new TextRun({ text: `${i + 1}. `, bold: true, size: SM, font: 'Arial', color: borderColor }),
        new TextRun({ text: step, size: SM, font: 'Arial' }),
      ],
    }));
  });
  return result;
}

// Role card — colour band title, name subtitle, bullet responsibilities
function roleCard(title: string, name: string, items: string[], bandColor: string): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    // Title band
    new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [W],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { fill: bandColor, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
        margins: { top: 50, bottom: 50, left: 140, right: 140 },
        children: [new Paragraph({ children: [new TextRun({ text: title.toUpperCase(), bold: true, size: BODY, font: 'Arial', color: 'FFFFFF' })] })],
      })] })],
    }),
    // Name subtitle
    new Paragraph({
      spacing: { before: 40, after: 60 },
      shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
      indent: { left: 140 },
      children: [new TextRun({ text: name, size: SM, font: 'Arial', color: '374151' })],
    }),
  ];
  // Bullet items
  items.forEach(item => {
    result.push(new Paragraph({
      spacing: { after: 30 }, indent: { left: 360 },
      children: [
        new TextRun({ text: '\u2022  ', size: SM, font: 'Arial', color: bandColor }),
        new TextRun({ text: item, size: SM, font: 'Arial' }),
      ],
    }));
  });
  result.push(h.spacer(80));
  return result;
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: ErpData): Document {
  const A = GREEN;
  const hdr2 = h.accentHeader('Emergency Response Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);
  const contactCols = cols([0.28, 0.24, 0.20, 0.28]);

  // Build scenario sections dynamically
  const scenarioChildren: (Paragraph | Table)[] = [];
  let secNum = 3;
  for (const sc of d.scenarios) {
    secNum++;
    const num = secNum < 10 ? `0${secNum}` : `${secNum}`;
    scenarioChildren.push(h.fullWidthSectionBar(num, sc.name.toUpperCase(), A));
    scenarioChildren.push(h.spacer(80));
    // If steps exist, render them as prose (each step as a line)
    const stepText = sc.steps.map((st, i) => `${st.action}${st.responsibility ? ' (' + st.responsibility + ')' : ''}`).join('. ');
    scenarioChildren.push(...h.richBodyText(stepText || ''));
    scenarioChildren.push(h.spacer(40));
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EMERGENCY RESPONSE', 'PLAN'], d.projectName || '', A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Issue Date', value: d.issueDate },
            { label: 'Review Date', value: d.reviewDate },
            { label: 'Prepared By', value: d.preparedBy },
            { label: 'Project', value: d.projectName },
            { label: 'Client', value: d.client },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Grid Reference', value: d.gridRef },
            { label: 'What3Words', value: d.what3Words },
            { label: 'Nearest A&E', value: d.nearestAE },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'SITE DESCRIPTION & KEY HAZARDS', A), h.spacer(80),
          ...h.richBodyText(d.siteSpecificHazards || ''),

          h.spacer(80), h.fullWidthSectionBar('02', 'EMERGENCY CONTACTS', A), h.spacer(80),
          // 3-col KPI for emergency services
          h.kpiDashboard([
            { value: '999', label: 'Emergency Services' },
            { value: d.hospitalDistance || '—', label: 'Nearest A&E' },
            { value: '—', label: 'Fire Station' },
          ], A, W),
          h.spacer(60),
          // Contacts table
          ...(d.emergencyRoles.length > 0 ? [dataTable(A,
            [{ text: 'ROLE', width: contactCols[0] }, { text: 'NAME', width: contactCols[1] }, { text: 'PHONE', width: contactCols[2] }, { text: 'BACKUP', width: contactCols[3] }],
            d.emergencyRoles.map(r => [r.role, r.name, r.contact, '']),
          )] : []),

          h.spacer(80), h.fullWidthSectionBar('03', 'EVACUATION PROCEDURE', A), h.spacer(80),
          ...h.richBodyText(
            `Muster Point: ${d.primaryMuster || 'TBC'}. ${d.secondaryMuster ? 'Secondary: ' + d.secondaryMuster + '. ' : ''}` +
            `Alarm signal: ${d.evacuationSignal || '3 × long blasts on air horn'}. ` +
            `On hearing the alarm: stop work, make plant safe, leave the site by the nearest safe route, proceed to the muster point. ` +
            `${d.headcountMethod || 'Fire Warden conducts headcount against sign-in register'}. ` +
            `Do not re-enter the site until the all-clear is given.`
          ),

          // Dynamic scenario sections
          ...scenarioChildren,

          h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — QUICK REFERENCE (Red #B91C1C)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: ErpData): Document {
  const A = RED_A;
  const hdr2 = h.accentHeader('\u26A0 EMERGENCY QUICK REFERENCE', A);
  const ftr = h.accentFooter(d.documentRef, 'Quick Reference', A);
  const stepCols = cols([0.08, 0.92]);

  // Build the step-by-step table rows from action cards or default
  const defaultSteps = [
    ['1', 'MAKE SAFE — Remove yourself and others from immediate danger. Do NOT put yourself at risk.'],
    ['2', 'RAISE ALARM — Shout for help. Sound air horn (3 blasts). Radio: "EMERGENCY — [type] — [location]"'],
    ['3', 'CALL 999 — Give: site address, What3Words, nature of emergency, number of casualties'],
    ['4', `CALL SITE MANAGER — ${d.emergencyRoles.find(r => r.role.toLowerCase().includes('controller') || r.role.toLowerCase().includes('manager'))?.name || 'Site Manager'}`],
    ['5', 'FIRST AID — Apply first aid if trained. Do NOT move casualty unless in danger. AED in welfare cabin.'],
    ['6', 'GUIDE SERVICES — Send someone to the main gate to direct ambulance/fire to the incident location'],
  ];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['\u26A0 EMERGENCY', 'QUICK REFERENCE'], `${d.projectName || ''} — Display in Site Office & at Work Fronts`, A, RED_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Site', value: `${d.siteAddress}` },
            { label: 'What3Words', value: d.what3Words },
            { label: 'Ref', value: d.documentRef },
            { label: 'Date', value: d.issueDate },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — single page quick reference
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          // Big emergency call header
          h.warningBanner('IN AN EMERGENCY CALL 999', A, 'FFFFFF', W),
          h.spacer(40),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: `Site: ${d.siteAddress}  |  What3Words: ${d.what3Words}`, size: SM, font: 'Arial', color: GREY }),
          ] }),

          // 3 emergency contact KPI boxes
          h.kpiDashboard(
            d.emergencyRoles.slice(0, 3).map(r => ({ value: r.name || r.role, label: r.role })),
            A, W
          ),
          h.spacer(60),

          // Step by step table
          h.fullWidthSectionBar('', 'WHAT TO DO — STEP BY STEP', A), h.spacer(60),
          dataTable(A,
            [{ text: 'STEP', width: stepCols[0] }, { text: 'ACTION', width: stepCols[1] }],
            defaultSteps,
          ),
          h.spacer(60),

          // CS Emergency callout
          h.calloutBox(
            `DO NOT ENTER to rescue without SCBA. Call CS Rescue Team Lead. Rescue tripod and winch at each CS entry point.`,
            RED, RED_BG, '7F1D1D', W, { boldPrefix: 'CONFINED SPACE EMERGENCY:' }
          ),
          h.spacer(40),

          // End mark
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: GREY, space: 8 } },
            children: [new TextRun({ text: '\u2014 Designed for printing, laminating, and displaying at all work fronts \u2014', size: SM, font: 'Arial', color: GREY, italics: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true }),
          ] }),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — ROLE-BASED (Navy #1E3A5F)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: ErpData): Document {
  const A = NAVY;
  const hdr2 = h.accentHeader('Emergency Response — Role Assignments', A);
  const ftr = h.accentFooter(d.documentRef, 'Role-Based', A);

  // Role colour assignments
  const roleColors: Record<string, string> = {
    'site emergency controller': RED, 'emergency controller': RED,
    'first aider': GREEN_RAG, 'first aider (faw)': GREEN_RAG,
    'fire warden': AMBER, 'fire marshal': AMBER,
    'confined space rescue team lead': TEAL, 'cs rescue team': TEAL,
    'all site personnel': BLUE, 'everyone': BLUE,
  };

  const roleChildren: (Paragraph | Table)[] = [];
  for (const rc of d.roleCards) {
    const color = roleColors[(rc.role || '').toLowerCase()] || GREY;
    const actions = rc.scenarioActions?.map(sa => sa.actions) || [];
    if (rc.weeklyDuties) actions.push(rc.weeklyDuties);
    roleChildren.push(...roleCard(rc.role, '', actions, color));
  }
  // If no roleCards, build from emergencyRoles
  if (d.roleCards.length === 0 && d.emergencyRoles.length > 0) {
    for (const er of d.emergencyRoles) {
      const color = roleColors[(er.role || '').toLowerCase()] || GREY;
      const items = (er.responsibilities || '').split(/[.;]/).filter(Boolean).map(s => s.trim());
      roleChildren.push(...roleCard(er.role, `${er.name} | ${er.contact}`, items, color));
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EMERGENCY RESPONSE', 'ROLE ASSIGNMENTS'], `${d.projectName || ''} — Who Does What in an Emergency`, A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.issueDate },
            { label: 'Site', value: d.projectName },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Peak Workforce', value: d.peakWorkforce },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — role cards
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'EMERGENCY ROLES & RESPONSIBILITIES', A), h.spacer(80),
          ...roleChildren,
          h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — MULTI-SCENARIO (Amber #92400E)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: ErpData): Document {
  const A = AMBER_A;
  const hdr2 = h.accentHeader('Emergency Scenario Plans', A);
  const ftr = h.accentFooter(d.documentRef, 'Multi-Scenario', A);

  // Scenario colour map
  const scenarioColors: Record<string, string> = {
    fire: RED, explosion: RED, 'fire/explosion': RED,
    medical: GREEN_RAG, injury: GREEN_RAG, 'serious injury': GREEN_RAG,
    'confined space': PURPLE, cs: PURPLE, 'cs-emergency': PURPLE,
    flood: BLUE, flooding: BLUE, inundation: BLUE,
    spill: AMBER, environmental: AMBER,
    utilities: GREY, gas: GREY, electric: GREY,
  };
  function getScenarioColor(name: string): string {
    const low = (name || '').toLowerCase();
    for (const [key, color] of Object.entries(scenarioColors)) {
      if (low.includes(key)) return color;
    }
    return GREY;
  }

  // Build scenario cards
  const cardChildren: (Paragraph | Table)[] = [];

  // Try flowScenarios first (multi-scenario format)
  if (d.flowScenarios.length > 0) {
    for (const fs of d.flowScenarios) {
      const color = getScenarioColor(fs.name);
      const steps = [fs.trigger, fs.immediate, fs.escalate, fs.recover].filter(Boolean);
      cardChildren.push(...scenarioCard(`${fs.name}`, steps, color));
    }
  }
  // Fall back to actionCards
  else if (d.actionCards.length > 0) {
    for (const ac of d.actionCards) {
      const color = getScenarioColor(ac.scenario);
      const steps = (ac.steps || '').split(/\d+\.\s*/).filter(Boolean);
      cardChildren.push(...scenarioCard(ac.scenario, steps, color));
    }
  }
  // Fall back to scenarios
  else if (d.scenarios.length > 0) {
    for (const sc of d.scenarios) {
      const color = getScenarioColor(sc.name);
      const steps = sc.steps.map(st => st.action);
      cardChildren.push(...scenarioCard(sc.name, steps, color));
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['EMERGENCY RESPONSE', 'SCENARIO PLANS'], `${d.projectName || ''} — Scenario-Specific Response Procedures`, A, AMBER_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.issueDate },
            { label: 'Site', value: d.projectName },
            { label: 'Scenarios Covered', value: `${d.flowScenarios.length || d.actionCards.length || d.scenarios.length} scenarios` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body — scenario cards
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', 'SCENARIO RESPONSE CARDS', A), h.spacer(80),
          ...cardChildren,
          h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildErpTemplateDocument(
  content: any,
  templateSlug: ErpTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard':  return buildT1(d);
    case 'quick-reference':  return buildT2(d);
    case 'role-based':       return buildT3(d);
    case 'multi-scenario':   return buildT4(d);
    default:                 return buildT1(d);
  }
}
