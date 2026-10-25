import { create } from "zustand";
import {
  type AppData,
  type CellLog,
  type DisplayPrefs,
  type Habit,
  clampPrefs,
  defaultData,
  defaultPrefs,
  loadData,
  loadPrefs,
  saveData,
  savePrefs,
} from "@/lib/habits";
import type { PendingMark } from "@/lib/habit-marks";

type HabitStore = {
  data: AppData;
  prefs: DisplayPrefs;
  ready: boolean;
  toast: string | null;
  hydrate: () => void;
  showToast: (message: string) => void;
  mutate: (recipe: (data: AppData) => void) => void;
  setCell: (date: string, habitId: string, log: CellLog | null) => void;
  applyRemoteMark: (mark: PendingMark) => void;
  setPrefs: (patch: Partial<DisplayPrefs>) => void;
  upsertHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  addReason: (reason: string) => void;
  removeReason: (reason: string) => void;
  reset: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useHabits = create<HabitStore>((set, get) => ({
  data: defaultData(),
  prefs: defaultPrefs(),
  ready: false,
  toast: null,
  hydrate: () => {
    if (get().ready) return;
    set({ data: loadData(), prefs: loadPrefs(), ready: true });
  },
  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 1600);
  },
  mutate: (recipe) => {
    const next = structuredClone(get().data);
    recipe(next);
    saveData(next);
    set({ data: next });
  },
  setCell: (date, habitId, log) => {
    get().mutate((data) => {
      if (!data.logs[date]) data.logs[date] = {};
      if (!log) {
        delete data.logs[date][habitId];
        return;
      }
      data.logs[date][habitId] = log;
    });
  },
  applyRemoteMark: (mark) => {
    const log: CellLog =
      mark.status === "partial"
        ? { status: "partial", partialPct: mark.partialPct || 50 }
        : { status: mark.status };
    get().setCell(mark.dateKey, mark.habitId, log);
  },
  setPrefs: (patch) => {
    const next = clampPrefs({ ...get().prefs, ...patch });
    savePrefs(next);
    set({ prefs: next });
  },
  upsertHabit: (habit) => {
    get().mutate((data) => {
      const index = data.habits.findIndex((h) => h.id === habit.id);
      if (index >= 0) data.habits[index] = habit;
      else data.habits.push(habit);
    });
  },
  deleteHabit: (id) => {
    get().mutate((data) => {
      data.habits = data.habits.filter((h) => h.id !== id);
    });
  },
  addReason: (reason) => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    get().mutate((data) => {
      if (!data.reasonsList.includes(trimmed)) data.reasonsList.push(trimmed);
    });
  },
  removeReason: (reason) => {
    get().mutate((data) => {
      data.reasonsList = data.reasonsList.filter((r) => r !== reason);
    });
  },
  reset: () => {
    const fresh = defaultData();
    saveData(fresh);
    set({ data: fresh });
  },
}));
