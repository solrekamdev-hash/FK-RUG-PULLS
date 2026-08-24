(() => {
  "use strict";

  const generatedSurface = (role, panel = "primary") => ({ type: "generated", role, panel });
  const pageSurface = (pageIndex) => ({ type: "page", pageIndex });

  const logic = Object.freeze({
    spreadIndexForPage(pageIndex) {
      return Math.ceil(Math.max(pageIndex, 0) / 2);
    },

    lastSpreadIndex(pageCount) {
      return pageCount > 0 ? Math.ceil((pageCount - 1) / 2) : 0;
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

    desktopStates(pageCount) {
      const states = [{ key: "cover-front", kind: "cover", side: "front", pageIndexes: [] }];
      if (pageCount < 1) {
        states.push(
          { key: "inside-front", kind: "spread", surfaces: { left: generatedSurface("inside-front", "secondary"), right: generatedSurface("inside-front") }, pageIndexes: [] },
          { key: "content", kind: "markdown", pageIndexes: [] },
          { key: "inside-back", kind: "spread", surfaces: { left: generatedSurface("inside-back"), right: generatedSurface("inside-back", "secondary") }, pageIndexes: [] }
        );
      } else {
        let includesInsideBack = false;
        for (let spreadIndex = 0; spreadIndex <= this.lastSpreadIndex(pageCount); spreadIndex += 1) {
          const spread = this.spreadPages(pageCount, spreadIndex);
          const left = spread.left === null ? generatedSurface("inside-front") : pageSurface(spread.left);
          let right = spread.right === null ? null : pageSurface(spread.right);
          if (right === null) {
            right = generatedSurface("inside-back");
            includesInsideBack = true;
          }
          const pageIndexes = [spread.left, spread.right].filter((pageIndex) => pageIndex !== null);
          const key = spreadIndex === 0 ? "inside-front" : right.role === "inside-back" ? "inside-back" : `page-${pageIndexes[0] + 1}`;
          states.push({ key, kind: "spread", surfaces: { left, right }, pageIndexes });
        }
        if (!includesInsideBack) {
          states.push({
            key: "inside-back",
            kind: "spread",
            surfaces: { left: generatedSurface("inside-back"), right: generatedSurface("inside-back", "secondary") },
            pageIndexes: []
          });
        }
      }
      states.push({ key: "cover-back", kind: "cover", side: "back", pageIndexes: [] });
      return states;
    },

    mobileStates(pageCount) {
      const states = [
        { key: "cover-front", kind: "cover", side: "front", pageIndexes: [] },
        { key: "inside-front", kind: "surface", surface: generatedSurface("inside-front"), pageIndexes: [] }
      ];
      if (pageCount < 1) {
        states.push({ key: "content", kind: "markdown", pageIndexes: [] });
      } else {
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
          states.push({ key: `page-${pageIndex + 1}`, kind: "surface", surface: pageSurface(pageIndex), pageIndexes: [pageIndex] });
        }
      }
      states.push(
        { key: "inside-back", kind: "surface", surface: generatedSurface("inside-back"), pageIndexes: [] },
        { key: "cover-back", kind: "cover", side: "back", pageIndexes: [] }
      );
      return states;
    },

    stateHash(state) {
      if (state.key === "cover-front") return "";
      if (state.key === "cover-back") return "#back-cover";
      if (state.key === "content") return "#content";
      if (state.key === "inside-front") return "#inside-front";
      if (state.key === "inside-back") return "#inside-back";
      const firstPage = state.pageIndexes?.[0];
      return Number.isInteger(firstPage) ? `#page-${firstPage + 1}` : "";
    },

    stateIndexFromHash(states, hash, pageCount) {
      if (!hash || hash === "#front-cover") return 0;
      const semanticKey = {
        "#inside-front": "inside-front",
        "#content": "content",
        "#inside-back": "inside-back",
        "#back-cover": "cover-back"
      }[hash];
      if (semanticKey) {
        const semanticIndex = states.findIndex((state) => state.key === semanticKey);
        if (semanticIndex >= 0) return semanticIndex;
      }
      const pageMatch = hash.match(/^#page-(\d+)$/);
      if (pageMatch && pageCount > 0) {
        const pageIndex = Math.min(Math.max(Number.parseInt(pageMatch[1], 10) - 1, 0), pageCount - 1);
        const matchingState = states.findIndex((state) => state.pageIndexes.includes(pageIndex));
        if (matchingState >= 0) return matchingState;
      }
      return 0;
    },

    locationAfterStateTurn(stateCount, stateIndex, direction) {
      const targetStateIndex = stateIndex + direction;
      return targetStateIndex >= 0 && targetStateIndex < stateCount
        ? { type: "state", stateIndex: targetStateIndex }
        : { type: "entry", direction };
    },

    transitionMode(reducedMotion, mobile) {
      if (reducedMotion) return "immediate";
      return mobile ? "mobile" : "desktop";
    },

    physicalEase(t) {
      const progress = Math.max(0, Math.min(1, t));
      let low = 0;
      let high = 1;
      let curve = progress;
      for (let index = 0; index < 18; index += 1) {
        curve = (low + high) / 2;
        const x = (3 * curve * (1 - curve) * (1 - curve) * .36)
          + (3 * curve * curve * (1 - curve) * .18)
          + (curve * curve * curve);
        if (x < progress) low = curve;
        else high = curve;
      }
      return (3 * curve * (1 - curve) * (1 - curve) * .02)
        + (3 * curve * curve * (1 - curve))
        + (curve * curve * curve);
    },

    bookGeometry(position, mobile = false, pageWidth = 340, thickness = 15) {
      const pos = Math.max(0, Math.min(2, position));
      const clamp01 = (value) => Math.max(0, Math.min(1, value));
      const closedLeft = clamp01(1 - pos);
      const closedRight = clamp01(pos - 1);
      const segmentProgress = pos <= 1 ? pos : pos - 1;
      const direction = pos <= 1 ? -1 : 1;
      let lift = Math.sin(Math.PI * Math.pow(segmentProgress, .92));
      if (segmentProgress > .78) {
        lift -= .17 * Math.sin(Math.PI * (segmentProgress - .78) / .22);
      }
      const shadowBase = mobile ? .92 : 1 - (.44 * Math.abs(pos - 1));
      return {
        position: pos,
        leftAngle: (mobile ? -180 : 180) * closedLeft,
        rightAngle: (mobile ? 180 : -180) * closedRight,
        leftRise: thickness * closedLeft,
        rightRise: thickness * closedRight,
        offsetX: mobile ? pageWidth * (1 - pos) : (pageWidth / 2) * (pos - 1),
        lift,
        tiltX: (mobile ? 4 : 5.5) + ((mobile ? 3.2 : 4.6) * lift),
        tiltY: (mobile ? 1.6 : 2.4) * lift * direction,
        scale: 1 + (.014 * lift),
        shadowScaleX: shadowBase * (1 + (.07 * lift)),
        shadowScaleY: 1 + (.1 * lift),
        shadowOpacity: .94 - (.34 * lift),
        shadowBlur: (mobile ? 18 : 24) + (22 * lift)
      };
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
  if (!entry || !Array.isArray(entry.pages)) return;

  const designs = {
    "001": {
      coverFront: [],
      coverBack: [],
      insideFront: ["ENTRY 001 / START", "JUST LOOKING.", "RENT / PHONE / FUEL / FOOD", "NO STUPID SHIT."],
      insideBack: ["ENTRY 001 / END", "ONE CLEAN WIN.", "DON'T CHASE. DON'T PANIC.", "CLOSE THE BOOK."]
    },
    "002": {
      coverFront: ["FIELD NOTES / 002", "PROFIT?", "DO NOT GET GREEDY"],
      coverBack: ["ENTRY 002", "TAKE PROFIT", "COIN / CHART / EXIT"],
      insideFront: ["ENTRY 002 / PLAN", "PROFIT IS PROFIT?", "$  →  $$  →  ???", "MARKET CAP / LIQUIDITY"],
      insideBack: ["ENTRY 002 / RULES", "SELL SOME.", "DON'T CHASE THE CANDLE.", "+ + +  -  ?"]
    },
    "003": {
      coverFront: ["TRADING LOG / 003", "I GET IT NOW", "LET IT RUN / TRUST THE CHART"],
      coverBack: ["ENTRY 003", "UP ONLY", "TAKE PROFIT LATER"],
      insideFront: ["ENTRY 003 / THESIS", "I KNOW WHAT I'M DOING.", "HIGHER HIGH / HIGHER LOW", "HOLD  HOLD  HOLD"],
      insideBack: ["ENTRY 003 / RESULT", "DON'T SELL YET.", "ONE MORE CANDLE.", "↑ ↑ ↑  $  $  $"]
    },
    "004": {
      coverFront: ["DO NOT CLOSE / 004", "HOLD LONGER", "MONEY I NEVER HAD"],
      coverBack: ["ENTRY 004", "TOO EARLY", "WHY DID I SELL / WHY / WHY"],
      insideFront: ["ENTRY 004 / AGAIN", "HOLD LONGER.", "HOLD HOLD HOLD HOLD", "DON'T TOUCH SELL"],
      insideBack: ["ENTRY 004 / OBSESSION", "I SOLD TOO EARLY.", "OF COURSE I DID.", "WHY?  WHY?  WHY?"]
    },
    "005": {
      coverFront: ["FINAL FILE / 005", "FK RUG PULLS", "FOLLOW THE WALLETS"],
      coverBack: ["CASE CLOSED?", "FK RUG PULLS", "WHO SOLD FIRST?"],
      insideFront: ["ENTRY 005 / EVIDENCE", "FK RUG PULLS", "WALLET 7 / ONE SALE", "WHO FUNDED WHO"],
      insideBack: ["ENTRY 005 / END", "FOLLOW THE MONEY.", "WHO SOLD. WHO MOVED.", "FK RUG PULLS"]
    }
  };

  const fallback = document.querySelector("[data-journal-fallback]");
  const reader = viewer.querySelector(".journal-reader");
  const readerStage = viewer.querySelector("[data-journal-reader-stage]");
  const markdownStage = viewer.querySelector("[data-journal-markdown-stage]");
  const bookFigure = viewer.querySelector("[data-journal-book-stage]");
  const book = viewer.querySelector("[data-journal-book]");
  const bookPosition = viewer.querySelector("[data-journal-book-position]");
  const bookRig = viewer.querySelector("[data-journal-book-rig]");
  const physicalShadow = viewer.querySelector("[data-journal-physical-shadow]");
  const leftLeaf = viewer.querySelector("[data-journal-left-leaf]");
  const rightLeaf = viewer.querySelector("[data-journal-right-leaf]");
  const leftInside = viewer.querySelector(".journal-leaf-inside-left");
  const rightInside = viewer.querySelector(".journal-leaf-inside-right");
  const frontCover = viewer.querySelector("[data-journal-cover-front]");
  const backCover = viewer.querySelector("[data-journal-cover-back]");
  const coverFaces = [
    { side: "front", element: frontCover, image: frontCover.querySelector("[data-journal-cover-image]"), design: frontCover.querySelector("[data-journal-cover-design]") },
    { side: "back", element: backCover, image: backCover.querySelector("[data-journal-cover-image]"), design: backCover.querySelector("[data-journal-cover-design]") }
  ];
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
  let states = statesForMode();
  let currentStateIndex = logic.stateIndexFromHash(states, window.location.hash, entry.pages.length);
  let isAnimating = false;
  let suppressHashChange = false;
  let queuedHash = null;
  let imageFailure = false;

  function statesForMode() {
    return mobileQuery.matches ? logic.mobileStates(entry.pages.length) : logic.desktopStates(entry.pages.length);
  }

  function adjacentEntry(direction) {
    return entries[entryIndex + direction] || null;
  }

  function assetFor(role) {
    const assetKey = {
      "cover-front": "coverFront",
      "cover-back": "coverBack",
      "inside-front": "insideFront",
      "inside-back": "insideBack"
    }[role];
    return assetKey ? entry.assets?.[assetKey] || null : null;
  }

  function addDesignElement(root, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    if (text) element.textContent = text;
    root.append(element);
  }

  function renderCoverDesign(coverDesign, side) {
    const design = designs[entry.id]?.[side === "front" ? "coverFront" : "coverBack"] || [entry.id, "NOTES", ""];
    coverDesign.replaceChildren();
    coverDesign.dataset.coverSide = side;
    if (entry.id === "001") return;
    addDesignElement(coverDesign, "span", "journal-design-label", design[0]);
    if (design[1]) addDesignElement(coverDesign, "strong", "journal-design-title", design[1]);
    addDesignElement(coverDesign, "span", "journal-design-detail", design[2]);
    for (let index = 0; index < 4; index += 1) addDesignElement(coverDesign, "i", `journal-cover-scratch journal-cover-scratch-${index + 1}`, "");
  }

  function renderCoverFace(face) {
    renderCoverDesign(face.design, face.side);
    const role = face.side === "front" ? "cover-front" : "cover-back";
    const source = assetFor(role);
    face.image.hidden = true;
    face.image.alt = "";
    face.image.removeAttribute("src");
    face.design.hidden = false;
    if (source) {
      face.design.hidden = true;
      face.image.hidden = false;
      face.image.alt = `Entry ${entry.id}, ${face.side} cover artwork`;
      face.image.src = source;
    }
  }

  function createInsideDesign(descriptor) {
    const design = designs[entry.id]?.[descriptor.role === "inside-front" ? "insideFront" : "insideBack"] || [entry.id, "NOTES", "", ""];
    const root = document.createElement("div");
    root.className = "journal-inside-design";
    root.dataset.insideRole = descriptor.role;
    root.dataset.panel = descriptor.panel || "primary";
    root.setAttribute("aria-hidden", "true");
    const primary = descriptor.panel === "secondary" ? design[2] : design[1];
    const secondary = descriptor.panel === "secondary" ? design[3] : design[2];
    addDesignElement(root, "span", "journal-design-label", design[0]);
    addDesignElement(root, "strong", "journal-design-title", primary);
    addDesignElement(root, "span", "journal-design-detail", secondary);
    addDesignElement(root, "span", "journal-design-marks", descriptor.role === "inside-front" ? "×  ×   →" : "←   ×  ×");
    for (let index = 0; index < 3; index += 1) addDesignElement(root, "i", `journal-page-scribble journal-page-scribble-${index + 1}`, "");
    return root;
  }

  function resetSurface(surface) {
    const image = surface.querySelector("img");
    surface.classList.add("is-blank");
    surface.classList.remove("is-loading", "is-generated", "has-generated-asset");
    surface.dataset.page = "blank";
    surface.dataset.surfaceKind = "blank";
    surface.removeAttribute("role");
    surface.setAttribute("aria-hidden", "true");
    surface.removeAttribute("aria-label");
    image.hidden = true;
    image.alt = "";
    image.removeAttribute("src");
    surface.querySelector(".journal-inside-design")?.remove();
  }

  function pageDescription(pageIndex) {
    return `Entry ${entry.id}, page ${pageIndex + 1} of ${entry.pages.length}: ${entry.title}`;
  }

  function setSurface(surface, descriptor) {
    resetSurface(surface);
    if (!descriptor) return;
    const image = surface.querySelector("img");
    if (descriptor.type === "page") {
      surface.classList.remove("is-blank");
      surface.dataset.surfaceKind = "page";
      surface.dataset.page = String(descriptor.pageIndex + 1);
      surface.removeAttribute("aria-hidden");
      image.hidden = false;
      image.alt = pageDescription(descriptor.pageIndex);
      surface.classList.add("is-loading");
      image.src = entry.pages[descriptor.pageIndex];
      return;
    }

    surface.classList.add("is-generated");
    surface.dataset.surfaceKind = descriptor.role;
    surface.dataset.page = descriptor.role;
    surface.removeAttribute("aria-hidden");
    surface.setAttribute("role", "img");
    surface.setAttribute("aria-label", `Entry ${entry.id}, ${descriptor.role.replace("-", " ")} notes`);
    const design = createInsideDesign(descriptor);
    surface.append(design);
    const source = assetFor(descriptor.role);
    if (source) {
      design.hidden = true;
      surface.classList.add("is-loading", "has-generated-asset");
      image.hidden = false;
      image.alt = `Entry ${entry.id}, ${descriptor.role.replace("-", " ")} artwork`;
      image.src = source;
    }
  }

  function renderTurnFace(face, descriptor) {
    face.replaceChildren();
    face.classList.remove("is-blank", "is-generated");
    if (!descriptor) {
      face.classList.add("is-blank");
      return;
    }
    if (descriptor.type === "page") {
      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "async";
      image.src = entry.pages[descriptor.pageIndex];
      face.append(image);
      return;
    }
    face.classList.add("is-blank", "is-generated");
    face.append(createInsideDesign(descriptor));
  }

  function renderClosedCover(side) {
    book.dataset.bookState = side === "front" ? "cover-front" : "cover-back";
    coverFaces.forEach((face) => {
      const active = face.side === side;
      face.element.setAttribute("aria-hidden", String(!active));
      face.element.removeAttribute("role");
      face.element.removeAttribute("aria-label");
      if (active) {
        face.element.setAttribute("role", "img");
        face.element.setAttribute("aria-label", `Entry ${entry.id}, closed ${side} cover`);
      }
    });
  }

  function stateDescription(state) {
    if (state.key === "cover-front") return `Entry ${entry.id}, front cover closed.`;
    if (state.key === "cover-back") return `Entry ${entry.id}, back cover closed.`;
    if (state.key === "inside-front") return `Entry ${entry.id}, inside front notes.`;
    if (state.key === "inside-back") return `Entry ${entry.id}, inside back notes.`;
    if (state.key === "content") return `Entry ${entry.id}, Markdown journal content.`;
    const numbers = state.pageIndexes.map((pageIndex) => pageIndex + 1);
    return numbers.length > 1
      ? `Entry ${entry.id}, pages ${numbers[0]} to ${numbers[numbers.length - 1]} of ${entry.pages.length}.`
      : `Entry ${entry.id}, page ${numbers[0]} of ${entry.pages.length}.`;
  }

  function statePhysicalPosition(state) {
    if (state.kind !== "cover") return 1;
    return state.side === "front" ? 0 : 2;
  }

  function faceIsVisible(angle) {
    const normalized = ((((angle + 180) % 360) + 360) % 360) - 180;
    return Math.abs(normalized) <= 90.05;
  }

  function applyPhysicalBook(position) {
    const mobile = mobileQuery.matches;
    const pageWidth = mobile ? book.clientWidth : book.clientWidth / 2;
    const thickness = Math.max(8, Math.min(15, pageWidth * .044));
    const geometry = logic.bookGeometry(position, mobile, pageWidth, thickness);
    book.style.setProperty("--journal-thickness", `${thickness.toFixed(2)}px`);
    bookPosition.style.transform = `translate3d(${geometry.offsetX.toFixed(2)}px, ${(-16 * geometry.lift).toFixed(2)}px, 0)`;
    bookRig.style.transform = `rotateX(${geometry.tiltX.toFixed(2)}deg) rotateY(${geometry.tiltY.toFixed(2)}deg) scale3d(${geometry.scale.toFixed(4)}, ${geometry.scale.toFixed(4)}, 1)`;
    leftLeaf.style.transform = `translateZ(${geometry.leftRise.toFixed(2)}px) rotateY(${geometry.leftAngle.toFixed(2)}deg)`;
    rightLeaf.style.transform = `translateZ(${geometry.rightRise.toFixed(2)}px) rotateY(${geometry.rightAngle.toFixed(2)}deg)`;
    const leftOnTop = geometry.position <= 1;
    leftLeaf.style.zIndex = leftOnTop ? "5" : "2";
    rightLeaf.style.zIndex = leftOnTop ? "2" : "5";
    leftInside.style.visibility = faceIsVisible(geometry.leftAngle) ? "visible" : "hidden";
    frontCover.style.visibility = faceIsVisible(geometry.leftAngle + 180) ? "visible" : "hidden";
    rightInside.style.visibility = faceIsVisible(geometry.rightAngle) ? "visible" : "hidden";
    backCover.style.visibility = faceIsVisible(geometry.rightAngle + 180) ? "visible" : "hidden";
    const shadowOffsetX = mobile ? 0 : geometry.offsetX * .92;
    physicalShadow.style.transform = `translate3d(${shadowOffsetX.toFixed(2)}px, ${(10 * geometry.lift).toFixed(2)}px, 0) scale(${geometry.shadowScaleX.toFixed(3)}, ${geometry.shadowScaleY.toFixed(3)})`;
    physicalShadow.style.filter = `blur(${geometry.shadowBlur.toFixed(1)}px)`;
    physicalShadow.style.opacity = geometry.shadowOpacity.toFixed(3);
    const nearest = Math.round(geometry.position);
    book.dataset.bookPosition = Math.abs(geometry.position - nearest) < .002
      ? ["front", "open", "back"][nearest]
      : "folding";
  }

  function hideCoverAccessibility() {
    coverFaces.forEach((face) => {
      face.element.setAttribute("aria-hidden", "true");
      face.element.removeAttribute("role");
      face.element.removeAttribute("aria-label");
    });
  }

  function renderState(stateIndex, announce = false, preserveSurfaces = false) {
    if (imageFailure) return;
    states = statesForMode();
    currentStateIndex = Math.min(Math.max(stateIndex, 0), states.length - 1);
    const state = states[currentStateIndex];
    viewer.dataset.state = state.key;
    viewer.dataset.mode = mobileQuery.matches ? "mobile" : "desktop";
    reader.classList.toggle("is-markdown", state.kind === "markdown");
    bookFigure.hidden = state.kind === "markdown";
    markdownStage.hidden = state.kind !== "markdown";
    if (fallback) fallback.hidden = state.kind !== "markdown";

    if (state.kind === "markdown") {
      indicator.textContent = "Journal transcript";
    } else if (state.kind === "cover") {
      renderClosedCover(state.side);
      applyPhysicalBook(statePhysicalPosition(state));
      indicator.textContent = `${state.side === "front" ? "Front" : "Back"} cover`;
    } else {
      book.dataset.bookState = "open";
      hideCoverAccessibility();
      applyPhysicalBook(1);
      if (!preserveSurfaces) {
        if (state.kind === "surface") {
          resetSurface(leftSurface);
          resetSurface(rightSurface);
          setSurface(mobileSurface, state.surface);
        } else {
          resetSurface(mobileSurface);
          setSurface(leftSurface, state.surfaces.left);
          setSurface(rightSurface, state.surfaces.right);
        }
      }
      indicator.textContent = stateDescription(state).replace(`Entry ${entry.id}, `, "");
    }

    if (announce) status.textContent = stateDescription(state);
    if (!isAnimating) describeTurns();
    preloadNearbyStates();
  }

  function turnLabel(targetState, direction) {
    if (targetState.key === "inside-front") return direction > 0 ? `Open entry ${entry.id}` : `Return to entry ${entry.id} opening notes`;
    if (targetState.key === "inside-back") return direction > 0 ? `Turn to entry ${entry.id} closing notes` : `Reopen entry ${entry.id} closing notes`;
    if (targetState.key === "cover-front") return "Close journal to front cover";
    if (targetState.key === "cover-back") return "Close journal to back cover";
    if (targetState.key === "content") return `Read entry ${entry.id} journal transcript`;
    const firstPage = targetState.pageIndexes[0] + 1;
    return mobileQuery.matches
      ? `${direction < 0 ? "Previous" : "Next"} page: page ${firstPage} of ${entry.pages.length}`
      : `${direction < 0 ? "Previous" : "Next"} physical spread, starting at page ${firstPage}`;
  }

  function describeTurn(button, direction) {
    const location = logic.locationAfterStateTurn(states.length, currentStateIndex, direction);
    if (location.type === "state") {
      const label = turnLabel(states[location.stateIndex], direction);
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
    } else describeTurns();
  }

  function descriptorsForState(state) {
    if (state.kind === "surface") return [state.surface];
    if (state.kind === "spread") return [state.surfaces.left, state.surfaces.right];
    return [];
  }

  function preloadNearbyStates() {
    const sources = new Set();
    [currentStateIndex - 1, currentStateIndex + 1].forEach((stateIndex) => {
      const state = states[stateIndex];
      if (!state) return;
      if (state.kind === "cover") {
        const coverSource = assetFor(state.side === "front" ? "cover-front" : "cover-back");
        if (coverSource) sources.add(coverSource);
      }
      descriptorsForState(state).forEach((descriptor) => {
        const source = descriptor.type === "page" ? entry.pages[descriptor.pageIndex] : assetFor(descriptor.role);
        if (source) sources.add(source);
      });
    });
    sources.forEach((source) => {
      const preload = new Image();
      preload.src = source;
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
      const timeout = window.setTimeout(finish, 780);
      element.addEventListener("animationend", finish);
    });
  }

  async function animateDesktop(targetState, direction) {
    const currentState = states[currentStateIndex];
    if (direction > 0) {
      setSurface(leftSurface, currentState.surfaces.left);
      setSurface(rightSurface, targetState.surfaces.right);
      renderTurnFace(turnFront, currentState.surfaces.right);
      renderTurnFace(turnBack, targetState.surfaces.left);
    } else {
      setSurface(leftSurface, targetState.surfaces.left);
      setSurface(rightSurface, currentState.surfaces.right);
      renderTurnFace(turnFront, currentState.surfaces.left);
      renderTurnFace(turnBack, targetState.surfaces.right);
    }
    book.classList.remove("is-turning-forward", "is-turning-backward");
    void turningSheet.offsetWidth;
    book.classList.add(direction > 0 ? "is-turning-forward" : "is-turning-backward");
    await waitForAnimation(turningSheet);
    book.classList.remove("is-turning-forward", "is-turning-backward");
    renderTurnFace(turnFront, null);
    renderTurnFace(turnBack, null);
    renderState(states.indexOf(targetState), true);
  }

  async function animateMobile(targetState, direction) {
    const className = direction > 0 ? "is-turning-forward" : "is-turning-backward";
    mobileSurface.classList.remove("is-turning-forward", "is-turning-backward");
    void mobileSurface.offsetWidth;
    mobileSurface.classList.add(className);
    await waitForAnimation(mobileSurface);
    mobileSurface.classList.remove(className);
    renderState(states.indexOf(targetState), true);
  }

  function prepareOpenState(state) {
    book.dataset.bookState = "folding";
    if (state.kind === "surface") {
      resetSurface(leftSurface);
      resetSurface(rightSurface);
      setSurface(mobileSurface, state.surface);
    } else if (state.kind === "spread") {
      resetSurface(mobileSurface);
      setSurface(leftSurface, state.surfaces.left);
      setSurface(rightSurface, state.surfaces.right);
    }
  }

  function animatePhysicalPosition(from, to) {
    const duration = mobileQuery.matches ? 760 : 980;
    return new Promise((resolve) => {
      const started = performance.now();
      const tick = (now) => {
        const elapsed = Math.min(1, (now - started) / duration);
        const eased = logic.physicalEase(elapsed);
        applyPhysicalBook(from + ((to - from) * eased));
        if (elapsed < 1) window.requestAnimationFrame(tick);
        else {
          applyPhysicalBook(to);
          resolve();
        }
      };
      window.requestAnimationFrame(tick);
    });
  }

  async function animateWholeBook(targetState) {
    const currentState = states[currentStateIndex];
    const from = statePhysicalPosition(currentState);
    const to = statePhysicalPosition(targetState);
    if (targetState.kind !== "cover") prepareOpenState(targetState);
    book.dataset.bookState = "folding";
    await animatePhysicalPosition(from, to);
    renderState(states.indexOf(targetState), true, targetState.kind !== "cover");
  }

  async function animateContentTransition(targetState) {
    const element = readerStage;
    const className = "is-switching-content";
    readerStage.classList.add(className);
    void element.offsetWidth;
    await waitForAnimation(element);
    readerStage.classList.remove(className);
    renderState(states.indexOf(targetState), true);
  }

  function writeStateHash(state) {
    const nextHash = logic.stateHash(state);
    if (window.location.hash === nextHash) return;
    if (nextHash) {
      suppressHashChange = true;
      window.location.hash = nextHash;
    } else {
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    }
  }

  async function navigateWithinEntry(targetStateIndex, direction) {
    if (isAnimating || imageFailure) return;
    isAnimating = true;
    setBusy(true);
    const targetState = states[targetStateIndex];
    const currentState = states[currentStateIndex];
    try {
      const transitionMode = logic.transitionMode(reducedMotionQuery.matches, mobileQuery.matches);
      if (transitionMode === "immediate") renderState(targetStateIndex, true);
      else if (currentState.kind === "cover" || targetState.kind === "cover") await animateWholeBook(targetState);
      else if (transitionMode === "desktop" && currentState.kind === "spread" && targetState.kind === "spread") await animateDesktop(targetState, direction);
      else if (transitionMode === "mobile" && currentState.kind === "surface" && targetState.kind === "surface") await animateMobile(targetState, direction);
      else await animateContentTransition(targetState);
      writeStateHash(targetState);
    } finally {
      isAnimating = false;
      setBusy(false);
      if (queuedHash !== null) {
        const requestedHash = queuedHash;
        queuedHash = null;
        states = statesForMode();
        renderState(logic.stateIndexFromHash(states, requestedHash, entry.pages.length), true);
      }
    }
  }

  function turn(direction) {
    if (isAnimating || imageFailure) return;
    const location = logic.locationAfterStateTurn(states.length, currentStateIndex, direction);
    if (location.type === "state") {
      navigateWithinEntry(location.stateIndex, direction);
      return;
    }
    const entryTarget = adjacentEntry(direction);
    if (!entryTarget) return;
    const targetHash = direction < 0 ? "#back-cover" : "";
    window.location.href = `../${entryTarget.id}/index.html${targetHash}`;
  }

  function showMarkdownFallback(event) {
    if (imageFailure) return;
    imageFailure = true;
    viewer.hidden = true;
    if (fallback) {
      viewer.after(fallback);
      fallback.hidden = false;
    }
    document.body.classList.remove("has-image-pages", "has-journal-viewer");
    console.warn(`Journal page image could not be loaded: ${event.currentTarget.getAttribute("src")}`);
  }

  surfaces.forEach((surface) => {
    const image = surface.querySelector("img");
    image.addEventListener("load", () => {
      surface.classList.remove("is-loading");
      if (surface.dataset.surfaceKind !== "page") surface.querySelector(".journal-inside-design")?.setAttribute("hidden", "");
    });
    image.addEventListener("error", (event) => {
      if (surface.dataset.surfaceKind === "page") {
        showMarkdownFallback(event);
        return;
      }
      surface.classList.remove("is-loading", "has-generated-asset");
      image.hidden = true;
      surface.querySelector(".journal-inside-design")?.removeAttribute("hidden");
    });
  });

  coverFaces.forEach((face) => {
    face.image.addEventListener("load", () => {
      face.design.hidden = true;
      face.image.hidden = false;
    });
    face.image.addEventListener("error", () => {
      face.image.hidden = true;
      face.design.hidden = false;
    });
  });

  previousButton.addEventListener("click", () => turn(-1));
  nextButton.addEventListener("click", () => turn(1));

  window.addEventListener("hashchange", () => {
    if (suppressHashChange) {
      suppressHashChange = false;
      return;
    }
    if (isAnimating) {
      queuedHash = window.location.hash;
      return;
    }
    states = statesForMode();
    renderState(logic.stateIndexFromHash(states, window.location.hash, entry.pages.length), true);
  });

  const handleModeChange = () => {
    if (isAnimating) return;
    states = statesForMode();
    renderState(logic.stateIndexFromHash(states, window.location.hash, entry.pages.length));
  };
  if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", handleModeChange);
  else mobileQuery.addListener(handleModeChange);
  window.addEventListener("resize", () => {
    if (!isAnimating && states[currentStateIndex]?.kind !== "markdown") {
      applyPhysicalBook(statePhysicalPosition(states[currentStateIndex]));
    }
  });

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

  if (fallback) {
    markdownStage.append(fallback);
    fallback.hidden = true;
  }
  viewer.hidden = false;
  document.body.classList.add("has-journal-viewer");
  if (entry.pages.length > 0) document.body.classList.add("has-image-pages");
  coverFaces.forEach(renderCoverFace);
  renderState(currentStateIndex);
})();
