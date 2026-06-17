import { jsPDF } from "jspdf";
import autoTableFn from "jspdf-autotable";
import type { Center, FloodLevel, Strategy } from "../types";

// jspdf-autotable can be consumed either functionally — autoTable(doc, opts) —
// or as a jsPDF plugin method — doc.autoTable(opts) — depending on the module
// interop. Support both so the export works in every bundler/runtime.
function runAutoTable(doc: jsPDF, opts: Record<string, unknown>) {
  const fn = autoTableFn as unknown as (d: jsPDF, o: Record<string, unknown>) => void;
  if (typeof fn === "function") fn(doc, opts);
  else (doc as unknown as { autoTable: (o: Record<string, unknown>) => void }).autoTable(opts);
}

interface Context {
  strategy?: Strategy;
  flood?: FloodLevel;
  studyArea?: string;
}

const STRAT_NAME: Record<Strategy, string> = {
  A: "A · Dijkstra (shortest-path)",
  B: "B · Frank-Wolfe (capacity-aware)",
  C: "C · Zone-Sequential (phased)",
};

/**
 * Download a rich PDF directory of every evacuation centre — name, district,
 * capacity, elevation, coordinates and data source — plus the current scenario
 * context. Used by the dashboard's "Download PDF" button.
 */
export function exportCentersPdf(centers: Center[], ctx: Context = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const now = new Date();

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("EvacuWay — Evacuation Centre Directory", 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const sub = [
    ctx.studyArea || "Metro Manila (NCR) · Marikina prototype network",
    `Generated ${now.toLocaleString()}`,
  ];
  if (ctx.strategy) sub.push(`Routing strategy: ${STRAT_NAME[ctx.strategy]}`);
  if (ctx.flood) sub.push(`Flood severity: ${ctx.flood}`);
  doc.text(sub.join("   ·   "), 40, 58);

  const official = centers.filter((c) => c.official ?? c.source === "cdra").length;
  const totalCap = centers.reduce((s, c) => s + (c.capacity || 0), 0);
  doc.text(
    `${centers.length} centres  ·  ${official} official QC CDRA 2023  ·  ` +
      `total capacity ${totalCap.toLocaleString()} persons`,
    40,
    74
  );

  const body = centers
    .slice()
    .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
    .map((c, i) => [
      String(i + 1),
      c.name || c.barangay || "—",
      c.district || c.barangay || "—",
      c.capacity ? c.capacity.toLocaleString() : "—",
      c.elevation != null ? `${c.elevation} m` : "—",
      `${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}`,
      (c.official ?? c.source === "cdra") ? "Official CDRA 2023" : "Prototype (XLSX)",
    ]);

  runAutoTable(doc, {
    startY: 88,
    head: [["#", "Centre", "District / Barangay", "Capacity", "Elevation", "Lat, Lon", "Source"]],
    body,
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 26 }, 5: { cellWidth: 120 } },
    didDrawPage: (data: { settings: { margin: { left: number } } }) => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `EvacuWay evacuation directory · page ${page}`,
        data.settings.margin.left,
        doc.internal.pageSize.getHeight() - 14
      );
    },
  });

  doc.save(`evacuway_centres_${now.toISOString().slice(0, 10)}.pdf`);
}
