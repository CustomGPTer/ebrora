// src/data/hav-calculator.ts
// HAV Exposure Calculator — HSE Points Method
// Tool library: 151 tools from GAP HAV Guide & manufacturer data

/* ── Types ─────────────────────────────────────────────────────── */

export interface ToolEntry {
  /** Tool type category */
  t: string;
  /** Manufacturer */
  m: string;
  /** Tool name / model */
  n: string;
  /** Model variant (e.g. "Drilling", "Chiselling") */
  v: string | null;
  /** Display string: "Manufacturer | Name (Variant)" */
  d: string;
  /** Typical vibration magnitude m/s2 */
  mag: number;
}

export interface ExposureEntry {
  id: string;
  toolType: string;
  manufacturer: string;
  toolDisplay: string;
  magnitudeLibrary: number;
  magnitudeOverride: number | null;
  magnitudeUsed: number;
  triggerTimeMinutes: number;
  points: number;
  notes: string;
  isCustomTool: boolean;
  customToolName: string;
}

export interface OperativeData {
  id: string;
  name: string;
  entries: ExposureEntry[];
}

export interface DayData {
  date: string; // ISO date string
  operatives: OperativeData[];
}

export type ViewMode = "daily" | "weekly";

export type HAVStatus = "OK" | "EAV" | "ELV";

/* ── Constants ─────────────────────────────────────────────────── */

/** Exposure Action Value — 100 points = A(8) 2.5 m/s2 */
export const EAV_POINTS = 100;
/** Exposure Limit Value — 400 points = A(8) 5.0 m/s2 */
export const ELV_POINTS = 400;

/* ── Tool library (151 tools) ────────────────────────── */

export const TOOL_LIBRARY: ToolEntry[] = [
  { t: "2-Stroke Breaker", m: "Atlas Copco", n: "Cobra PROi", v: null, d: "Atlas Copco | Cobra PROi", mag: 3.8 },
  { t: "2-Stroke Breaker", m: "Wacker", n: "BH55rw", v: null, d: "Wacker | BH55rw", mag: 4.6 },
  { t: "Air Breaker", m: "Atlas", n: "RTEX", v: null, d: "Atlas | RTEX", mag: 5.0 },
  { t: "Air Breaker", m: "Yokota", n: "25PBVC-32", v: null, d: "Yokota | 25PBVC-32", mag: 5.2 },
  { t: "Angle Grinder", m: "Hilti", n: "AG 125-13S", v: "Grinding", d: "Hilti | AG 125-13S (Grinding)", mag: 5.3 },
  { t: "Angle Grinder", m: "Hilti", n: "AG 125-A22", v: "Grinding", d: "Hilti | AG 125-A22 (Grinding)", mag: 3.8 },
  { t: "Angle Grinder", m: "Hilti", n: "AG 230-24D", v: "Grinding", d: "Hilti | AG 230-24D (Grinding)", mag: 5.8 },
  { t: "Angle Grinder", m: "Hilti", n: "Nuron AG 4S-22", v: "Grinding", d: "Hilti | Nuron AG 4S-22 (Grinding)", mag: 5.1 },
  { t: "Angle Grinder", m: "Hilti", n: "Nuron AG 6D-22", v: "Grinding", d: "Hilti | Nuron AG 6D-22 (Grinding)", mag: 4.2 },
  { t: "Angle Grinder", m: "Makita", n: "DGA517RTJ", v: "Sanding", d: "Makita | DGA517RTJ (Sanding)", mag: 2.5 },
  { t: "Angle Grinder", m: "Makita", n: "DGA900PT2", v: "Grinding", d: "Makita | DGA900PT2 (Grinding)", mag: 7.5 },
  { t: "Angle Grinder", m: "Makita", n: "GA9020", v: "Grinding", d: "Makita | GA9020 (Grinding)", mag: 5.5 },
  { t: "Autofeed Screwdriver", m: "Hilti", n: "SMD 57", v: null, d: "Hilti | SMD 57", mag: 1.0 },
  { t: "Autofeed Screwdriver", m: "Makita", n: "DFR550RMJ", v: null, d: "Makita | DFR550RMJ", mag: 2.5 },
  { t: "Biscuit Jointer", m: "Makita", n: "DPJ180RMJ", v: "Cutting MDF", d: "Makita | DPJ180RMJ (Cutting MDF)", mag: 2.5 },
  { t: "Breaker", m: "Hilti", n: "Nuron TE 2000-22", v: "Chiselling", d: "Hilti | Nuron TE 2000-22 (Chiselling)", mag: 2.7 },
  { t: "Breaker", m: "Hilti", n: "Nuron TE 60-22", v: "Chiselling", d: "Hilti | Nuron TE 60-22 (Chiselling)", mag: 9.1 },
  { t: "Chipping Hammer", m: "Atlas", n: "TEX 05P", v: "Breaking concrete", d: "Atlas | TEX 05P (Breaking concrete)", mag: 13.0 },
  { t: "Chipping Hammer", m: "Hilti", n: "TE 300-A36", v: "Chiselling", d: "Hilti | TE 300-A36 (Chiselling)", mag: 7.9 },
  { t: "Chipping Hammer", m: "Yokota", n: "5HDH", v: "Breaking concrete", d: "Yokota | 5HDH (Breaking concrete)", mag: 4.5 },
  { t: "Circular Saw", m: "Hilti", n: "SC 55W", v: "Sawing wood", d: "Hilti | SC 55W (Sawing wood)", mag: 2.12 },
  { t: "Circular Saw", m: "Hilti", n: "SC 70W-A22", v: "Wood (sharp blade)", d: "Hilti | SC 70W-A22 (Wood, sharp blade)", mag: 0.8 },
  { t: "Circular Saw", m: "Hilti", n: "SC 70W-A22", v: "Wood (worn blade)", d: "Hilti | SC 70W-A22 (Wood, worn blade)", mag: 1.3 },
  { t: "Circular Saw", m: "Hilti", n: "SCM 22-A", v: "Metal", d: "Hilti | SCM 22-A (Metal)", mag: 0.82 },
  { t: "Circular Saw", m: "Hilti", n: "SCW 22-A", v: "Wood", d: "Hilti | SCW 22-A (Wood)", mag: 1.2 },
  { t: "Circular Saw", m: "Hilti", n: "WSC 85", v: "Sawing wood", d: "Hilti | WSC 85 (Sawing wood)", mag: 2.3 },
  { t: "Circular Saw", m: "Makita", n: "DHS680RMJ", v: "Wood", d: "Makita | DHS680RMJ (Wood)", mag: 2.5 },
  { t: "Clay Digger", m: "Chicago Pneumatic", n: "FL 0022", v: null, d: "Chicago Pneumatic | FL 0022", mag: 21.9 },
  { t: "Clay Digger", m: "Yokota", n: "TCD-20", v: null, d: "Yokota | TCD-20", mag: 16.0 },
  { t: "Cut Off Saw", m: "Hilti", n: "Nuron DSH 600-22", v: null, d: "Hilti | Nuron DSH 600-22", mag: 1.5 },
  { t: "Cut Off Saw", m: "Husqvarna", n: "K 40", v: null, d: "Husqvarna | K 40", mag: 9.5 },
  { t: "Cut Off Saw", m: "STIHL", n: "TS 410", v: null, d: "STIHL | TS 410", mag: 3.9 },
  { t: "Cut Off Saw", m: "STIHL", n: "TS 420", v: null, d: "STIHL | TS 420", mag: 3.9 },
  { t: "Cut Off Saw", m: "STIHL", n: "TS 480i", v: null, d: "STIHL | TS 480i", mag: 2.2 },
  { t: "Cut Off Saw", m: "Stihl", n: "TSA 230", v: null, d: "Stihl | TSA 230", mag: 3.5 },
  { t: "Demolition Hammer", m: "Atlas", n: "TEX 09PE", v: null, d: "Atlas | TEX 09PE", mag: 4.6 },
  { t: "Demolition Hammer", m: "Atlas", n: "TEX 12PE", v: null, d: "Atlas | TEX 12PE", mag: 5.3 },
  { t: "Demolition Hammer", m: "Hilti", n: "Nuron TE 500-22", v: "Chiselling", d: "Hilti | Nuron TE 500-22 (Chiselling)", mag: 8.7 },
  { t: "Demolition Hammer", m: "Hilti", n: "TE 500-AVR", v: "Chiselling concrete", d: "Hilti | TE 500-AVR (Chiselling concrete)", mag: 6.8 },
  { t: "Demolition Hammer", m: "Hilti", n: "TE 700-AVR", v: "Chiselling concrete", d: "Hilti | TE 700-AVR (Chiselling concrete)", mag: 6.5 },
  { t: "Demolition Hammer", m: "Hilti", n: "TE 800-AVR", v: "Chiselling concrete", d: "Hilti | TE 800-AVR (Chiselling concrete)", mag: 8.0 },
  { t: "Demolition Hammer", m: "Yokota", n: "10HDHVC H", v: null, d: "Yokota | 10HDHVC H", mag: 5.05 },
  { t: "Demolition Hammer", m: "Yokota", n: "12HDHVC H", v: null, d: "Yokota | 12HDHVC H", mag: 5.6 },
  { t: "Diamond Core Drill", m: "Hilti", n: "DD 150", v: "Wet Drilling", d: "Hilti | DD 150 (Wet Drilling)", mag: 7.0 },
  { t: "Diamond Core Drill", m: "Makita", n: "DBM131", v: "Drilling", d: "Makita | DBM131 (Drilling)", mag: 2.5 },
  { t: "Diamond Drill Rig", m: "Hilti", n: "DD 200", v: "Wet Drilling", d: "Hilti | DD 200 (Wet Drilling)", mag: 2.5 },
  { t: "Diamond Drill Rig", m: "Hilti", n: "DD 250", v: "Wet Drilling", d: "Hilti | DD 250 (Wet Drilling)", mag: 2.5 },
  { t: "Die Grinder", m: "Hilti", n: "GDG 6-A22", v: null, d: "Hilti | GDG 6-A22", mag: 5.0 },
  { t: "Die Grinder", m: "Makita", n: "DGD800", v: null, d: "Makita | DGD800", mag: 6.5 },
  { t: "Drill Driver", m: "Hilti", n: "SF 6H-22A", v: "Metal", d: "Hilti | SF 6H-22A (Metal)", mag: 2.8 },
  { t: "Drill Driver", m: "Hilti", n: "SF 6H-22A", v: "Concrete", d: "Hilti | SF 6H-22A (Concrete)", mag: 15.5 },
  { t: "Drill Driver", m: "Hilti", n: "UD30", v: "Metal Drilling", d: "Hilti | UD30 (Metal Drilling)", mag: 3.5 },
  { t: "Drill Driver", m: "Hilti", n: "UH 700", v: "Metal Drilling", d: "Hilti | UH 700 (Metal Drilling)", mag: 2.5 },
  { t: "Drill Driver", m: "Makita", n: "DHP481RTJ", v: "Metal", d: "Makita | DHP481RTJ (Metal)", mag: 2.5 },
  { t: "Drill Driver", m: "Makita", n: "DHP481RTJ", v: "Concrete", d: "Makita | DHP481RTJ (Concrete)", mag: 6.5 },
  { t: "Drill Driver", m: "Makita", n: "DHP482RMJ", v: "Metal", d: "Makita | DHP482RMJ (Metal)", mag: 2.5 },
  { t: "Drill Driver", m: "Makita", n: "DHP482RMJ", v: "Concrete", d: "Makita | DHP482RMJ (Concrete)", mag: 6.5 },
  { t: "Drywall Screwdriver", m: "Hilti", n: "SD 5000-A22", v: null, d: "Hilti | SD 5000-A22", mag: 1.0 },
  { t: "Drywall Screwdriver", m: "Hilti", n: "SD 6000", v: "Screwdriving", d: "Hilti | SD 6000 (Screwdriving)", mag: 3.0 },
  { t: "Electric Breaker", m: "Hilti", n: "TE 1000-AVR", v: "Chiselling concrete", d: "Hilti | TE 1000-AVR (Chiselling concrete)", mag: 6.8 },
  { t: "Electric Breaker", m: "Hilti", n: "TE 2000-AVR", v: "Chiselling concrete", d: "Hilti | TE 2000-AVR (Chiselling concrete)", mag: 4.8 },
  { t: "Electric Breaker", m: "Hilti", n: "TE 3000-AVR", v: "Chiselling concrete", d: "Hilti | TE 3000-AVR (Chiselling concrete)", mag: 7.0 },
  { t: "Electric Saw", m: "Diapir", n: "QHS-400", v: null, d: "Diapir | QHS-400", mag: 3.9 },
  { t: "Electric Saw", m: "Hilti", n: "DCH 300-X", v: null, d: "Hilti | DCH 300-X", mag: 5.1 },
  { t: "Electric Saw", m: "Husqvarna", n: "K 4000", v: null, d: "Husqvarna | K 4000", mag: 3.5 },
  { t: "Finish Nail Gun", m: "Paslode", n: "Impulse 65A F16", v: null, d: "Paslode | Impulse 65A F16", mag: 2.8 },
  { t: "Fixing Tool", m: "Hilti", n: "BX 3-L", v: null, d: "Hilti | BX 3-L", mag: 2.3 },
  { t: "Fixing Tool", m: "Hilti", n: "BX 3-ME", v: null, d: "Hilti | BX 3-ME", mag: 2.5 },
  { t: "Floor Saw", m: "Belle", n: "Duo 350X", v: null, d: "Belle | Duo 350X", mag: 3.67 },
  { t: "Floor Saw", m: "Clipper", n: "C51", v: null, d: "Clipper | C51", mag: 5.1 },
  { t: "Floor Saw", m: "Clipper", n: "CS451", v: "Sharp blade", d: "Clipper | CS451 (sharp blade)", mag: 2.8 },
  { t: "Floor Saw", m: "Clipper", n: "CS451", v: "Worn blade", d: "Clipper | CS451 (worn blade)", mag: 4.7 },
  { t: "Floor Saw", m: "Wacker", n: "BFS1345A", v: null, d: "Wacker | BFS1345A", mag: 4.9 },
  { t: "Framing Nail Gun", m: "Hilti", n: "GX 90-F", v: null, d: "Hilti | GX 90-F", mag: 2.5 },
  { t: "Framing Nail Gun", m: "Paslode", n: "IM350+", v: null, d: "Paslode | IM350+", mag: 2.6 },
  { t: "Gas Fixing Tool", m: "Hilti", n: "GX 3", v: "Recoil", d: "Hilti | GX 3 (Recoil)", mag: 3.64 },
  { t: "Hydraulic Breaker", m: "JCB", n: "HM25", v: null, d: "JCB | HM25", mag: 4.0 },
  { t: "Hydraulic Breaker", m: "JCB", n: "HM25LV", v: null, d: "JCB | HM25LV", mag: 1.6 },
  { t: "Hydraulic Breaker", m: "JCB", n: "HM29", v: null, d: "JCB | HM29", mag: 5.0 },
  { t: "Impact Driver", m: "Hilti", n: "SID 4-A22", v: null, d: "Hilti | SID 4-A22", mag: 12.0 },
  { t: "Impact Driver", m: "Hilti", n: "SIW 22T-A", v: null, d: "Hilti | SIW 22T-A", mag: 14.5 },
  { t: "Impact Driver", m: "Makita", n: "DTD152RMJ", v: null, d: "Makita | DTD152RMJ", mag: 10.5 },
  { t: "Impact Driver", m: "Makita", n: "DTD154RTJ", v: null, d: "Makita | DTD154RTJ", mag: 12.5 },
  { t: "Impact Driver", m: "Makita", n: "DTW1002RTJ", v: null, d: "Makita | DTW1002RTJ", mag: 18.0 },
  { t: "Impact Driver", m: "Makita", n: "DTW285RMJ", v: null, d: "Makita | DTW285RMJ", mag: 11.5 },
  { t: "Impact Wrench", m: "Makita", n: "6906", v: "Fastening Bolts", d: "Makita | 6906 (Fastening Bolts)", mag: 16.5 },
  { t: "Impact Wrench", m: "Makita", n: "TW0250", v: "Fastening Bolts", d: "Makita | TW0250 (Fastening Bolts)", mag: 11.0 },
  { t: "Jigsaw", m: "Hilti", n: "SJD 6 D-HANDLE ORBITAL", v: "Sawing metal", d: "Hilti | SJD 6 D-HANDLE ORBITAL (Sawing metal)", mag: 8.0 },
  { t: "Jigsaw", m: "Hilti", n: "SJD 6-A22", v: "Sheet Metal", d: "Hilti | SJD 6-A22 (Sheet Metal)", mag: 3.5 },
  { t: "Jigsaw", m: "Hilti", n: "SJD 6-A22", v: "Sheet Metal", d: "Hilti | SJD 6-A22 (Sheet Metal)", mag: 4.7 },
  { t: "Jigsaw", m: "Makita", n: "4350CT", v: "Sawing metal", d: "Makita | 4350CT (Sawing metal)", mag: 4.5 },
  { t: "Jigsaw", m: "Makita", n: "DJV180RMJ", v: "Chipboard", d: "Makita | DJV180RMJ (Chipboard)", mag: 8.0 },
  { t: "Jigsaw", m: "Makita", n: "DJV180RMJ", v: "Chipboard", d: "Makita | DJV180RMJ (Chipboard)", mag: 4.8 },
  { t: "Jigsaw", m: "Makita", n: "DJV182RMJ", v: "MDF", d: "Makita | DJV182RMJ (MDF)", mag: 7.0 },
  { t: "Jigsaw", m: "Makita", n: "DJV182RMJ", v: "Sheet Metal", d: "Makita | DJV182RMJ (Sheet Metal)", mag: 3.5 },
  { t: "Magnetic Drill", m: "Unibor", n: "EQ50", v: "Metal Drilling", d: "Unibor | EQ50 (Metal Drilling)", mag: 1.95 },
  { t: "Magnetic Drill", m: "Unibor", n: "H32", v: "Metal Drilling", d: "Unibor | H32 (Metal Drilling)", mag: 2.25 },
  { t: "Mitre Saw", m: "Makita", n: "DLS110Z", v: null, d: "Makita | DLS110Z", mag: 2.5 },
  { t: "Mitre Saw", m: "Makita", n: "DLS714NZ", v: null, d: "Makita | DLS714NZ", mag: 2.5 },
  { t: "Multi Tool", m: "Makita", n: "DTM50Z", v: "Cutting Metal", d: "Makita | DTM50Z (Cutting Metal)", mag: 5.0 },
  { t: "Multi Tool", m: "Makita", n: "DTM50Z", v: "Cutting Wood", d: "Makita | DTM50Z (Cutting Wood)", mag: 9.5 },
  { t: "Multi Tool", m: "Makita", n: "DTM50Z", v: "Chiselling", d: "Makita | DTM50Z (Chiselling)", mag: 7.5 },
  { t: "Multi Tool", m: "Makita", n: "DTM50Z", v: "Sanding", d: "Makita | DTM50Z (Sanding)", mag: 2.5 },
  { t: "Needle Scaler", m: "Hilti", n: "TE 300-A36", v: "Chiselling concrete", d: "Hilti | TE 300-A36 (Chiselling concrete)", mag: 7.9 },
  { t: "Needle Scaler", m: "Hilti", n: "TE 300-AVR", v: "Chiselling concrete", d: "Hilti | TE 300-AVR (Chiselling concrete)", mag: 13.5 },
  { t: "Nibbler", m: "Makita", n: "DJN161Z", v: "Cutting metal", d: "Makita | DJN161Z (Cutting metal)", mag: 6.5 },
  { t: "Nibbler", m: "Makita", n: "JN1601", v: "Cutting Metal", d: "Makita | JN1601 (Cutting Metal)", mag: 7.5 },
  { t: "Nibbler", m: "Makita", n: "JN3201", v: "Cutting Metal", d: "Makita | JN3201 (Cutting Metal)", mag: 10.0 },
  { t: "Orbital Sander", m: "Makita", n: "BO371", v: null, d: "Makita | BO371", mag: 2.5 },
  { t: "Power Planer", m: "Makita", n: "DKP180RMJ", v: "Plaining", d: "Makita | DKP180RMJ (Plaining)", mag: 4.5 },
  { t: "Reciprocating Saw", m: "Hilti", n: "SR 30", v: "Sawing Chipboard", d: "Hilti | SR 30 (Sawing Chipboard)", mag: 1.7 },
  { t: "Reciprocating Saw", m: "Hilti", n: "SR 30", v: "Sawing Beams", d: "Hilti | SR 30 (Sawing Beams)", mag: 19.0 },
  { t: "Reciprocating Saw", m: "Hilti", n: "SR 30-A36", v: "Chipboard", d: "Hilti | SR 30-A36 (Chipboard)", mag: 22.5 },
  { t: "Reciprocating Saw", m: "Hilti", n: "SR 30-A36", v: "Wooden Beams", d: "Hilti | SR 30-A36 (Wooden Beams)", mag: 20.5 },
  { t: "Reciprocating Saw", m: "Makita", n: "DJR187RTE", v: "Chipboard", d: "Makita | DJR187RTE (Chipboard)", mag: 16.5 },
  { t: "Reciprocating Saw", m: "Makita", n: "DJR187RTE", v: "Wood", d: "Makita | DJR187RTE (Wood)", mag: 15.5 },
  { t: "Reciprocating Saw", m: "Makita", n: "JR3070CT", v: "Cutting Board", d: "Makita | JR3070CT (Cutting Board)", mag: 9.5 },
  { t: "Reciprocating Saw", m: "Makita", n: "JR3070CT", v: "Cutting Beams", d: "Makita | JR3070CT (Cutting Beams)", mag: 10.5 },
  { t: "Rock Drill", m: "Atlas", n: "BBD 15E", v: "Drilling stone", d: "Atlas | BBD 15E (Drilling stone)", mag: 7.0 },
  { t: "Rock Drill", m: "Yokota", n: "TJ-15SV LBS", v: "Drilling stone", d: "Yokota | TJ-15SV LBS (Drilling stone)", mag: 7.0 },
  { t: "Rotary Hammer", m: "Hilti", n: "TE 500-A36", v: "Chiselling", d: "Hilti | TE 500-A36 (Chiselling)", mag: 6.7 },
  { t: "Router", m: "Makita", n: "DRT50ZX4", v: "Cutting MDF", d: "Makita | DRT50ZX4 (Cutting MDF)", mag: 4.5 },
  { t: "Router", m: "Makita", n: "RO09", v: null, d: "Makita | RO09", mag: 4.3 },
  { t: "Router", m: "Makita", n: "RP2301", v: "Cutting Metal", d: "Makita | RP2301 (Cutting Metal)", mag: 10.0 },
  { t: "SDS MAX Combi Hammer", m: "Hilti", n: "TE 50-ATC", v: "Hammer Drilling Concrete", d: "Hilti | TE 50-ATC (Hammer Drilling Concrete)", mag: 9.0 },
  { t: "SDS MAX Combi Hammer", m: "Hilti", n: "TE 60-ATC-AVR", v: "Hammer Drilling Concrete", d: "Hilti | TE 60-ATC-AVR (Hammer Drilling Concrete)", mag: 6.4 },
  { t: "SDS MAX Combi Hammer", m: "Hilti", n: "TE 70-ATC", v: "Hammer Drilling Concrete", d: "Hilti | TE 70-ATC (Hammer Drilling Concrete)", mag: 10.0 },
  { t: "SDS MAX Combi Hammer", m: "Hilti", n: "TE 80-ATC-AVR", v: "Hammer Drilling Concrete", d: "Hilti | TE 80-ATC-AVR (Hammer Drilling Concrete)", mag: 7.5 },
  { t: "SDS MAX Combi Hammer", m: "Makita", n: "HR4013C", v: null, d: "Makita | HR4013C", mag: 5.0 },
  { t: "SDS+ Combi Hammer", m: "Hilti", n: "TE 2", v: "Hammer drilling concrete", d: "Hilti | TE 2 (Hammer drilling concrete)", mag: 13.5 },
  { t: "SDS+ Combi Hammer", m: "Hilti", n: "TE 3-M", v: "Hammer drilling concrete", d: "Hilti | TE 3-M (Hammer drilling concrete)", mag: 15.5 },
  { t: "SDS+ Combi Hammer", m: "Hilti", n: "TE 30-AVR", v: "Hammer drilling concrete", d: "Hilti | TE 30-AVR (Hammer drilling concrete)", mag: 9.3 },
  { t: "SDS+ Combi Hammer", m: "Hilti", n: "TE7C", v: "Hammer drilling concrete", d: "Hilti | TE7C (Hammer drilling concrete)", mag: 17.0 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 30-A36", v: "Drilling", d: "Hilti | TE 30-A36 (Drilling)", mag: 9.0 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 30-A36", v: "Hammer Drilling", d: "Hilti | TE 30-A36 (Hammer Drilling)", mag: 10.6 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 30-A36", v: "Chiselling", d: "Hilti | TE 30-A36 (Chiselling)", mag: 10.3 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 4-A22", v: "Drilling", d: "Hilti | TE 4-A22 (Drilling)", mag: 12.3 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 4-A22", v: "Hammer Drilling", d: "Hilti | TE 4-A22 (Hammer Drilling)", mag: 11.0 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 6-A22", v: "Drilling", d: "Hilti | TE 6-A22 (Drilling)", mag: 2.1 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 6-A22", v: "Hammer Drilling", d: "Hilti | TE 6-A22 (Hammer Drilling)", mag: 13.4 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 6-A22", v: "Chiselling", d: "Hilti | TE 6-A22 (Chiselling)", mag: 6.3 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 6-A36", v: "Drilling", d: "Hilti | TE 6-A36 (Drilling)", mag: 2.5 },
  { t: "SDS+ Hammer Drill", m: "Hilti", n: "TE 6-A36", v: "Hammer Drilling", d: "Hilti | TE 6-A36 (Hammer Drilling)", mag: 13.0 },
  { t: "SDS+ Hammer Drill", m: "Makita", n: "DHR242RMJ", v: "Drilling", d: "Makita | DHR242RMJ (Drilling)", mag: 3.5 },
  { t: "SDS+ Hammer Drill", m: "Makita", n: "DHR242RMJ", v: "Hammer Drilling", d: "Makita | DHR242RMJ (Hammer Drilling)", mag: 13.5 },
  { t: "SDS+ Hammer Drill", m: "Makita", n: "DHR242RMJ", v: "Chiselling", d: "Makita | DHR242RMJ (Chiselling)", mag: 10.5 },
  { t: "SDS+ Hammer Drill", m: "Makita", n: "DHR280ZJ", v: "Drilling", d: "Makita | DHR280ZJ (Drilling)", mag: 5.0 },
  { t: "SDS+ Hammer Drill", m: "Makita", n: "DHR280ZJ", v: "Hammer Drilling", d: "Makita | DHR280ZJ (Hammer Drilling)", mag: 10.6 },
  { t: "Screwdriver", m: "Hilti", n: "ST 1800-A", v: null, d: "Hilti | ST 1800-A", mag: 0.5 },
  { t: "Surface Grinder", m: "Hilti", n: "DG 150", v: "Surface Grinding", d: "Hilti | DG 150 (Surface Grinding)", mag: 5.8 },
  { t: "Wall Chaser", m: "Hilti", n: "DC-SE 20", v: "Cutting concrete", d: "Hilti | DC-SE 20 (Cutting concrete)", mag: 5.8 }
];

/* ── Derived lookups ──────────────────────────────────────────── */

export const TOOL_TYPES: string[] = [...new Set(TOOL_LIBRARY.map(t => t.t))].sort();
export const MANUFACTURERS: string[] = [...new Set(TOOL_LIBRARY.map(t => t.m))].sort();

export function getToolsByType(toolType: string): ToolEntry[] {
  return TOOL_LIBRARY.filter(t => t.t === toolType);
}

export function getManufacturersByType(toolType: string): string[] {
  return [...new Set(TOOL_LIBRARY.filter(t => t.t === toolType).map(t => t.m))].sort();
}

export function getToolsByTypeAndMfr(toolType: string, manufacturer: string): ToolEntry[] {
  return TOOL_LIBRARY.filter(t => t.t === toolType && t.m === manufacturer);
}

export function searchTools(query: string): ToolEntry[] {
  const q = query.toLowerCase();
  return TOOL_LIBRARY.filter(t =>
    t.d.toLowerCase().includes(q) ||
    t.t.toLowerCase().includes(q) ||
    t.n.toLowerCase().includes(q)
  );
}

/* ── Calculation helpers ──────────────────────────────────────── */

/**
 * Calculate exposure points for a single tool use.
 * HSE points method: points = (magnitude^2 x triggerTime_minutes) / 25
 * where triggerTime is in minutes (not hours)
 */
export function calculatePoints(magnitudeMs2: number, triggerTimeMinutes: number): number {
  if (magnitudeMs2 <= 0 || triggerTimeMinutes <= 0) return 0;
  // HSE formula uses hours: points = magnitude^2 x hours x 2
  // Equivalent: points = (magnitude^2 x minutes) / 30 ... wait, let me check
  // Actually: A(8) partial = magnitude * sqrt(T/8) where T is in hours
  // Points = (A(8)partial / 2.5)^2 * 100 = magnitude^2 * T * 100 / (8 * 6.25)
  //        = magnitude^2 * T * 2 where T in hours
  //        = magnitude^2 * (minutes/60) * 2 = magnitude^2 * minutes / 30
  // But the Excel uses: points = (magnitude^2 x triggerTime_hours x 2) with the result shown
  // Let me verify: from the Excel data:
  // Charlie Hall: SDS+ Hammer Drill, mag 3.2, time 1h 1m = 1.0167h, points 20.8
  // 3.2^2 * 1.0167 * 2 = 10.24 * 1.0167 * 2 = 20.82 ✓
  const triggerTimeHours = triggerTimeMinutes / 60;
  return Math.round(magnitudeMs2 * magnitudeMs2 * triggerTimeHours * 2 * 10) / 10;
}

/**
 * Calculate daily A(8) from total daily points.
 * A(8) = 2.5 * sqrt(dailyPoints / 100)
 */
export function calculateA8(dailyPoints: number): number {
  if (dailyPoints <= 0) return 0;
  return Math.round(2.5 * Math.sqrt(dailyPoints / 100) * 100) / 100;
}

/**
 * Get HAV status from daily points.
 */
export function getHAVStatus(dailyPoints: number): HAVStatus {
  if (dailyPoints >= ELV_POINTS) return "ELV";
  if (dailyPoints >= EAV_POINTS) return "EAV";
  return "OK";
}

/**
 * Get status colour classes for traffic light display.
 */
export function getStatusColours(status: HAVStatus): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case "ELV": return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", dot: "bg-red-500" };
    case "EAV": return { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", dot: "bg-amber-500" };
    default: return { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", dot: "bg-green-500" };
  }
}

/* ── ID generator ─────────────────────────────────────────────── */

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Default entry factory ────────────────────────────────────── */

export function createEntry(): ExposureEntry {
  return {
    id: newId(),
    toolType: "",
    manufacturer: "",
    toolDisplay: "",
    magnitudeLibrary: 0,
    magnitudeOverride: null,
    magnitudeUsed: 0,
    triggerTimeMinutes: 0,
    points: 0,
    notes: "",
    isCustomTool: false,
    customToolName: "",
  };
}

export function createOperative(name: string = ""): OperativeData {
  return {
    id: newId(),
    name,
    entries: [createEntry()],
  };
}

export function createDay(date?: string): DayData {
  return {
    date: date || new Date().toISOString().slice(0, 10),
    operatives: [createOperative()],
  };
}
