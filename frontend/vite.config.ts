import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EvacuWay dashboard — Vite config. No auth, no env secrets required.
export default defineConfig({
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
