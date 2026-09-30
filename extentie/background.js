importScripts("i18n.js");

// Klik op het extensie-icoontje opent meteen de zijbalk, geen popup
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Rechtsklik-menu-items aanmaken zodra de extensie start, in de opgeslagen taal
async function herbouwContextMenus() {
  const taal = await haalOpgeslagenTaal();

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "voegSelectieToeAanOpvolglijst",
      title: vertaal(taal, "menu_voegSelectie"),
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "voegLinkToeAanOpvolglijst",
      title: vertaal(taal, "menu_bewaarLink"),
      contexts: ["link"]
    });

    chrome.contextMenus.create({
      id: "voegScreenshotToeAanOpvolglijst",
      title: vertaal(taal, "menu_maakScreenshot"),
      contexts: ["page", "selection", "link"]
    });

    chrome.contextMenus.create({
      id: "voegExtraInfoToeAanLaatsteRecord",
      title: vertaal(taal, "menu_voegExtraInfo"),
      contexts: ["selection"]
    });
  });
}

chrome.runtime.onInstalled.addListener(herbouwContextMenus);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.taal) herbouwContextMenus();
});

// Klik op het menu-item verwerken
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url) return;

  if (info.menuItemId === "voegExtraInfoToeAanLaatsteRecord" && info.selectionText) {
    const bron = await bepaalPaginaBron(tab);
    await voegExtraInfoToeAanLaatsteRecord(tab, info.selectionText.trim(), bron);
    return;
  }

  const meta = await haalPaginaMeta(tab.id);
  const bron = await bepaalPaginaBron(tab);
  let nieuwItem = null;

  if (info.menuItemId === "voegSelectieToeAanOpvolglijst" && info.selectionText) {
    nieuwItem = maakBasisItem(tab, {
      type: "tekst",
      tekst: info.selectionText.trim(),
      bron,
      meta
    });
  }

  if (info.menuItemId === "voegLinkToeAanOpvolglijst" && info.linkUrl) {
    nieuwItem = maakBasisItem(tab, {
      type: "link",
      tekst: info.linkText || info.linkUrl,
      bron: info.linkUrl,
      meta
    });
  }

  if (info.menuItemId === "voegScreenshotToeAanOpvolglijst") {
    const screenshot = await maakScreenshot(tab);
    nieuwItem = maakBasisItem(tab, {
      type: "screenshot",
      tekst: info.selectionText?.trim() || tab.title || tab.url,
      bron,
      screenshot,
      meta
    });
  }

  if (!nieuwItem) return;

  const state = await laadProjectState();
  const project = state.projecten.find((p) => p.id === state.actiefProjectId) || state.projecten[0];
  project.items.push(nieuwItem);
  await chrome.storage.local.set({
    projecten: state.projecten,
    actiefProjectId: project.id,
    items: []
  });

  // Kleine visuele bevestiging via het extensie-icoon
  const zichtbaarAantal = project.items.filter((item) => !item.verborgen).length;
  chrome.action.setBadgeText({ text: String(zichtbaarAantal) });
  chrome.action.setBadgeBackgroundColor({ color: "#2e7d32" });
});

async function laadProjectState() {
  const data = await chrome.storage.local.get(["projecten", "actiefProjectId", "items"]);
  let projecten = Array.isArray(data.projecten) ? data.projecten : [];

  if (projecten.length === 0) {
    projecten = [
      {
        id: maakId(),
        naam: "Algemeen",
        items: Array.isArray(data.items) ? data.items : []
      }
    ];
  }

  projecten = projecten.map((project) => ({
    id: project.id || maakId(),
    naam: project.naam || "Naamloos project",
    items: Array.isArray(project.items) ? project.items : []
  }));

  const actiefProjectId = projecten.some((project) => project.id === data.actiefProjectId)
    ? data.actiefProjectId
    : projecten[0].id;

  return { projecten, actiefProjectId };
}

async function voegExtraInfoToeAanLaatsteRecord(tab, tekst, bron) {
  const state = await laadProjectState();
  const project = state.projecten.find((p) => p.id === state.actiefProjectId) || state.projecten[0];
  const laatsteItem = project.items[project.items.length - 1];

  if (!laatsteItem) return;

  if (!Array.isArray(laatsteItem.extraInfo)) laatsteItem.extraInfo = [];
  laatsteItem.extraInfo.push({
    id: maakId(),
    tekst,
    bron: bron || tab.url || "",
    paginaTitel: tab.title || "",
    datum: new Date().toISOString()
  });

  await chrome.storage.local.set({
    projecten: state.projecten,
    actiefProjectId: project.id,
    items: []
  });

  chrome.action.setBadgeText({ text: String(project.items.filter((item) => !item.verborgen).length) });
  chrome.action.setBadgeBackgroundColor({ color: "#2e7d32" });
}

function maakId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function maakBasisItem(tab, extra) {
  const bron = extra.bron || tab.url || "";
  const meta = extra.meta || {};

  return {
    type: extra.type,
    id: maakId(),
    tekst: extra.tekst,
    bron,
    paginaUrl: tab.url || "",
    paginaTitel: tab.title || "",
    beschrijving: meta.beschrijving || "",
    siteNaam: meta.siteNaam || "",
    auteur: meta.auteur || "",
    gepubliceerdOp: meta.gepubliceerdOp || "",
    taal: meta.taal || "",
    platform: detecteerPlatform(bron || tab.url || ""),
    datum: new Date().toISOString(),
    verwerkt: false,
    screenshot: extra.screenshot || ""
  };
}

async function bepaalPaginaBron(tab) {
  if (!tab.url || !tab.url.includes("facebook.com")) return tab.url || "";

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: vindFacebookPermalink
    });
    return result?.result || tab.url;
  } catch (err) {
    console.warn("Facebook-permalink kon niet bepaald worden", err);
    return tab.url;
  }
}

// Facebook toont in de tijdlijn zelden de echte post-URL in de adresbalk: de
// permalink zit verstopt achter de "tijd geleden"-link (bv. "4u") bovenaan de post.
// Deze functie zoekt die link op binnen de post die de gebruiker aan het bewerken is.
function vindFacebookPermalink() {
  function opschonenUrl(url) {
    try {
      const parsed = new URL(url);
      if (/permalink\.php|story\.php/i.test(parsed.pathname)) {
        const behoud = new URLSearchParams();
        ["story_fbid", "id", "v"].forEach((sleutel) => {
          if (parsed.searchParams.has(sleutel)) behoud.set(sleutel, parsed.searchParams.get(sleutel));
        });
        parsed.search = behoud.toString() ? `?${behoud.toString()}` : "";
      } else {
        parsed.search = "";
      }
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return url;
    }
  }

  function zoekPermalinkIn(container) {
    if (!container) return "";
    const permalinkPatroon = /\/(posts|videos|photo(\.php)?|reel|permalink\.php|story\.php|watch)(\/|\?)|story_fbid=|pfbid/i;
    const kandidaten = Array.from(container.querySelectorAll("a[href]"))
      .map((a) => a.href)
      .filter((href) => permalinkPatroon.test(href));

    if (kandidaten.length === 0) return "";

    const zonderCommentId = kandidaten.filter((href) => !href.includes("comment_id"));
    const lijst = zonderCommentId.length ? zonderCommentId : kandidaten;
    const beste = lijst.find((href) => /pfbid|\/posts\//i.test(href)) || lijst[0];

    return opschonenUrl(beste);
  }

  const dialoogArtikel = document.querySelector('[role="dialog"] [role="article"]');
  if (dialoogArtikel) {
    const link = zoekPermalinkIn(dialoogArtikel);
    if (link) return link;
  }

  const selectie = window.getSelection();
  if (selectie && !selectie.isCollapsed && selectie.rangeCount > 0) {
    let element = selectie.getRangeAt(0).commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;
    const artikel = element?.closest?.('[role="article"]');
    if (artikel) {
      const link = zoekPermalinkIn(artikel);
      if (link) return link;
    }
  }

  const artikelen = document.querySelectorAll('[role="article"]');
  if (artikelen.length === 1) {
    const link = zoekPermalinkIn(artikelen[0]);
    if (link) return link;
  }

  return "";
}

async function haalPaginaMeta(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: verzamelPaginaMeta
    });
    return result?.result || {};
  } catch (err) {
    console.warn("Paginametadata kon niet opgehaald worden", err);
    return {};
  }
}

function verzamelPaginaMeta() {
  const metaNaam = (naam) => document.querySelector(`meta[name="${naam}"]`)?.content || "";
  const metaProp = (prop) => document.querySelector(`meta[property="${prop}"]`)?.content || "";

  return {
    beschrijving: metaProp("og:description") || metaNaam("description") || "",
    siteNaam: metaProp("og:site_name") || "",
    auteur: metaNaam("author") || metaProp("article:author") || "",
    gepubliceerdOp: metaProp("article:published_time") || metaNaam("date") || "",
    taal: document.documentElement.lang || ""
  };
}

async function maakScreenshot(tab) {
  try {
    const captureInfo = await bepaalScreenshotGebied(tab.id);
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    return await cropScreenshot(screenshot, captureInfo);
  } catch (err) {
    console.warn("Screenshot kon niet gemaakt worden", err);
    return "";
  }
}

async function bepaalScreenshotGebied(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: vindBesteScreenshotGebied
    });

    return result?.result || null;
  } catch (err) {
    console.warn("Screenshotgebied kon niet bepaald worden", err);
    return null;
  }
}

function vindBesteScreenshotGebied() {
  const marge = 12;
  const viewport = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    soort: "volledig_venster"
  };

  const dialogs = Array.from(
    document.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog[open]')
  )
    .map((element) => maakRect(element.getBoundingClientRect(), marge, "dialoog"))
    .filter((rect) => rect.width >= 120 && rect.height >= 80)
    .sort((a, b) => b.width * b.height - a.width * a.height);

  if (dialogs.length > 0) return begrensRect(dialogs[0], viewport);

  const selectie = window.getSelection();
  if (selectie && !selectie.isCollapsed && selectie.rangeCount > 0) {
    const rect = selectie.getRangeAt(0).getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return begrensRect(maakRect(rect, marge, "selectie"), viewport);
    }
  }

  return viewport;
}

function maakRect(rect, marge, soort) {
  return {
    x: rect.left - marge,
    y: rect.top - marge,
    width: rect.width + marge * 2,
    height: rect.height + marge * 2,
    soort
  };
}

function begrensRect(rect, viewport) {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const rechts = Math.min(viewport.width, rect.x + rect.width);
  const onder = Math.min(viewport.height, rect.y + rect.height);

  return {
    x,
    y,
    width: Math.max(1, rechts - x),
    height: Math.max(1, onder - y),
    devicePixelRatio: viewport.devicePixelRatio,
    soort: rect.soort
  };
}

async function cropScreenshot(dataUrl, gebied) {
  if (!gebied || gebied.soort === "volledig_venster") return dataUrl;

  const image = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const schaal = gebied.devicePixelRatio || 1;
  const sx = Math.round(gebied.x * schaal);
  const sy = Math.round(gebied.y * schaal);
  const sw = Math.round(gebied.width * schaal);
  const sh = Math.round(gebied.height * schaal);
  const canvas = new OffscreenCanvas(sw, sh);
  const context = canvas.getContext("2d");

  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return await blobNaarDataUrl(blob);
}

function blobNaarDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function detecteerPlatform(url) {
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("linkedin.com")) return "LinkedIn";

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
