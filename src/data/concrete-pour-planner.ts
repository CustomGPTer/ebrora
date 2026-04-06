// src/data/concrete-pour-planner.ts
// Concrete Pour Planner — PAID, white-label, ready-mix only
// Multi-wagon fleet with staggered arrivals, TACO breaks, cycling schedule

export interface PourInputs {
  pourVolume: number | null; // m³
  pumpRate: number | null; // m³/hr
  truckCapacity: number; // m³ (default 6)
  fleetSize: number; // number of wagons available
  roundTripMinutes: number | null; // travel to plant + load + return (minutes)
  dischargeMinutes: number | null; // override: time to discharge one load at pump
  staggerMinutes: number; // gap between first wagon arrivals (e.g. 15 min)
  tacoMinutes: number; // Time Allowed for Completion of Operations (default 120)
  startTime: string; // HH:MM — first wagon arrival
  mixDesignation: string;
}

export interface TruckTrip {
  truckNumber: number;
  tripNumber: number;
  arrivalTime: string;
  dischargeStart: string;
  dischargeEnd: string;
  departTime: string;
  loadM3: number;
  cumulativeM3: number;
  tacoOk: boolean;
  tacoElapsedMin: number;
  waitMinutes: number;
}

export interface PourResult {
  totalLoads: number;
  totalPourDuration: number;
  firstTruckArrival: string;
  lastDischargeEnd: string;
  schedule: TruckTrip[];
  fleetSize: number;
  tacoBreaches: number;
  peakWagonsOnSite: number;
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
  pumpRate: null,
  truckCapacity: 6,
  fleetSize: 3,
  roundTripMinutes: null,
  dischargeMinutes: null,
  staggerMinutes: 15,
  tacoMinutes: 120,
  startTime: "07:00",
  mixDesignation: "C25/30",
};

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
  const empty: PourResult = { totalLoads: 0, totalPourDuration: 0, firstTruckArrival: "", lastDischargeEnd: "", schedule: [], fleetSize: 0, tacoBreaches: 0, peakWagonsOnSite: 0 };

  if (!inputs.pourVolume || !inputs.pumpRate || !inputs.roundTripMinutes || inputs.fleetSize < 1) return empty;

  const { pourVolume, pumpRate, truckCapacity, fleetSize, roundTripMinutes, staggerMinutes, tacoMinutes, startTime } = inputs;

  // Discharge time per full load
  const dischargeMins = inputs.dischargeMinutes ?? (truckCapacity / pumpRate) * 60;
  const totalLoads = Math.ceil(pourVolume / truckCapacity);
  const startMin = timeToMin(startTime);

  // Each wagon's next arrival time — first arrivals are staggered
  const wagonNextArrival: number[] = [];
  for (let w = 0; w < fleetSize; w++) {
    wagonNextArrival.push(startMin + w * staggerMinutes);
  }

  // Track when each wagon was loaded at the plant (for TACO)
  // First trip: loaded at arrival - one-way travel (roundTrip/2 approx)
  const oneWayMin = roundTripMinutes / 2;
  const wagonLoadedAt: number[] = [];
  for (let w = 0; w < fleetSize; w++) {
    wagonLoadedAt.push(wagonNextArrival[w] - oneWayMin);
  }

  let pumpFreeAt = startMin;
  const schedule: TruckTrip[] = [];
  let cumulativeM3 = 0;
  let tacoBreaches = 0;

  // On-site tracking for peak
  const onSiteEvents: { time: number; delta: number }[] = [];

  // Trip counter per wagon
  const wagonTripCount: number[] = new Array(fleetSize).fill(0);

  for (let load = 0; load < totalLoads; load++) {
    // Find wagon that arrives earliest
    let bestW = 0;
    for (let w = 1; w < fleetSize; w++) {
      if (wagonNextArrival[w] < wagonNextArrival[bestW]) bestW = w;
    }

    const arrivalMin = wagonNextArrival[bestW];
    const loadedAtMin = wagonLoadedAt[bestW];
    wagonTripCount[bestW]++;

    // Pump may not be free yet — wagon waits
    const dischargeStartMin = Math.max(arrivalMin, pumpFreeAt);
    const waitMins = dischargeStartMin - arrivalMin;

    const remaining = pourVolume - cumulativeM3;
    const loadM3 = Math.min(truckCapacity, remaining);
    const actualDischargeMins = (loadM3 / truckCapacity) * dischargeMins;
    const dischargeEndMin = dischargeStartMin + actualDischargeMins;
    const departMin = dischargeEndMin;

    // TACO: time from loading at plant to start of discharge
    const tacoElapsedMin = Math.round(dischargeStartMin - loadedAtMin);
    const tacoOk = tacoElapsedMin <= tacoMinutes;
    if (!tacoOk) tacoBreaches++;

    cumulativeM3 += loadM3;

    schedule.push({
      truckNumber: bestW + 1,
      tripNumber: wagonTripCount[bestW],
      arrivalTime: minToTime(arrivalMin),
      dischargeStart: minToTime(dischargeStartMin),
      dischargeEnd: minToTime(dischargeEndMin),
      departTime: minToTime(departMin),
      loadM3,
      cumulativeM3,
      tacoOk,
      tacoElapsedMin,
      waitMinutes: Math.round(waitMins),
    });

    onSiteEvents.push({ time: arrivalMin, delta: 1 });
    onSiteEvents.push({ time: departMin, delta: -1 });

    pumpFreeAt = dischargeEndMin;

    // Wagon departs, does round trip (travel + load + travel), arrives again
    const nextArrival = departMin + roundTripMinutes;
    wagonNextArrival[bestW] = nextArrival;
    // Wagon will be loaded at plant at: depart + one-way travel + loading
    // Simplify: loaded at nextArrival - oneWayMin
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

  const lastEndMin = schedule.length > 0 ? timeToMin(schedule[schedule.length - 1].dischargeEnd) : startMin;

  return {
    totalLoads,
    totalPourDuration: lastEndMin >= startMin ? lastEndMin - startMin : (1440 - startMin) + lastEndMin,
    firstTruckArrival: minToTime(startMin),
    lastDischargeEnd: schedule.length > 0 ? schedule[schedule.length - 1].dischargeEnd : startTime,
    schedule,
    fleetSize,
    tacoBreaches,
    peakWagonsOnSite: peak,
  };
}
