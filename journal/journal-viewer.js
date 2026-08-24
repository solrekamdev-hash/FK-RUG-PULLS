(() => {
  "use strict";

  const logic = Object.freeze({
    clampPage(pageCount, pageIndex) {
      if (pageCount < 1) return 0;
      return Math.min(Math.max(pageIndex, 0), pageCount - 1);
    },

    spreadIndexForPage(pageIndex) {
      return Math.ceil(Math.max(pageIndex, 0) / 2);
    },

    lastSpreadIndex(pageCount) {
      return pageCount > 0 ? Math.ceil((pageCount - 1) / 2) : 0;
    },

    pageForSpread(spreadIndex) {
      return spreadIndex > 0 ? (spreadIndex * 2) - 1 : 0;
    },

    spreadPages(pageCount, spreadIndex) {
      if (pageCount < 1) return { left: null, right: null };
      const safeSpread = Math.min(Math.max(spreadIndex, 0), this.lastSpreadIndex(pageCount));
      const left = safeSpread === 0 ? null : (safeSpread * 2) - 1;
      const right = safeSpread * 2;
      return {
        left: left < pageCount ? left : null,
        right: right < pageCount ? right : null
      };
    },

    locationAfterTurn(pageCount, pageIndex, direction, mobile) {
      if (mobile) {
        const targetPage = pageIndex + direction;
        return targetPage >= 0 && targetPage < pageCount
          ? { type: "page", pageIndex: targetPage }
          : { type: "entry", direction };
      }

      const targetSpread = this.spreadIndexForPage(pageIndex) + direction;
      return targetSpread >= 0 && targetSpread <= this.lastSpreadIndex(pageCount)
        ? { type: "page", pageIndex: this.pageForSpread(targetSpread) }
        : { type: "entry", direction };
    },

    arrivalPage(pageCount, direction) {
      return direction < 0 && pageCount > 0 ? pageCount - 1 : 0;
    },

    transitionMode(reducedMotion, mobile) {
      if (reducedMotion) return "immediate";
      return mobile ? "mobile" : "desktop";
    }
  });

  if (typeof module === "object" && module.exports) module.exports = logic;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const viewer = document.querySelector("[data-journal-viewer]");
  if (!viewer) return;

  const manifest = window.FRP_JOURNAL;
  const entries = Object.values(manifest?.entries || {}).sort((a, b) => a.id.localeCompare(b.id));
  const entryIndex = entries.findIndex((candidate) => candidate.id === viewer.dataset.entryId);
  const entry = entries[entryIndex];

  if (!entry || !Array.isArray(entry.pages) || entry.pages.length === 0) return;

  const fallback = document.querySelector("[data-journal-fallback]");
  const book = viewer.querySelector("[data-journal-book]");
  const leftSurface = viewer.querySelector("[data-journal-left-page]");
  const rightSurface = viewer.querySelector("[data-journal-right-page]");
  const mobileSurface = viewer.querySelector("[data-journal-mobile-page]");
  const turningSheet = viewer.querySelector("[data-journal-turning-sheet]");
  const turnFront = viewer.querySelector("[data-journal-turn-front]");
  const turnBack = viewer.querySelector("[data-journal-turn-back]");
  const indicator = viewer.querySelector("[data-journal-page-indicator]");
  const status = viewer.querySelector("[data-journal-status]");
  const previousButton = viewer.querySelector("[data-journal-previous]");
  const nextButton = viewer.querySelector("[data-journal-next]");
  const mobileQuery = window.matchMedia("(max-width: 560px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const surfaces = [leftSurface, rightSurface, mobileSurface];
  let currentPage = pageFromHash();
  let isAnimating = false;
  let suppressHashChange = false;
  let queuedHashPage = null;
  let imageFailure = false;

  function pageFromHash() {
    const match = window.location.hash.match(/^#page-(\d+)$/);
    const requestedPage = match ? Number.parseInt(match[1], 10) - 1 : 0;
    return logic.clampPage(entry.pages.length, requestedPage);
  }

  function adjacentEntry(direction) {
    return entries[entryIndex + direction] || null;
  }

  function pageDescription(pageIndex) {
    return `Entry ${entry.id}, page ${pageIndex + 1} of ${entry.pages.length}: ${entry.title}`;
  }

  function clearSurface(surface) {
    const image = surface.querySelector("img");
    surface.classList.add("is-blank");
    surface.classList.remove("is-loading");
    surface.dataset.page = "blank";
    surface.setAttribute("aria-hidden", "true");
    image.hidden = true;
    image.alt = "";
    image.removeAttribute("src");
  }

  function setSurface(surface, pageIndex) {
    if (pageIndex === null || pageIndex < 0 || pageIndex >= entry.pages.length) {
      clearSurface(surface);
      return;
    }

    const image = surface.querySelector("img");
    const source = entry.pages[pageIndex];
    surface.classList.remove("is-blank");
    surface.dataset.page = String(pageIndex + 1);
    surface.removeAttribute("aria-hidden");
    image.hidden = false;
    image.alt = pageDescription(pageIndex);

    if (image.getAttribute("src") === source) {
      surface.classList.toggle("is-loading", !image.complete);
      return;
    }

    surface.classList.add("is-loading");
    image.src = source;
  }

  function renderTurnFace(face, pageIndex) {
    face.replaceChildren();
    face.classList.toggle("is-blank", pageIndex === null);
    if (pageIndex === null) return;

    const image = document.createElement("img");
    image.alt = "";
    image.decoding = "async";
    image.src = entry.pages[pageIndex];
    face.append(image);
  }

  function formatDesktopIndicator(spread) {
    const pageNumbers = [spread.left, spread.right]
      .filter((pageIndex) => pageIndex !== null)
      .map((pageIndex) => pageIndex + 1);
    if (pageNumbers.length === 1) return `Page ${pageNumbers[0]} / ${entry.pages.length}`;
    return `Pages ${pageNumbers[0]}–${pageNumbers[1]} / ${entry.pages.length}`;
  }

  function formatDesktopStatus(spread) {
    const pageNumbers = [spread.left, spread.right]
      .filter((pageIndex) => pageIndex !== null)
      .map((pageIndex) => pageIndex + 1);
    const pageLabel = pageNumbers.length === 1
      ? `page ${pageNumbers[0]}`
      : `pages ${pageNumbers[0]} to ${pageNumbers[1]}`;
    return `Entry ${entry.id}, ${pageLabel} of ${entry.pages.length}.`;
  }

  function render(pageIndex, announce = false) {
    if (imageFailure) return;
    currentPage = logic.clampPage(entry.pages.length, pageIndex);
    viewer.dataset.currentPage = String(currentPage + 1);

    if (mobileQuery.matches) {
      viewer.dataset.mode = "mobile";
      clearSurface(leftSurface);
      clearSurface(rightSurface);
      setSurface(mobileSurface, currentPage);
      book.dataset.leftPage = "blank";
      book.dataset.rightPage = "blank";
      book.dataset.mobilePage = String(currentPage + 1);
      indicator.textContent = `Page ${currentPage + 1} / ${entry.pages.length}`;
      if (announce) status.textContent = `Entry ${entry.id}, page ${currentPage + 1} of ${entry.pages.length}.`;
    } else {
      const spread = logic.spreadPages(entry.pages.length, logic.spreadIndexForPage(currentPage));
      viewer.dataset.mode = "desktop";
      clearSurface(mobileSurface);
      setSurface(leftSurface, spread.left);
      setSurface(rightSurface, spread.right);
      book.dataset.leftPage = spread.left === null ? "blank" : String(spread.left + 1);
      book.dataset.rightPage = spread.right === null ? "blank" : String(spread.right + 1);
      book.dataset.mobilePage = "blank";
      indicator.textContent = formatDesktopIndicator(spread);
      if (announce) status.textContent = formatDesktopStatus(spread);
    }

    if (!isAnimating) describeTurns();
    preloadNearbyPages();
  }

  function describeTurn(button, direction) {
    const location = logic.locationAfterTurn(entry.pages.length, currentPage, direction, mobileQuery.matches);
    if (location.type === "page") {
      const targetNumber = location.pageIndex + 1;
      const label = mobileQuery.matches
        ? `${direction < 0 ? "Previous" : "Next"} page: page ${targetNumber} of ${entry.pages.length}`
        : `${direction < 0 ? "Previous" : "Next"} physical spread, starting at page ${targetNumber}`;
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

  function describeTurns() {
    describeTurn(previousButton, -1);
    describeTurn(nextButton, 1);
  }

  function setBusy(busy) {
    viewer.setAttribute("aria-busy", String(busy));
    if (busy) {
      previousButton.disabled = true;
      nextButton.disabled = true;
    } else {
      describeTurns();
    }
  }

  function preloadNearbyPages() {
    const pageIndexes = new Set();
    if (mobileQuery.matches) {
      pageIndexes.add(currentPage - 1);
      pageIndexes.add(currentPage + 1);
    } else {
      const currentSpread = logic.spreadIndexForPage(currentPage);
      [currentSpread - 1, currentSpread + 1].forEach((spreadIndex) => {
        if (spreadIndex < 0 || spreadIndex > logic.lastSpreadIndex(entry.pages.length)) return;
        const spread = logic.spreadPages(entry.pages.length, spreadIndex);
        pageIndexes.add(spread.left);
        pageIndexes.add(spread.right);
      });
    }

    pageIndexes.forEach((pageIndex) => {
      if (pageIndex === null || pageIndex < 0 || pageIndex >= entry.pages.length) return;
      const preload = new Image();
      preload.src = entry.pages[pageIndex];
    });
  }

  function waitForAnimation(element) {
    return new Promise((resolve) => {
      let finished = false;
      const finish = (event) => {
        if (finished || (event && event.target !== element)) return;
        finished = true;
        element.removeEventListener("animationend", finish);
        window.clearTimeout(timeout);
        resolve();
      };
      const timeout = window.setTimeout(finish, 750);
      element.addEventListener("animationend", finish);
    });
  }

  async function animateDesktop(targetPage, direction) {
    const currentSpread = logic.spreadPages(entry.pages.length, logic.spreadIndexForPage(currentPage));
    const targetSpread = logic.spreadPages(entry.pages.length, logic.spreadIndexForPage(targetPage));

    if (direction > 0) {
      setSurface(leftSurface, currentSpread.left);
      setSurface(rightSurface, targetSpread.right);
      renderTurnFace(turnFront, currentSpread.right);
      renderTurnFace(turnBack, targetSpread.left);
    } else {
      setSurface(leftSurface, targetSpread.left);
      setSurface(rightSurface, currentSpread.right);
      renderTurnFace(turnFront, currentSpread.left);
      renderTurnFace(turnBack, targetSpread.right);
    }

    book.classList.remove("is-turning-forward", "is-turning-backward");
    void turningSheet.offsetWidth;
    book.classList.add(direction > 0 ? "is-turning-forward" : "is-turning-backward");
    await waitForAnimation(turningSheet);
    book.classList.remove("is-turning-forward", "is-turning-backward");
    renderTurnFace(turnFront, null);
    renderTurnFace(turnBack, null);
    render(targetPage, true);
  }

  async function animateMobile(targetPage, direction) {
    const className = direction > 0 ? "is-turning-forward" : "is-turning-backward";
    mobileSurface.classList.remove("is-turning-forward", "is-turning-backward");
    void mobileSurface.offsetWidth;
    mobileSurface.classList.add(className);
    await waitForAnimation(mobileSurface);
    mobileSurface.classList.remove(className);
    render(targetPage, true);
  }

  function writePageHash(pageIndex) {
    const nextHash = pageIndex > 0 ? `#page-${pageIndex + 1}` : "";
    if (window.location.hash === nextHash) return;
    suppressHashChange = true;
    window.location.hash = nextHash;
  }

  async function navigateWithinEntry(targetPage, direction) {
    if (isAnimating || imageFailure) return;
    isAnimating = true;
    setBusy(true);

    try {
      const transitionMode = logic.transitionMode(reducedMotionQuery.matches, mobileQuery.matches);
      if (transitionMode === "immediate") {
        render(targetPage, true);
      } else if (transitionMode === "mobile") {
        await animateMobile(targetPage, direction);
      } else {
        await animateDesktop(targetPage, direction);
      }
      writePageHash(targetPage);
    } finally {
      isAnimating = false;
      setBusy(false);
      if (queuedHashPage !== null) {
        const requestedPage = queuedHashPage;
        queuedHashPage = null;
        render(requestedPage, true);
      }
    }
  }

  function turn(direction) {
    if (isAnimating || imageFailure) return;
    const location = logic.locationAfterTurn(entry.pages.length, currentPage, direction, mobileQuery.matches);
    if (location.type === "page") {
      navigateWithinEntry(location.pageIndex, direction);
      return;
    }

    const entryTarget = adjacentEntry(direction);
    if (!entryTarget) return;

    const targetPage = logic.arrivalPage(entryTarget.pages.length, direction);
    const targetHash = targetPage > 0 ? `#page-${targetPage + 1}` : "";
    window.location.href = `../${entryTarget.id}/index.html${targetHash}`;
  }

  function showMarkdownFallback(event) {
    if (imageFailure) return;
    imageFailure = true;
    viewer.hidden = true;
    if (fallback) fallback.hidden = false;
    document.body.classList.remove("has-image-pages");
    console.warn(`Journal page image could not be loaded: ${event.currentTarget.getAttribute("src")}`);
  }

  surfaces.forEach((surface) => {
    const image = surface.querySelector("img");
    image.addEventListener("load", () => surface.classList.remove("is-loading"));
    image.addEventListener("error", showMarkdownFallback);
  });

  previousButton.addEventListener("click", () => turn(-1));
  nextButton.addEventListener("click", () => turn(1));

  window.addEventListener("hashchange", () => {
    if (suppressHashChange) {
      suppressHashChange = false;
      return;
    }
    const requestedPage = pageFromHash();
    if (isAnimating) {
      queuedHashPage = requestedPage;
      return;
    }
    render(requestedPage, true);
  });

  const handleModeChange = () => {
    if (!isAnimating) render(currentPage);
  };
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleModeChange);
  } else {
    mobileQuery.addListener(handleModeChange);
  }

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || event.target.isContentEditable) return;
    if (event.key === "ArrowLeft" && !previousButton.disabled) {
      event.preventDefault();
      turn(-1);
    }
    if (event.key === "ArrowRight" && !nextButton.disabled) {
      event.preventDefault();
      turn(1);
    }
  });

  viewer.hidden = false;
  if (fallback) fallback.hidden = true;
  document.body.classList.add("has-image-pages");
  render(currentPage);
})();
