// src/data/concrete-pour-planner.ts
// Concrete Pour Planner — PAID, white-label, ready-mix only
// Multi-wagon fleet with staggered arrivals, multi-pump, workability tracking

export interface PumpConfig {
  rate: number | null;  // m³/hr — null = not active
  label: string;        // e.g. "36m Boom", "Ground Line"
}

export interface PourInputs {
  pourVolume: number | null; // m³
  pumpCount: 1 | 2 | 3;
  pumps: [PumpConfig, PumpConfig, PumpConfig]; // P1 required, P2/P3 optional
  truckCapacity: number; // m³ (default 6)
  fleetSize: number; // number of wagons available
  roundTripMinutes: number | null; // travel to plant + load + return (minutes)
  dischargeMinutes: number | null; // global override: time to discharge one load (null = auto per pump)
  staggerMinutes: number; // gap between first wagon arrivals (e.g. 15 min)
  tacoMinutes: number; // Workability guideline — default 120 min (rule of thumb)
  startTime: string; // HH:MM — first wagon arrival
  mixDesignation: string;
  ambientTemp: "below10" | "10to25" | "25to30" | "above30";
  hasRetarder: boolean;
}

export interface TruckTrip {
  truckNumber: number;
  tripNumber: number;
  pumpNumber: number; // 1-indexed
  arrivalTime: string;
  dischargeStart: string;
  dischargeEnd: string;
  departTime: string;
  loadM3: number;
  cumulativeM3: number;
  tacoOk: boolean;
  tacoStatus: "ok" | "caution" | "exceeds";
  tacoElapsedMin: number;
  waitMinutes: number;
}

export interface PumpStats {
  pumpNumber: number;
  label: string;
  rate: number;
  loads: number;
  totalM3: number;
  busyMinutes: number;
}

export interface PourResult {
  totalLoads: number;
  totalPourDuration: number;
  firstTruckArrival: string;
  lastDischargeEnd: string;
  schedule: TruckTrip[];
  fleetSize: number;
  pumpCount: number;
  pumpStats: PumpStats[];
  tacoBreaches: number;
  tacoExceedances: number;
  tacoCautions: number;
  effectiveTacoMinutes: number;
  peakWagonsOnSite: number;
  combinedPumpRate: number; // total m³/hr across all active pumps
}

export const CONCRETE_MIXES = [
  { designation: "C8/10", description: "Blinding / mass fill" },
  { designation: "C12/15", description: "Strip footings / mass concrete" },
  { designation: "C16/20", description: "Residential foundations" },
  { designation: "C20/25", description: "General purpose" },
  { designation: "C25/30", description: "Reinforced foundations" },
  { designation: "C28/35", description: "Piling / structural" },
  { designation: "C30/37", description: "Pavements / structural slabs" },
  { designation: "C32/40", description: "Heavily reinforced" },
  { designation: "C35/45", description: "High-performance" },
  { designation: "C40/50", description: "Pre-stressed / high-strength" },
  { designation: "Custom", description: "Custom mix" },
];

export const DEFAULT_INPUTS: PourInputs = {
  pourVolume: null,
  pumpCount: 1,
  pumps: [
    { rate: null, label: "Pump 1" },
    { rate: null, label: "Pump 2" },
    { rate: null, label: "Pump 3" },
  ],
  truckCapacity: 6,
  fleetSize: 3,
  roundTripMinutes: null,
  dischargeMinutes: null,
  staggerMinutes: 15,
  tacoMinutes: 120,
  startTime: "07:00",
  mixDesignation: "C25/30",
  ambientTemp: "10to25",
  hasRetarder: false,
};

// Backwards-compat helper: get primary pump rate for validation
export function primaryPumpRate(inputs: PourInputs): number | null {
  return inputs.pumps[0].rate;
}

// Temperature/retarder adjustment to workability guideline (rule of thumb)
const TEMP_ADJUSTMENTS: Record<PourInputs["ambientTemp"], number> = {
  "below10": 30,
  "10to25": 0,
  "25to30": -15,
  "above30": -30,
};
const RETARDER_ADJUSTMENT = 60;

export function effectiveTaco(inputs: PourInputs): number {
  let effective = inputs.tacoMinutes;
  effective += TEMP_ADJUSTMENTS[inputs.ambientTemp] ?? 0;
  if (inputs.hasRetarder) effective += RETARDER_ADJUSTMENT;
  return Math.max(30, effective);
}

function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(min: number): string {
  const totalMin = ((min % 1440) + 1440) % 1440;
  const hh = Math.floor(totalMin / 60);
  const mm = Math.round(totalMin % 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function calculatePour(inputs: PourInputs): PourResult {
  const tacoLimit = effectiveTaco(inputs);
  const emptyResult: PourResult = {
    totalLoads: 0, totalPourDuration: 0, firstTruckArrival: "", lastDischargeEnd: "",
    schedule: [], fleetSize: 0, pumpCount: inputs.pumpCount, pumpStats: [],
    tacoBreaches: 0, tacoExceedances: 0, tacoCautions: 0,
    effectiveTacoMinutes: tacoLimit, peakWagonsOnSite: 0, combinedPumpRate: 0,
  };

  // Validate: need at least P1 rate
  if (!inputs.pourVolume || !inputs.pumps[0].rate || !inputs.roundTripMinutes || inputs.fleetSize < 1) return emptyResult;

  const { pourVolume, truckCapacity, fleetSize, roundTripMinutes, staggerMinutes, startTime, pumpCount } = inputs;

  // Build active pumps array
  const activePumps: { index: number; rate: number; label: string }[] = [];
  for (let p = 0; p < pumpCount; p++) {
    const pump = inputs.pumps[p];
    if (pump.rate && pump.rate > 0) {
      activePumps.push({ index: p, rate: pump.rate, label: pump.label || `Pump ${p + 1}` });
    }
  }
  if (activePumps.length === 0) return emptyResult;

  const combinedPumpRate = activePumps.reduce((s, p) => s + p.rate, 0);

  // Discharge time per pump (time to discharge one full truckload)
  const pumpDischargeMins = activePumps.map(p =>
    inputs.dischargeMinutes ?? (truckCapacity / p.rate) * 60
  );

  const totalLoads = Math.ceil(pourVolume / truckCapacity);
  const startMin = timeToMin(startTime);

  // Each wagon's next arrival time — first arrivals are staggered
  const wagonNextArrival: number[] = [];
  for (let w = 0; w < fleetSize; w++) {
    wagonNextArrival.push(startMin + w * staggerMinutes);
  }

  // Track when each wagon was loaded at the plant (for TACO)
  const oneWayMin = roundTripMinutes / 2;
  const wagonLoadedAt: number[] = [];
  for (let w = 0; w < fleetSize; w++) {
    wagonLoadedAt.push(wagonNextArrival[w] - oneWayMin);
  }

  // Each pump has its own "free at" time
  const pumpFreeAt: number[] = activePumps.map(() => startMin);

  const schedule: TruckTrip[] = [];
  let cumulativeM3 = 0;
  let tacoExceedances = 0;
  let tacoCautions = 0;
  // Track the last absolute discharge-end minute (no wrap at 1440) so the
  // total pour duration remains accurate even if the pour crosses multiple
  // midnights. The string dischargeEnd field wraps at 24h for display, but
  // this counter does not.
  let lastDischargeEndMinAbs = startMin;

  const onSiteEvents: { time: number; delta: number }[] = [];
  const wagonTripCount: number[] = new Array(fleetSize).fill(0);

  // Per-pump tracking
  const pumpLoads: number[] = activePumps.map(() => 0);
  const pumpM3: number[] = activePumps.map(() => 0);
  const pumpBusy: number[] = activePumps.map(() => 0);

  for (let load = 0; load < totalLoads; load++) {
    // Find wagon that arrives earliest
    let bestW = 0;
    for (let w = 1; w < fleetSize; w++) {
      if (wagonNextArrival[w] < wagonNextArrival[bestW]) bestW = w;
    }

    const arrivalMin = wagonNextArrival[bestW];
    const loadedAtMin = wagonLoadedAt[bestW];
    wagonTripCount[bestW]++;

    // Find the pump that is free earliest (at or after wagon arrival)
    // If multiple pumps are free, pick the one that has been free longest (earliest freeAt)
    let bestPump = 0;
    let bestPumpStart = Math.max(arrivalMin, pumpFreeAt[0]);
    for (let p = 1; p < activePumps.length; p++) {
      const thisStart = Math.max(arrivalMin, pumpFreeAt[p]);
      if (thisStart < bestPumpStart) {
        bestPump = p;
        bestPumpStart = thisStart;
      }
    }

    const dischargeStartMin = bestPumpStart;
    const waitMins = dischargeStartMin - arrivalMin;

    const remaining = pourVolume - cumulativeM3;
    const loadM3 = Math.min(truckCapacity, remaining);
    const actualDischargeMins = (loadM3 / truckCapacity) * pumpDischargeMins[bestPump];
    const dischargeEndMin = dischargeStartMin + actualDischargeMins;
    const departMin = dischargeEndMin;

    // TACO: time from loading at plant to start of discharge
    const tacoElapsedMin = Math.round(dischargeStartMin - loadedAtMin);
    const tacoOk = tacoElapsedMin <= tacoLimit;
    const tacoCaution = tacoOk && tacoElapsedMin > (tacoLimit - 15);
    const tacoStatus: "ok" | "caution" | "exceeds" = !tacoOk ? "exceeds" : tacoCaution ? "caution" : "ok";
    if (!tacoOk) tacoExceedances++;
    else if (tacoCaution) tacoCautions++;

    cumulativeM3 += loadM3;

    // Track pump stats
    pumpLoads[bestPump]++;
    pumpM3[bestPump] += loadM3;
    pumpBusy[bestPump] += actualDischargeMins;

    schedule.push({
      truckNumber: bestW + 1,
      tripNumber: wagonTripCount[bestW],
      pumpNumber: bestPump + 1,
      arrivalTime: minToTime(arrivalMin),
      dischargeStart: minToTime(dischargeStartMin),
      dischargeEnd: minToTime(dischargeEndMin),
      departTime: minToTime(departMin),
      loadM3,
      cumulativeM3,
      tacoOk,
      tacoStatus,
      tacoElapsedMin,
      waitMinutes: Math.round(waitMins),
    });

    onSiteEvents.push({ time: arrivalMin, delta: 1 });
    onSiteEvents.push({ time: departMin, delta: -1 });

    // Update pump free time
    pumpFreeAt[bestPump] = dischargeEndMin;
    // Track absolute (non-wrapping) end time for accurate duration.
    if (dischargeEndMin > lastDischargeEndMinAbs) lastDischargeEndMinAbs = dischargeEndMin;

    // Wagon departs, does round trip, arrives again
    const nextArrival = departMin + roundTripMinutes;
    wagonNextArrival[bestW] = nextArrival;
    wagonLoadedAt[bestW] = nextArrival - oneWayMin;
  }

  // Peak wagons on site
  onSiteEvents.sort((a, b) => a.time - b.time || a.delta - b.delta);
  let current = 0;
  let peak = 0;
  for (const ev of onSiteEvents) {
    current += ev.delta;
    if (current > peak) peak = current;
  }

  const pumpStats: PumpStats[] = activePumps.map((p, i) => ({
    pumpNumber: i + 1,
    label: p.label,
    rate: p.rate,
    loads: pumpLoads[i],
    totalM3: Math.round(pumpM3[i] * 10) / 10,
    busyMinutes: Math.round(pumpBusy[i]),
  }));

  // Duration uses absolute minutes (never wraps) so multi-day pours stay accurate.
  const totalPourDuration = schedule.length > 0 ? Math.max(0, lastDischargeEndMinAbs - startMin) : 0;

  return {
    totalLoads,
    totalPourDuration,
    firstTruckArrival: minToTime(startMin),
    lastDischargeEnd: schedule.length > 0 ? schedule[schedule.length - 1].dischargeEnd : startTime,
    schedule,
    fleetSize,
    pumpCount: activePumps.length,
    pumpStats,
    tacoBreaches: tacoExceedances,
    tacoExceedances,
    tacoCautions,
    effectiveTacoMinutes: tacoLimit,
    peakWagonsOnSite: peak,
    combinedPumpRate,
  };
}
