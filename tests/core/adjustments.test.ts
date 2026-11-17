import { describe, it, expect } from "vitest";
import { adjustmentShapes, COCK_ANGLE_DEG, REGULATOR_REST_GAP_DEG, type AdjustmentInput } from "../../src/core/escapement/adjustments";
import { POSITIONS } from "../../src/core/watch";
import { fixedPoints } from "../../src/core/escapement/shapes";
import { VINTAGE_18000 } from "../../src/catalog/vintage18000";
import { len, sub, distToSegment } from "../../src/core/escapement/geom2d";

const esc = VINTAGE_18000.escapement;
const B = fixedPoints(esc).balanceCentre;
const base: AdjustmentInput = { balanceAngle: 0, regulatorIndex: 0, beatOffsetDeg: 0, inertiaTrim: 0, position: "DU", poiseCorrection: 0, poiseCorrectionDeg: 0, heavySpotDeg: 0, unbalance: 0, revealHeavySpot: false, amplitudeDeg: 280 };
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
  // docs/research/01 (b): "Moving the curb pins away from the stud shortens the active length (fast)."
  it("toward Fast moves the pins away from the stud, 1:1 with the index angle", () => {
    const a = adjustmentShapes(esc, base), f = adjustmentShapes(esc, { ...base, regulatorIndex: 1.2 });
    const gap = (s: typeof a) => Math.abs(norm(angleOf(s.regulator.pins[0]) - angleOf(s.stud)));
    expect(gap(f) - gap(a)).toBeCloseTo(1.2, 3);
    expect(f.regulator.indexDeg).toBeCloseTo(COCK_ANGLE_DEG - REGULATOR_REST_GAP_DEG - 1.2, 9);
  });
  it("toward Fast shortens the spring between the pins and the collet", () => {
    // Length of the drawn spiral from its inner end to the point nearest the pins.
    const working = (regulatorIndex: number) => {
      const s = adjustmentShapes(esc, { ...base, regulatorIndex });
      const mid = { x: (s.regulator.pins[0].x + s.regulator.pins[1].x) / 2, y: (s.regulator.pins[0].y + s.regulator.pins[1].y) / 2 };
      let seg = 1;
      for (let i = 1; i < s.hairspring.length; i++) if (distToSegment(mid, s.hairspring[i - 1], s.hairspring[i]) < distToSegment(mid, s.hairspring[seg - 1], s.hairspring[seg])) seg = i;
      let length = 0;
      for (let i = 1; i < seg; i++) length += len(sub(s.hairspring[i], s.hairspring[i - 1]));
      const a = s.hairspring[seg - 1], b = s.hairspring[seg], ab = sub(b, a), am = sub(mid, a);
      return length + Math.max(0, Math.min(1, (am.x * ab.x + am.y * ab.y) / (ab.x * ab.x + ab.y * ab.y))) * len(ab);
    };
    expect(working(3)).toBeLessThan(working(0));
    expect(working(-3)).toBeGreaterThan(working(0));
  });
  it("the pins straddle the outer coil wherever the balance, the index and the stud are", () => {
    for (const balanceAngle of [-280, -90, 0, 130, 280]) for (const regulatorIndex of [-3, 0, 3]) for (const beatOffsetDeg of [-10, 0, 10]) {
      const s = adjustmentShapes(esc, { ...base, balanceAngle, regulatorIndex, beatOffsetDeg });
      const [p0, p1] = s.regulator.pins;
      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      let d = Infinity;
      for (let i = 1; i < s.hairspring.length; i++) d = Math.min(d, distToSegment(mid, s.hairspring[i - 1], s.hairspring[i]));
      expect(d).toBeLessThan(0.5);                       // the spring passes between the pins
      expect(len(sub(p0, p1)) / 2).toBeGreaterThan(d);    // and inside their gap
      expect(len(sub(mid, s.stud))).toBeGreaterThan(5);   // short of the stud, never on it
    }
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
  it("draws the rim angle the model calls down pointing down the page, in every vertical position", () => {
    // The physics (POSITIONS[].down) and the drawing (view.rotationDeg) must agree on where a heavy spot is.
    for (const pos of POSITIONS.filter((q) => q.tilt > 0)) {
      const turned = pos.down + adjustmentShapes(esc, { ...base, position: pos.id }).view.rotationDeg;
      expect(norm(turned - -90)).toBeCloseTo(0, 9);
    }
  });
  it("a heavy spot at the model's bottom is drawn below the balance centre", () => {
    const s = adjustmentShapes(esc, { ...base, position: "CD", unbalance: 10e-11, heavySpotDeg: 180, revealHeavySpot: true });
    const r = (s.view.rotationDeg * Math.PI) / 180, dx = s.heavySpot!.at.x - B.x, dy = s.heavySpot!.at.y - B.y;
    expect(dx * Math.sin(r) + dy * Math.cos(r)).toBeCloseTo(-esc.balanceRadius, 6); // y-up: negative is down the page
  });
  it("crown down rotates the movement so the crown points down the page; dial positions do not rotate", () => {
    expect(adjustmentShapes(esc, { ...base, position: "CD" }).view).toEqual({ rotationDeg: 90, gravity: "down" });
    expect(adjustmentShapes(esc, { ...base, position: "DU" }).view).toEqual({ rotationDeg: 0, gravity: "into-page" });
    expect(adjustmentShapes(esc, { ...base, position: "DD" }).view.gravity).toBe("out-of-page");
  });
});

describe("swing arc", () => {
  it("spans ±amplitude about the notch centre on the pin orbit", () => {
    const s = adjustmentShapes(esc, { ...base, amplitudeDeg: 250 });
    expect(s.swingArc.toDeg - s.swingArc.fromDeg).toBe(500);
    expect((s.swingArc.fromDeg + s.swingArc.toDeg) / 2).toBe(-90);
  });
});
