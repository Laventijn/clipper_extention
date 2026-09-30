// Alle Smartschool-selectors en -attributen op één plek.
// Past Smartschool zijn HTML aan, dan hoeft enkel dit bestand te veranderen.

export const SEL = {
  // Containers
  frame: "#messageframe",          // ouder van de lijst, blijft bestaan
  list: "#msglist",                // wordt via AJAX herladen of vervangen
  main: "#smscMain",               // flex-rij in body; het notitiepaneel komt hier als laatste kind in

  // Geselecteerd bericht (aria-selected="true" op de rij)
  selectedRow: "#msglist div.modern-message[aria-selected='true']",

  // Eén rij per bericht
  row: "div.modern-message",
  rowActions: ".modern-message__actions",
  rowIcons: ".modern-message__icons",
  rowName: ".modern-message__name",
  rowSubject: ".modern-message__subject",
  rowDate: ".modern-message__date",

  // Status-iconen
  repliedIcon: ".modern-message__icon--replied",
};

export const ATTR = {
  msgId: "msgid",                  // "row_9517330"
  realBox: "realbox",              // inbox | outbox | ...
  itemType: "itemtype",            // "message"
  selected: "aria-selected",       // "true" bij het geselecteerde bericht
};

export const ROW_ID_PREFIX = "row_";

// Eigen markeringen en klassen van de extensie
export const OWN = {
  doneAttr: "data-ssn-done",
  noteBtnClass: "ssn-note-btn",
};

export const LOG_PREFIX = "[Smartschool Notities]";
