import { useMemo, useState } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import { auditRange, auditText, dateKey } from "@/lib/habits";

type Mode = "today" | "yesterday" | "range";

export function AuditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useHabits((s) => s.data);
  const showToast = useHabits((s) => s.showToast);
  const [mode, setMode] = useState<Mode>("today");
  const [from, setFrom] = useState(() => dateKey(-6));
  const [to, setTo] = useState(() => dateKey(0));

  const today = dateKey(0);
  const rangeReady = isDateKey(from) && isDateKey(to);
  const text = useMemo(() => {
    if (mode === "today") return auditText(data, 0);
    if (mode === "yesterday") return auditText(data, -1);
    if (!rangeReady) return "Pick a start and end date.";
    return auditRange(data, from, to);
  }, [data, mode, from, to, rangeReady]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch {
      showToast("Select the log and copy");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Copy log"
    >
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-chip p-1">
        <Tab active={mode === "today"} onClick={() => setMode("today")}>
          Today
        </Tab>
        <Tab active={mode === "yesterday"} onClick={() => setMode("yesterday")}>
          Yesterday
        </Tab>
        <Tab active={mode === "range"} onClick={() => setMode("range")}>
          Dates
        </Tab>
      </div>

      {mode === "range" ? (
        <div className="mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-bold tracking-wide text-muted uppercase">From</span>
              <input
                type="date"
                value={from}
                max={to || today}
                className="field font-mono"
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-bold tracking-wide text-muted uppercase">To</span>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                className="field font-mono"
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-11 rounded-xl bg-raised text-sm font-bold text-ink"
              onClick={() => {
                setFrom(dateKey(-2));
                setTo(today);
              }}
            >
              Last 3 days
            </button>
            <button
              type="button"
              className="min-h-11 rounded-xl bg-raised text-sm font-bold text-ink"
              onClick={() => {
                setFrom(dateKey(-6));
                setTo(today);
              }}
            >
              Last 7 days
            </button>
          </div>
        </div>
      ) : null}

      <textarea
        readOnly
        value={text}
        rows={12}
        className="w-full rounded-xl border border-line bg-log p-3 font-mono text-xs leading-relaxed text-log-fg outline-none"
      />
      <button
        type="button"
        disabled={mode === "range" && !rangeReady}
        className="mt-3 min-h-11 w-full rounded-xl bg-accent text-sm font-extrabold text-accent-fg disabled:opacity-40"
        onClick={() => void copy()}
      >
        Copy logs
      </button>
    </Sheet>
  );
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("min-h-11 rounded-lg text-sm font-bold", active ? "bg-raised text-accent" : "text-muted")}
    >
      {children}
    </button>
  );
}
