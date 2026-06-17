/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        panel: "#111827",
        stratA: "#2563eb",
        stratB: "#f59e0b",
        stratC: "#dc2626",
      },
    },
  },
  plugins: [],
};
