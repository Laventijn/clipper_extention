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

let historyItems = [];
let geselecteerdeUrls = new Set();
let tags = {};

async function init() {
  const opgeslagen = await chrome.storage.local.get(["geschiedenisTags"]);
  tags = opgeslagen.geschiedenisTags || {};
  vulPeriodeVelden(periodeSelect.value);
}

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
    laadStatusEl.textContent = "Kies een geldig van- en tot-datum voor het aangepaste bereik.";
    return;
  }

  laadStatusEl.textContent = "Geschiedenis laden...";
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

    laadStatusEl.textContent = `${historyItems.length} resultaten geladen.`;
    renderLijst();
  } catch (err) {
    laadStatusEl.textContent = "Kon geschiedenis niet laden: " + err.message;
  }
});

function detecteerPlatform(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Onbekend";
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
    lijstEl.innerHTML = '<div class="leeg">Geen resultaten. Laad eerst een periode of pas de filter aan.</div>';
    bijwerkenAantalLabel();
    return;
  }

  items.forEach((item) => {
    const rij = document.createElement("div");
    rij.className = "rij";
    const tijdstip = item.lastVisitTime ? new Date(item.lastVisitTime).toLocaleString("nl-BE") : "";
    const platform = detecteerPlatform(item.url);
    const bestaandeTag = tags[item.url] || "";

    rij.innerHTML = `
      <input type="checkbox" class="selectieVak" data-url="${escapeAttr(item.url)}" ${geselecteerdeUrls.has(item.url) ? "checked" : ""} />
      <span></span>
      <div>
        <div class="platform">${escapeHtml(platform)}</div>
        <div class="titel">${escapeHtml(item.title || item.url)}</div>
        <div class="url">${escapeHtml(item.url)}</div>
        <input type="text" class="tagVeld" placeholder="Label / tag (bv. Furiant, school)" data-url="${escapeAttr(item.url)}" value="${escapeAttr(bestaandeTag)}" />
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
  aantalLabelEl.textContent = `${geselecteerdeUrls.size} geselecteerd van ${historyItems.length}`;
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
      tijdstip: item.lastVisitTime ? new Date(item.lastVisitTime).toLocaleString("nl-BE") : "",
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
  waarschuwing.textContent =
    `Let op: het antwoord van de AI werd afgekapt (te veel geselecteerde items: ${aantalItems}). ` +
    "Maak een kleinere selectie of verwerk de geschiedenis in meerdere delen voor een volledig resultaat.";
  container.prepend(waarschuwing);
}

groepeerAutoBtn.addEventListener("click", async () => {
  const items = geselecteerdeItems();
  if (items.length === 0) {
    alert("Selecteer eerst één of meer items.");
    return;
  }

  const apiKey = await haalApiKeyOp();
  if (!apiKey) {
    alert("Vul eerst je Anthropic API-key in via de popup.");
    return;
  }

  resultaatEl.innerHTML = '<div class="leeg">Bezig met groeperen...</div>';
  rapportBlokEl.hidden = true;

  const lijstTekst = items
    .map((i) => `- [${i.tijdstip}] ${i.titel} (${i.url})`)
    .join("\n");

  const prompt =
    "Onderstaande lijst zijn bezochte webpagina's (titel, URL, tijdstip). " +
    "Clusteer ze per herkenbaar onderwerp en geef een gestructureerd overzicht terug in het Nederlands. " +
    "Gebruik per onderwerp een duidelijke kopregel gevolgd door de bijhorende paginatitels en tijdstippen, elk op een eigen regel. " +
    "Gebruik het formaat 'ONDERWERP: <naam>' als kopregel en daaronder regels met '- <tijdstip> · <titel>'.\n\n" +
    lijstTekst;

  try {
    const { tekst, afgekapt } = await roepAnthropicApiAan(apiKey, prompt, 8192);
    toonRuweGroepering(tekst);
    if (afgekapt) toonAfkapWaarschuwing(resultaatEl, items.length);
  } catch (err) {
    resultaatEl.innerHTML = `<div class="leeg">Fout bij groeperen: ${escapeHtml(err.message)}</div>`;
  }
});

function maakGroepElement(titel, aantal, itemsHtml) {
  const groep = document.createElement("div");
  groep.className = "groep";
  groep.innerHTML = `
    <div class="groepTitel">
      <span>${escapeHtml(titel)}${aantal != null ? ` (${aantal})` : ""}</span>
      <span class="toggleIcon">verberg</span>
    </div>
    <div class="groepBody">${itemsHtml}</div>
  `;
  return groep;
}

function toonRuweGroepering(tekst) {
  resultaatEl.innerHTML = "";
  const blokken = tekst.split(/\n(?=ONDERWERP:)/i);
  let ietsGetoond = false;

  blokken.forEach((blok) => {
    const regels = blok.trim().split("\n").filter(Boolean);
    if (regels.length === 0) return;

    const kop = regels[0].replace(/^ONDERWERP:\s*/i, "").trim() || "Onderwerp";
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
  if (icoon) icoon.textContent = groep.classList.contains("dicht") ? "toon" : "verberg";
});

groepeerTagBtn.addEventListener("click", () => {
  const items = geselecteerdeItems();
  if (items.length === 0) {
    alert("Selecteer eerst één of meer items.");
    return;
  }

  rapportBlokEl.hidden = true;
  resultaatEl.innerHTML = "";

  const groepen = new Map();
  items.forEach((item) => {
    const naam = item.tag || "Zonder label";
    if (!groepen.has(naam)) groepen.set(naam, []);
    groepen.get(naam).push(item);
  });

  Array.from(groepen.entries())
    .sort((a, b) => (a[0] === "Zonder label" ? 1 : b[0] === "Zonder label" ? -1 : a[0].localeCompare(b[0])))
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
    alert("Selecteer eerst één of meer items.");
    return;
  }

  const apiKey = await haalApiKeyOp();
  if (!apiKey) {
    alert("Vul eerst je Anthropic API-key in via de popup.");
    return;
  }

  resultaatEl.innerHTML = "";
  rapportBlokEl.hidden = false;
  rapportTekstEl.textContent = "Rapport wordt gegenereerd...";

  const lijstTekst = items
    .map((i) => `- [${i.tijdstip}]${i.tag ? ` (label: ${i.tag})` : ""} ${i.titel} — ${i.url}`)
    .join("\n");

  const prompt =
    "Hieronder staat een selectie van bezochte webpagina's (titel, URL, tijdstip, eventueel een label). " +
    "Schrijf in het Nederlands een lopend rapport over wat er in deze periode werd opgezocht, gegroepeerd per thema. " +
    "Schrijf per thema een paar zinnen in lopende tekst, geen opsomming van elke URL apart.\n\n" +
    lijstTekst;

  try {
    const { tekst, afgekapt } = await roepAnthropicApiAan(apiKey, prompt, 4096);
    rapportTekstEl.textContent = afgekapt
      ? tekst + "\n\n[Let op: dit rapport werd afgekapt door te veel geselecteerde items. Maak een kleinere selectie voor een volledig rapport.]"
      : tekst;
  } catch (err) {
    rapportTekstEl.textContent = "Fout bij genereren van rapport: " + err.message;
  }
});

kopieerBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(rapportTekstEl.textContent);
  } catch {
    alert("Kopiëren is mislukt. Selecteer en kopieer de tekst handmatig.");
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
