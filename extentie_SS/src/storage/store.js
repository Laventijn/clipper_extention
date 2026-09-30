// Contract van de opslaglaag. De rest van de code gebruikt alleen dit bestand.
//
// Elke implementatie (nu localStore.js, later bv. remoteStore.js) levert:
//   async get(key)                          → note | null
//   async set(note)                         → note  (vult createdAt/updatedAt aan)
//   async remove(key)
//   async list({ host, box, query, status }) → note[]  (nieuwste eerst)
//   async exportAll()                       → JSON-string
//   async importAll(json, { merge: true })  → { imported, skipped }
//   onChange(callback)                      → functie om af te melden
//                                             callback({ key, oldValue, newValue })

export const SCHEMA_VERSION = 1;
export const NOTE_PREFIX = "note:";
export const STATUSES = ["open", "opgevolgd"];
export const SETTINGS_KEY = "settings";

// Beschikbare opslag. Implementaties worden lui geladen om import-cycli te vermijden.
export const BACKENDS = {
  local: { label: "Lokaal (deze browser)", load: () => import("./localStore.js") },
};

/** Sleutel: note:{host}:{box}:{msgId}. Box is het type (realbox), nooit de map. */
export function noteKey(host, box, msgId) {
  return `${NOTE_PREFIX}${host}:${box}:${msgId}`;
}

export function createNote({ host, box, msgId, subject = "", from = "", date = "" }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    key: noteKey(host, box, msgId),
    host, box, msgId,
    subject, from, date,
    text: "",
    link: "",
    tags: [],
    status: "open",
    createdAt: null,
    updatedAt: null,
    replyMsgId: null, // FASE 2
  };
}

/** Een notitie zonder inhoud hoeft niet bewaard te worden. */
export function isNoteEmpty(note) {
  return !note.text.trim() && !note.link.trim() && note.tags.length === 0 && note.status === "open";
}

export function parseTags(value) {
  const tags = String(value || "").split(",").map((t) => t.trim()).filter(Boolean);
  return [...new Set(tags)];
}

/** Zet willekeurige invoer (bv. uit een import) om naar een geldige notitie, of null. */
export function normalizeNote(raw) {
  if (!raw || typeof raw !== "object") return null;
  const { host, box, msgId } = raw;
  if (![host, box, msgId].every((v) => typeof v === "string" && v)) return null;
  const note = createNote({
    host, box, msgId,
    subject: String(raw.subject ?? ""),
    from: String(raw.from ?? ""),
    date: String(raw.date ?? ""),
  });
  note.text = String(raw.text ?? "");
  note.link = String(raw.link ?? "");
  note.tags = Array.isArray(raw.tags) ? parseTags(raw.tags.join(",")) : [];
  note.status = STATUSES.includes(raw.status) ? raw.status : "open";
  note.createdAt = typeof raw.createdAt === "string" ? raw.createdAt : null;
  note.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : null;
  note.replyMsgId = raw.replyMsgId ? String(raw.replyMsgId) : null;
  return note;
}

let current = null;

/** Geeft de gekozen opslag terug (instelling "settings.storage", standaard "local"). */
export async function getStore() {
  if (current) return current;
  let name = "local";
  try {
    const settings = (await chrome.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY];
    if (settings?.storage in BACKENDS) name = settings.storage;
  } catch {
    // val terug op lokaal
  }
  const mod = await BACKENDS[name].load();
  current = mod.store;
  return current;
}
