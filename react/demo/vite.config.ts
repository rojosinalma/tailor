import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Demo app for the tailor React adapter (CSS path): tailor markup + the
// bootstrap skin + the dracula palette, all imported from the repo itself.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "tailor-react": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
  server: {
    fs: { allow: [fileURLToPath(new URL("../..", import.meta.url))] },
  },
});
