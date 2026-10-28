import { useState } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import {
  copyText,
  exportDataJson,
  importDataJson,
  scheduleAllHabitNotifications,
} from "@/lib/habits";

const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useHabits((s) => s.data);
  const prefs = useHabits((s) => s.prefs);
  const setPrefs = useHabits((s) => s.setPrefs);
  const showToast = useHabits((s) => s.showToast);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const percent = Math.round(prefs.fontScale * 100);
  const previous = prefs.visibleDays - 1;

  async function handleExport() {
    const json = exportDataJson(data);
    const ok = await copyText(json);
    if (ok) {
      showToast("Backup copied — paste into Notes or Files to save");
    } else {
      // last resort: show text so user can long-press copy
      setImportText(json);
      setImportOpen(true);
      showToast("Select all text below and copy it");
    }
  }

  async function handleImport() {
    const raw = importText.trim();
    if (!raw) {
      showToast("Paste your backup text first");
      return;
    }
    const imported = importDataJson(raw);
    if (!imported) {
      showToast("Invalid backup — check the text");
      return;
    }
    useHabits.getState().mutate((d) => {
      d.habits = imported.habits;
      d.logs = imported.logs;
      d.reasonsList = imported.reasonsList;
    });
    await scheduleAllHabitNotifications(imported);
    setImportOpen(false);
    setImportText("");
    showToast(`Imported ${imported.habits.length} habits`);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Settings"
    >
      <section className="space-y-3 rounded-xl bg-chip p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">Text size</h3>
          <span className="font-mono text-xs font-bold text-accent tabular-nums">{percent}%</span>
        </div>
        <p className="text-sm text-pretty text-muted">
          Shrink habit text so a longer list still fits in one screenshot.
        </p>
        <input
          type="range"
          min={60}
          max={100}
          step={5}
          value={percent}
          aria-label="Habit text size"
          className="w-full"
          onChange={(e) => setPrefs({ fontScale: Number(e.target.value) / 100 })}
        />
        <div className="flex items-center justify-between text-xs font-bold text-muted">
          <span>Smaller</span>
          <span>Default</span>
        </div>
      </section>

      <section className="mt-3 space-y-3 rounded-xl bg-chip p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">Days on home</h3>
          <span className="font-mono text-xs font-bold text-accent tabular-nums">{prefs.visibleDays}</span>
        </div>
        <p className="text-sm text-pretty text-muted">
          {prefs.visibleDays === 1
            ? "Only today is shown."
            : `Today and the previous ${previous} day${previous === 1 ? "" : "s"}.`}
        </p>
        <div className="grid grid-cols-7 gap-1">
          {DAY_CHOICES.map((count) => {
            const active = prefs.visibleDays === count;
            return (
              <button
                key={count}
                type="button"
                aria-pressed={active}
                aria-label={`Show ${count} day${count === 1 ? "" : "s"}`}
                onClick={() => setPrefs({ visibleDays: count })}
                className={cn(
                  "min-h-11 rounded-lg border text-sm font-extrabold",
                  active ? "border-accent bg-accent text-accent-fg" : "border-line bg-raised text-muted",
                )}
              >
                {count}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-3 space-y-3 rounded-xl bg-chip p-3">
        <h3 className="text-sm font-bold text-ink">Backup</h3>
        <p className="text-sm text-pretty text-muted">
          Before updating the app, tap Export. Your habits are copied so you can paste them into Notes or a file. After
          installing the new APK, open Import, paste the text, and restore.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-fg"
            onClick={() => void handleExport()}
          >
            Export (copy)
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-partial text-sm font-bold text-partial-fg"
            onClick={() => {
              setImportText("");
              setImportOpen(true);
            }}
          >
            Import (paste)
          </button>
        </div>
        {importOpen ? (
          <div className="space-y-2">
            <textarea
              rows={6}
              value={importText}
              placeholder="Paste your backup JSON here"
              className="w-full rounded-xl border border-line bg-raised px-3 py-2 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-xl bg-chip text-sm font-bold text-muted"
                onClick={() => {
                  setImportOpen(false);
                  setImportText("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-fg"
                onClick={() => void handleImport()}
              >
                Restore
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </Sheet>
  );
}
