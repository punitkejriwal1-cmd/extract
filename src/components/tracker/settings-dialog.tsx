import { useRef } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import { exportDataJson, importDataJson, scheduleAllHabitNotifications } from "@/lib/habits";

const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useHabits((s) => s.data);
  const prefs = useHabits((s) => s.prefs);
  const setPrefs = useHabits((s) => s.setPrefs);
  const showToast = useHabits((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const percent = Math.round(prefs.fontScale * 100);
  const previous = prefs.visibleDays - 1;

  function handleExport() {
    try {
      const json = exportDataJson(data);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1percent-habits-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup saved");
    } catch {
      showToast("Export failed");
    }
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importDataJson(text);
      if (!imported) {
        showToast("Invalid backup file");
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
          Export your habits before updating the app. After installing a new APK you can import the same file so nothing is lost.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-fg"
            onClick={handleExport}
          >
            Export habits
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-partial text-sm font-bold text-partial-fg"
            onClick={handleImportClick}
          >
            Import habits
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void handleImportFile(e)}
        />
      </section>
    </Sheet>
  );
}
