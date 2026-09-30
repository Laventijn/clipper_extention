// Implementatie van het NotesStore-contract (zie store.js) met chrome.storage.local.
import { NOTE_PREFIX, SCHEMA_VERSION, normalizeNote } from "./store.js";

const area = chrome.storage.local;

async function allNotes() {
  const items = await area.get(null);
  return Object.entries(items)
    .filter(([key]) => key.startsWith(NOTE_PREFIX))
    .map(([, note]) => note);
}

function matchesQuery(note, query) {
  if (!query) return true;
  const haystack = [note.subject, note.from, note.text, note.link, ...(note.tags || [])]
    .join(" ")
    .toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));
}

export const store = {
  async get(key) {
    const items = await area.get(key);
    return items[key] ?? null;
  },

  async set(note) {
    const now = new Date().toISOString();
    const saved = {
      ...note,
      schemaVersion: SCHEMA_VERSION,
      createdAt: note.createdAt || now,
      updatedAt: now,
    };
    await area.set({ [saved.key]: saved });
    return saved;
  },

  async remove(key) {
    await area.remove(key);
  },

  async list({ host, box, query, status } = {}) {
    return (await allNotes())
      .filter((n) => !host || n.host === host)
      .filter((n) => !box || n.box === box)
      .filter((n) => !status || n.status === status)
      .filter((n) => matchesQuery(n, query))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  },

  async exportAll() {
    const notes = await allNotes();
    return JSON.stringify(
      { app: "smartschool-notities", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), notes },
      null,
      2,
    );
  },

  /**
   * merge: true  → bestaande notities blijven, bij conflict wint de recentste updatedAt.
   * merge: false → alle bestaande notities worden eerst gewist.
   */
  async importAll(json, { merge = true } = {}) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    const rawNotes = Array.isArray(data) ? data : data?.notes;
    if (!Array.isArray(rawNotes)) throw new Error("Ongeldig bestand: geen lijst met notities gevonden.");

    const existing = new Map((await allNotes()).map((n) => [n.key, n]));
    const toWrite = {};
    let skipped = 0;

    for (const raw of rawNotes) {
      const note = normalizeNote(raw);
      if (!note) { skipped++; continue; }
      const old = merge ? existing.get(note.key) : null;
      if (old && String(old.updatedAt) >= String(note.updatedAt)) { skipped++; continue; }
      note.createdAt ||= new Date().toISOString();
      note.updatedAt ||= note.createdAt;
      toWrite[note.key] = note;
    }

    if (!merge && existing.size) await area.remove([...existing.keys()]);
    await area.set(toWrite);
    return { imported: Object.keys(toWrite).length, skipped };
  },

  onChange(callback) {
    const listener = (changes, areaName) => {
      if (areaName !== "local") return;
      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key.startsWith(NOTE_PREFIX)) callback({ key, oldValue: oldValue ?? null, newValue: newValue ?? null });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};

