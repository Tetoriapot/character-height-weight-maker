import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: fileURLToPath(new URL("./web", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  base: process.env.PAGES_BASE_PATH || "/character-height-weight-maker/",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
