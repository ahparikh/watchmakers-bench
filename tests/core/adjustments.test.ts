import { describe, it, expect } from "vitest";
import { adjustmentShapes, COCK_ANGLE_DEG, type AdjustmentInput } from "../../src/core/escapement/adjustments";
import { fixedPoints } from "../../src/core/escapement/shapes";
import { VINTAGE_18000 } from "../../src/catalog/vintage18000";
import { len, sub } from "../../src/core/escapement/geom2d";

const esc = VINTAGE_18000.escapement;
const B = fixedPoints(esc).balanceCentre;
const base: AdjustmentInput = { balanceAngle: 0, regulatorIndex: 0, beatOffsetDeg: 0, inertiaTrim: 0, position: "DU", poiseCorrection: 0, poiseCorrectionDeg: 0, heavySpotDeg: 0, unbalance: 0, revealHeavySpot: false };
const angleOf = (q: { x: number; y: number }) => (Math.atan2(q.y - B.y, q.x - B.x) * 180) / Math.PI;
const norm = (d: number) => ((d % 360) + 540) % 360 - 180;

describe("hairspring", () => {
  it("inner end turns with the balance, outer end stays on the stud", () => {
    const a = adjustmentShapes(esc, base), b = adjustmentShapes(esc, { ...base, balanceAngle: 90 });
    expect(norm(angleOf(b.hairspring[0]) - angleOf(a.hairspring[0]))).toBeCloseTo(-90, 6);
    expect(len(sub(a.hairspring[a.hairspring.length - 1], b.hairspring[b.hairspring.length - 1]))).toBeLessThan(1e-9);
    expect(len(sub(a.hairspring[a.hairspring.length - 1], a.stud))).toBeLessThan(1e-9);
  });
  it("coils stay inside the balance rim", () => {
    for (const pt of adjustmentShapes(esc, { ...base, balanceAngle: 270 }).hairspring) expect(len(sub(pt, B))).toBeLessThan(esc.balanceRadius);
  });
});

describe("beat adjustment moves the stud, not the regulator", () => {
  it("rotates the stud by the beat offset", () => {
    const a = adjustmentShapes(esc, base), b = adjustmentShapes(esc, { ...base, beatOffsetDeg: 6 });
    expect(norm(angleOf(b.stud) - angleOf(a.stud))).toBeCloseTo(6, 6);
    expect(b.regulator.indexDeg).toBe(a.regulator.indexDeg);
  });
});

describe("regulator", () => {
  it("toward Fast moves the pins toward the stud, 1:1 with the index angle", () => {
    const a = adjustmentShapes(esc, base), f = adjustmentShapes(esc, { ...base, regulatorIndex: 1.2 });
    const gap = (s: typeof a) => Math.abs(norm(angleOf(s.regulator.pins[0]) - angleOf(s.stud)));
    expect(gap(a) - gap(f)).toBeCloseTo(1.2, 3);
    expect(f.regulator.indexDeg).toBeCloseTo(COCK_ANGLE_DEG + 24 - 1.2, 9);
  });
});

describe("timing screws and poise", () => {
  it("screws stand proud for positive trim and turn with the balance", () => {
    const s = adjustmentShapes(esc, { ...base, inertiaTrim: 0.004, balanceAngle: 30 });
    expect(s.screws[0].proud).toBeCloseTo(4, 9);
    expect(norm(s.screws[0].angleDeg)).toBeCloseTo(-30, 9);
  });
  it("heavy spot hidden until revealed; poise cut appears with the correction", () => {
    const hidden = adjustmentShapes(esc, { ...base, unbalance: 10e-11, heavySpotDeg: 40 });
    const shown = adjustmentShapes(esc, { ...base, unbalance: 10e-11, heavySpotDeg: 40, revealHeavySpot: true, poiseCorrection: 10e-11, poiseCorrectionDeg: 40 });
    expect(hidden.heavySpot).toBeNull();
    expect(hidden.poiseCut).toBeNull();
    expect(shown.heavySpot?.angleDeg).toBe(40);
    expect(shown.poiseCut?.depth).toBeCloseTo(4, 9);
  });
});

describe("position view", () => {
  it("crown down rotates the movement so the crown points down the page; dial positions do not rotate", () => {
    expect(adjustmentShapes(esc, { ...base, position: "CD" }).view).toEqual({ rotationDeg: -90, gravity: "down" });
    expect(adjustmentShapes(esc, { ...base, position: "DU" }).view).toEqual({ rotationDeg: 0, gravity: "into-page" });
    expect(adjustmentShapes(esc, { ...base, position: "DD" }).view.gravity).toBe("out-of-page");
  });
});
