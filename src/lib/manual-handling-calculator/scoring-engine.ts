// src/lib/manual-handling-calculator/scoring-engine.ts
// Manual Handling Risk Score Calculator — Scoring Engine
// Combined MAC (lift/carry/team) + RAPP (push/pull) methodology

import {
  MAC_FACTORS,
  RAPP_FACTORS,
  getRiskBand,
  SUGGESTED_CONTROLS,
  type HandlingType,
  type ScoringFactor,
  type ScoringOption,
  type RiskBand,
  type SuggestedControl,
} from '@/data/manual-handling-calculator';

export interface FactorScore {
  factorId: string;
  factorLabel: string;
  selectedIndex: number | null;
  selectedLabel: string | null;
  points: number;
  color: 'green' | 'amber' | 'red' | 'purple' | null;
}

export interface AssessmentScore {
  macTotal: number;
  rappTotal: number;
  overallScore: number;
  macFactors: FactorScore[];
  rappFactors: FactorScore[];
  riskBand: RiskBand;
  activeMethod: 'MAC' | 'RAPP' | 'BOTH';
  macComplete: boolean;
  rappComplete: boolean;
}

export function getFactorsForType(handlingTypes: HandlingType[]): { macFactors: ScoringFactor[]; rappFactors: ScoringFactor[] } {
  const useMAC = handlingTypes.some(t => t === 'lift' || t === 'carry' || t === 'team');
  const useRAPP = handlingTypes.includes('push-pull');

  const macFactors = useMAC
    ? MAC_FACTORS.filter(f => f.appliesTo.some(a => handlingTypes.includes(a)))
    : [];

  const rappFactors = useRAPP ? RAPP_FACTORS : [];

  return { macFactors, rappFactors };
}

export function calculateScore(
  handlingTypes: HandlingType[],
  macSelections: Record<string, number | null>,
  rappSelections: Record<string, number | null>,
): AssessmentScore {
  const { macFactors, rappFactors } = getFactorsForType(handlingTypes);

  const macScores: FactorScore[] = macFactors.map(f => {
    const sel = macSelections[f.id];
    if (sel === null || sel === undefined) {
      return { factorId: f.id, factorLabel: f.label, selectedIndex: null, selectedLabel: null, points: 0, color: null };
    }
    const opt = f.options[sel];
    return { factorId: f.id, factorLabel: f.label, selectedIndex: sel, selectedLabel: opt.label, points: opt.points, color: opt.color };
  });

  const rappScores: FactorScore[] = rappFactors.map(f => {
    const sel = rappSelections[f.id];
    if (sel === null || sel === undefined) {
      return { factorId: f.id, factorLabel: f.label, selectedIndex: null, selectedLabel: null, points: 0, color: null };
    }
    const opt = f.options[sel];
    return { factorId: f.id, factorLabel: f.label, selectedIndex: sel, selectedLabel: opt.label, points: opt.points, color: opt.color };
  });

  const macTotal = macScores.reduce((sum, s) => sum + s.points, 0);
  const rappTotal = rappScores.reduce((sum, s) => sum + s.points, 0);

  const useMAC = macFactors.length > 0;
  const useRAPP = rappFactors.length > 0;
  const activeMethod: 'MAC' | 'RAPP' | 'BOTH' = useMAC && useRAPP ? 'BOTH' : useMAC ? 'MAC' : 'RAPP';

  // Worst case when both methods used
  const overallScore = activeMethod === 'BOTH' ? Math.max(macTotal, rappTotal) : useMAC ? macTotal : rappTotal;

  const macComplete = macFactors.length === 0 || macScores.every(s => s.selectedIndex !== null);
  const rappComplete = rappFactors.length === 0 || rappScores.every(s => s.selectedIndex !== null);

  return {
    macTotal,
    rappTotal,
    overallScore,
    macFactors: macScores,
    rappFactors: rappScores,
    riskBand: getRiskBand(overallScore),
    activeMethod,
    macComplete,
    rappComplete,
  };
}

export function getRelevantControls(
  handlingTypes: HandlingType[],
  macSelections: Record<string, number | null>,
  rappSelections: Record<string, number | null>,
): SuggestedControl[] {
  const allSelections = { ...macSelections, ...rappSelections };

  // Find factors that scored > 0
  const activeFactorIds: string[] = [];
  const allFactors = [...MAC_FACTORS, ...RAPP_FACTORS];
  for (const f of allFactors) {
    const sel = allSelections[f.id];
    if (sel !== null && sel !== undefined && f.options[sel]?.points > 0) {
      activeFactorIds.push(f.id);
    }
  }

  return SUGGESTED_CONTROLS.filter(c => {
    // Must apply to at least one active handling type
    if (!c.appliesTo.some(a => handlingTypes.includes(a))) return false;
    // If has relevantFactors, at least one must be active (scored > 0)
    if (c.relevantFactors && c.relevantFactors.length > 0) {
      return c.relevantFactors.some(rf => activeFactorIds.includes(rf));
    }
    return true;
  });
}
