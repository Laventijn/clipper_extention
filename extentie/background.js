// Rechtsklik-menu-items aanmaken zodra de extensie start
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "voegSelectieToeAanOpvolglijst",
    title: "Voeg geselecteerde tekst toe aan opvolglijst",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "voegLinkToeAanOpvolglijst",
    title: "Bewaar deze link in opvolglijst",
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "voegScreenshotToeAanOpvolglijst",
    title: "Maak screenshot voor opvolglijst",
    contexts: ["page", "selection", "link"]
  });
});

// Klik op het menu-item verwerken
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url) return;

  let nieuwItem = null;

  if (info.menuItemId === "voegSelectieToeAanOpvolglijst" && info.selectionText) {
    nieuwItem = maakBasisItem(tab, {
      type: "tekst",
      tekst: info.selectionText.trim(),
      bron: tab.url
    });
  }

  if (info.menuItemId === "voegLinkToeAanOpvolglijst" && info.linkUrl) {
    nieuwItem = maakBasisItem(tab, {
      type: "link",
      tekst: info.linkText || info.linkUrl,
      bron: info.linkUrl
    });
  }

  if (info.menuItemId === "voegScreenshotToeAanOpvolglijst") {
    const screenshot = await maakScreenshot(tab.windowId);
    nieuwItem = maakBasisItem(tab, {
      type: "screenshot",
      tekst: info.selectionText?.trim() || tab.title || tab.url,
      bron: tab.url,
      screenshot
    });
  }

  if (!nieuwItem) return;

  const { items = [] } = await chrome.storage.local.get("items");
  items.push(nieuwItem);
  await chrome.storage.local.set({ items });

  // Kleine visuele bevestiging via het extensie-icoon
  chrome.action.setBadgeText({ text: String(items.length) });
  chrome.action.setBadgeBackgroundColor({ color: "#2e7d32" });
});

function maakBasisItem(tab, extra) {
  const bron = extra.bron || tab.url || "";

  return {
    type: extra.type,
    tekst: extra.tekst,
    bron,
    paginaUrl: tab.url || "",
    paginaTitel: tab.title || "",
    platform: detecteerPlatform(bron || tab.url || ""),
    datum: new Date().toISOString(),
    verwerkt: false,
    screenshot: extra.screenshot || ""
  };
}

async function maakScreenshot(windowId) {
  try {
    return await chrome.tabs.captureVisibleTab(windowId, { format: "png" });
  } catch (err) {
    console.warn("Screenshot kon niet gemaakt worden", err);
    return "";
  }
}

function detecteerPlatform(url) {
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("linkedin.com")) return "LinkedIn";

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Onbekend";
  }
}
