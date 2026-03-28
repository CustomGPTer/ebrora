// =============================================================================
// Emergency Response Plan Builder — Multi-Template Engine
// 4 templates, all consuming the same ERP JSON structure.
//
// T1 — Ebrora Standard    (green, cover, sequential scenario sections)
// T2 — Quick Reference    (red/orange, lamination-ready, action cards)
// T3 — Role-Based         (navy, organised by role not scenario)
// T4 — Multi-Scenario     (teal, trigger→immediate→escalate→recover flowcharts)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { ErpTemplateSlug } from '@/lib/erp/types';

const W = h.A4_CONTENT_WIDTH;
const BODY = 20; const SM = 16; const LG = 24; const XL = 32; const TTL = 44;

const EBRORA = h.EBRORA_GREEN; const ACCENT_DARK = '143D2B';
const RED_D = '991B1B'; const RED = 'DC2626'; const RED_BG = 'FEF2F2';
const AMBER = 'D97706'; const AMBER_BG = 'FEF3C7';
const GREEN_RAG = '059669'; const GREEN_BG = 'D1FAE5';
const BLUE = '2563EB'; const BLUE_BG = 'DBEAFE';
const PURPLE = '7C3AED'; const PURPLE_BG = 'F5F3FF';
const NAVY = '1e293b'; const NAVY_BG = 'f1f5f9';
const TEAL = '0f766e'; const TEAL_BG = 'f0fdfa'; const TEAL_DARK = '134e4a';
const ORANGE = '92400e'; const ORANGE_BG = 'FFFBEB';
const GREY_RAG = '6B7280'; const GREY_BG = 'F3F4F6';
const ZEBRA = 'F5F5F5';
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Data Interface ───────────────────────────────────────────────────────────
interface EmergencyRole { role: string; name: string; contact: string; responsibilities: string; }
interface CascadeEntry { order: string; contact: string; nameRole: string; number: string; when: string; }
interface ScenarioStep { step: string; action: string; responsibility: string; notes: string; }
interface Scenario { id: string; name: string; severity: string; steps: ScenarioStep[]; }
interface FlowScenario { id: string; name: string; severity: string; trigger: string; immediate: string; escalate: string; recover: string; triggerResp: string; immediateResp: string; escalateResp: string; recoverResp: string; triggerEquip: string; immediateEquip: string; escalateEquip: string; recoverEquip: string; }
interface RoleCard { role: string; icon: string; scenarioActions: Array<{ scenario: string; actions: string; contact: string; equipment: string }>; weeklyDuties: string; }
interface ActionCard { scenario: string; colour: string; steps: string; }
interface EquipmentItem { equipment: string; location: string; inspection: string; responsible: string; }
interface DrillItem { activity: string; frequency: string; participants: string; record: string; }
interface WeatherCondition { condition: string; trigger: string; action: string; decisionMaker: string; }
interface RegRef { reference: string; description: string; }

interface ErpData {
  documentRef: string; issueDate: string; reviewDate: string;
  preparedBy: string; projectName: string; siteAddress: string;
  gridRef: string; what3Words: string;
  principalContractor: string; client: string;
  workingHours: string; peakWorkforce: string; siteSpecificHazards: string;
  emergencyRoles: EmergencyRole[];
  communicationCascade: CascadeEntry[];
  primaryMuster: string; secondaryMuster: string;
  evacuationSignal: string; allClearSignal: string;
  headcountMethod: string; visitorProcedure: string;
  scenarios: Scenario[];
  flowScenarios: FlowScenario[];
  roleCards: RoleCard[];
  actionCards: ActionCard[];
  weatherConditions: WeatherCondition[];
  equipmentItems: EquipmentItem[];
  drillItems: DrillItem[];
  nearestFireStation: string; nearestAE: string;
  policeContact: string; siteAccessForEmergency: string;
  firePlanSubmitted: string; hazardInfoProvided: string;
  hospitalName: string; hospitalDistance: string;
  hospitalGridRef: string; hospitalRoute: string;
  regulatoryReferences: RegRef[];
  additionalNotes: string;
}

// ── Extract ──────────────────────────────────────────────────────────────────
function extract(c: any): ErpData {
  const s = (v: any, fb = '') => v ?? fb;
  const a = (v: any) => Array.isArray(v) ? v : [];
  return {
    documentRef: s(c.documentRef), issueDate: s(c.issueDate), reviewDate: s(c.reviewDate),
    preparedBy: s(c.preparedBy), projectName: s(c.projectName), siteAddress: s(c.siteAddress),
    gridRef: s(c.gridRef), what3Words: s(c.what3Words),
    principalContractor: s(c.principalContractor), client: s(c.client),
    workingHours: s(c.workingHours), peakWorkforce: s(c.peakWorkforce),
    siteSpecificHazards: s(c.siteSpecificHazards),
    emergencyRoles: a(c.emergencyRoles), communicationCascade: a(c.communicationCascade),
    primaryMuster: s(c.primaryMuster), secondaryMuster: s(c.secondaryMuster),
    evacuationSignal: s(c.evacuationSignal), allClearSignal: s(c.allClearSignal),
    headcountMethod: s(c.headcountMethod), visitorProcedure: s(c.visitorProcedure),
    scenarios: a(c.scenarios), flowScenarios: a(c.flowScenarios),
    roleCards: a(c.roleCards), actionCards: a(c.actionCards),
    weatherConditions: a(c.weatherConditions), equipmentItems: a(c.equipmentItems),
    drillItems: a(c.drillItems),
    nearestFireStation: s(c.nearestFireStation), nearestAE: s(c.nearestAE),
    policeContact: s(c.policeContact), siteAccessForEmergency: s(c.siteAccessForEmergency),
    firePlanSubmitted: s(c.firePlanSubmitted), hazardInfoProvided: s(c.hazardInfoProvided),
    hospitalName: s(c.hospitalName), hospitalDistance: s(c.hospitalDistance),
    hospitalGridRef: s(c.hospitalGridRef), hospitalRoute: s(c.hospitalRoute),
    regulatoryReferences: a(c.regulatoryReferences).length > 0 ? a(c.regulatoryReferences) : defaultRefs(),
    additionalNotes: s(c.additionalNotes),
  };
}

function defaultRefs(): RegRef[] {
  return [
    { reference: 'MHSW Regulations 1999', description: 'Regulation 8 — procedures for serious and imminent danger' },
    { reference: 'CDM 2015', description: 'Regulation 13 — PC duties to manage emergencies' },
    { reference: 'Regulatory Reform (Fire Safety) Order 2005', description: 'Fire risk assessment and emergency planning' },
    { reference: 'HSE L153 ACoP', description: 'Managing health and safety in construction — emergency arrangements' },
    { reference: 'Health and Safety (First Aid) Regulations 1981', description: 'First aid provision duty' },
    { reference: 'Environmental Permitting Regulations 2016', description: 'Pollution prevention and reporting' },
    { reference: 'RIDDOR 2013', description: 'Reporting deaths, specified injuries, dangerous occurrences' },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function secHead(num: string, text: string, accent: string, font = 'Arial'): Paragraph {
  return new Paragraph({ spacing: { before: 360, after: 140 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 6 } },
    children: [new TextRun({ text: `${num}   ${text.toUpperCase()}`, bold: true, size: LG, font, color: accent })] });
}
function hdrCell(text: string, width: number, bg: string, font = 'Arial'): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: bg, type: ShadingType.CLEAR },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font, color: h.WHITE })] })] });
}
function txtCell(text: string, width: number, opts?: { bold?: boolean; bg?: string; fontSize?: number; font?: string; color?: string }): TableCell {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: opts?.bg || h.WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: opts?.bold, size: opts?.fontSize || SM + 2, font: opts?.font || 'Arial', color: opts?.color })] })] });
}
function infoRow(l: string, v: string, lw: number, vw: number, lbg: string, lc: string): TableRow {
  return new TableRow({ children: [
    new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS, shading: { fill: lbg, type: ShadingType.CLEAR },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l, bold: true, size: SM + 2, font: 'Arial', color: lc })] })] }),
    new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v || '\u2014', size: SM + 2, font: 'Arial' })] })] }),
  ] });
}
function infoTable(rows: Array<{ label: string; value: string }>, lbg: string, lc: string): Table {
  const lw = Math.round(W * 0.35);
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: rows.map(r => infoRow(r.label, r.value, lw, W - lw, lbg, lc)) });
}
function dataTable(headers: Array<{ text: string; width: number }>, rows: Array<Array<{ text: string; bold?: boolean }>>, headerBg: string, zb = ZEBRA): Table {
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: headers.map(hd => hdrCell(hd.text, hd.width, headerBg)) }),
    ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => txtCell(cell.text, headers[ci].width, { bold: cell.bold, bg: ri % 2 === 0 ? zb : h.WHITE })) })),
  ] });
}
function signOff(roles: string[], bg: string): Table {
  const cols = [{ t: 'Role', w: Math.round(W * 0.22) }, { t: 'Name', w: Math.round(W * 0.28) }, { t: 'Signature', w: Math.round(W * 0.25) }, { t: 'Date', w: W - Math.round(W * 0.22) - Math.round(W * 0.28) - Math.round(W * 0.25) }];
  return new Table({ width: { size: W, type: WidthType.DXA }, rows: [
    new TableRow({ children: cols.map(c => hdrCell(c.t, c.w, bg)) }),
    ...roles.map(role => new TableRow({ height: { value: 600, rule: 'atLeast' as any }, children: cols.map((c, i) => txtCell(i === 0 ? role : '', c.w)) })),
  ] });
}
function footerLine(): Paragraph {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: h.GREY_MID } },
    children: [new TextRun({ text: 'This Emergency Response Plan must be reviewed at least every 6 months, after any emergency incident, and whenever site conditions change.', size: SM, font: 'Arial', color: h.GREY_DARK, italics: true })] });
}
function sevColour(sev: string): { fill: string; text: string } {
  const s = (sev || '').toLowerCase();
  if (s === 'critical' || s === 'high') return { fill: 'FEE2E2', text: RED };
  if (s === 'medium') return { fill: AMBER_BG, text: AMBER };
  if (s === 'low') return { fill: GREEN_BG, text: GREEN_RAG };
  return { fill: GREY_BG, text: GREY_RAG };
}
function sevCell(text: string, width: number): TableCell {
  const c = sevColour(text);
  return new TableCell({ width: { size: width, type: WidthType.DXA }, margins: CM, borders: h.CELL_BORDERS,
    shading: { fill: c.fill, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: text || '\u2014', bold: true, size: SM, font: 'Arial', color: c.text })] })] });
}
function roleBand(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 300, after: 120 }, shading: { type: ShadingType.CLEAR, fill: NAVY },
    children: [new TextRun({ text: `  ${text.toUpperCase()}  `, bold: true, size: BODY + 2, font: 'Arial', color: h.WHITE })] });
}
function scenarioBand(name: string, severity: string): Paragraph {
  return new Paragraph({ spacing: { before: 280, after: 100 }, shading: { type: ShadingType.CLEAR, fill: TEAL },
    children: [
      new TextRun({ text: `  ${name.toUpperCase()}`, bold: true, size: BODY, font: 'Arial', color: h.WHITE }),
      new TextRun({ text: `     ${severity}`, bold: true, size: SM - 2, font: 'Arial', color: 'ccfbf1' }),
    ] });
}
function actionCardPara(card: ActionCard, colourMap: Record<string, { fill: string; text: string }>): Paragraph[] {
  const c = colourMap[card.colour] || { fill: GREY_BG, text: GREY_RAG };
  return [
    new Paragraph({ spacing: { before: 120, after: 40 },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: c.text, space: 6 }, top: { style: BorderStyle.SINGLE, size: 2, color: c.text }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c.text }, right: { style: BorderStyle.SINGLE, size: 2, color: c.text } },
      shading: { type: ShadingType.CLEAR, fill: c.fill },
      children: [new TextRun({ text: card.scenario.toUpperCase(), bold: true, size: SM + 2, font: 'Arial', color: c.text })] }),
    new Paragraph({ spacing: { after: 120 },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: c.text, space: 6 }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c.text }, right: { style: BorderStyle.SINGLE, size: 2, color: c.text } },
      shading: { type: ShadingType.CLEAR, fill: c.fill },
      children: [new TextRun({ text: card.steps, size: SM + 2, font: 'Arial', color: '1a1a1a' })] }),
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// T1 — EBRORA STANDARD
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: ErpData): Document {
  const A = EBRORA; const LBG = 'f0fdf4'; const LC = EBRORA;
  const roleCols = [Math.round(W * 0.20), Math.round(W * 0.20), Math.round(W * 0.18), W - Math.round(W * 0.20) * 2 - Math.round(W * 0.18)];
  const cascCols = [Math.round(W * 0.08), Math.round(W * 0.22), Math.round(W * 0.20), Math.round(W * 0.18), W - Math.round(W * 0.08) - Math.round(W * 0.22) - Math.round(W * 0.20) - Math.round(W * 0.18)];
  const stepCols = [Math.round(W * 0.06), Math.round(W * 0.42), Math.round(W * 0.22), W - Math.round(W * 0.06) - Math.round(W * 0.42) - Math.round(W * 0.22)];
  const equipCols = [Math.round(W * 0.26), Math.round(W * 0.26), Math.round(W * 0.22), W - Math.round(W * 0.26) * 2 - Math.round(W * 0.22)];
  const drillCols = [Math.round(W * 0.24), Math.round(W * 0.28), Math.round(W * 0.24), W - Math.round(W * 0.24) - Math.round(W * 0.28) - Math.round(W * 0.24)];
  const refCols = [Math.round(W * 0.38), W - Math.round(W * 0.38)];

  const scenarioSections: (Paragraph | Table)[] = [];
  let secNum = 5;
  for (const sc of d.scenarios) {
    scenarioSections.push(secHead(`${secNum}.0`, sc.name, A));
    scenarioSections.push(dataTable(
      [{ text: '#', width: stepCols[0] }, { text: 'Action', width: stepCols[1] }, { text: 'Responsibility', width: stepCols[2] }, { text: 'Notes', width: stepCols[3] }],
      sc.steps.map((st, i) => [{ text: String(i + 1) }, { text: st.action }, { text: st.responsibility }, { text: st.notes }]),
      A));
    secNum++;
  }
  if (d.weatherConditions.length > 0) {
    scenarioSections.push(secHead(`${secNum}.0`, 'Severe Weather', A));
    scenarioSections.push(dataTable(
      [{ text: 'Condition', width: Math.round(W * 0.18) }, { text: 'Trigger', width: Math.round(W * 0.22) }, { text: 'Action', width: Math.round(W * 0.36) }, { text: 'Decision', width: W - Math.round(W * 0.18) - Math.round(W * 0.22) - Math.round(W * 0.36) }],
      d.weatherConditions.map(wc => [{ text: wc.condition }, { text: wc.trigger }, { text: wc.action }, { text: wc.decisionMaker }]),
      A));
    secNum++;
  }
  const equipNum = secNum; const drillNum = secNum + 1; const liaisonNum = secNum + 2;
  const hospNum = secNum + 3; const refNum = secNum + 4; const signNum = secNum + 5;

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Emergency Response Plan') }, footers: { default: h.ebroraFooter() },
        children: [
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: ACCENT_DARK }, spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: 12, font: 'Arial', color: ACCENT_DARK })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 40 }, children: [new TextRun({ text: 'EMERGENCY RESPONSE PLAN', bold: true, size: TTL, font: 'Arial', color: A })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'MHSW 1999 \u00B7 CDM 2015 \u00B7 Fire Safety Order 2005', size: BODY, font: 'Arial', color: h.GREY_DARK })] }),
          h.spacer(100),
          new Paragraph({ shading: { type: ShadingType.CLEAR, fill: A }, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `  ${(d.projectName || 'PROJECT').toUpperCase()}  `, bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
          h.spacer(100),
          infoTable([
            { label: 'Document Ref', value: d.documentRef }, { label: 'Issue Date', value: d.issueDate },
            { label: 'Review Date', value: d.reviewDate }, { label: 'Prepared By', value: d.preparedBy },
            { label: 'Client', value: d.client }, { label: 'Site Address', value: d.siteAddress },
          ], LBG, LC),
        ] },
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Emergency Response Plan') }, footers: { default: h.ebroraFooter() },
        children: [
          secHead('1.0', 'Site Information', A),
          infoTable([
            { label: 'Project', value: d.projectName }, { label: 'Site Address', value: d.siteAddress },
            { label: 'Grid Ref', value: d.gridRef }, { label: 'Principal Contractor', value: d.principalContractor },
            { label: 'Client', value: d.client }, { label: 'Working Hours', value: d.workingHours },
            { label: 'Peak Workforce', value: d.peakWorkforce }, { label: 'Site-Specific Hazards', value: d.siteSpecificHazards },
          ], LBG, LC),

          secHead('2.0', 'Emergency Controller & Key Roles', A),
          dataTable(
            [{ text: 'Role', width: roleCols[0] }, { text: 'Name', width: roleCols[1] }, { text: 'Contact', width: roleCols[2] }, { text: 'Responsibilities', width: roleCols[3] }],
            d.emergencyRoles.map(er => [{ text: er.role, bold: true }, { text: er.name }, { text: er.contact }, { text: er.responsibilities }]),
            A),

          secHead('3.0', 'Communication Cascade', A),
          dataTable(
            [{ text: 'Order', width: cascCols[0] }, { text: 'Contact', width: cascCols[1] }, { text: 'Name / Role', width: cascCols[2] }, { text: 'Number', width: cascCols[3] }, { text: 'When', width: cascCols[4] }],
            d.communicationCascade.map(cc => [{ text: cc.order }, { text: cc.contact }, { text: cc.nameRole }, { text: cc.number, bold: true }, { text: cc.when }]),
            A),

          secHead('4.0', 'Muster Points & Evacuation', A),
          infoTable([
            { label: 'Primary Muster', value: d.primaryMuster }, { label: 'Secondary Muster', value: d.secondaryMuster },
            { label: 'Evacuation Signal', value: d.evacuationSignal }, { label: 'All-Clear Signal', value: d.allClearSignal },
            { label: 'Headcount Method', value: d.headcountMethod }, { label: 'Visitors', value: d.visitorProcedure },
          ], LBG, LC),

          ...scenarioSections,

          secHead(`${equipNum}.0`, 'Emergency Equipment', A),
          dataTable(
            [{ text: 'Equipment', width: equipCols[0] }, { text: 'Location', width: equipCols[1] }, { text: 'Inspection', width: equipCols[2] }, { text: 'Responsible', width: equipCols[3] }],
            d.equipmentItems.map(ei => [{ text: ei.equipment }, { text: ei.location }, { text: ei.inspection }, { text: ei.responsible }]),
            A),

          secHead(`${drillNum}.0`, 'Training & Drill Schedule', A),
          dataTable(
            [{ text: 'Activity', width: drillCols[0] }, { text: 'Frequency', width: drillCols[1] }, { text: 'Participants', width: drillCols[2] }, { text: 'Record', width: drillCols[3] }],
            d.drillItems.map(di => [{ text: di.activity }, { text: di.frequency }, { text: di.participants }, { text: di.record }]),
            A),

          secHead(`${liaisonNum}.0`, 'Emergency Services Liaison', A),
          infoTable([
            { label: 'Nearest Fire Station', value: d.nearestFireStation }, { label: 'Nearest A&E', value: d.nearestAE },
            { label: 'Police', value: d.policeContact }, { label: 'Site Access', value: d.siteAccessForEmergency },
            { label: 'Fire Plan Submitted?', value: d.firePlanSubmitted }, { label: 'Hazard Info Provided', value: d.hazardInfoProvided },
          ], LBG, LC),

          secHead(`${hospNum}.0`, 'Hospital Route', A),
          infoTable([
            { label: 'Hospital', value: d.hospitalName }, { label: 'Distance / Time', value: d.hospitalDistance },
            { label: 'Grid Ref', value: d.hospitalGridRef }, { label: 'Route', value: d.hospitalRoute },
          ], LBG, LC),

          secHead(`${refNum}.0`, 'Regulatory References', A),
          dataTable([{ text: 'Reference', width: refCols[0] }, { text: 'Description', width: refCols[1] }],
            d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]), A),

          secHead(`${signNum}.0`, 'Sign-Off', A),
          signOff(['Prepared By', 'Emergency Controller', 'Client Representative'], A),
          footerLine(),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — QUICK REFERENCE (red/orange, lamination-ready, action cards)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: ErpData): Document {
  const A = RED_D;
  const colourMap: Record<string, { fill: string; text: string }> = {
    red: { fill: RED_BG, text: RED }, blue: { fill: BLUE_BG, text: BLUE }, amber: { fill: AMBER_BG, text: AMBER },
    orange: { fill: ORANGE_BG, text: ORANGE }, green: { fill: GREEN_BG, text: GREEN_RAG }, purple: { fill: PURPLE_BG, text: PURPLE },
  };

  // Emergency numbers grid as table
  const numCols = [Math.round(W * 0.32), W - Math.round(W * 0.32)];
  const numRows = d.communicationCascade.slice(0, 6).map(cc =>
    new TableRow({ children: [
      txtCell(cc.contact, numCols[0], { bold: true, fontSize: SM + 2 }),
      txtCell(cc.number || 'TBC', numCols[1], { bold: true, fontSize: LG, color: cc.number === '999' ? RED : '1a1a1a' }),
    ] }));

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Emergency Quick Reference') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'SITE EMERGENCY RESPONSE \u2014 QUICK REFERENCE', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED_D }, alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef} | ${d.issueDate}`, size: SM, font: 'Arial', color: 'FFFFFFB0' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: RED }, alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: '\u26A0 IF IN DOUBT \u2014 EVACUATE TO MUSTER POINT \u26A0', bold: true, size: LG + 4, font: 'Arial', color: h.WHITE })] }),

        secHead('', 'Emergency Numbers', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: numRows }),

        secHead('', 'Muster Point', A),
        infoTable([
          { label: 'Primary', value: d.primaryMuster },
          { label: 'Secondary', value: d.secondaryMuster },
          { label: 'Alarm', value: d.evacuationSignal },
        ], RED_BG, RED_D),

        secHead('', 'Action Cards', A),
        ...d.actionCards.flatMap(card => actionCardPara(card, colourMap)),

        secHead('', 'Emergency Equipment', A),
        dataTable(
          [{ text: 'Equipment', width: Math.round(W * 0.40) }, { text: 'Location', width: W - Math.round(W * 0.40) }],
          d.equipmentItems.map(ei => [{ text: ei.equipment }, { text: ei.location }]),
          A, 'FFF5F5'),

        secHead('', 'Hospital Route', A),
        infoTable([{ label: d.hospitalName || 'Nearest A&E', value: `${d.hospitalDistance}. ${d.hospitalRoute}` }], RED_BG, RED_D),

        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `Refs: MHSW 1999 Reg 8 \u00B7 CDM 2015 Reg 13 \u00B7 Fire Safety Order 2005 \u00B7 First Aid Regs 1981 \u00B7 RIDDOR 2013`, size: SM - 2, font: 'Arial', color: GREY_RAG, italics: true })] }),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — ROLE-BASED (navy, organised by role)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: ErpData): Document {
  const A = NAVY; const LBG = NAVY_BG; const LC = NAVY; const ZB = 'f8fafc';

  const roleCardSections: (Paragraph | Table)[] = [];
  for (const rc of d.roleCards) {
    roleCardSections.push(roleBand(`${rc.icon} ${rc.role}`));
    const cols = [Math.round(W * 0.20), Math.round(W * 0.40), Math.round(W * 0.18), W - Math.round(W * 0.20) - Math.round(W * 0.40) - Math.round(W * 0.18)];
    roleCardSections.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Scenario', cols[0], A), hdrCell('Your Actions', cols[1], A), hdrCell('Contact', cols[2], A), hdrCell('Equipment', cols[3], A)] }),
      ...rc.scenarioActions.map((sa, i) => new TableRow({ children: [
        txtCell(sa.scenario, cols[0], { bold: true, bg: i % 2 === 0 ? ZB : h.WHITE }),
        txtCell(sa.actions, cols[1], { bg: i % 2 === 0 ? ZB : h.WHITE }),
        txtCell(sa.contact, cols[2], { bg: i % 2 === 0 ? ZB : h.WHITE }),
        txtCell(sa.equipment, cols[3], { bg: i % 2 === 0 ? ZB : h.WHITE }),
      ] })),
      ...(rc.weeklyDuties ? [new TableRow({ children: [
        txtCell('Weekly duties', cols[0], { bold: true, bg: LBG }),
        txtCell(rc.weeklyDuties, cols[1] + cols[2] + cols[3], { bg: LBG }),
      ] })] : []),
    ] }));
  }

  // Emergency numbers
  const numCols = [Math.round(W * 0.24), Math.round(W * 0.26), Math.round(W * 0.24), W - Math.round(W * 0.24) - Math.round(W * 0.26) - Math.round(W * 0.24)];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Emergency Response Plan — Role Cards') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 0 }, children: [new TextRun({ text: 'EMERGENCY RESPONSE PLAN \u2014 ROLE CARDS', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: NAVY }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'FFFFFFB0' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: '334155' }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.issueDate}   |   Prepared: ${d.preparedBy}   |   Review: ${d.reviewDate}   |   Site: ${d.siteAddress}`, size: SM, font: 'Arial', color: 'cbd5e1' })] }),

        secHead('1.0', 'Emergency Contacts & Muster', A),
        new Table({ width: { size: W, type: WidthType.DXA }, rows: [
          ...d.communicationCascade.filter((_, i) => i < 4).map((cc, i) => {
            // Pair entries 2-per-row
            return null; // Will use info-table instead
          }).filter(Boolean),
        ].filter(r => r !== null) as TableRow[] }),
        infoTable([
          { label: '999', value: 'Fire / Ambulance / Police' },
          ...d.communicationCascade.slice(1, 5).map(cc => ({ label: cc.contact, value: `${cc.nameRole} — ${cc.number || 'TBC'}` })),
          { label: 'Primary Muster', value: d.primaryMuster },
          { label: 'Alarm', value: d.evacuationSignal },
        ], LBG, LC),

        ...roleCardSections,

        secHead('2.0', 'References & Sign-Off', A),
        dataTable([{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
          d.regulatoryReferences.slice(0, 5).map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]), A, ZB),
        h.spacer(80),
        signOff(['Prepared By', 'Emergency Controller'], A),
        footerLine(),
      ] }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T4 — MULTI-SCENARIO (teal, trigger→immediate→escalate→recover)
// ═════════════════════════════════════════════════════════════════════════════
function buildT4(d: ErpData): Document {
  const A = TEAL; const LBG = TEAL_BG; const LC = TEAL; const ZB = TEAL_BG;
  const flowCols = [Math.round(W * 0.14), Math.round(W * 0.38), Math.round(W * 0.22), W - Math.round(W * 0.14) - Math.round(W * 0.38) - Math.round(W * 0.22)];

  const scenarioSections: (Paragraph | Table)[] = [];
  for (const fs of d.flowScenarios) {
    scenarioSections.push(scenarioBand(fs.name, fs.severity));
    scenarioSections.push(new Table({ width: { size: W, type: WidthType.DXA }, rows: [
      new TableRow({ children: [hdrCell('Phase', flowCols[0], A), hdrCell('Actions', flowCols[1], A), hdrCell('Responsibility', flowCols[2], A), hdrCell('Equipment / Ref', flowCols[3], A)] }),
      new TableRow({ children: [txtCell('TRIGGER', flowCols[0], { bold: true, color: TEAL }), txtCell(fs.trigger, flowCols[1]), txtCell(fs.triggerResp, flowCols[2]), txtCell(fs.triggerEquip, flowCols[3])] }),
      new TableRow({ children: [txtCell('IMMEDIATE', flowCols[0], { bold: true, color: TEAL, bg: ZB }), txtCell(fs.immediate, flowCols[1], { bg: ZB }), txtCell(fs.immediateResp, flowCols[2], { bg: ZB }), txtCell(fs.immediateEquip, flowCols[3], { bg: ZB })] }),
      new TableRow({ children: [txtCell('ESCALATE', flowCols[0], { bold: true, color: TEAL }), txtCell(fs.escalate, flowCols[1]), txtCell(fs.escalateResp, flowCols[2]), txtCell(fs.escalateEquip, flowCols[3])] }),
      new TableRow({ children: [txtCell('RECOVER', flowCols[0], { bold: true, color: TEAL, bg: ZB }), txtCell(fs.recover, flowCols[1], { bg: ZB }), txtCell(fs.recoverResp, flowCols[2], { bg: ZB }), txtCell(fs.recoverEquip, flowCols[3], { bg: ZB })] }),
    ] }));
  }
  if (d.weatherConditions.length > 0) {
    scenarioSections.push(scenarioBand('Severe Weather', 'Medium'));
    scenarioSections.push(dataTable(
      [{ text: 'Condition', width: Math.round(W * 0.16) }, { text: 'Trigger', width: Math.round(W * 0.22) }, { text: 'Action', width: Math.round(W * 0.38) }, { text: 'Decision', width: W - Math.round(W * 0.16) - Math.round(W * 0.22) - Math.round(W * 0.38) }],
      d.weatherConditions.map(wc => [{ text: wc.condition }, { text: wc.trigger }, { text: wc.action }, { text: wc.decisionMaker }]),
      A, ZB));
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [{ properties: { ...h.PORTRAIT_SECTION }, headers: { default: h.ebroraHeader('Emergency Response Plan — Scenario Matrix') }, footers: { default: h.ebroraFooter() },
      children: [
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 0 }, children: [new TextRun({ text: 'EMERGENCY RESPONSE PLAN \u2014 SCENARIO MATRIX', bold: true, size: XL, font: 'Arial', color: h.WHITE })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL }, spacing: { after: 80 }, children: [new TextRun({ text: `${d.projectName} | ${d.documentRef}`, size: BODY, font: 'Arial', color: 'FFFFFFB0' })] }),
        new Paragraph({ shading: { type: ShadingType.CLEAR, fill: TEAL_DARK }, spacing: { after: 60 }, children: [new TextRun({ text: `Date: ${d.issueDate}   |   Prepared: ${d.preparedBy}   |   Review: ${d.reviewDate}   |   Client: ${d.client}`, size: SM, font: 'Arial', color: 'ccfbf1' })] }),

        secHead('1.0', 'Emergency Contacts & Muster', A),
        infoTable([
          ...d.communicationCascade.slice(0, 4).map(cc => ({ label: cc.contact, value: `${cc.nameRole} — ${cc.number || 'TBC'}` })),
          { label: 'Primary Muster', value: `${d.primaryMuster}. Alarm: ${d.evacuationSignal}` },
        ], LBG, LC),

        secHead('2.0', 'Scenario Response Flowcharts', A),
        ...scenarioSections,

        secHead('3.0', 'Emergency Equipment', A),
        dataTable(
          [{ text: 'Equipment', width: Math.round(W * 0.28) }, { text: 'Location', width: Math.round(W * 0.30) }, { text: 'Inspection', width: W - Math.round(W * 0.28) - Math.round(W * 0.30) }],
          d.equipmentItems.map(ei => [{ text: ei.equipment }, { text: ei.location }, { text: ei.inspection }]),
          A, ZB),

        secHead('4.0', 'Training & Drills', A),
        dataTable(
          [{ text: 'Drill', width: Math.round(W * 0.24) }, { text: 'Frequency', width: Math.round(W * 0.32) }, { text: 'Participants', width: W - Math.round(W * 0.24) - Math.round(W * 0.32) }],
          d.drillItems.map(di => [{ text: di.activity }, { text: di.frequency }, { text: di.participants }]),
          A, ZB),

        secHead('5.0', 'References', A),
        dataTable([{ text: 'Reference', width: Math.round(W * 0.38) }, { text: 'Description', width: W - Math.round(W * 0.38) }],
          d.regulatoryReferences.map(rr => [{ text: rr.reference, bold: true }, { text: rr.description }]), A, ZB),

        secHead('6.0', 'Sign-Off', A),
        signOff(['Prepared By', 'Emergency Controller', 'Client Representative'], A),
        footerLine(),
      ] }],
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
    case 'ebrora-standard': return buildT1(d);
    case 'quick-reference':  return buildT2(d);
    case 'role-based':       return buildT3(d);
    case 'multi-scenario':   return buildT4(d);
    default:                 return buildT1(d);
  }
}
