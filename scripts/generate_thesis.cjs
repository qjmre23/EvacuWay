/*
 * EvacuWay — project documentation (.docx) formatted to the CS 302 (Artiola) reference layout:
 * plain black fonts throughout, 3-level Table of Contents, a "Problem Definition" wrapper section,
 * and plain tables (black borders, white background, bold centered headers).
 * Requires `docx`. Run:  node scripts/generate_thesis.cjs  →  docs/EvacuWay_Project_Documentation.docx
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  TableOfContents, Header, Footer, PageNumber, PageBreak, VerticalAlign,
} = require(path.join(__dirname, "..", "node_modules", "docx"));

const BLACK = "000000";
const CONTENT_W = 9360; // US Letter, 1" margins
const FONT = "Arial";

// ---------- helpers ----------
const P = (text, o = {}) => new Paragraph({
  alignment: o.align || (o.justify === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED),
  spacing: { after: o.after ?? 160, line: 276, ...(o.spacing || {}) },
  pageBreakBefore: o.pageBreakBefore || false,
  children: (Array.isArray(text) ? text : [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size, color: BLACK })]),
});
const run = (t, o = {}) => new TextRun({ text: t, bold: o.bold, italics: o.italics, size: o.size, color: BLACK, subScript: o.sub, superScript: o.sup, font: o.font });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const bullet = (t, lvl = 0) => new Paragraph({
  numbering: { reference: "bullets", level: lvl }, spacing: { after: 90, line: 276 },
  alignment: AlignmentType.JUSTIFIED, children: Array.isArray(t) ? t : [new TextRun({ text: t, color: BLACK })],
});
let numRef = 0;
const numberedList = (items) => {
  const ref = "num" + (numRef++);
  return items.map((t) => new Paragraph({
    numbering: { reference: ref, level: 0 }, spacing: { after: 90, line: 276 },
    alignment: AlignmentType.JUSTIFIED, children: Array.isArray(t) ? t : [new TextRun({ text: t, color: BLACK })],
  }));
};
const caption = (t) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
  children: [new TextRun({ text: t, italics: true, size: 18, color: BLACK })],
});

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BLACK };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function tableCell(text, w, { head = false, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: head ? AlignmentType.CENTER : align, spacing: { after: 0, line: 264 },
      children: [new TextRun({ text: String(text), bold: head, color: BLACK, size: 20 })] })],
  });
}
function makeTable(headers, rows, widths, { align = [] } = {}) {
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => tableCell(h, widths[i], { head: true })) });
  const bodyRows = rows.map((r) => new TableRow({ children: r.map((c, i) => tableCell(c, widths[i], { align: align[i] || AlignmentType.LEFT })) }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}
function codeBlock(lines) {
  const cell = new TableCell({
    borders, width: { size: CONTENT_W, type: WidthType.DXA },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: lines.map((ln) => new Paragraph({ spacing: { after: 0, line: 252 },
      children: [new TextRun({ text: ln || " ", font: "Courier New", size: 18, color: BLACK })] })),
  });
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W], rows: [new TableRow({ children: [cell] })] });
}
const eq = (children) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 160 }, children });

// ---------- numbering ----------
const numbering = { config: [
  { reference: "bullets", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 620, hanging: 300 } } } },
    { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1160, hanging: 300 } } } },
  ] },
  ...Array.from({ length: 24 }, (_, i) => ({ reference: "num" + i, levels: [
    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 620, hanging: 300 } } } } ] })),
] };

const titleLine = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 120 },
  children: [new TextRun({ text: t, bold: o.bold, italics: o.italics, size: o.size || 24, color: BLACK, allCaps: o.caps })] });

// =====================================================================
const body = [];

// ---- Title page (reference layout) ----
body.push(
  new Paragraph({ spacing: { before: 800, after: 0 }, children: [] }),
  titleLine("TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES", { bold: true, size: 26 }),
  titleLine("Quezon City", { size: 24, after: 600 }),
  titleLine("EvacuWay: Comparative Simulation of Evacuation Strategy Effectiveness Under Typhoon and Flood Emergency Conditions in Metro Manila", { bold: true, size: 28, after: 600 }),
  titleLine("Submitted in partial fulfillment of the requirements for", { size: 24, after: 60 }),
  titleLine("CS 302 - Modeling and Simulation", { size: 24, after: 600 }),
  titleLine("Submitted by:", { size: 24, after: 60 }),
  titleLine("Lorenzo, Zrehm Francis V.", { bold: true, size: 24, after: 480 }),
  titleLine("Submitted to:", { size: 24, after: 60 }),
  titleLine("Dr. Karren V. De Lara", { bold: true, size: 24, after: 600 }),
  titleLine("June 2026", { size: 24 }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- TOC ----
body.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", bold: true, size: 28, color: BLACK })] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
);

// =====================================================================
//  Introduction
// =====================================================================
body.push(H1("Introduction"));
body.push(P("The Philippines lies along the western rim of the Pacific typhoon belt and is struck by an average of roughly twenty tropical cyclones each year, many of which deliver catastrophic flooding to the densely populated National Capital Region (NCR). With approximately fourteen million residents across seventeen local government units (LGUs), Metro Manila must repeatedly move large populations to safety along a road network that is itself failing as flood water rises. Tropical Storm Ondoy (Ketsana, 2009), Typhoon Ulysses (Vamco, 2020), and Super Typhoon Rolly (Goni, 2020) each demonstrated, at enormous human cost, that evacuation in the NCR is a high-stakes, time-critical operation rather than a routine logistical task."));
body.push(P("This project, EvacuWay, treats evacuation routing as a complex sociotechnical problem rather than a simple shortest-path exercise. It couples a large irregular road network, hundreds of origin communities with widely varying populations and flood exposures, a finite set of evacuation centers with limited shelter capacity, and a hazard — flood water — that progressively removes and degrades the very roads on which evacuation depends. The best route at the onset of an event is frequently impassable an hour later."));
body.push(P("Because the system is large, hazard-driven, and partly stochastic, it cannot be studied through controlled real-world experiment: one cannot repeatedly flood Metro Manila to compare evacuation plans. Simulation is therefore the appropriate scientific method. A simulation represents the road network and flood hazard explicitly, re-runs the same scenario under different routing policies, and measures outcomes — clearance time, completion, equity, and survival — under identical, reproducible conditions."));
body.push(P("EvacuWay compares three routing strategies — Strategy A (Dijkstra shortest-path, decentralised), Strategy B (Frank-Wolfe capacity-aware, centralised), and Strategy C (zone-sequential priority, phased) — across three flood-severity levels, over thirty random seeds, for 270 fully reproducible runs. It reports six key performance indicators, including an Equity Index (the Gini coefficient of clearance times). This is an evacuation-routing simulation study; it contains no machine-learning, natural-language, or text-classification component of any kind."));

// =====================================================================
//  Background and Literature Review
// =====================================================================
body.push(H1("Background and Literature Review"));
body.push(H2("Background of the Study"));
body.push(P("Effective disaster response in dense urban areas requires a balance between infrastructure capacity and human behaviour. Traditional evacuation planning has relied on macroscopic traffic-assignment models, which optimise overall network flow but overlook individual behavioural nuance. Agent-Based Models (ABMs), by contrast, capture decentralised decision-making and emergent congestion but can lack rigorous, capacity-aware routing optimisation. Compounding these modelling challenges is the volatile nature of flooding, where progressive road degradation continuously alters network topology and restricts vehicle movement."));
body.push(P("In disaster-prone regions such as the Philippines, evacuation frameworks frequently employ zone-sequential and phased protocols to manage high-density populations during severe weather. Executing such staggered departures becomes highly complex when flood water actively compromises the road network. Uncoordinated shortest-path navigation often produces severe corridor crowding, sharply increasing clearance times and stranding vulnerable populations in high-risk zones."));
body.push(H2("Review of Related Literature (RRL)"));
body.push(P("While the literature commonly evaluates a single routing strategy or evacuation protocol in isolation, a critical gap remains in understanding how localised disaster policy, real-time road degradation, and dynamic routing strategies interact. Studies of macroscopic traffic assignment establish capacity-aware equilibrium routing (the Frank-Wolfe algorithm and the Bureau of Public Roads cost function), while agent-based and discrete-event approaches capture emergent congestion; few works combine the two under an actively failing network."));
body.push(P("Furthermore, conventional evacuation metrics favour total throughput and frequently leave the socioeconomic fairness of clearance times unaddressed. To bridge these gaps, this study implements a fully-crossed factorial design that evaluates multiple routing strategies against a stochastic road-degradation model, and introduces an Equity Index quantified via the Gini coefficient as a formal Key Performance Indicator (KPI) to evaluate the distribution of clearance times across zones. This positions EvacuWay as a comparative, equity-aware framework rather than a single-strategy optimisation."));

// =====================================================================
//  Problem Definition
// =====================================================================
body.push(H1("Problem Definition"));
body.push(H2("Statement of the Problem"));
body.push(P("During a typhoon or flood emergency in Metro Manila, the choice of evacuation routing strategy materially affects how quickly and how fairly residents reach safety — yet the road network itself fails progressively as flooding worsens, so a strategy that performs well at the onset may collapse later. The central problem this study addresses is therefore:"));
body.push(P([run("Among three evacuation routing approaches — shortest-distance individual routing, capacity-aware centralised distribution, and zone-based sequencing — which delivers the most effective and equitable large-scale urban evacuation during a typhoon or flood emergency, and in what ways do real-time road-network failures (submerged roads, closed bridges) affect the comparative outcomes?", { italics: true })]));
body.push(H2("Objectives of the Study"));
body.push(P([run("General objective. ", { bold: true }), run("To develop a reproducible simulation that comparatively evaluates three evacuation-routing strategies across Metro Manila under progressively severe flooding, and to translate the results into actionable routing guidance for Philippine LGUs.")]));
body.push(P("Specifically, the study aims to:"));
body.push(...numberedList([
  "Construct a representative Metro Manila road-network model integrating realistic population distribution and flood-vulnerability characteristics at the road-segment level, seeded and validated by the Marikina prototype sub-network.",
  "Develop and simulate three evacuation routing strategies: shortest-path routing (Strategy A), capacity-aware load distribution (Strategy B), and zone-sequential priority routing (Strategy C).",
  "Simulate progressive road-network degradation under three escalating flood-severity levels — mild, moderate, and severe — using a probabilistic Bernoulli edge-failure engine.",
  "Run 270 fully reproducible simulation experiments (3 strategies x 3 flood levels x 30 seed-replicated runs) to ensure statistical stability.",
  "Measure six KPIs — TET, AET, ECR, NUI, EI, and SCP — and compare them using one-way ANOVA with post-hoc Tukey HSD tests.",
  "Translate the quantitative findings into actionable policy guidance for Philippine LGUs and the NDRRMC.",
]));
body.push(H2("Scope and Delimitation"));
body.push(H3("Scope"));
body.push(...[
  "The study area is the whole of Metro Manila (NCR), comprising all seventeen LGUs, modelled using open datasets (OpenStreetMap, NAMRIA, PAGASA, PSA, and DSWD/DepEd).",
  "It employs an independent Bernoulli-trial framework for road-network degradation, using localised flood-susceptibility scores (fe) derived from flood-risk level and depth to simulate real-time road closures, together with a slowdown on surviving flooded roads.",
  "It implements and compares three distinct routing strategies: Strategy A (Dijkstra shortest-path), Strategy B (Frank-Wolfe capacity-aware), and Strategy C (zone-sequential priority).",
  "It integrates a fully-crossed 3 x 3 factorial design (3 routing strategies x 3 flood-severity levels) with 30 independently seeded replications per cell, totalling 270 randomized runs.",
  "Outputs include a performance ledger across six KPIs (TET, AET, ECR, NUI, EI via the Gini coefficient, and SCP), dynamic routing-flow maps, and cross-strategy statistical validation via one-way ANOVA with post-hoc Tukey HSD.",
].map((t) => bullet(t)));
body.push(H3("Delimitation"));
body.push(...[
  "The study is delimited to the Metro Manila (NCR) network boundary, excluding adjacent provinces and inter-regional transport links.",
  "Evacuation destinations are DSWD/DepEd-registered evacuation centers across Metro Manila, seeded by the evacuation_center field of the flood dataset. The set of Marikina schools and covered courts used during testing is the Marikina sample for prototype validation only; full deployment covers Metro-Manila-wide registered centers.",
  "Transportation is limited to homogeneous private-vehicle agents travelling at 20-60 km/hr, excluding public buses, rescue boats, and pedestrian movement.",
  "Agent behaviour assumes 100% compliance with the assigned routing strategy, excluding non-compliance, panic behaviour, and delayed-departure inertia.",
  "Flooding is modelled as probabilistic Bernoulli edge failure plus a flood slowdown — a network-degradation abstraction, not a hydrodynamic fluid-propagation model.",
  "The 1,250-node Marikina dataset is a prototype seed sub-network for pipeline validation only; full runs use the OSMnx-extracted Metro Manila drive graph.",
].map((t) => bullet(t)));
body.push(P([run("Data-coverage note. ", { bold: true }), run("The flood dataset covers 12 of the 17 NCR LGUs; five (Makati, Mandaluyong, Pasay, Pateros, San Juan) have zero records. This gap is mitigated with OSMnx network data and NDRRMC public records, interpolating flood susceptibility from adjacent cities where necessary.")]));
body.push(H2("Assumptions and Limitations"));
body.push(H3("Assumptions"));
body.push(...[
  "The geographic and demographic source layers (OpenStreetMap, NAMRIA, PSA, DSWD) accurately represent the physical and population constraints of the study area.",
  "A topological graph of nodes and edges captures macro-level corridor routing without explicit sub-lane tracking or signal-timing logic.",
  "Historical flood-response patterns and dynamic traffic-assignment paradigms are informative enough to predict network clearance times, bottlenecks, and survival rates.",
  "The independent Bernoulli-trial closure model provides valid probabilistic signals for topology change without requiring a coupled hydrodynamic engine.",
  "Typhoon alert level maps to the severity multiplier (Signal 1 ~ 0.33, Signal 2 ~ 0.66, Signal 4 ~ 1.0); flood-risk level maps to fe (Very High 0.85, High 0.60, Moderate 0.35, Low 0.10).",
].map((t) => bullet(t)));
body.push(H3("Limitations"));
body.push(...[
  "The model is restricted to macro-level traffic assignment and cannot represent microscopic anomalies such as individual accidents, stalls, lane-changing friction, or fuel limits.",
  "The hydrology layer uses static probabilistic edge failure based on flood susceptibility; it does not compute dynamic flood-wave propagation or temporal depth changes.",
  "The behavioural rule-set excludes non-compliance, panic detours, and household-level destination changes.",
  "Transportation is limited to private vehicles, excluding multi-modal options (buses, boats, pedestrian corridors).",
  "Outputs are a high-level comparative policy tool, not a micro-level predictor of specific household movements.",
].map((t) => bullet(t)));
body.push(H2("Significance of the Study"));
body.push(...[
  ["Local Government Units and disaster-risk-reduction managers: ", "an operational, transparent, and reproducible routing-evaluation tool that justifies shifting strategy as road degradation crosses thresholds, rather than committing to one static protocol."],
  ["The public and urban communities: ", "capacity-aware routing reduces corridor bottlenecks, and an explicit Equity Index demonstrates fairness across demographic zones, preserving public trust in managed evacuation."],
  ["The field of modeling and simulation: ", "a concrete worked example of testing routing algorithms under uncertainty using stochastic edge-failure sweeping, capacitated assignment, and seed-replicated baseline testing."],
  ["Data scientists and future researchers: ", "a reproducible framework that exposes the lack of simultaneous evaluation against progressive road failure and can be extended to other urban disaster-simulation tasks."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));

// =====================================================================
//  Dataset Description
// =====================================================================
body.push(H1("Dataset Description"));
body.push(P("EvacuWay uses two evacuation-simulation datasets. Neither is a classification dataset; the project has no fake-news, political-statement, or natural-language content. The primary variables used in the simulation are documented below, including their type, units, and observed range."));
body.push(P([run("Table 1. ", { bold: true }), run("Variable documentation for metro_manila_flood_dataset.csv (selected; 27 columns total, 2,200 records, 2000-2024).")]));
body.push(makeTable(
  ["Variable", "Type", "Units", "Description", "Range / Values"],
  [
    ["record_id", "Integer", "n/a", "Unique record identifier", "1 - 2200"],
    ["incident_date", "String (date)", "n/a", "Date of the flood incident", "2000-01-01 to 2024-12-31"],
    ["city_municipality", "String", "n/a", "NCR city of the record", "12 cities (Malabon, Marikina, ...)"],
    ["flood_risk_level", "String", "n/a", "Categorical flood-risk class", "Very High / High / Moderate / Low"],
    ["flood_depth_meters", "Float", "m", "Peak flood depth", "0.06 - 4.49"],
    ["typhoon_alert_level", "String", "n/a", "PAGASA public storm signal", "None / Signal No. 1-4"],
    ["affected_population", "Integer", "persons", "People affected", "200 - 7,999"],
    ["evacuees", "Integer", "persons", "Evacuees recorded", "4 - 3,540"],
    ["evacuation_center", "String", "n/a", "Named evacuation facility", "55 unique facilities"],
    ["response_time_hours", "Float", "hours", "Hours until response (benchmark)", "0.5 - 24.0"],
  ],
  [1900, 1500, 980, 2700, 2280],
));
body.push(P([run("Table 2. ", { bold: true }), run("Variable documentation for Evacuation_Marikina_Dataset.xlsx (1,250 nodes; prototype seed sub-network).")]));
body.push(makeTable(
  ["Variable", "Type", "Units", "Description", "Range / Values"],
  [
    ["Node ID", "String", "n/a", "Unique node code", "N001 - N1250"],
    ["Node Type", "String", "n/a", "Functional node class", "Intersection / Origin Zone / Evac. Center"],
    ["Barangay Name", "String", "n/a", "Barangay or facility name", "Nangka, Tumana, Marikina Heights, ..."],
    ["Population Count", "Integer", "persons", "Residents at an Origin Zone", "0 - ~3,000"],
    ["Centroid Latitude", "Float", "degrees", "WGS84 latitude", "14.52 - 14.68 N"],
    ["Centroid Longitude", "Float", "degrees", "WGS84 longitude", "120.97 - 121.13 E"],
    ["Is Evacuation Center", "String", "n/a", "Evacuation-center flag", "Yes / No"],
    ["Elevation (m asl)", "Float", "m", "Ground elevation", "varies"],
    ["Notes", "String", "n/a", "Risk annotation", "Low / Moderate / High risk"],
  ],
  [1900, 1300, 1080, 2700, 2380],
));
body.push(P([run("Table 3. ", { bold: true }), run("How dataset fields drive the simulation.")]));
body.push(makeTable(
  ["Dataset field", "Drives", "Mapping"],
  [
    ["flood_risk_level + flood_depth_meters", "fe (edge susceptibility)", "Very High 0.85 / High 0.60 / Moderate 0.35 / Low 0.10"],
    ["typhoon_alert_level", "Severity multiplier", "Signal 1 -> 0.33 / 2 -> 0.66 / 4 -> 1.0"],
    ["affected_population + evacuees", "Agent count per Origin Zone", "capped at 500 per zone"],
    ["evacuation_center", "Destination candidates", "snapped to graph nodes"],
    ["latitude + longitude", "Node matching", "OSMnx origin/center snapping"],
    ["response_time_hours", "TET / AET benchmark", "validation only"],
  ],
  [3400, 2600, 3360],
));
body.push(H2("Source of Dataset"));
body.push(P("The flood-incident records are drawn from Philippine disaster-management agencies — the Department of Social Welfare and Development (DSWD), the Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA), and the National Disaster Risk Reduction and Management Council (NDRRMC) — and are stored in metro_manila_flood_dataset.csv (2,200 records, 27 columns, 12 NCR cities, 2000-2024). The road-network seed is Evacuation_Marikina_Dataset.xlsx, a 1,250-node Marikina prototype sub-network (740 Intersections, 381 Origin Zones, 129 Evacuation Centers). The flood dataset covers 12 of the 17 NCR LGUs; the five without records (Makati, Mandaluyong, Pasay, Pateros, San Juan) are supplemented with OSMnx network data and NDRRMC public records, interpolating flood susceptibility from adjacent cities where necessary."));
body.push(H2("Data Preprocessing and Cleaning"));
body.push(P("Preprocessing was executed in Python (pandas). The pipeline loads and inspects the datasets, validates records, derives per-node flood risk, builds the routing graph, and exports node and edge tables for the simulation engine."));
body.push(...numberedList([
  "Loading and inspection. The flood CSV (2,200 rows) and the Marikina nodes (1,250 rows) are loaded; rows missing critical identifiers are dropped, and optional metadata (elevation, notes) is filled with defaults.",
  "Risk derivation. Each node's flood-risk level is parsed (from the Notes annotation or the flood-risk field) and mapped to a susceptibility score fe; edge fe is the mean of its two endpoints.",
  "Graph construction. Nodes are connected to their k = 4 nearest neighbours (great-circle distance) to form a road-adjacency proximity graph; each edge receives length, free-flow travel time, road-class capacity, and fe. Connectivity is guaranteed by bridging isolated components.",
  "Spatial validation. Coordinates are validated against the Metro Manila bounding box (14.35-14.78 N, 120.90-121.20 E); outliers are removed.",
  "Road-network artifact. For on-street route geometry, a compiled OSM drive network (data/marikina_road_network.json) is produced via OSMnx/Overpass and used to snap each route onto real roads.",
  "Export. Cleaned node and edge tables are exported for the simulation engine and the dashboard.",
]));

// =====================================================================
//  Modeling Approach
// =====================================================================
body.push(H1("Modeling Approach"));
body.push(P("EvacuWay uses a hybrid architecture combining macroscopic graph-theoretic routing (NetworkX) with capacitated, policy-driven assignment. The three strategies share a common Bernoulli flood-disruption engine and are scored on the same six KPIs."));
body.push(P([run("Table 4. ", { bold: true }), run("Methods and their roles in the simulation.")]));
body.push(makeTable(
  ["Method / Component", "Role in the simulation"],
  [
    ["Strategy A - Dijkstra", "Decentralised shortest-path: each origin routes independently to its nearest available evacuation center; congestion and flooding are experienced on the chosen path but not routed around."],
    ["Strategy B - Frank-Wolfe", "Centralised capacity-aware assignment (Method of Successive Averages) on the congested BPR cost, balancing load across parallel corridors."],
    ["Strategy C - Zone-Sequential", "Phased departures ordered by flood risk (Very High to Low); a wave starts only after the previous wave clears 80%. Each wave experiences only its own congestion."],
    ["Bernoulli disruption engine", "Evaluates every flood-susceptible edge each run, removing it with probability fe x severity, and slowing surviving flooded roads."],
    ["Capacitated shelters", "Each center has finite capacity; when nearby centers fill, demand spills to farther centers - the mechanism that differentiates the strategies."],
    ["Road snapping + live rainfall", "Routes are snapped onto real OSM streets; a best-effort PAGASA rainfall layer enriches the dashboard and (optionally) fe."],
  ],
  [2700, 6660],
));
body.push(H2("Governing Equations"));
body.push(P("Edge costs use the Bureau of Public Roads (BPR) congestion function, where t-zero is free-flow time, x the edge volume, and C the capacity:"));
body.push(eq([run("t"), run("e", { sub: true }), run("(x"), run("e", { sub: true }), run(") = t"), run("e0", { sub: true }), run(" × [ 1 + 0.15 × (x"), run("e", { sub: true }), run(" / C"), run("e", { sub: true }), run(")"), run("4", { sup: true }), run(" ]")]));
body.push(P("Progressive degradation replaces deterministic availability with an independent Bernoulli trial; an edge closes when a uniform draw falls below its closure probability:"));
body.push(eq([run("P(X"), run("e", { sub: true }), run(" = 0) = f"), run("e", { sub: true }), run(" × λ"), run("F", { sub: true })]));
body.push(P("Surviving flooded roads are slowed (partial inundation): the effective free-flow time scales with susceptibility and severity:"));
body.push(eq([run("t′"), run("e", { sub: true }), run(" = t"), run("e", { sub: true }), run(" × ( 1 + β · f"), run("e", { sub: true }), run(" · λ"), run("F", { sub: true }), run(" )")]));
body.push(P("Equity is scored with the Gini coefficient of individual clearance times T, where 0 denotes perfectly equal clearance:"));
body.push(eq([run("G = ( Σ"), run("i", { sub: true }), run(" Σ"), run("j", { sub: true }), run(" | T"), run("i", { sub: true }), run(" − T"), run("j", { sub: true }), run(" | ) / ( 2 n"), run("2", { sup: true }), run(" · T̄ )")]));

// =====================================================================
//  Implementation Details
// =====================================================================
body.push(H1("Implementation Details"));
body.push(P("The system is built entirely with open-source tools and requires no login or API keys."));
body.push(H2("Languages, Libraries, and Tools"));
body.push(...[
  ["Python 3.11+ with FastAPI: ", "the backend and REST API."],
  ["NetworkX: ", "graph data structures and routing algorithms (Dijkstra, multi-source shortest paths)."],
  ["NumPy, pandas, SciPy, statsmodels: ", "KPI computation and statistics (one-way ANOVA, Tukey HSD)."],
  ["OSMnx / GeoPandas (optional): ", "extraction of the full Metro Manila drive network from OpenStreetMap."],
  ["React 18 + TypeScript + Vite, Leaflet, Recharts: ", "the interactive dashboard (map, controls, KPI charts)."],
  ["Node.js scripts + Netlify (Mangum): ", "road-network compilation, route snapping, and serverless deployment of the FastAPI app."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));
body.push(H2("Code Structure"));
body.push(...[
  ["data_loader.py: ", "loads the datasets and builds/caches the routing graph."],
  ["simulation.py: ", "the three strategies, the Bernoulli engine, capacitated assignment, and the six-KPI computation."],
  ["analysis.py: ", "the 270-run batch, JSON persistence, and ANOVA + Tukey HSD."],
  ["routes.py / main.py: ", "the FastAPI endpoints (/health, /api/meta, /api/simulate, /api/summary, /api/centers, /api/origins, /api/flood-points, /api/rainfall)."],
  ["frontend/: ", "the React dashboard (MapView, ScenarioPanel, KpiCards, ResultsPanel, Legend)."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));
body.push(H2("Key Code"));
body.push(P("The heart of the disruption engine is the stochastic road-closure routine. Every flood-susceptible edge is evaluated against an independent Bernoulli trial, so closures are probabilistically realistic rather than hardcoded:"));
body.push(codeBlock([
  "def apply_flood_closures(G, flood_level, rng):",
  "    lambda_F = {'mild': 0.33, 'moderate': 0.66, 'severe': 1.0}[flood_level]",
  "    for u, v, data in list(G.edges(data=True)):",
  "        fe = data.get('flood_susceptibility', 0.0)",
  "        if rng.random() < fe * lambda_F:        # Bernoulli closure",
  "            G.remove_edge(u, v)                 # force affected agents to reroute",
  "    return G",
]));
body.push(P("", { after: 60 }));

// =====================================================================
//  Experimentation and Simulation
// =====================================================================
body.push(H1("Experimentation and Simulation"));
body.push(P("The study uses a fully-crossed 3 x 3 factorial design with 30 replications per cell, yielding 270 reproducible runs. Fixed seeds (42-71) guarantee identical results on re-execution. The corrected parameter configuration is summarised below."));
body.push(P([run("Table 5. ", { bold: true }), run("Simulation parameter configuration (the earlier 150-500 node figure is superseded).")]));
body.push(makeTable(
  ["Parameter", "Setting"],
  [
    ["Simulation framework", "NetworkX graph routing + capacitated assignment"],
    ["Prototype seed nodes / edges", "1,250 nodes / ~3,064 edges (Marikina seed)"],
    ["Full Metro Manila graph (OSMnx)", "~80,000-150,000 nodes / ~200,000-400,000 edges"],
    ["Thesis simulation sample", "~5,000-15,000 nodes (stratified)"],
    ["Origin zones / evacuation centers (prototype)", "381 / 129"],
    ["Road capacity (Ce)", "residential 400 - trunk 2,500 veh/hr"],
    ["Agent driving speed", "20-60 km/hr (nominal 40)"],
    ["Flood severity levels", "Mild 0.33 / Moderate 0.66 / Severe 1.0"],
    ["Routing strategies", "A (Dijkstra), B (Frank-Wolfe), C (Zone-Sequential)"],
    ["Replications / total runs", "30 fixed seeds (42-71) / 270 runs"],
    ["Statistics", "one-way ANOVA + post-hoc Tukey HSD (alpha = 0.05)"],
  ],
  [4200, 5160],
));

// =====================================================================
//  Results and Analysis
// =====================================================================
body.push(H1("Results and Analysis"));
body.push(P([run("The values below are real output from the executed experiment ", { bold: true }), run("(270 runs, seeds 42-71), produced by scripts/run_experiment.py and reproducible exactly.")]));
body.push(P([run("Table 6. ", { bold: true }), run("Mean KPI values by strategy and flood level (n = 30 per cell). TET/AET in minutes; ECR/SCP in %; EI is the Gini coefficient.")]));
body.push(makeTable(
  ["Strategy", "Flood", "TET", "AET", "ECR", "NUI", "EI", "SCP"],
  [
    ["A (Dijkstra)", "Mild", "245.6", "30.7", "98.4", "2.05", "0.505", "99.3"],
    ["A (Dijkstra)", "Moderate", "318.2", "35.7", "95.0", "2.07", "0.555", "97.0"],
    ["A (Dijkstra)", "Severe", "418.7", "42.7", "91.4", "2.18", "0.602", "92.9"],
    ["B (Frank-Wolfe)", "Mild", "157.0", "25.0", "96.5", "1.12", "0.423", "98.4"],
    ["B (Frank-Wolfe)", "Moderate", "246.9", "30.9", "93.7", "1.22", "0.514", "96.2"],
    ["B (Frank-Wolfe)", "Severe", "363.7", "39.0", "90.9", "1.35", "0.587", "92.6"],
    ["C (Zone-Seq.)", "Mild", "263.9", "45.7", "98.3", "2.04", "0.405", "99.2"],
    ["C (Zone-Seq.)", "Moderate", "347.8", "50.9", "94.2", "2.07", "0.448", "96.5"],
    ["C (Zone-Seq.)", "Severe", "435.5", "57.2", "90.8", "2.15", "0.487", "92.5"],
  ],
  [1860, 1300, 980, 980, 980, 920, 760, 1580],
  { align: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] },
));
body.push(P("Key findings:"));
body.push(...numberedList([
  "Strategy B (Frank-Wolfe) is the fastest in every cell. Its load balancing keeps network utilisation roughly 40-45% below A and C and cuts total evacuation time by up to 36% versus A under mild flooding.",
  "Strategy C (Zone-Sequential) is the most equitable in every cell - lowest Gini at every severity (0.405 / 0.448 / 0.487 versus A's 0.505 / 0.555 / 0.602) - at the cost of the highest average time, a clear speed-versus-equity trade-off.",
  "Strategy A (Dijkstra) is the naive baseline: competitive on completion under mild conditions but the worst on equity and the steepest to degrade as severity rises (TET +70% from mild to severe).",
  "All KPIs degrade monotonically with flood severity; completion falls from ~98% (mild) to ~91% (severe) and survival from ~99% to ~93%.",
]));
body.push(P("One-way ANOVA across strategies (factor = strategy, 3 levels; n = 30 per cell) rejects equality of means for TET, AET, and EI at every flood level. Effect sizes (Cohen's f) are large for AET and EI."));
body.push(P([run("Table 7. ", { bold: true }), run("One-way ANOVA across the three strategies, per KPI and flood level.")]));
body.push(makeTable(
  ["KPI", "Flood", "F", "p-value", "partial eta-sq", "Cohen's f", "Sig."],
  [
    ["TET", "Mild", "41.76", "1.9e-13", "0.490", "0.98", "yes"],
    ["TET", "Moderate", "19.83", "8.0e-08", "0.313", "0.68", "yes"],
    ["TET", "Severe", "5.08", "8.2e-03", "0.105", "0.34", "yes"],
    ["AET", "Mild", "307.46", "3.6e-40", "0.876", "2.66", "yes"],
    ["AET", "Moderate", "209.33", "5.6e-34", "0.828", "2.19", "yes"],
    ["AET", "Severe", "84.72", "3.8e-21", "0.661", "1.40", "yes"],
    ["EI", "Mild", "29.78", "1.4e-10", "0.406", "0.83", "yes"],
    ["EI", "Moderate", "52.39", "1.2e-15", "0.546", "1.10", "yes"],
    ["EI", "Severe", "69.62", "8.8e-19", "0.616", "1.27", "yes"],
  ],
  [1100, 1500, 1300, 2060, 1700, 1100, 600],
  { align: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] },
));
body.push(P([run("Post-hoc (Tukey HSD, Severe). ", { bold: true }), run("For total evacuation time, B differs significantly from C (mean difference 71.9 min, adjusted p = 0.009). For the Equity Index, C differs significantly from both A and B (adjusted p < 0.001), confirming that Strategy C's equity advantage is substantive rather than marginal.")]));
body.push(P([run("Figures. ", { bold: true }), run("Figure 1 - Total Evacuation Time by routing strategy and flood-severity level (Strategy B lowest at every level). Figure 2 - Completion Rate versus flood severity. Figure 3 - Equity (Gini) heatmap over the 3 x 3 grid, ordering C < B < A at every severity. All figures are rendered live in the dashboard Results panel.")]));

// =====================================================================
//  Conclusion
// =====================================================================
body.push(H1("Conclusion"));
body.push(P("EvacuWay demonstrates the value of hybrid graph-theoretic simulation for a pressing real-world problem: typhoon evacuation routing in Metro Manila. Across three strategies and three flood-severity levels, the comparative framework provides a rigorous, reproducible, evidence-based foundation for evaluating evacuation policy."));
body.push(P("The central finding is that no single strategy dominates on every criterion. Strategy B (Frank-Wolfe) delivers the fastest network-wide clearance at every severity through capacity-aware load balancing, but assumes centralised, real-time network visibility. Strategy C (Zone-Sequential) achieves the most equitable clearance at every severity - protecting the highest-risk barangays first - at the cost of longer average times. Strategy A (Dijkstra) is a reasonable baseline under mild conditions but is the least equitable and degrades fastest as flooding worsens."));
body.push(P("The clearest practical implication for Philippine LGUs is not to commit to one protocol, but to build the institutional capacity to shift between strategies as conditions evolve - favouring capacity-aware routing (B) while the network is healthy and transitioning to zone-sequential protocols (C) as flooding becomes severe and routes contract. That adaptive, equity-aware approach is the direction this simulation ultimately points toward."));

// =====================================================================
//  Future Work
// =====================================================================
body.push(H1("Future Work"));
body.push(...numberedList([
  "Adaptive hybrid strategy. Develop and test a controller that transitions from Frank-Wolfe routing in early-stage flooding to a zone-sequential protocol as severity worsens.",
  "Metro-Manila-scale network. Upgrade the engine to the full OSMnx NCR graph (hundreds of thousands of nodes), using the Method of Successive Averages and distributed computation.",
  "Physically grounded flooding. Replace per-segment Bernoulli closure with a flood-wave propagation model that incorporates drainage-basin topology for contiguous, realistic inundation.",
  "Multi-modal evacuation. Add public buses, evacuation vessels for coastal barangays, and pedestrian movement to reflect mixed-mode Philippine evacuations.",
  "Behavioural realism. Relax the perfect-compliance assumption with non-compliant and panic-driven agents to test strategy robustness.",
  "Empirical calibration. Calibrate against GPS traces or post-disaster road-usage records from historical events (e.g. Ulysses 2020).",
  "Ethical framing. Formalise the equity-efficiency trade-off using utilitarian and Rawlsian principles to make the normative choices in each strategy explicit.",
]));

// =====================================================================
//  References
// =====================================================================
body.push(H1("References"));
[
  "Boeing, G. (2017). OSMnx: New methods for acquiring, constructing, analyzing, and visualizing complex street networks. Computers, Environment and Urban Systems, 65, 126-139.",
  "Bureau of Public Roads. (1964). Traffic Assignment Manual. U.S. Department of Commerce, Urban Planning Division.",
  "Frank, M., & Wolfe, P. (1956). An algorithm for quadratic programming. Naval Research Logistics Quarterly, 3(1-2), 95-110.",
  "Gini, C. (1912). Variabilita e Mutabilita. Bologna: Tipografia di Paolo Cuppini.",
  "Hagberg, A., Schult, D., & Swart, P. (2008). Exploring network structure, dynamics, and function using NetworkX. Proceedings of the 7th Python in Science Conference (SciPy), 11-15.",
  "National Disaster Risk Reduction and Management Council (NDRRMC). (2020). Situational Reports re: Typhoon Ulysses (Vamco). Quezon City: NDRRMC.",
  "Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA). (2022). Tropical Cyclone Information and Public Storm Warning Signals. Quezon City: PAGASA.",
  "Pel, A. J., Bliemer, M. C. J., & Hoogendoorn, S. P. (2012). A review on travel behaviour modelling in dynamic traffic simulation models for evacuations. Transportation, 39(1), 97-123.",
  "Sheffi, Y. (1985). Urban Transportation Networks: Equilibrium Analysis with Mathematical Programming Methods. Englewood Cliffs, NJ: Prentice-Hall.",
].forEach((r) => body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 276 }, indent: { left: 360, hanging: 360 }, children: [new TextRun({ text: r, size: 21, color: BLACK })] })));

// =====================================================================
//  Appendices
// =====================================================================
body.push(H1("Appendices"));
body.push(H2("Appendix A: Source Code"));
body.push(P([run("The complete source code (FastAPI backend, React dashboard, Android WebView wrapper, and documentation suite) is available at: ", {}), run("https://github.com/qjmre23/EvacuWay", { bold: true }), run(". The dashboard requires no login. Primary endpoints: /health, /api/meta, /api/simulate, /api/summary, /api/scenarios, /api/network, /api/centers, /api/origins, /api/flood-points, /api/rainfall, /api/results/{run_id}.")]));
body.push(H2("Appendix B: KPI Definitions"));
body.push(...[
  ["TET - Total Evacuation Time: ", "time until the last agent arrives (minutes)."],
  ["AET - Average Evacuation Time: ", "population-weighted mean clearance time (minutes)."],
  ["ECR - Evacuation Completion Rate: ", "percent of agents reaching a center within the completion window."],
  ["NUI - Network Utilization Index: ", "mean edge volume/capacity over loaded edges."],
  ["EI - Equity Index: ", "Gini coefficient of individual clearance times (0 = perfectly equal)."],
  ["SCP - Survival Completion Percentage: ", "percent of agents surviving (reaching safety or sheltering)."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));
body.push(H2("Appendix C: Reproducibility"));
body.push(P("The experiment is deterministic per seed. Running scripts/run_experiment.py regenerates every per-run JSON, the aggregate summary, and the full statistics (ANOVA + Tukey HSD) from scratch using the fixed seed list 42-71."));
body.push(new Paragraph({ spacing: { before: 360 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Honor Pledge - “We accept responsibility for our role in ensuring the integrity of the work submitted by the group in which we participated.”", italics: true, size: 20, color: BLACK })] }));

// =====================================================================
//  DOCUMENT
// =====================================================================
const heading = (size) => ({ size, bold: true, color: BLACK, font: FONT });
const doc = new Document({
  creator: "EvacuWay", title: "EvacuWay Project Documentation", numbering,
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: BLACK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: heading(30), paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: heading(25), paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: heading(22), paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: BLACK })] })] }) },
    children: body,
  }],
});

const out = path.join(__dirname, "..", "docs", "EvacuWay_Project_Documentation.docx");
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("Wrote", out, "(" + buf.length + " bytes)"); });
