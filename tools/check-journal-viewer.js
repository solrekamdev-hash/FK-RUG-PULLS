"use strict";

const assert = require("node:assert/strict");
const logic = require("../journal/journal-viewer.js");

assert.deepEqual(logic.spreadPages(4, 0), { left: null, right: 0 });
assert.deepEqual(logic.spreadPages(4, 1), { left: 1, right: 2 });
assert.deepEqual(logic.spreadPages(4, 2), { left: 3, right: null });

const desktopImageStates = logic.desktopStates(4);
assert.deepEqual(desktopImageStates.map((state) => state.key), [
  "cover-front", "inside-front", "page-2", "inside-back", "cover-back"
]);
assert.deepEqual(desktopImageStates[1].surfaces.left, { type: "generated", role: "inside-front", panel: "primary" });
assert.deepEqual(desktopImageStates[1].surfaces.right, { type: "page", pageIndex: 0 });
assert.deepEqual(desktopImageStates[2].pageIndexes, [1, 2]);
assert.deepEqual(desktopImageStates[3].surfaces.left, { type: "page", pageIndex: 3 });
assert.deepEqual(desktopImageStates[3].surfaces.right, { type: "generated", role: "inside-back", panel: "primary" });

let stateIndex = 0;
for (const expectedState of [1, 2, 3, 4]) {
  stateIndex = logic.locationAfterStateTurn(desktopImageStates.length, stateIndex, 1).stateIndex;
  assert.equal(stateIndex, expectedState, "Desktop should advance from front cover through open spreads to back cover");
}
assert.deepEqual(logic.locationAfterStateTurn(desktopImageStates.length, stateIndex, 1), { type: "turnaround", direction: 1 });
for (const expectedState of [3, 2, 1, 0]) {
  stateIndex = logic.locationAfterStateTurn(desktopImageStates.length, stateIndex, -1).stateIndex;
  assert.equal(stateIndex, expectedState, "Desktop should reopen and reverse to the front cover");
}
assert.deepEqual(logic.locationAfterStateTurn(desktopImageStates.length, stateIndex, -1), { type: "turnaround", direction: -1 });

const desktopFallbackStates = logic.desktopStates(0);
assert.deepEqual(desktopFallbackStates.map((state) => state.key), [
  "cover-front", "inside-front", "content", "inside-back", "cover-back"
]);
assert.equal(desktopFallbackStates[2].kind, "markdown");

const mobileStates = logic.mobileStates(4);
assert.deepEqual(mobileStates.map((state) => state.key), [
  "cover-front", "inside-front", "page-1", "page-2", "page-3", "page-4", "inside-back", "cover-back"
]);
assert.deepEqual(mobileStates.slice(2, 6).map((state) => state.pageIndexes[0]), [0, 1, 2, 3]);
assert.equal(mobileStates.filter((state) => state.kind === "surface" && state.surface?.type === "page").length, 4);

assert.equal(logic.stateIndexFromHash(desktopImageStates, "", 4), 0);
assert.equal(logic.stateIndexFromHash(desktopImageStates, "#page-1", 4), 1, "Legacy page 1 deep link should open the first spread");
assert.equal(logic.stateIndexFromHash(desktopImageStates, "#page-4", 4), 3, "Page 4 deep link should open the final spread");
assert.equal(logic.stateIndexFromHash(desktopImageStates, "#back-cover", 4), 4);
assert.equal(logic.stateIndexFromHash(desktopFallbackStates, "#content", 0), 2);
assert.equal(logic.stateHash(desktopImageStates[0]), "");
assert.equal(logic.stateHash(desktopImageStates[1]), "#inside-front");
assert.equal(logic.stateHash(desktopImageStates[3]), "#inside-back");
assert.equal(logic.stateHash(desktopImageStates[4]), "#back-cover");

assert.equal(logic.transitionMode(true, false), "immediate", "Reduced motion must bypass desktop 3D transitions");
assert.equal(logic.transitionMode(true, true), "immediate", "Reduced motion must bypass mobile transitions");
assert.equal(logic.transitionMode(false, false), "desktop");
assert.equal(logic.transitionMode(false, true), "mobile");

const desktopFront = logic.bookGeometry(0, false, 340, 15);
const desktopOpen = logic.bookGeometry(1, false, 340, 15);
const desktopBack = logic.bookGeometry(2, false, 340, 15);
assert.equal(desktopFront.leftAngle, 180, "Front cover must fold around the left leaf's spine edge");
assert.equal(desktopFront.offsetX, -170, "Closed front geometry must recenter one cover width without scaling");
assert.equal(desktopOpen.leftAngle, 0);
assert.equal(Math.abs(desktopOpen.rightAngle), 0);
assert.equal(desktopOpen.offsetX, 0);
assert.equal(desktopBack.rightAngle, -180, "Back cover must fold around the right leaf's spine edge");
assert.equal(desktopBack.offsetX, 170, "Closed back geometry must recenter one cover width without scaling");
assert.equal(desktopFront.leftRise, 15, "Folded cover must retain the page-block thickness");
assert.equal(desktopBack.rightRise, 15, "Folded back cover must retain the page-block thickness");
assert.ok(logic.bookGeometry(.5, false, 340, 15).lift > 0, "Opening must lift between resting states");
assert.ok(logic.bookGeometry(1.5, false, 340, 15).shadowOpacity < desktopOpen.shadowOpacity, "Lift must soften the physical shadow");

const mobileFront = logic.bookGeometry(0, true, 340, 15);
const mobileBack = logic.bookGeometry(2, true, 340, 15);
assert.equal(mobileFront.leftAngle, -180, "Mobile front cover must hinge away from its left edge");
assert.equal(mobileBack.rightAngle, 180, "Mobile back cover must hinge over from its right edge");
assert.ok(Math.abs(logic.physicalEase(0)) < .0001);
assert.ok(Math.abs(logic.physicalEase(1) - 1) < .0001);
assert.equal(mobileFront.offsetX, 340, "The mobile front hinge must translate one page back into the readable stage");
assert.equal(mobileBack.offsetX, -340, "The mobile back hinge must mirror the front-cover centring translation");

const curlStart = logic.curlAngles(0, 18);
const curlMiddle = logic.curlAngles(.5, 18);
const curlEnd = logic.curlAngles(1, 18);
assert.ok(curlStart.every((angle) => Math.abs(angle) < .0001), "Curl must be flat on the right at rest");
assert.ok(curlEnd.every((angle) => Math.abs(angle - 180) < .0001), "Curl must settle flat on the left");
assert.ok(curlMiddle[18] > curlMiddle[0] + 35, "The free edge must lead the binding through the curl");
assert.ok(Math.abs(logic.curlEase(0)) < .0001);
assert.ok(Math.abs(logic.curlEase(1) - 1) < .0001);

console.log("Journal viewer logic checks passed: continuous spine geometry, centred closed covers, approved designed edge pages, segmented curl invariants, turnaround loops, Markdown flow, reduced motion, and sequential mobile paging.");
