(() => {
  "use strict";

  const viewer = document.querySelector("[data-journal-viewer]");
  if (!viewer) return;

  const manifest = window.FRP_JOURNAL;
  const entries = Object.values(manifest?.entries || {}).sort((a, b) => a.id.localeCompare(b.id));
  const entryIndex = entries.findIndex((candidate) => candidate.id === viewer.dataset.entryId);
  const entry = entries[entryIndex];

  if (!entry || !Array.isArray(entry.pages) || entry.pages.length === 0) return;

  const fallback = document.querySelector("[data-journal-fallback]");
  const image = viewer.querySelector("[data-journal-page-image]");
  const indicator = viewer.querySelector("[data-journal-page-indicator]");
  const status = viewer.querySelector("[data-journal-status]");
  const frame = viewer.querySelector(".journal-image-frame");
  const previousButton = viewer.querySelector("[data-journal-previous]");
  const nextButton = viewer.querySelector("[data-journal-next]");
  let currentPage = 0;
  let activeSource = "";

  function pageFromHash() {
    const match = window.location.hash.match(/^#page-(\d+)$/);
    const requestedPage = match ? Number.parseInt(match[1], 10) : 1;
    return Math.min(Math.max(requestedPage - 1, 0), entry.pages.length - 1);
  }

  function adjacentEntry(direction) {
    return entries[entryIndex + direction] || null;
  }

  function describeTurn(button, direction) {
    const pageTarget = currentPage + direction;
    if (pageTarget >= 0 && pageTarget < entry.pages.length) {
      const label = `${direction < 0 ? "Previous" : "Next"} page: page ${pageTarget + 1} of ${entry.pages.length}`;
      button.disabled = false;
      button.setAttribute("aria-label", label);
      button.title = label;
      return;
    }

    const entryTarget = adjacentEntry(direction);
    if (entryTarget) {
      const label = `${direction < 0 ? "Previous" : "Next"} entry: entry ${entryTarget.id}`;
      button.disabled = false;
      button.setAttribute("aria-label", label);
      button.title = label;
      return;
    }

    const label = direction < 0 ? "Start of journal" : "End of journal";
    button.disabled = true;
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function preloadAdjacentPages() {
    [currentPage - 1, currentPage + 1].forEach((pageIndex) => {
      if (pageIndex < 0 || pageIndex >= entry.pages.length) return;
      const preload = new Image();
      preload.src = entry.pages[pageIndex];
    });
  }

  function renderPage(pageIndex, announce = false) {
    currentPage = Math.min(Math.max(pageIndex, 0), entry.pages.length - 1);
    activeSource = entry.pages[currentPage];
    frame.classList.add("is-loading");
    image.alt = `Entry ${entry.id}, page ${currentPage + 1} of ${entry.pages.length}: ${entry.title}`;
    image.src = activeSource;
    indicator.textContent = `Page ${currentPage + 1} / ${entry.pages.length}`;
    describeTurn(previousButton, -1);
    describeTurn(nextButton, 1);
    preloadAdjacentPages();

    if (announce) status.textContent = `Entry ${entry.id}, page ${currentPage + 1} of ${entry.pages.length}.`;
  }

  function turn(direction) {
    const pageTarget = currentPage + direction;
    if (pageTarget >= 0 && pageTarget < entry.pages.length) {
      const hash = `#page-${pageTarget + 1}`;
      if (window.location.hash === hash) {
        renderPage(pageTarget, true);
      } else {
        window.location.hash = hash;
      }
      return;
    }

    const entryTarget = adjacentEntry(direction);
    if (!entryTarget) return;

    const targetPage = direction < 0 && entryTarget.pages.length > 0 ? entryTarget.pages.length : 1;
    const targetHash = targetPage > 1 ? `#page-${targetPage}` : "";
    window.location.href = `../${entryTarget.id}/index.html${targetHash}`;
  }

  image.addEventListener("load", () => {
    if (image.getAttribute("src") !== activeSource) return;
    frame.classList.remove("is-loading");
  });

  image.addEventListener("error", () => {
    if (image.getAttribute("src") !== activeSource) return;
    viewer.hidden = true;
    if (fallback) fallback.hidden = false;
    document.body.classList.remove("has-image-pages");
    console.warn(`Journal page image could not be loaded: ${activeSource}`);
  });

  previousButton.addEventListener("click", () => turn(-1));
  nextButton.addEventListener("click", () => turn(1));

  window.addEventListener("hashchange", () => renderPage(pageFromHash(), true));
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowLeft" && !previousButton.disabled) turn(-1);
    if (event.key === "ArrowRight" && !nextButton.disabled) turn(1);
  });

  viewer.hidden = false;
  if (fallback) fallback.hidden = true;
  document.body.classList.add("has-image-pages");
  renderPage(pageFromHash());
})();
