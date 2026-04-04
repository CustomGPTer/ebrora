// =============================================================================
// Request for Information — Multi-Template Engine (REBUILT)
// 3 templates matching HTML render library exactly.
//
// T1 — Formal RFI      (#1E40AF steel blue, Arial, 8 sections, period-numbered)
// T2 — Corporate RFI   (#1E3A5F navy, Cambria, 5 sections, 01-numbered)
// T3 — Quick Query      (#475569 slate, Arial, left-border headings, minimal)
// =============================================================================
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  PageBreak,
} from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import type { RfiTemplateSlug } from '@/lib/rfi/types';

// ── Layout ───────────────────────────────────────────────────────────────────
const W = h.A4_CONTENT_WIDTH;
const SM = 16; const BODY = 18; const LG = 22;
const CM = { top: 80, bottom: 80, left: 120, right: 120 };
const thin = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdr = { top: thin, bottom: thin, left: thin, right: thin };
const ZEBRA = 'F2F2F2';

// ── Palette ──────────────────────────────────────────────────────────────────
interface Pal {
  accent: string; subtitleColor: string; labelBg: string;
  dark: string; mid: string; font: string;
}
const PAL: Record<RfiTemplateSlug, Pal> = {
  'formal-letter': { accent: '1E40AF', subtitleColor: '93C5FD', labelBg: 'EFF6FF', dark: '1E293B', mid: '64748B', font: 'Arial' },
  'corporate':     { accent: '1E3A5F', subtitleColor: '93C5FD', labelBg: 'F1F5F9', dark: '1E293B', mid: '64748B', font: 'Cambria' },
  'concise':       { accent: '475569', subtitleColor: 'CBD5E1', labelBg: 'F8FAFC', dark: '334155', mid: '94A3B8', font: 'Arial' },
};

// ── Data extraction ──────────────────────────────────────────────────────────
interface RfiData {
  documentRef: string; rfiDate: string; requiredResponseDate: string;
  raisedBy: string; directedTo: string;
  projectName: string; projectAddress: string; contractReference: string;
  rfiSubject: string; urgencyNote: string;
  querySummary: string; background: string;
  detailedQuestions: Array<{ question: string }>;
  relevantDocuments: Array<{ documentType: string; reference: string; revision: string; title: string; relevance: string }>;
  proposedSolution: string;
  programmeImplication: { activitiesAtRisk: Array<{ activity: string; plannedStart: string; impact: string }>; programmeNarrative: string };
  impactOfNonResponse: string;
  contractualReference: string; responseFormat: string;
  distribution: string[];
}

function extract(c: any): RfiData {
  const d = c || {};
  const safe = (v: any) => (typeof v === 'string' ? v : '') || '';
  const safeArr = (v: any) => (Array.isArray(v) ? v : []);

  // Handle detailedQuestion as either string (split by numbered questions) or array
  let questions: Array<{ question: string }> = [];
  if (Array.isArray(d.detailedQuestions)) {
    questions = d.detailedQuestions.map((q: any) => ({ question: typeof q === 'string' ? q : safe(q.question) }));
  } else if (typeof d.detailedQuestion === 'string' && d.detailedQuestion) {
    // Split numbered questions: "1. ...\n2. ...\n3. ..." or treat as single question
    const qText = d.detailedQuestion;
    const numbered = qText.split(/\n(?=\d+\.\s)/).filter(Boolean);
    if (numbered.length > 1) {
      questions = numbered.map((q: string) => ({ question: q.replace(/^\d+\.\s*/, '').trim() }));
    } else {
      questions = [{ question: qText }];
    }
  }

  // Handle relevantDocuments as array of objects or strings
  let docs: Array<{ documentType: string; reference: string; revision: string; title: string; relevance: string }> = [];
  const rawDocs = safeArr(d.relevantDocuments);
  docs = rawDocs.map((doc: any) => {
    if (typeof doc === 'string') return { documentType: '', reference: doc, revision: '', title: '', relevance: '' };
    return {
      documentType: safe(doc.documentType || doc.type),
      reference: safe(doc.reference), revision: safe(doc.revision || doc.rev),
      title: safe(doc.title), relevance: safe(doc.relevance),
    };
  });

  // Handle programmeImplication as object or string
  const pi = d.programmeImplication || {};
  let activitiesAtRisk: Array<{ activity: string; plannedStart: string; impact: string }> = [];
  if (Array.isArray(pi.activitiesAtRisk)) {
    activitiesAtRisk = pi.activitiesAtRisk.map((a: any) => {
      if (typeof a === 'string') return { activity: a, plannedStart: '', impact: '' };
      return { activity: safe(a.activity || a.name), plannedStart: safe(a.plannedStart || a.date), impact: safe(a.impact) };
    });
  }

  // Handle proposedSolution as string or object
  let proposedSolution = '';
  if (typeof d.proposedSolution === 'string') proposedSolution = d.proposedSolution;
  else if (d.proposedSolution?.description) proposedSolution = safe(d.proposedSolution.description);
  else if (d.proposedSolution?.proposed) proposedSolution = safe(d.proposedSolution.proposed);

  return {
    documentRef: safe(d.documentRef), rfiDate: safe(d.rfiDate),
    requiredResponseDate: safe(d.requiredResponseDate),
    raisedBy: safe(d.raisedBy), directedTo: safe(d.directedTo),
    projectName: safe(d.projectName), projectAddress: safe(d.projectAddress),
    contractReference: safe(d.contractReference || d.contractRef),
    rfiSubject: safe(d.rfiSubject), urgencyNote: safe(d.urgencyNote),
    querySummary: safe(d.querySummary), background: safe(d.background),
    detailedQuestions: questions, relevantDocuments: docs,
    proposedSolution,
    programmeImplication: {
      activitiesAtRisk,
      programmeNarrative: safe(pi.programmeNarrative || pi.narrative || (typeof d.programmeImplication === 'string' ? d.programmeImplication : '')),
    },
    impactOfNonResponse: safe(d.impactOfNonResponse),
    contractualReference: safe(d.contractualReference),
    responseFormat: safe(d.responseFormat),
    distribution: safeArr(d.distribution).map((s: any) => safe(s)),
  };
}

// ── Shared Helpers ───────────────────────────────────────────────────────────
function gap(size = 200): Paragraph { return new Paragraph({ spacing: { after: size }, children: [] }); }

function proseParas(p: Pal, text: string): Paragraph[] {
  return (text || '').split(/\n\n?/).filter(Boolean).map(para =>
    new Paragraph({ spacing: { after: 120 }, children: [
      new TextRun({ text: para, font: p.font, size: BODY, color: p.dark }),
    ] })
  );
}

function hdrCell(text: string, width: number, bg: string, font: string): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: { fill: bg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: SM, font, color: h.WHITE }),
    ] })],
  });
}

function dCell(text: string, width: number, font: string, dark: string, opts?: { bold?: boolean; shade?: string }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, margins: CM, borders: bdr,
    shading: opts?.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: text || '\u2014', bold: opts?.bold, font, size: BODY, color: dark }),
    ] })],
  });
}

function accentInfoTable(p: Pal, rows: Array<{ label: string; value: string }>): Table {
  const lw = Math.round(W * 0.28); const vw = W - lw;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(r => new TableRow({ children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: CM, borders: bdr,
        shading: { fill: p.labelBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: r.label, bold: true, size: BODY, font: p.font, color: p.accent }),
        ] })] }),
      new TableCell({ width: { size: vw, type: WidthType.DXA }, margins: CM, borders: bdr,
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: r.value || '\u2014', size: BODY, font: p.font, color: p.dark }),
        ] })] }),
    ] })),
  });
}

// Period-numbered section bar for T1 (e.g. "1. QUERY SUMMARY")
function periodSectionBar(num: number, title: string, accent: string): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders: h.NO_BORDERS,
      shading: { fill: accent, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 140, right: 140 },
      children: [new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: `${num}.   ${title.toUpperCase()}`, bold: true, size: LG, font: 'Arial', color: h.WHITE }),
      ] })],
    })] })],
  });
}

// Left-border section heading for T3
function leftBorderHead(title: string, accent: string, font: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: accent, space: 6 } },
    indent: { left: 80 },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, font, size: LG, color: accent })],
  });
}

// Question box (accent left border, numbered label, question text)
function questionBox(p: Pal, label: string, text: string): Table {
  const borderAccent = { style: BorderStyle.SINGLE, size: 6, color: p.accent };
  const borderLight = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      borders: { top: borderLight, bottom: borderLight, left: borderAccent, right: borderLight },
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      children: [
        new Paragraph({ spacing: { after: 60 }, children: [
          new TextRun({ text: label, bold: true, size: BODY, font: p.font, color: p.accent }),
        ] }),
        new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text, size: BODY, font: p.font, color: p.dark }),
        ] }),
      ],
    })] })],
  });
}

// Response box (empty bordered box for handwritten response)
function responseBox(p: Pal, label: string, note?: string): Table {
  const borderAccent = { style: BorderStyle.SINGLE, size: 2, color: p.accent };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      borders: { top: borderAccent, bottom: borderAccent, left: borderAccent, right: borderAccent },
      margins: { top: 100, bottom: 200, left: 160, right: 120 },
      children: [
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: label, bold: true, size: SM, font: p.font, color: p.mid }),
        ] }),
        ...(note ? [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: note, size: SM - 2, font: p.font, color: p.mid, italics: true }),
        ] })] : []),
        // Empty space for handwritten response
        gap(400),
      ],
    })] })],
  });
}

// Header bar for T3 Quick Query (full-width accent bar with ref details)
function queryHeaderBar(p: Pal, d: RfiData): Table {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders: h.NO_BORDERS,
      shading: { fill: p.accent, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { after: 20 }, children: [
          new TextRun({ text: `QUICK QUERY  |  ${d.documentRef}  |  ${d.rfiDate}`, bold: true, size: BODY, font: p.font, color: h.WHITE }),
        ] }),
        new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: `${d.projectName} \u00B7 ${d.contractReference}`, size: SM - 2, font: p.font, color: p.subtitleColor }),
        ] }),
      ],
    })] })],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T1 — FORMAL RFI (#1E40AF, 8 sections, period-numbered "1. TITLE")
// ═════════════════════════════════════════════════════════════════════════════
function buildT1(d: RfiData): Document {
  const p = PAL['formal-letter'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['REQUEST FOR', 'INFORMATION'], `Formal RFI \u2014 ${d.rfiSubject}`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'RFI Reference', value: d.documentRef },
    { label: 'Date Raised', value: d.rfiDate },
    { label: 'Response Required By', value: d.requiredResponseDate },
    { label: 'Raised By', value: d.raisedBy },
    { label: 'Directed To', value: d.directedTo },
    { label: 'Project', value: d.projectName },
    { label: 'Contract', value: d.contractReference },
    { label: 'Site Address', value: d.projectAddress },
    { label: 'Subject', value: d.rfiSubject },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 1. QUERY SUMMARY
  children.push(periodSectionBar(1, 'QUERY SUMMARY', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.querySummary));
  children.push(gap(200));

  // 2. RELEVANT DOCUMENTS
  children.push(periodSectionBar(2, 'RELEVANT DOCUMENTS', p.accent));
  children.push(gap(80));
  if (d.relevantDocuments.length > 0) {
    const cw = [Math.round(W * 0.12), Math.round(W * 0.22), Math.round(W * 0.08), Math.round(W * 0.24)];
    cw.push(W - cw[0] - cw[1] - cw[2] - cw[3]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: cw,
      rows: [
        new TableRow({ children: [
          hdrCell('Type', cw[0], p.accent, p.font), hdrCell('Reference', cw[1], p.accent, p.font),
          hdrCell('Rev', cw[2], p.accent, p.font), hdrCell('Title', cw[3], p.accent, p.font),
          hdrCell('Relevance', cw[4], p.accent, p.font),
        ] }),
        ...d.relevantDocuments.map((doc, i) => {
          const shade = i % 2 === 0 ? ZEBRA : h.WHITE;
          return new TableRow({ children: [
            dCell(doc.documentType, cw[0], p.font, p.dark, { shade }),
            dCell(doc.reference, cw[1], p.font, p.dark, { shade, bold: true }),
            dCell(doc.revision, cw[2], p.font, p.dark, { shade }),
            dCell(doc.title, cw[3], p.font, p.dark, { shade }),
            dCell(doc.relevance, cw[4], p.font, p.dark, { shade }),
          ] });
        }),
      ],
    }));
  }
  children.push(gap(200));

  // 3. DETAILED QUESTIONS
  children.push(periodSectionBar(3, 'DETAILED QUESTIONS', p.accent));
  children.push(gap(80));
  d.detailedQuestions.forEach((q, i) => {
    children.push(questionBox(p, `Question ${i + 1}`, q.question));
    children.push(gap(80));
  });
  children.push(gap(120));

  // 4. BACKGROUND & CONTEXT
  children.push(periodSectionBar(4, 'BACKGROUND & CONTEXT', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.background));
  children.push(gap(200));

  // 5. PROPOSED SOLUTION
  if (d.proposedSolution) {
    children.push(periodSectionBar(5, 'PROPOSED SOLUTION', p.accent));
    children.push(gap(80));
    children.push(h.calloutBox(
      `Contractor's Proposal: ${d.proposedSolution}`,
      '2563EB', 'EFF6FF', '1E40AF', W,
    ));
    children.push(gap(200));
  }

  // 6. PROGRAMME IMPLICATION
  children.push(periodSectionBar(d.proposedSolution ? 6 : 5, 'PROGRAMME IMPLICATION', p.accent));
  children.push(gap(80));
  if (d.requiredResponseDate) {
    children.push(h.calloutBox(
      `Critical Path Impact: Response required by ${d.requiredResponseDate} to avoid programme delay.`,
      'DC2626', 'FEF2F2', '991B1B', W,
    ));
    children.push(gap(80));
  }
  if (d.programmeImplication.activitiesAtRisk.length > 0) {
    const acw = [Math.round(W * 0.40), Math.round(W * 0.20)];
    acw.push(W - acw[0] - acw[1]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: acw,
      rows: [
        new TableRow({ children: [
          hdrCell('Activity at Risk', acw[0], p.accent, p.font),
          hdrCell('Planned Start', acw[1], p.accent, p.font),
          hdrCell('Impact if Response Delayed', acw[2], p.accent, p.font),
        ] }),
        ...d.programmeImplication.activitiesAtRisk.map((a, i) => {
          const shade = i % 2 === 0 ? ZEBRA : h.WHITE;
          return new TableRow({ children: [
            dCell(a.activity, acw[0], p.font, p.dark, { shade, bold: true }),
            dCell(a.plannedStart, acw[1], p.font, p.dark, { shade }),
            dCell(a.impact, acw[2], p.font, p.dark, { shade }),
          ] });
        }),
      ],
    }));
    children.push(gap(80));
  }
  children.push(...proseParas(p, d.programmeImplication.programmeNarrative));
  children.push(gap(200));

  // 7. IMPACT OF NON-RESPONSE
  const sec7 = d.proposedSolution ? 7 : 6;
  children.push(periodSectionBar(sec7, 'IMPACT OF NON-RESPONSE', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.impactOfNonResponse));
  children.push(gap(200));

  // 8. DISTRIBUTION & RESPONSE
  children.push(periodSectionBar(sec7 + 1, 'DISTRIBUTION & RESPONSE', p.accent));
  children.push(gap(80));
  children.push(accentInfoTable(p, [
    { label: 'Contractual Basis', value: d.contractualReference },
    { label: 'Response Format', value: d.responseFormat },
    { label: 'Distribution', value: d.distribution.join(', ') },
  ]));
  children.push(gap(120));
  children.push(responseBox(p, "Designer's Response (to be completed)"));
  children.push(gap(120));
  children.push(h.signatureGrid(['Raised By', 'Response By'], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Request for Information', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Formal RFI', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T2 — CORPORATE RFI (#1E3A5F navy, Cambria, 01-numbered, 5 sections)
// ═════════════════════════════════════════════════════════════════════════════
function buildT2(d: RfiData): Document {
  const p = PAL['corporate'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['REQUEST FOR', 'INFORMATION'], `Corporate Format \u2014 ${d.rfiSubject}`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'RFI Reference', value: d.documentRef },
    { label: 'Date Raised', value: d.rfiDate },
    { label: 'Response Required', value: d.requiredResponseDate },
    { label: 'Raised By', value: d.raisedBy },
    { label: 'Directed To', value: d.directedTo },
    { label: 'Project', value: d.projectName },
    { label: 'Contract', value: d.contractReference },
    { label: 'Subject', value: d.rfiSubject },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 01 QUERY DESCRIPTION
  children.push(h.fullWidthSectionBar('01', 'QUERY DESCRIPTION', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.querySummary || d.background));
  children.push(gap(200));

  // 02 QUESTIONS
  children.push(h.fullWidthSectionBar('02', 'QUESTIONS', p.accent));
  children.push(gap(80));
  d.detailedQuestions.forEach((q, i) => {
    children.push(questionBox(p, `Q${i + 1}`, q.question));
    children.push(gap(80));
  });
  children.push(gap(120));

  // 03 RELEVANT DOCUMENTS
  children.push(h.fullWidthSectionBar('03', 'RELEVANT DOCUMENTS', p.accent));
  children.push(gap(80));
  if (d.relevantDocuments.length > 0) {
    const cw = [Math.round(W * 0.20), Math.round(W * 0.08), Math.round(W * 0.32)];
    cw.push(W - cw[0] - cw[1] - cw[2]);
    children.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: cw,
      rows: [
        new TableRow({ children: [
          hdrCell('Reference', cw[0], p.accent, p.font), hdrCell('Rev', cw[1], p.accent, p.font),
          hdrCell('Title', cw[2], p.accent, p.font), hdrCell('Relevance', cw[3], p.accent, p.font),
        ] }),
        ...d.relevantDocuments.map((doc, i) => {
          const shade = i % 2 === 0 ? ZEBRA : h.WHITE;
          return new TableRow({ children: [
            dCell(doc.reference, cw[0], p.font, p.dark, { shade, bold: true }),
            dCell(doc.revision, cw[1], p.font, p.dark, { shade }),
            dCell(doc.title, cw[2], p.font, p.dark, { shade }),
            dCell(doc.relevance, cw[3], p.font, p.dark, { shade }),
          ] });
        }),
      ],
    }));
  }
  children.push(gap(200));

  // 04 PROGRAMME IMPACT
  children.push(h.fullWidthSectionBar('04', 'PROGRAMME IMPACT', p.accent));
  children.push(gap(80));
  children.push(...proseParas(p, d.programmeImplication.programmeNarrative || d.impactOfNonResponse));
  children.push(gap(200));

  // 05 RESPONSE REQUIRED
  children.push(h.fullWidthSectionBar('05', 'RESPONSE REQUIRED', p.accent));
  children.push(gap(80));
  children.push(responseBox(p, "Designer's Response", d.responseFormat ? `Please respond in the following format: ${d.responseFormat}` : undefined));
  children.push(gap(120));
  children.push(h.signatureGrid(['Raised By', 'Response By'], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Request for Information', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Corporate', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// T3 — QUICK QUERY (#475569 slate, minimal, left-border headings)
// ═════════════════════════════════════════════════════════════════════════════
function buildT3(d: RfiData): Document {
  const p = PAL['concise'];
  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(h.coverBlock(['QUICK QUERY'], `Urgent RFI \u2014 ${d.rfiSubject}`, p.accent, p.subtitleColor));
  children.push(gap(300));
  children.push(h.projectNameBar(d.projectName, p.accent));
  children.push(gap(200));
  children.push(h.coverInfoTable([
    { label: 'Reference', value: d.documentRef },
    { label: 'Date', value: d.rfiDate },
    { label: 'Response Required', value: d.requiredResponseDate },
    { label: 'From', value: d.raisedBy },
    { label: 'To', value: d.directedTo },
    { label: 'Project', value: d.projectName },
  ], p.accent, W));
  children.push(gap(200));
  children.push(h.coverFooterLine());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Header bar
  children.push(queryHeaderBar(p, d));
  children.push(gap(120));

  // Red urgency callout
  if (d.urgencyNote || d.requiredResponseDate) {
    children.push(h.calloutBox(
      `URGENT \u2014 Response required by ${d.requiredResponseDate}. ${d.urgencyNote}`,
      'DC2626', 'FEF2F2', '991B1B', W,
    ));
    children.push(gap(200));
  }

  // THE QUESTION
  children.push(leftBorderHead("THE QUESTION", p.accent, p.font));
  // Single prominent question box
  const mainQuestion = d.detailedQuestions.map(q => q.question).join('\n\n');
  const qBorder = { style: BorderStyle.SINGLE, size: 6, color: p.accent };
  const qBorderLight = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  children.push(new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      borders: { top: qBorderLight, bottom: qBorderLight, left: qBorder, right: qBorderLight },
      margins: { top: 120, bottom: 120, left: 180, right: 140 },
      children: proseParas(p, mainQuestion).length > 0 ? proseParas(p, mainQuestion) : [gap(100)],
    })] })],
  }));
  children.push(gap(200));

  // REFERENCE
  children.push(leftBorderHead("REFERENCE", p.accent, p.font));
  if (d.relevantDocuments.length > 0) {
    children.push(accentInfoTable(p, d.relevantDocuments.map(doc => ({
      label: doc.documentType || 'Drawing',
      value: `${doc.reference}${doc.revision ? ' Rev ' + doc.revision : ''} \u2014 ${doc.title}${doc.relevance ? ' (' + doc.relevance + ')' : ''}`,
    }))));
  }
  children.push(gap(200));

  // WHY IT'S URGENT
  children.push(leftBorderHead("WHY IT'S URGENT", p.accent, p.font));
  children.push(...proseParas(p, d.programmeImplication.programmeNarrative || d.impactOfNonResponse));
  children.push(gap(200));

  // RESPONSE
  children.push(leftBorderHead("RESPONSE", p.accent, p.font));
  children.push(responseBox(p, "Designer's Response"));
  children.push(gap(120));
  children.push(h.signatureGrid(['Raised By', 'Response By'], p.accent, W));
  children.push(gap(200));
  children.push(...h.endMark(p.accent));

  return new Document({
    styles: { default: { document: { run: { font: p.font, size: BODY, color: p.dark } } } },
    sections: [{
      properties: { ...h.PORTRAIT_SECTION },
      headers: { default: h.accentHeader('Quick Query', p.accent) },
      footers: { default: h.accentFooter(d.documentRef, 'Quick Query', p.accent) },
      children,
    }],
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildRfiTemplateDocument(
  content: any,
  templateSlug: RfiTemplateSlug,
): Promise<Document> {
  const d = extract(content);
  switch (templateSlug) {
    case 'formal-letter': return buildT1(d);
    case 'corporate':     return buildT2(d);
    case 'concise':       return buildT3(d);
    default:              return buildT1(d);
  }
}
