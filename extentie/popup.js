const lijstEl = document.getElementById("lijst");
const samenvattingEl = document.getElementById("samenvatting");
const apiKeyEl = document.getElementById("apiKey");
const isChromeExtension = Boolean(globalThis.chrome?.storage?.local);
const storage = maakStorage();

function maakStorage() {
  if (isChromeExtension) return chrome.storage.local;

  const previewItems = [
    {
      platform: "Facebook",
      datum: new Date().toISOString(),
      bron: "https://www.facebook.com/example/posts/123",
      tekst: "Veel ouders vragen of de planning voor volgende week al definitief is.",
      verwerkt: false
    },
    {
      platform: "LinkedIn",
      datum: new Date(Date.now() - 86400000).toISOString(),
      bron: "https://www.linkedin.com/feed/update/example",
      tekst: "Interessante update. Kunnen jullie ook delen welke aanpak het meeste resultaat gaf?",
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
    div.innerHTML = `<div class="meta">${item.platform} · ${datum}</div>${escapeHtml(item.tekst)}`;
    lijstEl.appendChild(div);
  });
}

function escapeHtml(tekst) {
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
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

  const rijen = [["platform", "datum", "bron", "tekst"]];
  items.forEach((i) => rijen.push([i.platform, i.datum, i.bron, i.tekst.replace(/\n/g, " ")]));
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
    .map((i) => `[${i.platform} · ${new Date(i.datum).toLocaleDateString("nl-BE")}] ${i.tekst}`)
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
              "Vat onderstaande verzameling reacties en meldingen van Facebook/LinkedIn samen in het Nederlands. " +
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
