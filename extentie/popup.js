const lijstEl = document.getElementById("lijst");
const samenvattingEl = document.getElementById("samenvatting");
const apiKeyEl = document.getElementById("apiKey");
const isChromeExtension = Boolean(globalThis.chrome?.storage?.local);
const storage = maakStorage();

function maakStorage() {
  if (isChromeExtension) return chrome.storage.local;

  const previewItems = [
    {
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
    items: JSON.parse(localStorage.getItem("preview-items") || "null") || previewItems,
    apiKey: localStorage.getItem("preview-api-key") || ""
  };

  return {
    async get(key) {
      if (typeof key === "string") return { [key]: beginData[key] };
      return beginData;
    },
    async set(data) {
      Object.assign(beginData, data);
      if ("items" in data) localStorage.setItem("preview-items", JSON.stringify(data.items));
      if ("apiKey" in data) localStorage.setItem("preview-api-key", data.apiKey);
    }
  };
}

async function laadItems() {
  const { items = [] } = await storage.get("items");
  lijstEl.innerHTML = "";

  if (items.length === 0) {
    lijstEl.innerHTML = '<div class="leeg">Nog geen items. Selecteer tekst op Facebook of LinkedIn en klik rechts.</div>';
    return;
  }

  items.slice().reverse().forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    const datum = new Date(item.datum).toLocaleString("nl-BE");
    const bron = item.bron || item.paginaUrl || "";
    const type = item.type || "tekst";

    div.innerHTML = `
      <div class="meta">${escapeHtml(item.platform || "Onbekend")} · ${datum} · ${escapeHtml(type)}</div>
      <div class="tekst">${escapeHtml(item.tekst || "")}</div>
      ${bron ? `<div class="bron"><a href="${escapeAttr(bron)}" target="_blank" rel="noreferrer">Open bron</a><br>${escapeHtml(korteUrl(bron))}</div>` : ""}
      ${item.screenshot ? `<img class="screenshot" src="${escapeAttr(item.screenshot)}" alt="Screenshot van bronpagina">` : ""}
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
  return escapeHtml(tekst).replace(/"/g, "&quot;");
}

function korteUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname;
  } catch {
    return url;
  }
}

async function laadApiKey() {
  const { apiKey = "" } = await storage.get("apiKey");
  apiKeyEl.value = apiKey;
}

apiKeyEl.addEventListener("change", async () => {
  await storage.set({ apiKey: apiKeyEl.value.trim() });
});

document.getElementById("wisBtn").addEventListener("click", async () => {
  if (!confirm("Volledige lijst wissen?")) return;
  await storage.set({ items: [] });
  if (isChromeExtension) chrome.action.setBadgeText({ text: "" });
  laadItems();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const { items = [] } = await storage.get("items");
  if (items.length === 0) return;

  const rijen = [["type", "platform", "datum", "bron", "paginatitel", "tekst", "heeft_screenshot"]];
  items.forEach((i) =>
    rijen.push([
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
  if (globalThis.chrome?.downloads) {
    chrome.downloads.download({ url, filename: "opvolglijst.csv" });
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = "opvolglijst.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("samenvattenBtn").addEventListener("click", async () => {
  const { items = [] } = await storage.get("items");
  const { apiKey = "" } = await storage.get("apiKey");

  if (items.length === 0) {
    alert("Er zijn nog geen items om samen te vatten.");
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
      return `[${i.platform} · ${i.type || "tekst"} · ${new Date(i.datum).toLocaleDateString("nl-BE")}] ${i.tekst}${screenshotInfo}\nBron: ${i.bron || i.paginaUrl || ""}`;
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

laadItems();
laadApiKey();
