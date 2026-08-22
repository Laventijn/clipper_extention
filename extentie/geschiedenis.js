const periodeSelect = document.getElementById("periodeSelect");
const vanafDatumEl = document.getElementById("vanafDatum");
const totDatumEl = document.getElementById("totDatum");
const laadBtn = document.getElementById("laadBtn");
const laadStatusEl = document.getElementById("laadStatus");
const zoekVeldEl = document.getElementById("zoekVeld");
const selecteerAllesBtn = document.getElementById("selecteerAlles");
const wisSelectieBtn = document.getElementById("wisSelectie");
const aantalLabelEl = document.getElementById("aantalLabel");
const lijstEl = document.getElementById("lijst");
const groepeerAutoBtn = document.getElementById("groepeerAutoBtn");
const groepeerTagBtn = document.getElementById("groepeerTagBtn");
const rapportBtn = document.getElementById("rapportBtn");
const resultaatEl = document.getElementById("resultaat");
const rapportBlokEl = document.getElementById("rapportBlok");
const rapportTekstEl = document.getElementById("rapportTekst");
const kopieerBtn = document.getElementById("kopieerBtn");
const downloadBtn = document.getElementById("downloadBtn");
const taalSelectEl = document.getElementById("taalSelect");

let historyItems = [];
let geselecteerdeUrls = new Set();
let tags = {};
let huidigeTaal = "nl";

async function init() {
  const opgeslagen = await chrome.storage.local.get(["geschiedenisTags", "taal"]);
  tags = opgeslagen.geschiedenisTags || {};
  huidigeTaal = opgeslagen.taal || "nl";
  taalSelectEl.value = huidigeTaal;
  pasVertalingenToe(huidigeTaal);
  vulPeriodeVelden(periodeSelect.value);
  renderLijst();
}

taalSelectEl.addEventListener("change", async () => {
  huidigeTaal = taalSelectEl.value;
  await chrome.storage.local.set({ taal: huidigeTaal });
  pasVertalingenToe(huidigeTaal);
  renderLijst();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.taal) return;
  huidigeTaal = changes.taal.newValue || "nl";
  taalSelectEl.value = huidigeTaal;
  pasVertalingenToe(huidigeTaal);
  renderLijst();
});

function naarDatetimeLocalString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function vulPeriodeVelden(waarde) {
  const nu = new Date();

  if (waarde === "vandaag") {
    const start = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
    vanafDatumEl.value = naarDatetimeLocalString(start);
    totDatumEl.value = naarDatetimeLocalString(nu);
    return;
  }

  if (waarde === "gisteren") {
    const startGisteren = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - 1);
    const eindeGisteren = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
    vanafDatumEl.value = naarDatetimeLocalString(startGisteren);
    totDatumEl.value = naarDatetimeLocalString(eindeGisteren);
    return;
  }

  // Aangepast bereik: laat de huidige waarden staan, of vul een standaard in als ze nog leeg zijn.
  if (!vanafDatumEl.value) vanafDatumEl.value = naarDatetimeLocalString(new Date(nu.getFullYear(), nu.getMonth(), nu.getDate()));
  if (!totDatumEl.value) totDatumEl.value = naarDatetimeLocalString(nu);
}

periodeSelect.addEventListener("change", () => {
  vulPeriodeVelden(periodeSelect.value);
});

function bepaalPeriode() {
  const vanaf = vanafDatumEl.value ? new Date(vanafDatumEl.value) : null;
  const tot = totDatumEl.value ? new Date(totDatumEl.value) : null;

  if (!vanaf || !tot) {
    return null;
  }

  return { startTime: vanaf.getTime(), endTime: tot.getTime() };
}

laadBtn.addEventListener("click", async () => {
  const periode = bepaalPeriode();
  if (!periode) {
    laadStatusEl.textContent = vertaal(huidigeTaal, "geschiedenis_ongeldigeDatum");
    return;
  }

  laadStatusEl.textContent = vertaal(huidigeTaal, "geschiedenis_ladenBezig");
  geselecteerdeUrls.clear();
  resultaatEl.innerHTML = "";
  rapportBlokEl.hidden = true;

  try {
    const resultaten = await chrome.history.search({
      text: "",
      startTime: periode.startTime,
      endTime: periode.endTime,
      maxResults: 1000
    });

    historyItems = resultaten
      .filter((item) => item.url)
      .sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));

    laadStatusEl.textContent = vertaal(huidigeTaal, "geschiedenis_resultatenGeladen", { aantal: historyItems.length });
    renderLijst();
  } catch (err) {
    laadStatusEl.textContent = vertaal(huidigeTaal, "geschiedenis_ladenMislukt") + err.message;
  }
});

function detecteerPlatform(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return vertaal(huidigeTaal, "algemeen_onbekend");
  }
}

function huidigeFilter() {
  return zoekVeldEl.value.trim().toLowerCase();
}

function gefilterdeItems() {
  const filter = huidigeFilter();
  if (!filter) return historyItems;
  return historyItems.filter(
    (item) =>
      (item.title || "").toLowerCase().includes(filter) ||
      (item.url || "").toLowerCase().includes(filter)
  );
}

function renderLijst() {
  const items = gefilterdeItems();
  lijstEl.innerHTML = "";

  if (items.length === 0) {
    lijstEl.innerHTML = `<div class="leeg">${escapeHtml(vertaal(huidigeTaal, "geschiedenis_geenResultaten"))}</div>`;
    bijwerkenAantalLabel();
    return;
  }

  const tagPlaceholder = vertaal(huidigeTaal, "geschiedenis_tagPlaceholder");

  items.forEach((item) => {
    const rij = document.createElement("div");
    rij.className = "rij";
    const tijdstip = item.lastVisitTime ? new Date(item.lastVisitTime).toLocaleString(huidigeTaal) : "";
    const platform = detecteerPlatform(item.url);
    const bestaandeTag = tags[item.url] || "";

    rij.innerHTML = `
      <input type="checkbox" class="selectieVak" data-url="${escapeAttr(item.url)}" ${geselecteerdeUrls.has(item.url) ? "checked" : ""} />
      <span></span>
      <div>
        <div class="platform">${escapeHtml(platform)}</div>
        <div class="titel">${escapeHtml(item.title || item.url)}</div>
        <div class="url">${escapeHtml(item.url)}</div>
        <input type="text" class="tagVeld" placeholder="${escapeAttr(tagPlaceholder)}" data-url="${escapeAttr(item.url)}" value="${escapeAttr(bestaandeTag)}" />
      </div>
      <div class="tijdstip">${escapeHtml(tijdstip)}</div>
    `;
    lijstEl.appendChild(rij);
  });

  bijwerkenAantalLabel();
}

lijstEl.addEventListener("change", async (event) => {
  const checkbox = event.target.closest(".selectieVak");
  if (checkbox) {
    const url = checkbox.dataset.url;
    if (checkbox.checked) geselecteerdeUrls.add(url);
    else geselecteerdeUrls.delete(url);
    bijwerkenAantalLabel();
    return;
  }

  const tagVeld = event.target.closest(".tagVeld");
  if (tagVeld) {
    const url = tagVeld.dataset.url;
    const waarde = tagVeld.value.trim();
    if (waarde) tags[url] = waarde;
    else delete tags[url];
    await chrome.storage.local.set({ geschiedenisTags: tags });
  }
});

function bijwerkenAantalLabel() {
  aantalLabelEl.textContent = vertaal(huidigeTaal, "geschiedenis_aantalGeselecteerd", {
    geselecteerd: geselecteerdeUrls.size,
    totaal: historyItems.length
  });
}

zoekVeldEl.addEventListener("input", renderLijst);

selecteerAllesBtn.addEventListener("click", () => {
  gefilterdeItems().forEach((item) => geselecteerdeUrls.add(item.url));
  renderLijst();
});

wisSelectieBtn.addEventListener("click", () => {
  geselecteerdeUrls.clear();
  renderLijst();
});

function geselecteerdeItems() {
  const urlSet = geselecteerdeUrls;
  return historyItems
    .filter((item) => urlSet.has(item.url))
    .map((item) => ({
      titel: item.title || item.url,
      url: item.url,
      tijdstip: item.lastVisitTime ? new Date(item.lastVisitTime).toLocaleString(huidigeTaal) : "",
      tag: tags[item.url] || ""
    }));
}

async function haalApiKeyOp() {
  const data = await chrome.storage.local.get(["apiKey"]);
  return data.apiKey || "";
}

async function roepAnthropicApiAan(apiKey, prompt, maxTokens = 4096) {
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
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return {
    tekst: data.content.map((b) => b.text || "").join("\n"),
    afgekapt: data.stop_reason === "max_tokens"
  };
}

function toonAfkapWaarschuwing(container, aantalItems) {
  const waarschuwing = document.createElement("div");
  waarschuwing.className = "waarschuwing";
  waarschuwing.textContent = vertaal(huidigeTaal, "geschiedenis_afgekaptWaarschuwing", { aantal: aantalItems });
  container.prepend(waarschuwing);
}

groepeerAutoBtn.addEventListener("click", async () => {
  const items = geselecteerdeItems();
  if (items.length === 0) {
    alert(vertaal(huidigeTaal, "geschiedenis_selecteerEerst"));
    return;
  }

  const apiKey = await haalApiKeyOp();
  if (!apiKey) {
    alert(vertaal(huidigeTaal, "geschiedenis_vulApiKeyViaPopup"));
    return;
  }

  resultaatEl.innerHTML = `<div class="leeg">${escapeHtml(vertaal(huidigeTaal, "geschiedenis_bezigGroeperen"))}</div>`;
  rapportBlokEl.hidden = true;

  const lijstTekst = items
    .map((i) => `- [${i.tijdstip}] ${i.titel} (${i.url})`)
    .join("\n");

  const prompt = vertaal(huidigeTaal, "geschiedenis_groepeerAutoPrompt") + "\n\n" + lijstTekst;

  try {
    const { tekst, afgekapt } = await roepAnthropicApiAan(apiKey, prompt, 8192);
    toonRuweGroepering(tekst);
    if (afgekapt) toonAfkapWaarschuwing(resultaatEl, items.length);
  } catch (err) {
    resultaatEl.innerHTML = `<div class="leeg">${escapeHtml(vertaal(huidigeTaal, "geschiedenis_foutGroeperen"))}${escapeHtml(err.message)}</div>`;
  }
});

function maakGroepElement(titel, aantal, itemsHtml) {
  const groep = document.createElement("div");
  groep.className = "groep";
  groep.innerHTML = `
    <div class="groepTitel">
      <span>${escapeHtml(titel)}${aantal != null ? ` (${aantal})` : ""}</span>
      <span class="toggleIcon">${escapeHtml(vertaal(huidigeTaal, "algemeen_verbergen"))}</span>
    </div>
    <div class="groepBody">${itemsHtml}</div>
  `;
  return groep;
}

function toonRuweGroepering(tekst) {
  resultaatEl.innerHTML = "";
  const blokken = tekst.split(/\n(?=@@ONDERWERP@@)/);
  let ietsGetoond = false;

  blokken.forEach((blok) => {
    const regels = blok.trim().split("\n").filter(Boolean);
    if (regels.length === 0) return;

    const kop = regels[0].replace(/^@@ONDERWERP@@\s*/, "").trim() || vertaal(huidigeTaal, "geschiedenis_onderwerpFallback");
    const items = regels.slice(1).map((regel) => `<div class="groepItem">${escapeHtml(regel.replace(/^-+\s*/, ""))}</div>`).join("");
    resultaatEl.appendChild(maakGroepElement(kop, null, items));
    ietsGetoond = true;
  });

  if (!ietsGetoond) {
    resultaatEl.innerHTML = `<pre>${escapeHtml(tekst)}</pre>`;
  }
}

resultaatEl.addEventListener("click", (event) => {
  const titelRij = event.target.closest(".groepTitel");
  if (!titelRij) return;

  const groep = titelRij.closest(".groep");
  groep.classList.toggle("dicht");
  const icoon = titelRij.querySelector(".toggleIcon");
  if (icoon) icoon.textContent = vertaal(huidigeTaal, groep.classList.contains("dicht") ? "algemeen_tonen" : "algemeen_verbergen");
});

groepeerTagBtn.addEventListener("click", () => {
  const items = geselecteerdeItems();
  if (items.length === 0) {
    alert(vertaal(huidigeTaal, "geschiedenis_selecteerEerst"));
    return;
  }

  rapportBlokEl.hidden = true;
  resultaatEl.innerHTML = "";

  const zonderLabel = vertaal(huidigeTaal, "geschiedenis_zonderLabel");
  const groepen = new Map();
  items.forEach((item) => {
    const naam = item.tag || zonderLabel;
    if (!groepen.has(naam)) groepen.set(naam, []);
    groepen.get(naam).push(item);
  });

  Array.from(groepen.entries())
    .sort((a, b) => (a[0] === zonderLabel ? 1 : b[0] === zonderLabel ? -1 : a[0].localeCompare(b[0])))
    .forEach(([naam, groepItems]) => {
      const itemsHtml = groepItems
        .map((i) => `<div class="groepItem"><span class="tijd">${escapeHtml(i.tijdstip)}</span>${escapeHtml(i.titel)}</div>`)
        .join("");
      resultaatEl.appendChild(maakGroepElement(naam, groepItems.length, itemsHtml));
    });
});

rapportBtn.addEventListener("click", async () => {
  const items = geselecteerdeItems();
  if (items.length === 0) {
    alert(vertaal(huidigeTaal, "geschiedenis_selecteerEerst"));
    return;
  }

  const apiKey = await haalApiKeyOp();
  if (!apiKey) {
    alert(vertaal(huidigeTaal, "geschiedenis_vulApiKeyViaPopup"));
    return;
  }

  resultaatEl.innerHTML = "";
  rapportBlokEl.hidden = false;
  rapportTekstEl.textContent = vertaal(huidigeTaal, "geschiedenis_rapportBezig");

  const lijstTekst = items
    .map((i) => `- [${i.tijdstip}]${i.tag ? ` (label: ${i.tag})` : ""} ${i.titel} — ${i.url}`)
    .join("\n");

  const prompt = vertaal(huidigeTaal, "geschiedenis_rapportPrompt") + "\n\n" + lijstTekst;

  try {
    const { tekst, afgekapt } = await roepAnthropicApiAan(apiKey, prompt, 4096);
    rapportTekstEl.textContent = afgekapt
      ? tekst + vertaal(huidigeTaal, "geschiedenis_rapportAfgekaptSuffix")
      : tekst;
  } catch (err) {
    rapportTekstEl.textContent = vertaal(huidigeTaal, "geschiedenis_foutRapport") + err.message;
  }
});

kopieerBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(rapportTekstEl.textContent);
  } catch {
    alert(vertaal(huidigeTaal, "algemeen_kopierenMislukt"));
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([rapportTekstEl.textContent], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const bestandsnaam = `geschiedenisrapport-${new Date().toISOString().slice(0, 10)}.txt`;

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

function escapeHtml(tekst) {
  const div = document.createElement("div");
  div.textContent = tekst == null ? "" : String(tekst);
  return div.innerHTML;
}

function escapeAttr(tekst) {
  return escapeHtml(tekst).replace(/"/g, "&quot;");
}

init();
