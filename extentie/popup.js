const lijstEl = document.getElementById("lijst");
const samenvattingEl = document.getElementById("samenvatting");
const apiKeyEl = document.getElementById("apiKey");
const projectSelectEl = document.getElementById("projectSelect");
const nieuwProjectBtn = document.getElementById("nieuwProjectBtn");
const hernoemProjectBtn = document.getElementById("hernoemProjectBtn");
const projectNaamRijEl = document.getElementById("projectNaamRij");
const projectNaamEl = document.getElementById("projectNaam");
const bewaarProjectNaamBtn = document.getElementById("bewaarProjectNaamBtn");
const openGeschiedenisBtn = document.getElementById("openGeschiedenisBtn");
const voegPaginaBtn = document.getElementById("voegPaginaBtn");
const taalSelectEl = document.getElementById("taalSelect");
const isChromeExtension = Boolean(globalThis.chrome?.storage?.local);
const storage = maakStorage();

let state = null;
let huidigeTaal = "nl";

function maakStorage() {
  if (isChromeExtension) return chrome.storage.local;

  const previewItems = [
    {
      id: maakId(),
      type: "tekst",
      platform: "Facebook",
      datum: new Date().toISOString(),
      bron: "https://www.facebook.com/example/posts/123",
      paginaUrl: "https://www.facebook.com/example/posts/123",
      paginaTitel: "Voorbeeldbericht Facebook",
      tekst: "Veel ouders vragen of de planning voor volgende week al definitief is.",
      verwerkt: false
    },
    {
      id: maakId(),
      type: "link",
      platform: "LinkedIn",
      datum: new Date(Date.now() - 86400000).toISOString(),
      bron: "https://www.linkedin.com/feed/update/example",
      paginaUrl: "https://www.linkedin.com/feed/update/example",
      paginaTitel: "Voorbeeldupdate LinkedIn",
      tekst: "Interessante update. Kunnen jullie ook delen welke aanpak het meeste resultaat gaf?",
      verwerkt: false
    },
    {
      id: maakId(),
      type: "screenshot",
      platform: "voorbeeld.be",
      datum: new Date(Date.now() - 172800000).toISOString(),
      bron: "https://voorbeeld.be/nieuws/item",
      paginaUrl: "https://voorbeeld.be/nieuws/item",
      paginaTitel: "Voorbeeldpagina",
      tekst: "Screenshot van zichtbare pagina",
      screenshot:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#f4f7fb"/><rect x="40" y="40" width="560" height="70" rx="8" fill="#d7e3f4"/><rect x="40" y="140" width="420" height="24" rx="4" fill="#8aa6c8"/><rect x="40" y="180" width="500" height="18" rx="4" fill="#b7c7da"/><rect x="40" y="214" width="460" height="18" rx="4" fill="#b7c7da"/></svg>'
        ),
      verwerkt: false
    }
  ];

  const beginData = {
    projecten:
      JSON.parse(localStorage.getItem("preview-projecten") || "null") ||
      [{ id: maakId(), naam: "Algemeen", items: previewItems }],
    actiefProjectId: localStorage.getItem("preview-actief-project-id") || "",
    apiKey: localStorage.getItem("preview-api-key") || ""
  };

  if (!beginData.actiefProjectId || !beginData.projecten.some((p) => p.id === beginData.actiefProjectId)) {
    beginData.actiefProjectId = beginData.projecten[0].id;
  }

  return {
    async get(keys) {
      if (typeof keys === "string") return { [keys]: beginData[keys] };
      if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, beginData[key]]));
      return beginData;
    },
    async set(data) {
      Object.assign(beginData, data);
      if ("projecten" in data) localStorage.setItem("preview-projecten", JSON.stringify(data.projecten));
      if ("actiefProjectId" in data) localStorage.setItem("preview-actief-project-id", data.actiefProjectId);
      if ("apiKey" in data) localStorage.setItem("preview-api-key", data.apiKey);
      if ("taal" in data) localStorage.setItem("preview-taal", data.taal);
    }
  };
}

function normaliseerState(data) {
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
    items: Array.isArray(project.items) ? project.items.map(normaliseerItem) : []
  }));

  const actiefProjectId = projecten.some((project) => project.id === data.actiefProjectId)
    ? data.actiefProjectId
    : projecten[0].id;

  return {
    projecten,
    actiefProjectId,
    apiKey: data.apiKey || ""
  };
}

async function laadState() {
  const data = await storage.get(["projecten", "actiefProjectId", "items", "apiKey"]);
  state = normaliseerState(data);
  await bewaarState();
}

async function ververs() {
  const data = await storage.get(["projecten", "actiefProjectId", "items", "apiKey"]);
  state = normaliseerState(data);
  huidigeTaal = await haalOpgeslagenTaal();
  taalSelectEl.value = huidigeTaal;
  pasVertalingenToe(huidigeTaal);
  renderAlles();
}

function normaliseerItem(item) {
  return {
    ...item,
    id: item.id || maakId(),
    type: item.type || "tekst",
    verborgen: Boolean(item.verborgen)
  };
}

async function bewaarState() {
  await storage.set({
    projecten: state.projecten,
    actiefProjectId: state.actiefProjectId,
    apiKey: state.apiKey,
    items: []
  });
  await updateBadge();
}

function actiefProject() {
  return state.projecten.find((project) => project.id === state.actiefProjectId) || state.projecten[0];
}

function projectItems(project = actiefProject()) {
  return project.items;
}

function renderAlles() {
  renderProjecten();
  laadItems();
  if (document.activeElement !== apiKeyEl) apiKeyEl.value = state.apiKey;
}

function renderProjecten() {
  projectSelectEl.innerHTML = "";
  state.projecten.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = `${project.naam} (${project.items.length})`;
    projectSelectEl.appendChild(option);
  });
  projectSelectEl.value = state.actiefProjectId;
}

function laadItems() {
  const items = projectItems();
  lijstEl.innerHTML = "";

  if (items.length === 0) {
    lijstEl.innerHTML = `<div class="leeg">${escapeHtml(vertaal(huidigeTaal, "popup_leeg"))}</div>`;
    return;
  }

  items.slice().reverse().forEach((item) => {
    const div = document.createElement("div");
    div.className = `item${item.verborgen ? " verborgen" : ""}`;
    const datum = new Date(item.datum).toLocaleString(huidigeTaal);
    const bron = item.bron || item.paginaUrl || "";
    const type = item.type || "tekst";
    const extraMeta = [item.siteNaam, item.auteur, item.taal].filter(Boolean).map(escapeHtml).join(" · ");
    const titelRegel = item.paginaTitel ? `<div class="paginaTitel">${escapeHtml(item.paginaTitel)}</div>` : "";
    const gepubliceerd = item.gepubliceerdOp ? formatteerGepubliceerdOp(item.gepubliceerdOp) : "";
    const wisselLabel = vertaal(huidigeTaal, item.verborgen ? "popup_uitklappen" : "popup_inklappen");
    const verwijderLabel = vertaal(huidigeTaal, "algemeen_verwijderen");

    const inhoud = item.verborgen
      ? ""
      : `
        <div class="tekst">${escapeHtml(item.tekst || "")}</div>
        ${item.beschrijving ? `<div class="beschrijving">${escapeHtml(item.beschrijving)}</div>` : ""}
        ${bron ? `<div class="bron"><a href="${escapeAttr(bron)}" target="_blank" rel="noreferrer">${escapeHtml(vertaal(huidigeTaal, "popup_openBron"))}</a><br>${escapeHtml(korteUrl(bron))}</div>` : ""}
        ${item.screenshot ? `<img class="screenshot" src="${escapeAttr(item.screenshot)}" alt="${escapeAttr(vertaal(huidigeTaal, "popup_screenshotAlt"))}">` : ""}
      `;

    div.innerHTML = `
      <div class="itemKop">
        <button type="button" class="icoonKnop" data-actie="wissel" data-id="${escapeAttr(item.id)}" title="${escapeAttr(wisselLabel)}" aria-label="${escapeAttr(wisselLabel)}">${item.verborgen ? "+" : "−"}</button>
        <div class="meta">${escapeHtml(item.platform || vertaal(huidigeTaal, "algemeen_onbekend"))} · ${datum} · ${escapeHtml(type)}${extraMeta ? ` · ${extraMeta}` : ""}${gepubliceerd ? ` · ${escapeHtml(vertaal(huidigeTaal, "popup_gepubliceerd"))} ${escapeHtml(gepubliceerd)}` : ""}</div>
        <button type="button" class="icoonKnop vuilbak" data-actie="verwijder" data-id="${escapeAttr(item.id)}" title="${escapeAttr(verwijderLabel)}" aria-label="${escapeAttr(verwijderLabel)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
      ${titelRegel}
      ${inhoud}
    `;
    lijstEl.appendChild(div);
  });
}

function escapeHtml(tekst) {
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

function escapeAttr(tekst) {
  return escapeHtml(String(tekst)).replace(/"/g, "&quot;");
}

function formatteerGepubliceerdOp(waarde) {
  const datum = new Date(waarde);
  return Number.isNaN(datum.getTime()) ? waarde : datum.toLocaleDateString(huidigeTaal);
}

function korteUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname;
  } catch {
    return url;
  }
}

function maakId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function verzamelZichtbarePaginaTekst() {
  const blokkeerTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tekst = node.nodeValue.trim();
      if (!tekst) return NodeFilter.FILTER_REJECT;
      if (blokkeerTags.has(node.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;

      const element = node.parentElement;
      const stijl = window.getComputedStyle(element);
      if (stijl.visibility === "hidden" || stijl.display === "none") return NodeFilter.FILTER_REJECT;

      const rect = element.getBoundingClientRect();
      const zichtbaar =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= window.innerHeight &&
        rect.left <= window.innerWidth;

      return zichtbaar ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const delen = [];
  while (walker.nextNode()) {
    const tekst = walker.currentNode.nodeValue.replace(/\s+/g, " ").trim();
    if (tekst && delen[delen.length - 1] !== tekst) delen.push(tekst);
  }

  const metaNaam = (naam) => document.querySelector(`meta[name="${naam}"]`)?.content || "";
  const metaProp = (prop) => document.querySelector(`meta[property="${prop}"]`)?.content || "";

  return {
    titel: document.title,
    url: location.href,
    tekst: delen.join("\n").slice(0, 60000),
    beschrijving: metaProp("og:description") || metaNaam("description") || "",
    siteNaam: metaProp("og:site_name") || "",
    auteur: metaNaam("author") || metaProp("article:author") || "",
    gepubliceerdOp: metaProp("article:published_time") || metaNaam("date") || "",
    taal: document.documentElement.lang || ""
  };
}

async function updateBadge() {
  if (!isChromeExtension) return;
  const aantal = actiefProject().items.length;
  await chrome.action.setBadgeText({ text: aantal ? String(aantal) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2e7d32" });
}

apiKeyEl.addEventListener("change", async () => {
  state.apiKey = apiKeyEl.value.trim();
  await bewaarState();
});

projectSelectEl.addEventListener("change", async () => {
  state.actiefProjectId = projectSelectEl.value;
  projectNaamRijEl.hidden = true;
  await bewaarState();
  renderAlles();
});

nieuwProjectBtn.addEventListener("click", async () => {
  const naam = prompt(vertaal(huidigeTaal, "popup_nieuwProjectPrompt"), vertaal(huidigeTaal, "popup_nieuwProjectDefault"));
  if (!naam) return;

  const project = { id: maakId(), naam: naam.trim(), items: [] };
  state.projecten.push(project);
  state.actiefProjectId = project.id;
  await bewaarState();
  renderAlles();
});

hernoemProjectBtn.addEventListener("click", () => {
  const project = actiefProject();
  projectNaamEl.value = project.naam;
  projectNaamRijEl.hidden = false;
  projectNaamEl.focus();
});

bewaarProjectNaamBtn.addEventListener("click", async () => {
  const naam = projectNaamEl.value.trim();
  if (!naam) return;

  actiefProject().naam = naam;
  projectNaamRijEl.hidden = true;
  await bewaarState();
  renderAlles();
});

openGeschiedenisBtn.addEventListener("click", () => {
  if (!globalThis.chrome?.tabs) {
    alert(vertaal(huidigeTaal, "algemeen_alleenInExtensie"));
    return;
  }
  chrome.tabs.create({ url: chrome.runtime.getURL("geschiedenis.html") });
});

voegPaginaBtn.addEventListener("click", async () => {
  if (!globalThis.chrome?.scripting) {
    alert(vertaal(huidigeTaal, "algemeen_alleenInExtensie"));
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: verzamelZichtbarePaginaTekst
    });
    const pagina = result?.result;

    if (!pagina?.tekst) {
      alert(vertaal(huidigeTaal, "popup_geenTekstGevonden"));
      return;
    }

    actiefProject().items.push({
      id: maakId(),
      type: "pagina",
      tekst: pagina.tekst,
      bron: pagina.url || tab.url,
      paginaUrl: pagina.url || tab.url,
      paginaTitel: pagina.titel || tab.title || "",
      beschrijving: pagina.beschrijving || "",
      siteNaam: pagina.siteNaam || "",
      auteur: pagina.auteur || "",
      gepubliceerdOp: pagina.gepubliceerdOp || "",
      taal: pagina.taal || "",
      platform: detecteerPlatform(pagina.url || tab.url),
      datum: new Date().toISOString(),
      verwerkt: false,
      verborgen: false,
      screenshot: ""
    });

    await bewaarState();
    renderAlles();
  } catch (err) {
    alert(vertaal(huidigeTaal, "popup_tekstNietGelezen") + err.message);
  }
});

lijstEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-actie]");
  if (!button) return;

  const project = actiefProject();
  const item = project.items.find((record) => record.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.actie === "verwijder") {
    if (!confirm(vertaal(huidigeTaal, "popup_bevestigVerwijderen"))) return;
    project.items = project.items.filter((record) => record.id !== item.id);
  } else if (button.dataset.actie === "wissel") {
    item.verborgen = !item.verborgen;
  }

  await bewaarState();
  renderAlles();
});

document.getElementById("wisBtn").addEventListener("click", async () => {
  const project = actiefProject();
  if (!confirm(vertaal(huidigeTaal, "popup_bevestigMinimaliseren", { naam: project.naam }))) return;

  project.items.forEach((item) => {
    item.verborgen = true;
  });
  await bewaarState();
  renderAlles();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const project = actiefProject();
  const items = projectItems(project);
  if (items.length === 0) return;

  const rijen = [
    [
      vertaal(huidigeTaal, "csv_project"),
      vertaal(huidigeTaal, "csv_geminimaliseerd"),
      vertaal(huidigeTaal, "csv_type"),
      vertaal(huidigeTaal, "csv_platform"),
      vertaal(huidigeTaal, "csv_datum"),
      vertaal(huidigeTaal, "csv_bron"),
      vertaal(huidigeTaal, "csv_paginatitel"),
      vertaal(huidigeTaal, "csv_sitenaam"),
      vertaal(huidigeTaal, "csv_auteur"),
      vertaal(huidigeTaal, "csv_gepubliceerdOp"),
      vertaal(huidigeTaal, "csv_taal"),
      vertaal(huidigeTaal, "csv_beschrijving"),
      vertaal(huidigeTaal, "csv_tekst"),
      vertaal(huidigeTaal, "csv_screenshot")
    ]
  ];
  items.forEach((i) =>
    rijen.push([
      project.naam,
      i.verborgen ? vertaal(huidigeTaal, "algemeen_ja") : vertaal(huidigeTaal, "algemeen_nee"),
      i.type || "tekst",
      i.platform,
      i.datum,
      i.bron,
      i.paginaTitel || "",
      i.siteNaam || "",
      i.auteur || "",
      i.gepubliceerdOp || "",
      i.taal || "",
      (i.beschrijving || "").replace(/\n/g, " "),
      (i.tekst || "").replace(/\n/g, " "),
      i.screenshot ? vertaal(huidigeTaal, "algemeen_ja") : vertaal(huidigeTaal, "algemeen_nee")
    ])
  );
  const csv = rijen.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const bestandsnaam = `${project.naam.replace(/[\\/:*?"<>|]+/g, "-") || "opvolglijst"}.csv`;
  if (globalThis.chrome?.downloads) {
    chrome.downloads.download({ url, filename: bestandsnaam });
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = bestandsnaam;
  link.click();
  URL.revokeObjectURL(url);
});

function bouwProjectTekstBlok(project, items) {
  return items
    .map((i) => {
      const screenshotInfo = i.screenshot ? " [screenshot bewaard]" : "";
      const platform = i.platform || vertaal(huidigeTaal, "algemeen_onbekend");
      return `[${project.naam} · ${platform} · ${i.type || "tekst"} · ${new Date(i.datum).toLocaleDateString(huidigeTaal)}] ${i.tekst}${screenshotInfo}\nBron: ${i.bron || i.paginaUrl || ""}`;
    })
    .join("\n\n");
}

async function kopieerTekstMetFeedback(tekst, knop) {
  const oorspronkelijkeLabel = knop.textContent;
  try {
    await navigator.clipboard.writeText(tekst);
    knop.textContent = vertaal(huidigeTaal, "algemeen_gekopieerd");
  } catch {
    knop.textContent = vertaal(huidigeTaal, "algemeen_mislukt");
  }
  setTimeout(() => {
    knop.textContent = oorspronkelijkeLabel;
  }, 1500);
}

document.getElementById("kopieerProjectBtn").addEventListener("click", async (event) => {
  const project = actiefProject();
  const items = projectItems(project);

  if (items.length === 0) {
    alert(vertaal(huidigeTaal, "popup_geenRecordsKopieren"));
    return;
  }

  const tekstBlok = bouwProjectTekstBlok(project, items);
  await kopieerTekstMetFeedback(tekstBlok, event.currentTarget);
});

const kopieerSamenvattingBtn = document.getElementById("kopieerSamenvattingBtn");
const downloadSamenvattingBtn = document.getElementById("downloadSamenvattingBtn");
const samenvattingActiesEl = document.getElementById("samenvattingActies");

kopieerSamenvattingBtn.addEventListener("click", async (event) => {
  await kopieerTekstMetFeedback(samenvattingEl.textContent, event.currentTarget);
});

downloadSamenvattingBtn.addEventListener("click", () => {
  const project = actiefProject();
  const blob = new Blob([samenvattingEl.textContent], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const bestandsnaam = `samenvatting-${project.naam.replace(/[\\/:*?"<>|]+/g, "-") || "project"}.txt`;

  if (globalThis.chrome?.downloads) {
    chrome.downloads.download({ url, filename: bestandsnaam });
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = bestandsnaam;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("samenvattenBtn").addEventListener("click", async () => {
  const project = actiefProject();
  const items = projectItems(project);
  const apiKey = state.apiKey;

  if (items.length === 0) {
    alert(vertaal(huidigeTaal, "popup_geenRecordsSamenvatten"));
    return;
  }
  if (!apiKey) {
    alert(vertaal(huidigeTaal, "algemeen_vulApiKeyIn"));
    return;
  }

  samenvattingEl.style.display = "block";
  samenvattingEl.textContent = vertaal(huidigeTaal, "popup_bezigSamenvatten");
  samenvattingActiesEl.hidden = false;

  const tekstBlok = bouwProjectTekstBlok(project, items);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: vertaal(huidigeTaal, "popup_samenvattenPrompt") + "\n\n" + tekstBlok
          }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      samenvattingEl.textContent = vertaal(huidigeTaal, "algemeen_foutPrefix") + data.error.message;
      return;
    }
    const tekst = data.content.map((b) => b.text || "").join("\n");
    samenvattingEl.textContent = tekst;
  } catch (err) {
    samenvattingEl.textContent = vertaal(huidigeTaal, "algemeen_algemeneFoutPrefix") + err.message;
  }
});

taalSelectEl.addEventListener("change", async () => {
  huidigeTaal = taalSelectEl.value;
  await storage.set({ taal: huidigeTaal });
  pasVertalingenToe(huidigeTaal);
  renderAlles();
});

if (isChromeExtension) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !state) return;
    ververs();
  });
}

laadState()
  .then(async () => {
    huidigeTaal = await haalOpgeslagenTaal();
    taalSelectEl.value = huidigeTaal;
    pasVertalingenToe(huidigeTaal);
  })
  .then(renderAlles);
