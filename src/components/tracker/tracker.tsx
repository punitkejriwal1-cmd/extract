import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Check, ClipboardList, Moon, Plus, Settings, Sun, X } from "lucide-react";
import { AuditDialog } from "@/components/tracker/audit-dialog";
import { HabitDialog } from "@/components/tracker/habit-dialog";
import { SettingsDialog } from "@/components/tracker/settings-dialog";
import { StatusDialog } from "@/components/tracker/status-dialog";
import { cn } from "@/lib/cn";
import { drainMarks } from "@/lib/habit-marks";
import { useHabits } from "@/lib/habit-store";
import {
  THEME_KEY,
  cellLog,
  colorForHabit,
  dateKey,
  dismissSticky,
  durationLabel,
  format12,
  notifyHabit,
  now24,
  registerHabitWorker,
  scheduleAllHabitNotifications,
  sortedHabits,
  weekdayParts,
  type HabitStatus,
} from "@/lib/habits";

export function Tracker() {
  const data = useHabits((s) => s.data);
  const prefs = useHabits((s) => s.prefs);
  const ready = useHabits((s) => s.ready);
  const toast = useHabits((s) => s.toast);
  const hydrate = useHabits((s) => s.hydrate);
  const [dark, setDark] = useState(true);
  const [status, setStatus] = useState<{ dateKey: string; habitId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--habit-scale", String(prefs.fontScale));
  }, [prefs.fontScale]);

  useEffect(() => {
    hydrate();
    const light = localStorage.getItem(THEME_KEY) === "light";
    setDark(!light);
    document.documentElement.classList.toggle("dark", !light);
    void registerHabitWorker();
  }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    void scheduleAllHabitNotifications(data);
  }, [ready, data.habits]);

  // Re-apply sticky notifications every minute (covers swipe-away on Realme)
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      void scheduleAllHabitNotifications(useHabits.getState().data);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let chain: Promise<void> = Promise.resolve();
    const ingest = () => {
      chain = chain
        .then(async () => {
          const marks = await drainMarks();
          if (cancelled || marks.length === 0) return;
          for (const mark of marks) {
            useHabits.getState().applyRemoteMark(mark);
            void dismissSticky(mark.habitId, mark.dateKey);
          }
          const label =
            marks.length === 1
              ? marks[0].status === "done"
                ? "Marked done"
                : marks[0].status === "partial"
                  ? "Marked partial"
                  : "Marked missed"
              : `Updated ${marks.length} habits`;
          useHabits.getState().showToast(label);
        })
        .catch(() => undefined);
    };
    ingest();
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; habitId?: string; dateKey?: string } | null;
      if (!payload || typeof payload !== "object") return;
      if (payload.type === "habit-mark") ingest();
      if (payload.type === "habit-open" && payload.habitId && payload.dateKey) {
        setStatus({ habitId: payload.habitId, dateKey: payload.dateKey });
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        ingest();
        void scheduleAllHabitNotifications(useHabits.getState().data);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const fired = new Set<string>();
    const tick = () => {
      const today = dateKey(0);
      const dow = new Date().getDay();
      const minute = now24();
      const current = useHabits.getState().data;
      for (const habit of current.habits) {
        const remind = habit.reminderTime || habit.startTime;
        if (!remind || remind !== minute) continue;
        const days = habit.reminderDays.length ? habit.reminderDays : [0, 1, 2, 3, 4, 5, 6];
        if (!days.includes(dow)) continue;
        if (cellLog(current, today, habit.id)?.status) continue;
        const key = `${today}_${habit.id}_${remind}`;
        if (fired.has(key)) continue;
        fired.add(key);
        void notifyHabit(habit);
      }
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [ready]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  const habits = sortedHabits(data);
  const today = dateKey(0);
  const columns = Array.from({ length: prefs.visibleDays }, (_, index) => dateKey(-index));
  const track = columnTrack(prefs.visibleDays, prefs.fontScale);
  const scored = habits.filter((h) => {
    const log = cellLog(data, today, h.id);
    return log?.status === "done" || log?.status === "partial";
  }).length;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden border-x border-line bg-surface shadow-xl">
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm font-bold text-accent">1%</span>
              <h1 className="text-sm font-extrabold tracking-tight text-ink">Habits</h1>
            </div>
            <span className="rounded-full bg-chip px-2 py-0.5 font-mono text-xs font-semibold text-muted tabular-nums">
              {scored}/{habits.length}
            </span>
          </div>
          <div className="flex items-center">
            <IconButton label="Copy log" onClick={() => setAuditOpen(true)}>
              <ClipboardList className="size-4" />
            </IconButton>
            <IconButton label="Add habit" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
            </IconButton>
            <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
              <Settings className="size-4" />
            </IconButton>
            <IconButton label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>
              {dark ? <Sun className="size-4 text-partial" /> : <Moon className="size-4" />}
            </IconButton>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 pb-2 text-xs font-bold text-muted">
          <span className="w-16 shrink-0">Time</span>
          <span className="flex-1">Habit</span>
          <div className="grid shrink-0 text-center" style={track.style}>
            {columns.map((key, index) => {
              const parts = weekdayParts(key);
              return (
                <div key={key} className={cn("leading-tight", index === 0 && "font-extrabold text-accent")}>
                  <div className="habit-dow uppercase">{parts.name}</div>
                  <div className="font-mono tabular-nums">{parts.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="safe-bottom flex-1">
        {habits.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-bold text-ink">No habits yet</p>
            <p className="mt-1 text-sm text-muted">Add the first one with the plus in the top bar.</p>
          </div>
        ) : (
          <div className="divide-y divide-line/60">
            {habits.map((habit, index) => {
              const dur = durationLabel(habit.startTime, habit.endTime);
              const pill = colorForHabit(habit, index);
              return (
                <div key={habit.id} className="flex items-stretch gap-2 px-3 py-3">
                  <div className="flex w-16 shrink-0 flex-col pt-1">
                    <span className="text-xs font-semibold text-muted tabular-nums">
                      {format12(habit.startTime)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setEditingId(habit.id)}
                  >
                    <span
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-sm"
                      style={{ backgroundColor: pill }}
                    >
                      <span className="truncate">{habit.name}</span>
                    </span>
                    {dur ? (
                      <div className="mt-1.5 pl-1 text-xs font-medium text-muted tabular-nums">{dur}</div>
                    ) : null}
                  </button>
                  <div className="grid shrink-0 self-center" style={track.style}>
                    {columns.map((key) => {
                      const log = cellLog(data, key, habit.id);
                      return (
                        <Cell
                          key={key}
                          status={log?.status ?? null}
                          pct={log?.partialPct}
                          size={track.cell}
                          label={`${habit.name} on ${key}`}
                          onClick={() => setStatus({ dateKey: key, habitId: habit.id })}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StatusDialog
        dateKey={status?.dateKey ?? null}
        habitId={status?.habitId ?? null}
        onClose={() => setStatus(null)}
      />
      <HabitDialog
        habitId={editingId}
        creating={creating}
        onClose={() => {
          setEditingId(null);
          setCreating(false);
        }}
      />
      <AuditDialog open={auditOpen} onClose={() => setAuditOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {toast ? (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-toast px-4 py-2 text-xs font-extrabold text-toast-fg shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function columnTrack(days: number, scale: number) {
  const base = days <= 4 ? 44 : days === 5 ? 40 : days === 6 ? 36 : 32;
  const floor = days >= 6 ? 28 : 34;
  const cell = Math.max(floor, Math.round(base * scale));
  return {
    cell,
    style: {
      width: cell * days,
      gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))`,
    } satisfies CSSProperties,
  };
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-xl text-ink active:scale-95"
    >
      {children}
    </button>
  );
}

function Cell({
  status,
  pct,
  size,
  label,
  onClick,
}: {
  status: HabitStatus | null;
  pct?: number;
  size: number;
  label: string;
  onClick: () => void;
}) {
  const box = Math.max(24, size - 6);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ width: box, height: box, fontSize: Math.max(10, Math.round(box * 0.32)) }}
      className={cn(
        "mx-auto grid place-items-center rounded-xl border font-extrabold whitespace-nowrap active:scale-95",
        !status && "border-line bg-chip text-muted",
        status === "done" && "border-done bg-done text-done-fg",
        status === "partial" && "border-partial bg-partial text-partial-fg",
        status === "missed" && "border-missed bg-missed text-missed-fg",
      )}
    >
      {status === "done" ? (
        <Check className="size-4" strokeWidth={3} />
      ) : status === "missed" ? (
        <X className="size-4" strokeWidth={3} />
      ) : status === "partial" ? (
        `${pct || 50}%`
      ) : (
        "·"
      )}
    </button>
  );
}
