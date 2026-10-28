import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import { type Habit, blankHabitDraft } from "@/lib/habits";

export function HabitDialog({
  habitId,
  creating,
  onClose,
}: {
  habitId: string | null;
  creating: boolean;
  onClose: () => void;
}) {
  const data = useHabits((s) => s.data);
  const upsert = useHabits((s) => s.upsertHabit);
  const remove = useHabits((s) => s.deleteHabit);
  const showToast = useHabits((s) => s.showToast);
  const open = creating || Boolean(habitId);
  const existing = data.habits.find((h) => h.id === habitId) ?? null;
  const [draft, setDraft] = useState<Habit>(blankHabitDraft());

  useEffect(() => {
    if (!open) return;
    const found = habitId ? useHabits.getState().data.habits.find((h) => h.id === habitId) : null;
    setDraft(
      found
        ? {
            ...found,
            startTime: found.startTime || found.reminderTime || "09:00",
            endTime: found.endTime || "",
            reminderTime: found.reminderTime || found.startTime || "09:00",
            freqDays: [...(found.reminderDays ?? [])],
            freqDates: [],
            reminderDays: [...(found.reminderDays ?? [])],
          }
        : blankHabitDraft(),
    );
  }, [open, habitId]);

  function toggleDay(day: number) {
    setDraft((d) => {
      const has = d.reminderDays.includes(day);
      const next = has
        ? d.reminderDays.filter((n) => n !== day)
        : [...d.reminderDays, day].sort((a, b) => a - b);
      return { ...d, reminderDays: next, freqDays: next };
    });
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    upsert({
      ...draft,
      id: draft.id || `h-${Date.now()}`,
      name,
      question: draft.question.trim(),
      startTime: draft.startTime || "09:00",
      endTime: draft.endTime || "",
      reminderTime: draft.reminderTime || "09:00",
      freqType: draft.reminderDays.length === 7 ? "daily" : "weekdays_custom",
      freqDays: [...draft.reminderDays],
      freqDates: [],
      freqNum: 2,
      sticky: true,
    });
    showToast("Saved");
    onClose();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={existing ? "Edit reminder" : "Create reminder"}
    >
      <form className="space-y-4" onSubmit={save}>
        <Field label="Reminder name">
          <input
            required
            maxLength={65}
            value={draft.name}
            placeholder="Call the bank"
            className="field"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Note (optional)">
          <input
            maxLength={120}
            value={draft.question}
            placeholder="Anything to remember?"
            className="field"
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
        </Field>

        <section className="space-y-3 rounded-xl border border-line bg-chip/60 p-3">
          <Field label="Remind me at">
            <input
              type="time"
              required
              value={draft.reminderTime}
              className="field font-mono font-bold"
              onChange={(e) => setDraft((d) => ({ ...d, reminderTime: e.target.value }))}
            />
          </Field>
          <p className="text-xs text-muted">
            The reminder fires at this time on each selected day. Select no days to pause this reminder.
          </p>
          <div>
            <div className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Repeat on</div>
            <DayRow
              days={draft.reminderDays}
              labels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
              onToggle={toggleDay}
            />
          </div>
        </section>

        <details className="rounded-xl border border-line bg-chip/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-muted">Optional timeline display</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Starts">
              <input
                type="time"
                value={draft.startTime}
                className="field font-mono"
                onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
              />
            </Field>
            <Field label="Ends">
              <input
                type="time"
                value={draft.endTime || ""}
                className="field font-mono"
                onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">These times only affect how the item appears on the home timeline.</p>
        </details>

        <div className="flex gap-2">
          {existing ? (
            <button
              type="button"
              className="min-h-11 rounded-xl bg-missed/15 px-4 text-sm font-bold text-missed"
              onClick={() => {
                remove(existing.id);
                showToast("Deleted");
                onClose();
              }}
            >
              Delete
            </button>
          ) : null}
          <button type="submit" className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-extrabold text-accent-fg">
            Save reminder
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wide text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function DayRow({
  days,
  labels,
  onToggle,
}: {
  days: number[];
  labels: string[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {labels.map((label, day) => {
        const active = days.includes(day);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(day)}
            className={cn(
              "min-h-11 rounded-lg border text-[10px] font-extrabold",
              active && "border-accent bg-accent text-accent-fg",
              !active && "border-line bg-raised text-muted",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
