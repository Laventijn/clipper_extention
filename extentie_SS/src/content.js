// Bootstrap. Content scripts kunnen geen statische imports gebruiken,
// daarom laden we de modules dynamisch (zie web_accessible_resources).
(async () => {
  const LOG = "[Smartschool Notities]";
  const load = (path) => import(chrome.runtime.getURL(path));

  try {
    const { SEL } = await load("src/config/selectors.js");
    const isMessageModule = () =>
      !!(document.querySelector(SEL.frame) || document.querySelector(SEL.list));

    if (!isMessageModule()) {
      console.debug(LOG, "Geen berichtenmodule op deze pagina, extensie blijft inactief.");
      return;
    }

    const { watchMessageList } = await load("src/core/observer.js");
    const { attachNoteButton, hasNoteButton } = await load("src/features/notes/button.js");

    const { watchSelection } = await load("src/core/selection.js");
    const { initPanel, followSelection } = await load("src/features/notes/panel.js");

    watchMessageList({
      enhancers: [attachNoteButton],
      isDone: hasNoteButton,
    });

    // Het paneel volgt het geselecteerde bericht en onthoudt of het open stond.
    const selection = watchSelection(followSelection);
    await initPanel(selection.getSelectedInfo);
    console.debug(LOG, "Actief.");
  } catch (err) {
    console.debug(LOG, "Opstarten mislukt", err);
  }
})();
