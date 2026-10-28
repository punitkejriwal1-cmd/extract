import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for the 1% habit tracker.
 *
 * webDir points at the static client build that we produce for mobile.
 * See scripts/build-mobile.mjs and the "build:mobile" npm script.
 */
const config: CapacitorConfig = {
  appId: "com.onepercent.habits",
  appName: "Timetable",
  webDir: "dist-mobile",
  server: {
    // Uncomment for live-reload against a local dev server while developing:
    // url: "http://YOUR_LAN_IP:8080",
    // cleartext: true,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0f1115",
  },
  plugins: {
    Keyboard: { resize: "body" },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0f1115",
    },
  },
};

export default config;
