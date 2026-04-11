// =============================================================================
// Contract Scope Risk Reviewer — Contract Data
// All NEC and JCT contract types with cascading sub-options.
// Used by the wizard to populate dropdowns.
// =============================================================================
import type {
  ContractFamily, NecContractType, NecMainOption,
  JctContractType, JctVariant, ReviewContext, UserRole, Sector,
} from './types';

// ── NEC Contract Types ───────────────────────────────────────────────────────
export interface NecContractOption {
  value: NecContractType;
  label: string;
  shortLabel: string;
  hasMainOption: boolean; // ECC + ECS + Target forms have main options A–F
}

export const NEC_CONTRACT_TYPES: NecContractOption[] = [
  { value: 'NEC4-ECC',  label: 'NEC4 Engineering and Construction Contract (ECC)',             shortLabel: 'NEC4 ECC',   hasMainOption: true },
  { value: 'NEC4-ECSC', label: 'NEC4 Engineering and Construction Short Contract (ECSC)',       shortLabel: 'NEC4 ECSC',  hasMainOption: false },
  { value: 'NEC4-ECS',  label: 'NEC4 Engineering and Construction Subcontract (ECS)',           shortLabel: 'NEC4 ECS',   hasMainOption: true },
  { value: 'NEC4-ECSS', label: 'NEC4 Engineering and Construction Short Subcontract (ECSS)',    shortLabel: 'NEC4 ECSS',  hasMainOption: false },
  { value: 'NEC4-PSC',  label: 'NEC4 Professional Services Contract (PSC)',                     shortLabel: 'NEC4 PSC',   hasMainOption: false },
  { value: 'NEC4-PSSC', label: 'NEC4 Professional Services Short Contract (PSSC)',              shortLabel: 'NEC4 PSSC',  hasMainOption: false },
  { value: 'NEC4-TSC',  label: 'NEC4 Term Service Contract (TSC)',                              shortLabel: 'NEC4 TSC',   hasMainOption: true },
  { value: 'NEC4-TSSC', label: 'NEC4 Term Service Short Contract (TSSC)',                       shortLabel: 'NEC4 TSSC',  hasMainOption: false },
  { value: 'NEC4-SC',   label: 'NEC4 Supply Contract (SC)',                                     shortLabel: 'NEC4 SC',    hasMainOption: false },
  { value: 'NEC4-SSC',  label: 'NEC4 Supply Short Contract (SSC)',                              shortLabel: 'NEC4 SSC',   hasMainOption: false },
  { value: 'NEC4-FC',   label: 'NEC4 Framework Contract (FC)',                                  shortLabel: 'NEC4 FC',    hasMainOption: false },
  { value: 'NEC3-ECC',  label: 'NEC3 Engineering and Construction Contract (ECC) — Legacy',     shortLabel: 'NEC3 ECC',   hasMainOption: true },
  { value: 'NEC3-ECSC', label: 'NEC3 Engineering and Construction Short Contract (ECSC) — Legacy', shortLabel: 'NEC3 ECSC', hasMainOption: false },
  { value: 'NEC3-ECS',  label: 'NEC3 Engineering and Construction Subcontract (ECS) — Legacy',  shortLabel: 'NEC3 ECS',   hasMainOption: true },
];

export const NEC_MAIN_OPTIONS: Array<{ value: NecMainOption; label: string }> = [
  { value: 'A', label: 'Option A — Priced contract with activity schedule' },
  { value: 'B', label: 'Option B — Priced contract with bill of quantities' },
  { value: 'C', label: 'Option C — Target contract with activity schedule' },
  { value: 'D', label: 'Option D — Target contract with bill of quantities' },
  { value: 'E', label: 'Option E — Cost reimbursable contract' },
  { value: 'F', label: 'Option F — Management contract' },
];

// ── JCT Contract Types ──────────────────────────────────────────────────────
export interface JctContractOption {
  value: JctContractType;
  label: string;
  shortLabel: string;
  variants: JctVariant[];
}

export const JCT_CONTRACT_TYPES: JctContractOption[] = [
  { value: 'JCT-SBC',    label: 'JCT Standard Building Contract (SBC)',                        shortLabel: 'JCT SBC',     variants: ['with-cdp', 'without-cdp', 'local-authorities'] },
  { value: 'JCT-SBC-Q',  label: 'JCT Standard Building Contract with Quantities (SBC/Q)',      shortLabel: 'JCT SBC/Q',   variants: ['with-cdp', 'without-cdp', 'local-authorities'] },
  { value: 'JCT-SBC-AQ', label: 'JCT Standard Building Contract without Quantities (SBC/AQ)',  shortLabel: 'JCT SBC/AQ',  variants: ['with-cdp', 'without-cdp'] },
  { value: 'JCT-SBC-XQ', label: 'JCT Standard Building Contract with Approximate Quantities',  shortLabel: 'JCT SBC/XQ',  variants: ['with-cdp', 'without-cdp'] },
  { value: 'JCT-IC',     label: 'JCT Intermediate Building Contract (IC)',                     shortLabel: 'JCT IC',      variants: ['standard'] },
  { value: 'JCT-ICD',    label: 'JCT Intermediate Building Contract with Contractor\'s Design (ICD)', shortLabel: 'JCT ICD', variants: ['standard'] },
  { value: 'JCT-MW',     label: 'JCT Minor Works Building Contract (MW)',                      shortLabel: 'JCT MW',      variants: ['standard'] },
  { value: 'JCT-MWD',    label: 'JCT Minor Works Building Contract with Contractor\'s Design (MWD)', shortLabel: 'JCT MWD', variants: ['standard'] },
  { value: 'JCT-DB',     label: 'JCT Design and Build Contract (DB)',                          shortLabel: 'JCT DB',      variants: ['standard', 'local-authorities'] },
  { value: 'JCT-MC',     label: 'JCT Management Building Contract (MC)',                       shortLabel: 'JCT MC',      variants: ['standard'] },
  { value: 'JCT-CM',     label: 'JCT Construction Management Agreement (CM/A)',                shortLabel: 'JCT CM/A',    variants: ['standard'] },
  { value: 'JCT-MTC',    label: 'JCT Measured Term Contract (MTC)',                             shortLabel: 'JCT MTC',    variants: ['standard'] },
  { value: 'JCT-PCC',    label: 'JCT Pre-Construction Services Agreement',                     shortLabel: 'JCT PCSA',    variants: ['standard'] },
  { value: 'JCT-HBR',    label: 'JCT Home Owner / Occupier — Repair and Maintenance',          shortLabel: 'JCT HO/R',   variants: ['standard'] },
  { value: 'JCT-HBN',    label: 'JCT Home Owner / Occupier — New Build',                       shortLabel: 'JCT HO/N',   variants: ['standard'] },
];

export const JCT_VARIANT_LABELS: Record<JctVariant, string> = {
  'with-cdp': 'With Contractor\'s Design Portion (CDP)',
  'without-cdp': 'Without Contractor\'s Design Portion',
  'local-authorities': 'Local Authorities Edition',
  'sub-design': 'Sub-Contract with Sub-Contractor\'s Design',
  'sub-no-design': 'Sub-Contract without Sub-Contractor\'s Design',
  'standard': 'Standard',
};

// ── Review Contexts ──────────────────────────────────────────────────────────
export const REVIEW_CONTEXTS: Array<{ value: ReviewContext; label: string; description: string }> = [
  { value: 'pre-tender',  label: 'Pre-Tender',  description: 'Writing or preparing your own scope of works' },
  { value: 'pre-submit',  label: 'Pre-Submit',  description: 'Reviewing before you submit your bid / tender' },
  { value: 'pre-award',   label: 'Pre-Award',   description: 'Reviewing before you accept or sign the contract' },
  { value: 'post-award',  label: 'Post-Award',  description: 'Checking what you have committed to after award' },
];

// ── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES: Array<{ value: UserRole; label: string }> = [
  { value: 'contractor',      label: 'Main Contractor' },
  { value: 'subcontractor',   label: 'Subcontractor' },
  { value: 'client-employer',  label: 'Client / Employer' },
  { value: 'pm-supervisor',    label: 'Project Manager / Supervisor' },
];

// ── Sectors ──────────────────────────────────────────────────────────────────
export const SECTORS: Array<{ value: Sector; label: string }> = [
  { value: 'water',     label: 'Water & Wastewater' },
  { value: 'highways',  label: 'Highways & Roads' },
  { value: 'rail',      label: 'Rail & Transport' },
  { value: 'building',  label: 'Building & Fit-Out' },
  { value: 'energy',    label: 'Energy & Power' },
  { value: 'marine',    label: 'Marine & Coastal' },
  { value: 'defence',   label: 'Defence & Government' },
  { value: 'telecoms',  label: 'Telecoms & Utilities' },
  { value: 'other',     label: 'Other' },
];

// ── Readable summary for AI prompt ──────────────────────────────────────────
export function getContractSummaryForPrompt(state: {
  contractFamily: ContractFamily;
  necContractType?: string;
  necMainOption?: string;
  jctContractType?: string;
  jctVariant?: string;
  reviewContext: string;
  userRole: string;
  sector: string;
  estimatedValue?: string;
  programmeDuration?: string;
}): string {
  const parts: string[] = [];

  if (state.contractFamily === 'NEC') {
    const nec = NEC_CONTRACT_TYPES.find(n => n.value === state.necContractType);
    parts.push(`Contract: ${nec?.label || state.necContractType || 'NEC (unspecified)'}`);
    if (state.necMainOption) {
      const opt = NEC_MAIN_OPTIONS.find(o => o.value === state.necMainOption);
      parts.push(`Main Option: ${opt?.label || state.necMainOption}`);
    }
  } else {
    const jct = JCT_CONTRACT_TYPES.find(j => j.value === state.jctContractType);
    parts.push(`Contract: ${jct?.label || state.jctContractType || 'JCT (unspecified)'}`);
    if (state.jctVariant && state.jctVariant !== 'standard') {
      parts.push(`Variant: ${JCT_VARIANT_LABELS[state.jctVariant as JctVariant] || state.jctVariant}`);
    }
  }

  const ctx = REVIEW_CONTEXTS.find(r => r.value === state.reviewContext);
  parts.push(`Review Context: ${ctx?.label || state.reviewContext} — ${ctx?.description || ''}`);

  const role = USER_ROLES.find(r => r.value === state.userRole);
  parts.push(`User Role: ${role?.label || state.userRole}`);

  const sect = SECTORS.find(s => s.value === state.sector);
  parts.push(`Sector: ${sect?.label || state.sector}`);

  if (state.estimatedValue) parts.push(`Estimated Value: ${state.estimatedValue}`);
  if (state.programmeDuration) parts.push(`Programme Duration: ${state.programmeDuration}`);

  return parts.join('\n');
}
