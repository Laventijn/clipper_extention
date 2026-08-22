(() => {
  const MAX_POGINGEN = 20;
  const POLL_INTERVAL_MS = 750;

  let huidigeVideoId = null;
  let verwerkt = false;
  let pollTimer = null;
  let pogingen = 0;

  function haalVideoId() {
    const params = new URLSearchParams(location.search);
    return params.get("v");
  }

  function isZichtbaar(el) {
    return !!el && el.offsetParent !== null;
  }

  function vindKnopMetLabel(regex, uitsluitRegex) {
    const kandidaten = document.querySelectorAll("button, tp-yt-paper-button, yt-button-shape button");
    for (const knop of kandidaten) {
      const label = (knop.getAttribute("aria-label") || knop.textContent || "").trim();
      if (!label) continue;
      if (uitsluitRegex && uitsluitRegex.test(label)) continue;
      if (regex.test(label)) return knop;
    }
    return null;
  }

  function transcriptPaneelActief() {
    const paneel = document.querySelector(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
    );
    return isZichtbaar(paneel);
  }

  function vindMeerKnop() {
    return (
      document.querySelector("ytd-text-inline-expander tp-yt-paper-button#expand") ||
      vindKnopMetLabel(/^\.{0,3}\s*(meer|plus)\b|show more/i)
    );
  }

  function probeerTranscriptTeOpenen() {
    if (verwerkt) {
      stopPollen();
      return;
    }
    pogingen++;

    if (transcriptPaneelActief()) {
      verwerkt = true;
      stopPollen();
      return;
    }

    const transcriptKnop = vindKnopMetLabel(/transcript/i, /verberg|hide|masquer/i);
    if (transcriptKnop) {
      transcriptKnop.click();
      verwerkt = true;
      stopPollen();
      return;
    }

    const meerKnop = vindMeerKnop();
    if (meerKnop) meerKnop.click();

    if (pogingen >= MAX_POGINGEN) stopPollen();
  }

  function startPollen() {
    stopPollen();
    pogingen = 0;
    pollTimer = setInterval(probeerTranscriptTeOpenen, POLL_INTERVAL_MS);
  }

  function stopPollen() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function controleerNavigatie() {
    const id = haalVideoId();
    if (id && id !== huidigeVideoId) {
      huidigeVideoId = id;
      verwerkt = false;
      startPollen();
    }
  }

  document.addEventListener("yt-navigate-finish", controleerNavigatie);
  window.addEventListener("popstate", controleerNavigatie);
  // Vangnet voor gemiste of niet-standaard navigatie-events binnen de YouTube-SPA
  setInterval(controleerNavigatie, 1500);

  controleerNavigatie();
})();
