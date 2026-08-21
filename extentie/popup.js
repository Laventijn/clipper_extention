const lijstEl = document.getElementById("lijst");
const samenvattingEl = document.getElementById("samenvatting");
const apiKeyEl = document.getElementById("apiKey");
const projectSelectEl = document.getElementById("projectSelect");
const nieuwProjectBtn = document.getElementById("nieuwProjectBtn");
const hernoemProjectBtn = document.getElementById("hernoemProjectBtn");
const projectNaamRijEl = document.getElementById("projectNaamRij");
const projectNaamEl = document.getElementById("projectNaam");
const bewaarProjectNaamBtn = document.getElementById("bewaarProjectNaamBtn");
const toonVerborgenEl = document.getElementById("toonVerborgen");
const openZijbalkBtn = document.getElementById("openZijbalkBtn");
const openGeschiedenisBtn = document.getElementById("openGeschiedenisBtn");
const voegPaginaBtn = document.getElementById("voegPaginaBtn");
const isChromeExtension = Boolean(globalThis.chrome?.storage?.local);
const storage = maakStorage();

let state = null;

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
    apiKey: localStorage.getItem("preview-api-key") || "",
    toonVerborgen: localStorage.getItem("preview-toon-verborgen") === "true"
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
      if ("toonVerborgen" in data) localStorage.setItem("preview-toon-verborgen", String(data.toonVerborgen));
    }
  };
}

async function laadState() {
  const data = await storage.get(["projecten", "actiefProjectId", "items", "apiKey", "toonVerborgen"]);
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

  state = {
    projecten,
    actiefProjectId,
    apiKey: data.apiKey || "",
    toonVerborgen: Boolean(data.toonVerborgen)
  };

  await bewaarState();
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
    toonVerborgen: state.toonVerborgen,
    items: []
  });
  await updateBadge();
}

function actiefProject() {
  return state.projecten.find((project) => project.id === state.actiefProjectId) || state.projecten[0];
}

function zichtbareItems(project = actiefProject()) {
  return project.items.filter((item) => state.toonVerborgen || !item.verborgen);
}

function renderAlles() {
  renderProjecten();
  laadItems();
  apiKeyEl.value = state.apiKey;
  toonVerborgenEl.checked = state.toonVerborgen;
}

function renderProjecten() {
  projectSelectEl.innerHTML = "";
  state.projecten.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = `${project.naam} (${project.items.filter((item) => !item.verborgen).length})`;
    projectSelectEl.appendChild(option);
  });
  projectSelectEl.value = state.actiefProjectId;
}

function laadItems() {
  const items = zichtbareItems();
  lijstEl.innerHTML = "";

  if (items.length === 0) {
    lijstEl.innerHTML = '<div class="leeg">Geen zichtbare records in dit project.</div>';
    return;
  }

  items.slice().reverse().forEach((item) => {
    const div = document.createElement("div");
    div.className = `item${item.verborgen ? " verborgen" : ""}`;
    const datum = new Date(item.datum).toLocaleString("nl-BE");
    const bron = item.bron || item.paginaUrl || "";
    const type = item.type || "tekst";

    div.innerHTML = `
      <div class="meta">${escapeHtml(item.platform || "Onbekend")} · ${datum} · ${escapeHtml(type)}</div>
      <div class="tekst">${escapeHtml(item.tekst || "")}</div>
      ${bron ? `<div class="bron"><a href="${escapeAttr(bron)}" target="_blank" rel="noreferrer">Open bron</a><br>${escapeHtml(korteUrl(bron))}</div>` : ""}
      ${item.screenshot ? `<img class="screenshot" src="${escapeAttr(item.screenshot)}" alt="Screenshot van bronpagina">` : ""}
      <div class="itemActies">
        <button data-actie="${item.verborgen ? "toon" : "verberg"}" data-id="${escapeAttr(item.id)}">${item.verborgen ? "Toon" : "Verberg"}</button>
        <button data-actie="verwijder" data-id="${escapeAttr(item.id)}">Verwijder</button>
      </div>
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
    return "Onbekend";
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

  return {
    titel: document.title,
    url: location.href,
    tekst: delen.join("\n").slice(0, 60000)
  };
}

async function updateBadge() {
  if (!isChromeExtension) return;
  const aantal = actiefProject().items.filter((item) => !item.verborgen).length;
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
  const naam = prompt("Naam van het nieuwe project?", "Nieuw project");
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

openZijbalkBtn.addEventListener("click", async () => {
  if (!globalThis.chrome?.sidePanel) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

openGeschiedenisBtn.addEventListener("click", () => {
  if (!globalThis.chrome?.tabs) {
    alert("Deze functie werkt alleen in de geladen Chrome-extensie.");
    return;
  }
  chrome.tabs.create({ url: chrome.runtime.getURL("geschiedenis.html") });
});

voegPaginaBtn.addEventListener("click", async () => {
  if (!globalThis.chrome?.scripting) {
    alert("Deze functie werkt alleen in de geladen Chrome-extensie.");
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
      alert("Geen zichtbare tekst gevonden op deze pagina.");
      return;
    }

    actiefProject().items.push({
      id: maakId(),
      type: "pagina",
      tekst: pagina.tekst,
      bron: pagina.url || tab.url,
      paginaUrl: pagina.url || tab.url,
      paginaTitel: pagina.titel || tab.title || "",
      platform: detecteerPlatform(pagina.url || tab.url),
      datum: new Date().toISOString(),
      verwerkt: false,
      verborgen: false,
      screenshot: ""
    });

    await bewaarState();
    renderAlles();
  } catch (err) {
    alert("De zichtbare tekst kon niet gelezen worden: " + err.message);
  }
});

toonVerborgenEl.addEventListener("change", async () => {
  state.toonVerborgen = toonVerborgenEl.checked;
  await bewaarState();
  renderAlles();
});

lijstEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-actie]");
  if (!button) return;

  const project = actiefProject();
  const item = project.items.find((record) => record.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.actie === "verwijder") {
    if (!confirm("Dit record definitief verwijderen?")) return;
    project.items = project.items.filter((record) => record.id !== item.id);
  } else {
    item.verborgen = button.dataset.actie === "verberg";
  }

  await bewaarState();
  renderAlles();
});

document.getElementById("wisBtn").addEventListener("click", async () => {
  const project = actiefProject();
  if (!confirm(`Alle zichtbare records in "${project.naam}" verbergen? Het project blijft bewaard.`)) return;

  project.items.forEach((item) => {
    if (!item.verborgen) item.verborgen = true;
  });
  await bewaarState();
  renderAlles();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const project = actiefProject();
  const items = zichtbareItems(project);
  if (items.length === 0) return;

  const rijen = [["project", "verborgen", "type", "platform", "datum", "bron", "paginatitel", "tekst", "heeft_screenshot"]];
  items.forEach((i) =>
    rijen.push([
      project.naam,
      i.verborgen ? "ja" : "nee",
      i.type || "tekst",
      i.platform,
      i.datum,
      i.bron,
      i.paginaTitel || "",
      (i.tekst || "").replace(/\n/g, " "),
      i.screenshot ? "ja" : "nee"
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

document.getElementById("samenvattenBtn").addEventListener("click", async () => {
  const project = actiefProject();
  const items = zichtbareItems(project);
  const apiKey = state.apiKey;

  if (items.length === 0) {
    alert("Er zijn geen zichtbare records om samen te vatten.");
    return;
  }
  if (!apiKey) {
    alert("Vul eerst je Anthropic API-key in.");
    return;
  }

  samenvattingEl.style.display = "block";
  samenvattingEl.textContent = "Bezig met samenvatten...";

  const tekstBlok = items
    .map((i) => {
      const screenshotInfo = i.screenshot ? " [screenshot bewaard]" : "";
      return `[${project.naam} · ${i.platform} · ${i.type || "tekst"} · ${new Date(i.datum).toLocaleDateString("nl-BE")}] ${i.tekst}${screenshotInfo}\nBron: ${i.bron || i.paginaUrl || ""}`;
    })
    .join("\n\n");

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
            content:
              "Vat onderstaande verzameling tekst, links en screenshots samen in het Nederlands. " +
              "Groepeer per thema, benoem de toon (positief/kritisch/vraag), en stel waar relevant een kort antwoord voor.\n\n" +
              tekstBlok
          }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      samenvattingEl.textContent = "Fout: " + data.error.message;
      return;
    }
    const tekst = data.content.map((b) => b.text || "").join("\n");
    samenvattingEl.textContent = tekst;
  } catch (err) {
    samenvattingEl.textContent = "Er ging iets mis: " + err.message;
  }
});

laadState().then(renderAlles);
