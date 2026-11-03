import { describe, it, expect } from "vitest";
import { balanceForBeatRate, period, nominalPeriod, rateSecondsPerDay, activeLength } from "../../src/core/oscillator/period";

// Modern calibre numbers from the research file: 4 Hz, I = 1.2e-9 kg·m², L = 100 mm, r_outer = 4.5 mm.
const modern = balanceForBeatRate(28800, 1.2e-9, 0.1, 0.0045);
const nominal = nominalPeriod(28800);
const zero = { regulatorIndex: 0, inertiaTrim: 0 };

describe("period (docs/research/01-balance-period-and-regulator.md)", () => {
  it("derives k so that the natural period matches the beat rate", () => {
    expect(nominal).toBe(0.25);
    expect(period(modern, zero)).toBeCloseTo(0.25, 12);
    expect(modern.stiffness).toBeCloseTo(7.6e-7, 8); // research file's derived k
  });

  it("reproduces Horopedia's anchor: shortening 0.02 mm of 100 mm gains ~8.6 s/day", () => {
    const shortened = { ...modern, activeLength: 0.1 - 0.00002, stiffness: modern.stiffness * 0.1 / (0.1 - 0.00002) };
    expect(rateSecondsPerDay(period(shortened, zero), nominal)).toBeCloseTo(8.6, 0);
  });

  it("first-order rule: 1 s/day ≈ 2.3e-5 fractional change in I", () => {
    expect(rateSecondsPerDay(period(modern, { ...zero, inertiaTrim: 2.3e-5 }), nominal)).toBeCloseTo(-1, 1);
  });

  it("regulator toward Fast shortens the spring and gains ~34 s/day per degree", () => {
    expect(activeLength(modern, 1)).toBeLessThan(modern.activeLength);
    expect(rateSecondsPerDay(period(modern, { ...zero, regulatorIndex: 1 }), nominal)).toBeCloseTo(34, 0);
  });

  it("the brief's 'gains about 40 s/day' puzzle is about 1.2° of index", () => {
    expect(rateSecondsPerDay(period(modern, { ...zero, regulatorIndex: 1.2 }), nominal)).toBeCloseTo(40, -1);
  });

  it("more inertia (timing screws out) runs slow", () => {
    expect(rateSecondsPerDay(period(modern, { ...zero, inertiaTrim: 0.0035 }), nominal)).toBeCloseTo(-150, -1);
  });
});
