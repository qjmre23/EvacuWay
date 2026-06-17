/*
 * EvacuWay — generate the overhauled project documentation as a .docx.
 * Requires the `docx` package (npm install docx). Run:  node scripts/generate_thesis.cjs
 * Output: docs/EvacuWay_Project_Documentation.docx
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  TableOfContents, Header, Footer, PageNumber, PageBreak, VerticalAlign,
} = require(path.join(__dirname, "..", "node_modules", "docx"));

const NAVY = "1F3864", BLUE = "2E75B6", LIGHT = "D9E2F3", GREY = "808080";
const CONTENT_W = 9360; // US Letter, 1" margins

// ---------- helpers ----------
const P = (text, o = {}) => new Paragraph({
  alignment: o.align || (o.justify === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED),
  spacing: { after: o.after ?? 140, line: 276, ...(o.spacing || {}) },
  pageBreakBefore: o.pageBreakBefore || false,
  children: (Array.isArray(text) ? text : [new TextRun({ text, bold: o.bold, italics: o.italics, color: o.color, size: o.size })]),
});
const run = (t, o = {}) => new TextRun({ text: t, bold: o.bold, italics: o.italics, color: o.color, size: o.size, subScript: o.sub, superScript: o.sup });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const bullet = (t, lvl = 0) => new Paragraph({
  numbering: { reference: "bullets", level: lvl }, spacing: { after: 80, line: 276 },
  alignment: AlignmentType.JUSTIFIED, children: Array.isArray(t) ? t : [new TextRun(t)],
});
let numRef = 0;
const numberedList = (items) => {
  const ref = "num" + (numRef++);
  return items.map((t) => new Paragraph({
    numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 },
    alignment: AlignmentType.JUSTIFIED, children: Array.isArray(t) ? t : [new TextRun(t)],
  }));
};
const caption = (t) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
  children: [new TextRun({ text: t, italics: true, size: 18, color: GREY })],
});

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function tableCell(text, w, { head = false, bold = false, fill = null, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: { fill: fill || (head ? NAVY : "FFFFFF"), type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: align, spacing: { after: 0, line: 252 },
      children: [new TextRun({ text: String(text), bold: head || bold, color: head ? "FFFFFF" : "000000", size: 19 })] })],
  });
}
function makeTable(headers, rows, widths, { align = [] } = {}) {
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => tableCell(h, widths[i], { head: true, align: align[i] || AlignmentType.LEFT })) });
  const bodyRows = rows.map((r, ri) => new TableRow({ children: r.map((c, i) =>
    tableCell(c, widths[i], { fill: ri % 2 ? "F2F6FC" : "FFFFFF", align: align[i] || AlignmentType.LEFT })) }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}
const titleLine = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 120 },
  children: [new TextRun({ text: t, bold: o.bold, italics: o.italics, size: o.size || 24, color: o.color, allCaps: o.caps })] });

// ---------- numbering config ----------
const numbering = { config: [
  { reference: "bullets", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } },
    { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 280 } } } },
  ] },
  ...Array.from({ length: 20 }, (_, i) => ({ reference: "num" + i, levels: [
    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } } ] })),
] };

// ---------- equation paragraph ----------
const eq = (children) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 160 }, children });

// =====================================================================
//  CONTENT
// =====================================================================
const body = [];

// ---- Title page ----
body.push(
  new Paragraph({ spacing: { before: 600, after: 0 }, children: [] }),
  titleLine("Technological Institute of the Philippines", { bold: true, size: 26 }),
  titleLine("Quezon City", { size: 24 }),
  titleLine("College of Computer Studies — Computer Science Department", { size: 22 }),
  titleLine("CS 302-CS32S1A — Modeling and Simulation", { size: 22 }),
  titleLine("Summer 2026", { size: 22, after: 480 }),
  titleLine("PROJECT DOCUMENTATION", { bold: true, size: 28, color: NAVY, after: 240 }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 6 } },
    children: [new TextRun({ text: "EvacuWay", bold: true, size: 44, color: NAVY })] }),
  titleLine("Comparative Simulation of Evacuation Strategy Effectiveness Under Typhoon and Flood Emergency Conditions in Metro Manila", { bold: true, size: 26, after: 520 }),
  titleLine("Proponent", { bold: true, size: 20, color: GREY, after: 80 }),
  titleLine("Lorenzo, Zrehm Francis V.", { size: 24, after: 360 }),
  titleLine("Submitted to", { bold: true, size: 20, color: GREY, after: 80 }),
  titleLine("Ms. Karren V. de Lara", { size: 24, after: 40 }),
  titleLine("Course Instructor, CS 302", { italics: true, size: 22, after: 360 }),
  titleLine("June 2026", { size: 22 }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- TOC ----
body.push(
  new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "Table of Contents", bold: true, size: 30, color: NAVY })] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- I. Introduction ----
body.push(H1("I. Introduction"));
body.push(P("The Philippines lies along the western rim of the Pacific typhoon belt and is struck by an average of roughly twenty tropical cyclones each year, many of which deliver catastrophic flooding to the densely populated National Capital Region (NCR). With approximately fourteen million residents distributed across seventeen local government units (LGUs), Metro Manila must repeatedly move large populations to safety along a road network that is itself failing as flood water rises. Tropical Storm Ondoy (Ketsana, 2009), Typhoon Ulysses (Vamco, 2020), and Super Typhoon Rolly (Goni, 2020) each demonstrated, at enormous human cost, that evacuation in the NCR is not a routine logistical task but a high-stakes, time-critical operation."));
body.push(P("This project, EvacuWay, addresses evacuation routing as a complex sociotechnical problem rather than a simple shortest-path exercise. It couples a large irregular road network, hundreds of origin communities with widely varying populations and flood exposures, a finite set of evacuation centers with limited shelter capacity, and a hazard — flood water — that progressively removes and degrades the very roads on which evacuation depends. The best route at the onset of an event is frequently impassable an hour later."));
body.push(P("Because the system is large, hazard-driven, and partly stochastic, it cannot be studied through controlled real-world experiment: one cannot repeatedly flood Metro Manila to compare evacuation plans. Simulation is therefore the appropriate scientific method. A simulation represents the road network and flood hazard explicitly, re-runs the same scenario under different routing policies, and measures outcomes — clearance time, completion, equity, and survival — under identical, reproducible conditions."));
body.push(H2("Research gap"));
body.push(P("Most existing evacuation studies evaluate a single routing strategy in isolation, frequently on a static network, and judge performance primarily by aggregate throughput — leaving the fairness of clearance times unexamined. The gap this study fills is the absence of a like-for-like comparison of multiple routing strategies, evaluated simultaneously on the same network, under progressive road degradation, and judged on equity as well as speed."));
body.push(P("EvacuWay compares three routing strategies — Strategy A (Dijkstra shortest-path, decentralised), Strategy B (Frank-Wolfe capacity-aware, centralised), and Strategy C (zone-sequential priority, phased) — across three flood-severity levels, over thirty random seeds, for 270 fully reproducible runs. It reports six key performance indicators including an Equity Index (Gini coefficient of clearance times). This is an evacuation-routing simulation study; it contains no machine-learning, natural-language, or text-classification component of any kind."));

// ---- II. Background and RRL ----
body.push(H1("II. Background and Review of Related Literature"));
body.push(P("Effective disaster response in dense urban areas requires a balance between infrastructure capacity and human behaviour. Traditional evacuation planning has relied on macroscopic traffic-assignment models, which optimise overall network flow but overlook individual behavioural nuance. Agent-Based Models (ABMs), by contrast, capture decentralised decision-making and emergent congestion but can lack rigorous, capacity-aware routing optimisation. Compounding these modelling challenges is the volatile nature of flooding, where progressive road degradation continuously alters network topology and restricts vehicle movement."));
body.push(P("In disaster-prone regions such as the Philippines, evacuation frameworks frequently employ zone-sequential and phased protocols to manage high-density populations during severe weather. Executing such staggered departures becomes highly complex when flood water actively compromises the road network. Uncoordinated shortest-path navigation often produces severe corridor crowding, sharply increasing clearance times and stranding vulnerable populations in high-risk zones."));
body.push(P("While the literature commonly evaluates a single routing strategy or protocol in isolation, a critical gap remains in understanding how localised disaster policy, real-time road degradation, and dynamic routing strategies interact. Furthermore, conventional evacuation metrics favour total throughput and frequently leave the socioeconomic fairness of clearance times unaddressed. To bridge these gaps, this study implements a fully-crossed factorial design that evaluates multiple routing strategies against a stochastic road-degradation model, and introduces an Equity Index quantified via the Gini coefficient as a formal KPI to evaluate the distribution of clearance times across zones."));

// ---- III. Objectives ----
body.push(H1("III. Objectives of the Study"));
body.push(P([run("Research question. ", { bold: true }), run("Among three evacuation routing approaches — shortest-distance individual routing, capacity-aware centralised distribution, and zone-based sequencing — which delivers the most effective and equitable large-scale urban evacuation during a typhoon or flood emergency, and in what ways do real-time road-network failures (submerged roads, closed bridges) affect the comparative outcomes?")]));
body.push(P("Specifically, the study aims to:"));
body.push(...numberedList([
  "Construct a representative Metro Manila road-network model integrating realistic population distribution and flood-vulnerability characteristics at the road-segment level, seeded and validated by the Marikina prototype sub-network.",
  "Develop and simulate three evacuation routing strategies: shortest-path routing (Strategy A), capacity-aware load distribution (Strategy B), and zone-sequential priority routing (Strategy C).",
  "Simulate progressive road-network degradation under three escalating flood-severity levels — mild, moderate, and severe — using a probabilistic Bernoulli edge-failure engine.",
  "Run 270 fully reproducible simulation experiments (3 strategies × 3 flood levels × 30 seed-replicated runs) to ensure statistical stability.",
  "Measure six KPIs — TET, AET, ECR, NUI, EI, and SCP — and compare them using one-way ANOVA with post-hoc Tukey HSD tests.",
  "Translate the quantitative findings into actionable policy guidance for Philippine LGUs and the NDRRMC.",
]));

// ---- IV. Scope and Delimitation ----
body.push(H1("IV. Scope and Delimitation"));
body.push(H2("Scope"));
body.push(...[
  "The study area is the whole of Metro Manila (NCR), comprising all seventeen LGUs. It uses open geographic and census datasets — OpenStreetMap, NAMRIA, PAGASA, PSA, and DSWD/DepEd — to model the urban road network and evacuation centers.",
  "It employs an independent Bernoulli-trial framework for road-network degradation, using localised flood-susceptibility scores (fe) derived from flood-risk level and depth to simulate real-time road closures, together with a slowdown on surviving flooded roads.",
  "It implements and compares three distinct routing strategies: Strategy A (Dijkstra shortest-path), Strategy B (Frank-Wolfe capacity-aware), and Strategy C (zone-sequential priority), under uniform baseline environments.",
  "It integrates a fully-crossed 3 × 3 factorial design (3 routing strategies × 3 flood-severity levels) with 30 independently seeded replications per cell, totalling 270 randomized runs.",
  "Outputs include a performance ledger across six KPIs (TET, AET, ECR, NUI, EI via the Gini coefficient, and SCP), dynamic routing-flow maps, and cross-strategy statistical validation via one-way ANOVA with post-hoc Tukey HSD.",
].map((t) => bullet(t)));
body.push(H2("Delimitation"));
body.push(...[
  "The study is delimited to the Metro Manila (NCR) network boundary, excluding adjacent provinces and inter-regional transport links.",
  "Evacuation destinations are DSWD/DepEd-registered evacuation centers across Metro Manila, seeded by the evacuation_center field of the flood dataset. The set of Marikina schools and covered courts used during prototype testing is the Marikina sample used for prototype validation only; full deployment covers Metro-Manila-wide registered centers.",
  "Transportation is limited to homogeneous private-vehicle agents travelling at 20–60 km/hr, excluding public buses, rescue boats, and pedestrian movement.",
  "Agent behaviour assumes 100% compliance with the assigned routing strategy, excluding non-compliance, panic behaviour, and delayed-departure inertia.",
  "Flooding is modelled as probabilistic Bernoulli edge failure plus a flood slowdown — a network-degradation abstraction, not a hydrodynamic fluid-propagation model.",
  "The 1,250-node Marikina dataset is a prototype seed sub-network for pipeline validation only; full runs use the OSMnx-extracted Metro Manila drive graph.",
].map((t) => bullet(t)));
body.push(P([run("Data-coverage note. ", { bold: true }), run("The flood dataset covers 12 of the 17 NCR LGUs; five (Makati, Mandaluyong, Pasay, Pateros, San Juan) have zero records. This gap is mitigated with OSMnx network data and NDRRMC public records, interpolating flood susceptibility from adjacent cities where necessary.")]));

// ---- V. Assumptions and Limitations ----
body.push(H1("V. Assumptions and Limitations"));
body.push(H2("Assumptions"));
body.push(...[
  "The geographic and demographic source layers (OpenStreetMap, NAMRIA, PSA, DSWD) accurately represent the physical and population constraints of the study area.",
  "A topological graph of directed nodes and edges captures macro-level corridor routing without explicit sub-lane tracking or signal-timing logic.",
  "Historical flood-response patterns and dynamic traffic-assignment paradigms are informative enough to predict network clearance times, bottlenecks, and survival rates.",
  "The independent Bernoulli-trial closure model provides valid probabilistic signals for topology change without requiring a coupled hydrodynamic engine.",
  "Typhoon alert level maps to the severity multiplier λF (Signal 1 ≈ 0.33, Signal 2 ≈ 0.66, Signal 4 ≈ 1.0); flood-risk level maps to fe (Very High 0.85, High 0.60, Moderate 0.35, Low 0.10).",
].map((t) => bullet(t)));
body.push(H2("Limitations"));
body.push(...[
  "The model is restricted to macro-level traffic assignment and cannot represent microscopic anomalies such as individual accidents, stalls, lane-changing friction, or fuel limits.",
  "The hydrology layer uses static probabilistic edge failure based on flood susceptibility; it does not compute dynamic flood-wave propagation or temporal depth changes.",
  "The behavioural rule-set excludes non-compliance, panic detours, and household-level destination changes.",
  "Transportation is limited to private vehicles, excluding multi-modal options (buses, boats, pedestrian corridors).",
  "Outputs are a high-level comparative policy tool, not a micro-level predictor of specific household movements.",
].map((t) => bullet(t)));

// ---- VI. Significance ----
body.push(H1("VI. Significance of the Study"));
body.push(...[
  ["Local Government Units and disaster-risk-reduction managers: ", "an operational, transparent, and reproducible routing-evaluation tool that justifies shifting strategy as road degradation crosses thresholds, rather than committing to one static protocol."],
  ["The public and urban communities: ", "capacity-aware routing reduces corridor bottlenecks, and an explicit Equity Index demonstrates fairness across demographic zones, preserving public trust in managed evacuation."],
  ["The field of modeling and simulation: ", "a concrete worked example of testing routing algorithms under uncertainty using stochastic edge-failure sweeping, capacitated assignment, and seed-replicated baseline testing."],
  ["Data scientists and future researchers: ", "a reproducible framework that exposes the lack of simultaneous evaluation against progressive road failure and can be extended to other urban disaster-simulation tasks."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));

// ---- VII. Dataset Description ----
body.push(H1("VII. Dataset Description"));
body.push(P("EvacuWay uses two evacuation-simulation datasets. Neither is a classification dataset; the project has no fake-news, political-statement, or natural-language content."));
body.push(H2("A. metro_manila_flood_dataset.csv (2,200 records × 27 columns)"));
body.push(P("A historical flood-incident database spanning 2000–2024 across 12 NCR cities (DSWD / PAGASA / NDRRMC). It provides flood susceptibility, origin-zone population loads, historical evacuation-center names, typhoon severity, and response-time benchmarks. Selected fields:"));
body.push(makeTable(
  ["Column", "Type", "Description / Range"],
  [
    ["record_id", "int", "Unique identifier (1–2200)"],
    ["incident_date / year / month", "date / int / str", "2000–2024"],
    ["city_municipality / barangay", "str", "12 NCR cities (e.g. Malabon 264, Marikina 258)"],
    ["latitude / longitude", "float", "14.388–14.736 N / 120.936–121.132 E"],
    ["flood_risk_level", "str", "Very High / High / Moderate / Low"],
    ["flood_depth_meters", "float", "0.06–4.49 m"],
    ["typhoon_name / typhoon_alert_level", "str", "Ondoy, Ulysses, Rolly, … / Signal No. 1–4"],
    ["affected_population / evacuees", "int", "200–7,999 / 4–3,540"],
    ["evacuation_center", "str", "55 named schools / gyms / covered courts"],
    ["response_time_hours", "float", "0.5–24.0 (KPI benchmark)"],
    ["data_source", "str", "DSWD / PAGASA / NDRRMC"],
  ],
  [3000, 2160, 4200],
));
body.push(caption("Table 1. Selected variables of metro_manila_flood_dataset.csv (27 columns total)."));
body.push(H2("B. Evacuation_Marikina_Dataset.xlsx (1,250 nodes × 10 columns) — prototype seed"));
body.push(P("A 1,250-node Marikina prototype sub-network: 740 Intersections (59.2%), 381 Origin Zones (30.5%), and 129 Evacuation Centers (10.3%). It seeds graph construction and validates the preprocessing pipeline; full Metro Manila runs use the OSMnx drive graph. In the delivered file the flood-risk level is encoded inside the free-text Notes column (e.g. “Low risk”), which the loader parses."));
body.push(makeTable(
  ["Column", "Type", "Description"],
  [
    ["Node ID", "str", "Unique node code (N001…N1250)"],
    ["Node Type", "str", "Intersection / Origin Zone / Evacuation Center"],
    ["Barangay Name", "str", "Barangay or facility name"],
    ["Population Count", "int", "0 for non-origins; up to ~3,000 for Origin Zones"],
    ["Centroid Latitude / Longitude", "float", "≈14.52–14.68 N / 120.97–121.13 E"],
    ["Is Evacuation Center", "str", "Yes / No"],
    ["Elevation (m asl)", "float", "Elevation above sea level"],
    ["Notes", "str", "Risk annotation (Low / Moderate / High risk)"],
  ],
  [3200, 1600, 4560],
));
body.push(caption("Table 2. Variable documentation for the Marikina prototype dataset."));
body.push(H2("Column-to-simulation mapping"));
body.push(makeTable(
  ["Dataset field", "Drives", "Mapping"],
  [
    ["flood_risk_level + flood_depth_meters", "fe (edge susceptibility)", "Very High 0.85 / High 0.60 / Moderate 0.35 / Low 0.10"],
    ["typhoon_alert_level", "λF (severity multiplier)", "Signal 1→0.33 / 2→0.66 / 4→1.0"],
    ["affected_population + evacuees", "agent count per Origin Zone", "capped at 500 per zone"],
    ["evacuation_center", "destination candidates", "snapped to graph nodes"],
    ["latitude + longitude", "node matching", "OSMnx origin/center snapping"],
    ["response_time_hours", "TET / AET benchmark", "validation only"],
  ],
  [3400, 2600, 3360],
));
body.push(caption("Table 3. How dataset columns drive the simulation."));

// ---- VIII. Data Preprocessing ----
body.push(H1("VIII. Data Preprocessing and Cleaning"));
body.push(P("Preprocessing was executed in Python (pandas). The pipeline loads and inspects the datasets, parses and validates records, derives per-node flood risk, builds the routing graph, and exports node/edge tables for the simulation engine."));
body.push(...numberedList([
  "Loading and inspection. The flood CSV (2,200 rows) and the Marikina nodes (1,250 rows) are loaded; rows missing critical identifiers are dropped, and optional metadata (elevation, notes) is filled with defaults.",
  "Risk derivation. Each node’s flood-risk level is parsed (from the Notes annotation or the flood-risk field) and mapped to a susceptibility score fe; edge fe is the mean of its two endpoints.",
  "Graph construction. Nodes are connected to their k = 4 nearest neighbours (great-circle distance) to form a road-adjacency proximity graph; each edge receives length, free-flow travel time, road-class capacity, and fe. Connectivity is guaranteed by bridging isolated components.",
  "Spatial validation. Coordinates are validated against the Metro Manila bounding box (14.35–14.78 N, 120.90–121.20 E); outliers are removed.",
  "Road-network artifact. For on-street route geometry, a compiled OSM drive network (data/marikina_road_network.json) is produced via OSMnx/Overpass and used to snap each route onto real roads.",
  "Export. Cleaned node and edge tables are exported for the simulation engine and the dashboard.",
]));

// ---- IX. Modeling Approach ----
body.push(H1("IX. Modeling Approach"));
body.push(P("EvacuWay uses a hybrid architecture combining macroscopic graph-theoretic routing (NetworkX) with capacitated, policy-driven assignment. The three strategies share a common Bernoulli flood-disruption engine and are scored on the same six KPIs."));
body.push(makeTable(
  ["Component", "Role in the simulation"],
  [
    ["Strategy A — Dijkstra", "Decentralised shortest-path: each origin routes independently to its nearest available evacuation center; congestion and flooding are experienced on the chosen path but not routed around."],
    ["Strategy B — Frank-Wolfe", "Centralised capacity-aware assignment (Method of Successive Averages) on the congested BPR cost, balancing load across parallel corridors."],
    ["Strategy C — Zone-Sequential", "Phased departures ordered by flood risk (Very High → Low); a wave starts only after the previous wave clears 80%. Each wave experiences only its own congestion."],
    ["Bernoulli disruption engine", "Evaluates every flood-susceptible edge each run, removing it with probability fe · λF and slowing surviving flooded roads."],
    ["Capacitated shelters", "Each center has finite capacity; when nearby centers fill, demand spills to farther centers — the mechanism that differentiates the strategies."],
    ["Road snapping + live rainfall", "Routes are snapped onto real OSM streets; a best-effort PAGASA rainfall layer enriches the dashboard and (optionally) fe."],
  ],
  [2600, 6760],
));
body.push(caption("Table 4. Methods and their roles in the simulation."));

// ---- X. Governing Equations ----
body.push(H1("X. Governing Equations"));
body.push(P("Edge costs use the Bureau of Public Roads (BPR) congestion function, where t₀ is free-flow time, x the edge volume, and C the capacity:"));
body.push(eq([run("t"), run("e", { sub: true }), run("(x"), run("e", { sub: true }), run(") = t"), run("e0", { sub: true }),
  run(" × [ 1 + 0.15 × (x"), run("e", { sub: true }), run(" / C"), run("e", { sub: true }), run(")"), run("4", { sup: true }), run(" ]")]));
body.push(P("Progressive degradation replaces deterministic availability with an independent Bernoulli trial; an edge closes when a uniform draw falls below its closure probability:"));
body.push(eq([run("P(X"), run("e", { sub: true }), run(" = 0) = f"), run("e", { sub: true }), run(" × λ"), run("F", { sub: true })]));
body.push(P("Surviving flooded roads are slowed (partial inundation), where the effective free-flow time scales with susceptibility and severity:"));
body.push(eq([run("t′"), run("e", { sub: true }), run(" = t"), run("e", { sub: true }), run(" × ( 1 + β"), run("slow", { sub: true }), run(" · f"), run("e", { sub: true }), run(" · λ"), run("F", { sub: true }), run(" )")]));
body.push(P("Equity is scored with the Gini coefficient of individual clearance times T, so that 0 denotes perfectly equal clearance:"));
body.push(eq([run("G = ( Σ"), run("i", { sub: true }), run(" Σ"), run("j", { sub: true }), run(" | T"), run("i", { sub: true }), run(" − T"), run("j", { sub: true }), run(" | ) / ( 2 n"), run("2", { sup: true }), run(" T̄ )")]));

// ---- XI. Implementation ----
body.push(H1("XI. Implementation Details"));
body.push(P("The system is built entirely with open-source tools and requires no login or API keys."));
body.push(...[
  ["Backend: ", "Python 3.11+ with FastAPI; NetworkX for graph routing; NumPy, pandas, SciPy, and statsmodels for KPIs and statistics (ANOVA, Tukey HSD). OSMnx/GeoPandas are optional, used only to regenerate the full Metro Manila graph."],
  ["Frontend: ", "React 18 + TypeScript + Vite, with Leaflet (OpenStreetMap tiles, no key) for the map and Recharts for KPI charts. The dashboard falls back to bundled JSON snapshots when the API is offline."],
  ["Road snapping: ", "Node.js scripts (build_road_network.mjs, snap_routes.mjs) compile an OSM drive network and rewrite route geometry so drawn routes follow real streets; the backend mirrors this via road_snap.py."],
  ["Live rainfall: ", "rainfall.py fetches PAGASA automatic-weather-station readings (best-effort), degrading gracefully to a bundled snapshot."],
  ["Deployment: ", "The FastAPI app is deployed as a Netlify serverless function via Mangum (web/netlify/functions/api.py); the Vite frontend is built to static assets and API calls are routed to the function."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));
body.push(H2("Code structure"));
body.push(...[
  "data_loader.py — loads the datasets and builds/caches the routing graph.",
  "simulation.py — the three strategies, the Bernoulli engine, capacitated assignment, and the six-KPI computation.",
  "analysis.py — the 270-run batch, JSON persistence, and ANOVA + Tukey HSD.",
  "routes.py / main.py — the FastAPI endpoints (/health, /api/meta, /api/simulate, /api/summary, /api/centers, /api/origins, /api/flood-points, /api/rainfall, …).",
  "frontend/ — the React dashboard (MapView, ScenarioPanel, KpiCards, ResultsPanel, Legend).",
].map((t) => bullet(t)));

// ---- XII. Experimentation ----
body.push(H1("XII. Experimentation and Simulation"));
body.push(P("The study uses a fully-crossed 3 × 3 factorial design with 30 replications per cell, yielding 270 reproducible runs. Fixed seeds (42–71) guarantee identical results on re-execution. The corrected parameter configuration is:"));
body.push(makeTable(
  ["Parameter", "Setting"],
  [
    ["Simulation framework", "NetworkX graph routing + capacitated assignment"],
    ["Prototype seed nodes / edges", "1,250 nodes / ≈3,064 edges (Marikina seed)"],
    ["Full Metro Manila graph (OSMnx)", "~80,000–150,000 nodes / ~200,000–400,000 edges"],
    ["Thesis simulation sample", "~5,000–15,000 nodes (stratified)"],
    ["Origin zones / evacuation centers (prototype)", "381 / 129"],
    ["Road capacity (Ce)", "residential 400 – trunk 2,500 veh/hr"],
    ["Agent driving speed", "20–60 km/hr (nominal 40)"],
    ["Flood severity levels", "Mild λF=0.33 / Moderate 0.66 / Severe 1.0"],
    ["Routing strategies", "A (Dijkstra), B (Frank-Wolfe), C (Zone-Sequential)"],
    ["Replications / total runs", "30 fixed seeds (42–71) / 270 runs"],
    ["Statistics", "one-way ANOVA + post-hoc Tukey HSD (α = 0.05)"],
  ],
  [4200, 5160],
));
body.push(caption("Table 5. Simulation parameter configuration (the earlier “150–500 nodes” figure is superseded)."));

// ---- XIII. Results ----
body.push(H1("XIII. Results and Analysis"));
body.push(P([run("The values below are real output from the executed experiment ", { bold: true }), run("(270 runs, seeds 42–71), produced by scripts/run_experiment.py and reproducible exactly.")]));
body.push(H2("Summary of KPIs (270-run means)"));
const t4 = [
  ["A (Dijkstra)", "Mild", "245.6", "30.7", "98.4", "2.05", "0.505", "99.3"],
  ["A (Dijkstra)", "Moderate", "318.2", "35.7", "95.0", "2.07", "0.555", "97.0"],
  ["A (Dijkstra)", "Severe", "418.7", "42.7", "91.4", "2.18", "0.602", "92.9"],
  ["B (Frank-Wolfe)", "Mild", "157.0", "25.0", "96.5", "1.12", "0.423", "98.4"],
  ["B (Frank-Wolfe)", "Moderate", "246.9", "30.9", "93.7", "1.22", "0.514", "96.2"],
  ["B (Frank-Wolfe)", "Severe", "363.7", "39.0", "90.9", "1.35", "0.587", "92.6"],
  ["C (Zone-Seq.)", "Mild", "263.9", "45.7", "98.3", "2.04", "0.405", "99.2"],
  ["C (Zone-Seq.)", "Moderate", "347.8", "50.9", "94.2", "2.07", "0.448", "96.5"],
  ["C (Zone-Seq.)", "Severe", "435.5", "57.2", "90.8", "2.15", "0.487", "92.5"],
];
body.push(makeTable(
  ["Strategy", "Flood", "TET", "AET", "ECR", "NUI", "EI", "SCP"],
  t4, [1860, 1300, 980, 980, 980, 920, 760, 1580],
  { align: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] },
));
body.push(caption("Table 6. Mean KPI values by strategy and flood level (n = 30 per cell). TET/AET in minutes; ECR/SCP in %; EI is the Gini coefficient."));
body.push(H2("Key findings"));
body.push(...numberedList([
  "Strategy B (Frank-Wolfe) is the fastest in every cell. Its load balancing keeps network utilisation roughly 40–45% below A and C and cuts total evacuation time by up to 36% versus A under mild flooding.",
  "Strategy C (Zone-Sequential) is the most equitable in every cell — lowest Gini at every severity (0.405 / 0.448 / 0.487 versus A’s 0.505 / 0.555 / 0.602) — at the cost of the highest average time, a clear speed-versus-equity trade-off.",
  "Strategy A (Dijkstra) is the naive baseline: competitive on completion under mild conditions but the worst on equity and the steepest to degrade as severity rises (TET +70% from mild to severe).",
  "All KPIs degrade monotonically with flood severity; completion falls from ~98% (mild) to ~91% (severe) and survival from ~99% to ~93%.",
]));
body.push(H2("Statistical analysis"));
body.push(P("One-way ANOVA across strategies (factor = strategy, 3 levels; n = 30 per cell) rejects equality of means for TET, AET, and EI at every flood level. Effect sizes (Cohen’s f) are large for AET and EI."));
body.push(makeTable(
  ["KPI", "Flood", "F", "p-value", "partial η²", "Cohen’s f", "Sig."],
  [
    ["TET", "Mild", "41.76", "1.9×10⁻¹³", "0.490", "0.98", "yes"],
    ["TET", "Moderate", "19.83", "8.0×10⁻⁸", "0.313", "0.68", "yes"],
    ["TET", "Severe", "5.08", "8.2×10⁻³", "0.105", "0.34", "yes"],
    ["AET", "Mild", "307.46", "3.6×10⁻⁴⁰", "0.876", "2.66", "yes"],
    ["AET", "Moderate", "209.33", "5.6×10⁻³⁴", "0.828", "2.19", "yes"],
    ["AET", "Severe", "84.72", "3.8×10⁻²¹", "0.661", "1.40", "yes"],
    ["EI", "Mild", "29.78", "1.4×10⁻¹⁰", "0.406", "0.83", "yes"],
    ["EI", "Moderate", "52.39", "1.2×10⁻¹⁵", "0.546", "1.10", "yes"],
    ["EI", "Severe", "69.62", "8.8×10⁻¹⁹", "0.616", "1.27", "yes"],
  ],
  [1100, 1500, 1300, 2060, 1500, 1100, 800],
  { align: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] },
));
body.push(caption("Table 7. One-way ANOVA across the three strategies, per KPI and flood level."));
body.push(P([run("Post-hoc (Tukey HSD, Severe). ", { bold: true }), run("For total evacuation time, B differs significantly from C (mean diff 71.9 min, pₐₑⱼ = 0.009). For the Equity Index, C differs significantly from both A and B (pₐₑⱼ < 0.001), confirming that Strategy C’s equity advantage is substantive rather than marginal.")]));
body.push(P([run("Figure 1. ", { bold: true, italics: true }), run("Total Evacuation Time by routing strategy and flood-severity level (Strategy B lowest at every level). Figure 2. Completion Rate versus flood severity. Figure 3. Equity (Gini) heatmap over the 3 × 3 grid — ordering C < B < A at every severity. All figures are rendered live in the dashboard Results panel.", { italics: true, color: GREY, size: 19 })], { after: 80 }));

// ---- XIV. Conclusion ----
body.push(H1("XIV. Conclusion"));
body.push(P("EvacuWay demonstrates the value of hybrid graph-theoretic simulation for a pressing real-world problem: typhoon evacuation routing in Metro Manila. Across three strategies and three flood-severity levels, the comparative framework provides a rigorous, reproducible, evidence-based foundation for evaluating evacuation policy."));
body.push(P("The central finding is that no single strategy dominates on every criterion. Strategy B (Frank-Wolfe) delivers the fastest network-wide clearance at every severity through capacity-aware load balancing, but assumes centralised, real-time network visibility. Strategy C (Zone-Sequential) achieves the most equitable clearance at every severity — protecting the highest-risk barangays first — at the cost of longer average times. Strategy A (Dijkstra) is a reasonable baseline under mild conditions but is the least equitable and degrades fastest as flooding worsens."));
body.push(P("The clearest practical implication for Philippine LGUs is not to commit to one protocol, but to build the institutional capacity to shift between strategies as conditions evolve — favouring capacity-aware routing (B) while the network is healthy and transitioning to zone-sequential protocols (C) as flooding becomes severe and routes contract. That adaptive, equity-aware approach is the direction this simulation ultimately points toward."));

// ---- XV. Future Work ----
body.push(H1("XV. Future Work"));
body.push(...numberedList([
  "Adaptive hybrid strategy. Develop and test a controller that transitions from Frank-Wolfe routing in early-stage flooding to a zone-sequential protocol as severity worsens.",
  "Metro-Manila-scale network. Upgrade the engine to the full OSMnx NCR graph (hundreds of thousands of nodes), using the Method of Successive Averages and distributed computation.",
  "Physically grounded flooding. Replace per-segment Bernoulli closure with a flood-wave propagation model that incorporates drainage-basin topology for contiguous, realistic inundation.",
  "Multi-modal evacuation. Add public buses, evacuation vessels for coastal barangays, and pedestrian movement to reflect mixed-mode Philippine evacuations.",
  "Behavioural realism. Relax the perfect-compliance assumption with non-compliant and panic-driven agents to test strategy robustness.",
  "Empirical calibration. Calibrate against GPS traces or post-disaster road-usage records from historical events (e.g. Ulysses 2020).",
  "Ethical framing. Formalise the equity-efficiency trade-off using utilitarian and Rawlsian principles to make the normative choices in each strategy explicit.",
]));

// ---- XVI. References ----
body.push(H1("XVI. References"));
const refs = [
  "Boeing, G. (2017). OSMnx: New methods for acquiring, constructing, analyzing, and visualizing complex street networks. Computers, Environment and Urban Systems, 65, 126–139.",
  "Bureau of Public Roads. (1964). Traffic Assignment Manual. U.S. Department of Commerce, Urban Planning Division.",
  "Frank, M., & Wolfe, P. (1956). An algorithm for quadratic programming. Naval Research Logistics Quarterly, 3(1–2), 95–110.",
  "Gini, C. (1912). Variabilità e Mutabilità. Bologna: Tipografia di Paolo Cuppini.",
  "Hagberg, A., Schult, D., & Swart, P. (2008). Exploring network structure, dynamics, and function using NetworkX. Proceedings of the 7th Python in Science Conference (SciPy), 11–15.",
  "Kazmierczak, A., & Cavan, G. (2011). Surface water flooding risk to urban communities. Landscape and Urban Planning, 103(2), 185–197.",
  "National Disaster Risk Reduction and Management Council (NDRRMC). (2020). Situational Reports re: Typhoon Ulysses (Vamco). Quezon City: NDRRMC.",
  "Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA). (2022). Tropical Cyclone Information and Public Storm Warning Signals. Quezon City: PAGASA.",
  "Pel, A. J., Bliemer, M. C. J., & Hoogendoorn, S. P. (2012). A review on travel behaviour modelling in dynamic traffic simulation models for evacuations. Transportation, 39(1), 97–123.",
  "Sheffi, Y. (1985). Urban Transportation Networks: Equilibrium Analysis with Mathematical Programming Methods. Englewood Cliffs, NJ: Prentice-Hall.",
];
refs.forEach((r) => body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 276 }, indent: { left: 360, hanging: 360 }, children: [new TextRun({ text: r, size: 21 })] })));

// ---- XVII. Appendices ----
body.push(H1("XVII. Appendices"));
body.push(H2("Appendix A — Repository and API"));
body.push(P([run("Source code: ", { bold: true }), run("https://github.com/qjmre23/EvacuWay (FastAPI backend, React dashboard, Android WebView wrapper, full documentation suite). The dashboard requires no login.")]));
body.push(P("Primary endpoints: /health, /api/meta, /api/simulate, /api/summary, /api/scenarios, /api/network, /api/centers, /api/origins, /api/flood-points, /api/rainfall, /api/results/{run_id}."));
body.push(H2("Appendix B — KPI definitions"));
body.push(...[
  ["TET — Total Evacuation Time: ", "time until the last agent arrives."],
  ["AET — Average Evacuation Time: ", "population-weighted mean clearance time."],
  ["ECR — Evacuation Completion Rate: ", "% of agents reaching a center within the completion window."],
  ["NUI — Network Utilization Index: ", "mean edge volume/capacity over loaded edges."],
  ["EI — Equity Index: ", "Gini coefficient of individual clearance times (0 = perfectly equal)."],
  ["SCP — Survival Completion Percentage: ", "% of agents surviving (reaching safety or sheltering)."],
].map(([h, t]) => bullet([run(h, { bold: true }), run(t)])));
body.push(H2("Appendix C — Reproducibility"));
body.push(P("The experiment is deterministic per seed. Running scripts/run_experiment.py regenerates every per-run JSON, the aggregate summary, and the full statistics (ANOVA + Tukey HSD) from scratch using the fixed seed list 42–71."));
body.push(new Paragraph({ spacing: { before: 360 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Honor Pledge — “We accept responsibility for our role in ensuring the integrity of the work submitted by the group in which we participated.”", italics: true, size: 20, color: GREY })] }));

// =====================================================================
//  DOCUMENT
// =====================================================================
const doc = new Document({
  creator: "EvacuWay", title: "EvacuWay Project Documentation",
  numbering,
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal",
        run: { size: 44, bold: true, color: NAVY, font: "Calibri" }, paragraph: { alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: NAVY, font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: BLUE, font: "Calibri" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, color: "404040", font: "Calibri" }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9", space: 4 } },
      children: [new TextRun({ text: "EvacuWay — Metro Manila Evacuation Routing Simulation", size: 16, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Page ", size: 18, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GREY }),
        new TextRun({ text: " of ", size: 18, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GREY })] })] }) },
    children: body,
  }],
});

const outDir = path.join(__dirname, "..", "docs");
const out = path.join(outDir, "EvacuWay_Project_Documentation.docx");
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("Wrote", out, "(" + buf.length + " bytes)"); });
