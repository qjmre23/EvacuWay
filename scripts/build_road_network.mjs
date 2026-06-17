/**
 * EvacuWay — compile a raw Overpass `out geom` dump into a compact, reusable
 * road-network artifact used to snap simulation routes onto real OSM roads.
 *
 * Input  : data/osm_cache/marikina_overpass.json   (Overpass `[out:json]; out geom;`)
 * Output : data/marikina_road_network.json
 *
 *   {
 *     "bbox":  [min_lat, min_lon, max_lat, max_lon],
 *     "nodes": { "<osm_node_id>": [lat, lon], ... },
 *     "edges": [ ["<id_a>", "<id_b>"], ... ]        // undirected road segments
 *   }
 *
 * The same artifact is consumed by `scripts/lib/road_graph.mjs` (Node, for
 * regenerating the bundled frontend data) and by `backend/road_snap.py`
 * (Python, for live `/api/simulate` route geometry) so both produce identical
 * road-following polylines.
 *
 * Usage:  node scripts/build_road_network.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "data", "osm_cache", "marikina_overpass.json");
const OUT = path.join(ROOT, "data", "marikina_road_network.json");

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const ways = raw.elements.filter((e) => e.type === "way" && Array.isArray(e.nodes));

  /** @type {Map<string,[number,number]>} */
  const nodes = new Map();
  /** @type {Set<string>} */
  const edgeKeys = new Set();
  /** @type {Array<[string,string]>} */
  const edges = [];

  let minLat = Infinity, minLon = Infinity, maxLat = -Infinity, maxLon = -Infinity;

  for (const w of ways) {
    const ids = w.nodes;
    const geom = w.geometry || [];
    if (ids.length !== geom.length) continue; // geometry/ids mismatch -> skip
    for (let i = 0; i < ids.length; i++) {
      const id = String(ids[i]);
      const g = geom[i];
      if (!g) continue;
      nodes.set(id, [g.lat, g.lon]);
      if (g.lat < minLat) minLat = g.lat;
      if (g.lat > maxLat) maxLat = g.lat;
      if (g.lon < minLon) minLon = g.lon;
      if (g.lon > maxLon) maxLon = g.lon;
    }
    // Build undirected edges between consecutive way vertices.
    for (let i = 0; i < ids.length - 1; i++) {
      const a = String(ids[i]);
      const b = String(ids[i + 1]);
      if (a === b) continue;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push([a, b]);
    }
  }

  // Keep only the largest connected component so every snapped point is
  // guaranteed routable (small disconnected service-road / gated islands would
  // otherwise force a straight-line fallback that ignores roads).
  const { keepNodes, keepEdges } = largestComponent(nodes, edges);

  const prunedNodes = {};
  for (const id of keepNodes) prunedNodes[id] = nodes.get(id);

  const artifact = {
    bbox: [minLat, minLon, maxLat, maxLon],
    nodes: prunedNodes,
    edges: keepEdges,
  };
  fs.writeFileSync(OUT, JSON.stringify(artifact));
  console.log(
    `road network: ${keepNodes.length}/${nodes.size} nodes, ` +
      `${keepEdges.length}/${edges.length} edges (largest component) -> ${path.relative(ROOT, OUT)}`
  );
  console.log(`bbox: ${artifact.bbox.map((x) => x.toFixed(5)).join(", ")}`);
}

/** Return the node ids and edges of the largest connected component. */
function largestComponent(nodes, edges) {
  const adj = new Map();
  for (const id of nodes.keys()) adj.set(id, []);
  for (const [a, b] of edges) {
    if (!adj.has(a) || !adj.has(b)) continue;
    adj.get(a).push(b);
    adj.get(b).push(a);
  }
  const comp = new Map();
  let best = [];
  let cid = 0;
  for (const start of adj.keys()) {
    if (comp.has(start)) continue;
    const stack = [start];
    comp.set(start, cid);
    const members = [];
    while (stack.length) {
      const u = stack.pop();
      members.push(u);
      for (const v of adj.get(u)) {
        if (!comp.has(v)) {
          comp.set(v, cid);
          stack.push(v);
        }
      }
    }
    if (members.length > best.length) best = members;
    cid++;
  }
  const keep = new Set(best);
  const keepEdges = edges.filter(([a, b]) => keep.has(a) && keep.has(b));
  return { keepNodes: best, keepEdges };
}

main();
