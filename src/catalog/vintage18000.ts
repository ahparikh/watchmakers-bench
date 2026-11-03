import type { Calibre } from "./types";
import { balanceForBeatRate } from "../core/oscillator/period";
import { HEALTHY_MAINSPRING, DEFAULT_ISOCHRONISM } from "../core/oscillator/amplitude";
import type { WatchSpec } from "../core/watch";

/** A vintage-style 18,000 bph manual calibre. Inertia is a design choice (docs/research/01: 1.5–3e-9). */
export const VINTAGE_18000: Calibre & { watch: WatchSpec } = {
  id: "vintage-18000",
  name: "Vintage manual, 18,000 bph",
  beatRate: 18000,
  liftAngle: 52,
  inertia: 2.0e-9,
  activeLength: 0.1,
  regulatorRadius: 0.0045,
  escapement: { teeth: 15, wheelRadius: 100, liftAngle: 52, lockAngle: 1.5, liftLever: 8, runToBanking: 0.5, drop: 2, freeRunSpeed: 8000, forkLength: 110, balanceRadius: 60 },
  amplitude: { fullWindDeg: 280, afterDayDeg: 250, reserveHours: 42, verticalDropDeg: 30 },
  puzzles: ["runs-fast", "out-of-beat", "afternoon-slump", "position-error"],
  watch: {
    beatRate: 18000,
    liftAngle: 52,
    balance: balanceForBeatRate(18000, 2.0e-9, 0.1, 0.0045),
    mainspring: HEALTHY_MAINSPRING,
    isochronism: DEFAULT_ISOCHRONISM,
    fullWindAmplitudeDeg: 280,
    verticalDropDeg: 30,
  },
};
