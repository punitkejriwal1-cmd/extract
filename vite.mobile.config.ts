/**
 * Vite config for the Capacitor / Android static build.
 * Output must be dist-mobile/index.html (Capacitor requirement).
 */
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

const srcDir = resolve(__dirname, "src");
const mobileDir = resolve(srcDir, "mobile");

export default defineConfig({
  root: mobileDir,
  base: "./",
  publicDir: resolve(__dirname, "public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": srcDir,
    },
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