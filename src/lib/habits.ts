export const STORAGE_KEY = "one_percent_loop_v3";
export const LEGACY_KEY = "one_percent_loop_v2";
export const THEME_KEY = "one_percent_theme_v2";
export const PREFS_KEY = "one_percent_prefs_v1";

export type DisplayPrefs = {
  fontScale: number;
  visibleDays: number;
};

export function defaultPrefs(): DisplayPrefs {
  return { fontScale: 1, visibleDays: 4 };
}

export function clampPrefs(prefs: Partial<DisplayPrefs> | null | undefined): DisplayPrefs {
  const fontScale = Number(prefs?.fontScale);
  const visibleDays = Number(prefs?.visibleDays);
  return {
    fontScale: Number.isFinite(fontScale) ? Math.min(1, Math.max(0.6, fontScale)) : 1,
    visibleDays: Number.isFinite(visibleDays) ? Math.min(7, Math.max(1, Math.round(visibleDays))) : 4,
  };
}

export function loadPrefs(): DisplayPrefs {
  if (typeof localStorage === "undefined") return defaultPrefs();
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    return clampPrefs(JSON.parse(raw) as Partial<DisplayPrefs>);
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(prefs: DisplayPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type FreqType =
  | "daily"
  | "weekdays_custom"
  | "every_x_days"
  | "x_per_week"
  | "x_per_month"
  | "specific_dates";

export type HabitStatus = "done" | "partial" | "missed";

export type Habit = {
  id: string;
  name: string;
  question: string;
  time: string;
  freqType: FreqType;
  freqDays: number[];
  freqNum: number;
  freqDates: string[];
  reminderDays: number[];
  sticky: boolean;
};

export type CellLog = {
  status: HabitStatus;
  partialPct?: number;
  reasons?: string[];
  note?: string;
};

export type AppData = {
  reasonsList: string[];
  habits: Habit[];
  logs: Record<string, Record<string, CellLog>>;
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function dateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

export function humanDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function weekdayParts(key: string): { name: string; day: number } {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    name: dt.toLocaleDateString("en-US", { weekday: "short" }),
    day: d,
  };
}

export function format12(time24: string): string {
  if (!time24.includes(":")) return "";
  const [hS, mS] = time24.split(":");
  let h = parseInt(hS, 10);
  if (Number.isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mS} ${ampm}`;
}

export function now24(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function frequencySummary(h: Habit): string {
  const type = h.freqType || "daily";
  if (type === "daily") return "Every day";
  if (type === "weekdays_custom") {
    const days = h.freqDays.length ? h.freqDays : ALL_DAYS;
    if (days.length === 7) return "Every day";
    return days.map((d) => DAY_NAMES[d] ?? "").join(", ");
  }
  if (type === "every_x_days") return `Every ${h.freqNum || 2} days`;
  if (type === "x_per_week") return `${h.freqNum || 3}× / week`;
  if (type === "x_per_month") return `${h.freqNum || 10}× / month`;
  if (type === "specific_dates") {
    const n = h.freqDates.length;
    return n ? `${n} selected date${n === 1 ? "" : "s"}` : "Specific dates";
  }
  return "Every day";
}

function habit(
  id: string,
  name: string,
  question: string,
  time: string,
  extra?: Partial<Habit>,
): Habit {
  return {
    id,
    name,
    question,
    time,
    freqType: "daily",
    freqDays: [...ALL_DAYS],
    freqNum: 2,
    freqDates: [],
    reminderDays: [...ALL_DAYS],
    sticky: true,
    ...extra,
  };
}

export function defaultData(): AppData {
  const today = dateKey(0);
  const yesterday = dateKey(-1);
  const twoAgo = dateKey(-2);
  return {
    reasonsList: [
      "Overslept",
      "Previous Task Overran",
      "Phone Distraction",
      "Low Energy / Tired",
      "Procrastinated",
      "Urgent Work",
    ],
    habits: [
      habit("h1", "Wake Up On Time", "Out of bed at alarm?", "06:00"),
      habit("h2", "Study Slot 1 (Morning GS)", "Completed full morning study block?", "06:30"),
      habit("h3", "Timetable Audit", "Audited timetable?", "08:20"),
      habit("h4", "Anki Flashcards Review", "Completed daily due cards?", "09:00"),
      habit("h5", "Study Slot 2 (Mid-Day)", "Completed second study session?", "11:00"),
      habit(
        "h6",
        "Workout / Exercise",
        "45 mins physical movement?",
        "18:00",
        {
          freqType: "weekdays_custom",
          freqDays: [1, 2, 3, 4, 5, 6],
          reminderDays: [1, 2, 3, 4, 5, 6],
        },
      ),
    ],
    logs: {
      [twoAgo]: {
        h1: { status: "done" },
        h2: { status: "done" },
        h3: { status: "done" },
        h4: { status: "partial", partialPct: 50, reasons: ["Previous Task Overran"], note: "Half deck done" },
        h5: { status: "done" },
        h6: { status: "done" },
      },
      [yesterday]: {
        h1: { status: "done" },
        h2: {
          status: "partial",
          partialPct: 60,
          reasons: ["Previous Task Overran"],
          note: "Started 30 mins late",
        },
        h3: { status: "done" },
        h4: { status: "done" },
        h5: { status: "missed", reasons: ["Phone Distraction"], note: "Scrolled after breakfast" },
        h6: { status: "partial", partialPct: 50, reasons: ["Low Energy / Tired"], note: "Light stretching only" },
      },
      [today]: {},
    },
  };
}

function asNumberArray(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((n): n is number => typeof n === "number");
}

function normalizeHabit(raw: Partial<Habit> & { id?: string; name?: string }): Habit | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: String(raw.id),
    name: String(raw.name),
    question: typeof raw.question === "string" ? raw.question : "",
    time: typeof raw.time === "string" && raw.time.includes(":") ? raw.time : "07:00",
    freqType: raw.freqType ?? "daily",
    freqDays: asNumberArray(raw.freqDays, [...ALL_DAYS]),
    freqNum: typeof raw.freqNum === "number" && raw.freqNum > 0 ? raw.freqNum : 2,
    freqDates: Array.isArray(raw.freqDates) ? raw.freqDates.filter((d) => typeof d === "string") : [],
    reminderDays: asNumberArray(raw.reminderDays, [...ALL_DAYS]),
    sticky: Boolean(raw.sticky),
  };
}

export function normalizeData(parsed: Partial<AppData> | null): AppData | null {
  if (!parsed || !Array.isArray(parsed.habits)) return null;
  const habits = parsed.habits
    .map((h) => normalizeHabit(h as Habit))
    .filter((h): h is Habit => h !== null);
  const reasons = Array.isArray(parsed.reasonsList)
    ? parsed.reasonsList.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    : ["Overslept", "Previous Task Overran", "Phone Distraction", "Low Energy / Tired", "Procrastinated"];
  const logs = parsed.logs && typeof parsed.logs === "object" ? parsed.logs : {};
  return { habits, reasonsList: reasons, logs };
}

export function loadData(): AppData {
  if (typeof localStorage === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const normalized = normalizeData(JSON.parse(raw) as Partial<AppData>);
      if (normalized) return normalized;
    }
  } catch {
    /* fall through to defaults */
  }
  const fresh = defaultData();
  saveData(fresh);
  return fresh;
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}

export function sortedHabits(data: AppData): Habit[] {
  return [...data.habits].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
}

export function cellLog(data: AppData, key: string, habitId: string): CellLog | null {
  return data.logs[key]?.[habitId] ?? null;
}

export function auditForDate(data: AppData, key: string): string {
  const lines = sortedHabits(data).map((h) => {
    const time = format12(h.time);
    const log = cellLog(data, key, h.id);
    if (!log?.status) return `${time} | ${h.name} | UNMARKED`;
    if (log.status === "done") return `${time} | ${h.name} | DONE`;
    if (log.status === "partial") {
      const reasons = log.reasons?.length ? ` | ${log.reasons.join(", ")}` : "";
      const note = log.note ? ` | ${log.note}` : "";
      return `${time} | ${h.name} | PARTIAL (${log.partialPct || 50}%)${reasons}${note}`;
    }
    const reasons = log.reasons?.length ? ` | ${log.reasons.join(", ")}` : "";
    const note = log.note ? ` | ${log.note}` : "";
    return `${time} | ${h.name} | MISSED${reasons}${note}`;
  });
  return [`Date: ${humanDate(key)}`, ...lines].join("\n");
}

export function auditText(data: AppData, dayOffset = 0): string {
  return auditForDate(data, dateKey(dayOffset));
}

function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yr = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

export function auditRange(data: AppData, fromKey: string, toKey: string): string {
  let start = fromKey <= toKey ? fromKey : toKey;
  const end = fromKey <= toKey ? toKey : fromKey;
  const chunks: string[] = [];
  const limit = 62;
  let truncated = false;
  for (let i = 0; i < limit && start <= end; i += 1) {
    chunks.push(auditForDate(data, start));
    const next = shiftKey(start, 1);
    if (i === limit - 1 && next <= end) truncated = true;
    start = next;
  }
  if (truncated) {
    chunks.push("(Only the first 62 days were included. Narrow the dates to copy the rest.)");
  }
  return chunks.join("\n\n");
}

export function blankHabitDraft(): Habit {
  return habit("", "", "", "07:00");
}

export async function registerHabitWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/habit-sw.js");
  } catch {
    return null;
  }
}

export function dismissSticky(habitId: string, date: string) {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  const tags = [`habit-${habitId}-${date}`, `habit-${habitId}-${date}-detail`];
  const send = (worker: ServiceWorker | null | undefined) => {
    if (!worker) return;
    for (const tag of tags) worker.postMessage({ type: "close-habit", tag });
  };
  send(navigator.serviceWorker.controller);
  void navigator.serviceWorker.ready.then((reg) => send(reg.active));
}

type NoteAction = { action: string; title: string };

function notificationActions(): NoteAction[] {
  const raw =
    typeof Notification !== "undefined"
      ? (Notification as { maxActions?: number }).maxActions
      : undefined;
  const max = typeof raw === "number" && raw >= 0 ? raw : 2;
  const done: NoteAction = { action: "done", title: "Done" };
  const partial: NoteAction = { action: "partial", title: "Partial" };
  const missed: NoteAction = { action: "missed", title: "Missed" };
  const more: NoteAction = { action: "more", title: "Partial / Missed" };
  if (max >= 3) return [done, partial, missed];
  if (max >= 2) return [done, more];
  if (max === 1) return [done];
  return [];
}

export async function notifyHabit(habitItem: Habit): Promise<boolean> {
  if (typeof Notification === "undefined") return false;

  // Ask for permission if we don't have it yet (needed on Android 13+)
  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return false;
  }
  if (Notification.permission !== "granted") return false;

  const title = `${format12(habitItem.time)} — ${habitItem.name}`;
  const body = habitItem.question || "Open the app and mark it when done. This stays until you do.";
  const tag = `habit-${habitItem.id}-${dateKey(0)}`;
  const sticky = habitItem.sticky !== false;

  const data = {
    habitId: habitItem.id,
    dateKey: dateKey(0),
    sticky,
    stage: "root",
    name: habitItem.name,
    question: habitItem.question || "",
    timeLabel: format12(habitItem.time),
  };

  const options: NotificationOptions = {
    body,
    tag,
    renotify: true,
    requireInteraction: sticky, // keeps it sticky
    vibrate: [80, 40, 80],
    data,
    // no action buttons
  };

  try {
    const reg = await registerHabitWorker();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}