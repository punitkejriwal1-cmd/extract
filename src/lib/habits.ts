import { LocalNotifications } from "@capacitor/local-notifications";

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
  endTime: string;
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
  if (!time24 || !time24.includes(":")) return "";
  const [hS, mS] = time24.split(":");
  let h = parseInt(hS, 10);
  if (Number.isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mS} ${ampm}`;
}

/** Home-screen label: "09:00 AM – 11:00 AM" or just start if no end */
export function timeRangeLabel(h: Habit): string {
  const start = format12(h.time);
  if (!h.endTime) return start;
  const end = format12(h.endTime);
  if (!end) return start;
  return `${start} – ${end}`;
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
    endTime: "",
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
  return {
    reasonsList: [
      "Overslept",
      "Previous Task Overran",
      "Phone Distraction",
      "Low Energy / Tired",
      "Procrastinated",
      "Urgent Work",
    ],
    habits: [],
    logs: {},
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
    endTime:
      typeof raw.endTime === "string" && raw.endTime.includes(":") ? raw.endTime : "",
    freqType: raw.freqType ?? "daily",
    freqDays: asNumberArray(raw.freqDays, [...ALL_DAYS]),
    freqNum: typeof raw.freqNum === "number" && raw.freqNum > 0 ? raw.freqNum : 2,
    freqDates: Array.isArray(raw.freqDates) ? raw.freqDates.filter((d) => typeof d === "string") : [],
    reminderDays: asNumberArray(raw.reminderDays, [...ALL_DAYS]),
    sticky: raw.sticky !== false,
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
    const time = timeRangeLabel(h);
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
  return habit("", "", "", "07:00", { endTime: "08:00" });
}

export async function registerHabitWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/habit-sw.js");
  } catch {
    return null;
  }
}

export function habitNotificationId(habitId: string, day: string): number {
  const s = `${habitId}|${day}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function parseTime(time24: string): { hour: number; minute: number } | null {
  if (!time24.includes(":")) return null;
  const [hS, mS] = time24.split(":");
  const hour = parseInt(hS, 10);
  const minute = parseInt(mS, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

function nextFireDate(time24: string): Date | null {
  const t = parseTime(time24);
  if (!t) return null;
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(t.hour, t.minute, 0, 0);
  if (d.getTime() <= Date.now() + 2000) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

async function ensureChannel() {
  await LocalNotifications.createChannel({
    id: "habits",
    name: "Habit Reminders",
    description: "Sticky habit reminders",
    importance: 5,
    visibility: 1,
    vibration: true,
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}

function notifPayload(habitItem: Habit, day: string, at: Date) {
  const id = habitNotificationId(habitItem.id, day);
  return {
    id,
    title: habitItem.name,
    body: " ",
    channelId: "habits",
    ongoing: true,
    autoCancel: false,
    schedule: { at, allowWhileIdle: true as const },
    extra: {
      habitId: habitItem.id,
      dateKey: day,
    },
  };
}

/** Immediate sticky notification — title = habit name only */
export async function notifyHabit(habitItem: Habit): Promise<boolean> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return false;
    await ensureChannel();
    const today = dateKey(0);
    await LocalNotifications.schedule({
      notifications: [notifPayload(habitItem, today, new Date(Date.now() + 400))],
    });
    return true;
  } catch (err) {
    console.error("notifyHabit error:", err);
    return false;
  }
}

export async function scheduleAllHabitNotifications(data: AppData): Promise<void> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await ensureChannel();

    const today = dateKey(0);
    const dow = new Date().getDay();
    const list: ReturnType<typeof notifPayload>[] = [];

    for (const h of data.habits) {
      if (!h.time) continue;
      const days = h.reminderDays?.length ? h.reminderDays : ALL_DAYS;
      if (cellLog(data, today, h.id)?.status) continue;

      const fire = nextFireDate(h.time);
      if (!fire) continue;

      const fireDow = fire.getDay();
      if (!days.includes(fireDow)) continue;
      if (fire.toDateString() === new Date().toDateString() && !days.includes(dow)) continue;

      const dayKey =
        fire.toDateString() === new Date().toDateString() ? today : dateKey(1);
      list.push(notifPayload(h, dayKey, fire));
    }

    if (list.length === 0) return;

    await LocalNotifications.cancel({
      notifications: list.map((n) => ({ id: n.id })),
    }).catch(() => undefined);

    await LocalNotifications.schedule({ notifications: list });
  } catch (err) {
    console.error("scheduleAllHabitNotifications error:", err);
  }
}

export async function dismissSticky(habitId: string, date: string) {
  try {
    const id = habitNotificationId(habitId, date);
    await LocalNotifications.cancel({ notifications: [{ id }] });
    await LocalNotifications.removeDeliveredNotifications({
      notifications: [{ id, title: "", body: "", schedule: { at: new Date() } }],
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export function exportDataJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importDataJson(raw: string): AppData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return normalizeData(parsed);
  } catch {
    return null;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
