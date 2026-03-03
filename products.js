/**
 * ============================================================================
 * EBRORA — products.js
 * Complete Product Database for ebrora.com
 * ============================================================================
 *
 * This file contains ALL product data, category definitions, and customer
 * reviews for the Ebrora website. It is designed for a static GitHub Pages
 * site (HTML/CSS/JS only) with no server-side processing.
 *
 * ============================================================================
 * HOW TO ADD A NEW PRODUCT
 * ============================================================================
 * 1. Scroll to the PRODUCTS array below.
 * 2. Copy an existing product object (everything between { and }, inclusive).
 * 3. Paste it at the END of the array, just before the closing ];
 * 4. Change every field to match your new product:
 *    - id            → A unique URL slug (lowercase, hyphens, no spaces).
 *                      Example: "my-new-template"
 *    - title         → The display name shown on cards and the product page.
 *    - category      → An array of category slugs (see list below).
 *    - price         → Current selling price as a string, e.g. "£19.99".
 *    - oldPrice      → Previous higher price for strike-through display,
 *                      or "" if there is no discount.
 *    - badge         → Short label shown on the product card (e.g. "HSE & Safety").
 *    - icon          → An emoji fallback icon for the product card.
 *    - desc          → Short description (2-3 lines) shown on the product card.
 *    - longDesc      → Full HTML description for the product detail page.
 *                      Use <p> tags to wrap each paragraph. Write at least 3
 *                      detailed paragraphs.
 *    - features      → An array of feature strings. Include at least 8.
 *    - images        → An array of image paths/URLs. Leave as [] if none yet.
 *    - pdfLink       → URL to the free PDF preview. Use "#" as placeholder.
 *    - buyLink       → Full Gumroad purchase URL.
 *                      Format: "https://ebrora.gumroad.com/l/your-slug"
 *    - youtubeId     → YouTube video ID for demo. Leave as "" if none yet.
 *    - new           → Boolean. Set to true to show a "New" badge.
 *    - featured      → Boolean. Set to true to feature on the homepage.
 *    - compatible    → Compatibility string, e.g. "Windows & Mac".
 *    - version       → Version number string, e.g. "1.0".
 *    - fileSize      → Approximate download size, e.g. "1.4 MB".
 *    - lastUpdate    → Month and year of last update, e.g. "March 2026".
 *    - popularity    → Number from 1-20 used for sorting. Higher = more popular.
 *    - isBundle      → Boolean. Set to true only for bundle products.
 *    - bundleProducts→ Array of product id slugs included in a bundle,
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
 *   hse            → HSE & Safety
 *   project        → Project Management
 *   asset          → Asset & MEICA Tracking
 *   wastewater     → Wastewater & Utilities
 *   cost           → Cost & Carbon Calculators
 *   planning       → Construction Planning
 *   inspection     → Inspection & Testing
 *   registers      → Registers & Logs
 *   concrete       → Concrete & Materials
 *   competence     → Competence & Training
 *   environmental  → Environmental
 *   plant          → Plant & Equipment
 *   daily          → Daily Operations
 *   commissioning  → Commissioning & Handover
 *   stakeholder    → Stakeholder & Comms
 *   temporary      → Temporary Works
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

const CATEGORIES = {
    hse:            { label: "HSE & Safety",              icon: "🦺" },
    project:        { label: "Project Management",        icon: "📊" },
    asset:          { label: "Asset & MEICA Tracking",    icon: "🔧" },
    wastewater:     { label: "Wastewater & Utilities",    icon: "💧" },
    cost:           { label: "Cost & Carbon Calculators", icon: "💰" },
    planning:       { label: "Construction Planning",     icon: "📅" },
    inspection:     { label: "Inspection & Testing",      icon: "🔍" },
    registers:      { label: "Registers & Logs",          icon: "📋" },
    concrete:       { label: "Concrete & Materials",      icon: "🏗️" },
    competence:     { label: "Competence & Training",     icon: "🎓" },
    environmental:  { label: "Environmental",             icon: "🌱" },
    plant:          { label: "Plant & Equipment",         icon: "⚙️" },
    daily:          { label: "Daily Operations",          icon: "📝" },
    commissioning:  { label: "Commissioning & Handover",  icon: "✅" },
    stakeholder:    { label: "Stakeholder & Comms",       icon: "📣" },
    temporary:      { label: "Temporary Works",           icon: "🚧" },
};


// ============================================================================
// PRODUCTS
// ============================================================================

const PRODUCTS = [

    // ────────────────────────────────────────────────────────────────────────
    // 1. Excavation Inspection Register
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "excavation-inspection-register",
        title: "Excavation Inspection Register",
        category: ["inspection", "registers", "hse"],
        price: "£24.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "📋",
        desc: "VBA-powered excavation inspection tracking with automated workflows, conditional formatting, compliance reporting, and multi-site support. Includes overdue alerts and a full dashboard.",
        longDesc: `<p>The Excavation Inspection Register is a comprehensive, VBA-powered Excel template designed specifically for construction and civil engineering teams who need to track, manage, and report on excavation inspections across one or multiple project sites. Every inspection record is captured in a structured format that includes location, date, inspector details, excavation type, depth, support method, permit references, and overall pass/fail status. Conditional formatting provides instant visual feedback so supervisors can identify overdue, failed, or pending inspections at a glance without scrolling through hundreds of rows.</p><p>Built-in VBA automation handles the repetitive tasks that slow teams down. With a single button click you can generate filtered compliance reports, export inspection summaries to PDF, send overdue alerts to nominated email addresses via Outlook integration, and cross-reference excavation permits against the inspection log to ensure nothing falls through the cracks. The template supports password-protected admin access so that only authorised users can modify lookup lists, archive old records, or adjust workflow settings, while general users can enter and view data freely.</p><p>The dashboard sheet provides a real-time overview of your inspection programme with dynamic charts showing inspections by status, by site, by month, and by inspector. RAG-rated KPI tiles give management an immediate snapshot of compliance health. Whether you are running a single excavation or managing dozens across a major infrastructure programme, this register scales to meet your needs and keeps your project audit-ready at all times.</p>`,
        features: [
            "VBA-powered automated workflows for inspection entry and reporting",
            "Conditional formatting with RAG status for instant visual compliance checks",
            "Automated overdue inspection alerts via Outlook email integration",
            "Permit-to-dig cross-referencing to ensure all excavations are authorised",
            "Multi-site support with site-level filtering and reporting",
            "Interactive dashboard with dynamic charts and KPI summary tiles",
            "Password-protected admin panel for lookup lists and settings",
            "One-click PDF export for compliance reports and audit packs",
            "Searchable inspection archive with date-range and status filters",
            "Built-in data validation to ensure consistent and complete records"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 2. Gantt Chart Project Planner
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "gantt-chart-project-planner",
        title: "Gantt Chart Project Planner",
        category: ["project", "planning"],
        price: "£29.99",
        oldPrice: "",
        badge: "Project Management",
        icon: "📊",
        desc: "Advanced Gantt chart with task hierarchy, critical path highlighting, milestones, dependencies, resource allocation, and customisable timescales. Print-ready for construction programmes.",
        longDesc: `<p>The Gantt Chart Project Planner is a powerful yet intuitive Excel-based scheduling tool built from the ground up for construction and civil engineering projects. Unlike generic project management templates, this planner understands the realities of site-based programmes — from phased earthworks and concrete pours to mechanical installations and commissioning sequences. It supports full task hierarchy with summary bars, subtasks, and milestone diamonds, giving you a clear visual representation of your entire programme on a single scrollable timeline.</p><p>Critical path logic is built directly into the spreadsheet engine. Define finish-to-start, start-to-start, finish-to-finish, and start-to-finish dependencies between any tasks, and the template automatically calculates float, highlights the critical path in red, and flags any tasks at risk of causing programme delay. Resource allocation columns let you assign teams, plant, or subcontractors to each task, and a separate resource summary sheet shows loading by week so you can identify clashes or under-utilisation before they become problems on site.</p><p>The timescale is fully customisable — switch between daily, weekly, and monthly views with a single dropdown selection. Print-ready formatting ensures your programme looks professional whether you are presenting to a client, pinning it to the site office wall, or including it in a tender submission. Colour-coded progress bars, baseline comparison, and percentage-complete tracking keep everyone aligned on where the project stands relative to plan.</p>`,
        features: [
            "Full task hierarchy with summary bars, subtasks, and milestone markers",
            "Critical path calculation with automatic float analysis",
            "Four dependency types: FS, SS, FF, and SF with lag/lead support",
            "Resource allocation columns with weekly loading summary sheet",
            "Customisable timescale: daily, weekly, or monthly views",
            "Colour-coded progress bars with percentage-complete tracking",
            "Baseline comparison to monitor programme drift over time",
            "Print-ready formatting for A3 and A1 programme outputs",
            "Construction-specific task library with common activity templates",
            "Dropdown selections for task owners, phases, and priority levels"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 3. COSHH Assessment Tool
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "coshh-assessment-tool",
        title: "COSHH Assessment Tool",
        category: ["hse", "inspection"],
        price: "£19.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "⚠️",
        desc: "Comprehensive COSHH risk assessment with a pre-built substance database, automated risk matrix, PPE mapping, printable assessment forms, and full compliance with UK COSHH Regulations 2002.",
        longDesc: `<p>The COSHH Assessment Tool is a purpose-built Excel template that enables construction and industrial teams to carry out thorough assessments under the Control of Substances Hazardous to Health Regulations 2002. It ships with a pre-built database of over 120 commonly encountered construction substances — from cement dust and resin hardeners to diesel fuel and silica-bearing materials — each pre-populated with hazard classifications, exposure limits, and recommended control measures. Simply select a substance and the template auto-fills the key hazard information, dramatically reducing the time it takes to produce a compliant assessment.</p><p>The automated risk matrix calculates residual risk scores based on your selected likelihood and severity ratings, both before and after control measures are applied. Colour-coded cells instantly communicate whether the residual risk is acceptable, tolerable, or unacceptable, guiding you toward appropriate additional controls. A dedicated PPE mapping section links each substance to the specific personal protective equipment required, and an emergency procedures tab provides structured response plans for spills, skin contact, inhalation, and ingestion scenarios for every substance in the register.</p><p>Completed assessments can be printed to a professional, single-page format that is ready for site display, toolbox talk briefings, or client audit submissions. The substance register dashboard gives a bird's-eye view of all assessed substances across your project, their risk ratings, review dates, and responsible persons. With built-in review reminders and version tracking, this tool ensures your COSHH programme stays current and legally defensible throughout the life of your project.</p>`,
        features: [
            "Pre-built database of 120+ construction substances with hazard data",
            "Automated risk matrix with before/after control measure scoring",
            "Colour-coded residual risk output: acceptable, tolerable, unacceptable",
            "PPE mapping linked to each substance and task combination",
            "Emergency procedures tab for spills, contact, inhalation, and ingestion",
            "Printable single-page assessment forms for site display and audits",
            "Substance register dashboard with risk ratings and review dates",
            "Fully compliant with UK COSHH Regulations 2002 requirements",
            "Built-in review date reminders and version history tracking",
            "Dropdown-driven data entry for speed and consistency"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/coshh-assessment-tool",
        youtubeId: "",
        new: false,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.3 MB",
        lastUpdate: "March 2026",
        popularity: 14,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 4. ITR Asset Tracker
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "itr-asset-tracker",
        title: "ITR Asset Tracker",
        category: ["asset", "wastewater", "commissioning", "inspection"],
        price: "£34.99",
        oldPrice: "",
        badge: "Asset Tracking",
        icon: "🔧",
        desc: "Full Inspection Test Record system for MEICA assets with lifecycle tracking, punch list management, witness point scheduling, test result trending, and AMP-compliant handover documentation.",
        longDesc: `<p>The ITR Asset Tracker is a professional-grade Excel template engineered for mechanical, electrical, instrumentation, control, and automation (MEICA) projects within the water, wastewater, and infrastructure sectors. It provides a complete Inspection Test Record (ITR) management system that tracks every asset from initial receipt and installation through testing, commissioning, and final handover. Each asset record captures tag numbers, descriptions, locations, system boundaries, responsible engineers, and full test histories in a single, searchable register that eliminates the need for scattered paper-based ITR folders.</p><p>Punch list management is fully integrated, allowing teams to log Category A, B, and C punch items directly against the relevant asset or system. Each punch item tracks its description, raised date, responsible party, target close-out date, and current status, with conditional formatting that highlights overdue items in red. Witness point scheduling lets you define hold and notification points for client, third-party, or regulatory witnesses, and a calendar view shows upcoming witness requirements so nothing is missed during the commissioning sequence.</p><p>The dashboard provides programme-wide visibility with completion percentages by system, by discipline, and by test type. Test result trending charts help engineers spot patterns — such as recurring failures on a particular valve type or instrument loop — enabling proactive corrective action. When the project reaches handover, the template generates structured documentation packs that meet AMP (Asset Management Period) requirements for UK water utility clients, complete with cover sheets, test summaries, and certificate indices.</p>`,
        features: [
            "Complete ITR management for MEICA assets from receipt to handover",
            "Integrated punch list with Category A, B, and C classification",
            "Witness point scheduling with hold and notification point tracking",
            "Test result trending charts to identify recurring failure patterns",
            "System boundary definition with discipline-level progress tracking",
            "Dashboard with completion percentages by system and test type",
            "AMP-compliant handover documentation pack generation",
            "Conditional formatting for overdue items and failed test results",
            "Searchable asset register with tag number and location filters",
            "Calendar view for upcoming witness and inspection requirements"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/itr-asset-tracker",
        youtubeId: "",
        new: false,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.8 MB",
        lastUpdate: "March 2026",
        popularity: 16,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 5. Carbon Calculator for Construction
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "carbon-calculator-construction",
        title: "Carbon Calculator for Construction",
        category: ["cost", "environmental"],
        price: "£22.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "🌱",
        desc: "Calculate embodied carbon for construction materials, compare recycling vs landfill scenarios, analyse cost-carbon trade-offs, and generate BREEAM-supporting reports with professional dashboards.",
        longDesc: `<p>The Carbon Calculator for Construction is an Excel-based decision-support tool that helps project teams quantify, compare, and reduce the embodied carbon associated with their material choices. It covers all major construction material categories — concrete, steel, timber, aggregates, asphalt, plastics, and fill materials — with carbon emission factors sourced from the Inventory of Carbon and Energy (ICE) database and aligned with PAS 2080 principles. Simply enter your material quantities and the calculator returns total embodied carbon in kgCO2e, broken down by material type, lifecycle stage, and supply chain tier.</p><p>A powerful comparison module lets you evaluate recycling versus landfill scenarios side by side, showing not only the carbon savings but also the cost implications of choosing recycled aggregates, reclaimed steel, or secondary materials over virgin equivalents. The material sourcing distance calculator adds transport emissions based on supplier location and vehicle type, giving you a true cradle-to-site carbon picture. For teams pursuing BREEAM credits, the template maps outputs directly to the relevant Mat 01 and Wst 01 assessment criteria with supporting evidence summaries that can be submitted to assessors.</p><p>The waste hierarchy analysis module helps you demonstrate compliance with the waste management hierarchy by quantifying the proportion of material sent to reuse, recycling, recovery, and disposal. A professional dashboard with tracking charts shows how your project's carbon footprint evolves over time as material decisions are made and procurement progresses. One-click report generation produces a branded PDF summary suitable for client presentations, tender submissions, or regulatory evidence packs.</p>`,
        features: [
            "Embodied carbon calculation for all major construction materials",
            "Carbon emission factors aligned with ICE database and PAS 2080",
            "Recycling vs landfill comparison with cost and carbon side-by-side",
            "Material sourcing distance calculator with transport emission modelling",
            "BREEAM Mat 01 and Wst 01 credit mapping with evidence summaries",
            "Waste hierarchy analysis: reuse, recycling, recovery, and disposal",
            "Professional dashboard with carbon tracking charts over project life",
            "One-click branded PDF report generation for clients and regulators",
            "Cost-carbon trade-off analysis to support value engineering decisions",
            "Dropdown material selector with pre-loaded emission factor library"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 6. Daily Diary Template
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "daily-diary-template",
        title: "Daily Diary Template",
        category: ["daily", "registers", "planning"],
        price: "£18.99",
        oldPrice: "",
        badge: "Daily Operations",
        icon: "📝",
        desc: "Automated daily construction diary with weather logging, labour and plant tracking, material delivery records, visitor log, VBA-generated reports, and a searchable archive.",
        longDesc: `<p>The Daily Diary Template is an essential site management tool that captures everything that happens on your construction project, every single day, in a structured and searchable format. Each diary entry records the date, weather conditions (temperature, wind, rainfall), site working hours, and a detailed narrative of the day's activities. Dedicated sections for labour returns, plant on site, material deliveries, visitors, and subcontractor presence ensure that no critical information is lost — whether you need it for progress reporting, contractual claims, or dispute resolution months down the line.</p><p>VBA automation takes the pain out of report generation. At the end of each week or month, a single button press compiles all diary entries into a formatted summary report, complete with labour histograms, plant utilisation charts, material delivery schedules, and weather impact analysis. These reports can be exported to PDF for distribution to the client, project manager, or commercial team. The template also generates a running weather disruption log that automatically flags days where adverse conditions may have affected productivity — invaluable evidence for extension-of-time claims under NEC or JCT contracts.</p><p>All entries are stored in a searchable archive sheet where you can filter by date range, keyword, author, or category. Whether you need to find out when a particular delivery arrived, who was on site on a specific date, or how many days were lost to rain last quarter, the answer is seconds away. The diary is pre-formatted for consistency, so even if multiple site managers or engineers contribute entries, the output remains professional and uniform across the entire project duration.</p>`,
        features: [
            "Structured daily entry form with weather, labour, plant, and materials",
            "VBA-powered weekly and monthly summary report generation",
            "Automatic weather disruption log for contractual time claims",
            "Labour histogram and plant utilisation charts in summary reports",
            "Material delivery tracking with supplier and quantity records",
            "Visitor log with company, purpose of visit, and time on site",
            "Searchable archive with date-range, keyword, and category filters",
            "One-click PDF export for client and management distribution",
            "Consistent formatting across multiple contributing authors",
            "Pre-built dropdown lists for common activities and weather conditions"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 7. ART Assessment Tool
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "art-assessment-tool",
        title: "ART Assessment Tool",
        category: ["hse", "competence"],
        price: "£16.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "🦺",
        desc: "HSE Assessment of Repetitive Tasks tool with guided workflows, automated risk scoring, colour-coded risk levels, control measure recommendations, and printable assessment reports.",
        longDesc: `<p>The ART Assessment Tool is an Excel-based implementation of the HSE's Assessment of Repetitive Tasks methodology, designed for occupational health and safety professionals working in construction, manufacturing, and industrial environments. It provides a guided, step-by-step workflow that walks assessors through the evaluation of repetitive manual tasks — from identifying the task and workforce involved, through scoring frequency, force, posture, and additional risk factors, to calculating an overall exposure level and recommending proportionate control measures.</p><p>Automated risk scoring eliminates manual calculation errors and ensures consistency across assessments. As you enter scores for each body region and risk factor, the template instantly computes the task-level exposure score and assigns a colour-coded risk level: green for low risk, amber for medium risk requiring further investigation, and red for high risk demanding immediate action. Each risk level is linked to a library of pre-written control measure recommendations tailored to construction activities, so assessors are not left wondering what to do with the results — practical guidance is provided automatically.</p><p>Completed assessments can be printed to a professional report format suitable for inclusion in project health and safety files, toolbox talk packs, or regulatory submissions. The assessment history sheet maintains a chronological record of all assessments carried out, enabling trend analysis over time. If a task is reassessed after control measures are implemented, the before-and-after comparison clearly demonstrates risk reduction. The template supports multiple task assessments within a single workbook, making it ideal for teams managing diverse construction activities across one or several project sites.</p>`,
        features: [
            "Guided step-by-step ART assessment workflow aligned with HSE methodology",
            "Automated risk scoring for frequency, force, posture, and additional factors",
            "Colour-coded risk levels: green (low), amber (medium), red (high)",
            "Pre-written control measure recommendations for construction activities",
            "Printable professional report format for safety files and audits",
            "Assessment history sheet with chronological record and trend analysis",
            "Before-and-after comparison to demonstrate risk reduction effectiveness",
            "Multiple task support within a single workbook for diverse activities",
            "Body-region-specific scoring for upper limbs, back, and neck",
            "Dropdown-driven inputs for speed, consistency, and ease of use"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/art-assessment-tool",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.1 MB",
        lastUpdate: "March 2026",
        popularity: 8,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 8. Pump Maintenance Tracker
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "pump-maintenance-tracker",
        title: "Pump Maintenance Tracker",
        category: ["wastewater", "asset", "plant"],
        price: "£27.99",
        oldPrice: "",
        badge: "Wastewater",
        icon: "⚙️",
        desc: "Comprehensive pump asset register with maintenance scheduling, service history logging, running hours tracking, spare parts inventory, overdue alerts, and a fleet overview dashboard.",
        longDesc: `<p>The Pump Maintenance Tracker is a specialist Excel template built for teams who operate and maintain pumping assets in the water, wastewater, and process industries. It provides a complete asset register for your entire pump fleet — capturing make, model, serial number, location, duty point, impeller size, motor rating, installation date, and warranty status for every pump under your care. Each asset links to a detailed service history log where every maintenance intervention, inspection, and repair is recorded with date, engineer, work description, parts used, and cost.</p><p>Maintenance scheduling is driven by both calendar-based intervals and running-hours thresholds. The template tracks cumulative running hours for each pump and automatically flags when the next service, oil change, seal replacement, or bearing inspection is due. Overdue maintenance items are highlighted in red on the fleet overview dashboard, and optional VBA-driven email alerts can notify responsible engineers before a service window is missed. The spare parts inventory module tracks stock levels of common consumables — mechanical seals, wear rings, impellers, coupling elements — and alerts you when reorder levels are reached.</p><p>The fleet overview dashboard presents a consolidated view of your entire pump estate, with summary charts showing maintenance compliance rates, mean time between failures (MTBF), cost per asset, and status distribution across the fleet. Vibration data trending allows you to log periodic vibration readings and plot them over time, providing early warning of bearing degradation or imbalance before catastrophic failure occurs. Whether you manage ten pumps or ten thousand, this tracker scales to keep your assets running reliably and your maintenance programme audit-ready.</p>`,
        features: [
            "Complete pump asset register with technical specifications and warranty data",
            "Service history log with date, engineer, description, parts, and cost",
            "Calendar-based and running-hours-based maintenance scheduling",
            "Overdue maintenance alerts with colour-coded dashboard highlighting",
            "Spare parts inventory with stock levels and reorder point alerts",
            "Fleet overview dashboard with MTBF, compliance rates, and cost analysis",
            "Vibration data trending charts for early fault detection",
            "Optional VBA email alerts for upcoming and overdue maintenance items",
            "Filterable views by location, asset type, status, and priority",
            "Cost tracking per asset for lifecycle cost analysis and budgeting"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 9. Concrete Pour Register
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "concrete-pour-register",
        title: "Concrete Pour Register",
        category: ["concrete", "registers", "inspection"],
        price: "£21.99",
        oldPrice: "",
        badge: "Concrete & Materials",
        icon: "🏗️",
        desc: "Complete concrete pour planning and tracking with mix design logging, volume calculations, formwork strike time calculator, cube test management, and quality dashboard.",
        longDesc: `<p>The Concrete Pour Register is an all-in-one Excel template for managing every aspect of concrete works on your construction project. From initial pour planning through placement, curing, and strength verification, every stage is captured in a structured register that gives engineers, supervisors, and quality managers full traceability of every cubic metre placed. Each pour record includes date, location, structural element, specified mix design, actual batch ticket details, volume ordered versus volume placed, slump test results, air temperature, concrete temperature, and any admixtures or additions used.</p><p>The integrated formwork strike time calculator uses maturity-based methods to determine the earliest safe stripping time based on ambient temperature records and cement type, helping you optimise your formwork cycle without compromising structural safety. Cube test management tracks every set of test cubes from casting through to lab results, with automated strength gain plotting and pass/fail analysis against specified characteristic strengths. Non-conformance logging captures any deviations — rejected loads, failed cube results, cold joints, honeycombing — with structured fields for description, cause, corrective action, and sign-off.</p><p>The quality dashboard provides a project-wide overview with charts showing pour volumes by month, cube test pass rates, supplier performance league tables, non-conformance trends, and weather impact analysis. Supplier performance tracking monitors delivery reliability, ticket accuracy, and concrete quality by batching plant, giving your commercial team data-driven leverage for supplier reviews. Whether you are pouring foundations, slabs, walls, or specialist structures, this register keeps your concrete programme organised, compliant, and transparent.</p>`,
        features: [
            "Structured pour register with mix design, volumes, and test data",
            "Formwork strike time calculator based on maturity and temperature",
            "Cube test management with strength gain plotting and pass/fail analysis",
            "Non-conformance logging with cause, corrective action, and sign-off",
            "Supplier performance tracking by batching plant and delivery reliability",
            "Quality dashboard with pour volumes, pass rates, and trend charts",
            "Weather and temperature recording for each pour event",
            "Slump test and admixture tracking for full batch traceability",
            "Automated volume reconciliation: ordered vs placed vs wasted",
            "Printable pour records and quality summary reports"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 10. HSE Monthly Meeting Pack
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "hse-monthly-meeting-pack",
        title: "HSE Monthly Meeting Pack",
        category: ["hse", "stakeholder", "registers"],
        price: "£19.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "📑",
        desc: "Professional HSE meeting agenda templates with leading and lagging KPI dashboards, AFR calculations, near-miss trending, action tracker, incident analysis, and auto-formatted printable packs.",
        longDesc: `<p>The HSE Monthly Meeting Pack is a ready-to-use Excel template that provides construction project teams with everything they need to run effective, data-driven health, safety, and environmental review meetings. It includes a structured meeting agenda template that covers standing items — incident review, KPI performance, inspection findings, near-miss analysis, and action close-out — ensuring that no critical safety topic is overlooked. The agenda is fully customisable, so you can add project-specific items, reorder sections, and tailor the format to your organisation's meeting culture.</p><p>The KPI dashboard is the centrepiece of the pack, presenting both leading indicators (safety observations, toolbox talks delivered, inspections completed, training hours) and lagging indicators (lost-time incidents, RIDDOR reports, first aid cases, environmental incidents) in a clear, visual format with trend lines and RAG-rated targets. The Accident Frequency Rate (AFR) calculator automatically computes your AFR from hours worked and incident data, benchmarking your performance against industry averages. Near-miss trending charts show volumes by category, location, and month, helping you identify emerging risk themes before they result in harm.</p><p>An integrated action tracker logs every action arising from the meeting, assigns owners and target dates, and tracks completion status with overdue highlighting. When the meeting is over, the auto-format feature compiles the agenda, KPI dashboard, incident summaries, and action log into a professional, printable meeting pack that can be distributed to attendees, filed in the project safety records, or submitted to the client as evidence of proactive safety management. The entire pack updates dynamically as you enter new data each month, so preparation time is minimal.</p>`,
        features: [
            "Structured meeting agenda covering all standard HSE review topics",
            "Leading and lagging KPI dashboard with trend lines and RAG targets",
            "Automatic Accident Frequency Rate (AFR) calculation and benchmarking",
            "Near-miss trending charts by category, location, and time period",
            "Integrated action tracker with owner, target date, and status columns",
            "Incident analysis section with root cause and corrective action fields",
            "Auto-formatted printable meeting pack for distribution and filing",
            "Customisable agenda sections to match organisational requirements",
            "Dynamic monthly data entry with automatic chart and KPI updates",
            "Environmental incident tracking alongside health and safety metrics"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/hse-monthly-meeting-pack",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.3 MB",
        lastUpdate: "March 2026",
        popularity: 9,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 11. Delivery Booking System
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "delivery-booking-system",
        title: "Delivery Booking System",
        category: ["planning", "daily", "registers"],
        price: "£23.99",
        oldPrice: "",
        badge: "Planning",
        icon: "🚛",
        desc: "Time-slot booking calendar for construction deliveries with vehicle tracking, storage allocation, supplier database, conflict detection, unloading requirements, and weekly logistics summaries.",
        longDesc: `<p>The Delivery Booking System is an Excel-based logistics management tool designed to bring order to the often chaotic process of managing material deliveries on busy construction sites. At its core is a visual time-slot booking calendar that divides each working day into configurable intervals — typically 30-minute or one-hour slots — and allows logistics managers to book, view, and manage all incoming deliveries in a single, colour-coded overview. Each booking captures the supplier, material type, estimated number of vehicles, vehicle size category, required unloading equipment (crane, telehandler, forklift, manual), and designated storage or laydown area.</p><p>Conflict detection logic automatically checks for overbooking against your site's defined constraints — maximum vehicles per hour, unloading bay capacity, crane availability, and gate access limitations. When a proposed booking would exceed any constraint, the template highlights the conflict in red and suggests alternative available slots. The supplier database stores contact details, lead times, and delivery performance ratings for all your regular suppliers, making it quick to set up repeat bookings and track which suppliers consistently deliver on time, early, or late.</p><p>A daily overview sheet provides the site team with a printable one-page summary of all expected deliveries for the day, including arrival times, vehicle details, unloading requirements, and storage destinations — perfect for briefing gatemen, banksmen, and forklift operators at the morning coordination meeting. Weekly logistics summaries aggregate delivery volumes, vehicle movements, and supplier performance into management-level reports. For congested urban sites or projects with restricted delivery windows, this template is an indispensable planning tool that reduces site congestion, waiting times, and health and safety risks associated with uncontrolled vehicle movements.</p>`,
        features: [
            "Visual time-slot booking calendar with configurable intervals",
            "Conflict detection for overbooking against site capacity constraints",
            "Supplier database with contact details and delivery performance ratings",
            "Vehicle tracking with size category and unloading equipment requirements",
            "Storage and laydown area allocation linked to each delivery booking",
            "Printable daily delivery overview for site team morning briefings",
            "Weekly logistics summary reports with volume and performance metrics",
            "Colour-coded calendar view for instant visual status assessment",
            "Gate access and crane availability scheduling integration",
            "Repeat booking functionality for regular supplier deliveries"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/delivery-booking-system",
        youtubeId: "",
        new: false,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.3 MB",
        lastUpdate: "March 2026",
        popularity: 10,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 12. PIC Competence Assessment
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "pic-competence-assessment",
        title: "PIC Competence Assessment",
        category: ["hse", "competence"],
        price: "£17.99",
        oldPrice: "",
        badge: "Competence & Training",
        icon: "👷",
        desc: "Structured competence assessment framework with skills matrix, gap analysis, training records, certification expiry tracking, role-specific mapping, and printable competence certificates.",
        longDesc: `<p>The PIC Competence Assessment template is a structured Excel-based framework for evaluating and managing workforce competence in construction and civil engineering environments. It is built around the principle that competence is more than just holding a qualification card — it encompasses knowledge, skills, experience, and behaviours. The template provides a comprehensive set of competence criteria for Person in Charge (PIC) roles, covering technical knowledge, safety awareness, leadership capability, communication skills, and task-specific proficiencies that can be customised to match your organisation's competence standards or client requirements.</p><p>The skills matrix provides a visual, colour-coded overview of competence levels across your entire team. For each individual, assessors rate competence against defined criteria using a structured scale (not yet competent, developing, competent, expert), and the matrix automatically highlights gaps where additional training, mentoring, or supervised experience is needed. Gap analysis reports identify the most critical skill shortages across the team and recommend targeted development actions. Training records capture every course, qualification, and certification held by each team member, with automatic expiry tracking that flags items approaching or past their renewal date in amber and red respectively.</p><p>Role-specific mapping links competence requirements to defined roles — site supervisor, section engineer, lifting coordinator, temporary works coordinator, and so on — so you can instantly see whether each person meets the requirements for their assigned role. Development planning sheets provide a structured format for recording agreed development objectives, timelines, and review dates for individuals who need to close competence gaps. The template also generates printable competence assessment certificates that record the outcome of each assessment with assessor details, date, and next review date — ideal for audit evidence and personal development portfolios.</p>`,
        features: [
            "Structured PIC competence criteria covering technical and behavioural skills",
            "Visual skills matrix with colour-coded competence levels across the team",
            "Gap analysis reports identifying critical skill shortages and priorities",
            "Training record management with qualification and certification tracking",
            "Automatic certification expiry alerts with amber and red warnings",
            "Role-specific competence mapping for defined construction site roles",
            "Development planning sheets with objectives, timelines, and review dates",
            "Printable competence assessment certificates for audit evidence",
            "Customisable criteria to match organisational or client standards",
            "Assessment history tracking for trend analysis and continuous improvement"
        ],
        images: [],
        pdfLink: "#",
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

    // ────────────────────────────────────────────────────────────────────────
    // 13. Temporary Works Register
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "temporary-works-register",
        title: "Temporary Works Register",
        category: ["temporary", "registers", "hse"],
        price: "£26.99",
        oldPrice: "",
        badge: "Temporary Works",
        icon: "🚧",
        desc: "BS 5975 compliant temporary works register with design check certificates, permit to load management, inspection scheduling, TWC/TWS assignment, RAG dashboards, and printable reports.",
        longDesc: `<p>The Temporary Works Register is a comprehensive Excel template that provides full compliance with BS 5975:2019 — the code of practice for temporary works procedures and the permissible stress design of falsework. Managing temporary works is one of the most safety-critical responsibilities on any construction project, and this register ensures that every temporary works item — from scaffolding and propping to cofferdams, excavation support, and temporary bridges — is formally registered, designed, checked, approved, inspected, loaded, and eventually dismantled through a controlled, auditable process.</p><p>Each register entry captures the temporary works item description, location, designer, design checker, Temporary Works Coordinator (TWC) assignment, Temporary Works Supervisor (TWS) assignment, design check certificate reference, permit to load status, inspection schedule, and current lifecycle stage. The permit to load management module ensures that no temporary works item is loaded until the design has been checked, the TWC has approved the installation, and all pre-loading inspections have been completed and signed off. Design check certificates can be generated directly from the template in a format that satisfies BS 5975 requirements, recording the checker's confirmation that the design is adequate for the intended loading and conditions.</p><p>The RAG-rated dashboard provides an instant overview of every temporary works item on the project, colour-coded by lifecycle stage and compliance status. Items awaiting design checks, overdue inspections, or pending permits to load are highlighted so the TWC can prioritise their attention where it matters most. Inspection scheduling tracks recurring inspection requirements against each item, with automated reminders for upcoming and overdue inspections. Dismantling procedures ensure that temporary works are not removed prematurely, with a formal sign-off process confirming that the permanent works have achieved sufficient strength to carry the loads. All data is printable in professional report formats suitable for project safety files and external audits.</p>`,
        features: [
            "Full BS 5975:2019 compliance for temporary works management procedures",
            "Design check certificate generation within the template",
            "Permit to load management with pre-loading inspection verification",
            "TWC and TWS assignment and tracking for every temporary works item",
            "RAG-rated dashboard with lifecycle stage and compliance status overview",
            "Automated inspection scheduling with upcoming and overdue reminders",
            "Dismantling sign-off process to prevent premature removal",
            "Comprehensive register covering scaffolding, propping, cofferdams, and more",
            "Printable reports for project safety files and external audits",
            "Structured lifecycle tracking from design through to removal"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/temporary-works-register",
        youtubeId: "",
        new: true,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.5 MB",
        lastUpdate: "March 2026",
        popularity: 14,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 14. Plant & Equipment Register
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "plant-equipment-register",
        title: "Plant & Equipment Register",
        category: ["plant", "registers", "inspection"],
        price: "£22.99",
        oldPrice: "",
        badge: "Plant & Equipment",
        icon: "🏗️",
        desc: "Comprehensive plant and equipment register with inspection date tracking, operator certification, defect reporting, utilisation dashboards, LOLER/PUWER compliance, and fleet cost summaries.",
        longDesc: `<p>The Plant & Equipment Register is a thorough Excel template that gives construction site teams complete control over their plant fleet — from 360-degree excavators and tower cranes to generators, pumps, and hand-held power tools. Every item of plant is recorded in a master register with asset ID, description, make, model, serial number, owner (hired or owned), hire company, on-site date, and current location. The register is designed to satisfy the record-keeping requirements of both the Lifting Operations and Lifting Equipment Regulations 1998 (LOLER) and the Provision and Use of Work Equipment Regulations 1998 (PUWER), with dedicated fields for statutory inspection dates, thorough examination certificates, and next-due dates.</p><p>Inspection date tracking is central to the template. Colour-coded conditional formatting highlights items with inspections due within 14 days in amber and overdue items in red, giving plant managers and supervisors instant visibility of compliance status across the entire fleet. Operator certification tracking links each item of plant to its assigned operator(s) and records their relevant qualifications — CPCS, NPORS, CSCS, or manufacturer-specific tickets — with expiry dates that trigger alerts when renewal is approaching. The defect reporting module provides a structured form for logging defects, categorising severity, recording remedial action, and tracking repair completion with sign-off.</p><p>The utilisation dashboard shows how effectively your plant fleet is being used, with charts displaying utilisation rates by asset, by category, and by week. This data helps project managers make informed decisions about plant requirements, off-hiring underutilised machines, and negotiating hire rates. Cost tracking captures hire charges, fuel consumption, maintenance costs, and transport costs per asset, feeding into fleet summary reports that show total plant expenditure by category and by month. Whether you manage a small fleet of ten machines or a large infrastructure project with hundreds of plant items, this register keeps everything organised, compliant, and cost-transparent.</p>`,
        features: [
            "Master plant register with asset details, ownership, and location tracking",
            "LOLER and PUWER compliant inspection and examination date tracking",
            "Colour-coded alerts for upcoming and overdue statutory inspections",
            "Operator certification tracking with CPCS/NPORS/CSCS expiry alerts",
            "Structured defect reporting with severity classification and repair tracking",
            "Utilisation dashboard with charts by asset, category, and time period",
            "Cost tracking for hire charges, fuel, maintenance, and transport",
            "Fleet summary reports with total expenditure by category and month",
            "Filterable views by asset type, location, status, and hire company",
            "Printable inspection schedules and compliance summary reports"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/plant-equipment-register",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.4 MB",
        lastUpdate: "March 2026",
        popularity: 11,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 15. Commissioning Tracker
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "commissioning-tracker",
        title: "Commissioning Tracker",
        category: ["commissioning", "asset", "wastewater"],
        price: "£32.99",
        oldPrice: "",
        badge: "Commissioning",
        icon: "✅",
        desc: "Full commissioning management with system boundary definition, test schedules, punch lists (A/B/C), witness point coordination, handover checklists, RAG dashboards, and client-ready reports.",
        longDesc: `<p>The Commissioning Tracker is a professional Excel template that manages the entire commissioning process from mechanical completion through to performance testing and final handover. Designed for water, wastewater, energy, and industrial process projects, it provides a structured framework that ensures every system, subsystem, and component is systematically tested, verified, and accepted before the asset enters operational service. System boundary definition sheets allow you to map out your commissioning hierarchy — from overall plant level down to individual equipment items — establishing a clear scope for each commissioning package.</p><p>Test schedule management is at the heart of the template, tracking every pre-commissioning check, functional test, integration test, and performance test required across the programme. Each test record captures the test procedure reference, acceptance criteria, actual results, witness requirements, and pass/fail status. Punch lists are fully integrated with Category A (preventing safe operation), Category B (preventing handover), and Category C (minor defects acceptable for handover) classifications. Each punch item tracks description, raised-by, responsible party, target date, and close-out evidence, with overdue items flagged automatically on the dashboard.</p><p>Witness point coordination ensures that all client, third-party, and regulatory witness requirements are identified, scheduled, and confirmed in advance of testing. A dedicated calendar view shows upcoming witness points across all systems so the commissioning manager can coordinate resources and avoid delays caused by missed witness holds. Multi-level progress tracking provides completion percentages at plant, system, subsystem, and equipment level, feeding into RAG-rated dashboards that give management and clients an immediate visual summary of commissioning progress. When the project reaches handover, the template generates client-ready report packs with cover sheets, test result summaries, punch list status, and certificate indices that meet the documentation standards expected by UK water utility and infrastructure clients.</p>`,
        features: [
            "System boundary definition with hierarchical commissioning structure",
            "Test schedule management for pre-commissioning, functional, and performance tests",
            "Integrated punch lists with Category A, B, and C classification",
            "Witness point coordination with calendar view and hold/notification tracking",
            "Multi-level progress tracking at plant, system, subsystem, and equipment level",
            "RAG-rated dashboards for instant visual commissioning status overview",
            "Client-ready handover report pack generation with certificate indices",
            "Overdue punch item and missed test alerts with conditional formatting",
            "Acceptance criteria and actual result recording for every test",
            "Handover checklists ensuring all documentation is complete before transfer"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/commissioning-tracker",
        youtubeId: "",
        new: true,
        featured: true,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.7 MB",
        lastUpdate: "March 2026",
        popularity: 15,
        isBundle: false,
        bundleProducts: [],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 16. Permit to Work System
    // ────────────────────────────────────────────────────────────────────────
    {
        id: "permit-to-work-system",
        title: "Permit to Work System",
        category: ["hse", "daily", "registers"],
        price: "£21.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "📜",
        desc: "Multi-permit system covering hot works, confined space, excavation, and electrical isolation with structured checklists, digital sign-off, active permit register, and full audit trail.",
        longDesc: `<p>The Permit to Work System is a comprehensive Excel template that provides structured, auditable permit management for high-risk construction activities. It includes pre-built permit forms for the most common permit types encountered on construction and infrastructure projects: hot works, confined space entry, excavation, electrical isolation, working at height, and a customisable general permit template that can be adapted for any additional permit categories your project requires. Each permit form follows a consistent structure — hazard identification, precautions checklist, authorisation, acceptance, hand-back, and cancellation — ensuring that every high-risk activity goes through a controlled approval process before work begins.</p><p>Digital sign-off functionality allows permit issuers, acceptors, and cancellers to record their name, role, and timestamp at each stage of the permit lifecycle without the need for wet signatures on paper forms. The active permit register provides a real-time view of all currently live permits on the project, showing permit type, location, area, issuer, acceptor, valid-from, valid-to, and current status. Expired permits that have not been formally cancelled are highlighted as overdue, ensuring that no permit is left open indefinitely. Area-based mapping allows you to assign permits to defined site zones, enabling supervisors to see at a glance which areas have active permits and what restrictions apply.</p><p>The full audit trail records every action taken on every permit — creation, amendment, extension, suspension, hand-back, and cancellation — with timestamps and user identities, providing a complete history that satisfies regulatory and client audit requirements. Each permit type includes a tailored checklist of precautions: gas testing for confined spaces, fire extinguisher provision for hot works, barrier and signage requirements for excavations, and isolation verification for electrical permits. Printable permit forms maintain a professional layout that can be displayed at the point of work, attached to the site safety file, or submitted to the client as evidence of your permit-to-work programme. VBA macros streamline the permit creation process, pre-filling common fields and auto-generating unique permit numbers for traceability.</p>`,
        features: [
            "Pre-built permits for hot works, confined space, excavation, and electrical isolation",
            "Customisable general permit template for additional permit categories",
            "Digital sign-off for issuers, acceptors, and cancellers with timestamps",
            "Active permit register showing all live permits with status and expiry",
            "Area-based mapping to visualise active permits by site zone",
            "Full audit trail recording every permit action with user and timestamp",
            "Tailored precaution checklists for each permit type",
            "Overdue and expired permit highlighting with conditional formatting",
            "Printable permit forms for point-of-work display and safety files",
            "VBA-powered permit creation with auto-generated unique permit numbers"
        ],
        images: [],
        pdfLink: "#",
        buyLink: "https://ebrora.gumroad.com/l/permit-to-work-system",
        youtubeId: "",
        new: true,
        featured: false,
        compatible: "Windows & Mac",
        version: "1.0",
        fileSize: "1.6 MB",
        lastUpdate: "March 2026",
        popularity: 12,
        isBundle: false,
        bundleProducts: [],
    },

];


// ============================================================================
// REVIEWS
// ============================================================================

const REVIEWS = [
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
        text: "The free PDF preview gave me confidence before buying. The actual Excel file exceeded expectations — brilliant VBA automation.",
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
        text: "The daily diary template is superb. Auto-generates reports, tracks weather, labour, plant — everything our QA team requires.",
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
        text: "The level of detail in these spreadsheets shows real industry knowledge. Not just pretty dashboards — proper functional tools.",
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
