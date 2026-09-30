import { SEL, ATTR } from "../config/selectors.js";
import { getRowInfo } from "./dom.js";

// Klikken op deze elementen selecteren geen bericht (checkbox, snelle actie, ...).
const INTERACTIVE = "input, button, a, label, select, textarea, quick-reply";

/**
 * Meldt elk bericht dat geselecteerd wordt, via `onSelect(info)`.
 * - Hoofdroute: attribuutwijziging van `aria-selected` in de berichtenlijst.
 * - Terugval: een klik op een rij.
 * Beide routes kunnen hetzelfde bericht twee keer melden. De ontvanger moet dat aankunnen.
 */
export function watchSelection(onSelect) {
  const emit = (row) => {
    const info = getRowInfo(row);
    if (info) onSelect(info);
  };

  // #msglist kan vervangen worden, dus observeer de ouder.
  const target = document.querySelector(SEL.frame) || document.body;
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const row = m.target;
      if (row.matches?.(SEL.row) && row.closest(SEL.list) && row.getAttribute(ATTR.selected) === "true") {
        emit(row);
      }
    }
  });
  observer.observe(target, { attributes: true, subtree: true, attributeFilter: [ATTR.selected] });

  const onClick = (e) => {
    const t = e.target;
    if (!(t instanceof Element) || t.closest(INTERACTIVE)) return;
    const row = t.closest(SEL.row);
    if (row?.closest(SEL.list)) emit(row);
  };
  document.addEventListener("click", onClick, true);

  return {
    /** Info van het nu geselecteerde bericht, of null. */
    getSelectedInfo() {
      const row = document.querySelector(SEL.selectedRow);
      return row ? getRowInfo(row) : null;
    },
    stop() {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    },
  };
}
