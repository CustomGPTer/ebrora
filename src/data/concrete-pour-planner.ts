// src/data/concrete-pour-planner.ts
// Concrete Pour Planner — PAID, white-label, ready-mix only

export interface PourInputs {
  pourVolume: number | null; // m³
  pumpRate: number | null; // m³/hr
  truckCapacity: number; // m³ (default 6)
  roundTripMinutes: number | null; // minutes
  startTime: string; // HH:MM
  mixDesignation: string;
}

export interface TruckSchedule {
  truckNumber: number;
  arrivalTime: string; // HH:MM
  departTime: string; // HH:MM
  loadM3: number;
  cumulativeM3: number;
}

export interface PourResult {
  trucksRequired: number;
  totalPourDuration: number; // minutes
  firstTruckArrival: string;
  lastTruckArrival: string;
  pourEndTime: string;
  schedule: TruckSchedule[];
  trucksOnSite: number; // concurrent trucks to keep pump fed
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
  roundTripMinutes: null,
  startTime: "07:00",
  mixDesignation: "C25/30",
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function calculatePour(inputs: PourInputs): PourResult {
  const empty: PourResult = { trucksRequired: 0, totalPourDuration: 0, firstTruckArrival: "", lastTruckArrival: "", pourEndTime: "", schedule: [], trucksOnSite: 0 };

  if (!inputs.pourVolume || !inputs.pumpRate || !inputs.roundTripMinutes) return empty;

  const { pourVolume, pumpRate, truckCapacity, roundTripMinutes, startTime } = inputs;

  // Time to empty one truck at pump
  const minutesPerTruck = (truckCapacity / pumpRate) * 60;

  // Total trucks needed
  const trucksRequired = Math.ceil(pourVolume / truckCapacity);

  // Trucks on site to keep pump fed continuously
  // A truck needs roundTripMinutes to go, fill, and return
  // We need a new truck every minutesPerTruck
  // So we need roundTripMinutes / minutesPerTruck trucks in rotation (rounded up)
  const trucksOnSite = Math.ceil(roundTripMinutes / minutesPerTruck) + 1; // +1 for the one at the pump

  // Total pour duration
  const totalPourDuration = Math.ceil((pourVolume / pumpRate) * 60);

  // Build schedule
  const schedule: TruckSchedule[] = [];
  let cumulative = 0;

  for (let i = 0; i < trucksRequired; i++) {
    const arrivalMinutes = i * minutesPerTruck;
    const arrivalTime = addMinutes(startTime, arrivalMinutes);
    const departMinutes = arrivalMinutes + minutesPerTruck;
    const departTime = addMinutes(startTime, departMinutes);

    const remaining = pourVolume - cumulative;
    const loadM3 = Math.min(truckCapacity, remaining);
    cumulative += loadM3;

    schedule.push({
      truckNumber: i + 1,
      arrivalTime,
      departTime,
      loadM3,
      cumulativeM3: cumulative,
    });
  }

  return {
    trucksRequired,
    totalPourDuration,
    firstTruckArrival: schedule[0]?.arrivalTime || startTime,
    lastTruckArrival: schedule[schedule.length - 1]?.arrivalTime || startTime,
    pourEndTime: addMinutes(startTime, totalPourDuration),
    schedule,
    trucksOnSite: Math.min(trucksOnSite, trucksRequired),
  };
}
