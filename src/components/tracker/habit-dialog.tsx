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
            freqDays: [...found.reminderDays],
            freqDates: [],
            reminderDays: [...found.reminderDays],
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
      startTime: draft.startTime,
      endTime: draft.endTime || "",
      reminderTime: draft.reminderTime || draft.startTime,
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
            placeholder="Completed without the phone?"
            className="field"
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
        </Field>



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
