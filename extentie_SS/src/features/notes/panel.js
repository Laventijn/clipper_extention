// Zijpaneel om een notitie te bewerken. Alles zit in een Shadow DOM,
// zodat de stijl van Smartschool en die van de extensie elkaar niet raken.
import { getStore, noteKey, createNote, isNoteEmpty, parseTags, STATUSES } from "../../storage/store.js";
import { debug } from "../../core/dom.js";

const AUTOSAVE_MS = 500;
const STATUS_LABELS = { open: "Open", opgevolgd: "Opgevolgd" };

const CSS = `
  :host { all: initial; font-size: inherit; font-family: inherit; }
  .panel {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(24em, 100vw); box-sizing: border-box;
    display: flex; flex-direction: column; gap: 0.75em;
    padding: 1em 1.1em; overflow-y: auto;
    background: #fff; color: #1f2328; line-height: 1.4;
    font-family: inherit; font-size: 1em;
    border-left: 1px solid #d0d7de; box-shadow: -4px 0 16px rgba(0,0,0,.12);
    z-index: 2147483000;
    transform: translateX(100%); visibility: hidden;
    transition: transform .2s ease, visibility 0s linear .2s;
  }
  .panel.open { transform: none; visibility: visible; transition: transform .2s ease; }
  @media (prefers-reduced-motion: reduce) { .panel, .panel.open { transition: none; } }

  header { display: flex; align-items: center; justify-content: space-between; gap: .5em; }
  h2 { margin: 0; font-size: 1.15em; }
  .icon-btn { font: inherit; font-size: 1.3em; line-height: 1; border: 0; background: none;
    cursor: pointer; padding: .1em .35em; border-radius: 4px; color: #57606a; }
  .icon-btn:hover { background: #f3f4f6; }

  dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: .2em .75em;
    font-size: .9em; background: #f6f8fa; padding: .6em .75em; border-radius: 6px; }
  dt { color: #57606a; }
  dd { margin: 0; overflow-wrap: anywhere; }

  label { display: block; font-weight: 600; font-size: .9em; margin-bottom: .25em; }
  .hint { font-weight: 400; color: #57606a; }
  textarea, input, select {
    font: inherit; width: 100%; box-sizing: border-box;
    padding: .45em .55em; border: 1px solid #d0d7de; border-radius: 6px;
    background: #fff; color: inherit;
  }
  textarea { min-height: 10em; resize: vertical; }
  .link-open { display: inline-block; margin-top: .3em; font-size: .9em; color: #0969da; overflow-wrap: anywhere; }
  .link-open[hidden] { display: none; }

  :focus-visible { outline: 2px solid #1a73e8; outline-offset: 1px; }

  footer { margin-top: auto; display: flex; flex-direction: column; gap: .5em; }
  .saved { font-size: .85em; color: #57606a; min-height: 1.2em; }
  .saved.error { color: #cf222e; }
  .buttons { display: flex; justify-content: space-between; gap: .5em; }
  .btn { font: inherit; padding: .45em .9em; border-radius: 6px; cursor: pointer;
    border: 1px solid #d0d7de; background: #f6f8fa; color: inherit; }
  .btn:hover { background: #eef1f4; }
  .btn.danger { color: #cf222e; }
  .btn.danger:hover { background: #ffebe9; border-color: #cf222e; }
`;

/** Maakt een element. Tekst gaat altijd via textContent (geen innerHTML). */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

/** Geeft een veilige http(s)-URL terug, of null. */
function safeHref(value) {
  const v = value.trim();
  if (!v) return null;
  for (const candidate of [v, `https://${v}`]) {
    try {
      const url = new URL(candidate);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".")) return url.href;
    } catch {
      // volgende poging
    }
  }
  return null;
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("nl-BE", { dateStyle: "short", timeStyle: "short" });
}

function setVal(input, value) {
  if (input.value !== value) input.value = value;
}

// --- Toestand ---------------------------------------------------------------

let ui = null;          // DOM-referenties, lui opgebouwd
let ctx = null;         // { info, key, note } van het geopende bericht
let dirty = false;      // onbewaarde wijzigingen
let saveTimer = null;
let inflight = null;    // lopende bewaring (Promise)
let returnFocusTo = null;

function build() {
  const host = el("div", { id: "ssn-panel-host" });
  const root = host.attachShadow({ mode: "open" });

  const f = {};
  f.title = el("h2", { id: "title", text: "Notitie" });
  f.subject = el("dd");
  f.fromLabel = el("dt", { text: "Van" });
  f.from = el("dd");
  f.date = el("dd");
  f.text = el("textarea", { id: "text", placeholder: "Wat moet je onthouden of opvolgen?" });
  f.link = el("input", { id: "link", type: "url", placeholder: "https://…", autocomplete: "off" });
  f.linkOpen = el("a", { class: "link-open", target: "_blank", rel: "noopener noreferrer", hidden: "" });
  f.tags = el("input", { id: "tags", type: "text", placeholder: "bv. ict, dringend", autocomplete: "off" });
  f.status = el("select", { id: "status" },
    ...STATUSES.map((s) => el("option", { value: s, text: STATUS_LABELS[s] || s })));
  f.saved = el("div", { class: "saved", role: "status", "aria-live": "polite" });

  const panel = el("aside", { class: "panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "title" },
    el("header", {},
      f.title,
      el("button", { type: "button", class: "icon-btn", "aria-label": "Paneel sluiten", title: "Sluiten (Esc)", text: "×", onclick: () => closePanel() }),
    ),
    el("dl", {},
      el("dt", { text: "Onderwerp" }), f.subject,
      f.fromLabel, f.from,
      el("dt", { text: "Datum" }), f.date,
    ),
    el("div", {}, el("label", { for: "text", text: "Notitie" }), f.text),
    el("div", {}, el("label", { for: "link", text: "Link / meer info" }), f.link, f.linkOpen),
    el("div", {}, el("label", { for: "tags" }, "Tags ", el("span", { class: "hint", text: "(kommagescheiden)" })), f.tags),
    el("div", {}, el("label", { for: "status", text: "Status" }), f.status),
    el("footer", {},
      f.saved,
      el("div", { class: "buttons" },
        el("button", { type: "button", class: "btn danger", text: "Verwijderen", onclick: () => deleteNote() }),
        el("button", { type: "button", class: "btn", text: "Sluiten", onclick: () => closePanel() }),
      ),
    ),
  );
  panel.inert = true;

  root.append(el("style", { text: CSS }), panel);

  // Wijzigingen → automatisch bewaren na 500 ms zonder typen.
  for (const input of [f.text, f.link, f.tags]) input.addEventListener("input", onEdit);
  f.status.addEventListener("change", onEdit);
  f.link.addEventListener("input", updateLinkPreview);

  // Toetsen binnen het paneel.
  root.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "s") {
      e.preventDefault();
      saveNow();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    }
  });
  // Toetsen mogen Smartschool niet bereiken: buiten de Shadow DOM lijkt het doel
  // de host (geen invoerveld), waardoor sneltoetsen van Smartschool zouden afgaan.
  for (const type of ["keydown", "keyup", "keypress"]) {
    host.addEventListener(type, (e) => e.stopPropagation());
  }

  // Escape terwijl de focus buiten het paneel staat.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closePanel();
  });
  // Bewaar wanneer het tabblad verborgen wordt of de pagina sluit.
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveNow(); });

  document.body.append(host);
  ui = { host, panel, f };

  getStore().then((store) => store.onChange(onStoreChange)).catch((err) => debug("onChange mislukt", err));
}

function isOpen() {
  return !!ui && ui.panel.classList.contains("open");
}

function updateLinkPreview() {
  const href = safeHref(ui.f.link.value);
  ui.f.linkOpen.hidden = !href;
  if (href) {
    ui.f.linkOpen.href = href;
    ui.f.linkOpen.textContent = `Open link ↗`;
    ui.f.linkOpen.title = href;
  } else {
    ui.f.linkOpen.removeAttribute("href");
  }
}

function showSaved(note) {
  ui.f.saved.classList.remove("error");
  ui.f.saved.textContent = note?.updatedAt ? `Laatst bewaard: ${formatDateTime(note.updatedAt)}` : "Nog niet bewaard";
}

function showError(message) {
  ui.f.saved.classList.add("error");
  ui.f.saved.textContent = message;
}

function fillForm(info, note) {
  const { f } = ui;
  f.subject.textContent = info.subject || note?.subject || "(geen onderwerp)";
  f.fromLabel.textContent = info.box === "outbox" ? "Aan" : "Van";
  f.from.textContent = info.name || note?.from || "";
  f.date.textContent = info.date || note?.date || "";
  setVal(f.text, note?.text ?? "");
  setVal(f.link, note?.link ?? "");
  setVal(f.tags, (note?.tags ?? []).join(", "));
  f.status.value = note?.status ?? "open";
  updateLinkPreview();
  showSaved(note);
}

function readForm() {
  const { f } = ui;
  return {
    text: f.text.value,
    link: f.link.value.trim(),
    tags: parseTags(f.tags.value),
    status: f.status.value,
  };
}

function onEdit() {
  dirty = true;
  ui.f.saved.classList.remove("error");
  ui.f.saved.textContent = "Wijzigingen…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, AUTOSAVE_MS);
}

async function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  // Wacht op een vorige bewaring, zodat we op de recentste versie verderbouwen.
  if (inflight) await inflight.catch(() => {});
  if (!dirty || !ctx) return;

  const current = ctx;
  const { info } = current;
  const base = current.note || createNote({ host: location.host, box: info.box, msgId: info.msgId });
  const candidate = {
    ...base,
    ...readForm(),
    // Kopie uit de rij, voor het overzicht. Behoud de oude waarde als de rij leeg is.
    subject: info.subject || base.subject,
    from: info.name || base.from,
    date: info.date || base.date,
  };
  dirty = false;

  // Niets ingevuld bij een nieuwe notitie: niets bewaren.
  if (!current.note && isNoteEmpty(candidate)) {
    if (ctx === current) showSaved(null);
    return;
  }

  try {
    const store = await getStore();
    inflight = store.set(candidate);
    current.note = await inflight;
    if (ctx === current && !dirty) showSaved(current.note);
  } catch (err) {
    if (ctx === current) dirty = true;
    debug("Bewaren mislukt", err);
    if (ctx === current) showError("Bewaren mislukt. Probeer opnieuw (Ctrl+S).");
  } finally {
    inflight = null;
  }
}

async function deleteNote() {
  if (!ctx) return;
  const current = ctx;
  const hasContent = !!current.note || !isNoteEmpty(readForm());
  // Bij annuleren blijven onbewaarde wijzigingen gewoon staan.
  if (hasContent && !window.confirm("Deze notitie definitief verwijderen?")) return;

  clearTimeout(saveTimer);
  saveTimer = null;
  dirty = false;
  await inflight?.catch(() => {}); // een eerste bewaring kan nog lopen
  try {
    if (current.note) {
      const store = await getStore();
      await store.remove(current.key);
      current.note = null;
    }
    if (ctx === current) closePanel();
  } catch (err) {
    debug("Verwijderen mislukt", err);
    if (ctx === current) showError("Verwijderen mislukt.");
  }
}

/** Houdt het paneel in sync als de notitie elders wijzigt (ander tabblad, options-pagina). */
function onStoreChange({ key, newValue }) {
  if (!ctx || ctx.key !== key || dirty || saveTimer) return;
  ctx.note = newValue;
  fillForm(ctx.info, newValue);
}

// --- Publieke API -------------------------------------------------------------

/**
 * Opent het paneel voor een bericht.
 * @param {{msgId: string, box: string, subject: string, name: string, date: string}} info
 * @param {HTMLElement} [opener] element dat de focus terugkrijgt bij sluiten
 */
export async function openPanel(info, opener) {
  if (!ui) build();
  await saveNow(); // eventueel openstaande notitie eerst bewaren

  const key = noteKey(location.host, info.box, info.msgId);
  const current = { info, key, note: null };
  ctx = current;
  dirty = false;
  returnFocusTo = opener || null;

  fillForm(info, null);
  ui.f.saved.textContent = "Laden…";
  ui.panel.inert = false;
  ui.panel.classList.add("open");
  ui.f.text.focus();

  try {
    const store = await getStore();
    const note = await store.get(key);
    if (ctx !== current) return; // intussen een ander bericht geopend
    current.note = note;
    if (!dirty) fillForm(info, note);
    else showSaved(note);
  } catch (err) {
    debug("Laden mislukt", err);
    if (ctx === current) showError("Notitie laden mislukt.");
  }
}

export async function closePanel() {
  if (!isOpen()) return;
  await saveNow();
  ui.panel.classList.remove("open");
  ui.panel.inert = true;
  ctx = null;
  if (returnFocusTo?.isConnected) returnFocusTo.focus();
  returnFocusTo = null;
}
