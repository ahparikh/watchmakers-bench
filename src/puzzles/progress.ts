/** Completion rule for a puzzle, as a pure step: has the band been held long enough, and (for a
 *  puzzle that must be checked in several positions) in every one of them? No DOM, no clock. */
import type { Puzzle } from "./index";
import type { Position, WatchReading } from "../core/watch";
import type { Reading } from "../core/timegrapher/analyze";

export interface Progress {
  /** Sim seconds the band has been held without a break (in the current position, if positions matter). */
  heldSeconds: number;
  /** Positions in which the hold has been completed since the band last failed. */
  passed: Position[];
  solved: boolean;
}

export const NO_PROGRESS: Progress = { heldSeconds: 0, passed: [], solved: false };

/** Advance by `dt` sim seconds with the watch as it reads now, in `position`. */
export function advanceProgress(puzzle: Puzzle, was: Progress, r: WatchReading, tg: Reading | null, position: Position, dt: number): Progress {
  if (was.solved || !Number.isFinite(puzzle.holdSeconds)) return was;
  // Out of band anywhere: start again. A position passed before a failure proves nothing about the watch as it is now.
  if (!puzzle.band(r, tg)) return NO_PROGRESS;
  if (!puzzle.holdIn) {
    const heldSeconds = was.heldSeconds + dt;
    return { heldSeconds, passed: [], solved: heldSeconds >= puzzle.holdSeconds };
  }
  // In band, but this position is not one that counts, or it has been passed already: wait for the next one.
  if (!puzzle.holdIn.includes(position) || was.passed.includes(position)) return { ...was, heldSeconds: 0 };
  const heldSeconds = was.heldSeconds + dt;
  if (heldSeconds < puzzle.holdSeconds) return { ...was, heldSeconds };
  const passed = [...was.passed, position];
  return { heldSeconds: 0, passed, solved: puzzle.holdIn.every((p) => passed.includes(p)) };
}
