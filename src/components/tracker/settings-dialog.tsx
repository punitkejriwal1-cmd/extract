import { useEffect, useState } from "react";
import { Sheet } from "@/components/tracker/sheet";
import { cn } from "@/lib/cn";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useHabits } from "@/lib/habit-store";
import { notifyHabit } from "@/lib/habits";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
};

const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useHabits((s) => s.data);
  const prefs = useHabits((s) => s.prefs);
  const setPrefs = useHabits((s) => s.setPrefs);
  const reset = useHabits((s) => s.reset);
  const showToast = useHabits((s) => s.showToast);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [installEvent, setInstallEvent] = useState<InstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") setPermission("unsupported");
    else setPermission(Notification.permission);
    const nav = navigator as Navigator & { standalone?: boolean };
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

async function enableAlerts() {
  try {
    const perm = await LocalNotifications.requestPermissions();
    setPermission(perm.display === "granted" ? "granted" : "denied");
    showToast(perm.display === "granted" ? "Notifications on" : "Permission denied");
  } catch {
    showToast("Could not request permission");
  }
}

async function testAlert() {
  const sample = data.habits[0];
  if (!sample) {
    showToast("Add a habit first");
    return;
  }

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") {
    await enableAlerts();
  }

  const ok = await notifyHabit({ ...sample, sticky: true });
  showToast(ok ? "Notification sent — it stays until you mark it" : "Allow notifications first");
}
  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      setInstallEvent(null);
      return;
    }
    window.location.assign("/?install=1");
  }

  const percent = Math.round(prefs.fontScale * 100);
  const previous = prefs.visibleDays - 1;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Settings"
    >
      <section className="space-y-3 rounded-xl bg-chip p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">Text size</h3>
          <span className="font-mono text-xs font-bold text-accent tabular-nums">{percent}%</span>
        </div>
        <p className="text-sm text-pretty text-muted">
          Shrink habit text so a longer list still fits in one screenshot.
        </p>
        <input
          type="range"
          min={60}
          max={100}
          step={5}
          value={percent}
          aria-label="Habit text size"
          className="w-full"
          onChange={(e) => setPrefs({ fontScale: Number(e.target.value) / 100 })}
        />
        <div className="flex items-center justify-between text-xs font-bold text-muted">
          <span>Smaller</span>
          <span>Default</span>
        </div>
        <div className="rounded-xl border border-line bg-raised px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="habit-time shrink-0 rounded-md bg-chip px-1.5 py-0.5 font-mono font-bold text-ink">
              06:00 AM
            </span>
            <span className="habit-name truncate font-bold text-ink">Wake Up On Time</span>
          </div>
          {prefs.fontScale < 0.8 ? null : (
            <div className="habit-meta mt-0.5 text-muted">Every day</div>
          )}
        </div>
      </section>

      <section className="mt-3 space-y-3 rounded-xl bg-chip p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">Days on home</h3>
          <span className="font-mono text-xs font-bold text-accent tabular-nums">{prefs.visibleDays}</span>
        </div>
        <p className="text-sm text-pretty text-muted">
          {prefs.visibleDays === 1
            ? "Only today is shown."
            : `Today and the previous ${previous} day${previous === 1 ? "" : "s"}.`}
        </p>
        <div className="grid grid-cols-7 gap-1">
          {DAY_CHOICES.map((count) => {
            const active = prefs.visibleDays === count;
            return (
              <button
                key={count}
                type="button"
                aria-pressed={active}
                aria-label={`Show ${count} day${count === 1 ? "" : "s"}`}
                onClick={() => setPrefs({ visibleDays: count })}
                className={cn(
                  "min-h-11 rounded-lg border text-sm font-extrabold",
                  active ? "border-accent bg-accent text-accent-fg" : "border-line bg-raised text-muted",
                )}
              >
                {count}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-3 space-y-3 rounded-xl bg-chip p-3">
        <h3 className="text-sm font-bold text-ink">Reminders</h3>
        <p className="text-sm text-pretty text-muted">
          Alerts fire at each habit’s time while 1% is open. A sticky alert stays in the shade until you tap Done,
          Partial, or Missed. Swiping it away brings it back. Phones show two buttons, so use Partial / Missed when it
          was not fully done.
        </p>
        <p className="font-mono text-xs text-muted">
          Status: {permission === "unsupported" ? "not available" : permission}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-partial text-sm font-bold text-partial-fg"
            onClick={() => void enableAlerts()}
          >
            Allow notifications
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl bg-accent px-3 text-sm font-bold text-accent-fg"
            onClick={() => void testAlert()}
          >
            Test
          </button>
        </div>
      </section>

      {standalone ? (
        <p className="mt-3 rounded-xl bg-chip p-3 text-sm text-muted">Already on your home screen.</p>
      ) : (
        <button
          type="button"
          className="mt-3 min-h-11 w-full rounded-xl bg-accent text-sm font-extrabold text-accent-fg"
          onClick={() => void install()}
        >
          Add to home screen
        </button>
      )}

      <button
        type="button"
        className="mt-3 min-h-11 w-full rounded-xl bg-missed/15 text-sm font-bold text-missed"
        onClick={() => {
          reset();
          showToast("Reset complete");
        }}
      >
        Reset default habits
      </button>
    </Sheet>
  );
}
