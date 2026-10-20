import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Showcase kit bundle: react/demo/src/kit.tsx → showcase/kit/kit.js + kit.css (stable names, no hash), run by
// bin/build (`bun x vite build --config vite.kit.config.ts` in react/demo). The showcase lazy-loads it when the
// Kit picker says "primer". Demo content only — nothing here is vendored to consumers (see docs/SDD.md §4).
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "tailor-react": here("../src/index.ts") } },
  base: "./",
  logLevel: "warn",
  build: {
    outDir: here("../../showcase/kit"),
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    lib: { entry: here("src/kit.tsx"), formats: ["iife"], name: "TailorKitBundle", fileName: () => "kit.js", cssFileName: "kit" },
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
