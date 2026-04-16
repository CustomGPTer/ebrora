// src/data/excavation-batter-angle-calculator.ts
// Excavation Batter Angle Calculator -- open-cut batter angle assessment
// References: BS 6031:2009 (Code of Practice for Earthworks), BS EN 1997-1 (Eurocode 7),
// HSE HSG150/HSG47, CIRIA R97 (Trenching practice), CIRIA C760 (embedded retaining walls,
// cross-reference only for the "batter not viable" exit path).

// ─── Types ───────────────────────────────────────────────────────

export type SoilCategory =
  | "rock-competent"
  | "rock-weak"
  | "very-stiff-clay"
  | "stiff-clay"
  | "firm-clay"
  | "soft-clay"
  | "very-soft-clay"
  | "dense-sand-gravel"
  | "medium-sand-gravel"
  | "loose-sand-gravel"
  | "made-ground-peat-running-sand";

export type SurchargeType =
  | "none"
  | "pedestrian"
  | "light-plant"
  | "heavy-plant"
  | "stockpile"
  | "traffic";

export type WaterCondition =
  | "dry"
  | "damp"
  | "active"
  | "submerged";

export type DurationBand =
  | "very-short"
  | "short"
  | "temporary"
  | "extended";

export type ExcavationShape = "linear-trench" | "rectangular-pit";

export type RagBand = "green" | "amber" | "red";

export interface SoilType {
  id: SoilCategory;
  label: string;
  description: string;
  bs5930: string;
  undrainedShearStrength?: string; // e.g. "Cu 75-150 kPa"
  baseAngleDeg: number | null;      // null = requires support, short-term dry no-surcharge
  supportMandatory: boolean;
  guidance: string;
}

export interface SurchargeOption {
  id: SurchargeType;
  label: string;
  description: string;
  representativePressureKPa?: string;
  angleReductionDeg: number;
}

export interface WaterOption {
  id: WaterCondition;
  label: string;
  description: string;
  angleReductionDeg: number | null;  // null = dewater first
  dewateringRequired?: boolean;
}

export interface DurationOption {
  id: DurationBand;
  label: string;
  description: string;
  angleReductionDeg: number;
  longTermFlag?: boolean;
}

export interface ProjectInputs {
  soil: SoilCategory | null;
  depth: number;                    // metres
  baseWidth: number;                // metres (0 = unknown)
  baseLength: number;               // metres, rectangular-pit only (0 = unknown)
  shape: ExcavationShape;
  surcharge: SurchargeType;
  water: WaterCondition;
  duration: DurationBand;
  standoffMetres: number;            // distance from edge to nearest surcharge (optional)
  competentPersonName: string;       // optional attribution
}

export const DEFAULT_INPUTS: ProjectInputs = {
  soil: null,
  depth: 0,
  baseWidth: 0,
  baseLength: 0,
  shape: "linear-trench",
  surcharge: "none",
  water: "dry",
  duration: "very-short",
  standoffMetres: 0,
  competentPersonName: "",
};

export interface BatterResult {
  viable: boolean;                          // false = support required / not viable
  supportReason?: string;                   // populated when not viable
  finalAngleDeg: number;                    // 0 if not viable
  finalRatio: string;                       // "1:H.HH" (H:V) or "N/A"
  finalRatioH: number;                      // horizontal per 1 vertical (for SVG)
  baseAngleDeg: number;
  totalReductionDeg: number;
  toeToCrestPlanDistance: number;           // metres
  topWidth: number | null;                  // metres (null if baseWidth unknown)
  topLength: number | null;                 // metres (rectangular only)
  volumeFactorVsVertical: number;           // ratio (1.00 = same as vertical)
  volumeIncreasePercent: number;            // percent
  rag: RagBand;
  supportAdvised: boolean;                  // even if viable, whether to consider support anyway
  warnings: string[];
  designerReviewRequired: boolean;
}

// ─── Soil catalogue ─────────────────────────────────────────────

export const SOIL_TYPES: SoilType[] = [
  {
    id: "rock-competent",
    label: "Competent Rock",
    description: "Massive, unweathered rock with tight, unfavourable discontinuities.",
    bs5930: "Strong to very strong rock (UCS >50 MPa)",
    baseAngleDeg: 80,
    supportMandatory: false,
    guidance:
      "Short-term near-vertical batter may be acceptable in competent rock up to ~3 m. Confirm discontinuity orientation and wedge/toppling risk. BS 6031 §5.",
  },
  {
    id: "rock-weak",
    label: "Weak / Weathered Rock",
    description: "Moderately weak or weathered rock (e.g. mudstone, weathered sandstone).",
    bs5930: "Weak to moderately weak rock (UCS 5-25 MPa)",
    baseAngleDeg: 60,
    supportMandatory: false,
    guidance:
      "Slope stability depends on weathering grade and discontinuity pattern. Use conservative angle and monitor for weathering in extended duration.",
  },
  {
    id: "very-stiff-clay",
    label: "Very Stiff / Hard Clay",
    description: "Very stiff clay, indented only with thumbnail.",
    bs5930: "Very stiff to hard clay",
    undrainedShearStrength: "Cu > 150 kPa",
    baseAngleDeg: 60,
    supportMandatory: false,
    guidance:
      "Short-term batter viable. Watch for desiccation cracks and softening in extended duration.",
  },
  {
    id: "stiff-clay",
    label: "Stiff Clay",
    description: "Stiff clay, indented by thumb with pressure.",
    bs5930: "Stiff clay (London Clay, Oxford Clay, boulder clay)",
    undrainedShearStrength: "Cu 75-150 kPa",
    baseAngleDeg: 45,
    supportMandatory: false,
    guidance:
      "Typical UK stiff clay can sustain ~1:1 batter short-term. Softening with water ingress is the main risk.",
  },
  {
    id: "firm-clay",
    label: "Firm Clay",
    description: "Firm clay, can be moulded by strong finger pressure.",
    bs5930: "Firm clay",
    undrainedShearStrength: "Cu 40-75 kPa",
    baseAngleDeg: 34,
    supportMandatory: false,
    guidance:
      "Moderate batter required. Significant reduction if water or surcharge present.",
  },
  {
    id: "soft-clay",
    label: "Soft Clay",
    description: "Soft clay, easily moulded by fingers.",
    bs5930: "Soft clay (alluvium, soft estuarine clay)",
    undrainedShearStrength: "Cu 20-40 kPa",
    baseAngleDeg: 27,
    supportMandatory: false,
    guidance:
      "Shallow batter only. Consider support for any depth greater than ~2 m or where surcharge/water present.",
  },
  {
    id: "very-soft-clay",
    label: "Very Soft Clay",
    description: "Very soft clay, exudes between fingers when squeezed.",
    bs5930: "Very soft clay",
    undrainedShearStrength: "Cu < 20 kPa",
    baseAngleDeg: null,
    supportMandatory: true,
    guidance:
      "Support is required. Very soft clays cannot sustain a stable unsupported batter at working depths. Use trench sheets, box, or sheet piling.",
  },
  {
    id: "dense-sand-gravel",
    label: "Dense Sand & Gravel",
    description: "Well-graded dense granular material, some apparent cohesion.",
    bs5930: "Dense sand/gravel (SPT N > 30)",
    baseAngleDeg: 45,
    supportMandatory: false,
    guidance:
      "Dense granular material can sustain a reasonable batter, but sensitive to vibration and water. Monitor for running conditions.",
  },
  {
    id: "medium-sand-gravel",
    label: "Medium Dense Sand & Gravel",
    description: "Medium dense granular material.",
    bs5930: "Medium dense sand/gravel (SPT N 10-30)",
    baseAngleDeg: 34,
    supportMandatory: false,
    guidance:
      "Batter near angle of repose. Do not permit surcharge within 1.5 m of edge without review.",
  },
  {
    id: "loose-sand-gravel",
    label: "Loose Sand & Gravel",
    description: "Loose granular material, low density, high running potential.",
    bs5930: "Loose sand/gravel (SPT N < 10)",
    baseAngleDeg: 27,
    supportMandatory: false,
    guidance:
      "Near angle of repose. Any water or vibration will cause running. Support strongly preferred over batter in most site conditions.",
  },
  {
    id: "made-ground-peat-running-sand",
    label: "Made Ground / Peat / Running Sand",
    description:
      "Fill, made ground, peat, organic soils, or saturated running sand.",
    bs5930: "Made ground / peat / running sand (heterogeneous/organic)",
    baseAngleDeg: null,
    supportMandatory: true,
    guidance:
      "Support is REQUIRED. Made ground and peat cannot be relied upon for unsupported batter. Running sand requires dewatering plus support.",
  },
];

export function getSoil(id: SoilCategory): SoilType | undefined {
  return SOIL_TYPES.find(s => s.id === id);
}

// ─── Surcharge catalogue ────────────────────────────────────────

export const SURCHARGE_OPTIONS: SurchargeOption[] = [
  {
    id: "none",
    label: "No surcharge",
    description: "No plant, material, or loading within 1.5 m of the excavation edge.",
    angleReductionDeg: 0,
  },
  {
    id: "pedestrian",
    label: "Pedestrian only",
    description: "Foot traffic only; no plant or stored material near the edge.",
    representativePressureKPa: "~2.5 kN/m²",
    angleReductionDeg: 3,
  },
  {
    id: "light-plant",
    label: "Light plant within 1.5 m",
    description: "Small excavator or similar standing close to the edge.",
    representativePressureKPa: "~20 kN/m²",
    angleReductionDeg: 6,
  },
  {
    id: "heavy-plant",
    label: "Heavy plant within 1.5 m",
    description: "Large excavator, dumper, or crane standing close to the edge.",
    representativePressureKPa: "~50 kN/m²",
    angleReductionDeg: 10,
  },
  {
    id: "stockpile",
    label: "Stockpile / spoil within 1.5 m",
    description: "Spoil or stored material along the edge.",
    representativePressureKPa: "~30 kN/m²",
    angleReductionDeg: 8,
  },
  {
    id: "traffic",
    label: "Highway traffic (HA-style)",
    description: "Excavation close to a trafficked highway or access road.",
    representativePressureKPa: "HA UDL equivalent",
    angleReductionDeg: 12,
  },
];

// ─── Water condition catalogue ──────────────────────────────────

export const WATER_OPTIONS: WaterOption[] = [
  {
    id: "dry",
    label: "Dry / above water table",
    description: "Excavation face and base remain dry throughout.",
    angleReductionDeg: 0,
  },
  {
    id: "damp",
    label: "Damp / seepage visible",
    description: "Visible dampness or minor seepage on the face.",
    angleReductionDeg: 5,
  },
  {
    id: "active",
    label: "Active groundwater / below water table",
    description: "Groundwater flowing into the excavation or below the water table.",
    angleReductionDeg: 10,
  },
  {
    id: "submerged",
    label: "Submerged / flooded",
    description:
      "Excavation is submerged or flooding actively. Dewatering required before batter assessment is meaningful.",
    angleReductionDeg: null,
    dewateringRequired: true,
  },
];

// ─── Duration catalogue ─────────────────────────────────────────

export const DURATION_OPTIONS: DurationOption[] = [
  {
    id: "very-short",
    label: "Very short (<= 48 hours)",
    description: "Open for less than 48 hours (e.g. short trench for service connection).",
    angleReductionDeg: 0,
  },
  {
    id: "short",
    label: "Short-term (1 week)",
    description: "Open for up to 1 week.",
    angleReductionDeg: 2,
  },
  {
    id: "temporary",
    label: "Temporary (up to 6 weeks)",
    description: "Open for up to 6 weeks; weathering and softening become relevant.",
    angleReductionDeg: 5,
  },
  {
    id: "extended",
    label: "Extended (> 6 weeks)",
    description:
      "Long-term temporary works. Use long-term shear parameters; designer review recommended.",
    angleReductionDeg: 8,
    longTermFlag: true,
  },
];

// ─── Geometry & stability computation ───────────────────────────

/**
 * Given project inputs, compute the final batter angle and all derived geometry.
 * All reductions are stacked (sum of modifiers). Depth gates and soil "support
 * mandatory" flags short-circuit to "not viable".
 */
export function computeBatter(inputs: ProjectInputs): BatterResult {
  const warnings: string[] = [];
  let designerReviewRequired = false;
  let supportAdvised = false;

  const soil = inputs.soil ? getSoil(inputs.soil) : undefined;
  const surcharge = SURCHARGE_OPTIONS.find(s => s.id === inputs.surcharge) ?? SURCHARGE_OPTIONS[0];
  const water = WATER_OPTIONS.find(w => w.id === inputs.water) ?? WATER_OPTIONS[0];
  const duration = DURATION_OPTIONS.find(d => d.id === inputs.duration) ?? DURATION_OPTIONS[0];

  // ── Early exits: no soil selected ───────────────────────────
  if (!soil) {
    return blankResult("Select a soil type to calculate.", warnings);
  }

  // ── Hard-stop: soil requires support ────────────────────────
  if (soil.supportMandatory || soil.baseAngleDeg === null) {
    return {
      viable: false,
      supportReason: `${soil.label} cannot sustain an unsupported batter. Support system required.`,
      finalAngleDeg: 0,
      finalRatio: "N/A",
      finalRatioH: 0,
      baseAngleDeg: 0,
      totalReductionDeg: 0,
      toeToCrestPlanDistance: 0,
      topWidth: null,
      topLength: null,
      volumeFactorVsVertical: 1,
      volumeIncreasePercent: 0,
      rag: "red",
      supportAdvised: true,
      warnings: [
        ...warnings,
        `Soil category "${soil.label}" requires support per BS 6031 / HSE guidance.`,
      ],
      designerReviewRequired: true,
    };
  }

  // ── Hard-stop: submerged ──────────────────────────────────────
  if (water.dewateringRequired || water.angleReductionDeg === null) {
    return {
      viable: false,
      supportReason:
        "Excavation is submerged or actively flooding. Dewater and reassess before open-cut batter can be designed.",
      finalAngleDeg: 0,
      finalRatio: "N/A",
      finalRatioH: 0,
      baseAngleDeg: soil.baseAngleDeg,
      totalReductionDeg: 0,
      toeToCrestPlanDistance: 0,
      topWidth: null,
      topLength: null,
      volumeFactorVsVertical: 1,
      volumeIncreasePercent: 0,
      rag: "red",
      supportAdvised: true,
      warnings: [
        ...warnings,
        "Open-cut batter cannot be sensibly designed under active flooding.",
      ],
      designerReviewRequired: true,
    };
  }

  // ── Apply modifiers ───────────────────────────────────────────
  const totalReductionDeg =
    (surcharge.angleReductionDeg ?? 0) +
    (water.angleReductionDeg ?? 0) +
    (duration.angleReductionDeg ?? 0);

  const rawAngle = soil.baseAngleDeg - totalReductionDeg;
  const finalAngleDeg = Math.max(0, Math.min(85, rawAngle));

  // ── Depth gates ───────────────────────────────────────────────
  // Depth > 6 m is a hard stop per BS 6031 -- the tool should not report
  // a "viable" batter for depths outside its declared range.
  let depthHardStop = false;
  if (inputs.depth > 6) {
    designerReviewRequired = true;
    supportAdvised = true;
    depthHardStop = true;
    warnings.push(
      "Depth exceeds 6.0 m. This is outside the tool's declared range and outside straightforward open-cut batter practice. BS 6031 requires designer input at this depth; supported excavation is almost always the right answer. Batter geometry not calculated.",
    );
  } else if (inputs.depth > 4.5) {
    designerReviewRequired = true;
    warnings.push(
      "Depth exceeds 4.5 m. Competent person assessment is essential and a temporary works designer should review the batter design.",
    );
  } else if (inputs.depth > 1.2) {
    // normal CDM-assessable range
  } else if (inputs.depth > 0) {
    warnings.push(
      "Depth is shallow (<= 1.2 m). Still assess for ground conditions, services, and worker access.",
    );
  }

  // ── Additional warnings ───────────────────────────────────────
  if (duration.longTermFlag) {
    warnings.push(
      "Extended duration (> 6 weeks). Use long-term / drained shear parameters; softening of cohesive soils is likely.",
    );
    designerReviewRequired = true;
  }
  if (inputs.surcharge !== "none" && inputs.standoffMetres > 0 && inputs.standoffMetres < 1.5) {
    warnings.push(
      `Declared surcharge standoff (${inputs.standoffMetres.toFixed(2)} m) is less than 1.5 m. Modifier already assumes close surcharge; if distance is substantially less, increase the reduction or move the surcharge back.`,
    );
  }
  if (soil.id === "loose-sand-gravel" && inputs.water !== "dry") {
    warnings.push(
      "Loose granular soil with any moisture becomes running sand under vibration. Support strongly preferred over batter.",
    );
    supportAdvised = true;
  }
  if (finalAngleDeg > 5 && finalAngleDeg < 15) {
    warnings.push(
      "Final batter angle is very shallow (< 15°). Practical excavation footprint may be prohibitive. Compare cost and area against a supported excavation.",
    );
  }

  // ── Viability gate ────────────────────────────────────────────
  // "Viable" means a sensible open-cut batter can be reported. It requires:
  //   - a non-zero angle after modifiers
  //   - a non-zero depth (a zero-depth "excavation" is not an excavation)
  //   - depth within the tool's declared 6 m range (designer territory above)
  //   - angle above the red-band floor (5°) -- below this, report support only
  const viable =
    finalAngleDeg > 5 &&
    inputs.depth > 0 &&
    !depthHardStop;

  // Red RAG should always imply supportAdvised -- otherwise the tool gives
  // a contradictory result ("support not advised but batter not viable").
  if (finalAngleDeg <= 5 || depthHardStop) {
    supportAdvised = true;
  }

  // ── RAG band ──────────────────────────────────────────────────
  let rag: RagBand = "green";
  if (finalAngleDeg <= 5 || depthHardStop || !viable) {
    rag = "red";
  } else if (designerReviewRequired || finalAngleDeg < 15 || supportAdvised) {
    rag = "amber";
  }

  // ── Geometry ──────────────────────────────────────────────────
  // H:V ratio where batter angle is measured from horizontal.
  // Horizontal offset per 1 m vertical = cot(angle) = 1 / tan(angle)
  const angleRad = (finalAngleDeg * Math.PI) / 180;
  const finalRatioH = finalAngleDeg > 0 ? 1 / Math.tan(angleRad) : 0;
  const finalRatio = finalAngleDeg > 0 ? `1 : ${finalRatioH.toFixed(2)} (V:H)` : "N/A";
  const toeToCrestPlanDistance = Math.max(0, inputs.depth * finalRatioH);

  // Top-of-excavation dimensions
  let topWidth: number | null = null;
  let topLength: number | null = null;
  if (inputs.baseWidth > 0) {
    // Linear trench: slopes both sides -> top = base + 2 * offset
    // Rectangular pit: slopes all 4 sides -> top = base + 2 * offset (in each dimension)
    topWidth = inputs.baseWidth + 2 * toeToCrestPlanDistance;
  }
  if (inputs.shape === "rectangular-pit" && inputs.baseLength > 0) {
    topLength = inputs.baseLength + 2 * toeToCrestPlanDistance;
  }

  // Volume factor vs vertical cut
  // Linear trench per unit length: A_vertical = depth * baseW
  //                                 A_battered = depth * (baseW + offset) [trapezium]
  //   factor = (baseW + offset) / baseW  provided baseW > 0
  // Rectangular pit (frustum of a pyramid):
  //   V_vertical = depth * baseL * baseW
  //   V_battered = depth/3 * (A_top + A_bot + sqrt(A_top*A_bot))
  let volumeFactorVsVertical = 1;
  if (inputs.baseWidth > 0 && inputs.depth > 0) {
    if (inputs.shape === "linear-trench") {
      const aVert = inputs.baseWidth;
      const aBat = (inputs.baseWidth + 2 * toeToCrestPlanDistance + inputs.baseWidth) / 2;
      volumeFactorVsVertical = aBat / aVert;
    } else if (inputs.shape === "rectangular-pit" && inputs.baseLength > 0) {
      const aBot = inputs.baseWidth * inputs.baseLength;
      const aTop =
        (inputs.baseWidth + 2 * toeToCrestPlanDistance) *
        (inputs.baseLength + 2 * toeToCrestPlanDistance);
      const vVert = aBot * inputs.depth;
      const vBat = (inputs.depth / 3) * (aTop + aBot + Math.sqrt(aTop * aBot));
      volumeFactorVsVertical = vVert > 0 ? vBat / vVert : 1;
    }
  }
  const volumeIncreasePercent = Math.max(0, (volumeFactorVsVertical - 1) * 100);

  return {
    viable,
    supportReason: !viable
      ? (depthHardStop
          ? "Depth exceeds 6.0 m. Open-cut batter is not appropriate at this depth -- engage a temporary works designer and expect a supported excavation."
          : finalAngleDeg <= 5
            ? "Cumulative reductions (surcharge / water / duration) drive the batter angle below 5°. Open-cut batter is not practical; support is required."
            : inputs.depth <= 0
              ? "Enter an excavation depth greater than zero."
              : undefined)
      : undefined,
    finalAngleDeg: viable ? finalAngleDeg : 0,
    finalRatio: viable ? finalRatio : "N/A",
    finalRatioH: viable ? finalRatioH : 0,
    baseAngleDeg: soil.baseAngleDeg,
    totalReductionDeg,
    toeToCrestPlanDistance: viable ? toeToCrestPlanDistance : 0,
    topWidth: viable ? topWidth : null,
    topLength: viable ? topLength : null,
    volumeFactorVsVertical: viable ? volumeFactorVsVertical : 1,
    volumeIncreasePercent: viable ? volumeIncreasePercent : 0,
    rag,
    supportAdvised,
    warnings,
    designerReviewRequired,
  };
}

function blankResult(reason: string, warnings: string[]): BatterResult {
  return {
    viable: false,
    supportReason: reason,
    finalAngleDeg: 0,
    finalRatio: "N/A",
    finalRatioH: 0,
    baseAngleDeg: 0,
    totalReductionDeg: 0,
    toeToCrestPlanDistance: 0,
    topWidth: null,
    topLength: null,
    volumeFactorVsVertical: 1,
    volumeIncreasePercent: 0,
    rag: "amber",
    supportAdvised: false,
    warnings,
    designerReviewRequired: false,
  };
}

// ─── Cross-references ───────────────────────────────────────────

export interface CrossRef {
  slug: string;
  name: string;
  relevance: string;
  onSiteRoute: boolean; // true if live /tools route
}

export const CROSS_REFS: CrossRef[] = [
  {
    slug: "excavation-spoil-calculator",
    name: "Excavation Spoil Calculator",
    relevance:
      "Convert the battered excavation volume into spoil (bulk factor) for haulage planning.",
    onSiteRoute: true,
  },
  {
    slug: "trench-backfill-calculator",
    name: "Trench Backfill Calculator",
    relevance:
      "Calculate backfill zones (bedding, haunch, sidefill, cap) for the reinstated trench.",
    onSiteRoute: true,
  },
  {
    slug: "cable-trench-depth-checker",
    name: "Cable Trench Depth Checker",
    relevance:
      "Check required cover depths for buried services crossed by or adjacent to the excavation.",
    onSiteRoute: true,
  },
  {
    slug: "soil-compaction-calculator",
    name: "Soil Compaction Calculator",
    relevance:
      "Select reinstatement compaction plant and lift thicknesses for the chosen backfill material.",
    onSiteRoute: true,
  },
  {
    slug: "cbr-modulus-converter",
    name: "CBR / Modulus Converter",
    relevance:
      "Convert ground investigation CBR values to modulus for trench formation assessment.",
    onSiteRoute: true,
  },
];

// ─── Regulations table ─────────────────────────────────────────

export const REGULATIONS = [
  "BS 6031:2009 -- Code of practice for earthworks",
  "BS EN 1997-1:2004+A1:2013 -- Eurocode 7 Geotechnical design (slope stability)",
  "BS 5930:2015+A1:2020 -- Code of practice for ground investigations",
  "CDM 2015 -- regulations 22, 25 & 26 (excavations, underground services, traffic routes)",
  "HSE HSG150 -- Health and safety in construction (Excavations chapter)",
  "HSE HSG47 -- Avoiding danger from underground services",
  "CIRIA R97 -- Trenching practice (narrow trenches)",
  "CIRIA C760 -- Guidance on embedded retaining wall design (when batter is not viable)",
];

// ─── HSE / CIRIA contacts & references ─────────────────────────

export const REFERENCE_SOURCES = {
  bs6031: "https://knowledge.bsigroup.com/products/code-of-practice-for-earthworks-2",
  bsEn1997: "https://knowledge.bsigroup.com/products/eurocode-7-geotechnical-design-general-rules",
  hsg150: "https://www.hse.gov.uk/pubns/priced/hsg150.pdf",
  hsg47: "https://www.hse.gov.uk/pubns/priced/hsg47.pdf",
  ciriaR97: "https://www.ciria.org/Memberships/The_Observatory/Books/R97.aspx",
  ciriaC760: "https://www.ciria.org/CIRIA/CIRIA/Item_Detail.aspx?iProductcode=C760",
  hseInfoLine: "0300 003 1747",
};

// ─── Responsible person guidance ───────────────────────────────

export const COMPETENT_PERSON_GUIDANCE = {
  title: "CDM 2015 Competent Person",
  description:
    "CDM 2015 regulation 22 requires all practicable steps to prevent danger from excavation collapse. The determination of a safe batter angle is a competent-person judgement, not merely a calculation.",
  bullets: [
    "On multi-contractor projects, the Principal Contractor is responsible for ensuring excavations are designed and supervised by a competent person.",
    "Batter angle calculations must be reviewed against the actual soil exposed during excavation -- this tool provides an indicative starting point only.",
    "Any deviation from the calculated geometry (softening, fissures, water ingress, unexpected ground) must trigger immediate reassessment.",
    "A permit-to-dig and a daily inspection (reg 26(3) record) must be in place for any excavation deeper than 1.2 m.",
    "Where depth exceeds 4.5 m, a temporary works designer should review the design; above 6 m, designer input is mandatory.",
  ],
};

// ─── Default settings constants (used by the client) ───────────

export const MIN_DEPTH_M = 0.5;
export const MAX_DEPTH_M = 6.0;
export const DESIGNER_DEPTH_THRESHOLD_M = 4.5;
export const ABSOLUTE_DESIGNER_DEPTH_M = 6.0;
export const CLOSE_SURCHARGE_STANDOFF_M = 1.5;
