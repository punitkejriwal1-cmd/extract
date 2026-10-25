#!/usr/bin/env node
/**
 * Build the static SPA for Capacitor and copy the habit service worker.
 */
import { build } from "vite";
import { copyFileSync, mkdirSync, existsSync, readdirSync, renameSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
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

const flat = resolve(outDir, "index.html");

if (!existsSync(flat)) {
  function findIndex(dir) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name);
      if (name.isFile() && name.name === "index.html") return p;
      if (name.isDirectory()) {
        const found = findIndex(p);
        if (found) return found;
      }
    }
    return null;
  }
  const found = findIndex(outDir);
  if (found && found !== flat) {
    console.log("[build-mobile] Moving", found, "→ dist-mobile/index.html");
    renameSync(found, flat);
  }
}

if (!existsSync(flat)) {
  console.error("[build-mobile] ERROR: dist-mobile/index.html was not created.");
  process.exit(1);
}

if (existsSync(publicSw)) {
  mkdirSync(outDir, { recursive: true });
  copyFileSync(publicSw, destSw);
  console.log("[build-mobile] Copied habit-sw.js");
}

console.log("[build-mobile] OK →", flat);