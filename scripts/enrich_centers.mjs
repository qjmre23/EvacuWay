/**
 * Enrich the bundled network_data.json evacuation centres with display fields
 * the dashboard and PDF export need: a deterministic shelter `capacity`,
 * a `district` label, and `source`/`official` flags.
 *
 * `capacity` mirrors backend/data_loader.center_display_capacity() (same stable
 * hash) so the offline snapshot and live API agree. The Marikina seed centres
 * are honestly tagged source="xlsx" (rendered green; the CDRA tag is reserved
 * for source="cdra" data).
 *
 * Usage:  node scripts/enrich_centers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NET = path.join(ROOT, "frontend", "public", "network_data.json");

const CAP_BASE = 2200;
function stableHash(s) {
  let x = 5381;
  for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0;
  return x;
}
function displayCapacity(nodeId) {
  const factor = 0.6 + 0.8 * ((stableHash(String(nodeId)) % 1000) / 1000);
  return Math.round((CAP_BASE * factor) / 50) * 50;
}

const net = JSON.parse(fs.readFileSync(NET, "utf8"));
for (const c of net.centers) {
  c.source = c.source || "xlsx";
  c.official = c.official ?? true; // designated evacuation centre (rendered green)
  c.district = c.district || c.barangay || "Marikina";
  c.capacity = c.capacity || displayCapacity(c.node_id);
}
fs.writeFileSync(NET, JSON.stringify(net));
const cap = net.centers.reduce((s, c) => s + c.capacity, 0);
console.log(`enriched ${net.centers.length} centres · total capacity ${cap.toLocaleString()} persons`);
