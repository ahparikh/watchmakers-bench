/**
 * The film's script as pure functions of film time. Shared by the offline pose precompute
 * (build/build.mjs) and the browser runtime (film.ts), so both agree on what the watch is
 * doing at every frame. Nothing here touches the DOM.
 */
import { VINTAGE_18000 } from "../../../src/catalog/vintage18000";
import { nominalPeriod } from "../../../src/core/oscillator/period";
import { readWatch, ZERO_SETTINGS } from "../../../src/core/watch";
import { PUZZLES } from "../../../src/puzzles";

export const FPS = 60;
export const DURATION = 24.5;
export const FRAMES = Math.round(FPS * DURATION);

/** Scene boundaries, film seconds (see brag-plan.md). The intro runs from 0 to S1. */
// S1: the complaint. S3: the bench. S4: three more jobs. S5: outro.
export const S1 = 5.45, S3 = 9.27, S4 = 16.38, S5 = 20.75;
/** Scene 3 beats: cursor grabs the regulator, lets go, puzzle reads solved. */
export const GRAB = 9.83, RELEASE = 11.49, SOLVED = 14.2;

/** Music beat grid: vol-12 at 109.96 BPM, a beat on 3.818 s. */
export const BEAT = 0.5456, BEAT0 = 3.818;

export const calibre = VINTAGE_18000;
export const esc = calibre.escapement;
export const T = nominalPeriod(calibre.beatRate);

/** Movement speed that lands one beat of the watch on every second beat of the music. */
export const BEAT_LOCKED_SPEED = (T / 2) / (2 * BEAT);
/** The app's "1/5" stop, used on the bench where the speed strip is visible. */
export const BENCH_SPEED = 0.2;

/** Film-time spans in which the movement drawing is on screen. Poses are precomputed for these. */
export const SEG_A = { from: 0, to: 17.0 };
export const SEG_B = { from: 20.1, to: DURATION };

/** Watch seconds elapsed on the movement view at film time t. Continuous within each segment. */
export function movementTime(t: number): number {
  if (t < SEG_B.from) {
    // Whole periods added so the clock is positive from frame 0; ticks still land on the beat.
    if (t <= S3) return (t - BEAT0) * BEAT_LOCKED_SPEED + 10 * T;
    return (S3 - BEAT0) * BEAT_LOCKED_SPEED + 10 * T + (t - S3) * BENCH_SPEED;
  }
  // Outro: re-locked so a tick lands on 22.91 s, where the URL arrives.
  return (t - (BEAT0 + 31 * BEAT)) * BEAT_LOCKED_SPEED + 40 * T;
}

/** Amplitude of puzzle 1's watch at full wind, dial up (the regulator does not change it). */
export const AMPLITUDE = readWatch(calibre.watch, { ...ZERO_SETTINGS, ...PUZZLES[0].faults }).amplitudeDeg;

/** Balance angle on the movement view, degrees. In beat: it crosses the notch centre at zero. */
export function balanceAngle(t: number): number {
  return AMPLITUDE * Math.sin((2 * Math.PI * movementTime(t)) / T);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const ramp = (t: number, t0: number, t1: number) => clamp01((t - t0) / (t1 - t0));

/** Regulator index the hand has set, degrees (slider step 0.05). Overshoots a little, then corrects. */
export function regulatorAt(t: number): number {
  let v = 0;
  if (t >= GRAB) {
    const over = -1.35, rest = -1.2, turn = GRAB + 1.15;
    v = t < turn ? over * smooth(ramp(t, GRAB, turn)) : over + (rest - over) * smooth(ramp(t, turn, RELEASE));
  }
  return Math.round(v / 0.05) * 0.05;
}
