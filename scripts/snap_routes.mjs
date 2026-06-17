/**
 * EvacuWay — rewrite the bundled dashboard route geometry so every route
 * follows real OSM roads instead of cutting straight across blocks.
 *
 * Reads  : frontend/public/sample_routes.json   (simulation routes, all 9 scenarios)
 *          frontend/public/network_data.json     (evacuation centres, for fallback)
 *          data/marikina_road_network.json       (compiled road graph)
 * Writes : frontend/public/sample_routes.json    (coords replaced by road polylines)
 *          frontend/public/sample_routes.raw.json (one-time backup of the original)
 *
 * For each route the origin and its strategy-assigned evacuation centre are
 * snapped to the road graph and connected by the shortest road path. If that
 * path is implausible (the abstract prototype graph occasionally pairs an origin
 * with a centre that is across the Marikina River), the route falls back to the
 * nearest centre *by road* so the drawn line is always sensible and on-street.
 *
 * Usage:  node scripts/snap_routes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRoadGraph } from "./lib/road_graph.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTES = path.join(ROOT, "frontend", "public", "sample_routes.json");
const RAW = path.join(ROOT, "frontend", "public", "sample_routes.raw.json");
const NETWORK = path.join(ROOT, "frontend", "public", "network_data.json");
const GRAPH = path.join(ROOT, "data", "marikina_road_network.json");

// Tuning for the implausible-assignment guard.
const GUARD_MIN_LEN_M = 900; // only second-guess routes longer than this
const GUARD_MAX_DETOUR = 4.0; // ... whose road length exceeds 4x the straight line
const KEEP_ENDPOINT_M = 45; // keep the original marker endpoint if it is this close to a road

function main() {
  const g = loadRoadGraph(GRAPH);
  const net = JSON.parse(fs.readFileSync(NETWORK, "utf8"));

  // Snap every evacuation centre to a road node -> fallback target set.
  const centerSet = new Set();
  for (const c of net.centers) {
    const ni = g.nearest(c.lat, c.lon);
    if (ni >= 0) centerSet.add(ni);
  }

  // One-time backup of the original straight-line routes.
  if (!fs.existsSync(RAW)) fs.copyFileSync(ROUTES, RAW);
  const data = JSON.parse(fs.readFileSync(RAW, "utf8"));

  const stats = { routes: 0, snapped: 0, fallback: 0, failed: 0, detours: [] };

  for (const key of Object.keys(data)) {
    for (const r of data[key].routes) {
      stats.routes++;
      const out = snapRoute(g, centerSet, r.coords, stats);
      if (out) r.coords = out;
    }
  }

  fs.writeFileSync(ROUTES, JSON.stringify(data));

  stats.detours.sort((a, b) => a - b);
  const q = (p) => stats.detours[Math.floor(stats.detours.length * p)]?.toFixed(2);
  console.log(
    `routes: ${stats.routes} | road-snapped: ${stats.snapped} | ` +
      `nearest-centre fallback: ${stats.fallback} | unroutable kept: ${stats.failed}`
  );
  console.log(
    `detour after snap  median ${q(0.5)}  p90 ${q(0.9)}  p99 ${q(0.99)}  max ${stats.detours.at(-1)?.toFixed(2)}`
  );
}

function snapRoute(g, centerSet, coords, stats) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const origin = coords[0];
  const dest = coords[coords.length - 1];

  const oNode = g.nearest(origin[0], origin[1]);
  const dNode = g.nearest(dest[0], dest[1]);
  if (oNode < 0 || dNode < 0) {
    stats.failed++;
    return null;
  }

  const straight = Math.max(g.haversine(origin[0], origin[1], dest[0], dest[1]), 1);
  let pathNodes = g.shortestNodes(oNode, dNode);
  let usedFallback = false;

  const len = pathNodes ? g.pathLen(pathNodes) : Infinity;
  const implausible = !pathNodes || (len > GUARD_MIN_LEN_M && len / straight > GUARD_MAX_DETOUR);
  if (implausible && centerSet.size) {
    const alt = g.shortestToSet(oNode, centerSet);
    if (alt.path && (!pathNodes || g.pathLen(alt.path) < len)) {
      pathNodes = alt.path;
      usedFallback = true;
    }
  }

  if (!pathNodes || pathNodes.length < 1) {
    stats.failed++;
    return null;
  }

  // Build the polyline along the road. Keep the original marker endpoints only
  // when they sit essentially on the road, so we never draw a spur across a block.
  const line = g.nodesToCoords(pathNodes);
  const startSnap = g.haversine(origin[0], origin[1], line[0][0], line[0][1]);
  const endSnap = g.haversine(dest[0], dest[1], line.at(-1)[0], line.at(-1)[1]);
  const final = [];
  if (startSnap <= KEEP_ENDPOINT_M) final.push([round6(origin[0]), round6(origin[1])]);
  for (const c of line) final.push(c);
  if (!usedFallback && endSnap <= KEEP_ENDPOINT_M) final.push([round6(dest[0]), round6(dest[1])]);

  const deduped = dedupe(final);
  if (deduped.length < 2) return null;

  usedFallback ? stats.fallback++ : stats.snapped++;
  const fl = g.pathLen(pathNodes);
  if (straight > 50) stats.detours.push(fl / straight);
  return deduped;
}

function round6(x) {
  return Math.round(x * 1e6) / 1e6;
}

function dedupe(coords) {
  const out = [];
  for (const c of coords) {
    const p = out[out.length - 1];
    if (p && p[0] === c[0] && p[1] === c[1]) continue;
    out.push(c);
  }
  return out;
}

main();
