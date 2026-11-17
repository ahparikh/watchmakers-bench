import { describe, it, expect } from "vitest";
import { PUZZLES } from "../../src/puzzles";
import { advanceProgress, NO_PROGRESS, type Progress } from "../../src/puzzles/progress";
import { readWatch, ZERO_SETTINGS, type Position, type WatchSettings } from "../../src/core/watch";
import { VINTAGE_18000 } from "../../src/catalog/vintage18000";
import { advanceTicks, emptyWindow } from "../../src/app/ticker";
import { analyze } from "../../src/core/timegrapher/analyze";

const puzzle = (id: string) => PUZZLES.find((p) => p.id === id)!;
const T = 0.4;

/** Hold the watch at `user` settings (puzzle faults added, as the app does) for `seconds` of sim time. */
function hold(id: string, user: Partial<WatchSettings>, seconds: number, from: Progress = NO_PROGRESS): Progress {
  const p = puzzle(id), f = p.faults;
  const s: WatchSettings = { ...ZERO_SETTINGS, ...user,
    regulatorIndex: (user.regulatorIndex ?? 0) + (f.regulatorIndex ?? 0), beatOffsetDeg: (user.beatOffsetDeg ?? 0) + (f.beatOffsetDeg ?? 0),
    unbalance: f.unbalance ?? 0, heavySpotDeg: f.heavySpotDeg ?? 0 };
  const r = readWatch(p.specOverride ? p.specOverride(VINTAGE_18000.watch) : VINTAGE_18000.watch, s);
  const tg = analyze(advanceTicks(emptyWindow(), r, 60, 300).ticks, T, 52);
  let prog = from;
  for (let t = 0; t < seconds; t += 0.5) prog = advanceProgress(p, prog, r, tg, s.position, 0.5);
  return prog;
}

describe("puzzle 1 completion", () => {
  it("is not solved as loaded, and is solved after 60 s with the regulator moved 1.2° toward Slow", () => {
    expect(hold("runs-fast", {}, 120).solved).toBe(false);
    expect(hold("runs-fast", { regulatorIndex: -1.2 }, 59).solved).toBe(false);
    expect(hold("runs-fast", { regulatorIndex: -1.2 }, 60).solved).toBe(true);
  });
  it("starts the hold again when the reading leaves the band", () => {
    const part = hold("runs-fast", { regulatorIndex: -1.2 }, 40);
    expect(hold("runs-fast", {}, 1, part).heldSeconds).toBe(0);
  });
});

describe("puzzle 4 completion", () => {
  const fix = { poiseCorrection: 10e-11, poiseCorrectionDeg: 180 };
  const round = (user: Partial<WatchSettings>, positions: Position[], from: Progress = NO_PROGRESS) =>
    positions.reduce((prog, position) => hold("position-error", { ...user, position }, 15, prog), from);

  it("shows the fault in the instrument: crown down loses, crown up gains, the other two barely move", () => {
    const rate = (position: Position) => readWatch(VINTAGE_18000.watch, { ...ZERO_SETTINGS, ...puzzle("position-error").faults, position }).rateSecondsPerDay;
    expect(rate("CD")).toBeLessThan(-3);
    expect(rate("CU")).toBeGreaterThan(3);
    expect(Math.abs(rate("CR"))).toBeLessThan(3);
    expect(Math.abs(rate("CL"))).toBeLessThan(3);
    expect(Math.abs(rate("DU"))).toBeLessThan(0.01);
  });
  it("is not solved by removing weight without ever leaving dial up", () => {
    expect(hold("position-error", fix, 600).solved).toBe(false);
  });
  it("is not solved by removing the right amount at the control's resting angle", () => {
    expect(round({ poiseCorrection: 10e-11, poiseCorrectionDeg: 0 }, ["CU", "CR", "CD", "CL"]).solved).toBe(false);
  });
  it("is not solved by running the watch down to the 220° crossover, where the error hides", () => {
    for (const hoursSinceWind of [20, 22, 24, 26]) expect(round({ hoursSinceWind }, ["CU", "CR", "CD", "CL"]).solved).toBe(false);
  });
  it("is solved once the rate has been shown in band in all four crown positions, in any order", () => {
    const three = round(fix, ["CD", "CU", "CL"]);
    expect(three.solved).toBe(false);
    expect(three.passed).toEqual(["CD", "CU", "CL"]);
    expect(round(fix, ["CR"], three).solved).toBe(true);
  });
  it("forgets positions passed before the watch went out of band", () => {
    const early = round(fix, ["CR", "CL"]);
    expect(early.passed).toEqual(["CR", "CL"]);
    // The repair is undone (weight removed at the wrong place): everything shown so far is void.
    expect(round({ poiseCorrection: 10e-11, poiseCorrectionDeg: 90 }, ["CD"], early).passed).toEqual([]);
  });
});
