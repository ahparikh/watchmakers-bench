import { describe, it, expect } from "vitest";
import { readWatch, ZERO_SETTINGS } from "../../src/core/watch";
import { VINTAGE_18000 } from "../../src/catalog/vintage18000";
import { TIRED_MAINSPRING, torqueFraction, HEALTHY_MAINSPRING } from "../../src/core/oscillator/amplitude";

const w = VINTAGE_18000.watch;

describe("a healthy, regulated watch", () => {
  it("reads ~0 s/day, 280° and runs at full wind dial up", () => {
    const r = readWatch(w, ZERO_SETTINGS);
    expect(r.running).toBe(true);
    expect(r.amplitudeDeg).toBeCloseTo(280, 6);
    expect(Math.abs(r.rateSecondsPerDay)).toBeLessThan(0.01);
    expect(r.period).toBeCloseTo(0.4, 6);
  });

  it("follows the research amplitude curve: ~250° at 24 h, stops by 42 h", () => {
    expect(readWatch(w, { ...ZERO_SETTINGS, hoursSinceWind: 24 }).amplitudeDeg).toBeCloseTo(250, -1);
    expect(readWatch(w, { ...ZERO_SETTINGS, hoursSinceWind: 42 }).running).toBe(false);
    expect(torqueFraction(HEALTHY_MAINSPRING, 24)).toBeCloseTo(0.85, 9);
  });

  it("gains a little as it runs down (flat-spring default), within a few s/day at 24 h", () => {
    const r24 = readWatch(w, { ...ZERO_SETTINGS, hoursSinceWind: 24 });
    expect(r24.rateSecondsPerDay).toBeGreaterThan(0);
    expect(r24.rateSecondsPerDay).toBeLessThan(5);
    expect(r24.rateTerms.escapement).toBeLessThan(0); // the escapement alone would make it lose
  });
});

describe("puzzle 1: runs fast", () => {
  it("+1.2° of regulator index reads about +40 s/day", () => {
    const r = readWatch(w, { ...ZERO_SETTINGS, regulatorIndex: 1.2 });
    expect(r.rateSecondsPerDay).toBeCloseTo(40, -1);
  });
});

describe("puzzle 3: afternoon slump", () => {
  it("a tired mainspring drops to ~200° by 24 h and gains several s/day more than at full wind", () => {
    const tired = { ...w, mainspring: TIRED_MAINSPRING };
    const r0 = readWatch(tired, ZERO_SETTINGS), r24 = readWatch(tired, { ...ZERO_SETTINGS, hoursSinceWind: 24 });
    expect(r24.amplitudeDeg).toBeCloseTo(200, -1);
    expect(r24.rateSecondsPerDay - r0.rateSecondsPerDay).toBeGreaterThan(2);
  });
});

describe("puzzle 4: position error", () => {
  it("poise error shows in vertical positions only, with opposite sign crown up vs crown down", () => {
    const s = { ...ZERO_SETTINGS, unbalance: 10e-11, heavySpotDeg: 0 };
    const du = readWatch(w, { ...s, position: "DU" as const });
    const cu = readWatch(w, { ...s, position: "CU" as const });
    const cd = readWatch(w, { ...s, position: "CD" as const });
    expect(du.rateTerms.poise).toBeCloseTo(0, 12);
    expect(cu.rateTerms.poise * cd.rateTerms.poise).toBeLessThan(0);
    expect(cu.amplitudeDeg).toBeCloseTo(250, 6); // 30° vertical drop
  });
});

describe("knocking", () => {
  it("clips amplitude at 330° and adds a large gain", () => {
    const hot = { ...w, fullWindAmplitudeDeg: 350 };
    const r = readWatch(hot, ZERO_SETTINGS);
    expect(r.knocking).toBe(true);
    expect(r.amplitudeDeg).toBe(330);
    expect(r.rateSecondsPerDay).toBeGreaterThan(50);
  });
});

describe("poising correction (puzzle 4 fix)", () => {
  it("removing the right amount of weight at the heavy spot cancels the unbalance", () => {
    const s = { ...ZERO_SETTINGS, unbalance: 10e-11, heavySpotDeg: 0, poiseCorrection: 10e-11, poiseCorrectionDeg: 0, position: "CU" as const };
    const r = readWatch(w, s);
    expect(r.netUnbalance).toBeLessThan(1e-18);
    expect(Math.abs(r.rateTerms.poise)).toBeLessThan(1e-9);
  });
  it("removing weight on the wrong side doubles the error, 90° off leaves it at √2", () => {
    const base = { ...ZERO_SETTINGS, unbalance: 10e-11, heavySpotDeg: 0, poiseCorrection: 10e-11, position: "CU" as const };
    expect(readWatch(w, { ...base, poiseCorrectionDeg: 180 }).netUnbalance).toBeCloseTo(20e-11, 20);
    expect(readWatch(w, { ...base, poiseCorrectionDeg: 90 }).netUnbalance).toBeCloseTo(Math.SQRT2 * 10e-11, 20);
  });
});
