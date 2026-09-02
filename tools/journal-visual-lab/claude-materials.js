/* Static, material-only adaptation of the approved Claude Journal Fold.
   The page/edge generators retain Claude's construction; only the paper
   palette is tuned to the warm, low-saturation stock in paper-real.png. */
(function () {
  "use strict";

  function seededRandom(seedIn) {
    let seed = seedIn;
    return function random() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  function svgUrl(svg) {
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }

  function makePaperTexture(seedIn) {
    const width = 680;
    const height = 940;
    const random = seededRandom(seedIn);

    let ruleGradients = "";
    let rules = "";
    for (let index = 0; index < 17; index += 1) {
      const yBase = 112 + index * 50;
      const fade = 0.072 + random() * 0.014;
      ruleGradients += `<linearGradient id="rule-${index}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#878177" stop-opacity="${(fade * (0.82 + random() * 0.08)).toFixed(3)}"/><stop offset="0.38" stop-color="#878177" stop-opacity="${(fade * (0.94 + random() * 0.06)).toFixed(3)}"/><stop offset="0.72" stop-color="#878177" stop-opacity="${(fade * (0.86 + random() * 0.08)).toFixed(3)}"/><stop offset="1" stop-color="#878177" stop-opacity="${(fade * (0.78 + random() * 0.1)).toFixed(3)}"/></linearGradient>`;
      rules += `<line x1="26" y1="${yBase}" x2="${width - 20}" y2="${yBase}" stroke="url(#rule-${index})" stroke-width="${(0.78 + random() * 0.12).toFixed(2)}"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        ${ruleGradients}
        <filter id="rule-soften" x="-2%" y="-8%" width="104%" height="116%"><feGaussianBlur stdDeviation="0.22"/></filter>
        <filter id="formation"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="2" seed="${(seedIn + 39) % 90}" result="n"/><feGaussianBlur in="n" stdDeviation="2.4" result="b"/><feColorMatrix in="b" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.34  0 0 0 0 0.31  0 0 0 0.55 0"/></filter>
      </defs>
      <rect width="${width}" height="${height}" fill="#ccc7ba"/>
      <rect width="${width}" height="${height}" filter="url(#formation)" opacity="0.02"/>
      <g filter="url(#rule-soften)">${rules}</g>
    </svg>`;
    return svgUrl(svg);
  }

  /* Claude's matte board generator, kept separate from the paper so the
     cover remains a physical layer rather than a dark page outline. */
  function makeCoverTexture(seedIn) {
    const random = seededRandom(seedIn * 97 + 13);
    const width = 420;
    const height = 580;
    let scuffs = "";
    for (let index = 0; index < 7; index += 1) {
      const x1 = random() * width;
      const y1 = random() * height;
      const angle = random() * Math.PI * 2;
      const length = 40 + random() * 140;
      scuffs += `<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${(x1 + Math.cos(angle) * length).toFixed(0)}" y2="${(y1 + Math.sin(angle) * length).toFixed(0)}" stroke="#cfc8ba" stroke-width="${(1 + random() * 1.6).toFixed(1)}" opacity="${(0.035 + random() * 0.06).toFixed(3)}" filter="url(#warp)" stroke-linecap="round"/>`;
    }

    let wear = "";
    for (const [x, y] of [[0, 0], [width, 0], [0, height], [width, height]]) {
      wear += `<circle cx="${x}" cy="${y}" r="${(46 + random() * 30).toFixed(0)}" fill="#d8d2c2" opacity="${(0.06 + random() * 0.09).toFixed(3)}" filter="url(#warp2)"/>`;
    }

    return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seedIn % 80}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.53  0 0 0 0 0.5  0 0 0 0.9 0"/><feComponentTransfer><feFuncA type="linear" slope="0.16"/></feComponentTransfer></filter>
        <filter id="sheen"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="${(seedIn + 11) % 80}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.58  0 0 0 0 0.53  0 0 0 0.5 0"/><feComponentTransfer><feFuncA type="linear" slope="0.14"/></feComponentTransfer></filter>
        <filter id="warp" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="${(seedIn + 5) % 80}" result="d"/><feDisplacementMap in="SourceGraphic" in2="d" scale="9"/><feGaussianBlur stdDeviation="0.4"/></filter>
        <filter id="warp2" x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${(seedIn + 19) % 80}" result="d"/><feDisplacementMap in="SourceGraphic" in2="d" scale="34"/><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="${width}" height="${height}" fill="#000" filter="url(#grain)"/>
      <rect width="${width}" height="${height}" fill="#000" filter="url(#sheen)"/>
      ${wear}${scuffs}
    </svg>`);
  }

  function makeEdgeTexture(vertical, seedIn) {
    const random = seededRandom(seedIn * 131 + 7);
    const width = vertical ? 90 : 720;
    const height = vertical ? 720 : 90;
    let lines = "";
    let position = 18;
    for (let index = 0; index < 18 && position < (vertical ? height : width) - 12; index += 1) {
      const grouped = index % (4 + Math.floor(random() * 3)) === 0;
      const step = 24 + random() * (grouped ? 22 : 16);
      const light = random() < 0.2;
      const opacity = light ? 0.008 + random() * 0.006 : (grouped ? 0.018 + random() * 0.009 : 0.01 + random() * 0.008);
      const jitter = (random() - 0.5) * 2;
      lines += vertical
        ? `<line x1="${(random() * 8).toFixed(1)}" y1="${position.toFixed(1)}" x2="${(width - random() * 10).toFixed(1)}" y2="${(position + jitter).toFixed(1)}" stroke="${light ? "#f4ecdc" : "#675d4a"}" stroke-width="${(0.7 + random() * 0.65).toFixed(1)}" opacity="${opacity.toFixed(3)}"/>`
        : `<line x1="${position.toFixed(1)}" y1="${(random() * 8).toFixed(1)}" x2="${(position + jitter).toFixed(1)}" y2="${(height - random() * 10).toFixed(1)}" stroke="${light ? "#f4ecdc" : "#675d4a"}" stroke-width="${(0.7 + random() * 0.65).toFixed(1)}" opacity="${opacity.toFixed(3)}"/>`;
      position += step;
    }

    return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="base" x1="0" y1="0" x2="${vertical ? 1 : 0}" y2="${vertical ? 0 : 1}"><stop offset="0" stop-color="#c3bdaf"/><stop offset="0.5" stop-color="#cec8bb"/><stop offset="1" stop-color="#c1baac"/></linearGradient>
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="${seedIn % 80}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.29  0 0 0 0 0.27  0 0 0 0.7 0"/><feComponentTransfer><feFuncA type="linear" slope="0.035"/></feComponentTransfer></filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#base)"/>
      <rect width="${width}" height="${height}" fill="#000" filter="url(#g)"/>
      ${vertical
        ? `<rect x="0" y="0" width="${width}" height="8" fill="#4a4438" opacity="0.05"/><rect x="0" y="${height - 8}" width="${width}" height="8" fill="#4a4438" opacity="0.05"/>`
        : `<rect x="0" y="0" width="8" height="${height}" fill="#4a4438" opacity="0.05"/><rect x="${width - 8}" y="0" width="8" height="${height}" fill="#4a4438" opacity="0.05"/>`}
      ${lines}
    </svg>`);
  }

  document.querySelectorAll(".paper-left .paper-texture").forEach((element) => {
    element.style.backgroundImage = makePaperTexture(31);
  });
  document.querySelectorAll(".paper-right .paper-texture").forEach((element) => {
    element.style.backgroundImage = makePaperTexture(47);
  });
  document.querySelectorAll(".cover-board").forEach((element, index) => {
    const existing = getComputedStyle(element).backgroundImage;
    element.style.backgroundImage = `${makeCoverTexture(index + 1)}, ${existing}`;
    element.style.backgroundSize = "100% 100%, auto";
    element.style.backgroundRepeat = "no-repeat, repeat";
  });
  document.querySelectorAll(".edge-fore").forEach((element, index) => {
    element.style.backgroundImage = makeEdgeTexture(true, 3 + index);
  });
  document.querySelectorAll(".edge-head, .edge-tail").forEach((element, index) => {
    element.style.backgroundImage = makeEdgeTexture(false, 7 + index);
  });

  const artworkToggle = document.getElementById("show-artwork");
  artworkToggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("show-artwork", artworkToggle.checked);
  });

  const stage = document.querySelector(".stage");
  const referenceMode = document.getElementById("reference-mode");
  const referenceOpacity = document.getElementById("reference-opacity");
  const referenceOpacityOutput = document.getElementById("reference-opacity-output");

  function syncReference() {
    stage.dataset.referenceMode = referenceMode.value;
    stage.style.setProperty("--reference-opacity", String(Number(referenceOpacity.value) / 100));
    referenceOpacityOutput.value = `${referenceOpacity.value}%`;

    if (referenceMode.value !== "current" && artworkToggle.checked) {
      artworkToggle.checked = false;
      document.documentElement.classList.remove("show-artwork");
    }
  }

  referenceMode.addEventListener("change", syncReference);
  referenceOpacity.addEventListener("input", syncReference);
  syncReference();
})();
