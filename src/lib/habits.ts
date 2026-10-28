import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const STORAGE_KEY = "one_percent_loop_v3";
export const LEGACY_KEY = "one_percent_loop_v2";
export const THEME_KEY = "one_percent_theme_v2";
export const PREFS_KEY = "one_percent_prefs_v1";

export type DisplayPrefs = {
  fontScale: number;
  visibleDays: number;
  wakeUpTime: string;
  sleepTime: string;
};

export function defaultPrefs(): DisplayPrefs {
  return { fontScale: 1, visibleDays: 4, wakeUpTime: "05:00", sleepTime: "21:00" };
}

export function clampPrefs(prefs: Partial<DisplayPrefs> | null | undefined): DisplayPrefs {
  const fontScale = Number(prefs?.fontScale);
  const visibleDays = Number(prefs?.visibleDays);
  return {
    fontScale: Number.isFinite(fontScale) ? Math.min(1, Math.max(0.6, fontScale)) : 1,
    visibleDays: Number.isFinite(visibleDays) ? Math.min(7, Math.max(1, Math.round(visibleDays))) : 4,
    wakeUpTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(prefs?.wakeUpTime ?? "") ? prefs!.wakeUpTime! : "05:00",
    sleepTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(prefs?.sleepTime ?? "") ? prefs!.sleepTime! : "21:00",
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
  /** Session start (display + duration) */
  startTime: string;
  /** Session end (display + duration) */
  endTime: string;
  /** When the notification should fire (independent of start/end) */
  reminderTime: string;
  /** @deprecated kept for old backups — mapped to startTime/reminderTime on load */
  time?: string;
  freqType: FreqType;
  freqDays: number[];
  freqNum: number;
  freqDates: string[];
  reminderDays: number[];
  sticky: boolean;
  color?: string;
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

const PILL_COLORS = ["#ff0000", "#ff7f00", "#ffff00", "#00a550", "#0000ff", "#4b0082", "#8f00ff"];
export function colorForHabit(_h: Habit, index: number): string {
  return PILL_COLORS[index % PILL_COLORS.length];
}

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
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${mS} ${ampm}`;
}

/** e.g. "2 h 30 m" from start/end */
export function durationLabel(start: string, end: string): string {
  const a = parseTime(start);
  const b = parseTime(end);
  if (!a || !b) return "";
  let mins = b.hour * 60 + b.minute - (a.hour * 60 + a.minute);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} m`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} m`;
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
  startTime: string,
  endTime: string,
  reminderTime: string,
  extra?: Partial<Habit>,
): Habit {
  return {
    id,
    name,
    question,
    startTime,
    endTime,
    reminderTime,
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

function normalizeHabit(raw: Partial<Habit> & { id?: string; name?: string; time?: string }): Habit | null {
  if (!raw.id || !raw.name) return null;
  const legacy = typeof raw.time === "string" && raw.time.includes(":") ? raw.time : "07:00";
  const startTime =
    typeof raw.startTime === "string" && raw.startTime.includes(":") ? raw.startTime : legacy;
  const endTime =
    typeof raw.endTime === "string" && raw.endTime.includes(":") ? raw.endTime : "";
  const reminderTime =
    typeof raw.reminderTime === "string" && raw.reminderTime.includes(":")
      ? raw.reminderTime
      : startTime;
  return {
    id: String(raw.id),
    name: String(raw.name),
    question: typeof raw.question === "string" ? raw.question : "",
    startTime,
    endTime,
    reminderTime,
    freqType: raw.freqType ?? "daily",
    freqDays: asNumberArray(raw.freqDays, [...ALL_DAYS]),
    freqNum: typeof raw.freqNum === "number" && raw.freqNum > 0 ? raw.freqNum : 2,
    freqDates: Array.isArray(raw.freqDates) ? raw.freqDates.filter((d) => typeof d === "string") : [],
    reminderDays: asNumberArray(raw.reminderDays, [...ALL_DAYS]),
    sticky: raw.sticky !== false,
    color: typeof raw.color === "string" ? raw.color : undefined,
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
    /* fall through */
  }
  const fresh = defaultData();
  saveData(fresh);
  return fresh;
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

export function sortedHabits(data: AppData): Habit[] {
  return [...data.habits].sort((a, b) =>
    (a.startTime || a.reminderTime || "00:00").localeCompare(b.startTime || b.reminderTime || "00:00"),
  );
}

export function cellLog(data: AppData, key: string, habitId: string): CellLog | null {
  return data.logs[key]?.[habitId] ?? null;
}

function minuteValue(time: string): number { const [h,m] = time.split(":").map(Number); return (h || 0) * 60 + (m || 0); }
function emptyBlockText(start: number, end: number): string {
  const total = Math.max(0,end-start), h = Math.floor(total/60), m = total%60;
  if (h && m) return `${h} h ${m} min`; if (h) return `${h} h`; return `${m} min`;
}
function timeString(total: number): string { const v=Math.max(0,Math.min(1439,total)); return `${String(Math.floor(v/60)).padStart(2,"0")}:${String(v%60).padStart(2,"0")}`; }
export function auditForDate(data: AppData, key: string, wakeUpTime = "05:00", sleepTime = "21:00"): string {
  const wake=minuteValue(wakeUpTime), sleep=minuteValue(sleepTime)>wake?minuteValue(sleepTime):21*60;
  const tasks=sortedHabits(data).filter(h=>minuteValue(h.startTime)>=wake&&minuteValue(h.startTime)<sleep);
  const lines=[`${format12(wakeUpTime)} | Wake-up`]; let cursor=wake;
  tasks.forEach((h,index)=>{
    const start=minuteValue(h.startTime);
    if(start>cursor) lines.push(`${format12(timeString(cursor))} | EMPTY | ${emptyBlockText(cursor,start)}`);
    const log=cellLog(data,key,h.id);
    const status=!log?.status?"UNMARKED":log.status==="done"?"DONE":log.status==="partial"?`PARTIAL (${log.partialPct||50}%)`:"MISSED";
    const reasons=log?.reasons?.length?` | ${log.reasons.join(", ")}`:"", note=log?.note?` | ${log.note}`:"";
    lines.push(`${format12(h.startTime)} | ${h.name} | ${status}${reasons}${note}`);
    const next=tasks[index+1]?minuteValue(tasks[index+1].startTime):sleep; let end=h.endTime?minuteValue(h.endTime):next;
    if(end<=start) end+=1440; cursor=Math.max(cursor,Math.min(sleep,end));
  });
  if(cursor<sleep) lines.push(`${format12(timeString(cursor))} | EMPTY | ${emptyBlockText(cursor,sleep)}`);
  lines.push(`${format12(sleepTime)} | Sleep`);
  return [`Date: ${humanDate(key)}`,...lines].join("\n");
}
export function auditText(data: AppData, dayOffset=0, wakeUpTime="05:00", sleepTime="21:00"): string { return auditForDate(data,dateKey(dayOffset),wakeUpTime,sleepTime);}

function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yr = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

export function auditRange(data: AppData, fromKey: string, toKey: string, wakeUpTime="05:00", sleepTime="21:00"): string {
  let start = fromKey <= toKey ? fromKey : toKey;
  const end = fromKey <= toKey ? toKey : fromKey;
  const chunks: string[] = [];
  const limit = 62;
  let truncated = false;
  for (let i = 0; i < limit && start <= end; i += 1) {
    chunks.push(auditForDate(data, start, wakeUpTime, sleepTime));
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
  return habit("", "", "", "09:00", "11:00", "09:00");
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
  if (!time24 || !time24.includes(":")) return null;
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
  d.setMilliseconds(0);
  d.setHours(t.hour, t.minute, 0, 0);
  // If this minute already passed, schedule tomorrow
  if (d.getTime() <= Date.now()) {
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
  return {
    id: habitNotificationId(habitItem.id, day),
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

export async function notifyHabit(habitItem: Habit): Promise<boolean> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return false;
    await ensureChannel();
    const today = dateKey(0);
    await LocalNotifications.schedule({
      notifications: [notifPayload(habitItem, today, new Date(Date.now() + 300))],
    });
    return true;
  } catch (err) {
    console.error("notifyHabit error:", err);
    return false;
  }
}

/** Schedule at reminderTime; also re-show sticky ones already due but unmarked */
export async function scheduleAllHabitNotifications(data: AppData): Promise<void> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await ensureChannel();

    const today = dateKey(0);
    const now = new Date();
    const dow = now.getDay();
    const list: ReturnType<typeof notifPayload>[] = [];

    for (const h of data.habits) {
      const remind = h.reminderTime || h.startTime;
      if (!remind) continue;
      const days = h.reminderDays?.length ? h.reminderDays : ALL_DAYS;
      if (cellLog(data, today, h.id)?.status) continue;

      const t = parseTime(remind);
      if (!t) continue;

      // If reminder time already passed today and still unmarked → show sticky immediately
      const todayFire = new Date();
      todayFire.setSeconds(0, 0);
      todayFire.setMilliseconds(0);
      todayFire.setHours(t.hour, t.minute, 0, 0);

      if (days.includes(dow) && todayFire.getTime() <= now.getTime()) {
        list.push(notifPayload(h, today, new Date(Date.now() + 400)));
        continue;
      }

      const fire = nextFireDate(remind);
      if (!fire) continue;
      const fireDow = fire.getDay();
      if (!days.includes(fireDow)) continue;

      const dayKey =
        fire.toDateString() === now.toDateString() ? today : dateKey(1);
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
    return normalizeData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return null;
  }
}

/** Write JSON to app documents and open the system share sheet (save to Files / Drive) */
export async function exportHabitsFile(data: AppData): Promise<boolean> {
  try {
    const json = exportDataJson(data);
    const name = `1percent-habits-${dateKey(0)}.json`;
    const written = await Filesystem.writeFile({
      path: name,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title: "Habits backup",
      text: "1% Habits backup",
      url: written.uri,
      dialogTitle: "Save habits backup",
    });
    return true;
  } catch (err) {
    console.error("exportHabitsFile", err);
    return false;
  }
}
