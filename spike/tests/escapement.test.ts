import { describe, it, expect } from "vitest";
import { DEFAULT_PARAMS, derived } from "../src/params";
import { escapementState, period, CONTACT_TOL, type Phase } from "../src/sim";
import { shapes, stonePenetration } from "../src/shapes";

const p = DEFAULT_PARAMS;
const T = period(p);
const beat = T / 2;
const d = derived(p);
const SAMPLES = 400;

const sample = (from: number, to: number, n = SAMPLES) =>
  Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

describe("escape wheel", () => {
  // Entry and exit impulses are not mirror images (circular pallets lift the two let-off
  // corners at different rates), so the half-tooth invariant holds lock-to-lock, not at
  // arbitrary instants mid-impulse.
  it("advances exactly half a tooth per beat, measured from any locked instant", () => {
    let checked = 0;
    for (const t of sample(0, T, 200)) {
      const a = escapementState(p, t);
      if (a.phase !== "lock") continue;
      const b = escapementState(p, t + beat);
      expect(b.phase).toBe("lock");
      expect(b.wheelAngle - a.wheelAngle).toBeCloseTo(d.pitch / 2, 3);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("advances exactly one tooth per full period", () => {
    const a = escapementState(p, 0.123).wheelAngle;
    const b = escapementState(p, 0.123 + T).wheelAngle;
    expect(b - a).toBeCloseTo(d.pitch, 6);
  });

  it("never runs backward beyond numerical noise (zero-draw faces, so no recoil)", () => {
    let prev = -Infinity;
    for (const t of sample(0, 2 * T, 2000)) {
      const w = escapementState(p, t).wheelAngle;
      expect(w).toBeGreaterThanOrEqual(prev - 1e-3);
      prev = w;
    }
  });

  it("is stationary while locked with the pin out of the notch (run-to-banking excluded)", () => {
    const states = sample(0, T, 4000).map((t) => escapementState(p, t));
    const parked = (s: (typeof states)[0]) => s.phase === "lock" && Math.abs(s.balanceAngle) > p.liftAngle / 2;
    let checked = 0;
    for (let i = 1; i < states.length; i++) {
      if (parked(states[i]) && parked(states[i - 1])) {
        checked++;
        expect(states[i].wheelAngle - states[i - 1].wheelAngle).toBeLessThan(1e-9);
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it("is never shoved by lever motion by more than a thousandth of a degree", () => {
    expect(escapementState(p, T).maxNudge).toBeLessThan(1e-3);
  });
});

describe("balance", () => {
  it("swings to full amplitude both ways", () => {
    const angles = sample(0, T, 4000).map((t) => escapementState(p, t).balanceAngle);
    expect(Math.max(...angles)).toBeCloseTo(p.balanceAmplitude, 1);
    expect(Math.min(...angles)).toBeCloseTo(-p.balanceAmplitude, 1);
  });
});

describe("fork", () => {
  it("stays between its bankings and rests on one whenever the pin is out of the notch", () => {
    for (const t of sample(0, T, 2000)) {
      const s = escapementState(p, t);
      expect(Math.abs(s.forkAngle)).toBeLessThanOrEqual(d.forkHalf + 1e-9);
      if (Math.abs(s.balanceAngle) > p.liftAngle / 2 + 1e-6) {
        expect(Math.abs(s.forkAngle)).toBeCloseTo(d.forkHalf, 9);
      }
    }
  });
});

describe("phases", () => {
  const seq = (from: number, to: number): Phase[] => {
    const out: Phase[] = [];
    for (const t of sample(from, to, 4000)) {
      const ph = escapementState(p, t).phase;
      if (out[out.length - 1] !== ph) out.push(ph);
    }
    return out;
  };

  it("run lock → unlock → impulse → drop → lock once per beat, on both pallets", () => {
    // Balance at +amplitude at t = T/4: the fork is locked and the pin is far from the notch.
    const start = T / 4;
    expect(seq(start, start + beat)).toEqual(["lock", "unlock", "impulse", "drop", "lock"]);
    expect(seq(start + beat, start + 2 * beat)).toEqual(["lock", "unlock", "impulse", "drop", "lock"]);
  });

  it("alternate pallets beat by beat", () => {
    const stoneAt = (t: number) => {
      for (const tt of sample(t, t + beat, 400)) {
        const s = escapementState(p, tt);
        if (s.phase === "impulse") return s.contact?.stone;
      }
    };
    const a = stoneAt(T / 4), b = stoneAt(T / 4 + beat);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a).not.toEqual(b);
  });
});

describe("geometry", () => {
  it("never lets a tooth overlap a pallet stone", () => {
    for (const t of sample(0, T, 2000)) {
      const s = escapementState(p, t);
      expect(s.violations).toBe(0);
      const g = shapes(p, s);
      for (const tooth of g.teeth) {
        for (const stone of [g.entryStone, g.exitStone]) {
          expect(stonePenetration(tooth, stone)).toBeLessThanOrEqual(CONTACT_TOL * 1.01);
        }
      }
    }
  });
});
