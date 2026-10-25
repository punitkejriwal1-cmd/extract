import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { useHabits } from "@/lib/habit-store";
import { DAY_NAMES, type FreqType, type Habit, blankHabitDraft } from "@/lib/habits";

const FREQ_OPTIONS: { value: FreqType; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays_custom", label: "Specific days of the week" },
  { value: "every_x_days", label: "Every X days" },
  { value: "x_per_week", label: "X times per week" },
  { value: "x_per_month", label: "X times per month" },
  { value: "specific_dates", label: "Specific calendar dates" },
];

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
  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    if (!open) return;
    const found = habitId ? useHabits.getState().data.habits.find((h) => h.id === habitId) : null;
    setDraft(
      found
        ? {
            ...found,
            freqDays: [...found.freqDays],
            freqDates: [...found.freqDates],
            reminderDays: [...found.reminderDays],
          }
        : blankHabitDraft(),
    );
    setDateInput("");
  }, [open, habitId]);

  function toggleDay(key: "freqDays" | "reminderDays", day: number) {
    setDraft((d) => {
      const has = d[key].includes(day);
      if (key === "freqDays" && has && d.freqDays.length === 1) return d;
      const next = has ? d[key].filter((n) => n !== day) : [...d[key], day].sort((a, b) => a - b);
      return { ...d, [key]: next };
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
      freqNum: Math.min(31, Math.max(1, Number(draft.freqNum) || 2)),
    });
    showToast("Saved");
    onClose();
  }

  const numberCopy =
    draft.freqType === "every_x_days"
      ? { prefix: "Every", suffix: "days" }
      : draft.freqType === "x_per_week"
        ? { prefix: "", suffix: "times per week" }
        : draft.freqType === "x_per_month"
          ? { prefix: "", suffix: "times per month" }
          : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={existing ? "Edit habit" : "Create habit"}
    >
      <form className="space-y-4" onSubmit={save}>
        <Field label="Name">
          <input
            required
            maxLength={65}
            value={draft.name}
            placeholder="Morning revision"
            className="field"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Question (optional)">
          <input
            maxLength={65}
            value={draft.question}
            placeholder="Completed 90 mins without the phone?"
            className="field"
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
        </Field>

        <section className="space-y-3 rounded-xl border border-line bg-chip/60 p-3">
          <Field label="Frequency">
            <select
              className="field font-bold"
              value={draft.freqType}
              onChange={(e) => setDraft((d) => ({ ...d, freqType: e.target.value as FreqType }))}
            >
              {FREQ_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          {draft.freqType === "weekdays_custom" ? (
            <DayRow
              days={draft.freqDays}
              labels={DAY_NAMES.map((d) => d)}
              tone="accent"
              onToggle={(day) => toggleDay("freqDays", day)}
            />
          ) : null}

          {numberCopy ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              {numberCopy.prefix ? <span>{numberCopy.prefix}</span> : null}
              <input
                type="number"
                min={1}
                max={31}
                value={draft.freqNum}
                className="field w-20 text-center font-mono"
                onChange={(e) => setDraft((d) => ({ ...d, freqNum: Number(e.target.value) }))}
              />
              <span>{numberCopy.suffix}</span>
            </div>
          ) : null}

          {draft.freqType === "specific_dates" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateInput}
                  className="field font-mono"
                  onChange={(e) => setDateInput(e.target.value)}
                />
                <button
                  type="button"
                  className="min-h-11 shrink-0 rounded-xl bg-accent px-3 text-sm font-bold text-accent-fg"
                  onClick={() => {
                    if (!dateInput || draft.freqDates.includes(dateInput)) return;
                    setDraft((d) => ({ ...d, freqDates: [...d.freqDates, dateInput].sort() }));
                    setDateInput("");
                  }}
                >
                  Add date
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.freqDates.map((dt) => (
                  <span
                    key={dt}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1 font-mono text-xs font-bold text-accent"
                  >
                    {dt}
                    <button
                      type="button"
                      aria-label={`Remove ${dt}`}
                      className="px-1"
                      onClick={() => setDraft((d) => ({ ...d, freqDates: d.freqDates.filter((x) => x !== dt) }))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-xl border border-line bg-chip/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold tracking-wide text-muted uppercase">Reminder time</span>
            <input
              type="time"
              value={draft.time}
              className="field w-auto font-mono font-bold"
              onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Reminder days</div>
            <DayRow
              days={draft.reminderDays}
              labels={["S", "M", "T", "W", "T", "F", "S"]}
              tone="partial"
              onToggle={(day) => toggleDay("reminderDays", day)}
            />
          </div>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold text-ink">
            <span className="pr-2">
              Keep the alert until I answer
              <span className="mt-0.5 block text-xs font-semibold text-muted">
                Stays in the shade until Done, Partial, or Missed. A swipe brings it back.
              </span>
            </span>
            <input
              type="checkbox"
              checked={draft.sticky}
              className="size-5 shrink-0 accent-current"
              onChange={(e) => setDraft((d) => ({ ...d, sticky: e.target.checked }))}
            />
          </label>
        </section>

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
            Save habit
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
  tone,
  onToggle,
}: {
  days: number[];
  labels: string[];
  tone: "accent" | "partial";
  onToggle: (day: number) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {labels.map((label, day) => {
        const active = days.includes(day);
        return (
          <button
            key={`${label}-${day}`}
            type="button"
            onClick={() => onToggle(day)}
            className={cn(
              "min-h-11 rounded-lg border text-xs font-extrabold",
              active && tone === "accent" && "border-accent bg-accent text-accent-fg",
              active && tone === "partial" && "border-partial bg-partial text-partial-fg",
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
