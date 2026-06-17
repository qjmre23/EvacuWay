/**
 * Independent audit: prove that every segment of every bundled route lies on a
 * real OSM road edge (not a straight line across blocks).
 *
 * For each consecutive pair of vertices in every route we classify the segment:
 *   - "edge"      both vertices are road-graph nodes joined by a real edge
 *   - "endpoint"  a short (<=50 m) connector from the kept origin/centre marker
 *                 to the nearest road node (first or last segment only)
 *   - "VIOLATION" anything else — a segment that does not follow a road
 *
 * Exit code is non-zero if any violation is found.
 *
 * Usage:  node scripts/verify_on_road.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GRAPH = path.join(ROOT, "data", "marikina_road_network.json");
const ROUTES = path.join(ROOT, "frontend", "public", "sample_routes.json");

const R = 6_371_000.0;
const rad = (d) => (d * Math.PI) / 180;
const hav = (a, b, c, d) => {
  const dphi = rad(c - a), dl = rad(d - b);
  const x = Math.sin(dphi / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const art = JSON.parse(fs.readFileSync(GRAPH, "utf8"));
const edgeSet = new Set();
for (const [a, b] of art.edges) edgeSet.add(a < b ? `${a}|${b}` : `${b}|${a}`);

// Spatial grid of road nodes so we can match a route vertex to its node by
// distance (robust to last-digit rounding differences in stored coords).
const CELL = 0.001;
const gkey = (la, lo) => `${Math.floor(la / CELL)}:${Math.floor(lo / CELL)}`;
const grid = new Map();
const NID = [], NLA = [], NLO = [];
for (const [id, [la, lo]] of Object.entries(art.nodes)) {
  const idx = NID.length;
  NID.push(id); NLA.push(la); NLO.push(lo);
  const kk = gkey(la, lo);
  let arr = grid.get(kk);
  if (!arr) grid.set(kk, (arr = []));
  arr.push(idx);
}
// Return the road-node id within `tol` metres of (lat,lon), or null.
function nodeAt(lat, lon, tol = 1.5) {
  const ci = Math.floor(lat / CELL), cj = Math.floor(lon / CELL);
  let best = null, bestD = tol;
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++)
      for (const idx of grid.get(`${ci + di}:${cj + dj}`) || []) {
        const d = hav(lat, lon, NLA[idx], NLO[idx]);
        if (d <= bestD) { bestD = d; best = NID[idx]; }
      }
  return best;
}

const ENDPOINT_MAX_M = 50;
const data = JSON.parse(fs.readFileSync(ROUTES, "utf8"));

let segs = 0, edges = 0, endpoints = 0, violations = 0;
let maxEndpoint = 0;
const offenders = [];

for (const key of Object.keys(data)) {
  for (const r of data[key].routes) {
    const c = r.coords;
    if (!c || c.length < 2) continue;
    for (let i = 1; i < c.length; i++) {
      segs++;
      const A = c[i - 1], B = c[i];
      const idA = nodeAt(A[0], A[1]);
      const idB = nodeAt(B[0], B[1]);
      const len = hav(A[0], A[1], B[0], B[1]);
      if (idA && idB && edgeSet.has(idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`)) {
        edges++;
        continue;
      }
      // permitted short connector at the very start or very end of the line
      const isEndpointSeg = i === 1 || i === c.length - 1;
      if (isEndpointSeg && len <= ENDPOINT_MAX_M) {
        endpoints++;
        if (len > maxEndpoint) maxEndpoint = len;
        continue;
      }
      violations++;
      if (offenders.length < 15)
        offenders.push({ key, origin: r.origin, segIndex: i, len: Math.round(len), A, B });
    }
  }
}

console.log(`scenarios: ${Object.keys(data).length}`);
console.log(`total segments: ${segs}`);
console.log(`  on real road edge : ${edges} (${((100 * edges) / segs).toFixed(2)}%)`);
console.log(`  endpoint connector: ${endpoints} (max ${maxEndpoint.toFixed(1)} m)`);
console.log(`  VIOLATIONS        : ${violations}`);
if (violations) {
  console.log("\nfirst offenders:");
  for (const o of offenders) console.log("  ", JSON.stringify(o));
  process.exitCode = 1;
} else {
  console.log("\nPASS — every route segment follows a real road (or is a <=50 m marker connector).");
}
