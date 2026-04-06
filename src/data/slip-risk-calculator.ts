// src/data/slip-risk-calculator.ts

// ─── Surface Types ───────────────────────────────────────────
export interface SurfaceType {
  id: string;
  name: string;
  category: string;
  baseScore: number; // 1-5 slip potential (1=low, 5=very high)
  notes: string;
}

export const SURFACE_CATEGORIES = [
  { id: "concrete", label: "Concrete / Cement" },
  { id: "asphalt", label: "Asphalt / Tarmac" },
  { id: "stone", label: "Natural Stone" },
  { id: "tile", label: "Tile / Ceramic" },
  { id: "metal", label: "Metal" },
  { id: "timber", label: "Timber" },
  { id: "composite", label: "Composite / GRP" },
  { id: "ground", label: "Ground / Earth" },
  { id: "temporary", label: "Temporary Works" },
  { id: "other", label: "Other" },
] as const;

export const SURFACE_DATABASE: SurfaceType[] = [
  // Concrete
  { id: "concrete_tamped", name: "Tamped concrete (new)", category: "concrete", baseScore: 1, notes: "Good texture from tamping. Reduces with wear." },
  { id: "concrete_brushed", name: "Brushed / broom-finished concrete", category: "concrete", baseScore: 1, notes: "Good slip resistance. Standard external finish." },
  { id: "concrete_exposed_agg", name: "Exposed aggregate concrete", category: "concrete", baseScore: 1, notes: "Excellent texture from exposed stone." },
  { id: "concrete_float", name: "Float-finished concrete", category: "concrete", baseScore: 3, notes: "Power-floated. Smooth. Slippery when wet." },
  { id: "concrete_polished", name: "Polished concrete", category: "concrete", baseScore: 4, notes: "Very low roughness. High slip risk when wet." },
  { id: "concrete_precast", name: "Precast concrete slab / paving", category: "concrete", baseScore: 2, notes: "Varies by manufacturer. Algae growth risk." },
  { id: "concrete_block_paving", name: "Concrete block paving", category: "concrete", baseScore: 2, notes: "Joints accumulate debris. Moss risk in shade." },
  { id: "concrete_steps", name: "Concrete steps / stairs", category: "concrete", baseScore: 2, notes: "Nosings wear smooth over time." },
  { id: "screed", name: "Sand / cement screed", category: "concrete", baseScore: 3, notes: "Dusting reduces grip. Apply sealer." },

  // Asphalt
  { id: "asphalt_new", name: "New asphalt (macadam)", category: "asphalt", baseScore: 1, notes: "Good initial texture. Bitumen can bleed in heat." },
  { id: "asphalt_worn", name: "Worn / polished asphalt", category: "asphalt", baseScore: 3, notes: "Polished aggregate reduces grip significantly." },
  { id: "asphalt_sma", name: "Stone mastic asphalt (SMA)", category: "asphalt", baseScore: 1, notes: "High texture. Good wet grip." },
  { id: "asphalt_footpath", name: "Tarmac footpath (aged)", category: "asphalt", baseScore: 2, notes: "Foot traffic polishes surface." },
  { id: "asphalt_micro", name: "Micro asphalt / slurry seal", category: "asphalt", baseScore: 2, notes: "Surface dressing. Loose chippings risk initially." },

  // Natural Stone
  { id: "sandstone_riven", name: "Riven sandstone", category: "stone", baseScore: 2, notes: "Natural split face. Good texture." },
  { id: "sandstone_sawn", name: "Sawn sandstone", category: "stone", baseScore: 3, notes: "Smooth-cut. Algae risk when damp." },
  { id: "granite_flamed", name: "Flamed / bush-hammered granite", category: "stone", baseScore: 2, notes: "Textured finish. Good wet performance." },
  { id: "granite_polished", name: "Polished granite", category: "stone", baseScore: 5, notes: "Extremely slippery when wet." },
  { id: "limestone", name: "Limestone paving", category: "stone", baseScore: 3, notes: "Wears smooth. Acid rain risk." },
  { id: "slate", name: "Slate paving / flooring", category: "stone", baseScore: 4, notes: "Naturally smooth. Very slippery wet." },
  { id: "marble", name: "Marble flooring", category: "stone", baseScore: 5, notes: "Interior only. Extremely slippery wet." },
  { id: "yorkstone", name: "Yorkstone flagging", category: "stone", baseScore: 2, notes: "Traditional paving. Texture varies with age." },
  { id: "cobbles", name: "Cobblestones / setts", category: "stone", baseScore: 2, notes: "Good grip but uneven. Trip hazard." },

  // Tile / Ceramic
  { id: "tile_glazed", name: "Glazed ceramic tile", category: "tile", baseScore: 5, notes: "Very smooth glaze. Interior dry areas only." },
  { id: "tile_unglazed", name: "Unglazed ceramic tile", category: "tile", baseScore: 3, notes: "Better than glazed but moderate wet risk." },
  { id: "tile_porcelain", name: "Porcelain tile", category: "tile", baseScore: 4, notes: "Dense and hard. Slippery wet." },
  { id: "tile_quarry", name: "Quarry tile", category: "tile", baseScore: 2, notes: "Good for commercial use when profiled." },
  { id: "tile_anti_slip", name: "Anti-slip profiled tile (R10-R13)", category: "tile", baseScore: 1, notes: "Purpose-made for wet areas." },
  { id: "tile_terracotta", name: "Terracotta tile", category: "tile", baseScore: 3, notes: "Porous. Risk when wet and dirty." },
  { id: "vinyl_sheet", name: "Vinyl sheet flooring", category: "tile", baseScore: 3, notes: "Common welfare/office. Slippery wet." },
  { id: "vinyl_safety", name: "Safety vinyl (slip-resistant)", category: "tile", baseScore: 1, notes: "Quartz/carborundum particles embedded." },
  { id: "rubber_flooring", name: "Rubber flooring", category: "tile", baseScore: 1, notes: "Good grip wet and dry." },
  { id: "linoleum", name: "Linoleum", category: "tile", baseScore: 3, notes: "Can become slippery when polished." },
  { id: "epoxy_coating", name: "Epoxy floor coating (smooth)", category: "tile", baseScore: 4, notes: "Resin coating. Add anti-slip aggregate." },
  { id: "epoxy_anti_slip", name: "Epoxy coating (anti-slip aggregate)", category: "tile", baseScore: 1, notes: "Aggregate in resin. Excellent grip." },

  // Metal
  { id: "steel_smooth", name: "Smooth steel plate", category: "metal", baseScore: 5, notes: "Extremely slippery wet or oily." },
  { id: "steel_chequer", name: "Chequer plate (durbar)", category: "metal", baseScore: 2, notes: "Pattern provides grip. Fill reduces effect." },
  { id: "steel_mesh", name: "Open mesh steel grating", category: "metal", baseScore: 1, notes: "Self-draining. Good grip." },
  { id: "steel_serrated", name: "Serrated bar grating", category: "metal", baseScore: 1, notes: "Best metal walkway option." },
  { id: "aluminium_tread", name: "Aluminium tread plate", category: "metal", baseScore: 3, notes: "Pattern wears with traffic." },
  { id: "cast_iron_cover", name: "Cast iron manhole cover", category: "metal", baseScore: 4, notes: "Pattern fills with debris. Very slippery wet." },
  { id: "steel_stair_nosing", name: "Steel stair nosing (carborundum)", category: "metal", baseScore: 1, notes: "Anti-slip insert in nosing." },

  // Timber
  { id: "timber_decking", name: "Timber decking (untreated)", category: "timber", baseScore: 4, notes: "Algae/moss growth. Very slippery wet." },
  { id: "timber_decking_grooved", name: "Timber decking (grooved / ribbed)", category: "timber", baseScore: 2, notes: "Grooves improve drainage but fill with debris." },
  { id: "timber_decking_treated", name: "Timber decking (anti-slip treated)", category: "timber", baseScore: 2, notes: "Anti-slip strips or coating applied." },
  { id: "plywood", name: "Plywood sheet", category: "timber", baseScore: 3, notes: "Smooth surface. Warps and delaminates when wet." },
  { id: "plywood_anti_slip", name: "Anti-slip plywood (mesh face)", category: "timber", baseScore: 1, notes: "Wire mesh bonded to face. Good for formwork." },
  { id: "scaffold_board", name: "Scaffold board", category: "timber", baseScore: 2, notes: "Rough-sawn grain provides grip. Mud/ice risk." },
  { id: "timber_staircase", name: "Timber staircase (interior)", category: "timber", baseScore: 3, notes: "Varnished/painted treads can be slippery." },
  { id: "timber_hoarding", name: "Timber hoarding walkway", category: "timber", baseScore: 3, notes: "Public footway diversion. Wet leaf/mud risk." },

  // Composite / GRP
  { id: "grp_grating", name: "GRP (fibreglass) grating", category: "composite", baseScore: 1, notes: "Integral anti-slip grit. Excellent wet grip." },
  { id: "grp_flat", name: "GRP flat sheet (anti-slip)", category: "composite", baseScore: 1, notes: "Anti-slip grit surface." },
  { id: "grp_stair_tread", name: "GRP stair tread cover", category: "composite", baseScore: 1, notes: "Retrofit anti-slip nosing/cover." },
  { id: "composite_decking", name: "Composite decking (WPC)", category: "composite", baseScore: 2, notes: "Wood-plastic composite. Better than timber wet." },

  // Ground / Earth
  { id: "compacted_gravel", name: "Compacted gravel / hardcore", category: "ground", baseScore: 2, notes: "Good when dry. Loose when wet." },
  { id: "loose_gravel", name: "Loose gravel", category: "ground", baseScore: 3, notes: "Unstable underfoot. Rolling hazard." },
  { id: "grass", name: "Grass / turf", category: "ground", baseScore: 3, notes: "Slippery when wet. Uneven ground." },
  { id: "mud", name: "Mud / bare earth (wet)", category: "ground", baseScore: 5, notes: "Extremely slippery. Traction impossible." },
  { id: "clay_soil", name: "Clay soil (exposed)", category: "ground", baseScore: 5, notes: "Clay becomes extremely slippery when wet." },
  { id: "sand", name: "Sand / sandy soil", category: "ground", baseScore: 2, notes: "Loose but generally not slippery." },
  { id: "frozen_ground", name: "Frozen ground / permafrost", category: "ground", baseScore: 4, notes: "Hard but slippery with frost/ice film." },

  // Temporary Works
  { id: "trackway_plastic", name: "Temporary trackway (plastic panels)", category: "temporary", baseScore: 2, notes: "Interlocking panels. Surface pattern critical." },
  { id: "trackway_aluminium", name: "Temporary trackway (aluminium)", category: "temporary", baseScore: 2, notes: "Metal panels. Check for mud/oil buildup." },
  { id: "bog_mats", name: "Bog mats / timber mats", category: "temporary", baseScore: 3, notes: "Heavy timber. Slippery when wet/muddy." },
  { id: "steel_road_plates", name: "Steel road plates", category: "temporary", baseScore: 4, notes: "Extremely slippery when wet. Anti-skid required." },
  { id: "tarpaulin", name: "Tarpaulin / sheeting on ground", category: "temporary", baseScore: 5, notes: "Zero grip when wet. Remove from walkways." },
  { id: "protection_board", name: "Floor protection board (Correx)", category: "temporary", baseScore: 3, notes: "Smooth plastic. Slides on substrate." },
  { id: "dust_sheet", name: "Dust sheets on floor", category: "temporary", baseScore: 4, notes: "Cotton/poly sheets slide on hard floors." },

  // Other
  { id: "manhole_surround", name: "Manhole/chamber surround (wet)", category: "other", baseScore: 4, notes: "Water, grease, biological growth." },
  { id: "kerb_edge", name: "Kerb edge / dropped crossing", category: "other", baseScore: 2, notes: "Tactile paving generally good grip." },
  { id: "drainage_channel", name: "Drainage channel cover", category: "other", baseScore: 3, notes: "Metal/plastic grating. Check pattern." },
  { id: "escalator_tread", name: "Escalator / travelator tread", category: "other", baseScore: 2, notes: "Grooved metal. Generally adequate." },
  { id: "ramp_concrete", name: "Concrete ramp (no treatment)", category: "other", baseScore: 3, notes: "Gradient amplifies slip risk." },
  { id: "ramp_anti_slip", name: "Ramp with anti-slip coating", category: "other", baseScore: 1, notes: "Coated or textured surface on ramp." },
];

// ─── Contamination Types ─────────────────────────────────────
export interface ContaminationType {
  id: string;
  name: string;
  scoreMod: number; // added to base score
}

export const CONTAMINATION_TYPES: ContaminationType[] = [
  { id: "dry", name: "Dry (clean)", scoreMod: 0 },
  { id: "wet_clean", name: "Wet (clean water)", scoreMod: 2 },
  { id: "wet_soapy", name: "Wet (soapy / detergent)", scoreMod: 3 },
  { id: "wet_oily", name: "Wet (oil / grease / hydraulic fluid)", scoreMod: 4 },
  { id: "mud", name: "Mud / slurry", scoreMod: 3 },
  { id: "ice_frost", name: "Ice / frost", scoreMod: 5 },
  { id: "snow", name: "Snow (compacted)", scoreMod: 4 },
  { id: "dust_sand", name: "Dust / sand / loose grit", scoreMod: 2 },
  { id: "leaves", name: "Leaves / vegetation", scoreMod: 3 },
  { id: "algae_moss", name: "Algae / moss / biological growth", scoreMod: 4 },
  { id: "construction_debris", name: "Construction debris / rubble", scoreMod: 2 },
  { id: "paint_spill", name: "Paint / coating spill", scoreMod: 3 },
  { id: "food_grease", name: "Food / grease (welfare areas)", scoreMod: 3 },
  { id: "cement_slurry", name: "Cement slurry / grout", scoreMod: 3 },
  { id: "bentonite", name: "Bentonite slurry", scoreMod: 4 },
];

// ─── Footwear Types ──────────────────────────────────────────
export interface FootwearType {
  id: string;
  name: string;
  scoreMod: number; // reduction from score (negative = better)
}

export const FOOTWEAR_TYPES: FootwearType[] = [
  { id: "safety_src", name: "Safety boots (SRC rated - slip resistant)", scoreMod: -2 },
  { id: "safety_s3", name: "Safety boots (S3 / S5 rated)", scoreMod: -2 },
  { id: "safety_basic", name: "Safety boots (basic / SB rated)", scoreMod: -1 },
  { id: "wellington", name: "Wellington boots (steel toe)", scoreMod: -1 },
  { id: "waders", name: "Chest waders", scoreMod: 0 },
  { id: "standard_shoe", name: "Standard shoes (no rating)", scoreMod: 0 },
  { id: "trainer", name: "Trainers / sports shoes", scoreMod: 0 },
  { id: "none_defined", name: "No defined footwear policy", scoreMod: 1 },
];

// ─── Environment Factors ─────────────────────────────────────
export interface EnvFactor {
  id: string;
  name: string;
  scoreMod: number;
}

export const ENVIRONMENT_FACTORS: EnvFactor[] = [
  { id: "indoor_dry", name: "Indoor - dry, climate controlled", scoreMod: -1 },
  { id: "indoor_wet", name: "Indoor - wet process area", scoreMod: 1 },
  { id: "outdoor_covered", name: "Outdoor - covered / sheltered", scoreMod: 0 },
  { id: "outdoor_exposed", name: "Outdoor - fully exposed to weather", scoreMod: 1 },
  { id: "gradient_flat", name: "Flat (< 1:20 gradient)", scoreMod: 0 },
  { id: "gradient_mild", name: "Mild slope (1:20 to 1:12)", scoreMod: 1 },
  { id: "gradient_steep", name: "Steep slope (> 1:12)", scoreMod: 2 },
  { id: "drainage_good", name: "Good drainage provision", scoreMod: -1 },
  { id: "drainage_poor", name: "Poor / no drainage", scoreMod: 1 },
  { id: "lighting_good", name: "Good lighting (> 100 lux)", scoreMod: 0 },
  { id: "lighting_poor", name: "Poor lighting (< 50 lux)", scoreMod: 1 },
  { id: "cleaning_regular", name: "Regular cleaning regime", scoreMod: -1 },
  { id: "cleaning_none", name: "No cleaning regime", scoreMod: 1 },
];

// ─── Human Factors ───────────────────────────────────────────
export interface HumanFactor {
  id: string;
  name: string;
  scoreMod: number;
}

export const HUMAN_FACTORS: HumanFactor[] = [
  { id: "rushing", name: "Rushing / time pressure", scoreMod: 1 },
  { id: "carrying", name: "Carrying loads (restricted view)", scoreMod: 1 },
  { id: "pushing", name: "Pushing / pulling equipment", scoreMod: 1 },
  { id: "fatigue", name: "Fatigue (long shifts / overtime)", scoreMod: 1 },
  { id: "unfamiliar", name: "Unfamiliar with area / visitors", scoreMod: 1 },
  { id: "distracted", name: "Distraction (phone / conversation)", scoreMod: 1 },
  { id: "impaired_vision", name: "Impaired visibility (rain / fog / dust)", scoreMod: 1 },
  { id: "stepping_level", name: "Stepping between levels / surfaces", scoreMod: 1 },
];

// ─── Risk Level ──────────────────────────────────────────────
export type RiskLevel = "low" | "medium" | "high" | "very_high";

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 4) return "low";
  if (score <= 7) return "medium";
  if (score <= 10) return "high";
  return "very_high";
}

export const RISK_COLOURS: Record<RiskLevel, { label: string; bg: string; text: string; dot: string; border: string }> = {
  low: { label: "Low Risk", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200" },
  medium: { label: "Medium Risk", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  high: { label: "High Risk", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  very_high: { label: "Very High Risk", bg: "bg-red-100", text: "text-red-900", dot: "bg-red-800", border: "border-red-400" },
};

// ─── Control Measures ────────────────────────────────────────
export interface ControlMeasure {
  id: string;
  name: string;
  applicableRisk: RiskLevel[];
  category: string;
  notes: string;
}

export const CONTROL_MEASURES: ControlMeasure[] = [
  // Surface treatment
  { id: "anti_slip_coating", name: "Apply anti-slip coating / paint", applicableRisk: ["medium", "high", "very_high"], category: "Surface Treatment", notes: "Resin-based anti-slip coating with aggregate. Reapply per manufacturer guidance." },
  { id: "anti_slip_tape", name: "Apply anti-slip tape / strips", applicableRisk: ["medium", "high", "very_high"], category: "Surface Treatment", notes: "Self-adhesive strips on nosings, ramps, walkways. Replace when worn." },
  { id: "etch_texture", name: "Acid etch / bush hammer to add texture", applicableRisk: ["high", "very_high"], category: "Surface Treatment", notes: "Mechanical or chemical texturing of smooth surfaces." },
  { id: "replace_surface", name: "Replace with higher-grip surface", applicableRisk: ["high", "very_high"], category: "Surface Treatment", notes: "Remove and replace smooth surface with profiled/textured alternative." },
  { id: "grp_overlay", name: "Install GRP anti-slip overlay", applicableRisk: ["high", "very_high"], category: "Surface Treatment", notes: "GRP flat sheet or tread covers bonded over existing surface." },
  { id: "stair_nosings", name: "Install carborundum stair nosings", applicableRisk: ["medium", "high", "very_high"], category: "Surface Treatment", notes: "Anti-slip nosings on all stair treads. Contrast colour for visibility." },

  // Contamination control
  { id: "drainage_improve", name: "Improve drainage / falls", applicableRisk: ["medium", "high", "very_high"], category: "Contamination Control", notes: "Add drainage channels, adjust falls, install gullies." },
  { id: "cleaning_regime", name: "Implement regular cleaning regime", applicableRisk: ["low", "medium", "high", "very_high"], category: "Contamination Control", notes: "Scheduled cleaning with appropriate detergent. Wet-vac or squeegee." },
  { id: "spill_procedure", name: "Spill containment / cleanup procedure", applicableRisk: ["medium", "high", "very_high"], category: "Contamination Control", notes: "Spill kits, absorbent granules, immediate cleanup protocol." },
  { id: "canopy_cover", name: "Install canopy / weatherproofing", applicableRisk: ["medium", "high", "very_high"], category: "Contamination Control", notes: "Roof or canopy over walkway to prevent rain/ice contamination." },
  { id: "matting_entrance", name: "Install entrance matting system", applicableRisk: ["medium", "high"], category: "Contamination Control", notes: "Barrier matting at transitions to remove water/mud from footwear." },
  { id: "grit_salt", name: "Gritting / salting programme", applicableRisk: ["high", "very_high"], category: "Contamination Control", notes: "Winter maintenance for ice/frost. Grit bins and scheduled treatment." },
  { id: "leaf_clearance", name: "Regular leaf / vegetation clearance", applicableRisk: ["medium", "high"], category: "Contamination Control", notes: "Autumn maintenance. Prevent algae/moss growth." },
  { id: "algae_treatment", name: "Algaecide / moss treatment", applicableRisk: ["medium", "high", "very_high"], category: "Contamination Control", notes: "Chemical treatment of biological growth. Pressure wash and treat." },
  { id: "boot_wash", name: "Boot wash station", applicableRisk: ["medium", "high"], category: "Contamination Control", notes: "At transition from muddy areas to hard surfaces." },

  // Environmental
  { id: "lighting_improve", name: "Improve lighting levels", applicableRisk: ["medium", "high", "very_high"], category: "Environmental", notes: "Increase to minimum 100 lux external, 200 lux internal walkways." },
  { id: "handrails", name: "Install handrails / guardrails", applicableRisk: ["medium", "high", "very_high"], category: "Environmental", notes: "Handrails on slopes, ramps, stairs. Both sides if >1m wide." },
  { id: "reduce_gradient", name: "Reduce gradient / add steps", applicableRisk: ["high", "very_high"], category: "Environmental", notes: "Ramps steeper than 1:12 should have steps as alternative." },
  { id: "divert_route", name: "Divert pedestrian route", applicableRisk: ["high", "very_high"], category: "Environmental", notes: "Re-route walkway to avoid high-risk surface." },

  // Administrative
  { id: "signage", name: "Slip hazard warning signage", applicableRisk: ["low", "medium", "high", "very_high"], category: "Administrative", notes: "Yellow triangle slip signs. Temporary signs for wet cleaning." },
  { id: "footwear_policy", name: "Mandate slip-resistant footwear (SRC)", applicableRisk: ["medium", "high", "very_high"], category: "Administrative", notes: "PPE policy requiring SRC-rated safety footwear." },
  { id: "briefing", name: "Toolbox talk / briefing on slip hazards", applicableRisk: ["low", "medium", "high", "very_high"], category: "Administrative", notes: "Team briefing on specific hazards and precautions." },
  { id: "speed_restrict", name: "Restrict speed / no-run policy", applicableRisk: ["medium", "high"], category: "Administrative", notes: "Slow down signage. No running on site." },
  { id: "temp_closure", name: "Temporary closure of area", applicableRisk: ["very_high"], category: "Administrative", notes: "Close area until surface is treated or conditions improve." },
  { id: "pedestrian_management", name: "Pedestrian traffic management", applicableRisk: ["medium", "high", "very_high"], category: "Administrative", notes: "One-way systems, separate pedestrian routes from vehicles/plant." },
];

// ─── Calculation ─────────────────────────────────────────────
export function calculateSlipScore(
  surfaceBaseScore: number,
  contaminationMod: number,
  footwearMod: number,
  envMods: number[],
  humanMods: number[],
): number {
  const envTotal = envMods.reduce((s, v) => s + v, 0);
  const humanTotal = humanMods.reduce((s, v) => s + v, 0);
  const raw = surfaceBaseScore + contaminationMod + footwearMod + envTotal + humanTotal;
  return Math.max(1, Math.min(15, raw)); // clamp 1-15
}

export function getApplicableControls(risk: RiskLevel): ControlMeasure[] {
  return CONTROL_MEASURES.filter(c => c.applicableRisk.includes(risk));
}
