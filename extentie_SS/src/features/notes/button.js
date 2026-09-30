import { SEL, OWN } from "../../config/selectors.js";
import { debug, getRowInfo } from "../../core/dom.js";
import { openPanel } from "./panel.js";

/** True als de rij al een notitieknop heeft. */
export function hasNoteButton(row) {
  return !!row.querySelector(`.${OWN.noteBtnClass}`);
}

/** Plaatst één 📝-knop in de acties van de rij. */
export function attachNoteButton(row, info) {
  if (hasNoteButton(row)) return;

  const actions = row.querySelector(SEL.rowActions);
  if (!actions) {
    debug("Geen actiezone gevonden voor bericht", info.msgId);
    return;
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = OWN.noteBtnClass;
  btn.textContent = "📝";
  btn.title = "Notitie bij dit bericht";
  btn.setAttribute("aria-label", "Notitie bij dit bericht");

  // Voorkom dat Smartschool het bericht opent of een sleepactie start.
  for (const type of ["mousedown", "pointerdown", "dblclick"]) {
    btn.addEventListener(type, (e) => e.stopPropagation());
  }
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Lees de rij opnieuw: Smartschool kan de inhoud intussen bijgewerkt hebben.
    openPanel(getRowInfo(row) || info, { opener: btn }).catch((err) => debug("Paneel openen mislukt", err));
  });

  actions.prepend(btn);
}
