/**
 * ============================================================================
 * EBRORA £ products.js
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
 *    - id            £ A unique URL slug (lowercase, hyphens, no spaces).
 *                      Example: "my-new-template"
 *    - title         £ The display name shown on cards and the product page.
 *    - category      £ An array of category slugs (see list below).
 *    - price         £ Current selling price as a string, e.g. "££19.99".
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
 *    - pdfLink       £ URL to the free PDF preview. Use "#" as placeholder.
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

const CATEGORIES = {
    hse:            { label: "HSE & Safety",              icon: "ð¦º" },
    project:        { label: "Project Management",        icon: "ð" },
    asset:          { label: "Asset & MEICA Tracking",    icon: "ð§" },
    wastewater:     { label: "Wastewater & Utilities",    icon: "ð§" },
    cost:           { label: "Cost & Carbon Calculators", icon: "ð°" },
    planning:       { label: "Construction Planning",     icon: "ð" },
    inspection:     { label: "Inspection & Testing",      icon: "ð" },
    registers:      { label: "Registers & Logs",          icon: "ð" },
    concrete:       { label: "Concrete & Materials",      icon: "ðï¸" },
    competence:     { label: "Competence & Training",     icon: "ð" },
    environmental:  { label: "Environmental",             icon: "ð±" },
    plant:          { label: "Plant & Equipment",         icon: "£ï¸" },
    daily:          { label: "Daily Operations",          icon: "ð" },
    commissioning:  { label: "Commissioning & Handover",  icon: "£" },
    stakeholder:    { label: "Stakeholder & Comms",       icon: "ð£" },
    temporary:      { label: "Temporary Works",           icon: "ð§" },
};


// ============================================================================
// PRODUCTS
// ============================================================================

const PRODUCTS = [

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 1. Excavation Inspection Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "excavation-inspection-register",
        title: "Excavation Inspection Register",
        category: ["inspection", "registers", "hse"],
        price: "££24.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
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
        images: ["product-images/Excavation-Inspection-Register-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 2. Gantt Chart Project Planner
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "gantt-chart-project-planner",
        title: "Gantt Chart Project Planner",
        category: ["project", "planning"],
        price: "££29.99",
        oldPrice: "",
        badge: "Project Management",
        icon: "ð",
        desc: "Advanced Gantt chart with task hierarchy, critical path highlighting, milestones, dependencies, resource allocation, and customisable timescales. Print-ready for construction programmes.",
        longDesc: `<p>The Gantt Chart Project Planner is a powerful yet intuitive Excel-based scheduling tool built from the ground up for construction and civil engineering projects. Unlike generic project management templates, this planner understands the realities of site-based programmes £ from phased earthworks and concrete pours to mechanical installations and commissioning sequences. It supports full task hierarchy with summary bars, subtasks, and milestone diamonds, giving you a clear visual representation of your entire programme on a single scrollable timeline.</p><p>Critical path logic is built directly into the spreadsheet engine. Define finish-to-start, start-to-start, finish-to-finish, and start-to-finish dependencies between any tasks, and the template automatically calculates float, highlights the critical path in red, and flags any tasks at risk of causing programme delay. Resource allocation columns let you assign teams, plant, or subcontractors to each task, and a separate resource summary sheet shows loading by week so you can identify clashes or under-utilisation before they become problems on site.</p><p>The timescale is fully customisable £ switch between daily, weekly, and monthly views with a single dropdown selection. Print-ready formatting ensures your programme looks professional whether you are presenting to a client, pinning it to the site office wall, or including it in a tender submission. Colour-coded progress bars, baseline comparison, and percentage-complete tracking keep everyone aligned on where the project stands relative to plan.</p>`,
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
        images: ["product-images/Programme-Gantt-Chart-Template-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 3. COSHH Assessment Tool
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "coshh-assessment-tool",
        title: "COSHH Assessment Tool",
        category: ["hse", "inspection"],
        price: "££19.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "£ ï¸",
        desc: "Comprehensive COSHH risk assessment with a pre-built substance database, automated risk matrix, PPE mapping, printable assessment forms, and full compliance with UK COSHH Regulations 2002.",
        longDesc: `<p>The COSHH Assessment Tool is a purpose-built Excel template that enables construction and industrial teams to carry out thorough assessments under the Control of Substances Hazardous to Health Regulations 2002. It ships with a pre-built database of over 120 commonly encountered construction substances £ from cement dust and resin hardeners to diesel fuel and silica-bearing materials £ each pre-populated with hazard classifications, exposure limits, and recommended control measures. Simply select a substance and the template auto-fills the key hazard information, dramatically reducing the time it takes to produce a compliant assessment.</p><p>The automated risk matrix calculates residual risk scores based on your selected likelihood and severity ratings, both before and after control measures are applied. Colour-coded cells instantly communicate whether the residual risk is acceptable, tolerable, or unacceptable, guiding you toward appropriate additional controls. A dedicated PPE mapping section links each substance to the specific personal protective equipment required, and an emergency procedures tab provides structured response plans for spills, skin contact, inhalation, and ingestion scenarios for every substance in the register.</p><p>Completed assessments can be printed to a professional, single-page format that is ready for site display, toolbox talk briefings, or client audit submissions. The substance register dashboard gives a bird's-eye view of all assessed substances across your project, their risk ratings, review dates, and responsible persons. With built-in review reminders and version tracking, this tool ensures your COSHH programme stays current and legally defensible throughout the life of your project.</p>`,
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
        images: ["product-images/OWL-Register-Observation-Checklist-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 4. ITR Asset Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 5. Carbon Calculator for Construction
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "carbon-calculator-construction",
        title: "Carbon Calculator for Construction",
        category: ["cost", "environmental"],
        price: "££22.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "ð±",
        desc: "Calculate embodied carbon for construction materials, compare recycling vs landfill scenarios, analyse cost-carbon trade-offs, and generate BREEAM-supporting reports with professional dashboards.",
        longDesc: `<p>The Carbon Calculator for Construction is an Excel-based decision-support tool that helps project teams quantify, compare, and reduce the embodied carbon associated with their material choices. It covers all major construction material categories £ concrete, steel, timber, aggregates, asphalt, plastics, and fill materials £ with carbon emission factors sourced from the Inventory of Carbon and Energy (ICE) database and aligned with PAS 2080 principles. Simply enter your material quantities and the calculator returns total embodied carbon in kgCO2e, broken down by material type, lifecycle stage, and supply chain tier.</p><p>A powerful comparison module lets you evaluate recycling versus landfill scenarios side by side, showing not only the carbon savings but also the cost implications of choosing recycled aggregates, reclaimed steel, or secondary materials over virgin equivalents. The material sourcing distance calculator adds transport emissions based on supplier location and vehicle type, giving you a true cradle-to-site carbon picture. For teams pursuing BREEAM credits, the template maps outputs directly to the relevant Mat 01 and Wst 01 assessment criteria with supporting evidence summaries that can be submitted to assessors.</p><p>The waste hierarchy analysis module helps you demonstrate compliance with the waste management hierarchy by quantifying the proportion of material sent to reuse, recycling, recovery, and disposal. A professional dashboard with tracking charts shows how your project's carbon footprint evolves over time as material decisions are made and procurement progresses. One-click report generation produces a branded PDF summary suitable for client presentations, tender submissions, or regulatory evidence packs.</p>`,
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
        images: ["product-images/Carbon-Calculator-Construction-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 6. Daily Diary Template
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "daily-diary-template",
        title: "Daily Diary Template",
        category: ["daily", "registers", "planning"],
        price: "££18.99",
        oldPrice: "",
        badge: "Daily Operations",
        icon: "ð",
        desc: "Automated daily construction diary with weather logging, labour and plant tracking, material delivery records, visitor log, VBA-generated reports, and a searchable archive.",
        longDesc: `<p>The Daily Diary Template is an essential site management tool that captures everything that happens on your construction project, every single day, in a structured and searchable format. Each diary entry records the date, weather conditions (temperature, wind, rainfall), site working hours, and a detailed narrative of the day's activities. Dedicated sections for labour returns, plant on site, material deliveries, visitors, and subcontractor presence ensure that no critical information is lost £ whether you need it for progress reporting, contractual claims, or dispute resolution months down the line.</p><p>VBA automation takes the pain out of report generation. At the end of each week or month, a single button press compiles all diary entries into a formatted summary report, complete with labour histograms, plant utilisation charts, material delivery schedules, and weather impact analysis. These reports can be exported to PDF for distribution to the client, project manager, or commercial team. The template also generates a running weather disruption log that automatically flags days where adverse conditions may have affected productivity £ invaluable evidence for extension-of-time claims under NEC or JCT contracts.</p><p>All entries are stored in a searchable archive sheet where you can filter by date range, keyword, author, or category. Whether you need to find out when a particular delivery arrived, who was on site on a specific date, or how many days were lost to rain last quarter, the answer is seconds away. The diary is pre-formatted for consistency, so even if multiple site managers or engineers contribute entries, the output remains professional and uniform across the entire project duration.</p>`,
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
        images: ["product-images/Daily-Diary-Template-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 7. ART Assessment Tool
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "art-assessment-tool",
        title: "ART Assessment Tool",
        category: ["hse", "competence"],
        price: "££16.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "ð¦º",
        desc: "HSE Assessment of Repetitive Tasks tool with guided workflows, automated risk scoring, colour-coded risk levels, control measure recommendations, and printable assessment reports.",
        longDesc: `<p>The ART Assessment Tool is an Excel-based implementation of the HSE's Assessment of Repetitive Tasks methodology, designed for occupational health and safety professionals working in construction, manufacturing, and industrial environments. It provides a guided, step-by-step workflow that walks assessors through the evaluation of repetitive manual tasks £ from identifying the task and workforce involved, through scoring frequency, force, posture, and additional risk factors, to calculating an overall exposure level and recommending proportionate control measures.</p><p>Automated risk scoring eliminates manual calculation errors and ensures consistency across assessments. As you enter scores for each body region and risk factor, the template instantly computes the task-level exposure score and assigns a colour-coded risk level: green for low risk, amber for medium risk requiring further investigation, and red for high risk demanding immediate action. Each risk level is linked to a library of pre-written control measure recommendations tailored to construction activities, so assessors are not left wondering what to do with the results £ practical guidance is provided automatically.</p><p>Completed assessments can be printed to a professional report format suitable for inclusion in project health and safety files, toolbox talk packs, or regulatory submissions. The assessment history sheet maintains a chronological record of all assessments carried out, enabling trend analysis over time. If a task is reassessed after control measures are implemented, the before-and-after comparison clearly demonstrates risk reduction. The template supports multiple task assessments within a single workbook, making it ideal for teams managing diverse construction activities across one or several project sites.</p>`,
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
        images: ["product-images/Root-Cause-Analysis-Fishbone-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 8. Pump Maintenance Tracker
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "pump-maintenance-tracker",
        title: "Pump Maintenance Tracker",
        category: ["wastewater", "asset", "plant"],
        price: "££27.99",
        oldPrice: "",
        badge: "Wastewater",
        icon: "£ï¸",
        desc: "Comprehensive pump asset register with maintenance scheduling, service history logging, running hours tracking, spare parts inventory, overdue alerts, and a fleet overview dashboard.",
        longDesc: `<p>The Pump Maintenance Tracker is a specialist Excel template built for teams who operate and maintain pumping assets in the water, wastewater, and process industries. It provides a complete asset register for your entire pump fleet £ capturing make, model, serial number, location, duty point, impeller size, motor rating, installation date, and warranty status for every pump under your care. Each asset links to a detailed service history log where every maintenance intervention, inspection, and repair is recorded with date, engineer, work description, parts used, and cost.</p><p>Maintenance scheduling is driven by both calendar-based intervals and running-hours thresholds. The template tracks cumulative running hours for each pump and automatically flags when the next service, oil change, seal replacement, or bearing inspection is due. Overdue maintenance items are highlighted in red on the fleet overview dashboard, and optional VBA-driven email alerts can notify responsible engineers before a service window is missed. The spare parts inventory module tracks stock levels of common consumables £ mechanical seals, wear rings, impellers, coupling elements £ and alerts you when reorder levels are reached.</p><p>The fleet overview dashboard presents a consolidated view of your entire pump estate, with summary charts showing maintenance compliance rates, mean time between failures (MTBF), cost per asset, and status distribution across the fleet. Vibration data trending allows you to log periodic vibration readings and plot them over time, providing early warning of bearing degradation or imbalance before catastrophic failure occurs. Whether you manage ten pumps or ten thousand, this tracker scales to keep your assets running reliably and your maintenance programme audit-ready.</p>`,
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
        images: ["product-images/Pump-Maintenance-Tracker-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 9. Concrete Pour Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "concrete-pour-register",
        title: "Concrete Pour Register",
        category: ["concrete", "registers", "inspection"],
        price: "££21.99",
        oldPrice: "",
        badge: "Concrete & Materials",
        icon: "ðï¸",
        desc: "Complete concrete pour planning and tracking with mix design logging, volume calculations, formwork strike time calculator, cube test management, and quality dashboard.",
        longDesc: `<p>The Concrete Pour Register is an all-in-one Excel template for managing every aspect of concrete works on your construction project. From initial pour planning through placement, curing, and strength verification, every stage is captured in a structured register that gives engineers, supervisors, and quality managers full traceability of every cubic metre placed. Each pour record includes date, location, structural element, specified mix design, actual batch ticket details, volume ordered versus volume placed, slump test results, air temperature, concrete temperature, and any admixtures or additions used.</p><p>The integrated formwork strike time calculator uses maturity-based methods to determine the earliest safe stripping time based on ambient temperature records and cement type, helping you optimise your formwork cycle without compromising structural safety. Cube test management tracks every set of test cubes from casting through to lab results, with automated strength gain plotting and pass/fail analysis against specified characteristic strengths. Non-conformance logging captures any deviations £ rejected loads, failed cube results, cold joints, honeycombing £ with structured fields for description, cause, corrective action, and sign-off.</p><p>The quality dashboard provides a project-wide overview with charts showing pour volumes by month, cube test pass rates, supplier performance league tables, non-conformance trends, and weather impact analysis. Supplier performance tracking monitors delivery reliability, ticket accuracy, and concrete quality by batching plant, giving your commercial team data-driven leverage for supplier reviews. Whether you are pouring foundations, slabs, walls, or specialist structures, this register keeps your concrete programme organised, compliant, and transparent.</p>`,
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
        images: ["product-images/Concrete-Pour-Register-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 10. HSE Monthly Meeting Pack
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 11. Delivery Booking System
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "delivery-booking-system",
        title: "Delivery Booking System",
        category: ["planning", "daily", "registers"],
        price: "££23.99",
        oldPrice: "",
        badge: "Planning",
        icon: "ð",
        desc: "Time-slot booking calendar for construction deliveries with vehicle tracking, storage allocation, supplier database, conflict detection, unloading requirements, and weekly logistics summaries.",
        longDesc: `<p>The Delivery Booking System is an Excel-based logistics management tool designed to bring order to the often chaotic process of managing material deliveries on busy construction sites. At its core is a visual time-slot booking calendar that divides each working day into configurable intervals £ typically 30-minute or one-hour slots £ and allows logistics managers to book, view, and manage all incoming deliveries in a single, colour-coded overview. Each booking captures the supplier, material type, estimated number of vehicles, vehicle size category, required unloading equipment (crane, telehandler, forklift, manual), and designated storage or laydown area.</p><p>Conflict detection logic automatically checks for overbooking against your site's defined constraints £ maximum vehicles per hour, unloading bay capacity, crane availability, and gate access limitations. When a proposed booking would exceed any constraint, the template highlights the conflict in red and suggests alternative available slots. The supplier database stores contact details, lead times, and delivery performance ratings for all your regular suppliers, making it quick to set up repeat bookings and track which suppliers consistently deliver on time, early, or late.</p><p>A daily overview sheet provides the site team with a printable one-page summary of all expected deliveries for the day, including arrival times, vehicle details, unloading requirements, and storage destinations £ perfect for briefing gatemen, banksmen, and forklift operators at the morning coordination meeting. Weekly logistics summaries aggregate delivery volumes, vehicle movements, and supplier performance into management-level reports. For congested urban sites or projects with restricted delivery windows, this template is an indispensable planning tool that reduces site congestion, waiting times, and health and safety risks associated with uncontrolled vehicle movements.</p>`,
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
        images: ["product-images/Action-Calendar-Template-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 12. PIC Competence Assessment
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "pic-competence-assessment",
        title: "PIC Competence Assessment",
        category: ["hse", "competence"],
        price: "££17.99",
        oldPrice: "",
        badge: "Competence & Training",
        icon: "ð·",
        desc: "Structured competence assessment framework with skills matrix, gap analysis, training records, certification expiry tracking, role-specific mapping, and printable competence certificates.",
        longDesc: `<p>The PIC Competence Assessment template is a structured Excel-based framework for evaluating and managing workforce competence in construction and civil engineering environments. It is built around the principle that competence is more than just holding a qualification card £ it encompasses knowledge, skills, experience, and behaviours. The template provides a comprehensive set of competence criteria for Person in Charge (PIC) roles, covering technical knowledge, safety awareness, leadership capability, communication skills, and task-specific proficiencies that can be customised to match your organisation's competence standards or client requirements.</p><p>The skills matrix provides a visual, colour-coded overview of competence levels across your entire team. For each individual, assessors rate competence against defined criteria using a structured scale (not yet competent, developing, competent, expert), and the matrix automatically highlights gaps where additional training, mentoring, or supervised experience is needed. Gap analysis reports identify the most critical skill shortages across the team and recommend targeted development actions. Training records capture every course, qualification, and certification held by each team member, with automatic expiry tracking that flags items approaching or past their renewal date in amber and red respectively.</p><p>Role-specific mapping links competence requirements to defined roles £ site supervisor, section engineer, lifting coordinator, temporary works coordinator, and so on £ so you can instantly see whether each person meets the requirements for their assigned role. Development planning sheets provide a structured format for recording agreed development objectives, timelines, and review dates for individuals who need to close competence gaps. The template also generates printable competence assessment certificates that record the outcome of each assessment with assessor details, date, and next review date £ ideal for audit evidence and personal development portfolios.</p>`,
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
        images: ["product-images/Persons-In-Charge-Assessment-excel-ebrora.jpg"],
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

    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    // 13. Temporary Works Register
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "temporary-works-register",
        title: "Temporary Works Register",
        category: ["temporary", "registers", "hse"],
        price: "££26.99",
        oldPrice: "",
        badge: "Temporary Works",
        icon: "ð§",
        desc: "BS 5975 compliant temporary works register with design check certificates, permit to load management, inspection scheduling, TWC/TWS assignment, RAG dashboards, and printable reports.",
        longDesc: `<p>The Temporary Works Register is a comprehensive Excel template that provides full compliance with BS 5975:2019 £ the code of practice for temporary works procedures and the permissible stress design of falsework. Managing temporary works is one of the most safety-critical responsibilities on any construction project, and this register ensures that every temporary works item £ from scaffolding and propping to cofferdams, excavation support, and temporary bridges £ is formally registered, designed, checked, approved, inspected, loaded, and eventually dismantled through a controlled, auditable process.</p><p>Each register entry captures the temporary works item description, location, designer, design checker, Temporary Works Coordinator (TWC) assignment, Temporary Works Supervisor (TWS) assignment, design check certificate reference, permit to load status, inspection schedule, and current lifecycle stage. The permit to load management module ensures that no temporary works item is loaded until the design has been checked, the TWC has approved the installation, and all pre-loading inspections have been completed and signed off. Design check certificates can be generated directly from the template in a format that satisfies BS 5975 requirements, recording the checker's confirmation that the design is adequate for the intended loading and conditions.</p><p>The RAG-rated dashboard provides an instant overview of every temporary works item on the project, colour-coded by lifecycle stage and compliance status. Items awaiting design checks, overdue inspections, or pending permits to load are highlighted so the TWC can prioritise their attention where it matters most. Inspection scheduling tracks recurring inspection requirements against each item, with automated reminders for upcoming and overdue inspections. Dismantling procedures ensure that temporary works are not removed prematurely, with a formal sign-off process confirming that the permanent works have achieved sufficient strength to carry the loads. All data is printable in professional report formats suitable for project safety files and external audits.</p>`,
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
        images: ["product-images/Temporary-Works-Class-Matrix-excel-ebrora.jpg"],
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
    category: ["hse", "registers"],
    price: "££18.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "ð¦º",
    desc: "Hand-Arm Vibration Syndrome monitoring register with exposure point tracking, trigger time calculations, tool inventories, health surveillance scheduling, and HSE-compliant reporting dashboards.",
    longDesc: `<p>The HAVS Monitoring Register is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing havs monitoring processes. Hand-Arm Vibration Syndrome monitoring register with exposure point tracking, trigger time calculations, tool inventories, health surveillance scheduling, and HSE-compliant reporting dashboards.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured havs monitoring register with comprehensive data capture fields",
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
    images: ["product-images/HAVS-Vibration-Monitoring-Register-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["hse", "inspection"],
    price: "££16.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "£ ï¸",
    desc: "Automated manual handling risk assessment calculator aligned with HSE MAC and RAPP methodologies, featuring load and posture scoring, colour-coded risk output, and printable assessment reports.",
    longDesc: `<p>The Manual Handling Risk Score Calculator is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing manual handling risk score processes. Automated manual handling risk assessment calculator aligned with HSE MAC and RAPP methodologies, featuring load and posture scoring, colour-coded risk output, and printable assessment reports.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured manual handling risk score calculator with comprehensive data capture fields",
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
    images: ["product-images/Manual-Handling-Risk-Calculator-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["hse", "inspection"],
    price: "££19.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "£ ï¸",
    desc: "Confined space risk assessment tool with atmospheric monitoring checklists, entry permit generation, rescue plan templates, gas test logging, and compliance tracking against the Confined Spaces Regulations 1997.",
    longDesc: `<p>The Confined Space Assessment Calculator is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing confined space assessment processes. Confined space risk assessment tool with atmospheric monitoring checklists, entry permit generation, rescue plan templates, gas test logging, and compliance tracking against the Confined Spaces Regulations 1997.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured confined space assessment calculator with comprehensive data capture fields",
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
    images: ["product-images/Confined-Space-Assessment-Calculator-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["hse", "inspection"],
    price: "££14.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "ð¥",
    desc: "Structured fire risk assessment template for office and site accommodation with hazard identification, person-at-risk analysis, control measures, evacuation planning, and Regulatory Reform Order compliance.",
    longDesc: `<p>The Office Fire Risk Assessment is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing office fire risk assessment processes. Structured fire risk assessment template for office and site accommodation with hazard identification, person-at-risk analysis, control measures, evacuation planning, and Regulatory Reform Order compliance.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured office fire risk assessment with comprehensive data capture fields",
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
    images: ["product-images/Office-Fire-Risk-Assessment-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["inspection", "registers", "commissioning"],
    price: "££21.99",
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
    pdfLink: "#",
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
    category: ["plant", "daily", "hse"],
    price: "££15.99",
    oldPrice: "",
    badge: "Plant & Equipment",
    icon: "£ï¸",
    desc: "Printable pre-use inspection checklists for excavators, telehandlers, dumpers, cranes, and more with defect categorisation, operator sign-off, and supervisor review tracking.",
    longDesc: `<p>The Plant Pre-Use Check Sheets is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing plant pre-use check s processes. Printable pre-use inspection checklists for excavators, telehandlers, dumpers, cranes, and more with defect categorisation, operator sign-off, and supervisor review tracking.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured plant pre-use check sheets with comprehensive data capture fields",
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
    images: ["product-images/Plant-Pre-Use-Check-Sheet-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["plant", "registers"],
    price: "££17.99",
    oldPrice: "",
    badge: "Plant & Equipment",
    icon: "£ï¸",
    desc: "Centralised plant defect and breakdown tracker with fault categorisation, repair status monitoring, downtime analysis, hire company liaison logging, and fleet reliability dashboards.",
    longDesc: `<p>The Plant Issues Tracker is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing plant issues processes. Centralised plant defect and breakdown tracker with fault categorisation, repair status monitoring, downtime analysis, hire company liaison logging, and fleet reliability dashboards.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured plant issues tracker with comprehensive data capture fields",
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
    images: ["product-images/Plant-Issues-Tracker-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["plant", "hse"],
    price: "££14.99",
    oldPrice: "",
    badge: "Plant & Equipment",
    icon: "ðï¸",
    desc: "Decision-support tool for selecting the correct access equipment £ scaffolding, MEWP, tower scaffold, podium steps, or ladders £ based on task requirements, duration, height, and risk assessment criteria.",
    longDesc: `<p>The Access Equipment Selector is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing access equipment selector processes. Decision-support tool for selecting the correct access equipment £ scaffolding, MEWP, tower scaffold, podium steps, or ladders £ based on task requirements, duration, height, and risk assessment criteria.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured access equipment selector with comprehensive data capture fields",
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
    images: ["product-images/Access-Equipment-Selector-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["plant", "cost", "environmental"],
    price: "££14.99",
    oldPrice: "",
    badge: "Cost & Carbon",
    icon: "£½",
    desc: "Plant fuel consumption tracker with litres-per-hour logging, cost analysis by asset, carbon emissions calculation, refuelling schedules, and fuel theft detection through variance monitoring.",
    longDesc: `<p>The Fuel Usage Calculator is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing fuel usage processes. Plant fuel consumption tracker with litres-per-hour logging, cost analysis by asset, carbon emissions calculation, refuelling schedules, and fuel theft detection through variance monitoring.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured fuel usage calculator with comprehensive data capture fields",
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
    images: ["product-images/Fuel-Usage-Calculator-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["project", "stakeholder"],
    price: "££19.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Weighted scorecard for evaluating subcontractor performance across quality, safety, programme, commercial, and collaboration criteria with automated RAG ratings and trend tracking.",
    longDesc: `<p>The Subcontractor Performance Scorecard is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing subcontractor performance scorecard processes. Weighted scorecard for evaluating subcontractor performance across quality, safety, programme, commercial, and collaboration criteria with automated RAG ratings and trend tracking.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured subcontractor performance scorecard with comprehensive data capture fields",
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
    images: ["product-images/Subcontractor-Performance-Scorecard-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["competence", "daily"],
    price: "££14.99",
    oldPrice: "",
    badge: "Competence & Training",
    icon: "ð·",
    desc: "Individual operative performance tracker covering attendance, quality of work, safety behaviour, productivity, and teamwork with supervisor rating scales and development action planning.",
    longDesc: `<p>The Site Operative Scorecard is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing site operative scorecard processes. Individual operative performance tracker covering attendance, quality of work, safety behaviour, productivity, and teamwork with supervisor rating scales and development action planning.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured site operative scorecard with comprehensive data capture fields",
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
    images: ["product-images/Site-Operative-Scorecard-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["daily", "planning"],
    price: "££12.99",
    oldPrice: "",
    badge: "Daily Operations",
    icon: "ð",
    desc: "Daily labour and plant allocation sheet with gang breakdowns, activity assignments, location mapping, planned vs actual tracking, and printable briefing formats for morning coordination meetings.",
    longDesc: `<p>The Allocation Sheet is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing allocation processes. Daily labour and plant allocation sheet with gang breakdowns, activity assignments, location mapping, planned vs actual tracking, and printable briefing formats for morning coordination meetings.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured allocation sheet with comprehensive data capture fields",
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
    images: ["product-images/Allocation-Sheet-Template-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["daily", "registers"],
    price: "££12.99",
    oldPrice: "",
    badge: "Daily Operations",
    icon: "ð",
    desc: "Annual leave and absence tracker for site teams with visual calendar heatmaps, entitlement calculations, approval workflows, bank holiday scheduling, and headcount forecasting.",
    longDesc: `<p>The Leave Calendar is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing leave processes. Annual leave and absence tracker for site teams with visual calendar heatmaps, entitlement calculations, approval workflows, bank holiday scheduling, and headcount forecasting.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured leave calendar with comprehensive data capture fields",
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
    images: ["product-images/Leave-Calendar-Template-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["temporary", "hse"],
    price: "££16.99",
    oldPrice: "",
    badge: "Temporary Works",
    icon: "ð§",
    desc: "BS 5975 classification matrix for temporary works items with risk-based categorisation, design check requirements, TWC approval levels, and inspection frequency determination.",
    longDesc: `<p>The Temporary Works Class Matrix is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing temporary works class processes. BS 5975 classification matrix for temporary works items with risk-based categorisation, design check requirements, TWC approval levels, and inspection frequency determination.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured temporary works class matrix with comprehensive data capture fields",
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
    images: ["product-images/Temporary-Works-Class-Matrix-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["hse", "daily"],
    price: "££9.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "ðª",
    desc: "Permit-to-use system for ladders and stepladders with pre-use inspection checklists, risk justification forms, duration limits, supervisor authorisation, and a live permit register.",
    longDesc: `<p>The Ladder & Stepladder Permit is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing ladder & stepladder permit processes. Permit-to-use system for ladders and stepladders with pre-use inspection checklists, risk justification forms, duration limits, supervisor authorisation, and a live permit register.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured ladder & stepladder permit with comprehensive data capture fields",
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
    images: ["product-images/Ladder-Stepladder-Permit-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["concrete", "registers", "planning"],
    price: "££17.99",
    oldPrice: "",
    badge: "Concrete & Materials",
    icon: "ðª¨",
    desc: "Material import register for tracking aggregate deliveries by type, source, volume, ticket reference, and stockpile location with running totals, supplier comparison, and wastage analysis.",
    longDesc: `<p>The Aggregate Import Tracker is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing aggregate import processes. Material import register for tracking aggregate deliveries by type, source, volume, ticket reference, and stockpile location with running totals, supplier comparison, and wastage analysis.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured aggregate import tracker with comprehensive data capture fields",
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
    images: ["product-images/Aggregate-Import-Tracker-excel-ebrora.jpg"],
    pdfLink: "#",
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
  {
    id: "aggregate-price-comparison",
    title: "Aggregate Price Comparison",
    category: ["cost", "concrete"],
    price: "££14.99",
    oldPrice: "",
    badge: "Cost & Carbon",
    icon: "ð°",
    desc: "Side-by-side cost comparison tool for aggregate suppliers with delivered price analysis, haulage cost modelling, quality scoring, carbon footprint comparison, and procurement recommendation output.",
    longDesc: `<p>The Aggregate Price Comparison is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing aggregate price comparison processes. Side-by-side cost comparison tool for aggregate suppliers with delivered price analysis, haulage cost modelling, quality scoring, carbon footprint comparison, and procurement recommendation output.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured aggregate price comparison with comprehensive data capture fields",
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
    images: ["product-images/Aggregate-Price-Comparison-excel-ebrora.jpg"],
    pdfLink: "#",
    buyLink: "https://ebrora.gumroad.com/l/aggregate-price-comparison",
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
  // 34. Civil Engineering Materials Converter
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "civil-engineering-materials-converter",
    title: "Civil Engineering Materials Converter",
    category: ["concrete", "cost"],
    price: "££12.99",
    oldPrice: "",
    badge: "Concrete & Materials",
    icon: "ðï¸",
    desc: "Unit conversion calculator for civil engineering materials covering tonnes to cubic metres, compaction factors, bulking percentages, moisture content adjustments, and density lookup tables.",
    longDesc: `<p>The Civil Engineering Materials Converter is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing civil engineering materials converter processes. Unit conversion calculator for civil engineering materials covering tonnes to cubic metres, compaction factors, bulking percentages, moisture content adjustments, and density lookup tables.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured civil engineering materials converter with comprehensive data capture fields",
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
    images: ["product-images/Civil-Engineering-Materials-Converter-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["environmental", "registers"],
    price: "££17.99",
    oldPrice: "",
    badge: "Environmental",
    icon: "ð±",
    desc: "Site waste management tracker logging all waste exports by type, EWC code, carrier, destination, weight, and waste transfer note reference with duty-of-care compliance dashboards and SWMP reporting.",
    longDesc: `<p>The Waste Export Tracker is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing waste export processes. Site waste management tracker logging all waste exports by type, EWC code, carrier, destination, weight, and waste transfer note reference with duty-of-care compliance dashboards and SWMP reporting.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured waste export tracker with comprehensive data capture fields",
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
    images: ["product-images/Waste-Export-Tracker-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["wastewater", "asset", "planning"],
    price: "££19.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð§",
    desc: "Procurement tracker for long-lead MEICA items on wastewater projects with order dates, lead times, expediting logs, delivery forecasts, critical path flagging, and supplier performance monitoring.",
    longDesc: `<p>The WWTW Long Lead Item Tracker is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing wwtw long lead item processes. Procurement tracker for long-lead MEICA items on wastewater projects with order dates, lead times, expediting logs, delivery forecasts, critical path flagging, and supplier performance monitoring.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured wwtw long lead item tracker with comprehensive data capture fields",
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
    images: ["product-images/Long-Lead-Item-Tracker-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["daily", "registers", "wastewater"],
    price: "££16.99",
    oldPrice: "",
    badge: "Daily Operations",
    icon: "ð",
    desc: "Daily pipe installation productivity tracker with metres-per-shift logging, gang size recording, ground condition notes, obstruction delays, and trend analysis dashboards for programme forecasting.",
    longDesc: `<p>The Pipe Laying Productivity Log is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing pipe laying productivity processes. Daily pipe installation productivity tracker with metres-per-shift logging, gang size recording, ground condition notes, obstruction delays, and trend analysis dashboards for programme forecasting.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured pipe laying productivity log with comprehensive data capture fields",
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
    images: ["product-images/Pipe-Laying-Productivity-Log-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["project", "cost", "planning"],
    price: "££18.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Construction productivity analysis tool with output-per-hour calculations, earned value tracking, planned vs actual comparisons, resource efficiency ratios, and visual performance dashboards.",
    longDesc: `<p>The Productivity Calculator is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing productivity processes. Construction productivity analysis tool with output-per-hour calculations, earned value tracking, planned vs actual comparisons, resource efficiency ratios, and visual performance dashboards.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured productivity calculator with comprehensive data capture fields",
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
    images: ["product-images/Construction-Productivity-Calculator-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["planning", "stakeholder"],
    price: "££14.99",
    oldPrice: "",
    badge: "Planning",
    icon: "ð",
    desc: "Structured meeting agenda and action tracker for short-term look-ahead planning sessions with constraint identification, commitment tracking, PPC measurement, and printable briefing packs.",
    longDesc: `<p>The Focused Planning Meeting Template is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing focused planning meeting processes. Structured meeting agenda and action tracker for short-term look-ahead planning sessions with constraint identification, commitment tracking, PPC measurement, and printable briefing packs.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured focused planning meeting template with comprehensive data capture fields",
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
    images: ["product-images/Planning-Meeting-Template-excel-ebrora.jpg"],
    pdfLink: "#",
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
  {
    id: "recovery-plan-tracker",
    title: "Recovery Plan Tracker",
    category: ["project", "planning"],
    price: "££19.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Programme recovery planning tool with delay analysis, acceleration options, resource levelling, milestone recovery tracking, and executive summary dashboards for reporting progress against recovery targets.",
    longDesc: `<p>The Recovery Plan Tracker is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing recovery plan processes. Programme recovery planning tool with delay analysis, acceleration options, resource levelling, milestone recovery tracking, and executive summary dashboards for reporting progress against recovery targets.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured recovery plan tracker with comprehensive data capture fields",
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
    images: ["product-images/Recovery-Plan-Tracker-excel-ebrora.jpg"],
    pdfLink: "#",
    buyLink: "https://ebrora.gumroad.com/l/recovery-plan-tracker",
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
  // 41. WWTW Valve Schedule
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "wwtw-valve-schedule",
    title: "WWTW Valve Schedule",
    category: ["wastewater", "asset", "registers"],
    price: "££18.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð§",
    desc: "Complete valve schedule for wastewater treatment works with tag numbers, types, sizes, actuator details, isolation references, maintenance history, and operational status tracking.",
    longDesc: `<p>The WWTW Valve Schedule is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing wwtw valve processes. Complete valve schedule for wastewater treatment works with tag numbers, types, sizes, actuator details, isolation references, maintenance history, and operational status tracking.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured wwtw valve schedule with comprehensive data capture fields",
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
    images: ["product-images/Valve-Schedule-Register-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["wastewater", "asset", "registers"],
    price: "££16.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð§",
    desc: "Automated sampler maintenance and calibration log for wastewater treatment works with sample point registers, calibration schedules, fault reporting, and Environment Agency compliance tracking.",
    longDesc: `<p>The WWTW Sampler Log is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing wwtw sampler processes. Automated sampler maintenance and calibration log for wastewater treatment works with sample point registers, calibration schedules, fault reporting, and Environment Agency compliance tracking.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured wwtw sampler log with comprehensive data capture fields",
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
    images: ["product-images/Wastewater-Sampler-Log-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["inspection", "registers", "commissioning"],
    price: "££17.99",
    oldPrice: "",
    badge: "Inspection",
    icon: "ð",
    desc: "Instrument calibration register tracking all field instruments with calibration dates, certificates, drift analysis, due-date alerts, and traceability to national standards for commissioning documentation.",
    longDesc: `<p>The Engineer's Instrument Calibration Log is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing engineer's instrument calibration processes. Instrument calibration register tracking all field instruments with calibration dates, certificates, drift analysis, due-date alerts, and traceability to national standards for commissioning documentation.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured engineer's instrument calibration log with comprehensive data capture fields",
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
    images: ["product-images/Instrument-Calibration-Log-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["wastewater", "daily", "registers"],
    price: "££12.99",
    oldPrice: "",
    badge: "Wastewater",
    icon: "ð",
    desc: "Structured meter reading log for flow meters, energy meters, and level instruments with scheduled reading reminders, trend charts, anomaly detection, and utility consumption analysis dashboards.",
    longDesc: `<p>The Meter Readings Log is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing meter readings processes. Structured meter reading log for flow meters, energy meters, and level instruments with scheduled reading reminders, trend charts, anomaly detection, and utility consumption analysis dashboards.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured meter readings log with comprehensive data capture fields",
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
    images: ["product-images/Meter-Readings-Log-excel-ebrora.jpg"],
    pdfLink: "#",
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
  {
    id: "testing-commissioning-log",
    title: "Testing & Commissioning Log",
    category: ["commissioning", "inspection", "registers"],
    price: "££24.99",
    oldPrice: "",
    badge: "Commissioning",
    icon: "£",
    desc: "Comprehensive test and commissioning log tracking every test activity from pre-commissioning through performance testing with results recording, witness management, and handover pack generation.",
    longDesc: `<p>The Testing & Commissioning Log is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing testing & commissioning processes. Comprehensive test and commissioning log tracking every test activity from pre-commissioning through performance testing with results recording, witness management, and handover pack generation.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured testing & commissioning log with comprehensive data capture fields",
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
    images: ["product-images/Testing-Commissioning-Log-excel-ebrora.jpg"],
    pdfLink: "#",
    buyLink: "https://ebrora.gumroad.com/l/testing-commissioning-log",
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
  // 46. NCR Schedule
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "ncr-schedule",
    title: "NCR Schedule",
    category: ["inspection", "registers"],
    price: "££17.99",
    oldPrice: "",
    badge: "Inspection",
    icon: "ð",
    desc: "Non-conformance report register with structured NCR numbering, root cause classification, corrective action tracking, close-out verification, and trend analysis dashboards for quality management reviews.",
    longDesc: `<p>The NCR Schedule is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing ncr processes. Non-conformance report register with structured NCR numbering, root cause classification, corrective action tracking, close-out verification, and trend analysis dashboards for quality management reviews.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured ncr schedule with comprehensive data capture fields",
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
    images: ["product-images/NCR-Non-Conformance-Schedule-excel-ebrora.jpg"],
    pdfLink: "#",
    buyLink: "https://ebrora.gumroad.com/l/ncr-schedule",
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
  // 47. Root Cause Analysis Template
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "root-cause-analysis",
    title: "Root Cause Analysis Template",
    category: ["inspection", "hse"],
    price: "££14.99",
    oldPrice: "",
    badge: "Inspection",
    icon: "ð",
    desc: "Structured root cause analysis template using 5-Why, fishbone diagram, and fault tree methodologies with guided workflows, contributing factor categorisation, and corrective action planning.",
    longDesc: `<p>The Root Cause Analysis Template is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing root cause analysis processes. Structured root cause analysis template using 5-Why, fishbone diagram, and fault tree methodologies with guided workflows, contributing factor categorisation, and corrective action planning.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured root cause analysis template with comprehensive data capture fields",
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
    images: ["product-images/Root-Cause-Analysis-Fishbone-excel-ebrora.jpg"],
    pdfLink: "#",
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
    category: ["project", "cost"],
    price: "££12.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Weighted decision matrix for evaluating options against multiple criteria with customisable weighting, automated scoring, sensitivity analysis, and visual comparison charts for stakeholder presentations.",
    longDesc: `<p>The Decision Matrix is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing decision processes. Weighted decision matrix for evaluating options against multiple criteria with customisable weighting, automated scoring, sensitivity analysis, and visual comparison charts for stakeholder presentations.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured decision matrix with comprehensive data capture fields",
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
    images: ["product-images/Decision-Matrix-Template-excel-ebrora.jpg"],
    pdfLink: "#",
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
  {
    id: "ram-matrix",
    title: "RAM Matrix",
    category: ["hse", "project"],
    price: "££14.99",
    oldPrice: "",
    badge: "HSE & Safety",
    icon: "£ ï¸",
    desc: "Responsibility Assignment Matrix (RACI) template for construction projects with role mapping, accountability tracking, gap analysis, and printable responsibility charts for project governance.",
    longDesc: `<p>The RAM Matrix is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing ram processes. Responsibility Assignment Matrix (RACI) template for construction projects with role mapping, accountability tracking, gap analysis, and printable responsibility charts for project governance.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured ram matrix with comprehensive data capture fields",
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
    images: ["product-images/Risk-Assessment-Matrix-RAM-excel-ebrora.jpg"],
    pdfLink: "#",
    buyLink: "https://ebrora.gumroad.com/l/ram-matrix",
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
  // 50. Lessons Learned Register
  // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
  {
    id: "lessons-learned-register",
    title: "Lessons Learned Register",
    category: ["project", "registers"],
    price: "££14.99",
    oldPrice: "",
    badge: "Project Management",
    icon: "ð",
    desc: "Project lessons learned register with structured capture forms, categorisation by phase and discipline, action tracking, knowledge sharing outputs, and searchable archive for organisational learning.",
    longDesc: `<p>The Lessons Learned Register is a professionally designed Excel template built specifically for construction and civil engineering teams who need structured, reliable tools for managing lessons learned processes. Project lessons learned register with structured capture forms, categorisation by phase and discipline, action tracking, knowledge sharing outputs, and searchable archive for organisational learning.</p><p>Built with practical site experience in mind, this template features automated calculations, conditional formatting for instant visual status indicators, and dropdown-driven data entry that ensures consistency across all users. Whether you are a site manager, engineer, or project coordinator, the intuitive layout means you can start using it immediately without extensive training or setup.</p><p>All outputs are formatted for professional presentation, suitable for client submissions, audit evidence packs, and project filing. The template includes built-in data validation, protected formulas, and a user guide sheet to help your team get the most from every feature. Designed for UK construction standards and best practices, it scales from single-site operations to multi-project programmes.</p>`,
    features: [
      "Structured lessons learned register with comprehensive data capture fields",
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
    images: ["product-images/Lessons-Learned-Register-excel-ebrora.jpg"],
    pdfLink: "#",
    buyLink: "https://ebrora.gumroad.com/l/lessons-learned-register",
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
    // OWL List
    // ££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££££
    {
        id: "owl-list",
        title: "OWL List",
        category: ["inspection", "registers", "hse"],
        price: "££19.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "Structured Observations, Wishes, and Learnings register for construction sites with category classification, action tracking, photo referencing, close-out verification, trend dashboards, and toolbox talk integration.",
        longDesc: `<p>The OWL List is a comprehensive Observations, Wishes, and Learnings register built for construction and civil engineering teams who need a structured, auditable system for capturing site observations, improvement suggestions, and lessons learned. Unlike simple snag lists, the OWL methodology encourages proactive reporting by giving every member of the site team £ from operatives to senior managers £ a framework to record not just deficiencies, but also positive practices worth replicating and ideas for improving workflows, safety, or quality. Each entry is classified by type (Observation, Wish, or Learning), severity, location, trade, and responsible party, creating a rich dataset that drives genuine continuous improvement rather than gathering dust in a filing cabinet.</p><p>Every OWL item follows a controlled lifecycle from initial capture through to close-out. When an observation is raised, the template assigns a unique reference number, records the reporter's details and the date, and requires a description, photographic evidence reference, and recommended action. The assigned action owner receives a clear target date, and the register tracks progress with conditional formatting that highlights items approaching or past their deadline in amber and red. Close-out requires a sign-off confirming that the corrective or improvement action has been completed, with space for verification notes and evidence references. This structured workflow ensures accountability and prevents items from being quietly forgotten.</p><p>The dashboard sheet transforms raw OWL data into actionable intelligence. Dynamic charts display observation trends by category, location, trade, and reporting period, enabling site leadership to identify hotspot areas, recurring themes, and the balance between observations, wishes, and learnings across the project. Repeat observation flagging automatically highlights issues that have been raised multiple times, signalling systemic problems that require escalation beyond a simple corrective fix. Printable summary reports are formatted for inclusion in HSE meeting packs, client progress reports, and toolbox talk briefings, making the OWL List a cornerstone of your project's proactive safety and quality culture.</p>`,
        features: [
            "Structured OWL register capturing observations, wishes, and learnings in one unified system",
            "Category classification with severity ratings for prioritised follow-up actions",
            "Action assignment with owner, target date, and formal close-out verification workflow",
            "Photo reference fields linking each observation to site evidence photography",
            "Dashboard with trend analysis by category, location, trade, and reporting period",
            "Toolbox talk integration with printable observation summaries for team briefings",
            "Repeat observation flagging to identify persistent site issues requiring escalation",
            "Multi-site support with location-based filtering and cross-project comparison",
            "Automated overdue action alerts with RAG-coded status highlighting",
            "Export functionality for client reporting, HSE meetings, and audit evidence packs"
        ],
        images: ["product-images/OWL-Register-Observation-Checklist-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["inspection", "registers", "planning"],
        price: "££19.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "Survey control point management register with coordinate and level recording, benchmark verification scheduling, condition monitoring, instrument cross-referencing, and automated check-due alerts.",
        longDesc: `<p>The Survey Control Register is a purpose-built Excel template for managing survey control infrastructure on construction and civil engineering projects. Accurate setting-out depends entirely on the integrity of your control network, yet on many projects control point records are scattered across surveyor's notebooks, loose spreadsheets, and drawing markups that are impossible to audit. This register centralises every control point £ primary stations, secondary stations, temporary benchmarks, and transferred levels £ into a single, structured record that captures grid coordinates (eastings and northings), reduced levels, establishment method, datum reference, and the drawing or survey report that defines each point.</p><p>Verification scheduling is built into the core of the template. Each control point has a defined check frequency based on its classification and the risk associated with its location £ points near active earthworks or heavy plant routes will naturally need more frequent verification than those on stable ground. The register tracks the date of last verification, the next verification due date, and the measured values at each check against the baseline coordinates and level. Any movement beyond the defined tolerance is flagged automatically with conditional formatting, alerting the survey team and site management to potential control point disturbance before inaccurate setting-out leads to costly rework.</p><p>The dashboard provides a project-wide view of your control network health, showing verification status across all points with RAG-coded indicators, overdue checks, and a history of any points that have been re-established or decommissioned. Instrument calibration cross-referencing links each survey activity to the total station or level used, with certificate numbers and calibration expiry dates recorded to satisfy ISO 9001 and client quality audit requirements. Printable control point schedules give site survey teams a concise field reference, while the full register provides the comprehensive audit trail that clients, third-party checkers, and quality managers expect on professionally managed projects.</p>`,
        features: [
            "Complete survey control point register with coordinates, levels, and grid references",
            "Benchmark verification schedule with check frequency and tolerance tracking",
            "Control point condition monitoring with damage and disturbance alert system",
            "Coordinate and level comparison for point verification against baseline values",
            "Site plan reference linking each control point to drawing numbers and revisions",
            "Instrument calibration cross-reference ensuring surveys use verified equipment",
            "Third-party survey check recording for independent verification audit trails",
            "Datum and projection metadata fields for full geodetic traceability",
            "Automated verification overdue alerts with colour-coded status dashboard",
            "Printable control point schedules for site survey teams and setting-out engineers"
        ],
        images: ["product-images/Survey-Control-Register-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["competence", "commissioning", "registers"],
        price: "££19.99",
        oldPrice: "",
        badge: "Commissioning",
        icon: "£",
        desc: "Client operator training management log for commissioning and handover with session scheduling, attendee tracking, competence assessment, sign-off capture, and AMP-compliant training evidence packs.",
        longDesc: `<p>The Process Client Training Log is a structured Excel template designed to manage the critical process of training client operational staff during the commissioning and handover phase of water, wastewater, and infrastructure projects. Delivering a new asset to a client is only successful if their team can operate and maintain it safely and efficiently, and demonstrating that comprehensive training has been delivered is a contractual requirement on virtually every AMP-period project. This log provides a complete framework for planning, scheduling, delivering, and evidencing every training session across the full scope of systems being handed over.</p><p>Each training session is recorded with the system or equipment covered, the training provider, session date and duration, location, the O&amp;M manual sections referenced, and the specific learning objectives addressed. The attendee register captures every participant's name, role, employer, and attendance confirmation, while the competence assessment section records whether each attendee demonstrated the required understanding through practical assessment, written test, or verbal confirmation. Where an attendee does not meet the competence standard, the template flags the requirement for reassessment and tracks the follow-up date, ensuring no gaps exist in the client's operational readiness at handover.</p><p>The dashboard provides a real-time view of training programme completion by system, discipline, and individual, making it immediately clear where sessions are outstanding and which personnel still require training. Client sign-off fields capture formal acknowledgement that training has been received and is satisfactory, providing the contractual evidence needed for handover certification. When the project reaches takeover, the template generates a complete training evidence pack £ session records, attendee lists, competence outcomes, and client sign-offs £ formatted to meet the documentation standards expected by UK water utility clients and their assurance teams.</p>`,
        features: [
            "Structured training schedule linking sessions to systems, equipment, and O&M manuals",
            "Attendee register with role, competence level, and attendance verification tracking",
            "Training material version control ensuring latest procedures are always delivered",
            "Competence assessment recording with pass/fail outcomes and reassessment scheduling",
            "Client sign-off capture for each training session with formal acknowledgement fields",
            "Integration with commissioning programme milestones for training sequencing",
            "Dashboard showing training completion rates by system, discipline, and individual",
            "Automated gap analysis identifying untrained personnel and outstanding requirements",
            "Handover-ready training evidence packs for AMP documentation submissions",
            "Printable session records and certificates for attendee personal development files"
        ],
        images: ["product-images/Process-Client-Training-Log-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["project", "planning", "daily"],
        price: "££19.99",
        oldPrice: "",
        badge: "Planning",
        icon: "ð",
        desc: "Visual calendar-based action tracker for construction projects with colour-coded categories, rolling action logs, recurring task scheduling, overdue escalation, and weekly look-ahead generation.",
        longDesc: `<p>The Action Calendar is a visual, calendar-driven action management tool built for construction site teams who need to track deadlines, recurring tasks, and follow-up actions across multiple workstreams without losing sight of what is due and when. Unlike linear action trackers that bury upcoming deadlines in long scrollable lists, this template presents your project actions on a clear monthly calendar layout with colour-coded category markers £ safety actions in red, quality actions in blue, commercial items in green, programme tasks in amber £ so supervisors, engineers, and managers can see at a glance what needs attention today, this week, and in the weeks ahead.</p><p>The rolling action log beneath the calendar captures every action with a unique reference, description, source (meeting, audit, inspection, incident), assigned owner, target date, and current status. Recurring tasks £ weekly inspections, monthly safety walks, fortnightly progress reports, quarterly audits £ are scheduled once and automatically populate future calendar periods, eliminating the risk of routine but critical activities being forgotten. The overdue escalation engine calculates days late for every open item and applies RAG formatting that intensifies as the delay grows, making it impossible for stale actions to hide in the system.</p><p>A weekly look-ahead generator extracts all actions due in the coming seven days and formats them into a printable briefing sheet, ideal for distributing at Monday morning coordination meetings or pinning to the site office noticeboard. Completion rate tracking feeds into trend charts that show how effectively the project team closes actions on time, providing evidence for management reviews and client progress reports. Whether you are managing a handful of actions on a small project or hundreds across a major infrastructure programme, the Action Calendar keeps every commitment visible, accountable, and on track.</p>`,
        features: [
            "Visual monthly calendar layout with colour-coded action categories and priorities",
            "Rolling action log with owner assignment, target dates, and completion tracking",
            "Recurring task scheduling for inspections, meetings, and routine site activities",
            "Multi-team view showing actions across disciplines for coordination planning",
            "Overdue action escalation with automated RAG status and days-late calculations",
            "Weekly look-ahead generator for printing and distributing at coordination meetings",
            "Action category classification covering safety, quality, commercial, and programme",
            "Link fields connecting actions to source documents, meetings, or audit findings",
            "Completion rate tracking with trend charts for management performance reporting",
            "Filterable views by owner, category, status, and date range for targeted reviews"
        ],
        images: ["product-images/Action-Calendar-Template-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["hse", "cost"],
        price: "££19.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "ð°",
        desc: "PPE procurement planning and cost tracking tool with headcount-driven quantity calculations, replacement frequency modelling, supplier price comparison, stock monitoring, and budget variance analysis.",
        longDesc: `<p>The PPE Budget Calculator is a practical Excel template that takes the guesswork out of PPE procurement planning and cost management on construction projects. Providing adequate personal protective equipment is a legal obligation, but without structured planning it is remarkably easy to either overspend through ad-hoc purchasing or run short of critical items at the worst possible moment. This calculator uses your project headcount, role profiles, and expected durations to compute the quantities of every PPE item required £ hard hats, safety boots, hi-vis vests, gloves, eye protection, hearing protection, respiratory equipment, and harnesses £ then prices them against your supplier quotes to produce a complete PPE budget forecast.</p><p>Replacement frequency modelling accounts for the reality that PPE wears out at different rates depending on the role and working environment. A groundworker's gloves might last two weeks while an office-based engineer's last six months, and the calculator lets you define wear rates by role and item type so that your budget reflects actual consumption rather than optimistic assumptions. Seasonal adjustment factors handle items with weather-dependent demand £ additional wet-weather gear in winter, sun protection in summer £ ensuring your forecast stays realistic across the full project duration. Supplier price comparison columns let you evaluate quotes from multiple vendors side by side, factoring in delivery charges and minimum order quantities to identify the most cost-effective procurement strategy.</p><p>Stock level monitoring tracks current inventory against minimum quantity thresholds and triggers reorder alerts before you run out, preventing the emergency purchases that inevitably cost more and disrupt site operations. The budget dashboard compares planned spend against actual expenditure by PPE category and by month, highlighting variances early so the commercial team can investigate and adjust. Cost-per-person analysis enables benchmarking across projects and contract periods, providing data-driven evidence for tender pricing and contract negotiations. Professional summary reports present PPE costs in a clear format suitable for commercial reviews, client recharges, and management reporting.</p>`,
        features: [
            "Headcount-driven PPE quantity calculator with role-specific requirement profiles",
            "Replacement frequency modelling based on wear rates and manufacturer guidance",
            "Budget allocation by PPE category with planned vs actual spend tracking",
            "Supplier price comparison for each PPE item with delivered cost analysis",
            "Seasonal adjustment factors for items with weather-dependent consumption rates",
            "Stock level monitoring with reorder point alerts and minimum quantity thresholds",
            "Cost-per-person analysis for benchmarking across projects and contract periods",
            "Waste reduction tracking comparing planned replacement cycles to actual usage",
            "Compliance checklist ensuring all PPE meets current EN and BS standard requirements",
            "Professional budget summary reports for commercial reviews and tender pricing"
        ],
        images: ["product-images/PPE-Budget-Calculator-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["cost", "daily", "registers"],
        price: "££14.99",
        oldPrice: "",
        badge: "Cost & Carbon",
        icon: "ð",
        desc: "Business mileage and travel expense tracker for construction professionals with HMRC-compliant mileage logging, route recording, fuel cost analysis, multi-vehicle support, and automated monthly claim generation.",
        longDesc: `<p>The Construction Mileage Tracker is a practical Excel template designed for construction professionals who regularly travel between sites, offices, depots, and suppliers and need an accurate, auditable record of their business mileage. Whether you are a site manager covering multiple projects, a senior foreman travelling between compound and works, or an engineer visiting suppliers and testing facilities, this tracker captures every journey with the detail that HMRC requires £ date, start location, destination, purpose of trip, odometer readings or calculated distance, and the applicable mileage rate. The template automatically applies the correct HMRC approved mileage allowance payment (AMAP) rates, including the reduced rate for journeys exceeding the 10,000-mile annual threshold, so your claims are always calculated correctly.</p><p>Multi-vehicle support lets you track mileage across different vehicles £ personal car, company van, pool car, or motorcycle £ each with its own rate structure. Route recording fields capture postcodes or site references for start and end points, and a journey purpose dropdown ensures consistency across entries while satisfying the "wholly and exclusively for business" test that HMRC applies to mileage claims. For teams that also claim fuel receipts rather than mileage rates, the fuel cost analysis module tracks litres purchased, price per litre, and cost per mile, giving the commercial team the data they need to reconcile fuel cards against actual usage and identify anomalies.</p><p>Automated monthly claim generation compiles all qualifying journeys into a formatted expense claim sheet ready for submission to your line manager or accounts department. Running totals show year-to-date mileage, total claim value, and distance by project or cost code, feeding into project cost reports and enabling accurate recharges to clients where travel is a recoverable expense. The annual summary dashboard provides a complete overview of travel patterns, total business mileage, claim values by month, and vehicle usage breakdown £ everything you need for end-of-year tax returns, P11D submissions, or internal audit reviews.</p>`,
        features: [
            "HMRC-compliant mileage logging with approved mileage allowance payment rate calculations",
            "Multi-vehicle support for cars, vans, motorcycles, and pool vehicles with separate rates",
            "Route recording with start and end location fields and journey purpose classification",
            "Automated monthly expense claim generation formatted for manager approval and submission",
            "Year-to-date running totals for mileage, claim value, and distance by cost code",
            "Fuel cost analysis module tracking litres, price per litre, and cost per mile",
            "Project and cost code allocation for accurate client recharges and cost reporting",
            "Annual summary dashboard with travel patterns and vehicle usage breakdown",
            "10,000-mile threshold tracking with automatic rate adjustment for excess mileage",
            "Printable claim sheets and annual summaries for tax returns and audit evidence"
        ],
        images: ["product-images/Construction-Mileage-Tracker-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["inspection", "hse", "planning"],
        price: "££14.99",
        oldPrice: "",
        badge: "Inspection",
        icon: "ð",
        desc: "Rolling weekly inspection schedule for construction sites with inspector assignment, area coverage mapping, inspection type rotation, completion tracking, gap identification, and printable weekly rotas.",
        longDesc: `<p>The Weekly Inspection Rota is an Excel-based scheduling tool that brings structure and accountability to site inspection programmes on construction and civil engineering projects. Effective inspection regimes require more than a list of what needs checking £ they demand a clear, published schedule showing who is inspecting what, where, and when, so that every area of the site receives appropriate attention and no critical inspections fall through the cracks. This template divides your site into defined inspection zones and assigns named inspectors to each zone on a rotating weekly basis, ensuring comprehensive coverage while distributing the inspection workload fairly across the supervisory team.</p><p>Inspection type rotation ensures that each zone receives the full range of inspection disciplines over a defined cycle period. Housekeeping, scaffolding, excavations, temporary works, lifting operations, electrical, environmental, and welfare inspections can all be scheduled on different frequencies £ daily, weekly, fortnightly, or monthly £ and the rota engine allocates them across the available inspection slots to maintain coverage without overloading any single week. Inspector qualifications and competence levels are tracked against inspection type requirements, so the template only assigns confined space inspections to qualified personnel, LOLER inspections to competent persons, and so on, preventing non-qualified staff from being scheduled for specialist inspections.</p><p>The completion tracking module records whether each scheduled inspection was carried out on time, late, or missed entirely, feeding into a compliance dashboard that shows inspection programme adherence as a percentage by zone, by inspector, and by inspection type. Gap identification logic highlights any areas or disciplines that are falling behind schedule, enabling the HSE team to intervene before gaps become audit findings. Printable weekly rotas in a clear, single-page format are designed for displaying on the site office noticeboard, distributing at Monday morning briefings, and including in weekly progress reports to the client.</p>`,
        features: [
            "Rolling weekly schedule with inspector assignment across defined site zones",
            "Inspection type rotation covering housekeeping, scaffolding, excavations, and more",
            "Inspector competence matching ensuring qualified personnel for specialist inspections",
            "Multi-frequency scheduling for daily, weekly, fortnightly, and monthly inspections",
            "Completion tracking with on-time, late, and missed status recording per inspection",
            "Compliance dashboard showing programme adherence by zone, inspector, and type",
            "Gap identification highlighting areas and disciplines falling behind schedule",
            "Printable single-page weekly rotas for site office display and team briefings",
            "Holiday and absence cover management with automatic reallocation of inspections",
            "Historical archive of completed rotas for audit trail and trend analysis"
        ],
        images: ["product-images/Weekly-Inspection-Rota-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["daily", "registers"],
        price: "££9.99",
        oldPrice: "",
        badge: "Wellness",
        icon: "ðï¸",
        desc: "Team weight loss challenge tracker with weekly weigh-in logging, percentage-based leaderboards, BMI calculations, progress charts, milestone celebrations, and printable league tables for site welfare boards.",
        longDesc: `<p>The Weight Loss Challenge Tracker is a fun, motivational Excel template designed to run team weight loss challenges on construction sites, in offices, or across any workplace team. Health and wellbeing initiatives are increasingly popular in the construction industry, and a structured weight loss challenge with visible leaderboards and friendly competition is one of the most effective ways to get site teams engaged with healthier habits. This tracker manages the entire challenge from registration through weekly weigh-ins to final results, with all the automation needed to keep the administration simple and the competition exciting.</p><p>Each participant registers with their starting weight, and the template calculates their BMI and sets a personalised healthy weight target range based on NHS guidelines. Weekly weigh-in logging captures each participant's weight at the designated weigh-in time, and the leaderboard ranks competitors by percentage of body weight lost rather than absolute kilograms £ ensuring a level playing field where lighter participants are not disadvantaged against heavier colleagues. Progress charts show each individual's weight trajectory over the challenge duration, and milestone celebrations automatically flag when participants hit key thresholds £ first 5% lost, 10% club, halfway to target £ keeping motivation high throughout the programme.</p><p>The printable league table is formatted for displaying on the site welfare board or canteen noticeboard, showing rankings, percentage lost, and weeks remaining without revealing actual weights to protect participant privacy. Team-based modes allow you to group participants into teams (by gang, trade, or department) with combined team scores adding a collaborative dimension to the competition. An admin dashboard tracks participation rates, average weight loss across the group, dropout rates, and weekly trends. Whether you are running a six-week sprint or a six-month marathon, this tracker keeps the challenge organised, fair, and genuinely enjoyable for everyone involved.</p>`,
        features: [
            "Participant registration with starting weight, BMI calculation, and target range",
            "Percentage-based leaderboard ensuring fair competition regardless of starting weight",
            "Weekly weigh-in logging with automated ranking updates and position change indicators",
            "Individual progress charts showing weight trajectory over the challenge duration",
            "Milestone celebration alerts for 5%, 10%, and halfway-to-target achievements",
            "Privacy-protected printable league tables showing rankings without actual weights",
            "Team-based competition mode with combined scores by gang, trade, or department",
            "Admin dashboard tracking participation rates, averages, and dropout monitoring",
            "BMI tracking with NHS healthy weight range reference for each participant",
            "Flexible challenge duration supporting any period from 4 weeks to 12 months"
        ],
        images: ["product-images/Weight-Loss-Challenge-Tracker-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["project", "competence", "planning"],
        price: "££14.99",
        oldPrice: "",
        badge: "Project Management",
        icon: "ð",
        desc: "RACI responsibility assignment matrix tailored for construction site supervisors with task-to-role mapping, accountability clarity, handover checklists, gap analysis, and printable responsibility charts.",
        longDesc: `<p>The Supervisor's RACI Chart is a purpose-built Excel template that maps out exactly who is Responsible, Accountable, Consulted, and Informed for every key task, decision, and deliverable within the construction site supervisory structure. On busy projects with multiple supervisors, foremen, engineers, and subcontractor leads operating across overlapping areas, unclear responsibilities are one of the most common root causes of dropped tasks, duplicated effort, and safety incidents. This template eliminates ambiguity by defining every critical supervisory activity £ from daily briefings and permit issuing to quality inspections, temporary works checks, and incident reporting £ and assigning a clear RACI designation to each role involved.</p><p>The task library is pre-populated with over 80 common construction supervisory activities organised by discipline: general site management, health and safety, quality, environmental, commercial, planning, and stakeholder management. Each activity has a suggested RACI mapping based on industry best practice, which you can customise to reflect your project's specific organisational structure and contract requirements. Gap analysis logic automatically identifies any tasks with no accountable person assigned, any roles with excessive accountability loading, and any tasks where more than one person is marked as accountable £ a classic RACI error that this template helps you catch and correct before it causes confusion on site.</p><p>The visual matrix presents the complete RACI chart in a clear, colour-coded grid format where R, A, C, and I assignments are instantly visible at the intersection of each task and role. Role summary sheets pull together all responsibilities for a specific individual, creating a personalised accountability profile that can be discussed during inductions, appraisals, or handover meetings. Handover checklists are auto-generated from the RACI data, listing every task that needs to transfer when a supervisor leaves site or hands over to a colleague, ensuring continuity of management during personnel changes. Printable responsibility charts in A3 and A1 formats are designed for displaying in the site office to reinforce clarity across the whole team.</p>`,
        features: [
            "RACI matrix with Responsible, Accountable, Consulted, and Informed designations",
            "Pre-populated library of 80+ construction supervisory tasks across all disciplines",
            "Gap analysis identifying tasks with no accountability or duplicate accountable roles",
            "Role summary sheets creating personalised accountability profiles for each supervisor",
            "Auto-generated handover checklists for personnel changes and shift transitions",
            "Colour-coded visual matrix for instant clarity on responsibility assignments",
            "Customisable task library to match project-specific organisational structures",
            "Workload balance analysis highlighting roles with excessive accountability loading",
            "Printable A3 and A1 responsibility charts for site office display",
            "Discipline filtering to view RACI assignments by safety, quality, commercial, or planning"
        ],
        images: ["product-images/Supervisors-RACI-Chart-excel-ebrora.jpg"],
        pdfLink: "#",
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
        category: ["hse", "registers", "inspection"],
        price: "££17.99",
        oldPrice: "",
        badge: "HSE & Safety",
        icon: "£ ï¸",
        desc: "Uncharted and unknown underground services register for excavation works with discovery logging, location recording, utility identification, notification tracking, safe-dig compliance, and photo evidence management.",
        longDesc: `<p>The Uncharted Services Log is a specialist Excel template for recording, managing, and reporting the discovery of uncharted, unmapped, or incorrectly located underground services encountered during excavation works on construction and civil engineering projects. Striking an unknown utility is one of the most dangerous events that can occur on a construction site £ gas mains, live electrical cables, fibre optic networks, and pressurised water pipes all pose serious risks to life, and the financial and programme consequences of a utility strike can be catastrophic. This log provides a structured system for documenting every encounter with an uncharted service so that the information is captured accurately, communicated promptly, and available for future reference.</p><p>Each discovery record captures the date and time of discovery, exact location (grid reference, chainage, or drawing markup reference), depth below ground level, service type (gas, electric, water, telecoms, drainage, unknown), approximate size and material, condition, and whether the service was live or abandoned. The notification tracking module records who was informed of the discovery £ site manager, client, utility owner, HSE advisor £ with timestamps and confirmation of receipt, ensuring that the duty to notify is discharged and evidenced. Safe-dig compliance fields confirm that appropriate safe digging practices were followed at the point of discovery, including hand-digging zones, CAT and Genny readings, and permit-to-dig references.</p><p>Photo evidence management links each discovery to numbered site photographs showing the exposed service, its position relative to the excavation, and any identification markings. A location plan cross-reference field connects each record to the relevant drawing revision so that as-built records can be updated with the newly discovered service routing. The dashboard provides a project-wide overview of all uncharted service discoveries, plotted by location zone and service type, enabling the project team to identify areas of the site where utility records are unreliable and additional precautions should be applied to future excavations. Printable discovery reports are formatted for submission to utility owners, the client, and regulatory bodies as required.</p>`,
        features: [
            "Structured discovery logging with date, time, location, depth, and service type fields",
            "Utility identification recording including size, material, condition, and live/abandoned status",
            "Notification tracking with timestamps confirming who was informed of each discovery",
            "Safe-dig compliance fields for CAT/Genny readings and permit-to-dig cross-referencing",
            "Photo evidence management linking numbered photographs to each service discovery record",
            "Location plan cross-referencing to update as-built drawings with discovered services",
            "Dashboard overview of all discoveries plotted by zone and service type across the project",
            "Risk zone identification highlighting areas where utility records are unreliable",
            "Printable discovery reports formatted for utility owners, clients, and regulators",
            "Historical archive enabling future projects to benefit from discovered service data"
        ],
        images: ["product-images/Uncharted-Services-Log-excel-ebrora.jpg"],
        pdfLink: "#",
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
