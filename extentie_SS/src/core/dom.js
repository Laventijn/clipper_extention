import { SEL, ATTR, ROW_ID_PREFIX, LOG_PREFIX } from "../config/selectors.js";

export function debug(...args) {
  console.debug(LOG_PREFIX, ...args);
}

/** Geeft het element terug dat de berichtenlijst bevat, of null. */
export function findMessageRoot(doc = document) {
  return doc.querySelector(SEL.frame) || doc.querySelector(SEL.list);
}

/** Alle berichtrijen onder `root`. */
export function getRows(root) {
  return root ? Array.from(root.querySelectorAll(SEL.row)) : [];
}

function text(row, selector) {
  return row.querySelector(selector)?.textContent.trim() || "";
}

/**
 * Leest de gegevens van één rij.
 * @returns {{msgId: string, box: string, subject: string, name: string, date: string} | null}
 */
export function getRowInfo(row) {
  const rawId = row.getAttribute(ATTR.msgId) || row.id || "";
  const msgId = rawId.startsWith(ROW_ID_PREFIX) ? rawId.slice(ROW_ID_PREFIX.length) : rawId;
  if (!/^\d+$/.test(msgId)) {
    debug("Geen geldig bericht-ID in rij", row);
    return null;
  }

  const itemType = row.getAttribute(ATTR.itemType);
  if (itemType && itemType !== "message") return null;

  return {
    msgId,
    box: row.getAttribute(ATTR.realBox) || "inbox",
    subject: text(row, SEL.rowSubject),
    name: text(row, SEL.rowName),
    date: text(row, SEL.rowDate),
  };
}
