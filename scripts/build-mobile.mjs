#!/usr/bin/env node
/**
 * Build the static SPA for Capacitor and copy the habit service worker.
 *
 * Usage: node scripts/build-mobile.mjs
 * Then:  npx cap sync android
 */
import { build } from "vite";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist-mobile");
const publicSw = resolve(root, "public/habit-sw.js");
const destSw = resolve(outDir, "habit-sw.js");

console.log("[build-mobile] Building Capacitor SPA…");

await build({
  configFile: resolve(root, "vite.mobile.config.ts"),
  logLevel: "info",
});

if (existsSync(publicSw)) {
  mkdirSync(outDir, { recursive: true });
  copyFileSync(publicSw, destSw);
  console.log("[build-mobile] Copied habit-sw.js");
}

console.log("[build-mobile] Done → dist-mobile/");
console.log("[build-mobile] Next: npx cap sync android");
