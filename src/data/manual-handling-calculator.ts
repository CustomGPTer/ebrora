// src/data/manual-handling-calculator.ts
// Manual Handling Risk Score Calculator — Task Library, Scoring Tables, and Controls
// HSE MAC (L23) + RAPP methodology. Manual Handling Operations Regulations 1992.

// ─── Handling Types ──────────────────────────────────────────────
export type HandlingType = 'lift' | 'carry' | 'team' | 'push-pull';

export const HANDLING_TYPES: { id: HandlingType; label: string; short: string; method: 'MAC' | 'RAPP' }[] = [
  { id: 'lift', label: 'Lift or Lower', short: 'Lift', method: 'MAC' },
  { id: 'carry', label: 'Carry', short: 'Carry', method: 'MAC' },
  { id: 'team', label: 'Team Handling', short: 'Team', method: 'MAC' },
  { id: 'push-pull', label: 'Push or Pull', short: 'Push/Pull', method: 'RAPP' },
];

// ─── Task Library Categories ─────────────────────────────────────
export type TaskCategory =
  | 'Highways' | 'Groundworks' | 'Utilities' | 'Drainage'
  | 'Reinforcement' | 'Concrete' | 'Temporary Works' | 'Plant'
  | 'Logistics' | 'General' | 'Demolition' | 'Piling'
  | 'Structural Steel' | 'MEICA' | 'Landscaping' | 'Fencing'
  | 'Roofing' | 'Painting & Coating' | 'Surveying';

export const TASK_CATEGORIES: TaskCategory[] = [
  'Highways', 'Groundworks', 'Utilities', 'Drainage',
  'Reinforcement', 'Concrete', 'Temporary Works', 'Plant',
  'Logistics', 'General', 'Demolition', 'Piling',
  'Structural Steel', 'MEICA', 'Landscaping', 'Fencing',
  'Roofing', 'Painting & Coating', 'Surveying',
];

export interface TaskDefinition {
  name: string;
  category: TaskCategory;
  suggestedType: HandlingType;
  notes: string;
}

export const TASK_LIBRARY: TaskDefinition[] = [
  // ── Highways (12) ───────────────────────────────────────────
  { name: 'Lift kerb stones / edging', category: 'Highways', suggestedType: 'lift', notes: 'Often awkward grip; consider kerb lifter or team lift.' },
  { name: 'Lift flag slabs / paving', category: 'Highways', suggestedType: 'team', notes: 'Use slab lifter or vacuum lifter where possible.' },
  { name: 'Lift steel road plates (manual positioning)', category: 'Highways', suggestedType: 'team', notes: 'Mechanical lift preferred; if manual, control pinch points.' },
  { name: 'Handle road pins and baseplates', category: 'Highways', suggestedType: 'carry', notes: 'Bundle and use trolleys to reduce carries.' },
  { name: 'Lay tarmac by hand (shovel and rake)', category: 'Highways', suggestedType: 'lift', notes: 'Repetitive bending; rotate tasks and take breaks.' },
  { name: 'Position bollards or signage posts', category: 'Highways', suggestedType: 'lift', notes: 'Consider post driver or mechanical aids.' },
  { name: 'Carry bags of cold-lay tarmac', category: 'Highways', suggestedType: 'carry', notes: 'Reduce carry distance; use barrow or dumper.' },
  { name: 'Lift drainage gully gratings (highways)', category: 'Highways', suggestedType: 'lift', notes: 'Use grating lifter; avoid finger injuries.' },
  { name: 'Move temporary traffic lights', category: 'Highways', suggestedType: 'push-pull', notes: 'Check wheels and route before moving.' },
  { name: 'Carry traffic cones and signs', category: 'Highways', suggestedType: 'carry', notes: 'Use cone carriers or vehicle-mounted dispensers.' },
  { name: 'Lift and place precast concrete channels', category: 'Highways', suggestedType: 'team', notes: 'Use mechanical aids; coordinate team lifts.' },
  { name: 'Position safety barriers (concrete or steel)', category: 'Highways', suggestedType: 'push-pull', notes: 'Use telehandler or forklift where possible.' },

  // ── Groundworks (14) ────────────────────────────────────────
  { name: 'Carry sand bags or cement bags', category: 'Groundworks', suggestedType: 'carry', notes: 'Consider smaller bags, barrows, or mechanical aids.' },
  { name: 'Move trench sheets / trench box panels', category: 'Groundworks', suggestedType: 'push-pull', notes: 'Use mechanical plant; avoid dragging by hand.' },
  { name: 'Drag / position dewatering hoses', category: 'Groundworks', suggestedType: 'push-pull', notes: 'Check route and posture; use rollers or extra hands.' },
  { name: 'Push wheelbarrow with spoil', category: 'Groundworks', suggestedType: 'push-pull', notes: 'Consider route, slope, wheel condition, and load height.' },
  { name: 'Pull vibrating plate compactor', category: 'Groundworks', suggestedType: 'push-pull', notes: 'Check hand height and vibration controls.' },
  { name: 'Lift timber walings and struts', category: 'Groundworks', suggestedType: 'team', notes: 'Heavy timbers; use mechanical aids or team lift with coordination.' },
  { name: 'Carry aggregates in buckets', category: 'Groundworks', suggestedType: 'carry', notes: 'Reduce bucket fill level; use barrow instead.' },
  { name: 'Position trench struts by hand', category: 'Groundworks', suggestedType: 'lift', notes: 'Awkward posture in trench; consider adjustable props.' },
  { name: 'Shovel material into trench', category: 'Groundworks', suggestedType: 'lift', notes: 'Repetitive; rotate with other tasks; limit shift duration.' },
  { name: 'Lift precast concrete headwalls', category: 'Groundworks', suggestedType: 'team', notes: 'Mechanical lift strongly preferred; check SWL.' },
  { name: 'Move sheet piles by hand', category: 'Groundworks', suggestedType: 'push-pull', notes: 'Use excavator or crane; manual handling as last resort only.' },
  { name: 'Carry geotextile membrane rolls', category: 'Groundworks', suggestedType: 'carry', notes: 'Heavy rolls; use team carry or mechanical handling.' },
  { name: 'Place blinding concrete by hand', category: 'Groundworks', suggestedType: 'lift', notes: 'Repetitive shovelling; limit duration and rotate.' },
  { name: 'Position edge forms / formwork pegs', category: 'Groundworks', suggestedType: 'lift', notes: 'Frequent bending; pre-position materials nearby.' },

  // ── Utilities (10) ──────────────────────────────────────────
  { name: 'Handle ductile iron pipe (6 m)', category: 'Utilities', suggestedType: 'team', notes: 'Use lifting aids and correct slinging; avoid manual handling where possible.' },
  { name: 'Handle cable duct bundles', category: 'Utilities', suggestedType: 'carry', notes: 'Reduce bundle size; consider trolleys.' },
  { name: 'Lift valve chambers / meter boxes', category: 'Utilities', suggestedType: 'lift', notes: 'Use mechanical aids where available; check weight.' },
  { name: 'Carry HDPE pipe coils', category: 'Utilities', suggestedType: 'team', notes: 'Coils can be bulky; use pipe rollers or team carry.' },
  { name: 'Position fire hydrant assemblies', category: 'Utilities', suggestedType: 'lift', notes: 'Heavy; use mechanical handling or team lift.' },
  { name: 'Pull cable through ducting', category: 'Utilities', suggestedType: 'push-pull', notes: 'Use cable winch; manual pulling creates sustained force.' },
  { name: 'Lift electric cable drums', category: 'Utilities', suggestedType: 'team', notes: 'Use drum stand and mechanical handling.' },
  { name: 'Carry gas pipe sections', category: 'Utilities', suggestedType: 'carry', notes: 'Follow gas industry handling guidance; use pipe carriers.' },
  { name: 'Position water stop-tap assemblies', category: 'Utilities', suggestedType: 'lift', notes: 'Awkward reach into excavation; pre-assemble where possible.' },
  { name: 'Handle telecoms cabinets and pillars', category: 'Utilities', suggestedType: 'team', notes: 'Bulky and top-heavy; mechanical handling preferred.' },

  // ── Drainage (10) ───────────────────────────────────────────
  { name: 'Lift gully pots / gratings', category: 'Drainage', suggestedType: 'lift', notes: 'Use lifting keys and mechanical assistance.' },
  { name: 'Lift and place channel drains', category: 'Drainage', suggestedType: 'team', notes: 'Use mechanical aids; ensure good coordination.' },
  { name: 'Handle manhole covers', category: 'Drainage', suggestedType: 'lift', notes: 'Use cover lifter; avoid twisting.' },
  { name: 'Carry clay drainage pipes', category: 'Drainage', suggestedType: 'carry', notes: 'Fragile; use pipe carrier or barrow; avoid dropping.' },
  { name: 'Position precast manhole rings', category: 'Drainage', suggestedType: 'team', notes: 'Always use mechanical plant (excavator or crane).' },
  { name: 'Lift and place manhole step irons', category: 'Drainage', suggestedType: 'lift', notes: 'Awkward posture in chamber; pre-position materials.' },
  { name: 'Handle interceptor tanks / units', category: 'Drainage', suggestedType: 'team', notes: 'Very heavy; mechanical handling mandatory.' },
  { name: 'Carry drainage fittings and couplings', category: 'Drainage', suggestedType: 'carry', notes: 'Small but numerous; use buckets or tool bags.' },
  { name: 'Push dewatering pump into position', category: 'Drainage', suggestedType: 'push-pull', notes: 'Check weight and route; use wheels or skids.' },
  { name: 'Lift precast concrete benching', category: 'Drainage', suggestedType: 'team', notes: 'Heavy precast; use mechanical lifting.' },

  // ── Reinforcement (8) ───────────────────────────────────────
  { name: 'Carry rebar lengths', category: 'Reinforcement', suggestedType: 'carry', notes: 'Use bundles, team carry, or mechanical aids.' },
  { name: 'Lift rebar cages into position', category: 'Reinforcement', suggestedType: 'team', notes: 'Use crane with certified lifting points; never manually lower heavy cages.' },
  { name: 'Position starter bars in footings', category: 'Reinforcement', suggestedType: 'lift', notes: 'Bending and reaching; pre-bend and pre-position.' },
  { name: 'Carry mesh reinforcement sheets', category: 'Reinforcement', suggestedType: 'team', notes: 'Bulky and can spring; use gloves and coordinate.' },
  { name: 'Handle spacers and cover blocks', category: 'Reinforcement', suggestedType: 'carry', notes: 'Small but repetitive; use buckets to reduce trips.' },
  { name: 'Lift coupler boxes and consumables', category: 'Reinforcement', suggestedType: 'carry', notes: 'Keep storage close to work face.' },
  { name: 'Position U-bars and links', category: 'Reinforcement', suggestedType: 'lift', notes: 'Frequent bending; vary posture and rotate tasks.' },
  { name: 'Carry tying wire and bar chairs', category: 'Reinforcement', suggestedType: 'carry', notes: 'Lightweight but frequent; use tool belt.' },

  // ── Concrete (8) ────────────────────────────────────────────
  { name: 'Lift shuttering panels', category: 'Concrete', suggestedType: 'team', notes: 'Use panel lifters / props; avoid overreach.' },
  { name: 'Position concrete pump hose', category: 'Concrete', suggestedType: 'push-pull', notes: 'Heavy when full; use team and mechanical restraints.' },
  { name: 'Carry concrete vibrator units', category: 'Concrete', suggestedType: 'carry', notes: 'Check weight; consider trolley for long distances.' },
  { name: 'Lift and place kicker formwork', category: 'Concrete', suggestedType: 'lift', notes: 'Repetitive; pre-cut and pre-position materials.' },
  { name: 'Handle concrete test cube moulds', category: 'Concrete', suggestedType: 'lift', notes: 'Carry when full — heavy; consider trolley.' },
  { name: 'Push concrete skip into position', category: 'Concrete', suggestedType: 'push-pull', notes: 'Very heavy when loaded; use crane or forklift.' },
  { name: 'Carry bagged grout or admixtures', category: 'Concrete', suggestedType: 'carry', notes: 'Reduce bag size or carry distance; use barrow.' },
  { name: 'Lift curing compound drums', category: 'Concrete', suggestedType: 'team', notes: 'Use drum trolley; avoid manual lifting of full drums.' },

  // ── Temporary Works (8) ─────────────────────────────────────
  { name: 'Carry scaffold boards', category: 'Temporary Works', suggestedType: 'carry', notes: 'Use team carry for long distances.' },
  { name: 'Lift scaffold tubes / standards', category: 'Temporary Works', suggestedType: 'team', notes: 'Coordinate team lifts; avoid overhead hazards.' },
  { name: 'Handle scaffold fittings (bag of couplers)', category: 'Temporary Works', suggestedType: 'carry', notes: 'Heavy bags; limit weight and use hoist.' },
  { name: 'Move Acrow props', category: 'Temporary Works', suggestedType: 'carry', notes: 'Long and heavy; team carry or trolley.' },
  { name: 'Position temporary barriers / hoarding', category: 'Temporary Works', suggestedType: 'push-pull', notes: 'Check wind loading; secure against overturning.' },
  { name: 'Lift propping systems (table formwork)', category: 'Temporary Works', suggestedType: 'team', notes: 'Use mechanical handling; coordinate drops.' },
  { name: 'Carry edge protection components', category: 'Temporary Works', suggestedType: 'carry', notes: 'Multiple trips; use trolley or vehicle.' },
  { name: 'Handle falsework components', category: 'Temporary Works', suggestedType: 'team', notes: 'Specialist equipment; mechanical handling preferred.' },

  // ── Plant (6) ───────────────────────────────────────────────
  { name: 'Move generators / compressors (short reposition)', category: 'Plant', suggestedType: 'push-pull', notes: 'Use wheels and correct towing points; check slope.' },
  { name: 'Lift and carry fuel cans', category: 'Plant', suggestedType: 'carry', notes: 'Use approved containers; limit to 20 L max.' },
  { name: 'Handle hydraulic breaker attachments', category: 'Plant', suggestedType: 'team', notes: 'Very heavy; use excavator to lift and position.' },
  { name: 'Carry plant track mats / bog mats', category: 'Plant', suggestedType: 'team', notes: 'Extremely heavy; always use mechanical handling.' },
  { name: 'Position welfare unit steps / ramps', category: 'Plant', suggestedType: 'team', notes: 'Heavy steel; use telehandler or team lift.' },
  { name: 'Move lighting tower by hand', category: 'Plant', suggestedType: 'push-pull', notes: 'Check tow hitch and route; lock mast before moving.' },

  // ── Logistics (7) ───────────────────────────────────────────
  { name: 'Move traffic management barriers', category: 'Logistics', suggestedType: 'carry', notes: 'Use trolleys or team handling for long carries.' },
  { name: 'Unload delivery vehicles by hand', category: 'Logistics', suggestedType: 'lift', notes: 'Check vehicle height; use tail lift or forklift.' },
  { name: 'Stack materials in storage compound', category: 'Logistics', suggestedType: 'lift', notes: 'Limit stack height; avoid above-shoulder lifts.' },
  { name: 'Carry first aid / spill kit equipment', category: 'Logistics', suggestedType: 'carry', notes: 'Keep lightweight; position near work areas.' },
  { name: 'Push pallet truck with materials', category: 'Logistics', suggestedType: 'push-pull', notes: 'Check route for slopes and obstacles; limit load.' },
  { name: 'Handle skip loading (manual waste disposal)', category: 'Logistics', suggestedType: 'lift', notes: 'Avoid lifting above skip height; use ramp or steps.' },
  { name: 'Move site accommodation furniture', category: 'Logistics', suggestedType: 'push-pull', notes: 'Team lift for heavy items; clear route first.' },

  // ── General (8) ─────────────────────────────────────────────
  { name: 'Lift and carry hand tools and consumables', category: 'General', suggestedType: 'carry', notes: 'Keep loads light; use tool bags and plan route.' },
  { name: 'Carry water containers for testing', category: 'General', suggestedType: 'carry', notes: 'Use smaller containers or wheeled units.' },
  { name: 'Handle fire extinguishers', category: 'General', suggestedType: 'lift', notes: 'Check weight; larger units need two people.' },
  { name: 'Lift manhole keys and cover lifters', category: 'General', suggestedType: 'lift', notes: 'Keep at waist height; store close to use point.' },
  { name: 'Carry surveying equipment (total station / tripod)', category: 'General', suggestedType: 'carry', notes: 'Use cases with wheels; limit carry distance.' },
  { name: 'Move document storage boxes', category: 'General', suggestedType: 'carry', notes: 'Limit box weight; use trolley for multiple boxes.' },
  { name: 'Handle PPE storage crates', category: 'General', suggestedType: 'carry', notes: 'Keep crates at waist height; limit weight.' },
  { name: 'Lift wheel-stop blocks', category: 'General', suggestedType: 'lift', notes: 'Use mechanical aids for concrete blocks.' },

  // ── Demolition (7) ──────────────────────────────────────────
  { name: 'Handle demolition debris (manual sort)', category: 'Demolition', suggestedType: 'lift', notes: 'Use mechanical sorting; limit manual handling to small items.' },
  { name: 'Carry concrete cutting blades / discs', category: 'Demolition', suggestedType: 'carry', notes: 'Sharp edges; use blade carrier and gloves.' },
  { name: 'Move concrete crusher jaw plates', category: 'Demolition', suggestedType: 'team', notes: 'Extremely heavy; mechanical handling only.' },
  { name: 'Handle asbestos removal waste bags', category: 'Demolition', suggestedType: 'carry', notes: 'Follow licensed procedures; limit bag weight.' },
  { name: 'Position temporary propping during demolition', category: 'Demolition', suggestedType: 'team', notes: 'Specialist operation; coordinate with structural engineer.' },
  { name: 'Carry salvaged materials', category: 'Demolition', suggestedType: 'carry', notes: 'Check weight and condition; avoid sharp edges.' },
  { name: 'Push rubble in wheelbarrow', category: 'Demolition', suggestedType: 'push-pull', notes: 'Check route; avoid overloading barrow.' },

  // ── Piling (6) ──────────────────────────────────────────────
  { name: 'Handle pile reinforcement cages', category: 'Piling', suggestedType: 'team', notes: 'Use crane; manual handling only for positioning guides.' },
  { name: 'Carry tremie pipe sections', category: 'Piling', suggestedType: 'team', notes: 'Long and heavy; use crane or mechanical handling.' },
  { name: 'Position pile casings (hand guidance)', category: 'Piling', suggestedType: 'push-pull', notes: 'Use rig to position; manual guidance only.' },
  { name: 'Handle bentonite hoses and connections', category: 'Piling', suggestedType: 'push-pull', notes: 'Heavy when full; use supports and clamps.' },
  { name: 'Carry piling platform timbers', category: 'Piling', suggestedType: 'team', notes: 'Heavy timbers; use mechanical handling where possible.' },
  { name: 'Lift test cube frames and equipment', category: 'Piling', suggestedType: 'carry', notes: 'Keep near work face; use trolley.' },

  // ── Structural Steel (6) ────────────────────────────────────
  { name: 'Handle steel connection plates / cleats', category: 'Structural Steel', suggestedType: 'carry', notes: 'Heavy for size; use buckets or trolleys.' },
  { name: 'Carry welding equipment and leads', category: 'Structural Steel', suggestedType: 'carry', notes: 'Trailing hazard; coil leads and use trolley.' },
  { name: 'Position holding-down bolts', category: 'Structural Steel', suggestedType: 'lift', notes: 'Set in templates; avoid manual placement in wet concrete.' },
  { name: 'Handle bolt bags for steel erection', category: 'Structural Steel', suggestedType: 'carry', notes: 'Heavy bags; limit weight and hoist to level.' },
  { name: 'Move steel purlins by hand', category: 'Structural Steel', suggestedType: 'team', notes: 'Long members; coordinate team handling carefully.' },
  { name: 'Lift steel decking sheets', category: 'Structural Steel', suggestedType: 'team', notes: 'Wind catch risk; mechanical handling preferred.' },

  // ── MEICA (8) ───────────────────────────────────────────────
  { name: 'Lift pump components', category: 'MEICA', suggestedType: 'team', notes: 'Use chain blocks or crane; check SWL.' },
  { name: 'Carry electrical panels / MCC sections', category: 'MEICA', suggestedType: 'team', notes: 'Very heavy and fragile; mechanical handling required.' },
  { name: 'Handle instrumentation equipment', category: 'MEICA', suggestedType: 'carry', notes: 'Delicate; use padded cases and reduce carry distance.' },
  { name: 'Position valve actuators', category: 'MEICA', suggestedType: 'lift', notes: 'Awkward shape; use mechanical handling where possible.' },
  { name: 'Carry cable tray and ladder rack', category: 'MEICA', suggestedType: 'team', notes: 'Long lengths; team carry or mechanical handling.' },
  { name: 'Lift penstock gates', category: 'MEICA', suggestedType: 'team', notes: 'Always use crane or chain block.' },
  { name: 'Handle GRP covers and walkways', category: 'MEICA', suggestedType: 'team', notes: 'Bulky; check wind loading during handling.' },
  { name: 'Move chemical dosing drums / IBCs', category: 'MEICA', suggestedType: 'push-pull', notes: 'Use drum trolley or forklift; check COSHH.' },

  // ── Landscaping (6) ─────────────────────────────────────────
  { name: 'Carry bags of topsoil / compost', category: 'Landscaping', suggestedType: 'carry', notes: 'Wet soil is heavier; reduce bag size or use barrow.' },
  { name: 'Lift and place paving stones (garden)', category: 'Landscaping', suggestedType: 'lift', notes: 'Repetitive bending; use paving trolley.' },
  { name: 'Handle timber sleepers / edging', category: 'Landscaping', suggestedType: 'team', notes: 'Treated timber is heavy; team lift or mechanical handling.' },
  { name: 'Push lawnmower or turf cutter', category: 'Landscaping', suggestedType: 'push-pull', notes: 'Check ground conditions and slopes.' },
  { name: 'Carry rolls of turf', category: 'Landscaping', suggestedType: 'carry', notes: 'Wet turf is very heavy; limit roll size.' },
  { name: 'Plant trees and shrubs (root ball handling)', category: 'Landscaping', suggestedType: 'team', notes: 'Use mechanical aids for large root balls.' },

  // ── Fencing (6) ─────────────────────────────────────────────
  { name: 'Carry fence panels', category: 'Fencing', suggestedType: 'team', notes: 'Wind catch risk; team carry with wind awareness.' },
  { name: 'Lift fence posts into holes', category: 'Fencing', suggestedType: 'lift', notes: 'Heavy concrete posts; use mechanical post driver.' },
  { name: 'Handle rolls of chain link / mesh', category: 'Fencing', suggestedType: 'carry', notes: 'Heavy rolls; use trolley or vehicle.' },
  { name: 'Position gate posts and frames', category: 'Fencing', suggestedType: 'team', notes: 'Heavy and awkward; coordinate team lift.' },
  { name: 'Carry barbed wire / razor wire rolls', category: 'Fencing', suggestedType: 'carry', notes: 'Laceration risk; use carrying handles and PPE.' },
  { name: 'Drive fence posts by hand (post rammer)', category: 'Fencing', suggestedType: 'lift', notes: 'Above-shoulder work; consider mechanical driver.' },

  // ── Roofing (5) ─────────────────────────────────────────────
  { name: 'Carry roof tiles / slates to scaffold', category: 'Roofing', suggestedType: 'carry', notes: 'Use hoist; avoid carrying up ladders.' },
  { name: 'Lift roof trusses into position', category: 'Roofing', suggestedType: 'team', notes: 'Use crane; manual handling only for positioning guidance.' },
  { name: 'Handle insulation boards', category: 'Roofing', suggestedType: 'carry', notes: 'Bulky; wind catch risk at height.' },
  { name: 'Position lead flashing rolls', category: 'Roofing', suggestedType: 'lift', notes: 'Heavy rolls; hoist to roof level.' },
  { name: 'Carry fascia and soffit boards', category: 'Roofing', suggestedType: 'team', notes: 'Long lengths; coordinate at height.' },

  // ── Painting & Coating (5) ──────────────────────────────────
  { name: 'Carry paint tins and coating drums', category: 'Painting & Coating', suggestedType: 'carry', notes: 'Check weight; use trolley for drums.' },
  { name: 'Lift blast-cleaning equipment', category: 'Painting & Coating', suggestedType: 'team', notes: 'Heavy equipment; mechanical handling.' },
  { name: 'Handle spray equipment and hoses', category: 'Painting & Coating', suggestedType: 'carry', notes: 'Trailing hoses; plan route carefully.' },
  { name: 'Position access cradle equipment', category: 'Painting & Coating', suggestedType: 'team', notes: 'Specialist rigging; mechanical handling required.' },
  { name: 'Carry solvent and cleaning containers', category: 'Painting & Coating', suggestedType: 'carry', notes: 'COSHH controls apply; limit container size.' },

  // ── Surveying (4) ───────────────────────────────────────────
  { name: 'Carry total station and tripod', category: 'Surveying', suggestedType: 'carry', notes: 'Protect instrument; use padded case.' },
  { name: 'Handle GPS equipment and antenna', category: 'Surveying', suggestedType: 'carry', notes: 'Fragile; limit carry distance.' },
  { name: 'Carry survey pegs and stakes (bundle)', category: 'Surveying', suggestedType: 'carry', notes: 'Pointed ends; use carrying bag.' },
  { name: 'Position dumpy level and staff', category: 'Surveying', suggestedType: 'carry', notes: 'Staff is long; watch for overhead cables.' },
];

// ─── MAC Scoring Factors ─────────────────────────────────────────
export interface ScoringOption {
  label: string;
  points: number;
  color: 'green' | 'amber' | 'red' | 'purple';
}

export interface ScoringFactor {
  id: string;
  label: string;
  appliesTo: HandlingType[];
  options: ScoringOption[];
  tooltip?: string;
}

function colorFromPoints(p: number): 'green' | 'amber' | 'red' | 'purple' {
  if (p <= 0) return 'green';
  if (p <= 2) return 'amber';
  if (p <= 4) return 'red';
  return 'purple';
}

export const MAC_FACTORS: ScoringFactor[] = [
  {
    id: 'weight', label: 'Load Weight', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Up to 5 kg', points: 0, color: 'green' },
      { label: '5–10 kg', points: 1, color: 'green' },
      { label: '10–20 kg', points: 2, color: 'amber' },
      { label: '20–30 kg', points: 3, color: 'amber' },
      { label: '30–40 kg', points: 4, color: 'red' },
      { label: 'Over 40 kg', points: 5, color: 'purple' },
    ],
  },
  {
    id: 'reach', label: 'Reach Distance', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Close to body', points: 0, color: 'green' },
      { label: 'Moderate reach', points: 2, color: 'amber' },
      { label: 'Far reach / arms extended', points: 4, color: 'red' },
    ],
  },
  {
    id: 'vertical', label: 'Vertical Lift Zone', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Waist height (best zone)', points: 0, color: 'green' },
      { label: 'Knee to waist', points: 1, color: 'green' },
      { label: 'Waist to shoulder', points: 2, color: 'amber' },
      { label: 'Floor to knee', points: 3, color: 'red' },
      { label: 'Above shoulder', points: 4, color: 'red' },
      { label: 'Floor to above shoulder', points: 5, color: 'purple' },
    ],
  },
  {
    id: 'posture', label: 'Posture / Twist', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Good posture, no twist', points: 0, color: 'green' },
      { label: 'Some bend or slight twist', points: 2, color: 'amber' },
      { label: 'Significant bend and/or twist', points: 4, color: 'red' },
      { label: 'Awkward posture (kneel, crouch, overreach)', points: 5, color: 'purple' },
    ],
  },
  {
    id: 'grip', label: 'Grip / Coupling', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Good grip (handles / stable)', points: 0, color: 'green' },
      { label: 'Fair grip', points: 1, color: 'green' },
      { label: 'Poor grip (no handles / unstable)', points: 3, color: 'red' },
    ],
  },
  {
    id: 'frequency', label: 'Frequency & Duration', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Occasional (short duration)', points: 0, color: 'green' },
      { label: 'Regular (up to 1 hour)', points: 2, color: 'amber' },
      { label: 'Frequent (1–2 hours)', points: 4, color: 'red' },
      { label: 'Very frequent or sustained (over 2 hours)', points: 5, color: 'purple' },
    ],
  },
  {
    id: 'environment', label: 'Environment', appliesTo: ['lift', 'carry', 'team'],
    options: [
      { label: 'Good footing and space', points: 0, color: 'green' },
      { label: 'Some restriction or uneven ground', points: 2, color: 'amber' },
      { label: 'Restricted space / poor footing / poor visibility', points: 3, color: 'red' },
    ],
  },
  {
    id: 'carryDistance', label: 'Carry Distance', appliesTo: ['carry'],
    options: [
      { label: '0–2 m', points: 0, color: 'green' },
      { label: '2–5 m', points: 1, color: 'green' },
      { label: '5–10 m', points: 2, color: 'amber' },
      { label: 'Over 10 m', points: 4, color: 'red' },
    ],
  },
  {
    id: 'teamCoordination', label: 'Team Coordination', appliesTo: ['team'],
    options: [
      { label: 'Good coordination and visibility', points: 1, color: 'green' },
      { label: 'Limited coordination / limited visibility', points: 3, color: 'amber' },
      { label: 'Uneven load / difficult communication', points: 5, color: 'purple' },
    ],
  },
];

// ─── RAPP Scoring Factors ────────────────────────────────────────
export const RAPP_FACTORS: ScoringFactor[] = [
  {
    id: 'startForce', label: 'Start Force', appliesTo: ['push-pull'],
    tooltip: 'How hard is it to get the load moving? Low = slides easily with one hand. Medium = needs a firm push to get going. High = requires significant effort, bracing, or body weight.',
    options: [
      { label: 'Low (easy start)', points: 0, color: 'green' },
      { label: 'Medium (noticeable effort)', points: 3, color: 'amber' },
      { label: 'High (hard start / strain)', points: 5, color: 'red' },
    ],
  },
  {
    id: 'sustainedForce', label: 'Sustained Force', appliesTo: ['push-pull'],
    tooltip: 'How hard is it to keep the load moving? Low = rolls or slides easily once started. Medium = needs steady effort to maintain movement. High = requires continuous significant effort.',
    options: [
      { label: 'Low (easy to keep moving)', points: 0, color: 'green' },
      { label: 'Medium (steady effort)', points: 3, color: 'amber' },
      { label: 'High (hard to keep moving)', points: 5, color: 'red' },
    ],
  },
  {
    id: 'pushDistance', label: 'Distance Moved', appliesTo: ['push-pull'],
    options: [
      { label: 'Up to 5 m', points: 0, color: 'green' },
      { label: '5–20 m', points: 2, color: 'amber' },
      { label: 'Over 20 m', points: 3, color: 'red' },
    ],
  },
  {
    id: 'handHeight', label: 'Hand Height / Posture', appliesTo: ['push-pull'],
    tooltip: 'Where are your hands relative to your body? Around waist is best. Pushing with hands too low (crouching) or too high (above shoulder) increases strain.',
    options: [
      { label: 'Around waist height (best)', points: 0, color: 'green' },
      { label: 'Low or high hand height', points: 2, color: 'amber' },
      { label: 'Awkward posture / twisting', points: 3, color: 'red' },
    ],
  },
  {
    id: 'floorCondition', label: 'Floor Condition & Slope', appliesTo: ['push-pull'],
    options: [
      { label: 'Smooth, level, clear route', points: 0, color: 'green' },
      { label: 'Rough or cluttered route', points: 2, color: 'amber' },
      { label: 'Slope / obstacles / poor surface', points: 5, color: 'purple' },
    ],
  },
  {
    id: 'obstacles', label: 'Obstacles / Space Constraints', appliesTo: ['push-pull'],
    options: [
      { label: 'Clear route and good visibility', points: 0, color: 'green' },
      { label: 'Some constraints', points: 1, color: 'green' },
      { label: 'Significant constraints', points: 3, color: 'red' },
    ],
  },
];

// ─── Risk Bands ──────────────────────────────────────────────────
export interface RiskBand {
  min: number;
  max: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  action: string;
}

export const RISK_BANDS: RiskBand[] = [
  { min: 0, max: 4, label: 'LOW', color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0', textColor: '#166534', action: 'Acceptable risk. Maintain good handling technique and keep existing controls in place. Monitor for changes.' },
  { min: 5, max: 9, label: 'LOW–MODERATE', color: '#65a30d', bgColor: '#f7fee7', borderColor: '#d9f99d', textColor: '#3f6212', action: 'Risk is tolerable but monitor regularly. Consider simple improvements to reduce score further.' },
  { min: 10, max: 14, label: 'MEDIUM', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a', textColor: '#92400e', action: 'Action needed. Identify and implement controls to reduce the risk. Review task design, mechanical aids, and work organisation. Re-score after improvements.' },
  { min: 15, max: 19, label: 'MEDIUM–HIGH', color: '#ea580c', bgColor: '#fff7ed', borderColor: '#fed7aa', textColor: '#9a3412', action: 'Prompt action required. Significant risk of injury. Redesign the task or introduce mechanical handling aids. Do not continue without improved controls. Re-score after changes.' },
  { min: 20, max: 999, label: 'HIGH', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca', textColor: '#991b1b', action: 'Stop and redesign. Unacceptable risk of musculoskeletal injury. Eliminate manual handling or introduce mechanical aids, reduce load weight, redesign the task, or use team handling. Do not proceed until score is reduced. Re-score after redesign.' },
];

export function getRiskBand(score: number): RiskBand {
  return RISK_BANDS.find(b => score >= b.min && score <= b.max) || RISK_BANDS[RISK_BANDS.length - 1];
}

// ─── Suggested Controls ──────────────────────────────────────────
export interface SuggestedControl {
  label: string;
  category: 'engineering' | 'administrative' | 'ppe';
  appliesTo: HandlingType[];
  relevantFactors?: string[];
}

export const SUGGESTED_CONTROLS: SuggestedControl[] = [
  // Engineering controls (best)
  { label: 'Use mechanical lifting aid (hoist, crane, forklift)', category: 'engineering', appliesTo: ['lift', 'carry', 'team'], relevantFactors: ['weight'] },
  { label: 'Use vacuum lifter or slab lifter', category: 'engineering', appliesTo: ['lift', 'team'], relevantFactors: ['weight', 'grip'] },
  { label: 'Use trolley, barrow, or wheeled carrier', category: 'engineering', appliesTo: ['carry'], relevantFactors: ['carryDistance', 'weight'] },
  { label: 'Use conveyor or chute for materials', category: 'engineering', appliesTo: ['lift', 'carry'], relevantFactors: ['frequency'] },
  { label: 'Use drum trolley or pallet truck', category: 'engineering', appliesTo: ['push-pull'], relevantFactors: ['startForce', 'sustainedForce'] },
  { label: 'Install wheels or castors on equipment', category: 'engineering', appliesTo: ['push-pull'], relevantFactors: ['startForce'] },
  { label: 'Reduce load weight (smaller bags, split loads)', category: 'engineering', appliesTo: ['lift', 'carry', 'team'], relevantFactors: ['weight'] },
  { label: 'Provide handles or grip points on loads', category: 'engineering', appliesTo: ['lift', 'carry', 'team'], relevantFactors: ['grip'] },
  { label: 'Adjust work surface height (raise or lower)', category: 'engineering', appliesTo: ['lift', 'carry', 'team'], relevantFactors: ['vertical'] },
  { label: 'Improve floor surface (repair, level, clean)', category: 'engineering', appliesTo: ['push-pull', 'lift', 'carry', 'team'], relevantFactors: ['environment', 'floorCondition'] },
  { label: 'Improve lighting in work area', category: 'engineering', appliesTo: ['lift', 'carry', 'team', 'push-pull'], relevantFactors: ['environment', 'obstacles'] },
  { label: 'Clear route and remove obstacles', category: 'engineering', appliesTo: ['push-pull', 'carry'], relevantFactors: ['obstacles', 'environment'] },
  // Administrative controls
  { label: 'Rotate tasks to reduce repetition', category: 'administrative', appliesTo: ['lift', 'carry', 'team', 'push-pull'], relevantFactors: ['frequency'] },
  { label: 'Provide manual handling training', category: 'administrative', appliesTo: ['lift', 'carry', 'team', 'push-pull'] },
  { label: 'Reduce carry distance (reposition storage)', category: 'administrative', appliesTo: ['carry'], relevantFactors: ['carryDistance'] },
  { label: 'Use team lift with briefed coordination', category: 'administrative', appliesTo: ['team'], relevantFactors: ['teamCoordination'] },
  { label: 'Plan route before pushing/pulling', category: 'administrative', appliesTo: ['push-pull'], relevantFactors: ['obstacles', 'floorCondition'] },
  { label: 'Limit shift duration for this task', category: 'administrative', appliesTo: ['lift', 'carry', 'team', 'push-pull'], relevantFactors: ['frequency'] },
  { label: 'Pre-position materials at point of use', category: 'administrative', appliesTo: ['carry', 'lift'], relevantFactors: ['carryDistance', 'frequency'] },
  { label: 'Brief team on lift plan and signals', category: 'administrative', appliesTo: ['team'], relevantFactors: ['teamCoordination'] },
  // PPE
  { label: 'Wear appropriate gloves for grip', category: 'ppe', appliesTo: ['lift', 'carry', 'team', 'push-pull'], relevantFactors: ['grip'] },
  { label: 'Wear safety boots with ankle support', category: 'ppe', appliesTo: ['lift', 'carry', 'team', 'push-pull'], relevantFactors: ['environment'] },
  { label: 'Use knee pads for low-level work', category: 'ppe', appliesTo: ['lift'], relevantFactors: ['vertical', 'posture'] },
];

// ─── HSE Colour Mapping ─────────────────────────────────────────
export const HSE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  green: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Low risk' },
  amber: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: 'Moderate risk' },
  red: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', label: 'High risk' },
  purple: { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff', label: 'Very high risk' },
};
