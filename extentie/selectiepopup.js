(() => {
  let host = null;
  let shadow = null;
  let balkEl = null;
  let verbergTimer = null;

  function maakBalk() {
    if (host) return;

    host = document.createElement("div");
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";
    host.style.display = "none";
    document.documentElement.appendChild(host);

    shadow = host.attachShadow({ mode: "open" });

    const stijl = document.createElement("style");
    stijl.textContent = `
      .balk {
        display: flex;
        align-items: center;
        gap: 2px;
        background: #2b2b2b;
        border-radius: 6px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: system-ui, sans-serif;
      }
      button {
        display: flex;
        align-items: center;
        gap: 5px;
        background: transparent;
        border: none;
        color: #fff;
        font-size: 12px;
        padding: 5px 8px;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
      }
      button:hover {
        background: rgba(255,255,255,0.15);
      }
      svg {
        width: 13px;
        height: 13px;
        flex: none;
      }
    `;
    shadow.appendChild(stijl);

    balkEl = document.createElement("div");
    balkEl.className = "balk";
    balkEl.innerHTML = `
      <button type="button" id="kopieerKnop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span id="kopieerLabel">Kopieer</span>
      </button>
    `;
    shadow.appendChild(balkEl);

    balkEl.querySelector("#kopieerKnop").addEventListener("mousedown", (event) => {
      // voorkom dat de tekstselectie verdwijnt vóór de klik verwerkt is
      event.preventDefault();
    });
    balkEl.querySelector("#kopieerKnop").addEventListener("click", kopieerSelectie);
  }

  async function kopieerSelectie() {
    const tekst = laatsteSelectieTekst;
    if (!tekst) return;

    const labelEl = shadow.getElementById("kopieerLabel");
    try {
      await navigator.clipboard.writeText(tekst);
      labelEl.textContent = "Gekopieerd!";
    } catch {
      labelEl.textContent = "Mislukt";
    }
    setTimeout(() => verbergBalk(), 700);
  }

  let laatsteSelectieTekst = "";

  function toonBalk(rect) {
    maakBalk();
    laatsteSelectieTekst = window.getSelection().toString();
    shadow.getElementById("kopieerLabel").textContent = "Kopieer";

    host.style.display = "block";
    // eerst zichtbaar maken om afmetingen te kunnen meten
    const balkHoogte = balkEl.offsetHeight || 32;
    const balkBreedte = balkEl.offsetWidth || 90;

    let top = rect.top - balkHoogte - 8;
    if (top < 4) top = rect.bottom + 8;

    let left = rect.left + rect.width / 2 - balkBreedte / 2;
    left = Math.max(4, Math.min(left, window.innerWidth - balkBreedte - 4));

    host.style.top = `${top}px`;
    host.style.left = `${left}px`;
  }

  function verbergBalk() {
    if (host) host.style.display = "none";
  }

  function verwerkSelectie() {
    clearTimeout(verbergTimer);
    verbergTimer = setTimeout(() => {
      const selectie = window.getSelection();
      const tekst = selectie ? selectie.toString().trim() : "";

      if (!tekst || selectie.rangeCount === 0) {
        verbergBalk();
        return;
      }

      const rect = selectie.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        verbergBalk();
        return;
      }

      toonBalk(rect);
    }, 10);
  }

  document.addEventListener("mouseup", verwerkSelectie);
  document.addEventListener("keyup", (event) => {
    if (event.shiftKey || event.key === "Shift") verwerkSelectie();
  });
  document.addEventListener("mousedown", (event) => {
    if (host && !host.contains(event.target)) verbergBalk();
  });
  document.addEventListener("scroll", verbergBalk, true);
  window.addEventListener("resize", verbergBalk);
})();
