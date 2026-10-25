/* Reminder notifications with actions. No fetch handler — do not cache the app. */
const DB = "one-percent";
const STORE = "marks";
const answered = new Set();
const reposting = new Set();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveMark(payload, status) {
  const row = {
    id: `${payload.dateKey}|${payload.habitId}`,
    habitId: payload.habitId,
    dateKey: payload.dateKey,
    status,
    partialPct: status === "partial" ? 50 : undefined,
  };
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "habit-mark", ...row });
  }
}

function rootActions() {
  return [
    { action: "done", title: "Done" },
    { action: "more", title: "Partial / Missed" },
  ];
}

function detailActions() {
  return [
    { action: "partial", title: "Partial" },
    { action: "missed", title: "Missed" },
  ];
}

function showAgain(note) {
  const data = note.data || {};
  if (!data.habitId || !data.dateKey || data.sticky === false) return Promise.resolve();
  const tag = note.tag || `habit-${data.habitId}-${data.dateKey}`;
  if (answered.has(tag) || reposting.has(tag)) return Promise.resolve();
  reposting.add(tag);
  const stage = data.stage === "detail" ? "detail" : "root";
  const title = note.title || `${data.timeLabel || ""} — ${data.name || "Habit"}`;
  const body =
    stage === "detail"
      ? "Partial or missed? This stays until you choose."
      : note.body || "Mark Done, Partial, or Missed. It stays until you do.";
  return self.registration
    .showNotification(title, {
      body,
      tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [80, 40, 80],
      data: { ...data, sticky: true, stage },
      actions: stage === "detail" ? detailActions() : note.actions?.length ? note.actions : rootActions(),
    })
    .finally(() => {
      setTimeout(() => reposting.delete(tag), 700);
    });
}

function showDetail(note) {
  const data = note.data || {};
  const tag = `habit-${data.habitId}-${data.dateKey}-detail`;
  const title = note.title || `${data.timeLabel || ""} — ${data.name || "Habit"}`;
  return self.registration.showNotification(title, {
    body: data.question || "Partial or missed? This stays until you choose.",
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [40, 30, 40],
    data: { ...data, sticky: true, stage: "detail" },
    actions: detailActions(),
  });
}

async function focusClient(data) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const target = clients[0];
  if (target) {
    await target.focus();
    target.postMessage({ type: "habit-open", habitId: data.habitId, dateKey: data.dateKey });
    return;
  }
  if (self.clients.openWindow) await self.clients.openWindow("/");
}

function finish(note, status) {
  const data = note.data || {};
  const tags = [`habit-${data.habitId}-${data.dateKey}`, `habit-${data.habitId}-${data.dateKey}-detail`];
  for (const tag of tags) answered.add(tag);
  return saveMark(data, status).finally(async () => {
    note.close();
    const notes = await self.registration.getNotifications();
    for (const open of notes) {
      if (tags.includes(open.tag)) open.close();
    }
  });
}

self.addEventListener("notificationclick", (event) => {
  const note = event.notification;
  const data = note.data || {};
  const action = event.action;
  if (action === "done" || action === "partial" || action === "missed") {
    event.waitUntil(finish(note, action));
    return;
  }
  if (action === "more") {
    if (note.tag) answered.add(note.tag);
    event.waitUntil(
      showDetail(note).finally(() => {
        note.close();
      }),
    );
    return;
  }
  event.waitUntil(focusClient(data));
  if (data.sticky === false) note.close();
});

self.addEventListener("notificationclose", (event) => {
  const note = event.notification;
  const tag = note.tag || "";
  if (answered.has(tag)) {
    answered.delete(tag);
    return;
  }
  if (!note.data?.habitId || note.data.sticky === false) return;
  event.waitUntil(showAgain(note));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "close-habit" || !data.tag) return;
  answered.add(data.tag);
  event.waitUntil(
    self.registration.getNotifications({ tag: data.tag }).then((notes) => {
      for (const note of notes) note.close();
    }),
  );
});
