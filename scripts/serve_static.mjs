/**
 * Minimal static server for verifying route geometry on a real OSM basemap.
 * Serves frontend/public at / and the local Leaflet dist at /vendor/leaflet/.
 * Not part of the app — used only by the screenshot verification harness.
 *
 * Usage:  node scripts/serve_static.mjs [port]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2] || 5181);
// Optional root: "public" (verifier, default) or "dist" (built app).
const ROOT_DIR = process.argv[3] || "public";
const PUBLIC = path.join(ROOT, "frontend", ROOT_DIR);
const LEAFLET = path.join(ROOT, "frontend", "node_modules", "leaflet", "dist");
const INDEX = ROOT_DIR === "dist" ? "/index.html" : "/route_verify.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".map": "application/json; charset=utf-8",
};

function send(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found: " + file);
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}

http
  .createServer((req, res) => {
    let url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (url === "/") url = INDEX;
    if (url.startsWith("/vendor/leaflet/")) {
      send(res, path.join(LEAFLET, url.replace("/vendor/leaflet/", "")));
      return;
    }
    const safe = path.normalize(url).replace(/^(\.\.[/\\])+/, "");
    send(res, path.join(PUBLIC, safe));
  })
  .listen(PORT, () => console.log(`verify server on http://localhost:${PORT}`));
