/** Named states for the verify-render skill. Each sets puzzle, settings and animation phase. */
import type { WatchSettings } from "../core/watch";
import type { Phase } from "../core/escapement/kinematics";

export interface NamedState {
  describe: string;
  puzzle: string | null;
  settings: Partial<WatchSettings>;
  /** Freeze the animation at the middle of this escapement phase on this beat (0 entry, 1 exit). */
  freeze?: { phase: Phase; beat: 0 | 1; frac?: number };
  /** Simulated seconds of ticks to accumulate before the shot. */
  simSeconds: number;
  expect: { phase?: Phase; rateWithin?: [number, number]; amplitudeWithin?: [number, number]; beatErrorBelow?: number; running?: boolean };
}

export const STATES: Record<string, NamedState> = {
  "healthy-full-wind": { describe: "Free play, no puzzle: healthy watch, dial up, full wind. Trace flat, two lines overlapping, ~280°.", puzzle: null, settings: {}, simSeconds: 120, expect: { rateWithin: [-1, 1], amplitudeWithin: [275, 285], beatErrorBelow: 0.1, running: true } },
  "runs-fast-start": { describe: "Puzzle 1 as loaded: trace sloping (ticks early), readout about +40 s/day.", puzzle: "runs-fast", settings: {}, simSeconds: 120, expect: { rateWithin: [35, 45], running: true } },
  "runs-fast-fixed": { describe: "Puzzle 1 with the regulator moved 1.2° toward Slow: trace flat, rate near 0.", puzzle: "runs-fast", settings: { regulatorIndex: -1.2 }, simSeconds: 120, expect: { rateWithin: [-3, 3], running: true } },
  "out-of-beat": { describe: "Puzzle 2 as loaded: two trace lines clearly separated, beat error well above 0.5 ms.", puzzle: "out-of-beat", settings: {}, simSeconds: 120, expect: { running: true } },
  "slump-evening": { describe: "Puzzle 3 at 24 h of wind: amplitude near 200°, watch gaining a few s/day.", puzzle: "afternoon-slump", settings: { hoursSinceWind: 24 }, simSeconds: 120, expect: { amplitudeWithin: [190, 210], rateWithin: [2, 15], running: true } },
  // Heavy spot at the bottom when crown up; at 250° (above the 219.5° crossover) that is a LOSS. See docs/research/04.
  "position-crown-up": { describe: "Puzzle 4 crown up: amplitude ~250°, heavy spot at the bottom, poise error showing as a loss of several s/day.", puzzle: "position-error", settings: { position: "CU" }, simSeconds: 120, expect: { amplitudeWithin: [245, 255], rateWithin: [-15, -2], running: true } },
  "position-crown-down": { describe: "Puzzle 4 crown down: same amplitude, heavy spot now at the top, poise error a gain.", puzzle: "position-error", settings: { position: "CD" }, simSeconds: 120, expect: { amplitudeWithin: [245, 255], rateWithin: [2, 15], running: true } },
  "position-poised": { describe: "Puzzle 4 crown up after removing 10 µg·cm at 0°: rate back near zero.", puzzle: "position-error", settings: { position: "CU", poiseCorrection: 10e-11, poiseCorrectionDeg: 0 }, simSeconds: 120, expect: { rateWithin: [-2, 2], running: true } },
  "stopped": { describe: "Healthy watch at 42 h: no signal, balance still, readouts blank.", puzzle: null, settings: { hoursSinceWind: 42 }, simSeconds: 60, expect: { running: false } },
  "entry-impulse": { describe: "Movement frozen mid entry impulse: pin in notch, tooth on the entry impulse face.", puzzle: null, settings: {}, freeze: { phase: "impulse", beat: 0 }, simSeconds: 10, expect: { phase: "impulse" } },
  "exit-lock": { describe: "Movement frozen at exit lock: pin far from notch, tooth resting on the exit locking face.", puzzle: null, settings: {}, freeze: { phase: "lock", beat: 1 }, simSeconds: 10, expect: { phase: "lock" } },
};
