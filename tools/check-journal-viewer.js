"use strict";

const assert = require("node:assert/strict");
const logic = require("../journal/journal-viewer.js");

assert.deepEqual(logic.spreadPages(4, 0), { left: null, right: 0 });
assert.deepEqual(logic.spreadPages(4, 1), { left: 1, right: 2 });
assert.deepEqual(logic.spreadPages(4, 2), { left: 3, right: null });
assert.deepEqual(logic.spreadPages(5, 2), { left: 3, right: 4 });

let desktopPage = 0;
desktopPage = logic.locationAfterTurn(4, desktopPage, 1, false).pageIndex;
assert.equal(desktopPage, 1, "Desktop forward turn should open pages 2–3");
desktopPage = logic.locationAfterTurn(4, desktopPage, 1, false).pageIndex;
assert.equal(desktopPage, 3, "Desktop second forward turn should open page 4 plus blank");
assert.deepEqual(logic.locationAfterTurn(4, desktopPage, 1, false), { type: "entry", direction: 1 });

assert.equal(logic.arrivalPage(4, -1), 3, "Reverse entry traversal should arrive on the final page/spread");
desktopPage = logic.locationAfterTurn(4, 3, -1, false).pageIndex;
assert.equal(desktopPage, 1);
desktopPage = logic.locationAfterTurn(4, desktopPage, -1, false).pageIndex;
assert.equal(desktopPage, 0);
assert.deepEqual(logic.locationAfterTurn(4, desktopPage, -1, false), { type: "entry", direction: -1 });

let mobilePage = 0;
for (const expectedPage of [1, 2, 3]) {
  mobilePage = logic.locationAfterTurn(4, mobilePage, 1, true).pageIndex;
  assert.equal(mobilePage, expectedPage, "Mobile pages should advance one at a time");
}
assert.deepEqual(logic.locationAfterTurn(4, mobilePage, 1, true), { type: "entry", direction: 1 });
for (const expectedPage of [2, 1, 0]) {
  mobilePage = logic.locationAfterTurn(4, mobilePage, -1, true).pageIndex;
  assert.equal(mobilePage, expectedPage, "Mobile pages should reverse one at a time");
}

assert.equal(logic.transitionMode(true, false), "immediate", "Reduced motion must bypass the desktop 3D turn");
assert.equal(logic.transitionMode(true, true), "immediate", "Reduced motion must bypass the mobile page animation");
assert.equal(logic.transitionMode(false, false), "desktop");
assert.equal(logic.transitionMode(false, true), "mobile");

console.log("Journal viewer logic checks passed: desktop spreads, forward/reverse boundaries, reduced motion, and sequential mobile paging.");
