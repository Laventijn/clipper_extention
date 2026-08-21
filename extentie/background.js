// Rechtsklik-menu-item aanmaken zodra de extensie start
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "voegToeAanOpvolglijst",
    title: "Voeg toe aan opvolglijst",
    contexts: ["selection"] // enkel zichtbaar als je tekst selecteerde
  });
});

// Klik op het menu-item verwerken
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "voegToeAanOpvolglijst") return;
  if (!info.selectionText) return;

  const nieuwItem = {
    tekst: info.selectionText.trim(),
    bron: tab.url || "",
    platform: detecteerPlatform(tab.url || ""),
    datum: new Date().toISOString(),
    verwerkt: false
  };

  const { items = [] } = await chrome.storage.local.get("items");
  items.push(nieuwItem);
  await chrome.storage.local.set({ items });

  // Kleine visuele bevestiging via het extensie-icoon
  chrome.action.setBadgeText({ text: String(items.length) });
  chrome.action.setBadgeBackgroundColor({ color: "#2e7d32" });
});

function detecteerPlatform(url) {
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("linkedin.com")) return "LinkedIn";
  return "Onbekend";
}
