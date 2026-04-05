// =============================================================================
// Permit to Dig Builder — Multi-Template Engine (REBUILT)
// 4 templates matching HTML render library exactly.
//
// T1 — Ebrora Standard    (green #059669, HSG47 comprehensive permit, ~2pp)
// T2 — Daily Permit        (amber #92400E, single-shift card, ~2pp)
// T3 — Utility Strike      (red #DC2626/cover #991B1B, emergency response, ~2pp)
// T4 — Avoidance Plan      (navy #1e293b, PAS 128 site-wide strategy, ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { PermitToDigTemplateSlug } from '@/lib/permit-to-dig/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

// Accent palettes
const GREEN = '059669'; const GREEN_SUB = 'A7F3D0';
const AMBER_A = '92400E'; const AMBER_SUB = 'FDE68A';
const RED_D = '991B1B'; const RED_SUB = 'FCA5A5';
const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const AMBER = 'D97706'; const AMBER_BG = 'FFFBEB';
const BLUE = '2563EB'; const BLUE_BG = 'EFF6FF';
const PURPLE = '7C3AED'; const PURPLE_BG = 'F5F3FF';
const GREEN_RAG = '059669'; const GREEN_BG = 'ECFDF5';
const NAVY = '1e293b'; const NAVY_SUB = '93C5FD';
const GREY_A = '374151';
const GREY = '6B7280'; const ZEBRA = 'F9FAFB';

// ── Data Interface ───────────────────────────────────────────────────────────
interface ServiceEntry { type: string; description: string; owner: string; size: string; depth: string; status: string; confirmedBy: string; horizontalDistance?: string; verified?: boolean; notes?: string; surveyLevel?: string; riskToWorks?: string; rule?: string; }
interface PreDigCheck { item: string; checked?: boolean; }
interface ExcavationControl { zone: string; method: string; plantPermitted: string; maxDigSpeed: string; }
interface StrikeResponse { serviceType: string; icon: string; colour: string; bgColour: string; textColour: string; calloutText: string; }
interface CommonAction { step: string; action: string; }
interface AvoidanceProcedure { procedure: string; detail: string; reference: string; }
interface AuthRow { label: string; value: string; }
interface ClosureRow { label: string; value: string; }
interface WorkingHours { period: string; hours: string; activities: string; }
interface RegRef { reference: string; description: string; }

interface PermitToDigData {
  documentRef: string; issueDate: string; validUntil: string;
  projectName: string; siteAddress: string; location: string;
  excavationMethod: string; knownServicesCount: string; deepestDig: string;
  issuedBy: string; preparedBy: string;
  principalContractor: string; client: string;
  operatorName: string;
  servicesIdentified: ServiceEntry[];
  hsg47Callout: string;
  preDigChecks: PreDigCheck[];
  excavationControls: ExcavationControl[];
  // T2 daily permit
  shiftDate: string; shiftValid: string;
  expiryCallout: string;
  preDigConfirmation: PreDigCheck[];
  authorisationRows: AuthRow[];
  closureRows: ClosureRow[];
  // T3 utility strike
  strikeResponses: StrikeResponse[];
  commonActions: CommonAction[];
  dangerBannerText: string;
  dangerSubText: string;
  strikePurpose: string; strikeDisplay: string;
  // T4 avoidance plan
  surveyMethodology: string;
  surveyStandard: string; surveyLevel: string; totalServicesCount: string;
  servicesRegister: ServiceEntry[];
  avoidanceProcedures: AvoidanceProcedure[];
  revisionCallout: string;
  regulatoryReferences: RegRef[];
  additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): PermitToDigData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  return {
    documentRef: s('documentRef'), issueDate: s('issueDate'), validUntil: s('validUntil') || s('reviewDate'),
    projectName: s('projectName'), siteAddress: s('siteAddress'), location: s('location'),
    excavationMethod: s('excavationMethod') || s('excavationType'), knownServicesCount: s('knownServicesCount'),
    deepestDig: s('deepestDig') || s('maxDepth'), issuedBy: s('issuedBy') || s('permitIssuer') || s('preparedBy'),
    preparedBy: s('preparedBy'), principalContractor: s('principalContractor'), client: s('client'),
    operatorName: s('operatorName'),
    servicesIdentified: a('servicesIdentified'),
    hsg47Callout: s('hsg47Callout'),
    preDigChecks: a('preDigChecks').length > 0 ? a('preDigChecks') : a('preDigChecklist'),
    excavationControls: a('excavationControls'),
    shiftDate: s('shiftDate'), shiftValid: s('shiftValid') || s('shiftTime'),
    expiryCallout: s('expiryCallout'),
    preDigConfirmation: a('preDigConfirmation').length > 0 ? a('preDigConfirmation') : a('preDigChecklist'),
    authorisationRows: a('authorisationRows'),
    closureRows: a('closureRows'),
    strikeResponses: a('strikeResponses').length > 0 ? a('strikeResponses') : defaultStrikeResponses(),
    commonActions: a('commonActions').length > 0 ? a('commonActions') : defaultCommonActions(),
    dangerBannerText: s('dangerBannerText', '\u26A0 IF YOU STRIKE A SERVICE \u2014 STOP IMMEDIATELY \u26A0'),
    dangerSubText: s('dangerSubText'),
    strikePurpose: s('strikePurpose', 'Emergency response if a buried service is struck during excavation'),
    strikeDisplay: s('strikeDisplay', 'Print, laminate, display at every excavation and in all plant cabs'),
    surveyMethodology: s('surveyMethodology'),
    surveyStandard: s('surveyStandard', 'PAS 128:2022 \u2014 Specification for Underground Utility Detection'),
    surveyLevel: s('surveyLevel'),
    totalServicesCount: s('totalServicesCount'),
    servicesRegister: a('servicesRegister').length > 0 ? a('servicesRegister') : a('servicesIdentified'),
    avoidanceProcedures: a('avoidanceProcedures'),
    revisionCallout: s('revisionCallout'),
    regulatoryReferences: a('regulatoryReferences').length > 0 ? a('regulatoryReferences') : defaultRefs(),
    additionalNotes: s('additionalNotes'),
  };
}

function defaultStrikeResponses(): StrikeResponse[] {
  return [
    { serviceType: 'ELECTRIC CABLE STRIKE', icon: '\u26A1', colour: RED, bgColour: RED_BG, textColour: RED_D,
      calloutText: 'DANGER \u2014 ELECTROCUTION RISK. Stay in the cab if operating plant. Do NOT touch the cable or any metal in contact with it. Keep everyone 10m away. Call ENW: 105. Do NOT attempt to isolate. Wait for ENW to confirm dead before approaching.' },
    { serviceType: 'GAS PIPE STRIKE', icon: '\uD83D\uDD25', colour: AMBER, bgColour: AMBER_BG, textColour: '92400E',
      calloutText: 'DANGER \u2014 EXPLOSION / ASPHYXIATION RISK. Evacuate 50m minimum. No ignition sources (phones, engines, smoking). Call National Gas Emergency: 0800 111 999. Do NOT attempt to repair or plug. Approach only from upwind. Keep public away.' },
    { serviceType: 'WATER MAIN STRIKE', icon: '\uD83D\uDCA7', colour: BLUE, bgColour: BLUE_BG, textColour: '1E40AF',
      calloutText: 'FLOOD / WASHOUT RISK. Attempt to isolate upstream if valve visible and accessible (do NOT enter flooded excavation). Call United Utilities: 0345 672 3723. Protect excavation from washout. Dewater if safe to do so.' },
    { serviceType: 'SEWER / DRAIN STRIKE', icon: '\uD83D\uDEB0', colour: PURPLE, bgColour: PURPLE_BG, textColour: '4C1D95',
      calloutText: 'CONTAMINATION / INUNDATION RISK. Withdraw from excavation. Call United Utilities: 0345 672 3723. Do NOT enter excavation if filling with sewage. Leptospirosis risk \u2014 decontaminate if splashed. Environment Agency: 0800 80 70 60 if discharge to watercourse.' },
    { serviceType: 'TELECOM / FIBRE STRIKE', icon: '\uD83D\uDCE1', colour: GREEN_RAG, bgColour: GREEN_BG, textColour: '065F46',
      calloutText: 'SERVICE DISRUPTION. No immediate safety risk (low voltage). Stop digging. Protect exposed cable. Call Openreach: 0800 023 2023. Do not cut or attempt repair. Report to Site Manager.' },
  ];
}

function defaultCommonActions(): CommonAction[] {
  return [
    { step: '1', action: 'STOP all plant and excavation immediately' },
    { step: '2', action: 'WITHDRAW all personnel to safe distance' },
    { step: '3', action: 'CALL relevant utility emergency number + Site Manager' },
    { step: '4', action: 'PROTECT the strike location \u2014 do NOT backfill' },
    { step: '5', action: 'PHOTOGRAPH the damage for evidence' },
    { step: '6', action: 'WAIT for utility company to attend and make safe' },
  ];
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'HSG47', description: 'Avoiding danger from underground services' },
    { reference: 'PAS 128:2022', description: 'Specification for underground utility detection' },
    { reference: 'NJUG Volume 4', description: 'Positioning and colour coding of utilities' },
    { reference: 'CDM 2015 Regulation 13', description: 'Safe excavation planning' },
    { reference: 'EAW Regulations 1989', description: 'Electricity at Work — cable avoidance' },
  ];
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function cols(fracs: number[]): number[] { return fracs.map(f => Math.round(W * f)); }
function dataTable(hdrs: Array<{ text: string; w: number }>, rows: Array<Array<{ text: string; bold?: boolean; color?: string }>>, accent: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: hdrs.map(col => col.w),
    rows: [
      new TableRow({ children: hdrs.map(col => hdrCell(col.text, col.w, accent)) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => txtCell(cell.text, hdrs[ci].w, { bg: ri % 2 === 0 ? ZEBRA : h.WHITE, bold: cell.bold, color: cell.color })),
      })),
    ],
  });
}
function ragC(level: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('high') || l.includes('live') || l.includes('hand dig') || l.includes('danger')) return RED;
  if (l.includes('medium') || l.includes('isolat')) return AMBER;
  if (l.includes('low') || l.includes('dead') || l.includes('clear') || l.includes('abandon')) return GREEN_RAG;
  return GREY;
}
function bulletList(items: string[], accent: string): Paragraph[] {
  return items.filter(Boolean).map(item => new Paragraph({
    spacing: { after: 40 }, indent: { left: 240 },
    children: [
      new TextRun({ text: '\u2022  ', size: BODY, font: 'Arial', color: accent }),
      new TextRun({ text: item, size: BODY, font: 'Arial' }),
    ],
  }));
}
function infoTable2(rows: Array<{ label: string; value: string }>, accent: string): Table {
  const lw = Math.round(W * 0.32);
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [lw, W - lw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, borders, margins: { top: 50, bottom: 50, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: r.label, bold: true, size: BODY, font: 'Arial' })] })] }),
      new TableCell({ width: { size: W - lw, type: WidthType.DXA }, borders, margins: { top: 50, bottom: 50, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: r.value || '\u2014', size: BODY, font: 'Arial' })] })] }),
    ] })),
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD (Green #059669 · HSG47 comprehensive permit)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: PermitToDigData): Document {
  const A = GREEN;
  const hdr = h.accentHeader('Permit to Dig', A);
  const ftr = h.accentFooter(d.documentRef, 'Ebrora Standard', A);

  const body: (Paragraph | Table)[] = [];

  // 01 — KNOWN SERVICES IN EXCAVATION ZONE
  body.push(h.fullWidthSectionBar('01', 'KNOWN SERVICES IN EXCAVATION ZONE', A));
  body.push(h.spacer(80));
  if (d.servicesIdentified.length > 0) {
    const c = cols([0.22, 0.14, 0.12, 0.12, 0.20, 0.20]);
    body.push(dataTable(
      [{ text: 'Service', w: c[0] }, { text: 'Owner', w: c[1] }, { text: 'Size', w: c[2] },
       { text: 'Depth (approx)', w: c[3] }, { text: 'Status', w: c[4] }, { text: 'Confirmed By', w: c[5] }],
      d.servicesIdentified.map(s => [
        { text: `${s.type ? s.type.toUpperCase() + ' ' : ''}${s.description}`, bold: true },
        { text: s.owner || '' }, { text: s.size || '' }, { text: s.depth },
        { text: s.status, bold: true, color: ragC(s.status) },
        { text: s.confirmedBy || '' },
      ]), A));
  }

  // HSG47 danger callout
  body.push(h.spacer(40));
  body.push(h.calloutBox(
    d.hsg47Callout || 'No machine excavation within 500mm of any known service. Hand dig only within 500mm using insulated hand tools (non-conductive spade/shovel). Use CAT & Genny scan immediately before breaking ground \u2014 even if services have been previously located. If an unidentified service is encountered: STOP, withdraw, protect, and report to the permit issuer immediately.',
    RED, RED_BG, RED_D, W,
    { boldPrefix: '\u26A0 HSG47 \u2014 SAFE DIGGING RULES:' }
  ));

  // 02 — PRE-DIG CHECKS
  body.push(h.fullWidthSectionBar('02', 'PRE-DIG CHECKS', A));
  body.push(h.spacer(80));
  const checks = d.preDigChecks.length > 0 ? d.preDigChecks.map(c => c.item || (c as any)) : [];
  body.push(...bulletList(checks.map(c => typeof c === 'string' ? c : c.item || ''), A));

  // 03 — EXCAVATION CONTROLS
  if (d.excavationControls.length > 0) {
    body.push(h.fullWidthSectionBar('03', 'EXCAVATION CONTROLS', A));
    body.push(h.spacer(80));
    const c = cols([0.28, 0.32, 0.22, 0.18]);
    body.push(dataTable(
      [{ text: 'Zone', w: c[0] }, { text: 'Method', w: c[1] }, { text: 'Plant Permitted', w: c[2] }, { text: 'Max Dig Speed', w: c[3] }],
      d.excavationControls.map(ec => [
        { text: ec.zone, bold: true }, { text: ec.method, bold: true, color: ec.method.toLowerCase().includes('hand') ? RED : undefined },
        { text: ec.plantPermitted }, { text: ec.maxDigSpeed },
      ]), A));
  }

  // 04 — PERMIT AUTHORISATION (4-box signature grid)
  body.push(h.fullWidthSectionBar('04', 'PERMIT AUTHORISATION', A));
  body.push(h.spacer(80));
  body.push(h.signatureGrid(['Permit Issuer', 'Permit Recipient (Operator)', 'CAT Operative', 'Permit Closure'], A, W));

  // End mark
  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['PERMIT TO DIG'], `HSG47 Compliant \u2014 ${d.projectName}`, A, GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Permit Number', value: d.documentRef },
            { label: 'Date', value: d.issueDate },
            { label: 'Valid Until', value: d.validUntil },
            { label: 'Project', value: d.projectName },
            { label: 'Location', value: d.location },
            { label: 'Excavation Method', value: d.excavationMethod },
            { label: 'Known Services', value: d.knownServicesCount || `${d.servicesIdentified.length} identified` },
            { label: 'Deepest Dig', value: d.deepestDig },
            { label: 'Issued By', value: d.issuedBy },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr }, footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — DAILY PERMIT (Amber #92400E · Single-shift card)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: PermitToDigData): Document {
  const A = AMBER_A;
  const hdr = h.accentHeader('Daily Dig Permit', A);
  const ftr = h.accentFooter(`${d.documentRef} \u00B7 ${d.shiftDate || d.issueDate}`, 'Daily Permit', A);

  const body: (Paragraph | Table)[] = [];

  // Red expiry callout
  body.push(h.calloutBox(
    d.expiryCallout || 'THIS PERMIT EXPIRES AT 18:00 TODAY. A new permit is required for each shift. Do NOT dig outside the permitted zone. If you encounter an unidentified service: STOP \u2192 WITHDRAW \u2192 PROTECT \u2192 REPORT.',
    RED, RED_BG, RED_D, W,
    { boldPrefix: '\u26A0' }
  ));

  // SERVICES IN DIG ZONE
  body.push(h.fullWidthSectionBar('', 'SERVICES IN DIG ZONE', A));
  body.push(h.spacer(80));
  if (d.servicesIdentified.length > 0) {
    const c = cols([0.32, 0.14, 0.22, 0.32]);
    body.push(dataTable(
      [{ text: 'Service', w: c[0] }, { text: 'Depth', w: c[1] }, { text: 'Status', w: c[2] }, { text: 'Rule', w: c[3] }],
      d.servicesIdentified.map(s => [
        { text: `${s.type ? s.type.toUpperCase() + ' ' : ''}${s.description}`, bold: true },
        { text: s.depth }, { text: s.status, bold: true, color: ragC(s.status) },
        { text: s.rule || 'Hand dig within 500mm', bold: true, color: RED },
      ]), A));
  }

  // PRE-DIG CONFIRMATION
  body.push(h.fullWidthSectionBar('', 'PRE-DIG CONFIRMATION', A));
  body.push(h.spacer(80));
  const confirms = d.preDigConfirmation.length > 0 ? d.preDigConfirmation : d.preDigChecks;
  body.push(...bulletList(confirms.map(c => typeof c === 'string' ? c : c.item || ''), A));

  // AUTHORISATION
  body.push(h.fullWidthSectionBar('', 'AUTHORISATION', A));
  body.push(h.spacer(80));
  const authRows = d.authorisationRows.length > 0 ? d.authorisationRows : [
    { label: 'Permit Issued By', value: `${d.issuedBy}  Signed: _________  Time: _______` },
    { label: 'Received By (Operator)', value: `${d.operatorName || ''}  Signed: _________  Time: _______` },
    { label: 'CAT Scan By', value: 'Name: _________  Signed: _________  Time: _______' },
  ];
  body.push(infoTable2(authRows, A));

  // PERMIT CLOSURE
  body.push(h.fullWidthSectionBar('', 'PERMIT CLOSURE (END OF SHIFT)', A));
  body.push(h.spacer(80));
  const closeRows = d.closureRows.length > 0 ? d.closureRows : [
    { label: 'Work Complete?', value: '\u2610 Yes   \u2610 No \u2014 new permit required tomorrow' },
    { label: 'Services Intact?', value: '\u2610 Yes \u2014 all services confirmed undamaged   \u2610 No \u2014 strike report raised' },
    { label: 'Closed By', value: 'Name: _________   Signed: _________   Time: _________' },
  ];
  body.push(infoTable2(closeRows, A));

  // Single-shift footer
  body.push(new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 8 } },
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 40 },
    children: [new TextRun({ text: '\u2014 Single-shift permit \u2014 expires 18:00 today \u2014', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
  }));
  body.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true })],
  }));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['DAILY DIG PERMIT'], `Single Shift \u2014 Valid Until 18:00 Today Only`, A, AMBER_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Permit No.', value: d.documentRef },
            { label: 'Date', value: d.shiftDate || d.issueDate },
            { label: 'Valid', value: d.shiftValid || d.validUntil || '07:30 \u2013 18:00 TODAY ONLY' },
            { label: 'Location', value: d.location },
            { label: 'Operator', value: d.operatorName || '' },
            { label: 'Services', value: d.knownServicesCount || `${d.servicesIdentified.length} identified` },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr }, footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — UTILITY STRIKE RESPONSE (Red #DC2626 / cover #991B1B)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: PermitToDigData): Document {
  const A = RED;
  const hdr = h.accentHeader('\u26A0 Utility Strike Response', A);
  const ftr = h.accentFooter(d.documentRef, 'Utility Strike Response', A);

  const body: (Paragraph | Table)[] = [];

  // Danger banner
  body.push(h.warningBanner(d.dangerBannerText, RED_D, 'FFFFFF', W));
  body.push(h.spacer(40));
  if (d.dangerSubText) {
    body.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: d.dangerSubText, bold: true, size: BODY, font: 'Arial', color: RED_D })],
    }));
  }

  // Service-specific response sections
  for (const sr of d.strikeResponses) {
    // Coloured section bar
    body.push(h.fullWidthSectionBar('', `${sr.icon} ${sr.serviceType}`, sr.colour));
    body.push(h.spacer(40));
    // Callout with service-specific colour
    body.push(h.calloutBox(sr.calloutText, sr.colour, sr.bgColour, sr.textColour, W));
    body.push(h.spacer(40));
  }

  // ALL STRIKES — COMMON ACTIONS
  body.push(h.fullWidthSectionBar('', 'ALL STRIKES \u2014 COMMON ACTIONS', GREY_A));
  body.push(h.spacer(80));
  if (d.commonActions.length > 0) {
    const c = cols([0.08, 0.92]);
    body.push(dataTable(
      [{ text: '#', w: c[0] }, { text: 'Action', w: c[1] }],
      d.commonActions.map(a => [
        { text: a.step, bold: true, color: RED },
        { text: a.action, bold: true },
      ]), GREY_A));
  }

  // Lamination footer
  body.push(new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID, space: 8 } },
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 40 },
    children: [new TextRun({ text: '\u2014 Print, laminate, display at all excavations and in plant cabs \u2014', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })],
  }));
  body.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true })],
  }));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['\u26A0 UTILITY STRIKE', 'RESPONSE PLAN'], 'Emergency Procedures By Service Type', RED_D, RED_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.issueDate },
            { label: 'Site', value: `${d.projectName}` },
            { label: 'Purpose', value: d.strikePurpose },
            { label: 'Display', value: d.strikeDisplay },
          ], RED_D, W),
          h.coverFooterLine(),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr }, footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — AVOIDANCE PLAN (Navy #1e293b · PAS 128 site-wide strategy)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: PermitToDigData): Document {
  const A = NAVY;
  const hdr = h.accentHeader('Buried Services Avoidance Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Avoidance Plan', A);

  const body: (Paragraph | Table)[] = [];

  // 01 — SURVEY METHODOLOGY
  body.push(h.fullWidthSectionBar('01', 'SURVEY METHODOLOGY \u2014 PAS 128:2022', A));
  body.push(h.spacer(80));
  body.push(...h.richBodyText(d.surveyMethodology || '', BODY));

  // 02 — SERVICES REGISTER
  body.push(h.fullWidthSectionBar('02', 'SERVICES REGISTER \u2014 FULL SITE', A));
  body.push(h.spacer(80));
  const reg = d.servicesRegister.length > 0 ? d.servicesRegister : d.servicesIdentified;
  if (reg.length > 0) {
    const c = cols([0.06, 0.16, 0.08, 0.10, 0.08, 0.10, 0.14, 0.14]);
    // Adjust last column
    c[7] = W - c[0] - c[1] - c[2] - c[3] - c[4] - c[5] - c[6];
    body.push(dataTable(
      [{ text: 'ID', w: c[0] }, { text: 'Service', w: c[1] }, { text: 'Owner', w: c[2] },
       { text: 'Size', w: c[3] }, { text: 'Depth', w: c[4] }, { text: 'Status', w: c[5] },
       { text: 'Survey Level', w: c[6] }, { text: 'Risk to Works', w: c[7] }],
      reg.map((s, i) => [
        { text: (s as any).id || `S${String(i + 1).padStart(2, '0')}`, bold: true },
        { text: `${s.type ? s.type.toUpperCase() + ' ' : ''}${s.description}` },
        { text: s.owner || '' }, { text: s.size || '' }, { text: s.depth },
        { text: s.status || '' },
        { text: s.surveyLevel || '' },
        { text: s.riskToWorks || '', bold: true, color: ragC(s.riskToWorks || '') },
      ]), A));
  }

  // 03 — SITE-WIDE AVOIDANCE PROCEDURES
  if (d.avoidanceProcedures.length > 0) {
    body.push(h.fullWidthSectionBar('03', 'SITE-WIDE AVOIDANCE PROCEDURES', A));
    body.push(h.spacer(80));
    const c = cols([0.24, 0.54, 0.22]);
    body.push(dataTable(
      [{ text: 'Procedure', w: c[0] }, { text: 'Detail', w: c[1] }, { text: 'Reference', w: c[2] }],
      d.avoidanceProcedures.map(ap => [
        { text: ap.procedure, bold: true }, { text: ap.detail }, { text: ap.reference },
      ]), A));
  }

  // Revision callout (navy)
  if (d.revisionCallout) {
    body.push(h.spacer(40));
    body.push(h.calloutBox(d.revisionCallout, NAVY, 'F1F5F9', '334155', W,
      { boldPrefix: 'Plan Revision:' }));
  }

  // Signature grid
  body.push(h.spacer(200));
  body.push(h.signatureGrid(['Prepared By', 'Approved By'], A, W));

  // End mark
  body.push(...h.endMark(A));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      {
        properties: { ...h.PORTRAIT_SECTION },
        children: [
          h.coverBlock(['BURIED SERVICES', 'AVOIDANCE PLAN'], `PAS 128:2022 / HSG47 \u2014 Site-Wide Strategy`, A, NAVY_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.issueDate },
            { label: 'Project', value: d.projectName },
            { label: 'Survey Standard', value: d.surveyStandard },
            { label: 'Survey Level', value: d.surveyLevel },
            { label: 'Total Services Identified', value: d.totalServicesCount || `${reg.length}` },
          ], A, W),
          h.coverFooterLine(),
        ],
      },
      {
        properties: { ...h.PORTRAIT_SECTION },
        headers: { default: hdr }, footers: { default: ftr },
        children: body,
      },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildPermitToDigTemplateDocument(
  content: any,
  templateSlug: PermitToDigTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ebrora-standard': return buildT1(d);
    case 'daily-permit':    return buildT2(d);
    case 'utility-strike':  return buildT3(d);
    case 'avoidance-plan':  return buildT4(d);
    default:                return buildT1(d);
  }
}
