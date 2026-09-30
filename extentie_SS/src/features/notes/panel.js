// Notitiepaneel naast de pagina: de host is het laatste kind van #smscMain
// (een flex-rij), waardoor de rest van de pagina vanzelf krimpt.
// De inhoud zit in een Shadow DOM, zodat de CSS van Smartschool niet lekt.
import { getStore, noteKey, createNote, isNoteEmpty, parseTags, STATUSES } from "../../storage/store.js";
import { SEL } from "../../config/selectors.js";
import { debug } from "../../core/dom.js";

const AUTOSAVE_MS = 500;
const GUARD_MS = 150;
const PANEL_OPEN_KEY = "ssn:panelOpen";
const STATUS_LABELS = { open: "Open", opgevolgd: "Opgevolgd" };

// Inline op de host: stijlregels van Smartschool wegen zwaarder dan :host in de Shadow DOM.
const HOST_STYLE =
  "flex:0 0 340px;height:100%;min-width:0;overflow:auto;box-sizing:border-box;" +
  "border-left:1px solid #ddd;background:#fff;font:inherit;";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  [hidden] { display: none !important; }
  .panel {
    display: flex; flex-direction: column; gap: 0.75em;
    min-height: 100%; padding: 1em 1.1em;
    background: #fff; color: #1f2328; line-height: 1.4;
    font-family: inherit; font-size: 1em;
  }
  .content { display: flex; flex-direction: column; gap: 0.75em; flex: 1; }
  .empty { margin: 0; color: #57606a; }

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
    font: inherit; width: 100%;
    padding: .45em .55em; border: 1px solid #d0d7de; border-radius: 6px;
    background: #fff; color: inherit;
  }
  textarea { min-height: 10em; resize: vertical; }
  .link-open { display: inline-block; margin-top: .3em; font-size: .9em; color: #0969da; overflow-wrap: anywhere; }

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
let open = false;       // paneel zichtbaar
let ctx = null;         // { info, key, note } van het getoonde bericht
let dirty = false;      // onbewaarde wijzigingen
let saveTimer = null;
let inflight = null;    // lopende bewaring (Promise)
let openSeq = 0;        // laatste openPanel-aanroep wint
let returnFocusTo = null;
let placeWarned = false;

function build() {
  const host = el("div", { id: "ssn-panel-host" });
  host.style.cssText = HOST_STYLE;
  host.style.display = "none";
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
  f.empty = el("p", { class: "empty", text: "Selecteer een bericht of klik op 📝 om een notitie te maken." });

  f.content = el("div", { class: "content", hidden: "" },
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

  const panel = el("aside", { class: "panel", "aria-labelledby": "title" },
    el("header", {},
      f.title,
      el("button", { type: "button", class: "icon-btn", "aria-label": "Paneel sluiten", title: "Sluiten (Esc)", text: "×", onclick: () => closePanel() }),
    ),
    f.empty,
    f.content,
  );

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
    if (e.key === "Escape" && open) closePanel();
  });
  // Bewaar wanneer het tabblad verborgen wordt.
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveNow(); });

  ui = { host, panel, f };
  place();
  startPlacementGuard();

  getStore().then((store) => store.onChange(onStoreChange)).catch((err) => debug("onChange mislukt", err));
}

// --- Plaatsing in #smscMain ------------------------------------------------------

function isPlaced() {
  const main = document.querySelector(SEL.main);
  return !main || (ui.host.parentElement === main && main.lastElementChild === ui.host);
}

/** Zet de host als laatste kind van #smscMain. Doet niets als #smscMain ontbreekt. */
function place() {
  const main = document.querySelector(SEL.main);
  if (!main) {
    if (!placeWarned) debug("#smscMain niet gevonden, paneel wacht tot het verschijnt.");
    placeWarned = true;
    return;
  }
  placeWarned = false;
  if (!isPlaced()) main.append(ui.host);
}

/** Smartschool bouwt #smscMain soms opnieuw op: plaats de host terug als hij verdwenen is. */
function startPlacementGuard() {
  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer || isPlaced()) return;
    timer = setTimeout(() => {
      timer = null;
      place();
    }, GUARD_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function setOpen(value, persist = true) {
  open = value;
  ui.host.style.display = value ? "block" : "none";
  if (value) place();
  if (persist) chrome.storage.local.set({ [PANEL_OPEN_KEY]: value }).catch((err) => debug("panelOpen bewaren mislukt", err));
}

// --- Formulier -----------------------------------------------------------------

function updateLinkPreview() {
  const href = safeHref(ui.f.link.value);
  ui.f.linkOpen.hidden = !href;
  if (href) {
    ui.f.linkOpen.href = href;
    ui.f.linkOpen.textContent = "Open link ↗";
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

function showEmpty() {
  ui.f.content.hidden = true;
  ui.f.empty.hidden = false;
}

function fillForm(info, note) {
  const { f } = ui;
  f.content.hidden = false;
  f.empty.hidden = true;
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

// --- Bewaren en verwijderen -------------------------------------------------------

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
    // Het paneel blijft open en toont een leeg formulier voor dit bericht.
    if (ctx === current) fillForm(current.info, null);
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
 * Toont de notitie van een bericht en opent het paneel als het dicht is.
 * Een openstaande wijziging wordt eerst direct bewaard.
 * @param {{msgId: string, box: string, subject: string, name: string, date: string}} info
 * @param {{opener?: HTMLElement, focus?: boolean}} [options]
 *   opener: krijgt de focus terug bij sluiten; focus: cursor in het tekstvak (standaard true)
 */
export async function openPanel(info, { opener, focus = true } = {}) {
  if (!ui) build();
  const seq = ++openSeq;
  if (opener) returnFocusTo = opener;

  const key = noteKey(location.host, info.box, info.msgId);

  // Zelfde bericht: niets herladen, zodat wat je typt niet overschreven wordt.
  if (ctx?.key === key) {
    ctx.info = info;
    setOpen(true);
    if (focus) ui.f.text.focus();
    return;
  }

  await saveNow();
  if (seq !== openSeq) return; // intussen een nieuwer verzoek
  if (dirty) {
    // Bewaren mislukte: blijf bij de huidige notitie zodat er niets verloren gaat.
    setOpen(true);
    return;
  }

  const current = { info, key, note: null };
  ctx = current;
  setOpen(true);
  fillForm(info, null);
  ui.f.saved.textContent = "Laden…";
  if (focus) ui.f.text.focus();

  try {
    const store = await getStore();
    const note = await store.get(key);
    if (ctx !== current) return; // intussen een ander bericht
    current.note = note;
    if (!dirty) fillForm(info, note);
    else showSaved(note);
  } catch (err) {
    debug("Laden mislukt", err);
    if (ctx === current) showError("Notitie laden mislukt.");
  }
}

/** Toont de notitie van het geselecteerde bericht, maar alleen als het paneel open staat. */
export function followSelection(info) {
  if (!open) return;
  openPanel(info, { focus: false }).catch((err) => debug("Selectie volgen mislukt", err));
}

export async function closePanel() {
  if (!ui || !open) return;
  openSeq++; // annuleer een openPanel dat nog wacht
  await saveNow();
  setOpen(false);
  ctx = null;
  if (returnFocusTo?.isConnected) returnFocusTo.focus();
  returnFocusTo = null;
}

/**
 * Herstelt de open/dicht-toestand van de vorige keer.
 * Staat het paneel open, dan toont het meteen de notitie van het geselecteerde bericht.
 * @param {() => object|null} getSelectedInfo
 */
export async function initPanel(getSelectedInfo) {
  let wasOpen = false;
  try {
    wasOpen = !!(await chrome.storage.local.get(PANEL_OPEN_KEY))[PANEL_OPEN_KEY];
  } catch (err) {
    debug("panelOpen lezen mislukt", err);
  }
  if (!wasOpen) return;

  if (!ui) build();
  const info = getSelectedInfo();
  if (info) {
    await openPanel(info, { focus: false });
  } else {
    showEmpty();
    setOpen(true, false);
  }
}
