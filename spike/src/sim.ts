/**
 * Kinematic escapement: the balance is a pure sinusoid, the fork follows the impulse
 * pin while it is in the notch, and the escape wheel advances as far as the pallet
 * stones physically allow. Phases are read off the contact, not scripted.
 */
import { type EscapementParams, derived, rad } from "./params";
import { distToSegment, len, sub } from "./geom2d";
import { stones, toothPolygons, stonePenetration } from "./shapes";

export type Phase = "lock" | "unlock" | "impulse" | "drop";
export type StoneName = "entry" | "exit";
export type Face = "locking" | "impulse";

export interface EscapementState {
  t: number;
  balanceAngle: number;
  forkAngle: number;
  wheelAngle: number;
  phase: Phase;
  contact: { stone: StoneName; face: Face } | null;
  /** Count of steps where lever motion drove a stone into a tooth by more than NUDGE_TOL degrees. */
  violations: number;
  /** Largest forward nudge (degrees) ever needed to clear such a penetration. */
  maxNudge: number;
}

export const period = (p: EscapementParams) => (2 * 3600) / p.beatRate;

/** Contact solver tolerance: a resting tooth may be pressed this far (scene units) into a face. */
export const CONTACT_TOL = 1e-6;
const TOL = CONTACT_TOL;
/** Lever motion along a tangent line, not a true arc, leaves sub-micro-degree residues. */
const NUDGE_TOL = 1e-3;

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

function balanceAt(p: EscapementParams, t: number) {
  return p.balanceAmplitude * Math.sin((2 * Math.PI * t) / period(p));
}

function forkFor(p: EscapementParams, balanceAngle: number) {
  const d = derived(p);
  const half = p.liftAngle / 2;
  const x = Math.max(-half, Math.min(half, balanceAngle));
  return (x / half) * d.forkHalf;
}

/** Integrate one full period from a locked start and keep the trajectory. */
function trajectory(p: EscapementParams) {
  const T = period(p);
  const steps = 4000;
  const dt = T / steps;
  const out: EscapementState[] = [];
  // Start at T/4 (balance at +amplitude) so the fork is parked on a banking.
  const t0 = T / 4;
  let wheel = 0;
  // Settle: let the wheel run until it is blocked, so the first tooth is locked.
  wheel = advance(p, forkFor(p, balanceAt(p, t0)), wheel, 2 * derived(p).pitch).wheel;
  let violations = 0;
  let maxNudge = 0;
  let prevFork = forkFor(p, balanceAt(p, t0));
  for (let i = 0; i <= steps; i++) {
    const t = t0 + i * dt;
    const bal = balanceAt(p, t);
    const fork = forkFor(p, bal);
    if (worst(p, fork, wheel) > TOL) {
      const nudged = clear(p, fork, wheel);
      const nudge = Math.abs(nudged - wheel);
      if (nudge > maxNudge) maxNudge = nudge;
      if (nudge > NUDGE_TOL) violations++;
      wheel = nudged;
    }
    const r = advance(p, fork, wheel, p.freeRunSpeed * dt);
    wheel = r.wheel;
    let phase: Phase;
    let contact: EscapementState["contact"] = null;
    if (!r.blocked) phase = "drop";
    else {
      contact = classify(p, fork, wheel);
      if (contact.face === "impulse") phase = "impulse";
      else {
        const dFork = fork - prevFork;
        const lifting = (contact.stone === "entry" && dFork < -1e-12) || (contact.stone === "exit" && dFork > 1e-12);
        phase = lifting ? "unlock" : "lock";
      }
    }
    prevFork = fork;
    out.push({ t, balanceAngle: bal, forkAngle: fork, wheelAngle: wheel, phase, contact, violations, maxNudge });
  }
  return { t0, dt, steps, states: out };
}

/** Nearest wheel angle (either direction, within half a degree) at which the pose no longer penetrates. */
function clear(p: EscapementParams, fork: number, wheel: number) {
  const search = (dir: 1 | -1) => {
    let lo = wheel, hi = wheel + dir * 0.5;
    if (worst(p, fork, hi) > TOL) return Infinity;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (worst(p, fork, mid) <= TOL) hi = mid; else lo = mid;
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
  if (worst(p, fork, target) <= TOL) return { wheel: target, blocked: false };
  let lo = wheel, hi = target;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (worst(p, fork, mid) <= TOL) lo = mid; else hi = mid;
  }
  return { wheel: lo, blocked: true };
}

const cache = new WeakMap<EscapementParams, ReturnType<typeof trajectory>>();

/** Pure in t: state of the escapement at absolute time t (seconds). */
export function escapementState(p: EscapementParams, t: number): EscapementState {
  let tr = cache.get(p);
  if (!tr) { tr = trajectory(p); cache.set(p, tr); }
  const T = period(p);
  const pitch = derived(p).pitch;
  const rel = t - tr.t0;
  const cycles = Math.floor(rel / T);
  const within = rel - cycles * T;
  const i = Math.min(tr.steps, Math.round(within / tr.dt));
  const s = tr.states[i];
  return { ...s, t, wheelAngle: s.wheelAngle + cycles * pitch };
}
