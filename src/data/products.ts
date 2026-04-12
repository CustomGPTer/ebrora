import type { Product, Category, Review } from '@/lib/types';

/**
 * ============================================================================
 * EBRORA £ products.js
 * Complete Product Database for ebrora.com
 * ============================================================================
 *
 * This file contains ALL product data, category definitions, and customer
 * reviews for the Ebrora website. It is deshigned for a static GitHub Pages
 * site (HTML/CSS/JS only) with no server-side processing.
 *
 * ============================================================================
 * HOW TO ADD A NEW PRODUCT
 * ============================================================================
 * 1. Scroll to the PRODUCTS array below.
 * 2. Copy an existing product object (everything between { and }, inclusive).
 * 3. Paste it at the END of the array, just before the closing ];
 * 4. Change every field to match your new product:
 *    - id            £ A unique URL slug (lowercase, hyphens, no spaces).
 *                      Example: "my-new-template"
 *    - title         £ The display name shown on cards and the product page.
 *    - category      £ An array of category slugs (see list below).
 *    - price         £ Current selling price as a string, e.g. "£19.99".
 *    - oldPrice      £ Previous higher price for strike-through display,
 *                      or "" if there is no discount.
 *    - badge         £ Short label shown on the product card (e.g. "HSE & Safety").
 *    - icon          £ An emoji fallback icon for the product card.
 *    - desc          £ Short description (2-3 lines) shown on the product card.
 *    - longDesc      £ Full HTML description for the product detail page.
 *                      Use <p> tags to wrap each paragraph. Write at least 3
 *                      detailed paragraphs.
 *    - features      £ An array of feature strings. Include at least 8.
 *    - images        £ An array of image paths/URLs. Leave as [] if none yet.
 *    - buyLink       £ Full Gumroad purchase URL.
 *                      Format: "https://ebrora.gumroad.com/l/your-slug"
 *    - youtubeId     £ YouTube video ID for demo. Leave as "" if none yet.
 *    - new           £ Boolean. Set to true to show a "New" badge.
 *    - featured      £ Boolean. Set to true to feature on the homepage.
 *    - compatible    £ Compatibility string, e.g. "Windows & Mac".
 *    - version       £ Version number string, e.g. "1.0".
 *    - fileSize      £ Approximate download size, e.g. "1.4 MB".
 *    - lastUpdate    £ Month and year of last update, e.g. "March 2026".
 *    - popularity    £ Number from 1-20 used for sorting. Higher = more popular.
 *    - isBundle      £ Boolean. Set to true only for bundle products.
 *    - bundleProducts£ Array of product id slugs included in a bundle,
 *                      or [] if not a bundle.
 *
 * ============================================================================
 * HOW TO ADD A NEW CATEGORY
 * ============================================================================
 * 1. Scroll to the CATEGORIES object below.
 * 2. Add a new line in the format:
 *        slugname: { label: "Display Name", icon: "emoji" },
 * 3. The slug must be lowercase with no spaces or hyphens.
 * 4. You can then use that slug in any product's category array.
 *
 * ============================================================================
 * AVAILABLE CATEGORY SLUGS
 * ============================================================================
 *   hse            £ HSE & Safety
 *   project        £ Project Management
 *   asset          £ Asset & MEICA Tracking
 *   wastewater     £ Wastewater & Utilities
 *   cost           £ Cost & Carbon Calculators
 *   planning       £ Construction Planning
 *   inspection     £ Inspection & Testing
 *   registers      £ Registers & Logs
 *   concrete       £ Concrete & Materials
 *   competence     £ Competence & Training
 *   environmental  £ Environmental
 *   plant          £ Plant & Equipment
 *   daily          £ Daily Operations
 *   commissioning  £ Commissioning & Handover
 *   stakeholder    £ Stakeholder & Comms
 *   temporary      £ Temporary Works
 *
 * ============================================================================
 * HOW TO ADD A NEW REVIEW
 * ============================================================================
 * 1. Scroll to the REVIEWS array at the bottom of this file.
 * 2. Add a new object with: stars (4 or 5), text, author, role.
 * 3. Example:
 *        {
 *            stars: 5,
 *            text: "Great product!",
 *            author: "Jane Doe",
 *            role: "Site Manager, Example Ltd"
 *        },
 *
 * ============================================================================
 */


// ============================================================================
// CATEGORIES
// ============================================================================

export const CATEGORIES: Record<string, Category> = {
        hse:            { label: "HSE & Safety",                icon: "\uD83D\uDEE1\uFE0F" },
        project:        { label: "Project Management",          icon: "\uD83D\uDCCA" },
        asset:          { label: "Asset & MEICA Tracking",      icon: "\uD83C\uDFD7\uFE0F" },
        wastewater:     { label: "Wastewater & Utilities",      icon: "\uD83D\uDCA7" },
        cost:           { label: "Cost & Carbon Calculators",   icon: "\uD83D\uDCB0" },
        planning:       { label: "Construction Planning",       icon: "\uD83D\uDCC5" },
        inspection:     { label: "Inspection & Testing",        icon: "\uD83D\uDD0D" },
        registers:      { label: "Registers & Logs",            icon: "\uD83D\uDCCB" },
        concrete:       { label: "Concrete & Materials",        icon: "\uD83E\uDDF1" },
        competence:     { label: "Competence & Training",       icon: "\uD83C\uDF93" },
        environmental:  { label: "Environmental",               icon: "\uD83C\uDF3F" },
        plant:          { label: "Plant & Equipment",           icon: "\uD83D\uDE9C" },
        daily:          { label: "Daily Operations",            icon: "\uD83D\uDCDD" },
        commissioning:  { label: "Commissioning & Handover",    icon: "\uD83C\uDFC1" },
        stakeholder:    { label: "Stakeholder & Comms",         icon: "\uD83D\uDDE3\uFE0F" },
        temporary:      { label: "Temporary Works",             icon: "\uD83C\uDFD7\uFE0F" },
};


// ============================================================================
// PRODUCTS
// ============================================================================

export const PRODUCTS: Product[] = [

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 1. Excavation Inspection Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "excavation-inspection-register",
        title: "Excavation Inspection Register",
    altText: "Excavation Inspection Register Excel template with 75 questions depth band risk escalation and RAG dashboard",
        category: ["inspection", "registers", "hse"],
        price: "£9.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "VBA-powered excavation inspection and compliance management system with an excavation register (5 types: trench, pit, shaft, bulk dig, confined space), a 75-question type-specific inspection form (15 questions per excavation type) with auto-populated details, automatic depth-band risk escalation (Standard/Enhanced/High/Critical) with mandatory controls and reference standards (HSG185, BS 6031, BS 5975, CDM 2015, CS Regs 1997), RAG inspection outcomes (Pass/Conditional Pass/Fail), a timestamped inspection register with locked rows, a dashboard with excavation and inspection KPIs plus depth band breakdowns, and one-click PDF export in A4 and A3 formats.",
        longDesc: `<p>The Excavation Inspection Register is a VBA-powered Excel workbook (.xlsm) providing a complete inspection and compliance management system for excavation works on construction and civil engineering projects. The excavation register logs each excavation with a unique ID, description, location, excavation type (trench, pit, shaft, bulk dig or confined space excavation), maximum depth, start date, status and temporary works status, building a master record of all open and closed excavations on the project.</p><p>The inspection form auto-populates excavation details from the register when an excavation is selected, then presents 15 type-specific inspection questions drawn from a 75-question bank — each question referenced to the relevant standard (HSG185, BS 6031, BS 5975, CDM 2015, Confined Spaces Regulations 1997, PAS 128, BS EN 1997-1, LOLER 1998). Automatic depth-band risk escalation assigns Standard, Enhanced, High or Critical risk levels with mandatory controls specified per band, and completed inspections are scored with a RAG outcome: Pass (green), Conditional Pass (amber) or Fail (red).</p><p>Submitted inspections are auto-logged to the inspection register with timestamps and locked rows to prevent tampering. The dashboard presents real-time KPIs including total excavations, open/closed counts, total inspections, inspections with issues, fail counts and a depth band breakdown. One-click VBA buttons export the register and forms to PDF in both A4 portrait and A3 landscape formats. The system has capacity for 300 inspection records.</p>`,
        features: [
      "5 excavation types: trench, pit, shaft, bulk dig and confined space",
      "75-question inspection bank with 15 type-specific questions per excavation type",
      "Auto-populated inspection form from excavation register selection",
      "Depth-band risk escalation: Standard, Enhanced, High and Critical",
      "Mandatory controls and reference standards per depth band",
      "HSG185, BS 6031, BS 5975, CDM 2015, CS Regs 1997 and PAS 128 alignment",
      "RAG inspection outcomes: Pass, Conditional Pass and Fail",
      "Timestamped inspection register with locked rows",
      "Dashboard with excavation and inspection KPIs",
      "Depth band breakdown showing distribution of excavations",
      "One-click PDF export in A4 portrait and A3 landscape formats",
      "300 inspection record capacity",
      "VBA-powered Submit, Clear and Export automation",
      "Competent person and temporary works status tracking per excavation"
    ],
        images: ["product-images/Excavation-Inspection-Register-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/excavation-inspection-register",
        youtubeId: "",
        new: false,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.4 MB",
        lastUpdate: "March 2026",
        popularity: 15,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 2. Gantt Chart Project Planner
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "gantt-chart-project-planner",
        title: "Gantt Chart Project Planner",
    altText: "Gantt Chart Project Planner Excel template with critical path dependencies resource loading and dashboard",
        category: ["project", "planning"],
        price: "£9.99",
        oldPrice: "",
        badge: "Project Management",
        icon: "ð",
        desc: "VBA-enabled Gantt chart with a 4-level WBS hierarchy (Phase, Sub-Phase, Task, Sub-Task), 5 switchable timescale views (daily, weekly, fortnightly, monthly, quarterly), dependency management (FS/SS/FF/SF with lag support), automatic critical path calculation with float values, baseline capture and comparison, a working days calendar with pre-loaded UK bank holidays and custom non-working days, resource loading histograms by owner, a dashboard with programme KPIs, phase progress, upcoming milestones, overdue task tracking and an S-curve, plus one-click A3 landscape PDF export.",
        longDesc: `<p>The Gantt Chart Project Planner (Gantt Chart Pro) is a VBA-enabled Excel workbook (.xlsm) providing a full-featured programme management tool for construction and civil engineering projects. Tasks are organised in a four-level WBS hierarchy — Phase, Sub-Phase, Task and Sub-Task — with VBA buttons to add, indent, outdent and delete tasks, automatically maintaining WBS numbering throughout. Gantt bars render dynamically with discipline-specific colour coding (Civils, Mechanical, Electrical, Commissioning, MEICA, General, Design, Procurement).</p><p>Five switchable timescale views — daily, weekly, fortnightly, monthly and quarterly — let you zoom from detailed look-aheads to executive-level overviews without rebuilding the chart. Dependency management supports all four link types (Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish) with positive and negative lag values, and the automatic critical path calculation identifies the longest path through the programme with float values for each task. Baseline snapshots can be captured and displayed alongside current bars for slippage tracking.</p><p>The working days calendar pre-loads UK bank holidays and supports custom non-working days, with a toggle to switch between calendar-day and working-day duration calculations. The dashboard provides programme-level KPIs (total tasks, percentage complete, on track/at risk/critical/overdue counts), phase progress summaries, upcoming milestones, an overdue task table with days-over calculations, and resource loading histograms by owner. One-click PDF export generates professional A3 landscape reports with headers, footers and page numbers.</p>`,
        features: [
      "4-level WBS hierarchy: Phase, Sub-Phase, Task and Sub-Task",
      "VBA task management: add, indent, outdent, delete with auto WBS renumbering",
      "5 timescale views: daily, weekly, fortnightly, monthly and quarterly",
      "Dependency management: FS, SS, FF, SF link types with lag support",
      "Automatic critical path calculation with float values",
      "Baseline capture and comparison for slippage tracking",
      "Working days calendar with pre-loaded UK bank holidays",
      "Custom non-working day support with calendar/working day toggle",
      "Discipline-specific colour coding: Civils, Mechanical, Electrical, Commissioning, MEICA and more",
      "Dashboard with programme KPIs, phase progress and S-curve",
      "Upcoming milestones and overdue task tracking with days-over calculations",
      "Resource loading histograms by owner",
      "One-click A3 landscape PDF export with headers and page numbers",
      "Dynamic Gantt bar rendering with today line and weekend shading",
      "Filter and show/hide completed tasks toggles"
    ],
        images: ["product-images/Programme-Gantt-Chart-Template-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/gantt-chart-project-planner",
        youtubeId: "",
        new: false,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.6 MB",
        lastUpdate: "March 2026",
        popularity: 18,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 3. COSHH Assessment Tool
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 4. ITR Asset Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 5. Carbon Calculator for Construction
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "carbon-calculator-construction",
        title: "Carbon Calculator for Construction",
    altText: "Carbon Calculator Excel template with BS EN 15978 whole life carbon assessment ICE v3 factors and dashboard",
        category: ["cost", "environmental"],
        price: "£9.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "ð±",
        desc: "BS EN 15978 compliant whole-life carbon assessment tool covering modules A1–A5 (embodied) and B1–B7 (operational) with a pre-loaded ICE Database v3.0 and BEIS/DESNZ emission factor library, material inputs by construction phase with auto-populated carbon factors, a transport emissions schedule (Module A4) with default UK distances and overrides, a plant and equipment hours log (Module A5), an operational carbon sheet (B1–B7), a side-by-side design option comparison, industry benchmarks by asset type, and a dashboard showing total tCO₂e by lifecycle module and construction phase.",
        longDesc: `<p>The Carbon Calculator is a macro-enabled Excel workbook (.xlsm) providing a structured whole-life carbon assessment for civil engineering and construction projects, compliant with BS EN 15978. It covers embodied carbon modules A1–A3 (raw materials and manufacturing), A4 (transport to site) and A5 (construction and installation), plus operational carbon modules B1–B7 (use, maintenance, repair, replacement, refurbishment, operational energy and operational water) across the asset's configurable design life.</p><p>The material inputs sheet lets you log quantities by construction phase, selecting materials from a pre-loaded ICE Database v3.0 library with carbon factors that auto-populate per material. The transport emissions schedule uses default UK average distances by transport mode (HGV rigid, HGV artic, light van, rail, coastal/inland ship) with BEIS 2023 conversion factors, and allows distance overrides where actual haul data is available. The plant and equipment sheet records on-site fuel consumption by equipment type and hours used, calculating Module A5 emissions.</p><p>A design comparison sheet lets you evaluate two design options side by side on embodied carbon, identifying the lower-carbon alternative during design development. Industry benchmarks for roads, bridges, water treatment, commercial, residential and other asset types are provided as reference. The dashboard summarises total project carbon (tCO₂e) with breakdowns by lifecycle module and construction phase, presented as headline KPI tiles and a detailed table.</p>`,
        features: [
      "BS EN 15978 compliant whole-life carbon assessment framework",
      "Covers modules A1-A5 (embodied) and B1-B7 (operational)",
      "Pre-loaded ICE Database v3.0 with auto-populated carbon factors",
      "BEIS/DESNZ 2023 transport emission factors by mode",
      "Material inputs by construction phase with quantity and unit selection",
      "Transport emissions schedule with default UK distances and overrides",
      "Plant and equipment hours log for Module A5 on-site emissions",
      "Operational carbon sheets for B1-B7 lifecycle modules",
      "Side-by-side design option comparison for lower-carbon alternatives",
      "Industry benchmarks by asset type (roads, bridges, water treatment, commercial, residential)",
      "Dashboard with total tCO2e by lifecycle module and construction phase",
      "Configurable project info: design life, site area, project type",
      "Designed for civil engineering and construction — excludes MEICA"
    ],
        images: ["product-images/Carbon-Calculator-Construction-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/carbon-calculator-construction",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.5 MB",
        lastUpdate: "March 2026",
        popularity: 11,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 6. Daily Diary Template
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "daily-diary-template",
        title: "Daily Diary Template",
    altText: "Daily Diary Template Excel macro-enabled site diary with QS search dashboard and workforce charts",
        category: ["daily", "registers", "planning"],
        price: "£9.99",
        oldPrice: "",
        badge: "Daily Operations",
        icon: "ð",
        desc: "365-day macro-enabled site diary (.xlsm) with a dedicated sheet per day, weather AM/PM and temperature logging, visitor records, a 12-row workforce and activity log per date (subcontractor, trade, headcount, hours, delays, variations), consolidated All Diary Data view with hyperlinks, a filterable QS Search Dashboard with live KPIs (total hours, headcount, delay counts), and a Charts Dashboard for graphical workforce analysis.",
        longDesc: `<p>The Daily Diary Template is a 365-day macro-enabled Excel workbook (.xlsm) that provides a dedicated sheet for every day of the year, giving site teams a structured, consistent daily record format. Each day captures weather conditions for morning and afternoon with temperature logging, a visitor register, and a 12-row workforce and activity log recording subcontractor, trade, headcount, hours worked, delays encountered and any variations instructed.</p><p>A consolidated All Diary Data sheet pulls every day's entries into a single searchable table with hyperlinks back to individual daily sheets, making it easy to find specific records without scrolling through hundreds of tabs. The QS Search Dashboard provides a filterable interface with live KPIs including total hours worked, cumulative headcount, delay event counts and variation totals — designed for quantity surveyors building delay claims or substantiating daywork records.</p><p>The Charts Dashboard presents graphical workforce analysis with headcount trends, trade breakdowns and delay frequency charts. VBA macros handle sheet creation, navigation and data consolidation. The template is designed for site managers and engineers on civil engineering and building projects who need professional daily records for contractual and project management purposes.</p>`,
        features: [
      "365-day workbook with a dedicated sheet per day",
      "Weather AM/PM and temperature logging per day",
      "Visitor register for daily site attendance records",
      "12-row workforce and activity log per date",
      "Subcontractor, trade, headcount, hours, delays and variations tracking",
      "Consolidated All Diary Data view with hyperlinks to daily sheets",
      "Filterable QS Search Dashboard with live KPIs",
      "Total hours, headcount, delay counts and variation totals",
      "Charts Dashboard with headcount trends and trade breakdowns",
      "VBA macros for sheet creation, navigation and data consolidation",
      "Macro-enabled .xlsm format for full automation",
      "Designed for contractual records, delay claims and daywork substantiation"
    ],
        images: ["product-images/Daily-Diary-Template-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/daily-diary-template",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "March 2026",
        popularity: 13,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 7. ART Assessment Tool
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 8. Pump Maintenance Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "pump-maintenance-tracker",
        title: "Pump Maintenance Tracker",
    altText: "Pump Maintenance Tracker Excel template with asset register task library and weekly schedule dashboard",
        category: ["wastewater", "asset", "plant"],
        price: "£9.99",
        oldPrice: "",
        badge: "Wastewater",
        icon: "£ï¸",
        desc: "Pump maintenance planner with a pump register recording area, asset tag, duty status, manufacturer, model, commission date, criticality, pump type and runtime hours — linked to a configurable task library with calendar-based and runtime-based maintenance triggers, a printable weekly maintenance schedule (filterable by area and week), and a dashboard showing total pumps, tasks due this week, due-now and due-soon counts.",
        longDesc: `<p>The Pump Maintenance Tracker is an Excel-based maintenance planner designed for wastewater treatment works and pumping station operations. The pump register records each asset with area, asset tag, duty status (duty, standby, installed spare), manufacturer, model, commission date, criticality rating, pump type and cumulative runtime hours, providing a complete fleet overview.</p><p>A configurable task library defines maintenance activities with both calendar-based triggers (e.g. monthly greasing, quarterly belt checks) and runtime-based triggers (e.g. bearing replacement at 10,000 hours), and tasks are linked to specific pump types or individual assets. The printable weekly maintenance schedule generates a filterable view by area and week commencing date, so maintenance teams receive a clear, targeted work list each week.</p><p>The dashboard shows total pumps in the register, tasks due this week, due-now (overdue) counts and due-soon counts, giving maintenance managers an at-a-glance picture of workload and compliance. The template is designed for maintenance supervisors, process engineers and asset managers on operational wastewater sites and during commissioning phases.</p>`,
        features: [
      "Pump register with area, asset tag, duty status, manufacturer and model",
      "Commission date, criticality, pump type and runtime hours tracking",
      "Configurable task library with calendar-based and runtime-based triggers",
      "Tasks linked to specific pump types or individual assets",
      "Printable weekly maintenance schedule filterable by area and week",
      "Dashboard with total pumps, tasks due this week, due-now and due-soon",
      "Duty, standby and installed spare status tracking",
      "Designed for wastewater treatment works and pumping stations",
      "Suitable for maintenance supervisors, process engineers and asset managers"
    ],
        images: ["product-images/Pump-Maintenance-Tracker-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/pump-maintenance-tracker",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.5 MB",
        lastUpdate: "March 2026",
        popularity: 10,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 9. Concrete Pour Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "concrete-pour-register",
        title: "Concrete Pour Register",
    altText: "Concrete Pour Register Excel template with cube test tracking BS EN 13670 strike analysis and strength curves",
        category: ["concrete", "registers", "inspection"],
        price: "£9.99",
        oldPrice: "",
        badge: "Concrete & Materials",
        icon: "ðï¸",
        desc: "Full concrete pour register and cube test record with BS EN 13670 compliant formwork strike analysis — featuring dynamic strike planning by mix, pour type and temperature band, UKAS-method strength gain curves with confidence envelopes, a programme dashboard with RAG status and pass rates, and configurable concrete mixes (OPC, PFA and GGBS blends).",
        longDesc: `<p>The Concrete Pour Register is a comprehensive Excel workbook for managing concrete pours, cube test results and formwork strike timing on construction projects. Every pour is logged with date, location, element reference, mix design, volume, supplier, delivery ticket and weather conditions, building a complete auditable record of all concrete placed on the project.</p><p>Cube test results are recorded against each pour with test age, crushing strength and pass/fail status. The BS EN 13670 compliant formwork strike analysis module provides dynamic strike planning based on mix type (OPC, PFA and GGBS blends), pour type (vertical or soffit) and ambient temperature band, using UKAS-method strength gain curves with confidence envelopes to determine safe strike times.</p><p>The programme dashboard presents a RAG-status overview of all pours showing cube test pass rates, overdue tests, and upcoming strike dates in a Gantt-style layout. Concrete mix designs are fully configurable so the workbook adapts to your project's specific mix specifications. The template is designed for site engineers and concrete supervisors managing pours on civil engineering and building projects.</p>`,
        features: [
      "Full pour register with date, location, element, mix, volume and supplier logging",
      "Cube test recording with test age, crushing strength and pass/fail status",
      "BS EN 13670 compliant formwork strike analysis module",
      "Dynamic strike planning by mix type, pour type and temperature band",
      "UKAS-method strength gain curves with confidence envelopes",
      "Configurable concrete mixes including OPC, PFA and GGBS blends",
      "Programme dashboard with RAG status and cube test pass rates",
      "Gantt-style strike programme showing upcoming and overdue dates",
      "Weather condition logging per pour for quality records",
      "Delivery ticket and supplier tracking for traceability",
      "Designed for site engineers and concrete supervisors on civil engineering projects"
    ],
        images: ["product-images/Concrete-Pour-Register-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/concrete-pour-register",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.4 MB",
        lastUpdate: "March 2026",
        popularity: 12,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 10. HSE Monthly Meeting Pack
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 11. Delivery Booking System
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 12. PIC Competence Assessment
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "pic-competence-assessment",
        title: "PIC Competence Assessment",
    altText: "PIC Competence Assessment Excel template with staged checklists performance scoring and trend dashboard",
        category: ["hse", "competence"],
        price: "£9.99",
        oldPrice: "",
        badge: "Competence & Training",
        icon: "ð·",
        desc: "Persons In Charge (PIC) competence assessment system with Stage 1 (Tender) and Stage 2 (Pre-Start) checklists, up to 12 periodic performance assessments scored across 7 criteria (safety awareness, responsibility, conduct, planning, communication, people management, quality), a performance dashboard with score trends and best/lowest criterion averages, an assessment log tracking adjusted scores and open actions, and detailed scoring guidance with 1–5 anchored descriptors.",
        longDesc: `<p>The PIC Competence Assessment is an Excel-based competence management system for Persons In Charge (PICs) on construction projects. It includes Stage 1 (Tender) and Stage 2 (Pre-Start) checklists that verify a candidate's qualifications, experience, training and site-specific knowledge before they take charge of works, providing a structured gateway process aligned with CDM 2015 competence requirements.</p><p>Once in role, each PIC can receive up to 12 periodic performance assessments scored across seven criteria: safety awareness, responsibility, conduct, planning, communication, people management and quality. Each criterion is rated on a 1–5 scale using anchored descriptors that define exactly what constitutes each score level, removing subjectivity and ensuring consistency across assessors.</p><p>The performance dashboard presents score trends over time with best and lowest criterion averages highlighted, making it easy to identify strengths and development needs. An assessment log tracks adjusted scores (where moderation has been applied) and open actions arising from each review. The template is designed for project managers, construction directors and H&amp;S managers who need to demonstrate PIC competence assurance on major infrastructure projects.</p>`,
        features: [
      "Stage 1 (Tender) and Stage 2 (Pre-Start) competence checklists",
      "Up to 12 periodic performance assessments per PIC",
      "7 scored criteria: safety, responsibility, conduct, planning, communication, people management, quality",
      "1-5 anchored scoring descriptors for consistent assessment",
      "Performance dashboard with score trends over time",
      "Best and lowest criterion averages highlighted",
      "Assessment log with adjusted scores and open actions",
      "CDM 2015 competence requirement alignment",
      "Designed for project managers, construction directors and H&S managers",
      "Suitable for major infrastructure and capital delivery projects"
    ],
        images: ["product-images/Persons-In-Charge-Assessment-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/pic-competence-assessment",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "March 2026",
        popularity: 8,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 13. Temporary Works Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 14. Plant & Equipment Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 15. Commissioning Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 16. Permit to Work System
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££


  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 17. HAVS Monitoring Register
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "havs-monitoring",
    title: "HAVS Monitoring Register",
    altText: "HAVS Monitoring Register Excel template with HSE points method exposure calculator and tool library",
    category: ["hse", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "ð¦º",
    desc: "Multi-operative HAV exposure calculator using the HSE points method with a pre-loaded tool library, trigger time and daily A(8) calculations, per-operative exposure logging, configurable active/inactive operatives, and a filterable dashboard with monthly points charts and top-contributor analysis.",
    longDesc: `<p>The HAVS Monitoring Register is a comprehensive Excel-based exposure management tool designed for construction and civil engineering teams working with vibrating equipment. It uses the HSE daily exposure points method to calculate Hand-Arm Vibration exposure for each operative, drawing from a pre-loaded tool library that includes manufacturer vibration magnitudes and trigger times for common plant and power tools found on UK construction sites.</p><p>Each operative is tracked individually with their own exposure log, recording which tools they use, for how long, and the resulting daily A(8) exposure value. The system supports configurable active and inactive operative status so leavers and new starters are handled cleanly without disrupting historical records. Tool library entries can be edited or extended to match your specific fleet.</p><p>The filterable dashboard provides monthly exposure point charts, top-contributor analysis by operative and tool type, and summary KPIs showing how many operatives are approaching or exceeding action and limit values. All outputs are formatted for audit use and health surveillance evidence packs, aligned with the Control of Vibration at Work Regulations 2005.</p>`,
    features: [
      "HSE daily exposure points method with automatic A(8) calculation per operative",
      "Pre-loaded tool library with manufacturer vibration magnitudes and trigger times",
      "Per-operative exposure logging with date, tool, duration and points tracking",
      "Configurable active/inactive operative status for clean workforce management",
      "Editable tool library — add, remove or update tools to match your fleet",
      "Filterable dashboard with monthly exposure point trend charts",
      "Top-contributor analysis by operative and by tool type",
      "Action value and exposure limit value tracking with visual alerts",
      "Summary KPIs showing operatives approaching or exceeding limits",
      "Aligned with Control of Vibration at Work Regulations 2005",
      "Print-ready outputs for health surveillance and audit evidence packs",
      "Compatible with Windows and Mac versions of Excel"
    ],
    images: ["product-images/HAVS-Vibration-Monitoring-Register-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/havs-monitoring",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 18. Manual Handling Risk Score Calculator
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "manual-handling-risk-score-calculator",
    title: "Manual Handling Risk Score Calculator",
    altText: "Manual Handling Risk Score Calculator Excel template with MAC and RAPP scoring and task library",
    category: ["hse", "inspection"],
    price: "£9.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "£ ï¸",
    desc: "Combined MAC and RAPP scoring tool covering lift, carry, team handling and push/pull operations with automated risk banding (Low/Medium/High), a 120+ civil engineering task library with suggested handling types and control notes, editable scoring settings, and a built-in assessment register for auditable records.",
    longDesc: `<p>The Manual Handling Risk Score Calculator is an Excel-based assessment tool that combines the HSE MAC (Manual Handling Assessment Charts) and RAPP (Risk Assessment of Pushing and Pulling) scoring methodologies into a single workbook. It covers all four operation types — lifting, carrying, team handling and push/pull — with automated risk banding that categorises each assessment as Low, Medium or High risk based on the scored factors.</p><p>The template includes a pre-built library of over 120 civil engineering tasks commonly encountered on construction sites, each with a suggested handling type and control measure notes. This gives assessors a strong starting point and reduces the time spent writing assessments from scratch. Scoring settings are fully editable so the tool can be calibrated to your organisation's risk appetite or specific project requirements.</p><p>A built-in assessment register captures every completed assessment with date, assessor, task, score, risk band and action status, providing an auditable record for CDM compliance files and health and safety inspections. The tool is designed for practical site use by supervisors, engineers and H&amp;S advisors who need reliable manual handling assessments without specialist software.</p>`,
    features: [
      "Combined MAC and RAPP scoring in a single workbook",
      "Covers lift, carry, team handling and push/pull operation types",
      "Automated risk banding: Low, Medium and High with colour coding",
      "120+ civil engineering task library with suggested handling types",
      "Pre-populated control measure notes for common construction tasks",
      "Editable scoring settings for organisation-specific calibration",
      "Built-in assessment register with date, assessor, task and score logging",
      "Auditable records suitable for CDM compliance files and H&S inspections",
      "Designed for practical site use by supervisors and H&S advisors",
      "Print-ready assessment output for filing and distribution"
    ],
    images: ["product-images/Manual-Handling-Risk-Calculator-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/manual-handling-risk-score-calculator",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 19. Confined Space Assessment Calculator
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "confined-space-assessment-calculator",
    title: "Confined Space Assessment Calculator",
    altText: "Confined Space Assessment Calculator Excel template with NC1-NC4 risk category scoring and requirements",
    category: ["hse", "inspection"],
    price: "£9.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "£ ï¸",
    desc: "Weighted confined space category calculator that scores specified risks (fire, asphyxiation, drowning, entrapment), depth band and access factors to assign an NC1–NC4 risk category, with auto-populated requirements for each category covering training qualifications (C&G 6160), rescue provisions, gas monitoring, breathing apparatus, entry controller competence and permit requirements.",
    longDesc: `<p>The Confined Space Assessment Calculator is an Excel-based weighted scoring tool that helps construction and civil engineering teams categorise confined spaces according to risk level. It evaluates specified risks — including fire and explosion, asphyxiation, drowning, entrapment and toxic atmosphere — alongside depth band and access difficulty factors to assign each space an NC1 to NC4 risk category using a transparent, auditable scoring methodology.</p><p>Once a category is assigned, the tool auto-populates the specific requirements for that risk level, covering training qualifications (including City &amp; Guilds 6160 units), rescue team provisions, gas monitoring equipment, breathing apparatus requirements, entry controller competence levels and whether a formal permit to enter is required. This removes the guesswork from confined space planning and ensures the right controls are specified every time.</p><p>The calculator is aligned with the Confined Spaces Regulations 1997 and industry guidance on safe systems of work for entry into confined spaces. It is designed for use by site managers, H&amp;S advisors and permit coordinators managing excavations, chambers, tanks, culverts and other confined or enclosed spaces on construction projects.</p>`,
    features: [
      "Weighted scoring model for confined space risk categorisation",
      "Evaluates fire, asphyxiation, drowning, entrapment and toxic atmosphere risks",
      "Depth band and access difficulty factor scoring",
      "NC1 to NC4 risk category assignment with transparent methodology",
      "Auto-populated requirements per category for training and rescue provisions",
      "City and Guilds 6160 training qualification mapping by category",
      "Gas monitoring and breathing apparatus requirements per risk level",
      "Entry controller competence and permit requirements auto-specified",
      "Aligned with Confined Spaces Regulations 1997",
      "Designed for excavations, chambers, tanks, culverts and enclosed spaces",
      "Print-ready output for permit packs and method statements"
    ],
    images: ["product-images/Confined-Space-Assessment-Calculator-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/confined-space-assessment-calculator",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 20. Office Fire Risk Assessment
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "office-fire-risk-assessment",
    title: "Office Fire Risk Assessment",
    altText: "Office Fire Risk Assessment Excel template with 38 checks risk matrix and Fire Safety Order compliance",
    category: ["hse", "inspection"],
    price: "£9.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "ð¥",
    desc: "Questionnaire-driven fire risk assessment for construction site offices with 38 control checks across 17 sections, automatic compliance/noncompliance status, a 5×5 likelihood × severity risk matrix with colour-coded ratings (Low/Medium/High/Critical), a live dashboard with section-by-section compliance breakdown, plus Action Plan, Emergency Plan, Fire Safety Log and Review History sheets for a complete Regulatory Reform (Fire Safety) Order 2005 management system.",
    longDesc: `<p>The Office Fire Risk Assessment is a questionnaire-driven Excel template designed for assessing fire risk in construction site offices, cabins and temporary accommodation. It contains 38 structured control checks across 17 sections covering means of escape, fire detection and warning systems, firefighting equipment, electrical safety, housekeeping, storage of flammable materials, emergency lighting, signage and staff training.</p><p>Each check returns an automatic compliance or noncompliance status, and the results feed into a 5×5 likelihood × severity risk matrix that produces colour-coded risk ratings — Low (green), Medium (amber), High (orange) and Critical (red). The live dashboard presents a section-by-section compliance breakdown with visual indicators, giving the responsible person an immediate overview of where the gaps are.</p><p>Supporting sheets include an Action Plan for recording remedial actions with owners and target dates, an Emergency Plan template, a Fire Safety Log for recording drills, equipment checks and maintenance visits, and a Review History sheet for tracking periodic reassessments. Together these sheets provide a complete fire risk management system aligned with the Regulatory Reform (Fire Safety) Order 2005.</p>`,
    features: [
      "38 structured control checks across 17 fire safety sections",
      "Automatic compliance/noncompliance status per check",
      "5x5 likelihood x severity risk matrix with colour-coded ratings",
      "Low, Medium, High and Critical risk rating classifications",
      "Live dashboard with section-by-section compliance breakdown",
      "Action Plan sheet with remedial actions, owners and target dates",
      "Emergency Plan template for site-specific procedures",
      "Fire Safety Log for drills, equipment checks and maintenance records",
      "Review History sheet for periodic reassessment tracking",
      "Aligned with Regulatory Reform (Fire Safety) Order 2005"
    ],
    images: ["product-images/Office-Fire-Risk-Assessment-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/office-fire-risk-assessment",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 21. DA Test Register
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "da-test-register",
    title: "DA Test Register",
    altText: "DA Test Register Excel template for drug and alcohol testing records",
    category: ["inspection", "registers", "commissioning"],
    price: "£9.99",
    oldPrice: "",
    badge: "Inspection",
    icon: "ð",
    desc: "Design acceptance test register for tracking factory acceptance tests, site acceptance tests, and integration tests with structured pass/fail recording, witness tracking, and handover documentation.",
    longDesc: `<p>The DA Test Register is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing da test processes. Design acceptance test register for tracking factory acceptance tests, site acceptance tests, and integration tests with structured pass/fail recording, witness tracking, and handover documentation.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured da test register with comprehensive data capture fields",
      "Automated calculations and conditional formatting for instant visual feedback",
      "Dropdown-driven data entry for speed and consistency across all users",
      "Professional print-ready layouts for client and audit submissions",
      "Built-in data validation to ensure complete and accurate records",
      "Dashboard overview with summary charts and KPI tracking",
      "Searchable and filterable views by date, status, and category",
      "One-click PDF export for distribution and filing",
      "User guide sheet with setup instructions and field descriptions",
      "Compatible with both Windows and Mac versions of Excel"
    ],
    images: ["product-images/Drug-Alcohol-Test-Register-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/da-test-register",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 22. Plant Pre-Use Check Sheets
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "plant-pre-use-check-sheets",
    title: "Plant Pre-Use Check Sheets",
    altText: "Plant Pre-Use Check Sheets Excel template with 28 equipment types and type-specific daily inspection items",
    category: ["plant", "daily", "hse"],
    price: "£9.99",
    oldPrice: "",
    badge: "Plant & Equipment",
    icon: "£ï¸",
    desc: "Printable weekly plant pre-use inspection check sheets covering 28 equipment types — from tracked and wheeled excavators, dumpers, telehandlers and MEWPs to piling rigs, mobile cranes, concrete pumps, vacuum excavators and harnesses — each with 15–25 type-specific daily check items drawn from a built-in question bank, a 7-day Monday-to-Sunday check grid (✓/✗/N/A), defect reporting section, operator declaration and signature block.",
    longDesc: `<p>The Plant Pre-Use Check Sheets template is an Excel workbook providing printable weekly inspection forms for 28 types of construction plant and equipment. Each sheet is pre-populated with 15 to 25 type-specific daily check items drawn from a built-in question bank on the Data sheet, covering the checks an operator must complete before starting work each day — from fluid levels and tyre condition to safety devices, braking systems and attachment security.</p><p>Equipment types covered include crawler and wheeled 360 excavators, mini excavators, tracked and wheeled dozers, forward tipping and rear tipping dumpers, tracked dumpers, articulated dump trucks, wheeled loading shovels, backhoe loaders, skid steer loaders, telescopic handlers, MEWPs, ride-on rollers, compactors, graders, road planers, piling rigs, mobile cranes, concrete pumps, vacuum excavators, site vehicles, tower lights, mobile scaffold towers, harnesses and sweepers.</p><p>Each check sheet has a 7-day Monday-to-Sunday grid for recording ✓ (pass), ✗ (fail) or N/A against each item, a defect details section for recording any issues identified, and an operator declaration with name, signature and date fields. The sheets are formatted for A4 portrait printing and designed to be issued weekly to operators as part of the site plant management system. Check items are editable on the Data sheet so new equipment types or site-specific checks can be added.</p>`,
    features: [
      "28 equipment types with type-specific daily check items",
      "15-25 check items per equipment type from built-in question bank",
      "Excavators, dumpers, telehandlers, MEWPs, cranes, piling rigs and more",
      "Harnesses, scaffold towers, site vehicles and tower lights included",
      "7-day Monday-to-Sunday check grid per sheet",
      "Pass, fail and N/A recording for each check item per day",
      "Defect details section for recording identified issues",
      "Operator declaration with name, signature and date fields",
      "A4 portrait print-ready format for weekly issue to operators",
      "Editable question bank on Data sheet for site-specific customisation",
      "Designed for plant coordinators and site supervisors"
    ],
    images: ["product-images/Plant-Pre-Use-Check-Sheet-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/plant-pre-use-check-sheets",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 8,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 23. Plant Issues Tracker
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "plant-issues-tracker",
    title: "Plant Issues Tracker",
    altText: "Plant Issues Tracker Excel template with damage delivery and repair logs and supplier KPI dashboards",
    category: ["plant", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "Plant & Equipment",
    icon: "£ï¸",
    desc: "Three-log plant issues tracker covering damage (on-hire/on-site defects with cost estimates and responsibility assignment), delivery problems (late arrivals, missing items, LOLER cert issues with wait-time tracking), and repairs (breakdown logging with promised vs actual repair dates) — each with severity grading, supplier-level KPI dashboards and escalation history.",
    longDesc: `<p>The Plant Issues Tracker is an Excel workbook with three dedicated issue logs — Damage, Delivery Problems and Repairs — designed for construction sites that hire and operate plant fleets. The Damage log records on-hire and on-site defects with cost estimates, responsibility assignment (hire company vs site) and photographic evidence referencing, creating an auditable trail for back-charge disputes and insurance claims.</p><p>The Delivery Problems log tracks late arrivals, missing items, incorrect specifications and LOLER certificate issues, with wait-time recording so you can quantify the impact of supplier failures on programme and productivity. The Repairs log captures breakdowns with fault descriptions, promised repair dates versus actual completion dates, and downtime duration, enabling you to hold hire companies accountable for response times.</p><p>Each log includes severity grading (minor, moderate, major, critical) and the supplier-level KPI dashboards aggregate issues by hire company, showing total issue counts, average resolution times, cost exposure and repeat-offender patterns. Escalation history fields track when and how issues were raised with suppliers. The tracker is designed for site managers, plant coordinators and commercial teams managing hired plant on active construction projects.</p>`,
    features: [
      "Three dedicated issue logs: Damage, Delivery Problems and Repairs",
      "On-hire and on-site defect recording with cost estimates",
      "Responsibility assignment for back-charge disputes and insurance claims",
      "Late arrival and missing item tracking with wait-time recording",
      "LOLER certificate issue flagging for compliance management",
      "Breakdown logging with promised vs actual repair date comparison",
      "Severity grading: minor, moderate, major and critical classifications",
      "Supplier-level KPI dashboards with issue counts and resolution times",
      "Escalation history tracking with dates and actions",
      "Repeat-offender pattern identification across hire companies",
      "Designed for site managers, plant coordinators and commercial teams"
    ],
    images: ["product-images/Plant-Issues-Tracker-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/plant-issues-tracker",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 24. Access Equipment Selector
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "access-equipment-selector",
    title: "Access Equipment Selector",
    altText: "Access Equipment Selector Excel template with HSE hierarchy scoring for 14 equipment types",
    category: ["plant", "hse"],
    price: "£9.99",
    oldPrice: "",
    badge: "Plant & Equipment",
    icon: "ðï¸",
    desc: "HSE hierarchy-driven decision-support tool evaluating 14 equipment types — from fixed scaffold and MEWPs to podium steps and ladders — against working height, task duration, ground conditions, space constraints, wind exposure and site hazards, returning the top 3 ranked options with training requirements, pre-use controls and a print-ready assessment sheet.",
    longDesc: `<p>The Access Equipment Selector is an Excel-based decision-support tool that helps construction teams choose the right access equipment for any task, following the HSE hierarchy of control for working at height. It evaluates 14 equipment types — including fixed scaffold, system scaffold, MEWPs (cherry pickers and scissor lifts), mast climbers, tower scaffolds, podium steps, hop-ups and portable ladders — against a set of site-specific input factors.</p><p>Users enter the working height, task duration, ground conditions, available space, wind exposure level and any site-specific hazards. The tool then scores each equipment type against these factors and returns the top three ranked options, each with a summary of required training qualifications, pre-use inspection requirements and control measures that should be in place before work begins.</p><p>The output includes a print-ready assessment sheet that documents the selection rationale, the factors considered, and the recommended equipment — suitable for filing as part of your method statement, RAMS pack or working at height risk assessment. The tool is aligned with the Work at Height Regulations 2005 and designed for use by site managers, supervisors and temporary works coordinators.</p>`,
    features: [
      "HSE hierarchy-driven scoring for working at height equipment selection",
      "Evaluates 14 equipment types from fixed scaffold to portable ladders",
      "Input factors: working height, task duration, ground conditions, space and wind",
      "Site-specific hazard assessment integrated into the scoring model",
      "Returns top 3 ranked equipment options with justification",
      "Training requirements listed for each recommended equipment type",
      "Pre-use inspection and control measure checklists per equipment type",
      "Print-ready assessment sheet for RAMS packs and method statements",
      "Aligned with Work at Height Regulations 2005",
      "Designed for site managers, supervisors and temporary works coordinators"
    ],
    images: ["product-images/Access-Equipment-Selector-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/access-equipment-selector",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 25. Fuel Usage Calculator
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "fuel-usage-calculator",
    title: "Fuel Usage Calculator",
    altText: "Fuel Usage Calculator Excel template with 575 item equipment database and duty cycle consumption rates",
    category: ["plant", "cost", "environmental"],
    price: "£9.99",
    oldPrice: "",
    badge: "Cost & Carbon",
    icon: "£½",
    desc: "Plant fuel usage calculator with a 575+ item equipment database covering excavators, dumpers, telehandlers, generators, MEWPs and more — searchable by keyword, type and size range — with fuel consumption rates at 100%, 75%, 50% and 25% duty cycles plus idle, and a calculator that outputs litres per hour and total litres for any model at a selected duty and shift duration.",
    longDesc: `<p>The Fuel Usage Calculator is an Excel-based fuel consumption estimator with a built-in database of over 575 plant and equipment items commonly found on UK construction sites. The database covers excavators, dumpers, telehandlers, generators, MEWPs (cherry pickers and scissor lifts), compressors, pumps, rollers, loading shovels and more, each with fuel consumption rates at five duty cycle levels: 100%, 75%, 50%, 25% and idle.</p><p>The equipment database is searchable by keyword, equipment type and size range, so you can quickly find the specific model or class you need. Once selected, the calculator outputs litres per hour at your chosen duty cycle and total litres consumed for any specified shift duration, giving you the figures needed for fuel ordering, cost forecasting and carbon reporting.</p><p>The tool is designed for site managers, plant coordinators and environmental managers who need to estimate fuel consumption for budgeting, generator sizing, refuelling schedules and project carbon calculations. All consumption rates are based on manufacturer data and industry benchmarks for UK construction plant.</p>`,
    features: [
      "575+ item equipment database covering major UK construction plant types",
      "Excavators, dumpers, telehandlers, generators, MEWPs and more",
      "Fuel consumption rates at 100%, 75%, 50%, 25% duty cycles and idle",
      "Searchable by keyword, equipment type and size range",
      "Litres per hour output at selected duty cycle",
      "Total litres calculation for any specified shift duration",
      "Manufacturer data and industry benchmark consumption rates",
      "Suitable for fuel ordering, cost forecasting and carbon reporting",
      "Designed for site managers, plant coordinators and environmental managers"
    ],
    images: ["product-images/Fuel-Usage-Calculator-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/fuel-usage-calculator",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 26. Subcontractor Performance Scorecard
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "subcontractor-performance-scorecard",
    title: "Subcontractor Performance Scorecard",
    altText: "Subcontractor Performance Scorecard Excel template with RAG league table radar charts and comparison",
    category: ["project", "stakeholder"],
    price: "£9.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Multi-subcontractor performance scorecard scoring each company across 10 criteria on a 1–10 scale (quality, H&S, programme, environment, commercial, housekeeping, resources, cooperation, document submissions, communication) with automatic RAG status (including a critical fail flag for H&S score of zero), a ranked league table dashboard, individual radar chart profiles for each subcontractor, and analysis charts for cross-company comparison.",
    longDesc: `<p>The Subcontractor Performance Scorecard is an Excel-based evaluation tool for scoring and comparing multiple subcontractors working on a construction project. Each company is assessed across 10 criteria — quality, health and safety, programme, environment, commercial, housekeeping, resources, cooperation, document submissions and communication — with each criterion scored on a 1 to 10 scale.</p><p>The system automatically assigns RAG (Red/Amber/Green) status based on total scores and includes a critical fail flag that triggers automatically if a subcontractor receives a zero score on health and safety, regardless of their performance in other areas. This ensures safety-critical underperformance is never masked by strong scores elsewhere.</p><p>A ranked league table dashboard sorts all subcontractors by total weighted score, and individual radar chart profiles visualise each company's strengths and weaknesses across all 10 criteria. Analysis charts enable cross-company comparison on specific criteria, making it easy to identify which subcontractors are leading or lagging in particular areas. The template is designed for project managers, commercial managers and supply chain teams managing subcontractor relationships on multi-trade construction projects.</p>`,
    features: [
      "10 scored criteria: quality, H&S, programme, environment, commercial and more",
      "1-10 scoring scale per criterion per subcontractor",
      "Automatic RAG status based on total scores",
      "Critical fail flag for zero H&S score regardless of other criteria",
      "Ranked league table dashboard sorted by total weighted score",
      "Individual radar chart profiles per subcontractor",
      "Cross-company comparison analysis charts",
      "Multi-subcontractor support for full project supply chain",
      "Designed for project managers, commercial managers and supply chain teams",
      "Suitable for multi-trade construction projects"
    ],
    images: ["product-images/Subcontractor-Performance-Scorecard-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/subcontractor-performance-scorecard",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 27. Site Operative Scorecard
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "site-operative-scorecard",
    title: "Site Operative Scorecard",
    altText: "Site Operative Scorecard Excel template with weighted performance metrics action plans and trend charts",
    category: ["competence", "daily"],
    price: "£9.99",
    oldPrice: "",
    badge: "Competence & Training",
    icon: "ð·",
    desc: "Individual site operative performance scorecard with up to 10 periodic reviews, each scoring 10 weighted metrics (punctuality, safety compliance, PPE usage, quality, productivity, housekeeping, tool care, hazard reporting, teamwork, communication) on a 1–5 anchored scale, an auto-generated action plan with suggested improvements for low-scoring areas, a dashboard showing latest score, category, trend chart and rolling average, and a scorecard summary comparing all reviews side by side.",
    longDesc: `<p>The Site Operative Scorecard is an Excel-based individual performance management tool for construction site workers. Each operative can receive up to 10 periodic reviews, with each review scoring 10 weighted metrics: punctuality, safety compliance, PPE usage, quality of work, productivity, housekeeping, tool care, hazard reporting, teamwork and communication. Scores use a 1–5 anchored scale with descriptors defining what each level means, ensuring fair and consistent assessment across different reviewers.</p><p>An auto-generated action plan identifies low-scoring areas from each review and suggests specific improvements, giving supervisors a ready-made development conversation framework. The action plan tracks progress against previous reviews so both the supervisor and operative can see whether targeted areas are improving.</p><p>The dashboard shows the operative's latest overall score, performance category (e.g. Excellent, Good, Needs Improvement), a trend chart plotting scores over time and a rolling average. A scorecard summary sheet compares all reviews side by side, making it easy to track long-term development. The template is designed for site supervisors and foremen managing individual operative performance on construction projects.</p>`,
    features: [
      "Up to 10 periodic performance reviews per operative",
      "10 weighted metrics: punctuality, safety, PPE, quality, productivity and more",
      "1-5 anchored scoring scale with defined descriptors per level",
      "Auto-generated action plan with suggested improvements for low scores",
      "Progress tracking against previous review actions",
      "Dashboard with latest score, category, trend chart and rolling average",
      "Scorecard summary comparing all reviews side by side",
      "Performance categories: Excellent, Good, Needs Improvement",
      "Designed for site supervisors and foremen on construction projects",
      "Consistent assessment framework across different reviewers"
    ],
    images: ["product-images/Site-Operative-Scorecard-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/site-operative-scorecard",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 28. Allocation Sheet
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "allocation-sheet",
    title: "Allocation Sheet",
    altText: "Daily Allocation Sheet Excel template with VBA macros for PDF distribution and day creation",
    category: ["daily", "planning"],
    price: "£9.99",
    oldPrice: "",
    badge: "Daily Operations",
    icon: "ð",
    desc: "VBA-enabled daily labour and plant record with hours allocated against up to 10 numbered site operations, materials delivered, weather conditions and client sign-off blocks — plus one-click PDF email distribution to your team and a Create New Day macro that archives the current sheet and generates tomorrow's blank with all header info carried forward.",
    longDesc: `<p>The Allocation Sheet is a VBA-enabled daily labour and plant record designed for construction site supervisors who need to document workforce deployment, plant usage and material deliveries each day. Hours are allocated against up to 10 numbered site operations, giving a clear breakdown of where labour and plant time was spent across different work fronts or activity codes.</p><p>Each daily sheet captures weather conditions (morning and afternoon), materials delivered to site, and includes a client representative sign-off block for formal daily record agreement. The VBA macros provide two key time-saving features: a one-click PDF email distribution button that generates a PDF of the current day's sheet and emails it to a pre-configured distribution list via Outlook, and a Create New Day macro that archives the current sheet and generates a fresh blank for the next working day with all header information (project name, contract number, site team) carried forward automatically.</p><p>The template is designed for daily use on active construction sites and produces professional, print-ready records suitable for QS daywork substantiation, contract correspondence and project filing.</p>`,
    features: [
      "Daily labour record with hours allocated against up to 10 site operations",
      "Plant allocation tracking by equipment type and hours per operation",
      "Materials delivered log with quantities and supplier details",
      "Weather conditions recording for morning and afternoon",
      "Client representative sign-off block for formal daily agreement",
      "One-click PDF email distribution via Outlook integration",
      "Create New Day macro that archives current sheet and generates tomorrow's blank",
      "Header information auto-carried forward to each new day",
      "Professional print-ready layout for QS and contract filing",
      "VBA-powered automation requiring macro-enabled Excel (.xlsm)"
    ],
    images: ["product-images/Allocation-Sheet-Template-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/allocation-sheet",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 29. Leave Calendar
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "leave-calendar",
    title: "Leave Calendar",
    altText: "Leave Calendar Excel template with multi-year absence tracking heatmaps and headcount forecasting",
    category: ["daily", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "Daily Operations",
    icon: "ð",
    desc: "Multi-year leave and absence tracker (2026–2031) for site teams with half-day booking precision, job family breakdowns, a 30-day look-ahead, annual heatmaps showing daily headcount off, monthly calendar views, a summary dashboard with peak-day and most-affected-team KPIs, and pre-loaded England & Wales bank holidays.",
    longDesc: `<p>The Leave Calendar is a multi-year leave and absence management tool built in Excel for construction site teams. Covering the period 2026 to 2031, it provides half-day booking precision so you can accurately record morning or afternoon absences without losing visibility of who is available on any given shift. Each team member is assigned a job family, enabling filtered views and reports by trade, discipline or department.</p><p>The calendar includes a 30-day look-ahead view for short-term resource planning, plus annual heatmap sheets that show daily headcount off using colour-graded cells — making it easy to spot peak absence periods at a glance. Monthly calendar views break down each person's bookings day by day, and the summary dashboard surfaces key KPIs including the peak absence day, the most affected team, average days off per person, and remaining entitlement balances.</p><p>England and Wales bank holidays are pre-loaded for each year, and the system handles annual entitlement tracking with carried-forward and used-to-date calculations. The template is designed for site-based teams of up to 50 people and produces print-ready views for office wall display and team briefings.</p>`,
    features: [
      "Multi-year coverage from 2026 to 2031 with automatic date handling",
      "Half-day booking precision for morning and afternoon absence recording",
      "Job family breakdowns for filtering by trade, discipline or department",
      "30-day look-ahead view for short-term resource planning",
      "Annual heatmaps with colour-graded daily headcount off",
      "Monthly calendar views with per-person day-by-day bookings",
      "Summary dashboard with peak-day and most-affected-team KPIs",
      "Pre-loaded England and Wales bank holidays for each year",
      "Annual entitlement tracking with carried-forward and used-to-date calculations",
      "Print-ready views for site office wall display and team briefings",
      "Supports teams of up to 50 people across multiple job families"
    ],
    images: ["product-images/Leave-Calendar-Template-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/leave-calendar",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 30. Temporary Works Class Matrix
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "temporary-works-class-matrix",
    title: "Temporary Works Class Matrix",
    altText: "Temporary Works Class Matrix Excel template with BS 5975 risk classification and design check categories",
    category: ["temporary", "hse"],
    price: "£9.99",
    oldPrice: "",
    badge: "Temporary Works",
    icon: "ð§",
    desc: "BS 5975:2024 aligned temporary works classification and design check reference tool with a Risk Class matrix (Class 0–3 across formwork, falsework, back propping, façade retention, reinforcement cages, hoarding and more), a Design Check Category matrix (Cat 0–3 with checker independence, documentation and escalation triggers), a risk-to-category mapping sheet, and a blank TW Register template for recording items with risk class, design check category, designer, checker and permit status.",
    longDesc: `<p>The Temporary Works Class Matrix is an Excel-based classification and design check reference tool aligned with BS 5975:2024, the code of practice for temporary works procedures. The Risk Class matrix assigns Class 0 to Class 3 ratings across a range of temporary works types including formwork, falsework, back propping, façade retention, reinforcement cages, hoarding, temporary barriers, excavation support and crane bases, based on the consequence of failure and complexity of the works.</p><p>The Design Check Category matrix defines Cat 0 to Cat 3 requirements covering checker independence levels, documentation standards and escalation triggers — specifying when a self-check is sufficient, when an independent check within the same organisation is needed, and when an external third-party check is required. A risk-to-category mapping sheet cross-references risk class against design check category to determine the appropriate checking regime for any given item.</p><p>A blank Temporary Works Register template is included for recording each TW item with its risk class, design check category, designer, checker, permit status and inspection requirements. The template is designed for temporary works coordinators (TWCs), designers and project engineers who need a quick-reference classification tool and register framework for BS 5975 compliance.</p>`,
    features: [
      "BS 5975:2024 aligned risk classification and design check reference",
      "Risk Class matrix: Class 0 to Class 3 across multiple TW types",
      "Covers formwork, falsework, back propping, facade retention, hoarding and more",
      "Design Check Category matrix: Cat 0 to Cat 3 with checker requirements",
      "Checker independence levels, documentation and escalation triggers",
      "Risk-to-category mapping sheet for cross-referencing",
      "Blank TW Register template with risk class, designer, checker and permit fields",
      "Consequence of failure and complexity-based classification",
      "Designed for temporary works coordinators, designers and project engineers",
      "Quick-reference tool for BS 5975 compliance on construction projects"
    ],
    images: ["product-images/Temporary-Works-Class-Matrix-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/temporary-works-class-matrix",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 31. Ladder & Stepladder Permit
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "ladder-stepladder-permit",
    title: "Ladder & Stepladder Permit",
    altText: "Ladder and Stepladder Permit to Work Excel template with automated compliance checks and sign-off form",
    category: ["hse", "daily"],
    price: "£9.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "ðª",
    desc: "Dynamic permit-to-work for portable ladders and stepladders with 16 automated compliance checks across equipment type, stability, competence, duration and site hazards — returning live PASS, FAIL or WARN status with remedial advice and a four-stage sign-off permit form (Initiation, Authorisation, Acceptor, Close-Out).",
    longDesc: `<p>The Ladder &amp; Stepladder Permit is a dynamic permit-to-work system built in Excel for construction sites that need to control and authorise the use of portable ladders and stepladders. It runs 16 automated compliance checks covering equipment type selection, stability and securing arrangements, user competence, maximum permitted duration, overhead hazards, weather exposure, and ground conditions, returning a live PASS, FAIL or WARN status for each check with specific remedial advice where issues are identified.</p><p>The permit follows a four-stage sign-off workflow: Initiation (the person requesting the permit), Authorisation (the supervisor or manager approving the work), Acceptor (the operative confirming understanding of controls), and Close-Out (confirmation the work is complete and the equipment removed). Each stage captures name, signature, date and time fields, providing a complete audit trail.</p><p>Designed around the Work at Height Regulations 2005 hierarchy of control, the system ensures ladders are only authorised where no safer alternative is reasonably practicable. The permit form is print-ready for site use and formatted for filing as part of your project safety documentation.</p>`,
    features: [
      "16 automated compliance checks across equipment, stability, competence and hazards",
      "Live PASS, FAIL and WARN status with specific remedial advice for each check",
      "Four-stage sign-off workflow: Initiation, Authorisation, Acceptor, Close-Out",
      "Equipment type selection covering portable ladders and stepladders",
      "Stability and securing arrangement checks with condition assessment",
      "User competence verification and maximum duration controls",
      "Overhead hazard, weather exposure and ground condition checks",
      "Work at Height Regulations 2005 hierarchy of control alignment",
      "Print-ready permit form formatted for site use and audit filing",
      "Complete audit trail with name, signature, date and time at each stage"
    ],
    images: ["product-images/Ladder-Stepladder-Permit-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/ladder-stepladder-permit",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 32. Aggregate Import Tracker
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "aggregate-import-tracker",
    title: "Aggregate Import Tracker",
    altText: "Aggregate Import Tracker Excel template with CO2 emissions tracking and supplier performance dashboard",
    category: ["concrete", "registers", "planning"],
    price: "£9.99",
    oldPrice: "",
    badge: "Concrete & Materials",
    icon: "ðª¨",
    desc: "Site-level aggregate delivery log with automatic CO₂e emissions tracking (recycled vs virgin), supplier performance summaries, monthly tonnage and carbon breakdowns, weighbridge ticket referencing, and a live dashboard showing programme-to-date KPIs including recycled share, carbon intensity per tonne and top supplier analysis.",
    longDesc: `<p>The Aggregate Import Tracker is an Excel-based delivery log for construction sites receiving bulk aggregate materials. Each delivery is recorded with date, supplier, material type, tonnage, weighbridge ticket reference and whether the material is recycled or virgin — enabling automatic CO₂e emissions calculations that distinguish between lower-carbon recycled aggregates and higher-carbon virgin materials.</p><p>Supplier performance summaries aggregate delivery data by supplier, showing total tonnage delivered, number of loads, average load size and reliability metrics. Monthly breakdowns present tonnage and carbon data side by side so project teams can report on both material usage and environmental impact in a single view.</p><p>The live dashboard surfaces programme-to-date KPIs including total tonnage received, recycled material share as a percentage, carbon intensity per tonne, cumulative CO₂e, and top supplier analysis by volume. The tracker is designed for site engineers, materials managers and environmental coordinators who need accurate delivery records for cost reporting, carbon reduction plans and SWMP compliance.</p>`,
    features: [
      "Per-delivery logging with date, supplier, material type and tonnage",
      "Automatic CO₂e emissions tracking for recycled vs virgin aggregates",
      "Weighbridge ticket referencing for auditable delivery records",
      "Supplier performance summaries with tonnage, loads and reliability metrics",
      "Monthly tonnage and carbon breakdowns for reporting",
      "Live dashboard with programme-to-date KPIs",
      "Recycled share percentage and carbon intensity per tonne calculations",
      "Top supplier analysis by volume delivered",
      "Supports SWMP compliance and carbon reduction plan reporting",
      "Designed for site engineers, materials managers and environmental coordinators"
    ],
    images: ["product-images/Aggregate-Import-Tracker-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/aggregate-import-tracker",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 33. Aggregate Price Comparison
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 34. Civil Engineering Materials Converter
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "civil-engineering-materials-converter",
    title: "Civil Engineering Materials Converter",
    altText: "Civil Engineering Materials Converter Excel template with unit conversion carbon factors and cost estimation",
    category: ["concrete", "cost"],
    price: "£9.99",
    oldPrice: "",
    badge: "Concrete & Materials",
    icon: "ðï¸",
    desc: "Multi-unit conversion and take-off tool for 100+ civil engineering materials — converting between tonnes, m³, kg, litres, m², bulk bags and wagon loads using loose and compacted densities, with built-in ICE v3 carbon factors (kgCO₂e per tonne), optional cost estimation at £/tonne rates, and category roll-ups across aggregates, soils, concrete and asphalt.",
    longDesc: `<p>The Civil Engineering Materials Converter is an Excel-based multi-unit conversion and take-off tool covering over 100 civil engineering materials commonly used on UK construction sites. It converts between tonnes, cubic metres, kilograms, litres, square metres, bulk bags and wagon loads using both loose and compacted bulk densities, so you can move seamlessly between design quantities, order quantities and delivery units.</p><p>Each material entry includes built-in ICE v3 embodied carbon factors (kgCO₂e per tonne), enabling automatic carbon calculations alongside volume and weight conversions. An optional cost estimation column lets you apply £/tonne rates to generate budget-level cost figures for each material line. Category roll-ups summarise totals across aggregates, soils, concrete, asphalt and other material groups.</p><p>The tool is designed for site engineers, quantity surveyors and materials managers who need fast, accurate conversions for take-offs, orders, waste calculations and carbon reporting. The material database covers everything from Type 1 sub-base and MOT to structural concrete, topsoil, recycled aggregates and specialist fills.</p>`,
    features: [
      "100+ civil engineering materials with loose and compacted bulk densities",
      "Converts between tonnes, m³, kg, litres, m², bulk bags and wagon loads",
      "Built-in ICE v3 embodied carbon factors (kgCO₂e per tonne)",
      "Optional cost estimation at configurable £/tonne rates",
      "Category roll-ups across aggregates, soils, concrete and asphalt",
      "Loose and compacted density values for accurate volume/weight conversion",
      "Covers Type 1, MOT, structural concrete, topsoil, recycled aggregates and more",
      "Designed for take-offs, orders, waste calculations and carbon reporting",
      "Suitable for site engineers, quantity surveyors and materials managers",
      "Single-sheet layout for fast data entry and review"
    ],
    images: ["product-images/Civil-Engineering-Materials-Converter-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/civil-engineering-materials-converter",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 35. Waste Export Tracker
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "waste-export-tracker",
    title: "Waste Export Tracker",
    altText: "Waste Export Tracker Excel template with EWC codes haulier register and landfill diversion dashboard",
    category: ["environmental", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "Environmental",
    icon: "ð±",
    desc: "Waste export traceability tracker logging every load or tonnage removed from site — by material stream, EWC code, contamination status, disposal route, haulier, WTN/consignment note and location — with an integrated haulier register (waste carrier licence auto-fill), a live dashboard showing landfill diversion rates, monthly tonnage trends, and top material stream breakdowns.",
    longDesc: `<p>The Waste Export Tracker is an Excel-based traceability tool for logging every waste load or tonnage removed from a construction site. Each export is recorded by material stream, European Waste Catalogue (EWC) code, contamination status, disposal route (landfill, recovery, recycling, treatment), haulier, waste transfer note or consignment note reference and destination location, building a complete auditable record for duty-of-care compliance.</p><p>An integrated haulier register stores waste carrier licence details and auto-fills carrier information when a haulier is selected, reducing data entry time and ensuring licence references are always captured. The register supports multiple hauliers and can be extended as new carriers are engaged on the project.</p><p>The live dashboard shows landfill diversion rates as a headline percentage, monthly tonnage trend charts, and top material stream breakdowns by weight and count. These KPIs support SWMP reporting, carbon reduction plan evidence, and client sustainability reporting requirements. The tracker is designed for site environmental managers, waste coordinators and project teams managing waste on civil engineering and building projects.</p>`,
    features: [
      "Per-load waste export logging with material stream and EWC code",
      "Contamination status and disposal route recording per export",
      "Haulier, WTN/consignment note and destination location fields",
      "Integrated haulier register with waste carrier licence auto-fill",
      "Live dashboard with landfill diversion rate percentage",
      "Monthly tonnage trend charts for waste volume tracking",
      "Top material stream breakdowns by weight and count",
      "Supports SWMP reporting and carbon reduction plan evidence",
      "Duty-of-care compliance documentation for audits",
      "Designed for environmental managers and waste coordinators"
    ],
    images: ["product-images/Waste-Export-Tracker-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/waste-export-tracker",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 36. WWTW Long Lead Item Tracker
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "wwtw-long-lead-item-tracker",
    title: "WWTW Long Lead Item Tracker",
    altText: "WwTW Long Lead Item Tracker Excel template with MEICA procurement register and delivery dashboard",
    category: ["wastewater", "asset", "planning"],
    price: "£9.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð§",
    desc: "Long-lead procurement tracker for MEICA and ICA items on wastewater treatment projects with a full item register (enquiry to installation status tracking), supplier register with contact and QA details, linked issues and risks log, and a dashboard showing items due in 2/4/8-week windows, late deliveries, total PO value, FAT pass rates and average lead times.",
    longDesc: `<p>The WwTW Long Lead Item Tracker is an Excel-based procurement management tool designed for wastewater treatment works projects with significant MEICA (Mechanical, Electrical, Instrumentation, Control and Automation) and ICA equipment packages. The full item register tracks each piece of equipment from initial enquiry through purchase order, manufacture, factory acceptance testing, delivery and installation, giving the project team complete visibility of procurement status at every stage.</p><p>A linked supplier register stores contact details, QA certification status and performance history for each vendor, and an issues and risks log captures procurement problems, mitigation actions and responsible owners against specific items or suppliers. Issues are cross-referenced to the item register so the impact of any delay or quality concern is immediately visible.</p><p>The dashboard surfaces critical procurement KPIs including items due in 2-week, 4-week and 8-week lookahead windows, late delivery counts, total purchase order value, factory acceptance test pass rates and average lead times by equipment category. The tracker is designed for project managers, procurement leads and commissioning engineers on AMP-framework and capital delivery wastewater projects.</p>`,
    features: [
      "Full item register tracking enquiry to installation status",
      "MEICA and ICA equipment procurement lifecycle management",
      "Supplier register with contact details and QA certification status",
      "Linked issues and risks log with mitigation actions and owners",
      "Dashboard with 2/4/8-week lookahead delivery windows",
      "Late delivery counts and total PO value summaries",
      "Factory acceptance test pass rate tracking",
      "Average lead time calculations by equipment category",
      "Cross-referenced issues to item register for impact visibility",
      "Designed for AMP-framework and capital delivery wastewater projects"
    ],
    images: ["product-images/Long-Lead-Item-Tracker-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/wwtw-long-lead-item-tracker",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 37. Pipe Laying Productivity Log
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "pipe-laying-productivity-log",
    title: "Pipe Laying Productivity Log",
    altText: "Pipe Laying Productivity Log Excel template with gang tracking target rates and pivot analysis",
    category: ["daily", "registers", "wastewater"],
    price: "£9.99",
    oldPrice: "",
    badge: "Daily Operations",
    icon: "ð",
    desc: "Pipe-laying productivity tracker with per-gang, per-shift logging of pipes installed, metres laid, pipe type, diameter band, ground conditions, depth, trench support and delay hours — measured against configurable target rates per pipe type/diameter/length combination, with a filterable dashboard showing actual vs target metres, percentage achieved, rework and delay totals, plus a formula-driven pivot summary cross-tabulating metres by diameter band and pipe length.",
    longDesc: `<p>The Pipe Laying Productivity Log is an Excel-based tracker for recording and analysing pipe installation productivity on civil engineering projects. Each entry captures gang reference, shift date, number of pipes installed, metres laid, pipe type, diameter band, ground conditions encountered, trench depth, trench support method used and delay hours — providing a detailed picture of what was achieved and what factors affected output.</p><p>Configurable target rates are set per pipe type, diameter band and pipe length combination, and the system measures actual output against these targets to calculate percentage achieved for each shift and cumulatively. This makes it easy to identify where gangs are underperforming and whether the cause is ground conditions, delays or other factors.</p><p>The filterable dashboard presents actual vs target metres, percentage achieved, rework counts and delay hour totals with visual charts. A formula-driven pivot summary cross-tabulates total metres laid by diameter band and pipe length, giving project teams a clear summary for programme reporting and earned value calculations. The template is designed for site agents, section engineers and planners on pipeline and infrastructure projects.</p>`,
    features: [
      "Per-gang, per-shift logging of pipes installed and metres laid",
      "Pipe type, diameter band, ground conditions, depth and trench support recording",
      "Delay hours tracking per shift for programme analysis",
      "Configurable target rates per pipe type/diameter/length combination",
      "Actual vs target comparison with percentage achieved calculation",
      "Filterable dashboard with metres, rework and delay totals",
      "Formula-driven pivot summary cross-tabulating metres by diameter and length",
      "Visual charts for productivity trend analysis",
      "Designed for site agents, section engineers and planners",
      "Suitable for pipeline and civil engineering infrastructure projects"
    ],
    images: ["product-images/Pipe-Laying-Productivity-Log-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/pipe-laying-productivity-log",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 7,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 38. Productivity Calculator
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "productivity-calculator",
    title: "Productivity Calculator",
    altText: "Productivity Calculator Excel template for civil engineering daily output across 9 trade activities",
    category: ["project", "cost", "planning"],
    price: "£9.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Multi-trade daily output calculator covering 9 civil engineering activities — steel fixing, pipe laying, muck shift, formwork, concrete pouring, kerb laying, piling, road base and asphalt — with adjustable shift hours, gang sizes, site constraints, ground conditions, equipment type and region factors, producing a calculated daily output figure (kg/day, m/day, m³/day, m²/day or piles/day).",
    longDesc: `<p>The Productivity Calculator is an Excel-based daily output estimator covering nine core civil engineering activities: steel fixing, pipe laying, muck shift (bulk earthworks), formwork erection, concrete pouring, kerb laying, piling, road base construction and asphalt surfacing. For each activity, you enter the shift duration, gang size and a set of site-specific adjustment factors to produce a calculated daily output figure in the appropriate unit — kg/day for steel, m/day for pipes and kerbs, m³/day for earthworks and concrete, m²/day for road base and asphalt, or piles/day for piling.</p><p>Adjustment factors include site constraints (congested vs open), ground conditions (good, moderate, poor), equipment type and capacity, access restrictions, and regional productivity modifiers. Each factor applies a multiplier to the base output rate, so the final figure reflects realistic site conditions rather than textbook norms.</p><p>The calculator is designed for site agents, planners and quantity surveyors who need quick, defensible productivity estimates for programme planning, resource levelling and earned value reporting. Output figures can be used to validate subcontractor programmes, check tender allowances and support delay analysis.</p>`,
    features: [
      "Covers 9 civil engineering activities with trade-specific output units",
      "Steel fixing, pipe laying, muck shift, formwork and concrete pouring",
      "Kerb laying, piling, road base and asphalt surfacing calculations",
      "Adjustable shift hours and gang size inputs",
      "Site constraint factors: congested vs open working conditions",
      "Ground condition modifiers: good, moderate and poor",
      "Equipment type and capacity adjustment factors",
      "Regional productivity multipliers for location-specific estimates",
      "Calculated daily output in kg/day, m/day, m³/day, m²/day or piles/day",
      "Designed for site agents, planners and quantity surveyors"
    ],
    images: ["product-images/Construction-Productivity-Calculator-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/productivity-calculator",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 8,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 39. Focused Planning Meeting Template
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "focused-planning-meeting-template",
    title: "Focused Planning Meeting Template",
    altText: "Focused Planning Meeting Template Excel with categorised action register Gantt chart and KPI dashboard",
    category: ["planning", "stakeholder"],
    price: "£9.99",
    oldPrice: "",
    badge: "Planning",
    icon: "ð",
    desc: "Focused planning meeting template with a categorised action register (manpower, plant, materials, permits, blockers, H&S, quality, environment), priority and status tracking, owner and company assignment, a formula-driven Gantt chart from start date to action deadline, an overview dashboard with at-a-glance KPIs (total, complete, blocked, overdue, progress %), and mandatory training cover confirmation.",
    longDesc: `<p>The Focused Planning Meeting Template is an Excel-based action register and look-ahead planning tool designed for construction site coordination meetings. Actions are categorised across eight areas — manpower, plant, materials, permits, blockers, H&amp;S, quality and environment — with priority levels, status tracking, named owners and company assignment for clear accountability.</p><p>Each action has a start date and deadline, and the formula-driven Gantt chart automatically renders a bar for each action across the timeline, giving meeting attendees a visual picture of what needs to happen and when. The overview dashboard provides at-a-glance KPIs including total actions, completed, blocked, overdue and overall progress percentage, so the meeting chair can quickly assess programme health.</p><p>A mandatory training cover confirmation section ensures that training and briefing requirements are addressed at every planning meeting. The template is designed for weekly or fortnightly focused planning sessions on civil engineering and building projects, producing structured meeting outputs that can be printed, distributed or filed as part of the project record.</p>`,
    features: [
      "Categorised action register: manpower, plant, materials, permits, blockers, H&S, quality, environment",
      "Priority and status tracking with named owner and company assignment",
      "Formula-driven Gantt chart from start date to action deadline",
      "Overview dashboard with total, complete, blocked and overdue KPIs",
      "Progress percentage calculation for programme health assessment",
      "Mandatory training cover confirmation section",
      "Visual timeline for meeting attendees and stakeholders",
      "Print-ready meeting output for distribution and project filing",
      "Designed for weekly or fortnightly focused planning sessions"
    ],
    images: ["product-images/Planning-Meeting-Template-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/focused-planning-meeting-template",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 40. Recovery Plan Tracker
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 41. WWTW Valve Schedule
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "wwtw-valve-schedule",
    title: "WWTW Valve Schedule",
    altText: "WwTW Valve Schedule Excel template with valve register P&ID summary and commissioning status dashboard",
    category: ["wastewater", "asset", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð§",
    desc: "Wastewater treatment works valve schedule with a structured valve register (area, system, auto-generated Valve ID, P&ID reference, service, valve type, function, actuation, fail position, DN, rating, materials, status tracking from Design through to Operational), configurable dropdown lists for areas, systems, valve types and actuation methods, an auto-generated Drawing Summary sheet aggregating valve counts by P&ID reference, and a live dashboard showing total, installed, commissioned, operational and defect counts with actuation type breakdowns.",
    longDesc: `<p>The WwTW Valve Schedule is an Excel-based valve management tool designed for wastewater treatment works construction and commissioning projects. The valve register records each valve with area, system, auto-generated Valve ID (format VLV-[AreaCode]-[SystemCode]-[TagSequence]), P&amp;ID reference, service description, valve type (gate, knife gate, butterfly, ball, check, plug, diaphragm, pinch, globe, control valve and more), function (isolation, control, non-return, throttling, pressure reducing, sampling, bypass, scour), actuation method, fail position, DN, pressure rating, body and trim materials, and status.</p><p>Valve status tracks the full delivery lifecycle — Design, Procured, Delivered, Installed, Tested, Commissioned, Operational, Defect, Isolated and Decommissioned — giving the commissioning team visibility of every valve's progress from design through to handover. Dropdown lists for areas, systems, valve types, actuation methods, ratings and materials are fully configurable on a dedicated Lists sheet, and new values can be added without breaking existing data.</p><p>An auto-generated Drawing Summary sheet aggregates valve counts by P&amp;ID reference, showing installed, commissioned, operational and defect counts per drawing. The live dashboard presents headline KPIs including total valves, installed percentage, commissioned percentage, operational percentage, open defects, high-criticality counts and actuation type breakdowns. The template is designed for MEICA engineers, commissioning managers and operations teams on wastewater treatment works projects.</p>`,
    features: [
      "Structured valve register with auto-generated Valve ID (VLV-Area-System-Sequence)",
      "Full technical fields: valve type, function, actuation, fail position, DN, rating, materials",
      "Status tracking from Design through Procured, Delivered, Installed, Tested, Commissioned to Operational",
      "Defect, Isolated and Decommissioned status options for lifecycle management",
      "Configurable dropdown lists for areas, systems, valve types and actuation methods",
      "P&ID reference linking for drawing-based tracking",
      "Auto-generated Drawing Summary aggregating counts by P&ID reference",
      "Live dashboard with total, installed, commissioned, operational and defect KPIs",
      "Actuation type breakdown: manual, electric, pneumatic, hydraulic, gearbox, solenoid",
      "Criticality rating (1-5) for operational risk prioritisation",
      "Designed for MEICA engineers, commissioning managers and operations teams"
    ],
    images: ["product-images/Valve-Schedule-Register-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/wwtw-valve-schedule",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 42. WWTW Sampler Log
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "wwtw-sampler-log",
    title: "WWTW Sampler Log",
    altText: "WwTW Sampler Log Excel template with permit limit compliance dashboard and trend explorer",
    category: ["wastewater", "asset", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð§",
    desc: "Wastewater effluent sampling and compliance tracker with a structured sampler log (date, time, sample point, method, result basis, multi-parameter results), configurable permit limits with action levels per sample point and parameter, a compliance dashboard showing weekly breach rates and 28-day KPIs, and a trend explorer for charting any parameter against permit limits over a custom date range.",
    longDesc: `<p>The WwTW Sampler Log is an Excel-based effluent sampling and compliance tracker designed for wastewater treatment works operators and commissioning teams. The structured sampler log records date, time, sample point, sampling method, result basis (spot, composite, flow-proportional) and multi-parameter analytical results including BOD, suspended solids, ammonia, pH, phosphorus and any additional site-specific determinands.</p><p>Permit limits are configurable per sample point and per parameter, with action levels set below the consent limit to provide early warning of deteriorating effluent quality. The compliance dashboard shows weekly breach rates, 28-day rolling KPIs and overall compliance percentages, giving operators and environmental managers a real-time picture of works performance against discharge consent conditions.</p><p>The trend explorer lets you chart any parameter against its permit limit over a custom date range, making it easy to identify seasonal patterns, process upsets or gradual deterioration. The template is designed for works managers, process scientists and commissioning engineers who need structured sampling records for Environment Agency reporting and operational decision-making.</p>`,
    features: [
      "Structured sampler log with date, time, sample point and method",
      "Multi-parameter results: BOD, SS, ammonia, pH, phosphorus and custom determinands",
      "Configurable permit limits per sample point and parameter",
      "Action levels for early warning below consent limits",
      "Compliance dashboard with weekly breach rates and 28-day KPIs",
      "Overall compliance percentage tracking against discharge consent",
      "Trend explorer charting any parameter against permit limits",
      "Custom date range selection for trend analysis",
      "Designed for Environment Agency reporting and operational management",
      "Suitable for works managers, process scientists and commissioning engineers"
    ],
    images: ["product-images/Wastewater-Sampler-Log-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/wwtw-sampler-log",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 43. Engineer's Instrument Calibration Log
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "engineers-instrument-calibration-log",
    title: "Engineer's Instrument Calibration Log",
    altText: "Engineers Instrument Calibration Log Excel template with automatic expiry tracking and compliance dashboard",
    category: ["inspection", "registers", "commissioning"],
    price: "£9.99",
    oldPrice: "",
    badge: "Inspection",
    icon: "ð",
    desc: "Field instrument calibration register with automatic expiry and status calculation (In Date, Due Soon, Expired) based on configurable intervals per category — covering total stations, GPS, dumpy levels, gas monitors, torque wrenches and more — with a compliance dashboard, monthly snapshot trend tracking, certificate referencing, and a configurable due-soon alert window.",
    longDesc: `<p>The Engineers Instrument Calibration Log is an Excel-based calibration register for field instruments used on construction and civil engineering projects. Each instrument is recorded with asset tag, serial number, manufacturer, model, category and calibration interval, and the system automatically calculates calibration status — In Date, Due Soon or Expired — based on the last calibration date and the configured interval for that instrument category.</p><p>The register covers the full range of site instruments including total stations, GPS receivers, dumpy levels, gas monitors, torque wrenches, pressure gauges, thermometers and flow meters. Certificate reference numbers are recorded against each calibration event for traceability, and the configurable due-soon alert window lets you set how far in advance instruments are flagged as approaching their recalibration date.</p><p>The compliance dashboard shows overall fleet status with counts and percentages for in-date, due-soon and expired instruments, plus monthly snapshot trend tracking so you can monitor compliance rates over time. The template is designed for site engineers, survey teams and commissioning engineers who need to demonstrate instrument traceability and calibration compliance for quality audits and handover documentation.</p>`,
    features: [
      "Automatic calibration status: In Date, Due Soon and Expired",
      "Configurable calibration intervals per instrument category",
      "Covers total stations, GPS, dumpy levels, gas monitors, torque wrenches and more",
      "Certificate reference number recording for calibration traceability",
      "Configurable due-soon alert window for advance warning",
      "Compliance dashboard with fleet status counts and percentages",
      "Monthly snapshot trend tracking for compliance rate monitoring",
      "Asset tag, serial number, manufacturer and model fields",
      "Designed for quality audits and handover documentation",
      "Suitable for site engineers, survey teams and commissioning engineers"
    ],
    images: ["product-images/Instrument-Calibration-Log-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/engineers-instrument-calibration-log",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 44. Meter Readings Log
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "meter-readings",
    title: "Meter Readings Log",
    altText: "Meter Readings Log Excel template with usage cost calculations and portfolio dashboard",
    category: ["wastewater", "daily", "registers"],
    price: "£9.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð",
    desc: "Electricity and water meter reading tracker for up to 12 site meters with automatic usage delta, cost and standing charge calculations per reading, individual meter dashboards with monthly tables and charts, a portfolio dashboard summarising all meters for QS and stakeholder reporting, and a pivot summary sheet with monthly totals — supporting configurable VAT, unit rates and standing charges.",
    longDesc: `<p>The Meter Readings Log is an Excel-based utility consumption tracker for construction sites with up to 12 electricity and water meters. Each reading is recorded with date, meter reference and reading value, and the system automatically calculates usage delta (units consumed since last reading), cost at the configured unit rate, and standing charge — giving you a running total of consumption and spend for every meter on site.</p><p>Individual meter dashboards present monthly usage tables and charts showing consumption patterns over time, making it easy to spot anomalies, seasonal trends or unexpected spikes. The portfolio dashboard summarises all meters in a single view with headline KPIs for total consumption, total cost and average unit rates, formatted for QS cost reports and stakeholder presentations.</p><p>A pivot summary sheet cross-tabulates monthly totals across all meters for budget tracking and period-end reporting. VAT rates, unit rates and standing charges are all configurable per meter, so the workbook handles mixed tariffs and different supply contracts. The template is designed for site managers, commercial teams and facility managers tracking temporary site supplies.</p>`,
    features: [
      "Tracks up to 12 electricity and water meters per site",
      "Automatic usage delta calculation between readings",
      "Cost and standing charge calculations per reading",
      "Individual meter dashboards with monthly tables and charts",
      "Portfolio dashboard summarising all meters for stakeholder reporting",
      "Pivot summary sheet with monthly totals across all meters",
      "Configurable VAT rates, unit rates and standing charges per meter",
      "Anomaly and spike detection through visual consumption charts",
      "Designed for QS cost reports and budget tracking",
      "Suitable for site managers and commercial teams on temporary supplies"
    ],
    images: ["product-images/Meter-Readings-Log-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/meter-readings",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 5,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 45. Testing & Commissioning Log
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 46. NCR Schedule
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 47. Root Cause Analysis Template
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "root-cause-analysis",
    title: "Root Cause Analysis Template",
    altText: "Root Cause Analysis Template Excel workbook with Five Whys guided analysis and action tracker",
    category: ["inspection", "hse"],
    price: "£9.99",
    oldPrice: "",
    badge: "Inspection",
    icon: "ð",
    desc: "Five Whys root cause analysis workbook with structured incident details (reference, location, date, severity, impact), a guided five-step questioning sheet linking problem statement to final root cause, a corrective and preventive action tracker with owner, priority, due dates and verification status, an evidence and verification log for audit-ready documentation, and a change log for material amendments.",
    longDesc: `<p>The Root Cause Analysis Template is an Excel workbook that guides construction teams through a structured Five Whys investigation process. The incident details sheet captures reference number, location, date, severity classification and impact description, establishing the context for the investigation before analysis begins.</p><p>The guided five-step questioning sheet walks the investigator from the initial problem statement through each successive Why, with space to record evidence, assumptions and reasoning at each level until the root cause is identified. This structured approach ensures investigations go deep enough to find systemic causes rather than stopping at surface symptoms.</p><p>A corrective and preventive action (CAPA) tracker records each action arising from the investigation with named owner, priority level, target due date and verification status, ensuring actions are followed through to completion. The evidence and verification log provides a place to record supporting documents, photographs, witness statements and test results for audit-ready documentation. A change log tracks material amendments to the investigation record. The template is designed for site managers, H&amp;S advisors and quality managers conducting incident investigations on construction projects.</p>`,
    features: [
      "Structured incident details: reference, location, date, severity and impact",
      "Guided Five Whys questioning sheet from problem statement to root cause",
      "Evidence and reasoning recording at each investigation level",
      "Corrective and preventive action (CAPA) tracker",
      "Named owner, priority, due date and verification status per action",
      "Evidence and verification log for audit-ready documentation",
      "Change log for material amendments to the investigation",
      "Systematic approach to finding root causes beyond surface symptoms",
      "Designed for incident investigations on construction projects",
      "Suitable for site managers, H&S advisors and quality managers"
    ],
    images: ["product-images/Root-Cause-Analysis-Fishbone-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/root-cause-analysis",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 48. Decision Matrix
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "decision-matrix",
    title: "Decision Matrix",
    altText: "Decision Matrix Excel template with weighted scoring normalised rankings and comparison dashboard",
    category: ["project", "cost"],
    price: "£9.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Weighted decision matrix scoring up to 8 options against customisable criteria on a 1–10 scale, with editable importance weightings (1–10), automated weighted-score calculation, normalised percentage rankings, and a dashboard view for side-by-side option comparison.",
    longDesc: `<p>The Decision Matrix is an Excel-based weighted scoring tool that helps construction teams evaluate and compare up to eight options against a set of customisable criteria. Each criterion is scored on a 1 to 10 scale and assigned an importance weighting (also 1 to 10), and the system automatically calculates weighted scores and normalised percentage rankings to identify the strongest option objectively.</p><p>The dashboard view presents all options side by side with their total weighted scores, percentage rankings and individual criterion scores, making it easy to see where each option is strong or weak. This structured approach removes subjective bias from decisions and provides a documented rationale that can be presented to stakeholders, clients or auditors.</p><p>The template is suitable for a wide range of construction decisions including supplier selection, design option appraisal, equipment procurement, site layout comparison and subcontractor evaluation. Criteria and weightings are fully editable so the matrix adapts to any decision context.</p>`,
    features: [
      "Score up to 8 options against customisable criteria",
      "1 to 10 scoring scale for each criterion per option",
      "Editable importance weightings from 1 to 10",
      "Automated weighted-score calculation with formula protection",
      "Normalised percentage rankings for objective comparison",
      "Dashboard view with side-by-side option comparison",
      "Individual criterion score visibility per option",
      "Suitable for supplier selection, design appraisal and procurement decisions",
      "Documented rationale for stakeholder and audit presentations"
    ],
    images: ["product-images/Decision-Matrix-Template-excel-ebrora.jpg"],
    buyLink: "https://ebrora.gumroad.com/l/decision-matrix",
    youtubeId: "",
    new: true,
    featured: false,
    compatible: "Windows & Mac",
    version: "1.0",
    fileSize: "1.2 MB",
    lastUpdate: "June 2026",
    popularity: 6,
    isBundle: false,
    bundleProducts: [],
  },
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 49. RAM Matrix
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  // 50. Lessons Learned Register
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
// ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // OWL List
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "owl-list",
        title: "OWL List",
    altText: "Outstanding Work List Excel snagging register with 1200 item capacity overdue ageing and walkdown views",
        category: ["inspection", "registers", "hse"],
        price: "£9.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "Outstanding Work List (snagging/defect register) with 1,200+ item capacity, tracking each item by area, sub-area, discipline (Civils/EICA/Mechanical), category, company and responsible individual — with agreed and revised close-out dates, days open and overdue calculations, a live dashboard with open/closed totals, overdue ageing bands (0–30, 31–60, 61–90, 90+ days), and an interactive person-based filter view for targeted walkdown follow-up.",
        longDesc: `<p>The OWL List (Outstanding Work List) is a high-capacity snagging and defect register built in Excel for construction projects approaching completion or in the defects liability period. With capacity for over 1,200 items, it tracks each snag or defect by area, sub-area, discipline (Civils, EICA, Mechanical), category, responsible company and named individual, providing granular accountability for every open item.</p><p>Each entry records agreed and revised close-out dates, and the system automatically calculates days open and days overdue for items past their deadline. The live dashboard presents open/closed totals, completion percentages and overdue ageing bands (0–30, 31–60, 61–90 and 90+ days), giving project managers and commissioning leads a clear picture of close-out progress and where blockages are occurring.</p><p>An interactive person-based filter view lets you generate targeted walkdown lists for individual subcontractors or responsible persons, so site walkdowns can focus on specific accountability rather than reviewing the entire register. The template is designed for commissioning managers, project engineers and completion teams on civil engineering, building and wastewater treatment projects.</p>`,
        features: [
      "1,200+ item capacity snagging and defect register",
      "Tracking by area, sub-area, discipline, category, company and individual",
      "Civils, EICA and Mechanical discipline classification",
      "Agreed and revised close-out date recording per item",
      "Automatic days open and days overdue calculations",
      "Live dashboard with open/closed totals and completion percentages",
      "Overdue ageing bands: 0-30, 31-60, 61-90 and 90+ days",
      "Interactive person-based filter view for targeted walkdowns",
      "Designed for commissioning, completion and defects liability phases",
      "Suitable for civil engineering, building and wastewater treatment projects"
    ],
        images: ["product-images/OWL-Register-Observation-Checklist-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/owl-list",
        youtubeId: "",
        new: true,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.3 MB",
        lastUpdate: "June 2026",
        popularity: 9,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Survey Control Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "survey-control-register",
        title: "Survey Control Register",
    altText: "Survey Control Register Excel template with 50 station capacity verification logs and BS 5606 alignment",
        category: ["inspection", "registers", "planning"],
        price: "£9.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "Comprehensive survey control register for civil engineering projects with a 50-station capacity station register (coordinates, accuracy class A–D, zone, construction phase, RAG status), detailed station description sheets (physical description, photo references, access notes, instrument details), a verification log, displacement monitoring sheet, third-party survey records, network adjustment log, decommission log, and a dashboard summarising active, inactive, destroyed and at-risk stations with type and RAG breakdowns — aligned to BS 5606, BS EN ISO 17123 and RICS guidance.",
        longDesc: `<p>The Survey Control Register is a comprehensive Excel workbook for managing survey control networks on civil engineering projects. The station register has capacity for 50 control stations, each recorded with full coordinates (easting, northing, level), accuracy class (A to D), zone, construction phase, RAG status and current condition. This provides the survey team with a single authoritative record of all control infrastructure on the project.</p><p>Detailed station description sheets capture physical descriptions, photograph references, access notes and instrument details for each station, creating the documentation needed for station recovery and third-party use. Supporting logs include a verification log for recording check surveys, a displacement monitoring sheet for tracking station movement over time, third-party survey records, a network adjustment log and a decommission log for stations removed from service.</p><p>The dashboard summarises active, inactive, destroyed and at-risk station counts with type and RAG breakdowns, giving the survey manager an immediate overview of network health. The register is aligned to BS 5606 (Guide to accuracy in building), BS EN ISO 17123 (Optics and optical instruments — field procedures for testing) and RICS guidance on survey control. It is designed for survey engineers, setting-out teams and project surveyors on civil engineering infrastructure projects.</p>`,
        features: [
      "50-station capacity register with coordinates, accuracy class and RAG status",
      "Accuracy classes A to D with zone and construction phase tracking",
      "Detailed station description sheets with photos, access notes and instruments",
      "Verification log for check survey recording",
      "Displacement monitoring sheet for station movement tracking",
      "Third-party survey records and network adjustment log",
      "Decommission log for stations removed from service",
      "Dashboard with active, inactive, destroyed and at-risk station counts",
      "Type and RAG breakdown summaries for network health overview",
      "Aligned to BS 5606, BS EN ISO 17123 and RICS guidance",
      "Designed for survey engineers and setting-out teams on infrastructure projects"
    ],
        images: ["product-images/Survey-Control-Register-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/survey-control-register",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 7,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Process Client Training Log
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "process-client-training-log",
        title: "Process Client Training Log",
    altText: "Process Client Training Log Excel template with trainee register gap analysis and competence dashboard",
        category: ["competence", "commissioning", "registers"],
        price: "£9.99",
        oldPrice: "",
        badge: "Commissioning",
        icon: "£",
        desc: "Process and client training management system for wastewater commissioning and handover, with a trainee register, per-module training log (area, category, delivery method, pass/fail assessment, competence status, refresher tracking), a gap analysis sheet showing each trainee's mandatory module completion and outstanding gaps, and a dashboard with KPIs for sessions completed vs planned, competence rates, pass rates, and breakdowns by process area, category and weekly trend.",
        longDesc: `<p>The Process &amp; Client Training Log is an Excel-based training management system designed for wastewater treatment works commissioning and handover phases. A trainee register captures all client and operational staff who require training, and the per-module training log records each session with process area, training category, delivery method (classroom, on-plant, assessment), pass/fail outcome, competence status and refresher due dates.</p><p>The gap analysis sheet maps each trainee against the mandatory module list and highlights outstanding gaps — modules not yet scheduled, not yet attended, or failed — giving the commissioning team a clear view of who still needs what before handover can be certified. This is critical for AMP-framework projects where client training completion is a contractual deliverable.</p><p>The dashboard presents KPIs for sessions completed vs planned, competence rates, pass rates and breakdowns by process area, training category and weekly trend. The template is designed for commissioning managers, training coordinators and project teams who need structured training evidence for handover documentation and client sign-off.</p>`,
        features: [
      "Trainee register for client and operational staff",
      "Per-module training log with area, category and delivery method",
      "Pass/fail assessment recording with competence status tracking",
      "Refresher due date tracking for ongoing competence management",
      "Gap analysis sheet mapping trainees against mandatory modules",
      "Outstanding gap highlighting for handover readiness",
      "Dashboard with sessions completed vs planned KPIs",
      "Competence rates and pass rates by process area and category",
      "Weekly trend tracking for training programme progress",
      "Designed for AMP-framework commissioning and handover documentation"
    ],
        images: ["product-images/Process-Client-Training-Log-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/process-client-training-log",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 7,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Action Calendar
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "action-calendar",
        title: "Action Calendar",
    altText: "Action Calendar Excel template with compliance scheduling dashboard and look-ahead views",
        category: ["project", "planning", "daily"],
        price: "£9.99",
        oldPrice: "",
        badge: "Planning",
        icon: "ð",
        desc: "Weekly compliance action calendar for construction sites with frequency-based scheduling (weekly, monthly, bi-monthly, quarterly), responsible-person assignment, Yes/No completion tracking, overdue-days calculation, a compliance dashboard with monthly trend data and overdue-by-person breakdowns, plus a 4-week look-ahead view.",
        longDesc: `<p>The Action Calendar is a weekly compliance action tracker designed for construction site management teams who need to ensure recurring inspections, checks and submissions happen on time. Actions are scheduled at configurable frequencies — weekly, monthly, bi-monthly or quarterly — and assigned to named responsible persons, creating clear accountability across the team.</p><p>Each action is tracked with a simple Yes/No completion status per scheduled week, and the system automatically calculates overdue days for any missed or late completions. This gives supervisors and project managers an instant view of compliance gaps without having to chase individuals for updates.</p><p>The compliance dashboard presents monthly trend data showing completion rates over time, plus overdue-by-person breakdowns so you can identify who is consistently missing deadlines. A four-week look-ahead view highlights upcoming actions for short-term planning and team briefings. The template is formatted for wall display in site offices and produces print-ready weekly sheets.</p>`,
        features: [
      "Frequency-based scheduling: weekly, monthly, bi-monthly and quarterly actions",
      "Responsible-person assignment with clear accountability tracking",
      "Yes/No completion tracking per scheduled week",
      "Automatic overdue-days calculation for missed or late completions",
      "Compliance dashboard with monthly completion rate trends",
      "Overdue-by-person breakdowns for targeted follow-up",
      "4-week look-ahead view for short-term planning and briefings",
      "Print-ready weekly sheets formatted for site office wall display",
      "Configurable action categories and scheduling frequencies",
      "Scalable for single-site or multi-area compliance programmes"
    ],
        images: ["product-images/Action-Calendar-Template-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/action-calendar",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 8,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // PPE Budget Calculator
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "ppe-budget-calculator",
        title: "PPE Budget Calculator",
    altText: "PPE Budget Calculator Excel template with staff roster driven forecasting and monthly spend charts",
        category: ["hse", "cost"],
        price: "£9.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "ð°",
        desc: "PPE budget forecasting model driven by a staff roster (role, start/end dates, site-based status) and item-level replacement frequency rates — calculating monthly unit quantities and spend across hard hats, glasses, gloves, overtrousers, hi-viz, boots, gauntlets, goggles, ear defenders and coats, with separate rates for site-based, commissioning, attendant and worker roles, editable unit costs, and monthly spend charts.",
        longDesc: `<p>The PPE Budget Calculator is an Excel-based forecasting model that calculates monthly PPE quantities and costs based on your project staff roster. Each person is entered with their role, start and end dates and site-based status, and the system applies item-level replacement frequency rates to generate monthly unit requirements and spend projections for the full suite of standard construction PPE.</p><p>Items covered include hard hats, safety glasses, work gloves, overtrousers, hi-viz vests and jackets, safety boots, gauntlets, goggles, ear defenders and coats. Replacement frequencies are set separately for site-based staff, commissioning personnel, attendants and general workers, reflecting the different wear rates experienced by each role type. Unit costs are fully editable so the model can be calibrated to your actual supplier pricing.</p><p>Monthly spend charts present projected PPE expenditure over the project duration, and the model automatically adjusts when staff join or leave the project. The calculator is designed for site managers, commercial teams and procurement coordinators who need to budget for PPE across the project lifecycle on civil engineering and building projects.</p>`,
        features: [
      "Staff roster driven with role, start/end dates and site-based status",
      "Item-level replacement frequency rates per role type",
      "Covers hard hats, glasses, gloves, overtrousers, hi-viz, boots, gauntlets, goggles, ear defenders and coats",
      "Separate rates for site-based, commissioning, attendant and worker roles",
      "Monthly unit quantity and spend calculations per PPE item",
      "Editable unit costs for supplier-specific pricing",
      "Monthly spend charts showing projected PPE expenditure",
      "Automatic adjustment when staff join or leave the project",
      "Designed for budgeting across the full project lifecycle",
      "Suitable for site managers, commercial teams and procurement coordinators"
    ],
        images: ["product-images/PPE-Budget-Calculator-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/ppe-budget-calculator",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 7,
        isBundle: false,
        bundleProducts: [],
    },
 // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Construction Mileage Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "construction-mileage-tracker",
        title: "Construction Mileage Tracker",
    altText: "Construction Mileage Tracker Excel template with HMRC compliant rate calculations and expense dashboard",
        category: ["cost", "daily", "registers"],
        price: "£9.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "ð",
        desc: "HMRC-compliant daily mileage and expense tracker with odometer or manual entry, automatic high/low rate calculation against the 10,000-mile threshold, configurable reimbursement percentages, UK tax year alignment (6 Apr–5 Apr), and a filterable dashboard with weekly, monthly and annual views showing total miles, claim values and amounts owed.",
        longDesc: `<p>The Construction Mileage Tracker is an Excel-based daily mileage and expense recording tool designed for construction professionals who travel between sites, offices and suppliers. Each journey is logged with date, origin, destination, purpose and mileage — entered either via odometer readings or manual distance entry — and the system automatically applies the correct HMRC approved mileage rate, switching from the higher rate to the lower rate once the 10,000-mile annual threshold is crossed.</p><p>Reimbursement percentages are configurable to match your employer's policy, whether that is 100% of the HMRC rate or a reduced company rate. The tracker is aligned to the UK tax year (6 April to 5 April) so annual totals, thresholds and summaries all roll over at the correct point for self-assessment and expenses claims.</p><p>The filterable dashboard provides weekly, monthly and annual views showing total miles driven, total claim value, amounts already reimbursed and amounts still owed. The template is designed for site managers, engineers, quantity surveyors and subcontractors who need accurate, auditable mileage records for employer reimbursement or HMRC tax relief claims.</p>`,
        features: [
      "Daily mileage logging with odometer or manual distance entry",
      "Automatic HMRC approved mileage rate calculation",
      "High/low rate switching at the 10,000-mile annual threshold",
      "Configurable reimbursement percentages to match employer policy",
      "UK tax year alignment (6 April to 5 April) for self-assessment",
      "Journey details: date, origin, destination, purpose and mileage",
      "Filterable dashboard with weekly, monthly and annual views",
      "Total miles, claim values and amounts owed summaries",
      "Print-ready expense claim sheets for employer submission",
      "Designed for site managers, engineers, QS and subcontractors"
    ],
        images: ["product-images/Construction-Mileage-Tracker-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/construction-mileage-tracker",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 7,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Weekly Inspection Rota
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "weekly-inspection-rota",
        title: "Weekly Inspection Rota",
    altText: "Weekly Inspection Rota Excel template with rolling inspector assignment and wall chart layout",
        category: ["inspection", "hse", "planning"],
        price: "£9.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "Single-sheet rolling weekly inspection rota assigning inspectors to weekly slots across the project duration, with L (Lead) and S (Support) role designations, automatic week-commencing date columns, and a print-ready wall chart layout for site office display.",
        longDesc: `<p>The Weekly Inspection Rota is a single-sheet Excel template that provides a rolling weekly inspection schedule for construction sites. Inspectors are assigned to weekly slots across the full project duration using L (Lead) and S (Support) role designations, making it immediately clear who is responsible for leading each week's inspections and who is providing backup coverage.</p><p>Week-commencing date columns are generated automatically based on the project start date, so the rota extends across the full programme without manual date entry. The layout is designed as a wall chart format — landscape orientation with inspectors listed down the left and weeks running across the top — so it can be printed at A3 or A1 and displayed in the site office for daily reference.</p><p>The template is designed for site managers and H&amp;S coordinators who need a visual, accessible inspection schedule that the whole team can see. It covers any type of recurring weekly inspection including safety tours, environmental walks, housekeeping checks and plant inspections.</p>`,
        features: [
      "Single-sheet rolling weekly rota across the full project duration",
      "L (Lead) and S (Support) role designations per weekly slot",
      "Automatic week-commencing date column generation",
      "Wall chart layout for A3 or A1 printing and site office display",
      "Landscape orientation with inspectors down and weeks across",
      "Covers safety tours, environmental walks, housekeeping and plant inspections",
      "Visual format accessible to the whole site team",
      "No VBA required — pure formula-driven date generation",
      "Designed for site managers and H&S coordinators"
    ],
        images: ["product-images/Weekly-Inspection-Rota-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/weekly-inspection-rota",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 7,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Weight Loss Challenge Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "weight-loss-challenge-tracker",
        title: "Weight Loss Challenge Tracker",
    altText: "Weight Loss Challenge Tracker Excel template with leaderboards certificates and welfare board posters",
        category: ["daily", "registers"],
        price: "£9.99",
        oldPrice: "",
        badge: "Wellness",
        icon: "ðï¸",
        desc: "Team weight loss challenge system with participant registration, up to 20 weeks of kg/stones weigh-in logging, automatic percentage-loss leaderboards with eligibility rules and missed weigh-in tracking, a dashboard showing active participants, biggest loser and compliance rates, job family summary breakdowns, an optional privacy mode, and printable certificates and poster sheets for site welfare boards.",
        longDesc: `<p>The Weight Loss Challenge Tracker is an Excel-based team wellness tool designed for construction site welfare initiatives. It supports participant registration with personal details and starting weight, then tracks up to 20 weeks of weigh-in data in kilograms or stones, automatically calculating weekly and cumulative percentage weight loss for each participant.</p><p>The automatic leaderboard ranks participants by percentage loss with configurable eligibility rules — for example, requiring a minimum number of weigh-ins to qualify for prizes. Missed weigh-in tracking flags participants who have skipped sessions, and the dashboard shows active participant counts, the current biggest loser, overall compliance rates and average percentage loss across the group. Job family summary breakdowns let you compare performance between trades or departments.</p><p>An optional privacy mode hides individual weights while still showing percentage rankings, protecting participant confidentiality on shared displays. Printable certificates for winners and milestone achievements, plus poster sheets formatted for site welfare board display, help maintain engagement and visibility throughout the challenge.</p>`,
        features: [
      "Participant registration with starting weight and personal details",
      "Up to 20 weeks of weigh-in logging in kg or stones",
      "Automatic percentage-loss leaderboard with eligibility rules",
      "Missed weigh-in tracking and compliance rate monitoring",
      "Dashboard with active participants, biggest loser and average loss",
      "Job family summary breakdowns by trade or department",
      "Optional privacy mode hiding individual weights on shared displays",
      "Printable certificates for winners and milestone achievements",
      "Poster sheets formatted for site welfare board display",
      "Designed for construction site wellness and engagement initiatives"
    ],
        images: ["product-images/Weight-Loss-Challenge-Tracker-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/weight-loss-challenge-tracker",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.1 MB",
        lastUpdate: "June 2026",
        popularity: 6,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Supervisor's RACI Chart
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "supervisors-raci-chart",
        title: "Supervisor's RACI Chart",
    altText: "Supervisors RACI Chart Excel template with task mapping person profiles and duty acknowledgement",
        category: ["project", "competence", "planning"],
        price: "£9.99",
        oldPrice: "",
        badge: "Project Management",
        icon: "ð",
        desc: "Supervisory RACI wall chart mapping key site tasks (safety checks, inspections, RAMS reviews, logistics, quality, environmental, commissioning) to named team members using R/A/C/I assignments with review frequency and estimated hours per task, a Person Profile sheet calculating each individual's monthly hour allocation and days used/free across the calendar year, and a signature sheet for formal acknowledgement of duties.",
        longDesc: `<p>The Supervisor's RACI Chart is an Excel-based responsibility assignment tool that maps key site tasks to named team members using the standard R (Responsible), A (Accountable), C (Consulted) and I (Informed) framework. Tasks cover the full range of supervisory duties including safety checks, inspections, RAMS reviews, logistics coordination, quality management, environmental compliance and commissioning activities, each with a review frequency and estimated hours per occurrence.</p><p>The Person Profile sheet calculates each individual's total monthly hour allocation by summing the estimated hours for all tasks where they hold an R or A assignment, then presents days used and days free across the calendar year. This makes it immediately clear whether any team member is overloaded or has capacity for additional responsibilities, supporting balanced workload distribution.</p><p>A signature sheet provides a formal record where each team member acknowledges their assigned duties, creating an auditable document for project governance and CDM compliance. The template is designed as a wall chart format for site office display and is suitable for general foremen, section supervisors and construction managers managing multi-disciplinary site teams.</p>`,
        features: [
      "RACI mapping: Responsible, Accountable, Consulted and Informed assignments",
      "Key site tasks: safety, inspections, RAMS, logistics, quality, environmental, commissioning",
      "Review frequency and estimated hours per task",
      "Person Profile sheet with monthly hour allocation calculations",
      "Days used and days free across the calendar year per individual",
      "Workload balance visibility for team resource management",
      "Signature sheet for formal acknowledgement of duties",
      "Wall chart format for site office display",
      "CDM compliance documentation for project governance",
      "Designed for general foremen, section supervisors and construction managers"
    ],
        images: ["product-images/Supervisors-RACI-Chart-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/supervisors-raci-chart",
        youtubeId: "",
        new: true,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 8,
        isBundle: false,
        bundleProducts: [],
    },

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // Uncharted Services Log
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "uncharted-services-log",
        title: "Uncharted Services Log",
    altText: "Uncharted Services Log Excel template with underground discovery tracking and service type dashboards",
        category: ["hse", "registers", "inspection"],
        price: "£9.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "£ ï¸",
        desc: "Uncharted underground services tracker logging each discovery by date, service type (HV cables, ductile iron, cast iron, PE pipe, LV cables, gas, comms, concrete pipe), size range, depth, location, cost, duration and resolution status — with monthly and type summary tables, a totals dashboard showing completed percentage and issue counts, and breakdowns by service type including average depth and most common status.",
        longDesc: `<p>The Uncharted Services Log is an Excel-based tracker for recording and managing encounters with uncharted underground services during excavation works on construction sites. Each discovery is logged with date, service type (HV cables, ductile iron, cast iron, PE pipe, LV cables, gas, comms, concrete pipe and others), size range, depth below ground, location reference, estimated cost impact, duration of delay and resolution status.</p><p>Monthly and service type summary tables aggregate discoveries over time, showing how frequently uncharted services are being encountered and which types are most common. The totals dashboard presents completed resolution percentage, total issue counts, cumulative cost impact and average delay duration, giving project managers and commercial teams the data needed for risk reporting and variation substantiation.</p><p>Breakdowns by service type show average depth, most common resolution status and frequency of occurrence for each utility type. The log is designed for site engineers, utility coordinators and commercial teams on civil engineering projects involving significant excavation works, particularly on brownfield sites where existing service records may be incomplete or unreliable.</p>`,
        features: [
      "Per-discovery logging: date, service type, size, depth, location and cost",
      "Service types: HV cables, ductile iron, cast iron, PE pipe, LV cables, gas, comms and more",
      "Duration of delay and resolution status tracking per discovery",
      "Monthly and service type summary tables",
      "Totals dashboard with completed percentage and cumulative cost impact",
      "Average delay duration calculations across all discoveries",
      "Breakdowns by service type with average depth and frequency",
      "Designed for variation substantiation and risk reporting",
      "Suitable for brownfield sites with incomplete service records",
      "Designed for site engineers, utility coordinators and commercial teams"
    ],
        images: ["product-images/Uncharted-Services-Log-excel-ebrora.jpg"],
        buyLink: "https://ebrora.gumroad.com/l/uncharted-services-log",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.2 MB",
        lastUpdate: "June 2026",
        popularity: 8,
        isBundle: false,
        bundleProducts: [],
    },
];


// ============================================================================
// REVIEWS
// ============================================================================

export const REVIEWS: Review[] = [
    {
        stars: 5,
        text: "These templates have genuinely transformed how we manage our site documentation. The excavation register alone has saved us hours every week.",
        author: "Mark Thompson",
        role: "Site Manager, BAM Nuttall"
    },
    {
        stars: 5,
        text: "Finally, Excel tools that actually understand construction workflows. The Gantt chart is miles ahead of anything I've used before.",
        author: "Sarah Jenkins",
        role: "Project Engineer, Morgan Sindall"
    },
    {
        stars: 5,
        text: "The free PDF preview gave me confidence before buying. The actual Excel file exceeded expectations £ brilliant VBA automation.",
        author: "David Clarke",
        role: "Construction Manager, Kier Group"
    },
    {
        stars: 4,
        text: "Really solid templates. The carbon calculator helped us win points on our tender submission. Would love to see more environmental tools.",
        author: "Rachel Hughes",
        role: "Sustainability Lead, Costain"
    },
    {
        stars: 5,
        text: "I've been looking for something like this for years. The ITR tracker is exactly what we needed for our MEICA installations.",
        author: "James O'Brien",
        role: "MEICA Supervisor, NMCN"
    },
    {
        stars: 5,
        text: "The daily diary template is superb. Auto-generates reports, tracks weather, labour, plant £ everything our QA team requires.",
        author: "Tom Richards",
        role: "General Foreman, VolkerStevin"
    },
    {
        stars: 5,
        text: "Purchased the HSE meeting pack and ART assessment tool. Both are incredibly professional and have streamlined our safety processes.",
        author: "Karen Mitchell",
        role: "HSE Advisor, Galliford Try"
    },
    {
        stars: 4,
        text: "Very impressed with the quality. The concrete pour register has proper formwork strike calculations built in. Saves me doing it manually.",
        author: "Paul Woodford",
        role: "Senior Engineer, Laing O'Rourke"
    },
    {
        stars: 5,
        text: "These aren't your typical generic spreadsheets. You can tell they've been built by someone who actually works on construction sites.",
        author: "Lisa Brennan",
        role: "Project Coordinator, Balfour Beatty"
    },
    {
        stars: 5,
        text: "The delivery booking system has drastically reduced conflicts on our congested city-centre site. Simple but effective.",
        author: "Chris Hartley",
        role: "Logistics Manager, Skanska"
    },
    {
        stars: 5,
        text: "Bought five templates and every single one has been worth the money. The PIC competence assessment is now our standard tool.",
        author: "Angela Foster",
        role: "Training Manager, Amey"
    },
    {
        stars: 4,
        text: "Great templates overall. The pump maintenance tracker could do with a few more fields for our specific setup, but the bones are excellent.",
        author: "Ian McGregor",
        role: "Mechanical Foreman, Severn Trent"
    },
    {
        stars: 5,
        text: "As a site agent, these tools make my life so much easier. Professional, well-designed, and actually practical. Five stars.",
        author: "Daniel Murray",
        role: "Site Agent, Wates Group"
    },
    {
        stars: 5,
        text: "The COSHH assessment tool is compliant, comprehensive, and easy to use. Our HSE director was very impressed.",
        author: "Natalie Cross",
        role: "Safety Officer, United Utilities"
    },
    {
        stars: 5,
        text: "I recommended these to three other site managers. The quality is exceptional and the price point is very reasonable.",
        author: "Steven Barker",
        role: "Senior Site Manager, MJ Church"
    },
    {
        stars: 4,
        text: "Very professional templates. It would be great to see a cable pulling register and commissioning tracker added to the range.",
        author: "Helen Watts",
        role: "Commissioning Engineer, Jacobs"
    },
    {
        stars: 5,
        text: "The cost comparison calculator helped us demonstrate significant savings on recycled aggregates vs virgin material. Brilliant tool.",
        author: "Robert Gill",
        role: "Quantity Surveyor, Murphy Group"
    },
    {
        stars: 5,
        text: "Easy to download, easy to use, looks professional. Exactly what construction teams need. Will definitely buy more.",
        author: "Caroline Evans",
        role: "Admin Manager, Taylor Woodrow"
    },
    {
        stars: 5,
        text: "Our team of 15 all use these templates now. Consistency across the project has improved massively. Excellent products.",
        author: "Andrew Walsh",
        role: "Project Manager, Barhale"
    },
    {
        stars: 5,
        text: "The PDF preview feature is a game-changer. I could see exactly what I was getting before committing. No other site does this.",
        author: "Michelle Taylor",
        role: "Contracts Manager, McNicholas"
    },
    {
        stars: 4,
        text: "Solid, reliable Excel tools. The inspection register is particularly well thought out. Minor formatting preferences, but overall excellent.",
        author: "Graham Nicholls",
        role: "Quality Manager, Clancy Group"
    },
    {
        stars: 5,
        text: "Worth every penny. The VBA macros save so much repetitive work. I wish I'd found these years ago.",
        author: "Joanne Parry",
        role: "Site Engineer, Danaher & Walsh"
    },
    {
        stars: 5,
        text: "These templates make small to mid-size contractors look as professional as the tier-one firms. Fantastic resource.",
        author: "Neil Adamson",
        role: "Director, NA Civils Ltd"
    },
    {
        stars: 5,
        text: "Purchased the full bundle for our wastewater project. Every template has been put to use. Outstanding quality and value.",
        author: "Fiona Campbell",
        role: "Operations Manager, Anglian Water"
    },
    {
        stars: 5,
        text: "The level of detail in these spreadsheets shows real industry knowledge. Not just pretty dashboards £ proper functional tools.",
        author: "Matthew Dixon",
        role: "Resident Engineer, Mott MacDonald"
    },
    {
        stars: 5,
        text: "Exactly what the construction industry needs. Simple to use, professional output, and the support response was quick and helpful.",
        author: "Samantha Lee",
        role: "Construction Planner, Vinci"
    },
];
