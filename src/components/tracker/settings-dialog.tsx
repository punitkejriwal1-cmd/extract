import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import {
  THEME_KEY,
  exportHabitsFile,
  importDataJson,
  scheduleAllHabitNotifications,
} from "@/lib/habits";

const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useHabits((s) => s.data);
  const prefs = useHabits((s) => s.prefs);
  const setPrefs = useHabits((s) => s.setPrefs);
  const showToast = useHabits((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (!open) return;
    setDark(localStorage.getItem(THEME_KEY) !== "light");
  }, [open]);

  const percent = Math.round(prefs.fontScale * 100);
  const previous = prefs.visibleDays - 1;

  function setTheme(nextDark: boolean) {
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem(THEME_KEY, nextDark ? "dark" : "light");
  }

  async function handleExport() {
    setBusy(true);
    try {
      const ok = await exportHabitsFile(data);
      showToast(ok ? "Share sheet opened — save the JSON file" : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const imported = importDataJson(text);
      if (!imported) {
        showToast("Invalid JSON file");
        return;
      }
      useHabits.getState().mutate((d) => {
        d.habits = imported.habits;
        d.logs = imported.logs;
        d.reasonsList = imported.reasonsList;
      });
      await scheduleAllHabitNotifications(imported);
      showToast(`Imported ${imported.habits.length} habits`);
    } catch {
      showToast("Import failed");
    } finally {
      setBusy(false);
    }
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
        <h3 className="text-sm font-bold text-ink">Theme</h3>
        <p className="text-sm text-pretty text-muted">
          Dark uses pure black for OLED screens to save battery.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={dark}
            onClick={() => setTheme(true)}
            className={cn(
              "min-h-11 rounded-xl border text-sm font-bold",
              dark ? "border-accent bg-accent text-accent-fg" : "border-line bg-raised text-muted",
            )}
          >
            Dark (OLED)
          </button>
          <button
            type="button"
            aria-pressed={!dark}
            onClick={() => setTheme(false)}
            className={cn(
              "min-h-11 rounded-xl border text-sm font-bold",
              !dark ? "border-accent bg-accent text-accent-fg" : "border-line bg-raised text-muted",
            )}
          >
            Light
          </button>
        </div>
      </section>

      <section className="mt-3 space-y-3 rounded-xl bg-chip p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">Text size</h3>
          <span className="font-mono text-xs font-bold text-accent tabular-nums">{percent}%</span>
        </div>
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
        <h3 className="text-sm font-bold text-ink">Backup file</h3>
        <p className="text-sm text-pretty text-muted">
          Export creates a JSON file you can save. Import restores habits from that file after an update.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-fg disabled:opacity-50"
            onClick={() => void handleExport()}
          >
            Export JSON
          </button>
          <button
            type="button"
            disabled={busy}
            className="min-h-11 flex-1 rounded-xl bg-partial text-sm font-bold text-partial-fg disabled:opacity-50"
            onClick={handleImportClick}
          >
            Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,text/plain"
          className="hidden"
          onChange={(e) => void handleImportFile(e)}
        />
      </section>
    </Sheet>
  );
}
