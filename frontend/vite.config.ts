import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EvacuWay dashboard — Vite config. No auth, no env secrets required.
// `base: "./"` emits relative asset/data paths so the same build works when
// served from a subpath (GitHub Pages /EvacuWay/) and from the Android WebView
// (file:///android_asset/www/index.html), in addition to the root dev server.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
