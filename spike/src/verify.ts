/** window.__bench contract for the verify-render skill. Checks use the same shapes the renderer draws. */
import { type EscapementParams, derived } from "./params";
import { type EscapementState, CONTACT_TOL } from "./sim";
import { shapes, stonePenetration } from "./shapes";
import { type NamedState } from "./states";

export interface Check { name: string; pass: boolean; detail: string }

export function runChecks(p: EscapementParams, s: EscapementState, named: NamedState): Check[] {
  const g = shapes(p, s);
  const d = derived(p);
  const out: Check[] = [];
  let worst = -Infinity;
  for (const tooth of g.teeth) for (const st of [g.entryStone, g.exitStone]) worst = Math.max(worst, stonePenetration(tooth, st));
  out.push({ name: "no tooth inside a stone", pass: worst <= CONTACT_TOL * 1.01, detail: `max penetration ${worst.toExponential(2)} (tol ${CONTACT_TOL})` });
  out.push({ name: "lever within bankings", pass: Math.abs(s.forkAngle) <= d.forkHalf + 1e-9, detail: `fork ${s.forkAngle.toFixed(3)}°, banking ±${d.forkHalf}°` });
  out.push({ name: "phase as expected", pass: s.phase === named.expect.phase, detail: `got ${s.phase}, expected ${named.expect.phase}` });
  if (named.expect.stone) out.push({ name: "contact stone", pass: s.contact?.stone === named.expect.stone, detail: `got ${s.contact?.stone ?? "none"}, expected ${named.expect.stone}` });
  if (named.expect.face) out.push({ name: "contact face", pass: s.contact?.face === named.expect.face, detail: `got ${s.contact?.face ?? "none"}, expected ${named.expect.face}` });
  if (named.expect.phase === "lock") out.push({ name: "pin out of notch while locked", pass: Math.abs(s.balanceAngle) > p.liftAngle / 2, detail: `balance ${s.balanceAngle.toFixed(1)}°, notch ±${p.liftAngle / 2}°` });
  return out;
}
