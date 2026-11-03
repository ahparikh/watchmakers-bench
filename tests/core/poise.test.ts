import { describe, it, expect } from "vitest";
import { besselJ1 } from "../../src/core/oscillator/bessel";
import { poiseRateSecondsPerDay, POISE_CROSSOVER_DEG } from "../../src/core/oscillator/poise";

const rad = (d: number) => (d * Math.PI) / 180;

describe("besselJ1", () => {
  it("matches tabulated values", () => {
    expect(besselJ1(0)).toBe(0);
    expect(besselJ1(1)).toBeCloseTo(0.4400505857, 9);
    expect(besselJ1(Math.PI)).toBeCloseTo(0.2846, 3);
    expect(besselJ1(3.8317059702)).toBeCloseTo(0, 9); // first zero
  });
});

describe("poise error (docs/research/04-positional-error.md)", () => {
  // u = 10 µg·cm, I = 12 mg·cm², 4 Hz, heavy spot at the bottom, vertical position.
  const base = { unbalance: 10e-11, heavySpotAngle: 0, tilt: Math.PI / 2, inertia: 12e-10, omega0: 2 * Math.PI * 4 };

  it("gains about +10 s/d at 180° and loses about −7 s/d at 290°", () => {
    expect(poiseRateSecondsPerDay({ ...base, amplitude: rad(180) })).toBeCloseTo(10, 0);
    expect(poiseRateSecondsPerDay({ ...base, amplitude: rad(290) })).toBeCloseTo(-7, 0);
  });

  it("crosses zero at the 220° rule", () => {
    expect(poiseRateSecondsPerDay({ ...base, amplitude: rad(POISE_CROSSOVER_DEG) })).toBeCloseTo(0, 2);
    expect(poiseRateSecondsPerDay({ ...base, amplitude: rad(POISE_CROSSOVER_DEG - 5) })).toBeGreaterThan(0);
    expect(poiseRateSecondsPerDay({ ...base, amplitude: rad(POISE_CROSSOVER_DEG + 5) })).toBeLessThan(0);
  });

  it("vanishes in horizontal positions and reverses with the heavy spot at the top", () => {
    expect(poiseRateSecondsPerDay({ ...base, tilt: 0, amplitude: rad(180) })).toBe(0);
    expect(poiseRateSecondsPerDay({ ...base, heavySpotAngle: Math.PI, amplitude: rad(180) })).toBeCloseTo(-10, 0);
  });

  it("averages to zero over four vertical positions 90° apart (patent's cancellation claim)", () => {
    const sum = [0, 90, 180, 270].reduce((acc, a) => acc + poiseRateSecondsPerDay({ ...base, heavySpotAngle: rad(a), amplitude: rad(250) }), 0);
    expect(sum).toBeCloseTo(0, 9);
  });
});
