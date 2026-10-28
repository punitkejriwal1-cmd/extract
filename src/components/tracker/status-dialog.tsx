import { useEffect, useState, type ReactNode } from "react";
import { Check, Clock, X } from "lucide-react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import { type HabitStatus, cellLog, dismissSticky, format12, humanDate } from "@/lib/habits";

type Draft = {
  status: HabitStatus | null;
  partialPct: number;
  reasons: string[];
  note: string;
};

export function StatusDialog({
  dateKey,
  habitId,
  onClose,
}: {
  dateKey: string | null;
  habitId: string | null;
  onClose: () => void;
}) {
  const data = useHabits((s) => s.data);
  const setCell = useHabits((s) => s.setCell);
  const addReason = useHabits((s) => s.addReason);
  const removeReason = useHabits((s) => s.removeReason);
  const showToast = useHabits((s) => s.showToast);
  const habit = data.habits.find((h) => h.id === habitId) ?? null;
  const open = Boolean(dateKey && habit);

  const [draft, setDraft] = useState<Draft>({
    status: null,
    partialPct: 50,
    reasons: [],
    note: "",
  });
  const [reasonInput, setReasonInput] = useState("");

  useEffect(() => {
    if (!dateKey || !habitId) return;
    const existing = cellLog(useHabits.getState().data, dateKey, habitId);
    setDraft({
      status: existing?.status ?? null,
      partialPct: existing?.partialPct || 50,
      reasons: existing?.reasons ? [...existing.reasons] : [],
      note: existing?.note ?? "",
    });
    setReasonInput("");
  }, [dateKey, habitId]);

  function commit(status: HabitStatus) {
    if (!dateKey || !habitId) return;
    if (status === "done") {
      setCell(dateKey, habitId, { status: "done" });
      void dismissSticky(habitId, dateKey);
      showToast("Done");
      onClose();
      return;
    }
    setDraft((d) => ({ ...d, status }));
  }

  function saveReasoned() {
    if (!dateKey || !habitId || !draft.status || draft.status === "done") return;
    setCell(dateKey, habitId, {
      status: draft.status,
      partialPct: draft.status === "partial" ? draft.partialPct : 0,
      reasons: draft.reasons,
      note: draft.note.trim(),
    });
    void dismissSticky(habitId, dateKey);
    showToast("Saved");
    onClose();
  }

  function clearCell() {
    if (!dateKey || !habitId) return;
    setCell(dateKey, habitId, null);
    showToast("Cleared");
    onClose();
  }

  function toggleReason(reason: string) {
    setDraft((d) => ({
      ...d,
      reasons: d.reasons.includes(reason) ? d.reasons.filter((r) => r !== reason) : [...d.reasons, reason],
    }));
  }

  function addCustomReason() {
    const value = reasonInput.trim();
    if (!value) return;
    addReason(value);
    setDraft((d) => ({ ...d, reasons: d.reasons.includes(value) ? d.reasons : [...d.reasons, value] }));
    setReasonInput("");
  }

  const needsReason = draft.status === "partial" || draft.status === "missed";
  const timeLabel = habit
    ? format12(habit.startTime) +
      (habit.endTime ? ` – ${format12(habit.endTime)}` : "")
    : "";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={habit?.name ?? "Habit"}
      description={habit && dateKey ? `${humanDate(dateKey)} · ${timeLabel}` : undefined}
    >
      {habit?.question ? <p className="mb-3 text-sm text-pretty text-muted">{habit.question}</p> : null}
      <div className="grid grid-cols-3 gap-2">
        <StatusPick
          label="Done"
          active={draft.status === "done"}
          tone="done"
          onClick={() => commit("done")}
          icon={<Check className="size-4" />}
        />
        <StatusPick
          label="Partial"
          active={draft.status === "partial"}
          tone="partial"
          onClick={() => commit("partial")}
          icon={<Clock className="size-4" />}
        />
        <StatusPick
          label="Missed"
          active={draft.status === "missed"}
          tone="missed"
          onClick={() => commit("missed")}
          icon={<X className="size-4" />}
        />
      </div>

      {needsReason ? (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {draft.status === "partial" ? (
            <div className="rounded-xl border border-partial/30 bg-partial/10 p-3">
              <div className="mb-2 flex items-center justify-between text-sm font-bold text-partial">
                <span>Completion</span>
                <span className="font-mono tabular-nums">{draft.partialPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={10}
                value={draft.partialPct}
                aria-label="Completion percent"
                className="w-full"
                onChange={(e) => setDraft((d) => ({ ...d, partialPct: Number(e.target.value) }))}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {data.reasonsList.map((reason) => {
              const selected = draft.reasons.includes(reason);
              return (
                <div
                  key={reason}
                  className={cn(
                    "inline-flex items-center rounded-xl border text-xs font-bold",
                    selected
                      ? "border-missed bg-missed text-missed-fg"
                      : "border-line bg-chip text-ink",
                  )}
                >
                  <button type="button" className="py-2 pr-1 pl-3" onClick={() => toggleReason(reason)}>
                    {reason}
                  </button>
                  <button
                    type="button"
                    className="py-2 pr-2 pl-1 opacity-70"
                    aria-label={`Remove reason ${reason}`}
                    onClick={() => {
                      removeReason(reason);
                      setDraft((d) => ({ ...d, reasons: d.reasons.filter((r) => r !== reason) }));
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              value={reasonInput}
              maxLength={40}
              placeholder="New reason"
              className="min-h-11 flex-1 rounded-xl border border-line bg-chip px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomReason();
                }
              }}
            />
            <button
              type="button"
              className="min-h-11 rounded-xl bg-done px-4 text-sm font-bold text-done-fg"
              onClick={addCustomReason}
            >
              Add
            </button>
          </div>

          <textarea
            rows={2}
            value={draft.note}
            placeholder="Note"
            className="w-full rounded-xl border border-line bg-chip px-3 py-2 text-base text-ink outline-none focus:ring-2 focus:ring-accent"
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />

          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 rounded-xl bg-chip px-4 text-sm font-bold text-muted"
              onClick={clearCell}
            >
              Clear
            </button>
            <button
              type="button"
              className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-extrabold text-accent-fg"
              onClick={saveReasoned}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <button type="button" className="min-h-11 px-2 text-sm font-bold text-muted" onClick={clearCell}>
            Clear
          </button>
        </div>
      )}
    </Sheet>
  );
}

function StatusPick({
  label,
  active,
  tone,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  tone: "done" | "partial" | "missed";
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-xs font-extrabold transition active:scale-95",
        active && tone === "done" && "border-done bg-done text-done-fg",
        active && tone === "partial" && "border-partial bg-partial text-partial-fg",
        active && tone === "missed" && "border-missed bg-missed text-missed-fg",
        !active && "border-line bg-chip text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
