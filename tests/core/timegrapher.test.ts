import { describe, it, expect } from "vitest";
import { tickTimes, beatIntervals } from "../../src/core/oscillator/ticks";
import { analyze } from "../../src/core/timegrapher/analyze";

const T = 0.4; // 18,000 bph

describe("ticks", () => {
  it("are evenly spaced when in beat and sum to the period", () => {
    const [d1, d2] = beatIntervals({ period: T, amplitude: 270, beatOffset: 0, liftAngle: 52 });
    expect(d1).toBeCloseTo(T / 2, 12);
    expect(d1 + d2).toBeCloseTo(T, 12);
  });
  it("become uneven with a beat offset, more so at lower amplitude", () => {
    const err = (A: number) => { const [d1, d2] = beatIntervals({ period: T, amplitude: A, beatOffset: 5, liftAngle: 52 }); return Math.abs(d2 - d1) / 2; };
    expect(err(270)).toBeGreaterThan(0);
    expect(err(180)).toBeGreaterThan(err(270));
  });
});

describe("timegrapher reading (docs/research/02-beat-rates-and-timegrapher.md)", () => {
  const read = (period: number, amplitude: number, beatOffset: number, lift = 52) =>
    analyze(tickTimes({ period, amplitude, beatOffset, liftAngle: lift }, 0, 300), T, lift)!;

  it("reads zero rate, zero beat error and the true amplitude for a perfect watch", () => {
    const r = read(T, 270, 0);
    expect(r.rateSecondsPerDay).toBeCloseTo(0, 6);
    expect(r.beatErrorMs).toBeCloseTo(0, 9);
    expect(r.amplitudeDeg).toBeCloseTo(270, 6);
  });

  it("reads +40 s/day when the period is short by the matching fraction", () => {
    const r = read(T / (1 + 40 / 86400), 270, 0);
    expect(r.rateSecondsPerDay).toBeCloseTo(40, 6);
  });

  it("reports beat error in ms matching the interval asymmetry", () => {
    const [d1, d2] = beatIntervals({ period: T, amplitude: 270, beatOffset: 4, liftAngle: 52 });
    const r = read(T, 270, 4);
    expect(r.beatErrorMs).toBeCloseTo((Math.abs(d2 - d1) / 2) * 1000, 9);
    expect(r.beatErrorMs).toBeGreaterThan(0.5); // clearly "out of beat" by the healthy threshold
  });

  it("amplitude round-trips through the lift-angle formula at any amplitude", () => {
    for (const A of [150, 200, 250, 300]) expect(read(T, A, 0).amplitudeDeg).toBeCloseTo(A, 6);
  });

  it("misreads amplitude if the wrong lift angle is assumed (52° set, 50° true)", () => {
    const ticks = tickTimes({ period: T, amplitude: 250, beatOffset: 0, liftAngle: 50 }, 0, 100);
    const r = analyze(ticks, T, 52)!;
    expect(r.amplitudeDeg).toBeGreaterThan(255); // reads high, as calibercorner's worked example shows
  });

  it("draws a trace whose slope is the rate and whose two lines are separated by the beat error", () => {
    const r = read(T / (1 + 40 / 86400), 270, 4);
    const even = r.trace.filter((p) => p.parity === 0), odd = r.trace.filter((p) => p.parity === 1);
    const slope = (even[even.length - 1].offsetMs - even[0].offsetMs) / (even[even.length - 1].beat - even[0].beat); // ms per beat
    expect(slope).toBeLessThan(0); // ticks arrive early when fast
    expect(Math.abs(slope) * (86400 / (T / 2)) / 1000).toBeCloseTo(40, 0); // ms/beat → s/day
    const sep = Math.abs(odd[10].offsetMs - (even[10].offsetMs + even[11].offsetMs) / 2);
    expect(sep).toBeCloseTo(r.beatErrorMs, 6);
  });
});
