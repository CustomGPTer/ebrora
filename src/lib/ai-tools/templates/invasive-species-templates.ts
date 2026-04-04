// =============================================================================
// INVASIVE SPECIES ASSESSMENT — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Ecological Report    (dark green #166534, Arial, formal ~3pp)
// T2 — Site Management Plan (teal #0D9488, Calibri, practical controls ~2pp)
// T3 — Briefing Note        (slate #475569, Arial, awareness ~2pp)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { InvasiveTemplateSlug } from '@/lib/invasive/types';

const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;

const DK_GREEN = '166534'; const DK_GREEN_SUB = '86EFAC';
const TEAL = '0D9488'; const TEAL_SUB = '99F6E4';
const SLATE = '475569'; const SLATE_SUB = 'CBD5E1';
const RED = 'DC2626'; const AMBER = 'D97706'; const GREEN = '059669';
const GREY = '6B7280'; const ZEBRA = 'F5F5F5';

// ── Data Interface ────────────────────────────────────────────────────────────
interface IsaData {
  documentRef: string; planDate: string; reviewDate: string;
  preparedBy: string; ecologist: string; projectName: string; siteAddress: string;
  client: string; principalContractor: string;
  species: { commonName: string; latinName: string; schedule: string; identificationFeatures: string };
  extent: { area: string; density: string; maturity: string; rhizomeSpread: string; locationOnSite: string; proximityToWatercourse: string };
  stands: Array<{ id: string; species: string; gridRef: string; area: string; distance: string; growthStage: string; condition: string }>;
  legalFramework: string;
  risks: Array<{ risk: string; description: string; likelihood: string; consequence: string; rating: string }>;
  methodology: string; treatmentProgramme: string;
  controlMeasures: Array<{ measure: string; timing: string; responsible: string; cost: string }>;
  exclusionControls: Array<{ control: string; detail: string; who: string; frequency: string }>;
  biosecurity: string; disposalRoute: string;
  monitoring: Array<{ activity: string; frequency: string; record: string }>;
  completionCriteria: string; operativeBriefing: string;
  regulatoryRefs: string; additionalNotes: string;
  [key: string]: any;
}

function extract(c: any): IsaData {
  const s = (k: string, fb = '') => (typeof c?.[k] === 'string' ? c[k] : fb);
  const a = (k: string) => (Array.isArray(c?.[k]) ? c[k] : []);
  const si = c?.speciesIdentification || {};
  const ie = c?.infestationExtent || {};
  const tm = c?.treatmentMethodology || {};
  const dr = c?.disposalRoute || {};
  return {
    documentRef: s('documentRef', 'ISA-001'), planDate: s('planDate') || s('surveyDate'),
    reviewDate: s('reviewDate'), preparedBy: s('preparedBy'), ecologist: s('ecologist'),
    projectName: s('projectName'), siteAddress: s('siteAddress'),
    client: s('client'), principalContractor: s('principalContractor'),
    species: { commonName: si.commonName || '', latinName: si.latinName || '', schedule: si.schedule || '', identificationFeatures: si.identificationFeatures || '' },
    extent: { area: ie.area || '', density: ie.density || '', maturity: ie.maturity || '', rhizomeSpread: ie.rhizomeSpread || '', locationOnSite: ie.locationOnSite || '', proximityToWatercourse: ie.proximityToWatercourse || '' },
    stands: a('stands').length > 0 ? a('stands') : (a('standLocations') || []),
    legalFramework: s('legalFramework'),
    risks: a('risks').length > 0 ? a('risks') : a('riskAssessment'),
    methodology: tm.methodology || s('treatmentMethodology'),
    treatmentProgramme: tm.programme || s('treatmentProgramme'),
    controlMeasures: a('controlMeasures'),
    exclusionControls: a('exclusionControls').length > 0 ? a('exclusionControls') : a('siteControls'),
    biosecurity: s('biosecurityProtocol') || s('biosecurity'),
    disposalRoute: typeof dr === 'string' ? dr : `${dr.method || ''} — ${dr.facility || ''}. ${dr.wasteClassification || ''} ${dr.transferNotes || ''}`,
    monitoring: (a('monitoringSchedule').length > 0 ? a('monitoringSchedule') : a('monitoring')).map((m: any) => ({ activity: m.activity || m.visit || '', frequency: m.frequency || m.date || '', record: m.record || m.purpose || '' })),
    completionCriteria: s('completionCriteria'), operativeBriefing: s('operativeBriefing'),
    regulatoryRefs: s('regulatoryReferences') || (a('regulatoryReferences').map((r: any) => `${r.reference} — ${r.description}`).join('. ')),
    additionalNotes: s('additionalNotes'),
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function hdrCell(text: string, width: number, accent: string): TableCell {
  return h.headerCell(text, width, { fillColor: accent, color: 'FFFFFF', fontSize: SM });
}
function txtCell(text: string, width: number, opts?: { bg?: string; bold?: boolean; color?: string }): TableCell {
  return h.dataCell(text, width, { fillColor: opts?.bg, bold: opts?.bold, fontSize: SM, color: opts?.color });
}
function ragCell(text: string, width: number): TableCell {
  const low = (text || '').toLowerCase();
  let bg = ZEBRA; let color = GREY;
  if (low.includes('high') || low.includes('red')) { bg = 'FEF2F2'; color = RED; }
  else if (low.includes('medium') || low.includes('amber')) { bg = 'FFFBEB'; color = AMBER; }
  else if (low.includes('low') || low.includes('green')) { bg = 'D1FAE5'; color = GREEN; }
  return h.dataCell(text, width, { fillColor: bg, color, fontSize: SM, bold: true });
}
function dataTable(accent: string, headers: { text: string; width: number }[], rows: any[][], ragCols: number[] = []): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: headers.map(hh => hh.width),
    rows: [
      new TableRow({ children: headers.map(hh => hdrCell(hh.text, hh.width, accent)) }),
      ...rows.map((cells, ri) => new TableRow({
        children: cells.map((cell, ci) =>
          ragCols.includes(ci) ? ragCell(String(cell || ''), headers[ci].width) :
          txtCell(String(cell || ''), headers[ci].width, { bg: ri % 2 === 1 ? ZEBRA : undefined })
        ),
      })),
    ],
  });
}
function cols(ratios: number[]): number[] {
  const w = ratios.map(r => Math.round(W * r));
  w[w.length - 1] = W - w.slice(0, -1).reduce((a2, b) => a2 + b, 0);
  return w;
}
// Tick/cross table for T3 briefing note
function tickTable(accent: string, symbol: string, symbolColor: string, headerText: string, items: string[]): Table {
  const cw = cols([0.05, 0.95]);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [cw[0], cw[1]],
    rows: [
      new TableRow({ children: [hdrCell(symbol, cw[0], accent), hdrCell(headerText, cw[1], accent)] }),
      ...items.map((item, i) => new TableRow({ children: [
        txtCell(symbol, cw[0], { bg: i % 2 === 1 ? ZEBRA : undefined, color: symbolColor, bold: true }),
        txtCell(item, cw[1], { bg: i % 2 === 1 ? ZEBRA : undefined }),
      ] })),
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — ECOLOGICAL REPORT (Dark Green #166534, Arial)
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: IsaData): Document {
  const A = DK_GREEN;
  const hdr2 = h.accentHeader('Invasive Species Ecological Assessment', A);
  const ftr = h.accentFooter(d.documentRef, 'Ecological Report', A);
  const standCols = cols([0.08, 0.16, 0.14, 0.08, 0.18, 0.16, 0.20]);
  const riskCols = cols([0.20, 0.36, 0.14, 0.14, 0.16]);
  const ctrlCols = cols([0.34, 0.22, 0.22, 0.22]);

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['INVASIVE SPECIES', 'ECOLOGICAL ASSESSMENT'], `${d.projectName || ''} — ${d.species.commonName || 'Species'} Survey`, A, DK_GREEN_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Document Reference', value: d.documentRef },
            { label: 'Survey Date', value: d.planDate },
            { label: 'Review Date', value: d.reviewDate },
            { label: 'Surveyed By', value: d.ecologist },
            { label: 'Project', value: d.projectName },
            { label: 'Site Address', value: d.siteAddress },
            { label: 'Species Identified', value: `${d.species.latinName} (${d.species.commonName}) — ${d.species.schedule}` },
            { label: 'Extent', value: `${d.stands.length} stands, ${d.extent.area} along ${d.extent.locationOnSite}` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', 'SURVEY METHODOLOGY & SCOPE', A), h.spacer(80),
          ...h.richBodyText(d.methodology || d.additionalNotes || ''),

          h.spacer(80), h.fullWidthSectionBar('02', 'SPECIES IDENTIFICATION & DISTRIBUTION', A), h.spacer(80),
          ...(d.stands.length > 0 ? [dataTable(A,
            [{ text: 'STAND', width: standCols[0] }, { text: 'SPECIES', width: standCols[1] }, { text: 'GRID REF', width: standCols[2] }, { text: 'AREA', width: standCols[3] }, { text: 'DISTANCE TO WORKS', width: standCols[4] }, { text: 'GROWTH STAGE', width: standCols[5] }, { text: 'CONDITION', width: standCols[6] }],
            d.stands.map(st => [st.id || '', st.species || d.species.latinName, st.gridRef || '', st.area || '', st.distance || '', st.growthStage || '', st.condition || '']),
          )] : []),
          h.spacer(60),
          h.calloutBox(
            d.legalFramework || `It is an offence under Section 14(2) of the Wildlife & Countryside Act 1981 to plant or otherwise cause ${d.species.commonName || 'invasive species'} to grow in the wild. Any excavated soil containing viable material is classified as controlled waste.`,
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: `\u26A0 LEGAL WARNING — Wildlife & Countryside Act 1981 (Schedule 9):` }
          ),

          h.spacer(80), h.fullWidthSectionBar('03', 'RISK ASSESSMENT — PROXIMITY TO WORKS', A), h.spacer(80),
          ...(d.risks.length > 0 ? [dataTable(A,
            [{ text: 'RISK', width: riskCols[0] }, { text: 'DESCRIPTION', width: riskCols[1] }, { text: 'LIKELIHOOD', width: riskCols[2] }, { text: 'CONSEQUENCE', width: riskCols[3] }, { text: 'RATING', width: riskCols[4] }],
            d.risks.map(r => [r.risk || '', r.description || '', r.likelihood || '', r.consequence || '', r.rating || '']),
            [2, 3, 4]
          )] : []),

          h.spacer(80), h.fullWidthSectionBar('04', 'RECOMMENDED MANAGEMENT STRATEGY', A), h.spacer(80),
          ...h.richBodyText(d.methodology || ''),
          h.spacer(40),
          ...(d.controlMeasures.length > 0 ? [dataTable(A,
            [{ text: 'CONTROL MEASURE', width: ctrlCols[0] }, { text: 'TIMING', width: ctrlCols[1] }, { text: 'RESPONSIBLE', width: ctrlCols[2] }, { text: 'COST ESTIMATE', width: ctrlCols[3] }],
            d.controlMeasures.map(cm => [cm.measure || '', cm.timing || '', cm.responsible || '', cm.cost || '']),
          )] : []),

          h.spacer(80), h.fullWidthSectionBar('05', 'REGULATORY REFERENCES', A), h.spacer(80),
          h.bodyText(d.regulatoryRefs || '', SM),

          h.spacer(80),
          h.signatureGrid(['Surveyed By', 'Reviewed By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — SITE MANAGEMENT PLAN (Teal #0D9488, Calibri)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: IsaData): Document {
  const A = TEAL;
  const hdr2 = h.accentHeader('Invasive Species Site Management Plan', A);
  const ftr = h.accentFooter(d.documentRef, 'Site Management', A);
  const ctrlCols = cols([0.18, 0.38, 0.18, 0.26]);
  const monCols = cols([0.40, 0.30, 0.30]);

  return new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['INVASIVE SPECIES', 'SITE MANAGEMENT PLAN'], `${d.species.commonName || 'Species'} Controls — ${d.projectName || ''}`, A, TEAL_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Project', value: d.projectName },
            { label: 'Contractor', value: d.principalContractor },
            { label: 'Species', value: `${d.species.commonName} (${d.stands.length} stands, ${d.extent.area} total)` },
            { label: 'Closest Stand', value: d.stands.length > 0 ? `${d.stands[d.stands.length - 1]?.id || ''}: ${d.stands[d.stands.length - 1]?.distance || ''}` : '' },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('01', `SITE RULES — ${(d.species.commonName || 'INVASIVE SPECIES').toUpperCase()}`, A), h.spacer(80),
          h.calloutBox(
            `${d.stands.length} stands of ${d.species.commonName || 'invasive species'} are present along the ${d.extent.locationOnSite || 'site boundary'}. It is a criminal offence to cause ${d.species.commonName || 'this species'} to spread (unlimited fine + up to 2 years imprisonment). Do NOT enter fenced exclusion zones. Do NOT move soil from within the contamination zone without authorisation. Report any suspected new growth to the Site Manager immediately.`,
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: '\u26A0 ALL PERSONNEL:' }
          ),

          h.spacer(80), h.fullWidthSectionBar('02', 'EXCLUSION ZONES & CONTROLS', A), h.spacer(80),
          ...(d.exclusionControls.length > 0 ? [dataTable(A,
            [{ text: 'CONTROL', width: ctrlCols[0] }, { text: 'DETAIL', width: ctrlCols[1] }, { text: 'WHO', width: ctrlCols[2] }, { text: 'FREQUENCY', width: ctrlCols[3] }],
            d.exclusionControls.map(ec => [ec.control || '', ec.detail || '', ec.who || '', ec.frequency || '']),
          )] : []),

          h.spacer(80), h.fullWidthSectionBar('03', 'TOOLBOX TALK REQUIREMENTS', A), h.spacer(80),
          ...h.richBodyText(d.operativeBriefing || ''),

          h.spacer(80), h.fullWidthSectionBar('04', 'MONITORING & REPORTING', A), h.spacer(80),
          ...(d.monitoring.length > 0 ? [dataTable(A,
            [{ text: 'ACTIVITY', width: monCols[0] }, { text: 'FREQUENCY', width: monCols[1] }, { text: 'RECORD', width: monCols[2] }],
            d.monitoring.map(m => [m.activity || '', m.frequency || '', m.record || '']),
          )] : []),
          h.spacer(60),
          h.calloutBox(
            `Any suspected new growth must be reported to the Environmental Manager within 24 hours. New growth within the works area may require work stoppage pending specialist assessment.`,
            A, 'F0FDFA', '134E4A', W, { boldPrefix: 'Reporting:' }
          ),

          h.spacer(80),
          h.signatureGrid(['Prepared By', 'Approved By'], A, W),
          h.spacer(80), ...h.endMark(A),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — BRIEFING NOTE (Slate #475569, Arial)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: IsaData): Document {
  const A = SLATE;
  const hdr2 = h.accentHeader('Invasive Species Briefing Note', A);
  const ftr = h.accentFooter(d.documentRef, 'Briefing Note', A);

  // Build do/don't items from operative briefing or defaults
  const doItems = [
    `STAY OUT of the fenced exclusion zones`,
    `WASH DOWN boots and vehicles at the jet-wash station when leaving contamination zones`,
    `REPORT any suspected new ${d.species.commonName || 'invasive species'} growth to the Site Manager immediately`,
    `SEGREGATE soil from within the contamination zone — stockpile on geomembrane, cover, label`,
  ];
  const dontItems = [
    `DO NOT cut, strim, mow, or flail any ${d.species.commonName || 'invasive species'} growth — fragmentation causes spread`,
    `DO NOT move soil from the contamination zone to ANY other location without authorisation`,
    `DO NOT enter the exclusion zones for any reason (including to retrieve tools or materials)`,
    `DO NOT dispose of ${d.species.commonName || 'invasive species'} material in general waste skips — it is controlled waste requiring licensed disposal`,
  ];

  return new Document({
    styles: { default: { document: { run: { font: 'Arial', size: BODY } } } },
    sections: [
      // Cover
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.coverBlock(['INVASIVE SPECIES', 'BRIEFING NOTE'], `${d.species.commonName || 'Species'} Awareness — All Site Personnel`, A, SLATE_SUB),
          h.spacer(200),
          h.coverInfoTable([
            { label: 'Reference', value: d.documentRef },
            { label: 'Date', value: d.planDate },
            { label: 'Site', value: d.projectName },
            { label: 'Audience', value: 'All site personnel, subcontractors, and visitors' },
            { label: 'Key Message', value: `${d.stands.length} stands of ${d.species.commonName || 'invasive species'} on site — DO NOT ENTER exclusion zones` },
          ], A, W),
          h.coverFooterLine(),
        ] },
      // Body
      { properties: { ...h.PORTRAIT_SECTION }, headers: { default: hdr2 }, footers: { default: ftr },
        children: [
          h.fullWidthSectionBar('', `WHAT IS ${(d.species.commonName || 'THIS SPECIES').toUpperCase()}?`, A), h.spacer(80),
          ...h.richBodyText(d.species.identificationFeatures || d.operativeBriefing || ''),

          h.spacer(80), h.fullWidthSectionBar('', 'HOW TO IDENTIFY IT', A), h.spacer(80),
          ...h.richBodyText(d.species.identificationFeatures || ''),

          h.spacer(80), h.fullWidthSectionBar('', 'WHAT YOU MUST DO', A), h.spacer(60),
          tickTable(A, '\u2713', GREEN, 'Action', doItems),

          h.spacer(80), h.fullWidthSectionBar('', 'WHAT YOU MUST NOT DO', RED), h.spacer(60),
          tickTable(RED, '\u2717', RED, 'Prohibited Action', dontItems),

          h.spacer(60),
          h.calloutBox(
            `Causing ${d.species.commonName || 'invasive species'} to spread — even accidentally — is a criminal offence under the Wildlife and Countryside Act 1981. This includes moving contaminated soil on boots, tyres, or in spoil. The penalty is an unlimited fine and/or up to 2 years imprisonment. If in doubt, STOP and ask.`,
            RED, 'FEF2F2', '7F1D1D', W, { boldPrefix: '\u26A0 LEGAL CONSEQUENCE:' }
          ),

          h.spacer(60),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
            new TextRun({ text: 'Briefing delivered by: __________________ ', bold: true, size: SM, font: 'Arial' }),
            new TextRun({ text: 'Date: ___/___/______ ', bold: true, size: SM, font: 'Arial' }),
            new TextRun({ text: 'Attendees: See attached sign-in sheet', bold: true, size: SM, font: 'Arial' }),
          ] }),

          // End mark
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: GREY, space: 8 } },
            children: [new TextRun({ text: '\u2014 Designed for printing and displaying at site induction point \u2014', size: SM, font: 'Arial', color: GREY, italics: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Generated by Ebrora \u2014 ebrora.com', size: SM, font: 'Arial', color: A, bold: true }),
          ] }),
        ] },
    ],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildInvasiveTemplateDocument(
  content: any,
  templateSlug: InvasiveTemplateSlug
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'ecological-report':  return buildT1(d);
    case 'site-management':    return buildT2(d);
    case 'briefing-note':      return buildT3(d);
    default:                   return buildT1(d);
  }
}
