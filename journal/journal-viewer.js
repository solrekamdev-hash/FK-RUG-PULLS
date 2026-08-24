(() => {
  "use strict";

  const structuralSurface = (role) => ({ type: "structural", role });
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
          { key: "inside-front", kind: "spread", surfaces: { left: structuralSurface("inside-front"), right: structuralSurface("inside-front") }, pageIndexes: [] },
          { key: "content", kind: "markdown", pageIndexes: [] },
          { key: "inside-back", kind: "spread", surfaces: { left: structuralSurface("inside-back"), right: structuralSurface("inside-back") }, pageIndexes: [] }
        );
      } else {
        let includesInsideBack = false;
        for (let spreadIndex = 0; spreadIndex <= this.lastSpreadIndex(pageCount); spreadIndex += 1) {
          const spread = this.spreadPages(pageCount, spreadIndex);
          const left = spread.left === null ? structuralSurface("inside-front") : pageSurface(spread.left);
          let right = spread.right === null ? null : pageSurface(spread.right);
          if (right === null) {
            right = structuralSurface("inside-back");
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
            surfaces: { left: structuralSurface("inside-back"), right: structuralSurface("inside-back") },
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
        { key: "inside-front", kind: "surface", surface: structuralSurface("inside-front"), pageIndexes: [] }
      ];
      if (pageCount < 1) {
        states.push({ key: "content", kind: "markdown", pageIndexes: [] });
      } else {
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
          states.push({ key: `page-${pageIndex + 1}`, kind: "surface", surface: pageSurface(pageIndex), pageIndexes: [pageIndex] });
        }
      }
      states.push(
        { key: "inside-back", kind: "surface", surface: structuralSurface("inside-back"), pageIndexes: [] },
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
        : { type: "turnaround", direction };
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

    curlEase(t) {
      const progress = Math.max(0, Math.min(1, t));
      let low = 0;
      let high = 1;
      let curve = progress;
      for (let index = 0; index < 20; index += 1) {
        curve = (low + high) / 2;
        const x = (3 * curve * (1 - curve) * (1 - curve) * .44)
          + (3 * curve * curve * (1 - curve) * .18)
          + (curve * curve * curve);
        if (x < progress) low = curve;
        else high = curve;
      }
      return (3 * curve * curve * (1 - curve)) + (curve * curve * curve);
    },

    curlAngles(progress, stripCount = 18) {
      const q = Math.max(0, Math.min(1, progress));
      const count = Math.max(2, stripCount);
      const base = 180 * q;
      const curl = 60 * Math.sin(Math.PI * Math.pow(q, .92));
      const over = q > .45 ? 9 * Math.sin(Math.PI * (q - .45) / .55) : 0;
      let settle = 0;
      if (q > .86) {
        const phase = (q - .86) / .14;
        settle = -3.4 * Math.sin(Math.PI * phase) * Math.exp(-2.2 * phase);
      }
      return Array.from({ length: count + 1 }, (_, index) => {
        const u = index / count;
        const shape = Math.pow(u, 1.45) * (1 + (.35 * Math.sin(Math.PI * u)));
        return base + (((curl + over) * shape) / 1.35) + (settle * u);
      });
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
      coverBack: []
    },
    "002": {
      coverFront: ["FIELD NOTES / 002", "PROFIT?", "DO NOT GET GREEDY"],
      coverBack: ["ENTRY 002", "TAKE PROFIT", "COIN / CHART / EXIT"]
    },
    "003": {
      coverFront: ["TRADING LOG / 003", "I GET IT NOW", "LET IT RUN / TRUST THE CHART"],
      coverBack: ["ENTRY 003", "UP ONLY", "TAKE PROFIT LATER"]
    },
    "004": {
      coverFront: ["DO NOT CLOSE / 004", "HOLD LONGER", "MONEY I NEVER HAD"],
      coverBack: ["ENTRY 004", "TOO EARLY", "WHY DID I SELL / WHY / WHY"]
    },
    "005": {
      coverFront: ["FINAL FILE / 005", "FK RUG PULLS", "FOLLOW THE WALLETS"],
      coverBack: ["CASE CLOSED?", "FK RUG PULLS", "WHO SOLD FIRST?"]
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
  const indicator = viewer.querySelector("[data-journal-page-indicator]");
  const status = viewer.querySelector("[data-journal-status]");
  const previousButton = viewer.querySelector("[data-journal-previous]");
  const nextButton = viewer.querySelector("[data-journal-next]");
  const mobileQuery = window.matchMedia("(max-width: 560px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const surfaces = [leftSurface, rightSurface, mobileSurface];
  const bookSpin = document.createElement("div");
  bookSpin.className = "journal-book-spin";
  bookPosition.before(bookSpin);
  bookSpin.append(bookPosition);
  let states = statesForMode();
  let currentStateIndex = logic.stateIndexFromHash(states, window.location.hash, entry.pages.length);
  let isAnimating = false;
  let suppressHashChange = false;
  let queuedHash = null;
  let imageFailure = false;
  let pageCurl = null;
  let pendingCurl = null;

  class PageCurlEngine {
    constructor(mount, stripCount = 18) {
      this.mount = mount;
      this.stripCount = stripCount;
      this.busy = false;
      this.progress = 0;
      this.direction = 1;
      this.width = 0;
      this.height = 0;
      this.raf = 0;
    }

    ensureSize(width, height, baseZ) {
      const nextWidth = Math.max(1, width);
      const nextHeight = Math.max(1, height);
      if (Math.abs(this.width - nextWidth) < .5 && Math.abs(this.height - nextHeight) < .5) {
        this.baseZ = baseZ;
        return;
      }
      this.width = nextWidth;
      this.height = nextHeight;
      this.baseZ = baseZ;
      this.build();
      this.apply(0, 1);
      this.setVisible(false);
    }

    build() {
      const width = this.width;
      const height = this.height;
      const stripWidth = width / this.stripCount;
      const bleed = Math.max(.7, width / 390);
      this.mount.replaceChildren();

      this.mirror = document.createElement("div");
      this.mirror.className = "journal-curl-mirror";
      this.mirror.style.width = `${width}px`;
      this.mirror.style.height = `${height}px`;
      this.mount.append(this.mirror);

      this.castFar = document.createElement("div");
      this.castFar.className = "journal-curl-shadow journal-curl-shadow-far";
      this.castNear = document.createElement("div");
      this.castNear.className = "journal-curl-shadow journal-curl-shadow-near";
      this.gutterShadow = document.createElement("div");
      this.gutterShadow.className = "journal-curl-shadow journal-curl-shadow-gutter";
      [this.castFar, this.castNear, this.gutterShadow].forEach((shadow) => {
        shadow.style.top = `${-height * .034}px`;
        shadow.style.height = `${height * 1.068}px`;
        this.mirror.append(shadow);
      });

      this.sheet = document.createElement("div");
      this.sheet.className = "journal-curl-sheet";
      this.sheet.style.width = `${width}px`;
      this.sheet.style.height = `${height}px`;
      this.mirror.append(this.sheet);

      this.strips = [];
      for (let index = 0; index < this.stripCount; index += 1) {
        const strip = document.createElement("div");
        strip.className = "journal-curl-strip";
        strip.style.width = `${stripWidth + bleed}px`;
        strip.style.height = `${height}px`;

        const createFace = (back) => {
          const face = document.createElement("div");
          face.className = `journal-curl-face ${back ? "journal-curl-face-back" : "journal-curl-face-front"}`;
          face.style.width = `${stripWidth + bleed}px`;
          face.style.height = `${height}px`;
          const texture = document.createElement("div");
          texture.className = "journal-curl-texture is-blank";
          texture.style.width = `${width}px`;
          texture.style.height = `${height}px`;
          texture.style.left = `${back ? -(width - ((index + 1) * stripWidth) - bleed) : -(index * stripWidth)}px`;
          const shade = document.createElement("div");
          shade.className = "journal-curl-shade";
          face.append(texture, shade);
          strip.append(face);
          return { face, texture, shade };
        };

        const front = createFace(false);
        const back = createFace(true);
        if (index === this.stripCount - 1) {
          const edge = document.createElement("div");
          edge.className = "journal-curl-fore-edge";
          strip.append(edge);
        }
        this.strips.push({ strip, front, back });
      }
      for (let index = this.strips.length - 1; index >= 0; index -= 1) {
        this.sheet.append(this.strips[index].strip);
      }
    }

    paintTexture(texture, descriptor) {
      const source = sourceForDescriptor(descriptor);
      texture.classList.toggle("is-blank", !source);
      texture.classList.toggle("has-image", Boolean(source));
      texture.style.backgroundImage = source ? `url("${source.replace(/"/g, "%22")}")` : "";
      if (source) {
        texture.style.backgroundSize = `${(this.width * 1.065).toFixed(2)}px ${(this.height * 1.025).toFixed(2)}px`;
        texture.style.backgroundPosition = `${(-this.width * .0325).toFixed(2)}px ${(-this.height * .0125).toFixed(2)}px`;
      } else {
        texture.style.removeProperty("background-size");
        texture.style.removeProperty("background-position");
      }
    }

    setFaces(frontDescriptor, backDescriptor) {
      this.strips.forEach((strip) => {
        this.paintTexture(strip.front.texture, frontDescriptor);
        this.paintTexture(strip.back.texture, backDescriptor);
      });
    }

    setVisible(visible) {
      this.mount.style.display = visible ? "block" : "none";
      this.mount.style.visibility = visible ? "visible" : "hidden";
    }

    apply(progress, direction) {
      const width = this.width;
      const height = this.height;
      const count = this.stripCount;
      const stripWidth = width / count;
      const q = Math.max(0, Math.min(1, progress));
      const dir = direction < 0 ? -1 : 1;
      const bell = Math.sin(Math.PI * Math.pow(q, .94));
      const angles = logic.curlAngles(q, count);
      this.mirror.style.transform = dir > 0 ? "none" : "scaleX(-1)";
      if (this.textureDirection !== dir) {
        const textureTransform = dir < 0 ? "scaleX(-1)" : "none";
        this.strips.forEach((strip) => {
          strip.front.texture.style.transform = textureTransform;
          strip.back.texture.style.transform = textureTransform;
        });
        this.textureDirection = dir;
      }

      const airborne = width * .038 * bell;
      this.sheet.style.transform = `translateZ(${(this.baseZ + airborne).toFixed(2)}px) rotateZ(${(-.9 * bell).toFixed(2)}deg) rotateX(${(-1.4 * bell).toFixed(2)}deg)`;
      let x = 0;
      let z = 0;
      let minimumX = 0;
      let maximumX = 0;
      this.strips.forEach((strip, index) => {
        const angle = (angles[index] + angles[index + 1]) / 2;
        const radians = angle * Math.PI / 180;
        const u = (index + .5) / count;
        const droop = height * .012 * bell * Math.pow(u, 2.2);
        strip.strip.style.transform = `translate3d(${x.toFixed(2)}px, ${droop.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${(-angle).toFixed(3)}deg)`;
        const faceAmount = Math.abs(Math.cos(radians));
        const frontVisible = Math.cos(radians) >= 0;
        strip.front.face.style.visibility = frontVisible ? "visible" : "hidden";
        strip.back.face.style.visibility = frontVisible ? "hidden" : "visible";
        strip.front.shade.style.opacity = frontVisible ? (.04 + (.4 * (1 - faceAmount))).toFixed(3) : "0";
        strip.back.shade.style.opacity = frontVisible ? "0" : (.12 + (.34 * (1 - faceAmount))).toFixed(3);
        x += stripWidth * Math.cos(radians);
        z += stripWidth * Math.sin(radians);
        minimumX = Math.min(minimumX, x);
        maximumX = Math.max(maximumX, x);
      });

      const nearWidth = Math.max(0, maximumX);
      const farWidth = Math.max(0, -minimumX);
      const shadowStrength = Math.min(1, bell * 1.3);
      this.castNear.style.width = `${nearWidth.toFixed(1)}px`;
      this.castNear.style.opacity = (.88 * shadowStrength * Math.min(1, nearWidth / Math.max(30, width * .18))).toFixed(3);
      this.castFar.style.left = `${(-farWidth).toFixed(1)}px`;
      this.castFar.style.width = `${farWidth.toFixed(1)}px`;
      this.castFar.style.opacity = (.88 * shadowStrength * Math.min(1, farWidth / Math.max(30, width * .18))).toFixed(3);
      this.gutterShadow.style.opacity = (.6 * bell).toFixed(3);
      this.gutterShadow.style.filter = `blur(${(5 + (7 * bell)).toFixed(1)}px)`;
      this.progress = q;
      this.direction = dir;
    }

    turn({ direction, duration = 780, reduced = false, onFrame } = {}) {
      if (this.busy) return Promise.resolve(false);
      const dir = direction < 0 ? -1 : 1;
      if (reduced) {
        this.apply(1, dir);
        onFrame?.(1);
        return Promise.resolve(true);
      }
      this.busy = true;
      const started = performance.now();
      return new Promise((resolve) => {
        const tick = (now) => {
          const elapsed = Math.min(1, (now - started) / duration);
          this.apply(logic.curlEase(elapsed), dir);
          onFrame?.(this.progress);
          if (elapsed < 1 && this.busy) this.raf = window.requestAnimationFrame(tick);
          else {
            const completed = this.busy;
            this.busy = false;
            if (completed) this.apply(1, dir);
            resolve(completed);
          }
        };
        this.raf = window.requestAnimationFrame(tick);
      });
    }

    reset(direction = this.direction || 1) {
      if (this.raf) window.cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.busy = false;
      if (this.width > 0) this.apply(0, direction);
      this.setVisible(false);
    }
  }

  function statesForMode() {
    return mobileQuery.matches ? logic.mobileStates(entry.pages.length) : logic.desktopStates(entry.pages.length);
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

  function sourceForDescriptor(descriptor) {
    if (!descriptor) return null;
    if (descriptor.type === "page") return entry.pages[descriptor.pageIndex] || null;
    return descriptor.type === "structural" ? assetFor(descriptor.role) : null;
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

  function resetSurface(surface) {
    const image = surface.querySelector("img");
    surface.classList.add("is-blank");
    surface.classList.remove("is-loading", "is-structural", "has-structural-asset");
    surface.dataset.page = "blank";
    surface.dataset.surfaceKind = "blank";
    surface.removeAttribute("role");
    surface.setAttribute("aria-hidden", "true");
    surface.removeAttribute("aria-label");
    image.hidden = true;
    image.alt = "";
    image.removeAttribute("src");
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

    surface.classList.add("is-structural");
    surface.dataset.surfaceKind = descriptor.role;
    surface.dataset.page = descriptor.role;
    const source = assetFor(descriptor.role);
    if (source) {
      surface.classList.remove("is-blank");
      surface.classList.add("is-loading", "has-structural-asset");
      surface.removeAttribute("aria-hidden");
      surface.setAttribute("role", "img");
      surface.setAttribute("aria-label", `Entry ${entry.id}, ${descriptor.role.replace("-", " ")} artwork`);
      image.hidden = false;
      image.alt = `Entry ${entry.id}, ${descriptor.role.replace("-", " ")} artwork`;
      image.src = source;
    }
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
    if (state.key === "inside-front") return `Entry ${entry.id}, inside front cover.`;
    if (state.key === "inside-back") return `Entry ${entry.id}, inside back cover.`;
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
    if (Math.abs(geometry.position - 1) > .002 && pageCurl && !pageCurl.busy && !pendingCurl) {
      pageCurl.apply(0, pageCurl.direction || 1);
      pageCurl.setVisible(false);
    }
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
    if (targetState.key === "inside-front") return direction > 0 ? `Open entry ${entry.id}` : `Return to entry ${entry.id} inside front cover`;
    if (targetState.key === "inside-back") return direction > 0 ? `Turn to entry ${entry.id} inside back cover` : `Reopen entry ${entry.id} inside back cover`;
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
    const label = direction < 0
      ? "Turn closed notebook over and loop to the final journal state"
      : "Turn closed notebook over and loop to the first journal state";
    button.disabled = false;
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
    } else {
      setSurface(leftSurface, targetState.surfaces.left);
      setSurface(rightSurface, currentState.surfaces.right);
    }
    if (!pageCurl) pageCurl = new PageCurlEngine(turningSheet, 18);
    const pageWidth = book.clientWidth / 2;
    const thickness = Math.max(8, Math.min(15, pageWidth * .044));
    pageCurl.ensureSize(pageWidth, book.clientHeight, (thickness / 2) + 1);
    const frontDescriptor = direction > 0 ? currentState.surfaces.right : currentState.surfaces.left;
    const backDescriptor = direction > 0 ? targetState.surfaces.left : targetState.surfaces.right;
    pageCurl.setFaces(frontDescriptor, backDescriptor);
    pageCurl.apply(0, direction);
    pageCurl.setVisible(true);
    pendingCurl = {
      direction,
      originalStateIndex: currentStateIndex,
      targetStateIndex: states.indexOf(targetState)
    };
    const completed = await pageCurl.turn({ direction, duration: 780 });
    if (!completed) return;
    pendingCurl = null;
    pageCurl.reset(direction);
    renderState(states.indexOf(targetState), true);
  }

  async function animateMobile(targetState, direction) {
    const started = performance.now();
    let swapped = false;
    mobileSurface.style.transformOrigin = direction > 0 ? "left center" : "right center";
    await new Promise((resolve) => {
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / 540);
        const eased = logic.physicalEase(progress);
        let angle;
        if (eased < .5) {
          angle = -90 * (eased / .5) * direction;
        } else {
          if (!swapped) {
            swapped = true;
            setSurface(mobileSurface, targetState.surface);
          }
          angle = 90 * (1 - ((eased - .5) / .5)) * direction;
        }
        const lift = Math.sin(Math.PI * progress);
        mobileSurface.style.transform = `perspective(1000px) translateY(${(-5 * lift).toFixed(2)}px) translateZ(${(12 * lift).toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`;
        mobileSurface.style.filter = `drop-shadow(${(-direction * 8 * lift).toFixed(2)}px ${(4 * lift).toFixed(2)}px ${(7 * lift).toFixed(2)}px rgba(10,10,10,.24))`;
        if (progress < 1) window.requestAnimationFrame(tick);
        else resolve();
      };
      window.requestAnimationFrame(tick);
    });
    mobileSurface.style.transform = "none";
    mobileSurface.style.filter = "none";
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

  function resolvePendingCurl() {
    if (!pendingCurl || !pageCurl) return;
    const stateIndex = pageCurl.progress > .5
      ? pendingCurl.targetStateIndex
      : pendingCurl.originalStateIndex;
    const direction = pendingCurl.direction;
    pendingCurl = null;
    pageCurl.reset(direction);
    renderState(stateIndex, false);
  }

  async function animateWholeBook(targetState) {
    resolvePendingCurl();
    const targetStateIndex = states.findIndex((candidate) => candidate.key === targetState.key);
    const liveTargetState = states[targetStateIndex];
    if (!liveTargetState) return;
    const currentState = states[currentStateIndex];
    const from = statePhysicalPosition(currentState);
    const to = statePhysicalPosition(liveTargetState);
    if (liveTargetState.kind !== "cover") prepareOpenState(liveTargetState);
    book.dataset.bookState = "folding";
    await animatePhysicalPosition(from, to);
    renderState(targetStateIndex, true, liveTargetState.kind !== "cover");
  }

  function turnaroundEase(progress) {
    return progress < .5
      ? 4 * progress * progress * progress
      : 1 - (Math.pow((-2 * progress) + 2, 3) / 2);
  }

  function applyTurnaround(theta, progress, direction, closedPosition) {
    const liftBase = Math.sin(Math.PI * Math.pow(progress, .9));
    const settle = progress > .8 ? .22 * Math.sin(Math.PI * (progress - .8) / .2) : 0;
    const lift = liftBase - settle;
    const mobile = mobileQuery.matches;
    const liftY = mobile ? 18 : 26;
    const liftZ = mobile ? 30 : 46;
    bookSpin.style.transform = `translateY(${(-liftY * lift).toFixed(2)}px) translateZ(${(liftZ * lift).toFixed(2)}px) rotateX(${(-4.2 * lift * direction).toFixed(2)}deg) rotateY(${theta.toFixed(2)}deg)`;

    const pageWidth = mobile ? book.clientWidth : book.clientWidth / 2;
    const thickness = Math.max(8, Math.min(15, pageWidth * .044));
    const rest = logic.bookGeometry(closedPosition, mobile, pageWidth, thickness);
    const edgeAmount = Math.abs(Math.cos(theta * Math.PI / 180));
    const shadowOffsetX = mobile ? 0 : rest.offsetX * .92;
    physicalShadow.style.transform = `translate3d(${shadowOffsetX.toFixed(2)}px, ${(16 * lift).toFixed(2)}px, 0) scale(${(rest.shadowScaleX * (.34 + (.66 * edgeAmount))).toFixed(3)}, ${(rest.shadowScaleY * (1 + (.08 * lift))).toFixed(3)})`;
    physicalShadow.style.filter = `blur(${(rest.shadowBlur + (18 * lift)).toFixed(1)}px)`;
    physicalShadow.style.opacity = (rest.shadowOpacity * (1 - (.42 * lift))).toFixed(3);
  }

  function animateClosedBookTurnaround(direction, destinationClosedIndex) {
    const sourceClosedPosition = statePhysicalPosition(states[currentStateIndex]);
    const destinationClosedPosition = statePhysicalPosition(states[destinationClosedIndex]);
    return new Promise((resolve) => {
      const started = performance.now();
      let swapped = false;
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / 900);
        const eased = turnaroundEase(progress);
        let theta = 180 * eased * direction;
        if (!swapped && Math.abs(theta) >= 90) {
          swapped = true;
          theta = 90 * direction;
          renderState(destinationClosedIndex, false);
        }
        if (swapped) theta -= 180 * direction;
        applyTurnaround(theta, progress, direction, swapped ? destinationClosedPosition : sourceClosedPosition);
        if (progress < 1) window.requestAnimationFrame(tick);
        else {
          if (!swapped) renderState(destinationClosedIndex, false);
          bookSpin.style.transform = "none";
          applyPhysicalBook(destinationClosedPosition);
          resolve();
        }
      };
      window.requestAnimationFrame(tick);
    });
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

  function applyQueuedHash() {
    if (queuedHash === null) return;
    const requestedHash = queuedHash;
    queuedHash = null;
    states = statesForMode();
    renderState(logic.stateIndexFromHash(states, requestedHash, entry.pages.length), true);
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
      applyQueuedHash();
    }
  }

  async function turnAround(direction) {
    if (isAnimating || imageFailure) return;
    isAnimating = true;
    setBusy(true);
    try {
      resolvePendingCurl();
      const destinationClosedIndex = direction > 0 ? 0 : states.length - 1;
      const destinationOpenIndex = direction > 0 ? 1 : states.length - 2;
      const destinationOpenState = states[destinationOpenIndex];
      if (reducedMotionQuery.matches) {
        renderState(destinationOpenIndex, true);
      } else {
        await animateClosedBookTurnaround(direction, destinationClosedIndex);
        await animateWholeBook(destinationOpenState);
      }
      writeStateHash(destinationOpenState);
    } finally {
      bookSpin.style.transform = "none";
      isAnimating = false;
      setBusy(false);
      applyQueuedHash();
    }
  }

  function turn(direction) {
    if (isAnimating || imageFailure) return;
    const location = logic.locationAfterStateTurn(states.length, currentStateIndex, direction);
    if (location.type === "state") {
      navigateWithinEntry(location.stateIndex, direction);
      return;
    }
    turnAround(direction);
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
    });
    image.addEventListener("error", (event) => {
      if (surface.dataset.surfaceKind === "page") {
        showMarkdownFallback(event);
        return;
      }
      surface.classList.add("is-blank");
      surface.classList.remove("is-loading", "has-structural-asset");
      image.hidden = true;
      surface.setAttribute("aria-hidden", "true");
      surface.removeAttribute("role");
      surface.removeAttribute("aria-label");
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
    if (event.repeat) return;
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
