/**
 * Vite config used only for the Capacitor / Android static build.
 * Produces a self-contained SPA in dist-mobile/ with no Nitro / SSR.
 */
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "src/mobile"),
  base: "./",
  publicDir: resolve(__dirname, "public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: resolve(__dirname, "dist-mobile"),
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
  },
  server: {
    host: "0.0.0.0",
    port: 8090,
  },
});
