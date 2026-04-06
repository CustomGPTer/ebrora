// src/lib/construction-productivity-calculator/scoring-engine.ts
// Full calculation logic per task type

import type { TaskConfig, TaskInputs, FactorOption } from "@/data/construction-productivity-calculator";
import { REGION_OPTIONS, CONSTRAINT_OPTIONS, getSkillFactor } from "@/data/construction-productivity-calculator";

export interface CalcBreakdown {
  baseRate: number;
  hoursScaling: number;
  crewFactor: number;
  efficiencyFactor: number;
  safetyFactor: number;
  regionFactor: number;
  constraintsFactor: number;
  skillFactor: number;
  taskFactors: { label: string; value: number }[];
  gangCount: number;
  dailyOutput: number;
}

function getSelectFactor(options: FactorOption[], selectedLabel: string): number {
  const opt = options.find(o => o.label === selectedLabel);
  return opt?.value ?? 1;
}

export function calculateOutput(task: TaskConfig, inputs: TaskInputs): CalcBreakdown {
  const hoursScaling = inputs.shiftHours / task.standardWorkday;
  const regionFactor = getSelectFactor(REGION_OPTIONS, inputs.region as string);
  const constraintsFactor = getSelectFactor(CONSTRAINT_OPTIONS, inputs.constraints as string);
  const skillFactor = getSkillFactor(inputs.skilledOps, inputs.generalOps);

  // Crew factor: for non-gang-based tasks, output scales by total crew
  const totalCrew = inputs.skilledOps + inputs.generalOps;
  let crewFactor = 1;
  let gangCount = 1;

  if (task.gangBased) {
    gangCount = (inputs.gangCount as number) || 1;
    crewFactor = 1; // gang-based = base rate is per gang, scaled by gang count
  } else {
    crewFactor = totalCrew;
    if (task.id === "muck-shift") crewFactor = 1; // muck shift is plant-driven, not crew-driven
  }

  // Task-specific factors
  const taskFactors: { label: string; value: number }[] = [];
  let taskProduct = 1;

  // Override base rate for muck shift (plant-driven)
  let effectiveBaseRate = task.baseRate;

  task.fields.forEach(field => {
    const inputVal = inputs[field.id];

    if (field.id === "gangCount") return; // handled above

    if (task.id === "muck-shift" && field.id === "primaryPlant") {
      // Primary plant overrides the base rate (shown as base rate in chain, not as separate factor)
      const plantRate = getSelectFactor(field.options!, inputVal as string);
      effectiveBaseRate = plantRate;
      return;
    }

    if (task.id === "muck-shift" && field.id === "truckCount") {
      // Diminishing returns truck factor
      const tc = Math.min(Math.max(inputVal as number, 1), 12);
      const truckFactorTable: Record<number, number> = {1:1,2:1.2,3:1.35,4:1.48,5:1.58,6:1.66,7:1.73,8:1.79,9:1.84,10:1.88,11:1.91,12:1.94};
      const tf = truckFactorTable[tc] || 1;
      taskFactors.push({ label: "Truck count factor", value: tf });
      taskProduct *= tf;
      return;
    }

    if (task.id === "muck-shift" && field.id === "haulDistance") {
      // Haul penalty: -0.2 per 100m beyond 0
      const haulM = (inputVal as number) || 0;
      const haulPenalty = Math.max(1 - (haulM / 100) * 0.2, 0.4);
      taskFactors.push({ label: "Haul distance factor", value: haulPenalty });
      taskProduct *= haulPenalty;
      return;
    }

    if (field.id === "floorsAbove") {
      const floors = (inputVal as number) || 0;
      const heightFactor = Math.max(1 - floors * 0.05, 0.5);
      taskFactors.push({ label: "Height factor", value: heightFactor });
      taskProduct *= heightFactor;
      return;
    }

    if (field.id === "trenchDepth") {
      const depth = (inputVal as number) || 1;
      const baseDepth = 1;
      const extra = Math.max(depth - baseDepth, 0);
      const depthFactor = Math.max(1 - extra * 0.1, 0.4);
      taskFactors.push({ label: "Depth factor", value: depthFactor });
      taskProduct *= depthFactor;
      return;
    }

    if (field.id === "pileDepth") {
      const depth = (inputVal as number) || 20;
      const baseDepth = 20;
      const extra = Math.max(depth - baseDepth, 0);
      const depthFactor = Math.max(1 - (extra / 10) * 0.2, 0.4);
      taskFactors.push({ label: "Depth factor", value: depthFactor });
      taskProduct *= depthFactor;
      return;
    }

    if (field.id === "layerThickness" && task.id === "road-base-laying") {
      const thickness = (inputVal as number) || 200;
      const extra = Math.max(thickness - 200, 0);
      const tf = Math.max(1 - (extra / 100) * 0.1, 0.5);
      taskFactors.push({ label: "Thickness factor", value: tf });
      taskProduct *= tf;
      return;
    }

    if (field.id === "roadWidth") {
      const width = (inputVal as number) || 6;
      const wf = width > 10 ? 1.1 : 1;
      taskFactors.push({ label: "Width factor", value: wf });
      taskProduct *= wf;
      return;
    }

    if (field.id === "plannedArea" || field.id === "pourVolume" || field.id === "runLength") {
      const qty = (inputVal as number) || 0;
      const bonusPer100 = field.id === "pourVolume" ? 0.1 : 0.05;
      const maxFactor = field.id === "pourVolume" ? 1.3 : 1.25;
      const sf = Math.min(1 + (qty / 100) * bonusPer100, maxFactor);
      taskFactors.push({ label: "Scale factor", value: sf });
      taskProduct *= sf;
      return;
    }

    // Standard select factor
    if (field.type === "select" && field.options) {
      const factor = getSelectFactor(field.options, inputVal as string);
      taskFactors.push({ label: field.label, value: factor });
      taskProduct *= factor;
    }
  });

  // Final calculation
  let dailyOutput: number;

  if (task.id === "muck-shift") {
    // Muck shift: plant rate × hours × efficiency × safety × region × constraints × skill × task factors
    dailyOutput = effectiveBaseRate * inputs.shiftHours * task.efficiencyFactor * task.safetyFactor * regionFactor * constraintsFactor * skillFactor * taskProduct;
  } else if (task.gangBased) {
    dailyOutput = effectiveBaseRate * gangCount * hoursScaling * task.efficiencyFactor * task.safetyFactor * regionFactor * constraintsFactor * skillFactor * taskProduct;
  } else {
    dailyOutput = effectiveBaseRate * crewFactor * hoursScaling * task.efficiencyFactor * task.safetyFactor * regionFactor * constraintsFactor * skillFactor * taskProduct;
  }

  return {
    baseRate: effectiveBaseRate,
    hoursScaling,
    crewFactor,
    efficiencyFactor: task.efficiencyFactor,
    safetyFactor: task.safetyFactor,
    regionFactor,
    constraintsFactor,
    skillFactor,
    taskFactors,
    gangCount,
    dailyOutput: Math.max(dailyOutput, 0),
  };
}
