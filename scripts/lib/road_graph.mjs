/**
 * EvacuWay — road-graph routing used to snap simulation routes onto real OSM
 * roads. Mirrors `backend/road_snap.py` (same artifact, same algorithm) so the
 * bundled frontend data and the live API produce identical road-following
 * polylines.
 *
 * Pipeline:
 *   loadRoadGraph(file) -> { route(a,b), snapPath(coords) }
 *
 *   - route([latA,lonA],[latB,lonB])  shortest road polyline between the two
 *     points (each snapped to the nearest road-graph node), as [[lat,lon],...].
 *   - snapPath([[lat,lon],...])  takes a simulation node sequence and returns a
 *     single continuous polyline that follows roads through every waypoint.
 */
import fs from "node:fs";

const R = 6_371_000.0;
const toRad = (d) => (d * Math.PI) / 180;

export function haversine(lat1, lon1, lat2, lon2) {
  const dphi = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Minimal binary min-heap keyed by numeric priority.
class MinHeap {
  constructor() {
    this.k = []; // priorities
    this.v = []; // payloads (node indices)
  }
  get size() {
    return this.k.length;
  }
  push(key, val) {
    const k = this.k, v = this.v;
    let i = k.length;
    k.push(key); v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= k[i]) break;
      [k[p], k[i]] = [k[i], k[p]];
      [v[p], v[i]] = [v[i], v[p]];
      i = p;
    }
  }
  pop() {
    const k = this.k, v = this.v;
    const top = v[0];
    const lastK = k.pop(), lastV = v.pop();
    if (k.length) {
      k[0] = lastK; v[0] = lastV;
      let i = 0;
      const n = k.length;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let s = i;
        if (l < n && k[l] < k[s]) s = l;
        if (r < n && k[r] < k[s]) s = r;
        if (s === i) break;
        [k[s], k[i]] = [k[i], k[s]];
        [v[s], v[i]] = [v[i], v[s]];
        i = s;
      }
    }
    return top;
  }
}

export function loadRoadGraph(file) {
  const art = JSON.parse(fs.readFileSync(file, "utf8"));

  // Index nodes 0..n-1 for compact arrays.
  const idList = Object.keys(art.nodes);
  const n = idList.length;
  const lat = new Float64Array(n);
  const lon = new Float64Array(n);
  const idx = new Map();
  for (let i = 0; i < n; i++) {
    idx.set(idList[i], i);
    const c = art.nodes[idList[i]];
    lat[i] = c[0];
    lon[i] = c[1];
  }

  // CSR-style adjacency (undirected).
  const deg = new Int32Array(n);
  for (const [a, b] of art.edges) {
    const ia = idx.get(a), ib = idx.get(b);
    if (ia === undefined || ib === undefined) continue;
    deg[ia]++; deg[ib]++;
  }
  const head = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) head[i + 1] = head[i] + deg[i];
  const m = head[n];
  const to = new Int32Array(m);
  const w = new Float64Array(m);
  const cur = head.slice(0, n);
  for (const [a, b] of art.edges) {
    const ia = idx.get(a), ib = idx.get(b);
    if (ia === undefined || ib === undefined) continue;
    const d = haversine(lat[ia], lon[ia], lat[ib], lon[ib]);
    to[cur[ia]] = ib; w[cur[ia]] = d; cur[ia]++;
    to[cur[ib]] = ia; w[cur[ib]] = d; cur[ib]++;
  }

  // Spatial grid for nearest-node queries (~110m cells).
  const CELL = 0.001;
  const key = (la, lo) => `${Math.floor(la / CELL)}:${Math.floor(lo / CELL)}`;
  const grid = new Map();
  for (let i = 0; i < n; i++) {
    const kk = key(lat[i], lon[i]);
    let arr = grid.get(kk);
    if (!arr) grid.set(kk, (arr = []));
    arr.push(i);
  }

  function nearest(la, lo) {
    const ci = Math.floor(la / CELL);
    const cj = Math.floor(lo / CELL);
    let best = -1;
    let bestD = Infinity;
    // Expand search rings until something is found, then one extra ring for safety.
    for (let ring = 0; ring <= 40; ring++) {
      for (let di = -ring; di <= ring; di++) {
        for (let dj = -ring; dj <= ring; dj++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue; // ring shell only
          const arr = grid.get(`${ci + di}:${cj + dj}`);
          if (!arr) continue;
          for (const i of arr) {
            const d = haversine(la, lo, lat[i], lon[i]);
            if (d < bestD) { bestD = d; best = i; }
          }
        }
      }
      if (best >= 0 && ring >= 1) break;
    }
    return best;
  }

  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const stamp = new Int32Array(n); // visited generation marker
  let gen = 0;

  // Dijkstra from src to dst; returns array of node indices (path) or null.
  function shortest(src, dst) {
    if (src === dst) return [src];
    gen++;
    const heap = new MinHeap();
    dist[src] = 0;
    prev[src] = -1;
    stamp[src] = gen;
    heap.push(0, src);
    while (heap.size) {
      const u = heap.pop();
      if (u === dst) break;
      const du = dist[u];
      for (let e = head[u]; e < head[u + 1]; e++) {
        const v = to[e];
        const nd = du + w[e];
        if (stamp[v] !== gen || nd < dist[v]) {
          dist[v] = nd;
          prev[v] = u;
          stamp[v] = gen;
          heap.push(nd, v);
        }
      }
    }
    if (stamp[dst] !== gen) return null;
    const path = [];
    for (let v = dst; v !== -1; v = prev[v]) {
      path.push(v);
      if (v === src) break;
    }
    path.reverse();
    return path;
  }

  const cache = new Map();
  function routeNodes(srcIdx, dstIdx) {
    const ck = `${srcIdx}>${dstIdx}`;
    if (cache.has(ck)) return cache.get(ck);
    const p = shortest(srcIdx, dstIdx);
    cache.set(ck, p);
    return p;
  }

  // Dijkstra from src that stops at the first node found in `targets` (a Set of
  // node indices). Returns { path, target } for the nearest-by-road target.
  function shortestToSet(src, targets) {
    if (targets.has(src)) return { path: [src], target: src };
    gen++;
    const heap = new MinHeap();
    dist[src] = 0;
    prev[src] = -1;
    stamp[src] = gen;
    heap.push(0, src);
    let hit = -1;
    while (heap.size) {
      const u = heap.pop();
      if (targets.has(u)) { hit = u; break; }
      const du = dist[u];
      for (let e = head[u]; e < head[u + 1]; e++) {
        const v = to[e];
        const nd = du + w[e];
        if (stamp[v] !== gen || nd < dist[v]) {
          dist[v] = nd;
          prev[v] = u;
          stamp[v] = gen;
          heap.push(nd, v);
        }
      }
    }
    if (hit < 0) return { path: null, target: -1 };
    const path = [];
    for (let v = hit; v !== -1; v = prev[v]) {
      path.push(v);
      if (v === src) break;
    }
    path.reverse();
    return { path, target: hit };
  }

  const coordOf = (i) => [round6(lat[i]), round6(lon[i])];
  const nodesToCoords = (p) => p.map(coordOf);
  function pathLen(p) {
    let L = 0;
    for (let i = 1; i < p.length; i++) L += haversine(lat[p[i - 1]], lon[p[i - 1]], lat[p[i]], lon[p[i]]);
    return L;
  }

  function route(a, b) {
    const s = nearest(a[0], a[1]);
    const t = nearest(b[0], b[1]);
    if (s < 0 || t < 0) return [a, b];
    const p = routeNodes(s, t);
    if (!p) return [a, b];
    return p.map((i) => [round6(lat[i]), round6(lon[i])]);
  }

  /**
   * Snap a simulation node sequence onto roads. Each consecutive pair of
   * waypoints is routed on the road graph and the road polylines are stitched
   * into one continuous line. The original first/last points are preserved as
   * the line's true endpoints (origin marker / evacuation centre).
   */
  function snapPath(coords, opts = {}) {
    if (!Array.isArray(coords) || coords.length < 2) return coords;
    const maxSnapM = opts.maxSnapMeters ?? 350; // ignore waypoints too far from any road
    // Snap every waypoint to a road node, dropping ones with no nearby road.
    const snapped = [];
    for (const c of coords) {
      const ni = nearest(c[0], c[1]);
      if (ni < 0) continue;
      if (haversine(c[0], c[1], lat[ni], lon[ni]) > maxSnapM) continue;
      if (snapped.length && snapped[snapped.length - 1] === ni) continue;
      snapped.push(ni);
    }
    if (snapped.length < 2) return coords;

    const out = [[round6(coords[0][0]), round6(coords[0][1])]];
    for (let i = 0; i < snapped.length - 1; i++) {
      const p = routeNodes(snapped[i], snapped[i + 1]);
      if (!p) {
        // disconnected: jump straight to the next snapped node
        out.push([round6(lat[snapped[i + 1]]), round6(lon[snapped[i + 1]])]);
        continue;
      }
      for (let j = 1; j < p.length; j++) {
        out.push([round6(lat[p[j]]), round6(lon[p[j]])]);
      }
    }
    const last = coords[coords.length - 1];
    out.push([round6(last[0]), round6(last[1])]);
    return dedupe(out);
  }

  return {
    route,
    snapPath,
    nearest,
    coordOf,
    nodesToCoords,
    pathLen,
    shortestNodes: routeNodes,
    shortestToSet,
    haversine,
    _n: n,
    _m: m,
  };
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
