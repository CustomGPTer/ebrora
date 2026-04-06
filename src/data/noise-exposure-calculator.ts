// src/data/noise-exposure-calculator.ts

// ─── Exposure Action / Limit Values ──────────────────────────
export const LOWER_EAV = 80; // dB(A) LEP,d
export const UPPER_EAV = 85;
export const ELV = 87; // taking account of HPE attenuation
export const PEAK_LOWER = 135; // dB(C) peak
export const PEAK_UPPER = 137;
export const PEAK_ELV = 140;
export const SHIFT_SECONDS = 28800; // 8 hours
export const SHIFT_HOURS = 8;

// ─── Noise Activity Database ─────────────────────────────────
export interface NoiseActivity {
  id: string;
  name: string;
  category: string;
  typicalLow: number;  // dB(A) low end
  typicalHigh: number; // dB(A) high end
  typicalMid: number;  // dB(A) default/mid
  peakLevel: number | null; // dB(C) peak if applicable
  notes: string;
}

export const ACTIVITY_CATEGORIES = [
  { id: "breaking", label: "Breaking / Demolition" },
  { id: "cutting", label: "Cutting / Sawing" },
  { id: "drilling", label: "Drilling" },
  { id: "grinding", label: "Grinding / Scabbling" },
  { id: "piling", label: "Piling" },
  { id: "compaction", label: "Compaction / Rolling" },
  { id: "plant", label: "Plant / Machinery" },
  { id: "concreting", label: "Concreting" },
  { id: "hand_tools", label: "Hand / Power Tools" },
  { id: "general", label: "General Site" },
  { id: "steel", label: "Steelwork / Metalwork" },
  { id: "timber", label: "Timber / Carpentry" },
  { id: "mep", label: "MEP / Services" },
  { id: "road", label: "Highways / Roadworks" },
] as const;

export const ACTIVITY_DATABASE: NoiseActivity[] = [
  // Breaking / Demolition
  { id: "hydraulic_breaker_hand", name: "Hydraulic breaker (hand-held)", category: "breaking", typicalLow: 100, typicalHigh: 115, typicalMid: 107, peakLevel: 140, notes: "Highest noise hand tool on site. Mandatory HPE zone." },
  { id: "hydraulic_breaker_machine", name: "Hydraulic breaker (machine-mounted)", category: "breaking", typicalLow: 95, typicalHigh: 110, typicalMid: 102, peakLevel: 135, notes: "Cab reduces operator exposure. Ground workers at full level." },
  { id: "concrete_muncher", name: "Concrete muncher / pulveriser", category: "breaking", typicalLow: 85, typicalHigh: 100, typicalMid: 92, peakLevel: null, notes: "Lower noise alternative to breakers. Crushing not impact." },
  { id: "demolition_ball", name: "Demolition wrecking ball", category: "breaking", typicalLow: 95, typicalHigh: 110, typicalMid: 103, peakLevel: 140, notes: "Intermittent very high peak impacts." },
  { id: "jackhammer", name: "Pneumatic jackhammer", category: "breaking", typicalLow: 102, typicalHigh: 112, typicalMid: 108, peakLevel: 140, notes: "Compressed air powered. Very high exposure." },
  { id: "kango_hammer", name: "Electric breaker (Kango/Hilti)", category: "breaking", typicalLow: 95, typicalHigh: 108, typicalMid: 100, peakLevel: 135, notes: "Lighter than pneumatic but still above upper EAV." },

  // Cutting / Sawing
  { id: "disc_cutter_petrol", name: "Disc cutter (petrol / Stihl saw)", category: "cutting", typicalLow: 100, typicalHigh: 112, typicalMid: 106, peakLevel: null, notes: "Cutting concrete, tarmac, stone. Very high levels." },
  { id: "disc_cutter_electric", name: "Disc cutter (electric)", category: "cutting", typicalLow: 95, typicalHigh: 105, typicalMid: 100, peakLevel: null, notes: "Slightly lower than petrol. Still above upper EAV." },
  { id: "masonry_bench_saw", name: "Masonry bench saw (table saw)", category: "cutting", typicalLow: 95, typicalHigh: 108, typicalMid: 100, peakLevel: null, notes: "Wet cutting reduces noise slightly." },
  { id: "circular_saw", name: "Circular saw (timber / metal)", category: "cutting", typicalLow: 90, typicalHigh: 102, typicalMid: 96, peakLevel: null, notes: "Blade type and material affect noise." },
  { id: "chop_saw", name: "Chop saw / mitre saw", category: "cutting", typicalLow: 92, typicalHigh: 100, typicalMid: 96, peakLevel: null, notes: "Brief cutting bursts. High peak exposure." },
  { id: "reciprocating_saw", name: "Reciprocating saw (Sawzall)", category: "cutting", typicalLow: 88, typicalHigh: 98, typicalMid: 93, peakLevel: null, notes: "Demolition cutting through mixed materials." },
  { id: "chainsaw", name: "Chainsaw", category: "cutting", typicalLow: 98, typicalHigh: 110, typicalMid: 104, peakLevel: null, notes: "Petrol chainsaw for tree works. Very high levels." },
  { id: "road_saw", name: "Floor / road saw", category: "cutting", typicalLow: 95, typicalHigh: 108, typicalMid: 102, peakLevel: null, notes: "Walk-behind concrete cutting." },
  { id: "pipe_cutter", name: "Pipe cutter (rotary / chain)", category: "cutting", typicalLow: 85, typicalHigh: 100, typicalMid: 92, peakLevel: null, notes: "In-trench cutting. Confined space amplifies." },
  { id: "plasma_cutter", name: "Plasma cutter", category: "cutting", typicalLow: 85, typicalHigh: 100, typicalMid: 92, peakLevel: null, notes: "Metal cutting. Arc noise + air compressor." },

  // Drilling
  { id: "sds_drill", name: "SDS hammer drill", category: "drilling", typicalLow: 90, typicalHigh: 102, typicalMid: 96, peakLevel: 135, notes: "Impact mode generates peak noise. Rotation-only is lower." },
  { id: "core_drill", name: "Diamond core drill", category: "drilling", typicalLow: 80, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Wet diamond coring. Lower noise than hammer." },
  { id: "rock_drill", name: "Rock drill / wagon drill", category: "drilling", typicalLow: 95, typicalHigh: 115, typicalMid: 105, peakLevel: 140, notes: "Percussive rock drilling. Exclusion zone required." },
  { id: "auger_drill", name: "Auger drill (CFA / rotary)", category: "drilling", typicalLow: 78, typicalHigh: 90, typicalMid: 84, peakLevel: null, notes: "Rotary boring. Mainly engine/hydraulic noise." },
  { id: "hand_drill", name: "Cordless / hand drill", category: "drilling", typicalLow: 75, typicalHigh: 90, typicalMid: 82, peakLevel: null, notes: "Light drilling in timber/metal. Generally below EAV." },

  // Grinding / Scabbling
  { id: "angle_grinder_4", name: "Angle grinder (4.5 inch / 115mm)", category: "grinding", typicalLow: 93, typicalHigh: 105, typicalMid: 98, peakLevel: null, notes: "Cutting disc louder than grinding disc." },
  { id: "angle_grinder_9", name: "Angle grinder (9 inch / 230mm)", category: "grinding", typicalLow: 95, typicalHigh: 108, typicalMid: 102, peakLevel: null, notes: "Larger disc = higher noise. Above upper EAV." },
  { id: "scabbler", name: "Floor scabbler", category: "grinding", typicalLow: 100, typicalHigh: 110, typicalMid: 105, peakLevel: 138, notes: "Percussive concrete surface treatment. Very high." },
  { id: "needle_gun", name: "Needle gun / descaler", category: "grinding", typicalLow: 95, typicalHigh: 110, typicalMid: 103, peakLevel: 135, notes: "Metal surface preparation. Sustained high noise." },
  { id: "floor_grinder", name: "Floor grinder / polisher", category: "grinding", typicalLow: 85, typicalHigh: 98, typicalMid: 92, peakLevel: null, notes: "Diamond floor grinding. Lower than scabbling." },
  { id: "wall_chaser", name: "Wall chaser", category: "grinding", typicalLow: 95, typicalHigh: 108, typicalMid: 100, peakLevel: null, notes: "Twin-blade cutting. Confined environment amplifies." },
  { id: "bush_hammer", name: "Bush hammer / concrete planer", category: "grinding", typicalLow: 95, typicalHigh: 108, typicalMid: 102, peakLevel: 138, notes: "Percussive surface treatment." },

  // Piling
  { id: "piling_impact", name: "Impact piling (drop hammer)", category: "piling", typicalLow: 95, typicalHigh: 115, typicalMid: 105, peakLevel: 140, notes: "Highest peak noise on site. Large exclusion zone required." },
  { id: "piling_vibratory", name: "Vibratory piling (sheet piles)", category: "piling", typicalLow: 90, typicalHigh: 105, typicalMid: 98, peakLevel: null, notes: "Continuous vibration noise. Lower than impact." },
  { id: "piling_cfa", name: "CFA / bored piling", category: "piling", typicalLow: 78, typicalHigh: 92, typicalMid: 85, peakLevel: null, notes: "Rotary boring. Quietest piling method." },
  { id: "piling_press", name: "Press-in piling (Giken / silent piler)", category: "piling", typicalLow: 65, typicalHigh: 80, typicalMid: 72, peakLevel: null, notes: "Hydraulic press-in. Quietest sheet pile method." },
  { id: "pile_cropping", name: "Pile cropping", category: "piling", typicalLow: 90, typicalHigh: 110, typicalMid: 100, peakLevel: 138, notes: "Breaking off pile heads. Impact noise." },

  // Compaction / Rolling
  { id: "plate_compactor", name: "Plate compactor (Wacker plate)", category: "compaction", typicalLow: 90, typicalHigh: 102, typicalMid: 96, peakLevel: null, notes: "Vibratory plate. Operator exposed directly." },
  { id: "trench_rammer", name: "Trench rammer (jumping jack)", category: "compaction", typicalLow: 95, typicalHigh: 105, typicalMid: 100, peakLevel: 135, notes: "Impact compactor. Very high operator exposure." },
  { id: "roller_ride_on", name: "Ride-on roller (single drum)", category: "compaction", typicalLow: 80, typicalHigh: 95, typicalMid: 87, peakLevel: null, notes: "Cab reduces exposure. Ground workers at risk." },
  { id: "roller_tandem", name: "Tandem roller", category: "compaction", typicalLow: 80, typicalHigh: 92, typicalMid: 86, peakLevel: null, notes: "Asphalt compaction. Similar to single drum." },
  { id: "pedestrian_roller", name: "Pedestrian roller", category: "compaction", typicalLow: 85, typicalHigh: 98, typicalMid: 90, peakLevel: null, notes: "Walk-behind. Operator at close range." },

  // Plant / Machinery
  { id: "excavator_small", name: "Mini excavator (< 6t)", category: "plant", typicalLow: 75, typicalHigh: 88, typicalMid: 82, peakLevel: null, notes: "In cab: 72-78 dB(A). External at 7m." },
  { id: "excavator_medium", name: "Excavator (6-20t)", category: "plant", typicalLow: 78, typicalHigh: 90, typicalMid: 84, peakLevel: null, notes: "Cab typically attenuates to ~76 dB(A)." },
  { id: "excavator_large", name: "Excavator (> 20t)", category: "plant", typicalLow: 80, typicalHigh: 95, typicalMid: 87, peakLevel: null, notes: "Tracked machine. Higher ground-level noise." },
  { id: "dumper_site", name: "Site dumper (forward tip / swivel)", category: "plant", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "No cab on many site dumpers. Direct operator exposure." },
  { id: "tipper_lorry", name: "Tipper lorry / HGV", category: "plant", typicalLow: 78, typicalHigh: 90, typicalMid: 84, peakLevel: null, notes: "Loading and tipping adds impact noise." },
  { id: "loader", name: "Wheeled loader (loading shovel)", category: "plant", typicalLow: 78, typicalHigh: 90, typicalMid: 84, peakLevel: null, notes: "Cab attenuates. Bucket impact on loading." },
  { id: "telehandler", name: "Telehandler", category: "plant", typicalLow: 78, typicalHigh: 90, typicalMid: 84, peakLevel: null, notes: "Engine noise + hydraulics." },
  { id: "dozer", name: "Bulldozer", category: "plant", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Tracked. Engine + ripper noise." },
  { id: "crane_mobile", name: "Mobile crane", category: "plant", typicalLow: 78, typicalHigh: 92, typicalMid: 85, peakLevel: null, notes: "Engine + slew noise. Banksman exposed." },
  { id: "tower_crane", name: "Tower crane", category: "plant", typicalLow: 72, typicalHigh: 85, typicalMid: 78, peakLevel: null, notes: "Electric drive. Lower than mobile crane." },
  { id: "generator_diesel", name: "Diesel generator", category: "plant", typicalLow: 78, typicalHigh: 98, typicalMid: 88, peakLevel: null, notes: "Continuous running. Canopied units ~10dB lower." },
  { id: "generator_super_silent", name: "Super-silent generator", category: "plant", typicalLow: 60, typicalHigh: 75, typicalMid: 68, peakLevel: null, notes: "Acoustic enclosure. Best practice for welfare." },
  { id: "compressor", name: "Air compressor", category: "plant", typicalLow: 78, typicalHigh: 95, typicalMid: 86, peakLevel: null, notes: "Canopied units reduce by ~10dB." },
  { id: "pump_diesel", name: "Diesel pump (dewatering)", category: "plant", typicalLow: 80, typicalHigh: 95, typicalMid: 87, peakLevel: null, notes: "Running continuously. Position away from work areas." },
  { id: "pump_submersible", name: "Submersible pump", category: "plant", typicalLow: 62, typicalHigh: 78, typicalMid: 70, peakLevel: null, notes: "Submerged = lower airborne noise." },
  { id: "concrete_mixer_truck", name: "Concrete mixer truck", category: "plant", typicalLow: 80, typicalHigh: 90, typicalMid: 85, peakLevel: null, notes: "Drum rotation + engine. Discharge chute impact." },
  { id: "crusher_mobile", name: "Mobile crusher", category: "plant", typicalLow: 90, typicalHigh: 105, typicalMid: 98, peakLevel: 135, notes: "Crushing operations. Large exclusion zone." },
  { id: "screener", name: "Mobile screener", category: "plant", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Vibrating screen + engine." },
  { id: "forklift", name: "Forklift truck", category: "plant", typicalLow: 75, typicalHigh: 90, typicalMid: 82, peakLevel: null, notes: "Diesel louder than electric variants." },
  { id: "mewp", name: "MEWP / cherry picker", category: "plant", typicalLow: 72, typicalHigh: 85, typicalMid: 78, peakLevel: null, notes: "Electric models much quieter." },

  // Concreting
  { id: "concrete_pump", name: "Concrete pump (boom / line)", category: "concreting", typicalLow: 80, typicalHigh: 92, typicalMid: 86, peakLevel: null, notes: "Hydraulic pump + engine. Pipe noise during pour." },
  { id: "poker_vibrator", name: "Concrete poker vibrator", category: "concreting", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Vibration + motor noise at close range." },
  { id: "power_float", name: "Power float / helicopter", category: "concreting", typicalLow: 85, typicalHigh: 98, typicalMid: 92, peakLevel: null, notes: "Petrol engine float. Extended duration exposure." },
  { id: "screed_vibrating", name: "Vibrating screed beam", category: "concreting", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Vibrating beam on fresh concrete." },

  // Hand / Power Tools
  { id: "nail_gun", name: "Nail gun (powder / gas actuated)", category: "hand_tools", typicalLow: 95, typicalHigh: 110, typicalMid: 102, peakLevel: 140, notes: "Very high peak levels. Impulse noise." },
  { id: "impact_wrench", name: "Impact wrench (pneumatic)", category: "hand_tools", typicalLow: 90, typicalHigh: 105, typicalMid: 97, peakLevel: 135, notes: "Bolt tightening. Intermittent high impacts." },
  { id: "impact_driver", name: "Impact driver (cordless)", category: "hand_tools", typicalLow: 85, typicalHigh: 100, typicalMid: 92, peakLevel: null, notes: "Impacting mechanism generates spikes." },
  { id: "rivet_gun", name: "Rivet gun", category: "hand_tools", typicalLow: 92, typicalHigh: 105, typicalMid: 98, peakLevel: 138, notes: "Pneumatic riveting. Impact noise." },
  { id: "staple_gun", name: "Staple gun (pneumatic)", category: "hand_tools", typicalLow: 88, typicalHigh: 100, typicalMid: 94, peakLevel: 135, notes: "High-velocity impulse." },
  { id: "jigsaw", name: "Jigsaw", category: "hand_tools", typicalLow: 80, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Material dependent. Metal cutting louder." },
  { id: "router", name: "Router (woodworking)", category: "hand_tools", typicalLow: 90, typicalHigh: 100, typicalMid: 95, peakLevel: null, notes: "High-speed rotary. Sustained exposure." },
  { id: "planer_hand", name: "Electric planer", category: "hand_tools", typicalLow: 88, typicalHigh: 98, typicalMid: 93, peakLevel: null, notes: "Timber planing. High-speed cutter." },
  { id: "sander_belt", name: "Belt sander", category: "hand_tools", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Extended use. Motor + contact noise." },
  { id: "sander_orbital", name: "Orbital sander", category: "hand_tools", typicalLow: 78, typicalHigh: 90, typicalMid: 84, peakLevel: null, notes: "Lower than belt sander." },
  { id: "hammer_manual", name: "Hand hammer / sledgehammer", category: "hand_tools", typicalLow: 85, typicalHigh: 105, typicalMid: 95, peakLevel: 138, notes: "Impact dependent. Striking steel very high." },

  // General Site
  { id: "reversing_alarm", name: "Reversing alarms (broadband / tonal)", category: "general", typicalLow: 85, typicalHigh: 102, typicalMid: 94, peakLevel: null, notes: "Broadband alarms (white noise) are less disturbing than tonal beepers." },
  { id: "site_background", name: "General site background noise", category: "general", typicalLow: 65, typicalHigh: 82, typicalMid: 74, peakLevel: null, notes: "Ambient noise from multiple sources." },
  { id: "radio_site", name: "Site radio / tannoy", category: "general", typicalLow: 70, typicalHigh: 90, typicalMid: 80, peakLevel: null, notes: "Entertainment + PA system." },
  { id: "pressure_washer", name: "Pressure washer", category: "general", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Engine + high-pressure jet noise." },
  { id: "leaf_blower", name: "Leaf blower (petrol)", category: "general", typicalLow: 90, typicalHigh: 105, typicalMid: 98, peakLevel: null, notes: "High airflow + engine. Above upper EAV." },
  { id: "strimmer", name: "Strimmer / brush cutter", category: "general", typicalLow: 88, typicalHigh: 100, typicalMid: 94, peakLevel: null, notes: "Engine + cutting head noise." },

  // Steelwork / Metalwork
  { id: "steel_erection", name: "Steel erection (bolting)", category: "steel", typicalLow: 85, typicalHigh: 100, typicalMid: 92, peakLevel: 135, notes: "Impact wrench + steel-on-steel contact." },
  { id: "welding_mig", name: "MIG / MMA welding", category: "steel", typicalLow: 78, typicalHigh: 92, typicalMid: 85, peakLevel: null, notes: "Arc noise + wire feed. Grinding often follows." },
  { id: "rebar_tying", name: "Rebar tying (machine / manual)", category: "steel", typicalLow: 72, typicalHigh: 85, typicalMid: 78, peakLevel: null, notes: "Machine tying guns are quieter than manual." },
  { id: "rebar_cutting", name: "Rebar cutting / bending (hydraulic)", category: "steel", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Hydraulic shear + bar impact." },
  { id: "metal_decking", name: "Metal decking installation", category: "steel", typicalLow: 85, typicalHigh: 100, typicalMid: 92, peakLevel: 135, notes: "Sheet handling + fixing. Dropped sheets peak very high." },
  { id: "shot_blasting", name: "Shot blasting", category: "steel", typicalLow: 95, typicalHigh: 110, typicalMid: 102, peakLevel: null, notes: "Abrasive cleaning. Enclosed area amplifies." },

  // Timber / Carpentry
  { id: "table_saw_timber", name: "Table saw (timber)", category: "timber", typicalLow: 90, typicalHigh: 100, typicalMid: 95, peakLevel: null, notes: "Blade type and timber species affect levels." },
  { id: "thicknesser", name: "Planer thicknesser", category: "timber", typicalLow: 92, typicalHigh: 102, typicalMid: 97, peakLevel: null, notes: "High-speed cutter block. Sustained noise." },
  { id: "bandsaw", name: "Bandsaw", category: "timber", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Cutting noise varies with material." },
  { id: "nailing_framing", name: "Framing nailer", category: "timber", typicalLow: 95, typicalHigh: 108, typicalMid: 100, peakLevel: 140, notes: "Gas/pneumatic nailer. Very high peak." },

  // MEP / Services
  { id: "chase_cutting", name: "Chase cutting (wall/floor)", category: "mep", typicalLow: 95, typicalHigh: 108, typicalMid: 102, peakLevel: null, notes: "Twin-disc chasing. Confined space amplifies." },
  { id: "pipe_threading", name: "Pipe threading machine", category: "mep", typicalLow: 80, typicalHigh: 92, typicalMid: 86, peakLevel: null, notes: "Mechanical threading. Motor noise." },
  { id: "duct_installation", name: "Ductwork installation (sheet metal)", category: "mep", typicalLow: 82, typicalHigh: 98, typicalMid: 90, peakLevel: 130, notes: "Sheet metal handling + riveting + cutting." },
  { id: "cable_pulling", name: "Cable pulling (winch)", category: "mep", typicalLow: 72, typicalHigh: 85, typicalMid: 78, peakLevel: null, notes: "Electric winch motor noise." },

  // Highways / Roadworks
  { id: "road_planer", name: "Road planer / milling machine", category: "road", typicalLow: 100, typicalHigh: 112, typicalMid: 106, peakLevel: null, notes: "Drum cutting tarmac/concrete. Very high. Cab reduces operator level." },
  { id: "asphalt_paver", name: "Asphalt paver", category: "road", typicalLow: 82, typicalHigh: 95, typicalMid: 88, peakLevel: null, notes: "Engine + screed vibration." },
  { id: "road_marking", name: "Road marking machine", category: "road", typicalLow: 75, typicalHigh: 88, typicalMid: 82, peakLevel: null, notes: "Engine + pump." },
  { id: "kerb_machine", name: "Kerb laying machine", category: "road", typicalLow: 80, typicalHigh: 92, typicalMid: 86, peakLevel: null, notes: "Hydraulic operation." },
  { id: "traffic_management", name: "Traffic noise (adjacent live carriageway)", category: "road", typicalLow: 70, typicalHigh: 85, typicalMid: 78, peakLevel: null, notes: "Background traffic on roadworks. Speed dependent." },
];

// ─── HPE (Hearing Protection Equipment) ──────────────────────
export interface HPEType {
  id: string;
  name: string;
  snr: number; // Single Number Rating
  type: "earmuff" | "earplug" | "canal_cap" | "banded";
  suitableFor: string;
  notes: string;
}

export const HPE_TYPES: HPEType[] = [
  { id: "foam_plug", name: "Disposable foam earplugs", snr: 37, type: "earplug", suitableFor: "General high noise. Highest attenuation if fitted correctly.", notes: "Roll down and insert. Must be fitted correctly. Cheap and effective." },
  { id: "pre_moulded_plug", name: "Pre-moulded reusable earplugs", snr: 25, type: "earplug", suitableFor: "Moderate noise. Reusable. Easy to clean.", notes: "Flanged design. Lower attenuation than foam. Check fit." },
  { id: "custom_moulded", name: "Custom-moulded earplugs", snr: 28, type: "earplug", suitableFor: "Regular users. Excellent fit and comfort.", notes: "Individually moulded. Higher cost but consistent protection." },
  { id: "banded_plug", name: "Banded ear caps", snr: 20, type: "banded", suitableFor: "Intermittent noise. Easy on/off around neck.", notes: "Lower attenuation. Not for sustained high noise." },
  { id: "earmuff_passive", name: "Passive earmuffs (standard)", snr: 30, type: "earmuff", suitableFor: "General construction. Easy to check compliance.", notes: "Visible on head = easy compliance check. Check seal around ears." },
  { id: "earmuff_high", name: "High-attenuation earmuffs", snr: 36, type: "earmuff", suitableFor: "Very high noise: breaking, piling, cutting.", notes: "Heavier. May cause discomfort in heat. Best protection earmuff." },
  { id: "earmuff_helmet", name: "Helmet-mounted earmuffs", snr: 28, type: "earmuff", suitableFor: "Hard hat wearers. Convenient flip-up.", notes: "Slightly lower attenuation than headband version. Check seal with hat." },
  { id: "earmuff_electronic", name: "Electronic / active earmuffs", snr: 26, type: "earmuff", suitableFor: "Need to communicate while protected.", notes: "Level-dependent. Allows speech, blocks impulse. Higher cost." },
  { id: "dual_plugs_muffs", name: "Dual protection (plugs + muffs)", snr: 42, type: "earmuff", suitableFor: "Extreme noise > 105 dB(A). Piling, breaking.", notes: "Adds ~5dB over best single device. Only for very high exposure." },
];

// ─── Noise status ────────────────────────────────────────────
export type NoiseStatus = "green" | "amber" | "red" | "dark_red";

export function getNoiseStatus(lepd: number): NoiseStatus {
  if (lepd < LOWER_EAV) return "green";
  if (lepd < UPPER_EAV) return "amber";
  if (lepd < ELV) return "red";
  return "dark_red";
}

export const STATUS_COLOURS: Record<NoiseStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  green: { label: "Below 80 dB(A)", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200" },
  amber: { label: "80-85 dB(A) Lower EAV", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  red: { label: "85-87 dB(A) Upper EAV", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  dark_red: { label: "Above 87 dB(A) ELV", bg: "bg-red-100", text: "text-red-900", dot: "bg-red-800", border: "border-red-400" },
};

// ─── Calculations ────────────────────────────────────────────

/** Calculate LEP,d from an array of partial exposures */
export function calculateLEPd(
  exposures: { levelDBA: number; durationMinutes: number }[]
): number {
  if (exposures.length === 0) return 0;
  const t0 = SHIFT_HOURS * 60; // 480 minutes
  let sumPartial = 0;
  for (const e of exposures) {
    if (e.levelDBA <= 0 || e.durationMinutes <= 0) continue;
    sumPartial += Math.pow(10, e.levelDBA / 10) * (e.durationMinutes / t0);
  }
  if (sumPartial <= 0) return 0;
  return 10 * Math.log10(sumPartial);
}

/** Apply HPE attenuation using SNR method with real-world derating per HSE L108 */
export function applyHPEAttenuation(lepd: number, snr: number): number {
  // Real-world derating: effective attenuation = SNR - 4 dB (HSE guidance)
  const effectiveAtten = Math.max(0, snr - 4);
  return lepd - effectiveAtten;
}

/** Calculate partial exposure level for a single task */
export function partialExposure(levelDBA: number, durationMinutes: number): number {
  if (levelDBA <= 0 || durationMinutes <= 0) return 0;
  const t0 = SHIFT_HOURS * 60;
  return 10 * Math.log10(Math.pow(10, levelDBA / 10) * (durationMinutes / t0));
}

/** Recommend minimum HPE based on exposure */
export function recommendHPE(lepd: number): HPEType | null {
  if (lepd < LOWER_EAV) return null;
  // Need to reduce to below 80 ideally, definitely below 85
  const needed = lepd - 75; // target 75 dB(A) with protection (5dB margin)
  // Account for real-world derating: need SNR of (needed + 4)
  const requiredSNR = needed + 4;
  const sorted = [...HPE_TYPES].sort((a, b) => a.snr - b.snr);
  return sorted.find(h => h.snr >= requiredSNR) || sorted[sorted.length - 1];
}

/** Max permitted exposure time at a given noise level to reach a target LEP,d */
export function maxExposureMinutes(levelDBA: number, targetLEPd: number): number {
  if (levelDBA <= targetLEPd) return SHIFT_HOURS * 60; // can work full shift
  // LEP,d = Lp + 10*log10(T/T0) => T = T0 * 10^((target - Lp)/10)
  const t0 = SHIFT_HOURS * 60;
  return t0 * Math.pow(10, (targetLEPd - levelDBA) / 10);
}
