// src/data/soil-compaction-calculator.ts
// Soil Compaction Calculator — SHW Series 600 Table 6/1 data, equipment specs, calculations
// References: Specification for Highway Works (SHW) Series 600, Manual of Contract Documents for Highway Works,
// BS 1377, BS EN 13286, TRL Report 611

// ─── Types ───────────────────────────────────────────────────
export type MaterialType =
  | "well_graded_granular"
  | "uniform_granular"
  | "cohesive_dry"
  | "cohesive_wet"
  | "chalk"
  | "rock_fill"
  | "recycled_aggregate"
  | "pfa";

export type EquipmentCategory =
  | "smooth_wheeled_over_2100"
  | "pneumatic_tyred_over_4000"
  | "vibratory_roller_700_1300"
  | "vibratory_roller_1300_2300"
  | "vibratory_roller_2300_5000"
  | "vibratory_roller_over_5000"
  | "vibrating_plate_300_500"
  | "vibrating_plate_500_1100"
  | "vibrating_plate_over_1100"
  | "vibro_tamper_50_75"
  | "vibro_tamper_over_75";

export type CompactionStandard = "method" | "end_product";

export interface MaterialDef {
  id: MaterialType;
  label: string;
  shwClass: string;
  description: string;
  suitableEquipment: EquipmentCategory[];
  endProductTargetMDD: number; // typical target % MDD
  endProductAirVoids: number; // typical max air voids %
}

export interface EquipmentDef {
  id: EquipmentCategory;
  label: string;
  shortLabel: string;
  massRange: string;
  typicalSpeedKmh: number; // operating speed km/h
  typicalWidthM: number; // compaction width m
}

export interface CompactionSpec {
  material: MaterialType;
  equipment: EquipmentCategory;
  maxLayerMm: number; // max compacted layer thickness mm
  minPasses: number; // minimum number of passes
  suitable: boolean; // whether this combo is suitable
  notes: string;
}

export interface ZoneInput {
  id: string;
  name: string;
  totalDepthM: number;
  lengthM: number;
  widthM: number;
  material: MaterialType;
  equipment: EquipmentCategory;
  compactionStandard: CompactionStandard;
  targetMDD: number; // % MDD for end-product
}

export interface ZoneResult {
  zoneId: string;
  zoneName: string;
  spec: CompactionSpec;
  numLifts: number;
  actualLayerMm: number;
  passesPerLift: number;
  totalPasses: number;
  areaM2: number;
  estTimeHours: number;
  suitable: boolean;
  material: MaterialDef;
  equipment: EquipmentDef;
}

export interface EquipmentComparison {
  equipment: EquipmentDef;
  spec: CompactionSpec;
  numLifts: number;
  totalPasses: number;
  estTimeHours: number;
}

// ─── Material Database ───────────────────────────────────────
export const MATERIALS: MaterialDef[] = [
  { id: "well_graded_granular", label: "Well-Graded Granular", shwClass: "1A/1B", description: "Gravel, sand-gravel, crushed rock (SHW Class 1A/1B). Cu > 10, well distributed PSD.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_700_1300", "vibratory_roller_1300_2300", "vibratory_roller_2300_5000", "vibratory_roller_over_5000", "vibrating_plate_500_1100", "vibrating_plate_over_1100"], endProductTargetMDD: 95, endProductAirVoids: 10 },
  { id: "uniform_granular", label: "Uniformly-Graded Granular", shwClass: "1C", description: "Sand, fine gravel, uniform PSD (SHW Class 1C). Cu < 10.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_700_1300", "vibratory_roller_1300_2300", "vibratory_roller_2300_5000", "vibratory_roller_over_5000", "vibrating_plate_500_1100", "vibrating_plate_over_1100"], endProductTargetMDD: 95, endProductAirVoids: 10 },
  { id: "cohesive_dry", label: "Cohesive - Dry of Optimum", shwClass: "2B/2E", description: "Clay, silt, sandy clay placed at or below OMC. Class 2B (dry cohesive, MCV 12-16) per SHW Series 600 Table 6/1, with Class 2E for low-plasticity cohesive. References BS 6031:2009 §8.2.3.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_1300_2300", "vibratory_roller_2300_5000", "vibratory_roller_over_5000", "vibro_tamper_50_75", "vibro_tamper_over_75"], endProductTargetMDD: 95, endProductAirVoids: 5 },
  { id: "cohesive_wet", label: "Cohesive - Wet of Optimum", shwClass: "2A/2D", description: "Clay, silt placed above OMC. Class 2A (wet cohesive, MCV 8-12) per SHW Series 600 Table 6/1; Class 2D for silty cohesive. Requires careful handling to avoid pumping.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_over_5000"], endProductTargetMDD: 90, endProductAirVoids: 10 },
  { id: "chalk", label: "Chalk", shwClass: "3", description: "Chalk fill (SHW Class 3). Breaks down during compaction, avoid over-compaction.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_1300_2300", "vibratory_roller_2300_5000", "vibratory_roller_over_5000"], endProductTargetMDD: 95, endProductAirVoids: 10 },
  { id: "rock_fill", label: "Rock Fill", shwClass: "6P", description: "Rockfill embankment per SHW Series 600 Table 6/1 Class 6P. Particle size > 125mm typical. Heavy vibratory compaction required; max particle size limited to 2/3 of compacted layer thickness.", suitableEquipment: ["vibratory_roller_over_5000"], endProductTargetMDD: 0, endProductAirVoids: 0 },
  { id: "recycled_aggregate", label: "Recycled Aggregate", shwClass: "1A/1B or 6F/6N", description: "Recycled aggregate (crushed concrete, brick, asphalt) classified into existing SHW classes per its tested grading: Class 1A/1B (general granular fill) or 6F/6N (capping / fill to structures) per SHW Series 600 cl. 14 and BS EN 13242.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_1300_2300", "vibratory_roller_2300_5000", "vibratory_roller_over_5000", "vibrating_plate_500_1100", "vibrating_plate_over_1100"], endProductTargetMDD: 95, endProductAirVoids: 10 },
  { id: "pfa", label: "PFA / Pulverised Fuel Ash", shwClass: "7B", description: "Pulverised fuel ash per SHW Series 600 Table 6/1 Class 7B (selected cohesive — PFA for fill to structures). Light compaction; avoid over-working.", suitableEquipment: ["smooth_wheeled_over_2100", "pneumatic_tyred_over_4000", "vibratory_roller_1300_2300", "vibratory_roller_2300_5000", "vibratory_roller_over_5000", "vibrating_plate_over_1100"], endProductTargetMDD: 95, endProductAirVoids: 10 },
];

// ─── Equipment Database ──────────────────────────────────────
export const EQUIPMENT: EquipmentDef[] = [
  { id: "smooth_wheeled_over_2100", label: "Smooth-Wheeled Roller (>2100 kg/m)", shortLabel: "SW Roller >2100", massRange: ">2100 kg per metre width", typicalSpeedKmh: 3, typicalWidthM: 1.5 },
  { id: "pneumatic_tyred_over_4000", label: "Pneumatic-Tyred Roller (>4000 kg/wheel)", shortLabel: "PT Roller >4000", massRange: ">4000 kg per wheel", typicalSpeedKmh: 5, typicalWidthM: 2.0 },
  { id: "vibratory_roller_700_1300", label: "Vibratory Roller (700-1300 kg)", shortLabel: "Vib Roller 700-1300", massRange: "700-1300 kg", typicalSpeedKmh: 2.5, typicalWidthM: 0.8 },
  { id: "vibratory_roller_1300_2300", label: "Vibratory Roller (1300-2300 kg)", shortLabel: "Vib Roller 1300-2300", massRange: "1300-2300 kg", typicalSpeedKmh: 3, typicalWidthM: 1.0 },
  { id: "vibratory_roller_2300_5000", label: "Vibratory Roller (2300-5000 kg)", shortLabel: "Vib Roller 2300-5000", massRange: "2300-5000 kg", typicalSpeedKmh: 3, typicalWidthM: 1.3 },
  { id: "vibratory_roller_over_5000", label: "Vibratory Roller (>5000 kg)", shortLabel: "Vib Roller >5000", massRange: ">5000 kg", typicalSpeedKmh: 3.5, typicalWidthM: 1.7 },
  { id: "vibrating_plate_300_500", label: "Vibrating Plate (300-500 kg)", shortLabel: "Vib Plate 300-500", massRange: "300-500 kg", typicalSpeedKmh: 1.2, typicalWidthM: 0.5 },
  { id: "vibrating_plate_500_1100", label: "Vibrating Plate (500-1100 kg)", shortLabel: "Vib Plate 500-1100", massRange: "500-1100 kg", typicalSpeedKmh: 1.5, typicalWidthM: 0.6 },
  { id: "vibrating_plate_over_1100", label: "Vibrating Plate (>1100 kg)", shortLabel: "Vib Plate >1100", massRange: ">1100 kg", typicalSpeedKmh: 1.8, typicalWidthM: 0.7 },
  { id: "vibro_tamper_50_75", label: "Vibro-Tamper (50-75 kg)", shortLabel: "Vibro-Tamper 50-75", massRange: "50-75 kg", typicalSpeedKmh: 0.5, typicalWidthM: 0.3 },
  { id: "vibro_tamper_over_75", label: "Vibro-Tamper (>75 kg)", shortLabel: "Vibro-Tamper >75", massRange: ">75 kg", typicalSpeedKmh: 0.6, typicalWidthM: 0.35 },
];

// ─── SHW Table 6/1 Compaction Specifications ─────────────────
// Source: MCHW Volume 1 SHW Series 600 Table 6/1
export const COMPACTION_SPECS: CompactionSpec[] = [
  // Well-graded granular (Class 1A/1B)
  { material: "well_graded_granular", equipment: "smooth_wheeled_over_2100", maxLayerMm: 225, minPasses: 8, suitable: true, notes: "Suitable. Deadweight compaction, good for finishing." },
  { material: "well_graded_granular", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 250, minPasses: 6, suitable: true, notes: "Suitable. Good kneading action." },
  { material: "well_graded_granular", equipment: "vibratory_roller_700_1300", maxLayerMm: 150, minPasses: 8, suitable: true, notes: "Suitable for thin lifts. Limited depth effect." },
  { material: "well_graded_granular", equipment: "vibratory_roller_1300_2300", maxLayerMm: 225, minPasses: 6, suitable: true, notes: "Suitable. Good general-purpose combination." },
  { material: "well_graded_granular", equipment: "vibratory_roller_2300_5000", maxLayerMm: 275, minPasses: 4, suitable: true, notes: "Effective. Thicker layers, fewer passes." },
  { material: "well_graded_granular", equipment: "vibratory_roller_over_5000", maxLayerMm: 350, minPasses: 3, suitable: true, notes: "Highly effective. Maximum layer thickness." },
  { material: "well_graded_granular", equipment: "vibrating_plate_300_500", maxLayerMm: 100, minPasses: 8, suitable: false, notes: "Generally not suitable -- insufficient mass for this material." },
  { material: "well_graded_granular", equipment: "vibrating_plate_500_1100", maxLayerMm: 175, minPasses: 8, suitable: true, notes: "Suitable for confined areas. Thin lifts." },
  { material: "well_graded_granular", equipment: "vibrating_plate_over_1100", maxLayerMm: 250, minPasses: 6, suitable: true, notes: "Suitable. Reasonable layer thickness." },
  { material: "well_graded_granular", equipment: "vibro_tamper_50_75", maxLayerMm: 100, minPasses: 4, suitable: false, notes: "Not recommended -- use for trench backfill only." },
  { material: "well_graded_granular", equipment: "vibro_tamper_over_75", maxLayerMm: 150, minPasses: 4, suitable: false, notes: "Not recommended -- use for trench backfill only." },

  // Uniformly-graded granular (Class 1C)
  { material: "uniform_granular", equipment: "smooth_wheeled_over_2100", maxLayerMm: 200, minPasses: 8, suitable: true, notes: "Suitable. May require more passes than well-graded." },
  { material: "uniform_granular", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 225, minPasses: 8, suitable: true, notes: "Suitable. Kneading action helps rearrange particles." },
  { material: "uniform_granular", equipment: "vibratory_roller_700_1300", maxLayerMm: 125, minPasses: 8, suitable: true, notes: "Suitable for thin lifts." },
  { material: "uniform_granular", equipment: "vibratory_roller_1300_2300", maxLayerMm: 200, minPasses: 6, suitable: true, notes: "Good combination for uniform sands." },
  { material: "uniform_granular", equipment: "vibratory_roller_2300_5000", maxLayerMm: 250, minPasses: 4, suitable: true, notes: "Effective for larger areas." },
  { material: "uniform_granular", equipment: "vibratory_roller_over_5000", maxLayerMm: 300, minPasses: 4, suitable: true, notes: "Effective. Thick layers possible." },
  { material: "uniform_granular", equipment: "vibrating_plate_300_500", maxLayerMm: 100, minPasses: 8, suitable: false, notes: "Not recommended -- insufficient compactive effort." },
  { material: "uniform_granular", equipment: "vibrating_plate_500_1100", maxLayerMm: 150, minPasses: 8, suitable: true, notes: "Suitable for confined areas." },
  { material: "uniform_granular", equipment: "vibrating_plate_over_1100", maxLayerMm: 225, minPasses: 6, suitable: true, notes: "Suitable." },
  { material: "uniform_granular", equipment: "vibro_tamper_50_75", maxLayerMm: 75, minPasses: 4, suitable: false, notes: "Not recommended." },
  { material: "uniform_granular", equipment: "vibro_tamper_over_75", maxLayerMm: 100, minPasses: 4, suitable: false, notes: "Not recommended." },

  // Cohesive dry of optimum (Class 2B/2E)
  { material: "cohesive_dry", equipment: "smooth_wheeled_over_2100", maxLayerMm: 200, minPasses: 6, suitable: true, notes: "Suitable. Smooth action avoids over-working." },
  { material: "cohesive_dry", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 225, minPasses: 6, suitable: true, notes: "Good. Kneading action effective for cohesive soils." },
  { material: "cohesive_dry", equipment: "vibratory_roller_700_1300", maxLayerMm: 100, minPasses: 8, suitable: false, notes: "Not recommended -- vibration ineffective on cohesive soils at this mass." },
  { material: "cohesive_dry", equipment: "vibratory_roller_1300_2300", maxLayerMm: 150, minPasses: 6, suitable: true, notes: "Marginal. Vibration provides some benefit on dry cohesive." },
  { material: "cohesive_dry", equipment: "vibratory_roller_2300_5000", maxLayerMm: 200, minPasses: 4, suitable: true, notes: "Suitable. Combination of weight and vibration." },
  { material: "cohesive_dry", equipment: "vibratory_roller_over_5000", maxLayerMm: 250, minPasses: 4, suitable: true, notes: "Effective for large fills." },
  { material: "cohesive_dry", equipment: "vibrating_plate_300_500", maxLayerMm: 75, minPasses: 8, suitable: false, notes: "Not suitable for cohesive soils." },
  { material: "cohesive_dry", equipment: "vibrating_plate_500_1100", maxLayerMm: 100, minPasses: 8, suitable: false, notes: "Not suitable for cohesive soils." },
  { material: "cohesive_dry", equipment: "vibrating_plate_over_1100", maxLayerMm: 150, minPasses: 8, suitable: false, notes: "Not recommended for cohesive soils." },
  { material: "cohesive_dry", equipment: "vibro_tamper_50_75", maxLayerMm: 100, minPasses: 4, suitable: true, notes: "Suitable for trench backfill and confined areas." },
  { material: "cohesive_dry", equipment: "vibro_tamper_over_75", maxLayerMm: 150, minPasses: 3, suitable: true, notes: "Suitable for trench backfill and confined areas." },

  // Cohesive wet of optimum (Class 2A/2D)
  { material: "cohesive_wet", equipment: "smooth_wheeled_over_2100", maxLayerMm: 175, minPasses: 4, suitable: true, notes: "Best option. Minimal disturbance to wet material." },
  { material: "cohesive_wet", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 200, minPasses: 6, suitable: true, notes: "Suitable with care. Avoid rutting." },
  { material: "cohesive_wet", equipment: "vibratory_roller_700_1300", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable -- vibration causes pumping in wet cohesive." },
  { material: "cohesive_wet", equipment: "vibratory_roller_1300_2300", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable -- vibration causes pumping in wet cohesive." },
  { material: "cohesive_wet", equipment: "vibratory_roller_2300_5000", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable -- vibration causes pumping in wet cohesive." },
  { material: "cohesive_wet", equipment: "vibratory_roller_over_5000", maxLayerMm: 200, minPasses: 4, suitable: true, notes: "Only static mode (no vibration). Deadweight only." },
  { material: "cohesive_wet", equipment: "vibrating_plate_300_500", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for wet cohesive." },
  { material: "cohesive_wet", equipment: "vibrating_plate_500_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for wet cohesive." },
  { material: "cohesive_wet", equipment: "vibrating_plate_over_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for wet cohesive." },
  { material: "cohesive_wet", equipment: "vibro_tamper_50_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for wet cohesive." },
  { material: "cohesive_wet", equipment: "vibro_tamper_over_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for wet cohesive." },

  // Chalk (Class 3)
  { material: "chalk", equipment: "smooth_wheeled_over_2100", maxLayerMm: 250, minPasses: 6, suitable: true, notes: "Suitable. Avoid over-compaction which degrades chalk." },
  { material: "chalk", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 250, minPasses: 6, suitable: true, notes: "Suitable. Monitor for over-compaction." },
  { material: "chalk", equipment: "vibratory_roller_700_1300", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not recommended for chalk." },
  { material: "chalk", equipment: "vibratory_roller_1300_2300", maxLayerMm: 200, minPasses: 4, suitable: true, notes: "Suitable with low amplitude. Monitor degradation." },
  { material: "chalk", equipment: "vibratory_roller_2300_5000", maxLayerMm: 250, minPasses: 4, suitable: true, notes: "Suitable with low amplitude. Thicker layers." },
  { material: "chalk", equipment: "vibratory_roller_over_5000", maxLayerMm: 300, minPasses: 3, suitable: true, notes: "Suitable with low amplitude setting." },
  { material: "chalk", equipment: "vibrating_plate_300_500", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for chalk." },
  { material: "chalk", equipment: "vibrating_plate_500_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for chalk." },
  { material: "chalk", equipment: "vibrating_plate_over_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for chalk." },
  { material: "chalk", equipment: "vibro_tamper_50_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for chalk." },
  { material: "chalk", equipment: "vibro_tamper_over_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for chalk." },

  // Rock fill (Class 6P)
  { material: "rock_fill", equipment: "smooth_wheeled_over_2100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for rock fill -- insufficient energy." },
  { material: "rock_fill", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable for rock fill." },
  { material: "rock_fill", equipment: "vibratory_roller_700_1300", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable -- too light." },
  { material: "rock_fill", equipment: "vibratory_roller_1300_2300", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable -- too light." },
  { material: "rock_fill", equipment: "vibratory_roller_2300_5000", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Marginal -- heavy vibratory roller preferred." },
  { material: "rock_fill", equipment: "vibratory_roller_over_5000", maxLayerMm: 600, minPasses: 6, suitable: true, notes: "Only suitable option. Heavy vibratory roller, high amplitude. Max particle 2/3 layer thickness." },
  { material: "rock_fill", equipment: "vibrating_plate_300_500", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "rock_fill", equipment: "vibrating_plate_500_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "rock_fill", equipment: "vibrating_plate_over_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "rock_fill", equipment: "vibro_tamper_50_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "rock_fill", equipment: "vibro_tamper_over_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },

  // Recycled aggregate (Class 1A/1B or 6F/6N depending on grading) — similar to well-graded granular
  { material: "recycled_aggregate", equipment: "smooth_wheeled_over_2100", maxLayerMm: 200, minPasses: 8, suitable: true, notes: "Suitable. Monitor for breakdown of weaker particles." },
  { material: "recycled_aggregate", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 225, minPasses: 6, suitable: true, notes: "Suitable." },
  { material: "recycled_aggregate", equipment: "vibratory_roller_700_1300", maxLayerMm: 125, minPasses: 8, suitable: true, notes: "Suitable for thin lifts." },
  { material: "recycled_aggregate", equipment: "vibratory_roller_1300_2300", maxLayerMm: 200, minPasses: 6, suitable: true, notes: "Good combination." },
  { material: "recycled_aggregate", equipment: "vibratory_roller_2300_5000", maxLayerMm: 250, minPasses: 4, suitable: true, notes: "Effective." },
  { material: "recycled_aggregate", equipment: "vibratory_roller_over_5000", maxLayerMm: 300, minPasses: 3, suitable: true, notes: "Highly effective." },
  { material: "recycled_aggregate", equipment: "vibrating_plate_300_500", maxLayerMm: 75, minPasses: 8, suitable: false, notes: "Not recommended." },
  { material: "recycled_aggregate", equipment: "vibrating_plate_500_1100", maxLayerMm: 150, minPasses: 8, suitable: true, notes: "Suitable for confined areas." },
  { material: "recycled_aggregate", equipment: "vibrating_plate_over_1100", maxLayerMm: 200, minPasses: 6, suitable: true, notes: "Suitable." },
  { material: "recycled_aggregate", equipment: "vibro_tamper_50_75", maxLayerMm: 75, minPasses: 4, suitable: false, notes: "Not recommended." },
  { material: "recycled_aggregate", equipment: "vibro_tamper_over_75", maxLayerMm: 100, minPasses: 4, suitable: false, notes: "Not recommended." },

  // PFA (Class 7B)
  { material: "pfa", equipment: "smooth_wheeled_over_2100", maxLayerMm: 200, minPasses: 8, suitable: true, notes: "Suitable. Light compaction, avoid over-working." },
  { material: "pfa", equipment: "pneumatic_tyred_over_4000", maxLayerMm: 225, minPasses: 6, suitable: true, notes: "Suitable." },
  { material: "pfa", equipment: "vibratory_roller_700_1300", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not recommended." },
  { material: "pfa", equipment: "vibratory_roller_1300_2300", maxLayerMm: 175, minPasses: 6, suitable: true, notes: "Suitable with care." },
  { material: "pfa", equipment: "vibratory_roller_2300_5000", maxLayerMm: 225, minPasses: 4, suitable: true, notes: "Suitable." },
  { material: "pfa", equipment: "vibratory_roller_over_5000", maxLayerMm: 275, minPasses: 4, suitable: true, notes: "Effective." },
  { material: "pfa", equipment: "vibrating_plate_300_500", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "pfa", equipment: "vibrating_plate_500_1100", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "pfa", equipment: "vibrating_plate_over_1100", maxLayerMm: 175, minPasses: 8, suitable: true, notes: "Suitable for confined areas." },
  { material: "pfa", equipment: "vibro_tamper_50_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
  { material: "pfa", equipment: "vibro_tamper_over_75", maxLayerMm: 0, minPasses: 0, suitable: false, notes: "Not suitable." },
];

// ─── Lookup helpers ──────────────────────────────────────────
export function getMaterial(id: MaterialType): MaterialDef {
  return MATERIALS.find(m => m.id === id)!;
}

export function getEquipment(id: EquipmentCategory): EquipmentDef {
  return EQUIPMENT.find(e => e.id === id)!;
}

export function getSpec(mat: MaterialType, equip: EquipmentCategory): CompactionSpec {
  return COMPACTION_SPECS.find(s => s.material === mat && s.equipment === equip) ?? {
    material: mat, equipment: equip, maxLayerMm: 0, minPasses: 0, suitable: false, notes: "No data available for this combination.",
  };
}

export function getSuitableEquipment(mat: MaterialType): EquipmentCategory[] {
  return COMPACTION_SPECS.filter(s => s.material === mat && s.suitable).map(s => s.equipment);
}

// ─── Calculation ─────────────────────────────────────────────
export function calculateZone(zone: ZoneInput): ZoneResult {
  const spec = getSpec(zone.material, zone.equipment);
  const material = getMaterial(zone.material);
  const equipment = getEquipment(zone.equipment);
  const areaM2 = zone.lengthM * zone.widthM;

  if (!spec.suitable || spec.maxLayerMm <= 0) {
    return {
      zoneId: zone.id, zoneName: zone.name, spec, numLifts: 0, actualLayerMm: 0,
      passesPerLift: 0, totalPasses: 0, areaM2, estTimeHours: 0, suitable: false,
      material, equipment,
    };
  }

  const totalDepthMm = zone.totalDepthM * 1000;
  const numLifts = Math.ceil(totalDepthMm / spec.maxLayerMm);
  const actualLayerMm = totalDepthMm / numLifts; // even layers
  const passesPerLift = spec.minPasses;
  const totalPasses = numLifts * passesPerLift;

  // Time estimate: passes * (area / (width * speed))
  // speed in m/h, so km/h * 1000
  const speedMh = equipment.typicalSpeedKmh * 1000;
  const stripsPer = areaM2 > 0 && equipment.typicalWidthM > 0
    ? Math.ceil(zone.widthM / equipment.typicalWidthM) : 1;
  const passTimeMins = speedMh > 0 ? (zone.lengthM * stripsPer / speedMh) * 60 : 0;
  const estTimeHours = (totalPasses * passTimeMins) / 60;

  return {
    zoneId: zone.id, zoneName: zone.name, spec, numLifts, actualLayerMm: Math.round(actualLayerMm),
    passesPerLift, totalPasses, areaM2, estTimeHours, suitable: true,
    material, equipment,
  };
}

export function generateEquipmentComparison(
  material: MaterialType, totalDepthM: number, lengthM: number, widthM: number,
): EquipmentComparison[] {
  const areaM2 = lengthM * widthM;
  return COMPACTION_SPECS
    .filter(s => s.material === material && s.suitable && s.maxLayerMm > 0)
    .map(spec => {
      const equipment = getEquipment(spec.equipment);
      const totalDepthMm = totalDepthM * 1000;
      const numLifts = Math.ceil(totalDepthMm / spec.maxLayerMm);
      const totalPasses = numLifts * spec.minPasses;
      const speedMh = equipment.typicalSpeedKmh * 1000;
      const stripsPer = areaM2 > 0 && equipment.typicalWidthM > 0
        ? Math.ceil(widthM / equipment.typicalWidthM) : 1;
      const passTimeMins = speedMh > 0 ? (lengthM * stripsPer / speedMh) * 60 : 0;
      const estTimeHours = (totalPasses * passTimeMins) / 60;
      return { equipment, spec, numLifts, totalPasses, estTimeHours };
    })
    .sort((a, b) => a.estTimeHours - b.estTimeHours);
}

// ─── End-product testing requirements ────────────────────────
export interface TestingRequirement {
  method: string;
  standard: string;
  description: string;
  frequency: string;
}

export function getTestingRequirements(targetMDD: number): TestingRequirement[] {
  return [
    { method: "Nuclear Density Gauge", standard: "BS 1377-9 / ASTM D6938", description: "Rapid in-situ measurement of dry density and moisture content using gamma radiation.", frequency: "1 per 500 m2 per layer, minimum 3 per layer" },
    { method: "Sand Replacement", standard: "BS 1377-9:1990 Method 3.3", description: "Excavate small hole, measure volume with calibrated sand, weigh extracted soil and determine moisture.", frequency: "1 per 1000 m2 per layer, or as verification of NDG" },
    { method: "Core Cutter", standard: "BS 1377-9:1990 Method 3.2", description: "Drive thin-walled cylinder into soil, extract and weigh. Suitable for cohesive soils only.", frequency: "As alternative to sand replacement for cohesive fills" },
    ...(targetMDD >= 95 ? [
      { method: "Proctor Compaction Test", standard: "BS 1377-4:1990 (2.5 or 4.5 kg rammer)", description: "Laboratory determination of MDD and OMC for the fill material. Required to establish the target density.", frequency: "1 per material source, repeat if material changes" },
    ] : []),
    { method: "Moisture Condition Value (MCV)", standard: "BS 1377-4:1990 Method 5", description: "Laboratory/field test to determine compactability. MCV < 12 indicates material may be too wet to compact.", frequency: "As needed to assess material suitability" },
  ];
}

// ─── Risk colours ────────────────────────────────────────────
export function getSuitabilityColour(suitable: boolean): { bg: string; text: string; border: string; label: string } {
  return suitable
    ? { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", label: "SUITABLE" }
    : { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", label: "NOT SUITABLE" };
}

export const REGULATIONS = [
  "Specification for Highway Works (SHW) Series 600",
  "Manual of Contract Documents for Highway Works (MCHW) Vol. 1",
  "BS 1377 (Soils for civil engineering purposes)",
  "BS EN 13286 (Unbound and hydraulically bound mixtures)",
  "TRL Report 611 (Compaction of fill materials)",
];
