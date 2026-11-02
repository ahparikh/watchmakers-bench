/**
 * Kinematic Swiss lever escapement as a pure stepper. The caller supplies the balance angle
 * each step (from the oscillator model); the fork follows the impulse pin while it is in the
 * notch, and the escape wheel advances as far as the pallet stones physically allow. Phases
 * are read off the contact, never scripted.
 */
import { type EscapementParams, derived } from "./params";
import { distToSegment, len, sub } from "./geom2d";
import { stones, toothPolygons, stonePenetration } from "./shapes";

export type Phase = "lock" | "unlock" | "impulse" | "drop";
export type StoneName = "entry" | "exit";
export type Face = "locking" | "impulse";

export interface EscapementPose {
  balanceAngle: number;
  forkAngle: number;
  wheelAngle: number;
  phase: Phase;
  contact: { stone: StoneName; face: Face } | null;
  /** Count of steps where lever motion drove a stone into a tooth by more than NUDGE_TOL degrees. */
  violations: number;
  /** Largest nudge (degrees) ever needed to clear such a penetration. */
  maxNudge: number;
}

/** Contact solver tolerance: a resting tooth may be pressed this far (scene units) into a face. */
export const CONTACT_TOL = 1e-6;
/** Residual from finite steps along the lock arc. */
const NUDGE_TOL = 1e-3;
/** Largest internal step, seconds. Keeps the contact search well below a tooth width. */
const MAX_SUBSTEP = 1e-4;

/** Fork angle the impulse pin imposes at a given balance angle; the fork parks at a banking
 *  whenever the pin is out of the notch (zero draw: nothing else moves it). */
export function forkFor(p: EscapementParams, balanceAngle: number): number {
  const half = p.liftAngle / 2;
  const x = Math.max(-half, Math.min(half, balanceAngle));
  return (x / half) * derived(p).forkHalf;
}

/** A pose with the wheel settled against whichever stone the given balance angle locks. */
export function initialPose(p: EscapementParams, balanceAngle: number): EscapementPose {
  const fork = forkFor(p, balanceAngle);
  const wheel = advance(p, fork, 0, 2 * derived(p).pitch).wheel;
  return { balanceAngle, forkAngle: fork, wheelAngle: wheel, phase: "lock", contact: classify(p, fork, wheel), violations: 0, maxNudge: 0 };
}

/** Advance the escapement by dt seconds while the balance moves from prev.balanceAngle to balanceAngle. */
export function step(p: EscapementParams, prev: EscapementPose, balanceAngle: number, dt: number): EscapementPose {
  const n = Math.max(1, Math.ceil(dt / MAX_SUBSTEP));
  let pose = prev;
  for (let i = 1; i <= n; i++) {
    const bal = prev.balanceAngle + ((balanceAngle - prev.balanceAngle) * i) / n;
    pose = substep(p, pose, bal, dt / n);
  }
  return pose;
}

function substep(p: EscapementParams, prev: EscapementPose, bal: number, dt: number): EscapementPose {
  const fork = forkFor(p, bal);
  let wheel = prev.wheelAngle;
  let violations = prev.violations, maxNudge = prev.maxNudge;
  if (worst(p, fork, wheel) > CONTACT_TOL) {
    const nudged = clear(p, fork, wheel);
    const nudge = Math.abs(nudged - wheel);
    if (nudge > maxNudge) maxNudge = nudge;
    if (nudge > NUDGE_TOL) violations++;
    wheel = nudged;
  }
  const r = advance(p, fork, wheel, p.freeRunSpeed * dt);
  wheel = r.wheel;
  let phase: Phase;
  let contact: EscapementPose["contact"] = null;
  if (!r.blocked) phase = "drop";
  else {
    contact = classify(p, fork, wheel);
    if (contact.face === "impulse") phase = "impulse";
    else {
      const dFork = fork - prev.forkAngle;
      const lifting = (contact.stone === "entry" && dFork < -1e-12) || (contact.stone === "exit" && dFork > 1e-12);
      phase = lifting ? "unlock" : "lock";
    }
  }
  return { balanceAngle: bal, forkAngle: fork, wheelAngle: wheel, phase, contact, violations, maxNudge };
}

/** Largest penetration between any tooth and either stone. */
function worst(p: EscapementParams, forkAngle: number, wheelAngle: number) {
  const { entryStone, exitStone } = stones(p, forkAngle);
  let max = -Infinity;
  for (const tooth of toothPolygons(p, wheelAngle)) {
    for (const s of [entryStone, exitStone]) {
      const pen = stonePenetration(tooth, s);
      if (pen > max) max = pen;
    }
  }
  return max;
}

function classify(p: EscapementParams, forkAngle: number, wheelAngle: number): { stone: StoneName; face: Face } {
  const { entryStone, exitStone } = stones(p, forkAngle);
  let best = { d: Infinity, stone: "entry" as StoneName, face: "locking" as Face };
  for (const tooth of toothPolygons(p, wheelAngle)) {
    const tip = tooth[0];
    for (const [name, s] of [["entry", entryStone], ["exit", exitStone]] as const) {
      const dImp = distToSegment(tip, s.corner, s.letoff);
      const dLock = Math.abs(len(sub(tip, s.pivot)) - s.lockRadius);
      if (dImp < best.d) best = { d: dImp, stone: name, face: "impulse" };
      if (dLock < best.d) best = { d: dLock, stone: name, face: "locking" };
    }
  }
  return { stone: best.stone, face: best.face };
}

/** Nearest wheel angle (either direction, within half a degree) at which the pose no longer penetrates. */
function clear(p: EscapementParams, fork: number, wheel: number) {
  const search = (dir: 1 | -1) => {
    let lo = wheel, hi = wheel + dir * 0.5;
    if (worst(p, fork, hi) > CONTACT_TOL) return Infinity;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (worst(p, fork, mid) <= CONTACT_TOL) hi = mid; else lo = mid;
    }
    return hi;
  };
  const fwd = search(1), back = search(-1);
  if (fwd === Infinity && back === Infinity) return wheel + 0.5; // hopeless; let the violation show
  return Math.abs(fwd - wheel) <= Math.abs(back - wheel) ? fwd : back;
}

/** Move the wheel forward by up to `maxStep` degrees, stopping at first contact. */
function advance(p: EscapementParams, fork: number, wheel: number, maxStep: number) {
  const target = wheel + maxStep;
  if (worst(p, fork, target) <= CONTACT_TOL) return { wheel: target, blocked: false };
  let lo = wheel, hi = target;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (worst(p, fork, mid) <= CONTACT_TOL) lo = mid; else hi = mid;
  }
  return { wheel: lo, blocked: true };
}
