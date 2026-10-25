/**
 * Vite config for the Capacitor / Android static build.
 * Builds a self-contained SPA into dist-mobile/ (no server).
 */
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  // Project root so Tailwind scans all of src/ (components, styles, etc.)
  base: "./",
  publicDir: resolve(__dirname, "public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist-mobile"),
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
    rollupOptions: {
      input: resolve(__dirname, "src/mobile/index.html"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8090,
  },
});