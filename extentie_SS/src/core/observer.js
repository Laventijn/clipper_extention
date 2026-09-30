import { SEL, OWN } from "../config/selectors.js";
import { findMessageRoot, getRows, getRowInfo, debug } from "./dom.js";

const DEBOUNCE_MS = 150;

/**
 * Roept elke enhancer één keer per rij aan, ook na herladen van de lijst.
 * Een enhancer is `(row, info) => void` en moet zelf idempotent zijn.
 * `isDone(row)` controleert of de rij nog volledig verrijkt is: als Smartschool
 * de inhoud van een bestaande rij vervangt, verdwijnt onze knop en verrijken we opnieuw.
 */
export function watchMessageList({ enhancers, isDone }) {
  const run = () => {
    const root = findMessageRoot();
    if (!root) return;
    for (const row of getRows(root)) {
      if (row.hasAttribute(OWN.doneAttr) && isDone(row)) continue;
      const info = getRowInfo(row);
      if (!info) continue;
      for (const enhance of enhancers) {
        try {
          enhance(row, info);
        } catch (err) {
          debug("Enhancer faalde", err);
        }
      }
      row.setAttribute(OWN.doneAttr, "1");
    }
  };

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, DEBOUNCE_MS);
  };

  // Observeer de ouder: #msglist zelf kan vervangen worden.
  // Als #messageframe ontbreekt, valt dit terug op body.
  const target = document.querySelector(SEL.frame) || document.body;
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length > 0)) schedule();
  });
  observer.observe(target, { childList: true, subtree: true });

  run();
  return () => observer.disconnect();
}
