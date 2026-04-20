// src/lib/access-equipment/scoring-engine.ts
// Access Equipment Selector — Scoring Engine
// Filters, scores, and ranks equipment based on site conditions

import { EQUIPMENT_LIBRARY, EquipmentDefinition } from '@/data/access-equipment';

export interface SelectorInputs {
  heightCode: number | null;
  durationCode: number | null;
  frequencyCode: number | null;
  environmentCode: number | null;
  groundCode: number | null;
  spaceCode: number | null;
  carryCode: number | null;
  reachCode: number | null;
  overheadCode: number | null;
  publicCode: number | null;
  trafficCode: number | null;
  windCode: number | null;
}

export interface ScoringBreakdown {
  hierarchyRank: number;
  hierarchyLabel: string;
  heightMatch: boolean;
  durationMatch: boolean;
  frequencyMatch: boolean;
  environmentMatch: boolean;
  groundMatch: boolean;
  spaceMatch: boolean;
  carryMatch: boolean;
  reachMatch: boolean;
  overheadMatch: boolean;
  windMatch: boolean;
  penalties: { reason: string; points: number }[];
  totalScore: number;
}

export interface RankedEquipment {
  equipment: EquipmentDefinition;
  eligible: boolean;
  disqualifyReasons: string[];
  breakdown: ScoringBreakdown;
}

export function isInputComplete(inputs: SelectorInputs): boolean {
  return (
    inputs.heightCode !== null &&
    inputs.durationCode !== null &&
    inputs.frequencyCode !== null &&
    inputs.environmentCode !== null &&
    inputs.groundCode !== null &&
    inputs.spaceCode !== null &&
    inputs.carryCode !== null &&
    inputs.reachCode !== null &&
    inputs.overheadCode !== null &&
    inputs.windCode !== null
  );
}

export function rankEquipment(inputs: SelectorInputs): RankedEquipment[] {
  if (!isInputComplete(inputs)) return [];

  const h = inputs.heightCode!;
  const d = inputs.durationCode!;
  const f = inputs.frequencyCode!;
  const env = inputs.environmentCode!;
  const g = inputs.groundCode!;
  const sp = inputs.spaceCode!;
  const carry = inputs.carryCode!;
  const reach = inputs.reachCode!;
  const overhead = inputs.overheadCode!;
  const wind = inputs.windCode!;

  const isOutdoor = env === 2;
  const isPoorGround = g >= 3; // Uneven or Soft and uneven

  // Determine which equipment to consider
  // If outdoor + poor ground, swap standard MEWPs for diesel variants
  const useLibrary = EQUIPMENT_LIBRARY.filter((eq) => {
    if (isOutdoor && isPoorGround) {
      // Include diesel variants, exclude standard MEWPs they replace
      if (eq.isDieselVariant) return true;
      if (eq.id === 'mewp-scissor' || eq.id === 'mewp-boom') return false;
      return true;
    } else {
      // Exclude diesel variants
      if (eq.isDieselVariant) return false;
      return true;
    }
  });

  const results: RankedEquipment[] = useLibrary.map((eq) => {
    const disqualifyReasons: string[] = [];
    const penalties: { reason: string; points: number }[] = [];

    // ── Eligibility checks ──
    const heightMatch = h >= eq.minHeightCode && h <= eq.maxHeightCode;
    if (!heightMatch) disqualifyReasons.push(`Height ${h > eq.maxHeightCode ? 'exceeds maximum' : 'below minimum'} for this equipment`);

    const durationMatch = d <= eq.maxDurationCode;
    if (!durationMatch) disqualifyReasons.push('Task duration exceeds equipment capability');

    const frequencyMatch = f <= eq.maxFrequencyCode;
    if (!frequencyMatch) disqualifyReasons.push('Access frequency exceeds equipment suitability');

    // Environment matching is defensive: explicit handling for known codes (1 = indoor, 2 = outdoor).
    // If a future code (e.g. 3 = both) is added, equipment must satisfy BOTH env flags to match.
    const environmentMatch =
      env === 1 ? eq.indoorAllowed :
      env === 2 ? eq.outdoorAllowed :
      (eq.indoorAllowed && eq.outdoorAllowed);
    if (!environmentMatch) disqualifyReasons.push(`Not suitable for ${env === 1 ? 'indoor' : env === 2 ? 'outdoor' : 'mixed indoor/outdoor'} use`);

    const groundMatch = g <= eq.maxGroundCode;
    if (!groundMatch) disqualifyReasons.push('Ground conditions exceed equipment capability');

    const spaceMatch = sp >= eq.minSpaceCode;
    if (!spaceMatch) disqualifyReasons.push('Insufficient space for this equipment');

    const carryMatch = carry <= eq.maxCarryCode;
    if (!carryMatch) disqualifyReasons.push('Cannot handle the required material loads');

    const reachMatch = reach <= eq.maxReachCode;
    if (!reachMatch) disqualifyReasons.push('Insufficient side reach capability');

    const overheadMatch = overhead === 0 || eq.overheadOk;
    if (!overheadMatch) disqualifyReasons.push('Not suitable with overhead services or obstructions');

    const windMatch = wind <= eq.maxWindCode;
    if (!windMatch) disqualifyReasons.push('Not suitable in high wind conditions');

    const eligible = disqualifyReasons.length === 0;

    // ── Penalty scoring (lower = better) ──
    // Base: hierarchy rank (already favours collective protection)
    let totalScore = eq.hierarchyRank;

    // Ground difficulty penalty (equipment near its limit)
    if (eligible && g === eq.maxGroundCode && g > 1) {
      penalties.push({ reason: 'Operating at ground condition limit', points: 2 });
      totalScore += 2;
    }

    // Space penalty (equipment needs more space than available)
    if (eligible && sp === eq.minSpaceCode && eq.minSpaceCode > 1) {
      penalties.push({ reason: 'Space is at minimum for this equipment', points: 1 });
      totalScore += 1;
    }

    // Wind penalty
    if (eligible && wind === eq.maxWindCode && wind > 1) {
      penalties.push({ reason: 'Operating at wind exposure limit', points: 2 });
      totalScore += 2;
    }

    // Public interface penalty (prefer enclosed platforms near public)
    if (eligible && inputs.publicCode === 1 && eq.hierarchyLevel === 'last-resort') {
      penalties.push({ reason: 'Ladder use near public interface — additional controls needed', points: 5 });
      totalScore += 5;
    }

    // Traffic interface penalty
    if (eligible && inputs.trafficCode === 1 && eq.hierarchyLevel === 'last-resort') {
      penalties.push({ reason: 'Ladder use near traffic — additional controls needed', points: 5 });
      totalScore += 5;
    }

    // Duration bonus for equipment that exceeds requirements
    if (eligible && eq.maxDurationCode > d) {
      const bonus = -1;
      penalties.push({ reason: 'Duration capacity exceeds requirement', points: bonus });
      totalScore += bonus;
    }

    // Overhead services bonus for compatible equipment
    if (eligible && overhead === 1 && eq.overheadOk) {
      const bonus = -1;
      penalties.push({ reason: 'Compatible with overhead services', points: bonus });
      totalScore += bonus;
    }

    const hierarchyLabel =
      eq.hierarchyLevel === 'prevent' ? 'Prevent Falls (Collective)' :
      eq.hierarchyLevel === 'minimise' ? 'Minimise Consequences' :
      'Last Resort';

    return {
      equipment: eq,
      eligible,
      disqualifyReasons,
      breakdown: {
        hierarchyRank: eq.hierarchyRank,
        hierarchyLabel,
        heightMatch,
        durationMatch,
        frequencyMatch,
        environmentMatch,
        groundMatch,
        spaceMatch,
        carryMatch,
        reachMatch,
        overheadMatch,
        windMatch,
        penalties,
        totalScore,
      },
    };
  });

  // Sort: eligible first, then by total score (lower = better)
  results.sort((a, b) => {
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return a.breakdown.totalScore - b.breakdown.totalScore;
  });

  return results;
}
