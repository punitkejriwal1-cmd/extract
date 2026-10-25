export type PendingMark = {
  id: string;
  habitId: string;
  dateKey: string;
  status: "done" | "partial" | "missed";
  partialPct?: number;
};

const DB = "one-percent";
const STORE = "marks";

function openDb(): Promise<IDBDatabase> {
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

export async function drainMarks(): Promise<PendingMark[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const get = store.getAll();
      get.onsuccess = () => {
        store.clear();
        resolve(get.result as PendingMark[]);
      };
      get.onerror = () => reject(get.error);
    });
  } finally {
    db.close();
  }
}
