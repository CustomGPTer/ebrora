// =============================================================================
// CDM Compliance Checker — Premium Template
// =============================================================================
import { Document } from 'docx';
import * as h from '@/lib/rams/docx-helpers';
import * as p from './premium-template-engine';

const ACCENT = '7C3AED';
const W = h.A4_CONTENT_WIDTH;

export async function buildCdmCheckerDocument(c: any): Promise<Document> {
  const cover = p.buildCoverPageChildren({
    documentLabel: 'CDM 2015 Compliance Gap Analysis',
    accentHex: ACCENT,
    documentRef: c.documentRef,
    projectName: c.projectName,
    siteAddress: c.siteAddress,
    preparedBy: c.assessedBy,
    date: c.assessmentDate,
    reviewDate: c.reviewDate,
    classification: 'HEALTH & SAFETY COMPLIANCE DOCUMENT',
    extraFields: [
      ['Overall Rating', c.overallComplianceRating || ''],
      ['CDM Standard', 'Construction (Design and Management) Regulations 2015'],
      ['HSE Reference', 'L153 — Managing health and safety in construction'],
    ],
  });

  // ── Section 1: Project Overview & Notification ───────────────────────────
  const s1: any[] = [
    ...p.proseSection('Project Overview', c.projectOverview, ACCENT),
    ...p.infoSection('F10 Notification Status', [
      { label: 'F10 Required',     value: c.notificationStatus?.f10Required     || '' },
      { label: 'F10 Submitted',    value: c.notificationStatus?.f10Submitted    || '' },
      { label: 'F10 Reference',    value: c.notificationStatus?.f10Reference    || '' },
    ], ACCENT),
    ...h.prose(c.notificationStatus?.notificationAssessment || ''),
    h.spacer(120),
    ...p.infoSection('Appointed Duty Holders', [
      { label: 'Client',                     value: `${c.dutyHolders?.client?.name || ''} — ${c.dutyHolders?.client?.type || ''}` },
      { label: 'Client Duties Acknowledged', value: c.dutyHolders?.client?.cdmDutiesAcknowledged || '' },
      { label: 'Principal Designer',         value: `${c.dutyHolders?.principalDesigner?.name || ''} — Formally appointed: ${c.dutyHolders?.principalDesigner?.formallyAppointed || ''}` },
      { label: 'PD Written Appointment',     value: c.dutyHolders?.principalDesigner?.writtenAppointment || '' },
      { label: 'Principal Contractor',       value: `${c.dutyHolders?.principalContractor?.name || ''} — Formally appointed: ${c.dutyHolders?.principalContractor?.formallyAppointed || ''}` },
    ], ACCENT),
  ];

  // ── Section 2: Duty Holder Assessments ───────────────────────────────────
  const s2: any[] = [];
  for (const dh of (c.dutyHolderAssessments || [])) {
    s2.push(p.sectionBand(dh.dutyHolder, ACCENT));
    s2.push(h.infoTable([
      { label: 'Overall Compliance', value: dh.overallCompliance || '' },
    ], W));
    s2.push(h.spacer(80));
    if (dh.duties?.length) {
      s2.push(...p.dataTableSection('', dh.duties, [
        { key: 'duty',           label: 'Duty',           width: Math.floor(W * 0.22) },
        { key: 'regulation',     label: 'Regulation',     width: Math.floor(W * 0.10) },
        { key: 'status',         label: 'Status',         width: Math.floor(W * 0.14) },
        { key: 'finding',        label: 'Finding',        width: Math.floor(W * 0.27) },
        { key: 'recommendation', label: 'Recommendation', width: W - Math.floor(W * 0.22) - Math.floor(W * 0.10) - Math.floor(W * 0.14) - Math.floor(W * 0.27) },
      ], ACCENT));
    }
    s2.push(h.spacer(160));
  }

  // ── Section 3: Key Documents & Gaps ─────────────────────────────────────
  const docs = c.keyDocumentsAssessment || {};
  const s3: any[] = [
    p.sectionBand('Pre-Construction Information', ACCENT),
    h.infoTable([
      { label: 'Status',      value: docs.preConstructionInformation?.status      || '' },
      { label: 'Distributed', value: docs.preConstructionInformation?.distributed || '' },
    ], W),
    h.spacer(60),
    ...h.prose(docs.preConstructionInformation?.finding || ''),
    ...p.bulletListSection('Gaps Identified', docs.preConstructionInformation?.gaps || [], ACCENT),

    p.sectionBand('Construction Phase Plan', ACCENT),
    h.infoTable([
      { label: 'Status',       value: docs.constructionPhasePlan?.status      || '' },
      { label: 'Site-Specific',value: docs.constructionPhasePlan?.siteSpecific || '' },
    ], W),
    h.spacer(60),
    ...h.prose(docs.constructionPhasePlan?.finding || ''),
    ...p.bulletListSection('Gaps Identified', docs.constructionPhasePlan?.gaps || [], ACCENT),

    p.sectionBand('Health & Safety File', ACCENT),
    h.infoTable([
      { label: 'Status',             value: docs.healthAndSafetyFile?.status          || '' },
      { label: 'Responsible Party',  value: docs.healthAndSafetyFile?.responsibleParty || '' },
    ], W),
    h.spacer(60),
    ...h.prose(docs.healthAndSafetyFile?.finding || ''),

    p.sectionBand('Identified Compliance Gaps', ACCENT),
    ...p.dataTableSection('', c.identifiedGaps || [], [
      { key: 'priority',             label: 'Priority',      width: Math.floor(W * 0.12) },
      { key: 'regulation',           label: 'Regulation',    width: Math.floor(W * 0.14) },
      { key: 'gap',                  label: 'Gap',           width: Math.floor(W * 0.30) },
      { key: 'potentialConsequence', label: 'Consequence',   width: Math.floor(W * 0.22) },
      { key: 'recommendation',       label: 'Recommendation',width: W - Math.floor(W * 0.12) - Math.floor(W * 0.14) - Math.floor(W * 0.30) - Math.floor(W * 0.22) },
    ], ACCENT),
  ];

  // ── Section 4: Narrative & Roadmap ───────────────────────────────────────
  const s4: any[] = [
    ...p.proseSection('Narrative Gap Analysis', c.narrativeSummary, ACCENT),
    p.sectionBand('Compliance Improvement Roadmap', ACCENT),
    ...p.dataTableSection('', c.complianceRoadmap || [], [
      { key: 'action',      label: 'Action',      width: Math.floor(W * 0.40) },
      { key: 'responsible', label: 'Responsible', width: Math.floor(W * 0.20) },
      { key: 'priority',    label: 'Priority',    width: Math.floor(W * 0.20) },
      { key: 'targetDate',  label: 'Target Date', width: W - Math.floor(W * 0.40) - Math.floor(W * 0.20) - Math.floor(W * 0.20) },
    ], ACCENT),
    ...p.signatureBlock([
      { role: 'Prepared By',  name: c.assessedBy || '' },
      { role: 'Reviewed By',  name: '' },
      { role: 'Approved By',  name: '' },
    ], ACCENT),
  ];

  return p.buildPremiumDocument(
    { documentLabel: 'CDM 2015 Compliance Gap Analysis', accentHex: ACCENT, documentRef: c.documentRef, projectName: c.projectName, date: c.assessmentDate },
    [s1, s2, s3, s4]
  );
}
