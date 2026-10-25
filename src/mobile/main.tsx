/**
 * Capacitor / mobile entry — pure client SPA that only boots the habit Tracker.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Tracker } from "@/components/tracker/tracker";
import "@/styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

createRoot(rootEl).render(
  <StrictMode>
    <Tracker />
  </StrictMode>,
);