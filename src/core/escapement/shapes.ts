/**
 * Pure geometry: parameters + state in, shapes out. The renderer draws these; the
 * simulation uses the same description for contact, so what you see is what is computed.
 * Coordinates are y-up with the escape wheel centred on the origin. Wheel angle is
 * degrees of CLOCKWISE rotation (teeth travel from the entry stone to the exit stone).
 */
import { type EscapementParams, derived, rad } from "./params";
import { type Polygon, type Vec, add, scale, polar, rotateAbout, sub, len, dot, v } from "./geom2d";

export interface Pose { balanceAngle: number; forkAngle: number; wheelAngle: number }
// (Pose is the subset of EscapementPose the drawing needs.)

/**
 * A pallet stone, exactly: an annular sector about the fork pivot, cut by the impulse
 * plane. The locking face is the arc at radius `lockRadius`, so lever rotation slides it
 * along itself (zero draw). Angles are radians about the pivot, measured with atan2.
 */
export interface Stone {
  pivot: Vec;
  lockRadius: number;
  /** Radial band about the pivot that holds the stone body; one bound is the lock arc. */
  rLo: number;
  rHi: number;
  /** Impulse plane: inside the stone when dot(q - corner, normal) >= 0. */
  corner: Vec;
  normal: Vec;
  /** Back edge, from the let-off corner away from the wheel: inside when dot(q - letoff, backNormal) >= 0. */
  letoff: Vec;
  backNormal: Vec;
  /** Top edge, closing the slab: inside when dot(q - outerEnd, topNormal) >= 0. */
  outerEnd: Vec;
  backEnd: Vec;
  topNormal: Vec;
  /** Whether the stone body lies at radii below (`inside`) or above the lock arc. */
  bodyInside: boolean;
}

/** Signed depth of a point inside a stone: positive inside, negative outside. */
export function stoneDepth(q: Vec, s: Stone): number {
  const r = len(sub(q, s.pivot));
  return Math.min(
    r - s.rLo,
    s.rHi - r,
    dot(sub(q, s.corner), s.normal),
    dot(sub(q, s.letoff), s.backNormal),
    dot(sub(q, s.outerEnd), s.topNormal),
  );
}

/** Largest depth of any tooth vertex inside a stone. */
export function stonePenetration(tooth: Polygon, stone: Stone): number {
  let max = -Infinity;
  for (const q of tooth) {
    const dd = stoneDepth(q, stone);
    if (dd > max) max = dd;
  }
  return max;
}

/** Outline for drawing: the lock arc chorded finely, then the three straight edges. */
export function stoneOutline(s: Stone, chords = 24): Polygon {
  const a0 = Math.atan2(s.corner.y - s.pivot.y, s.corner.x - s.pivot.x);
  let a1 = Math.atan2(s.outerEnd.y - s.pivot.y, s.outerEnd.x - s.pivot.x);
  while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
  const arc = Array.from({ length: chords + 1 }, (_, i) => add(s.pivot, polar(s.lockRadius, a0 + ((a1 - a0) * i) / chords)));
  return [...arc, s.backEnd, s.letoff];
}

export function fixedPoints(p: EscapementParams) {
  const d = derived(p);
  const forkPivot = v(0, d.pivotDistance);
  const pinOrbit = (p.forkLength * rad(d.forkHalf)) / rad(p.liftAngle / 2);
  const balanceCentre = v(0, d.pivotDistance + p.forkLength + pinOrbit);
  return { d, forkPivot, balanceCentre, pinOrbit };
}

/** Stone in the lever frame (fork angle 0), built so the tooth tip rests exactly on the
 *  lock arc at the tangent point when the lever is on the banking `lockedAt`. */
function stoneAtRest(p: EscapementParams, tangentAngleDeg: number, lockedAt: number): Stone {
  const { d, forkPivot: P } = fixedPoints(p);
  const faceExtent = rad(20);

  const tipLocked = polar(p.wheelRadius, rad(tangentAngleDeg));
  const L = len(sub(tipLocked, P));
  const tipAng = Math.atan2(tipLocked.y - P.y, tipLocked.x - P.x);
  // Which rotation sense about the pivot moves the tip inward (toward the wheel centre)?
  const inward = len(rotateAbout(tipLocked, P, 1e-3)) < len(tipLocked) ? 1 : -1;
  // Tooth travel direction at the tip, and whether the body sits inside the pivot circle.
  const cw = v(Math.sin(rad(tangentAngleDeg)), -Math.cos(rad(tangentAngleDeg)));
  const bodyInside = dot(cw, sub(P, tipLocked)) > 0;

  const cornerAng = tipAng + inward * rad(p.lockAngle);
  const corner = add(P, polar(L, cornerAng));
  // Let-off corner, by construction: at the instant of drop (lever rotated by lock + lift
  // from the banking) it must sit exactly on the tip circle, `liftWheel` ahead of the lock
  // point in the direction of tooth travel. Pull that point back to the locked lever position.
  const dropPoint = polar(p.wheelRadius, rad(tangentAngleDeg - d.liftWheel));
  const liftSign = lockedAt > 0 ? -1 : 1; // lifting rotates the lever toward the other banking
  const letoff = rotateAbout(dropPoint, P, -liftSign * rad(p.lockAngle + p.liftLever));
  const letoffR = len(sub(letoff, P));
  const face = sub(letoff, corner);
  // Lock arc runs outward from the corner for `faceExtent`; the stone is the slab between
  // that arc, the impulse face, a back edge leaving the let-off along the lift direction,
  // and a top edge joining the two.
  const outerEnd = rotateAbout(corner, P, -inward * faceExtent);
  const armL = sub(letoff, P);
  let lift = scale(v(-armL.y, armL.x), 1 / len(armL)); // outward tangent at the let-off
  if (dot(lift, letoff) < 0) lift = scale(lift, -1);
  const backEnd = add(letoff, scale(lift, L * faceExtent));
  const thick = Math.abs(letoffR - L) + 0.2 * p.wheelRadius;
  const rLo = bodyInside ? L - thick : L;
  const rHi = bodyInside ? L : L + thick;
  let normal = scale(v(-face.y, face.x), 1 / len(face));
  if (dot(sub(outerEnd, corner), normal) < 0) normal = scale(normal, -1);
  let backNormal = v(-lift.y, lift.x);
  if (dot(sub(corner, letoff), backNormal) < 0) backNormal = scale(backNormal, -1);
  const top = sub(backEnd, outerEnd);
  let topNormal = scale(v(-top.y, top.x), 1 / len(top));
  if (dot(sub(corner, outerEnd), topNormal) < 0) topNormal = scale(topNormal, -1);

  const unrotated: Stone = {
    pivot: P,
    lockRadius: L,
    rLo,
    rHi,
    corner,
    normal,
    letoff,
    backNormal,
    outerEnd,
    backEnd,
    topNormal,
    bodyInside,
  };
  return rotateStone(unrotated, -rad(lockedAt));
}

function rotateStone(s: Stone, angleRad: number): Stone {
  const r = (q: Vec) => rotateAbout(q, s.pivot, angleRad);
  const rv = (q: Vec) => rotateAbout(q, v(0, 0), angleRad);
  return {
    ...s,
    corner: r(s.corner), letoff: r(s.letoff), outerEnd: r(s.outerEnd), backEnd: r(s.backEnd),
    normal: rv(s.normal), backNormal: rv(s.backNormal), topNormal: rv(s.topNormal),
  };
}

const restCache = new WeakMap<EscapementParams, { entry: Stone; exit: Stone }>();
export function stonesAtRest(p: EscapementParams) {
  let c = restCache.get(p);
  if (!c) {
    const { d } = fixedPoints(p);
    c = {
      entry: stoneAtRest(p, 90 + d.halfEmbrace, +d.forkHalf),
      exit: stoneAtRest(p, 90 - d.halfEmbrace, -d.forkHalf),
    };
    restCache.set(p, c);
  }
  return c;
}

export function toothPolygons(p: EscapementParams, wheelAngle: number): Polygon[] {
  const { d } = fixedPoints(p);
  const R = p.wheelRadius;
  const out: Polygon[] = [];
  for (let k = 0; k < p.teeth; k++) {
    // Tooth k's tip; the body trails the tip on the counter-clockwise side.
    const tip = rad(90 + d.halfEmbrace + k * d.pitch - wheelAngle);
    out.push([polar(R, tip), polar(0.8 * R, tip + rad(2)), polar(0.8 * R, tip + rad(10))]);
  }
  return out;
}

export function stones(p: EscapementParams, forkAngle: number) {
  const rest = stonesAtRest(p);
  return {
    entryStone: rotateStone(rest.entry, rad(forkAngle)),
    exitStone: rotateStone(rest.exit, rad(forkAngle)),
  };
}

export interface Shapes {
  wheelCentre: Vec;
  forkPivot: Vec;
  balanceCentre: Vec;
  teeth: Polygon[];
  entryStone: Stone;
  exitStone: Stone;
  lever: Polygon;
  arms: Polygon[];
  bankings: Vec[];
  impulsePin: Vec;
  pinRadius: number;
  balanceRadius: number;
  wheelRadius: number;
}

export function shapes(p: EscapementParams, pose: Pose): Shapes {
  const { forkPivot, balanceCentre, pinOrbit } = fixedPoints(p);
  const { entryStone, exitStone } = stones(p, pose.forkAngle);
  const phi = rad(pose.forkAngle);
  const half = 3;
  const horn = pinOrbit * 0.55; // notch half-width: the pin's radius plus clearance
  const L = p.forkLength;
  // Lever with a notch at the top; the pin enters from above.
  const leverRest: Polygon = [
    add(forkPivot, v(-half, 0)), add(forkPivot, v(half, 0)),
    add(forkPivot, v(half, L - 12)), add(forkPivot, v(horn + 2, L - 12)), add(forkPivot, v(horn + 2, L + 6)),
    add(forkPivot, v(horn, L + 6)), add(forkPivot, v(horn, L - 6)), add(forkPivot, v(-horn, L - 6)),
    add(forkPivot, v(-horn, L + 6)), add(forkPivot, v(-horn - 2, L + 6)), add(forkPivot, v(-horn - 2, L - 12)),
    add(forkPivot, v(-half, L - 12)),
  ];
  const rot = (q: Vec) => rotateAbout(q, forkPivot, phi);
  const arm = (st: Stone): Polygon => {
    const tip = scale(add(st.outerEnd, st.backEnd), 0.5);
    const dir = sub(tip, forkPivot);
    const n = scale(v(-dir.y, dir.x), 2 / len(dir));
    return [add(forkPivot, n), add(tip, n), sub(tip, n), sub(forkPivot, n)];
  };
  const { d } = fixedPoints(p);
  const bankings = [
    rotateAbout(add(forkPivot, v(-half - 1.8, 0.5 * L)), forkPivot, rad(d.forkHalf)),
    rotateAbout(add(forkPivot, v(half + 1.8, 0.5 * L)), forkPivot, rad(-d.forkHalf)),
  ];
  return {
    wheelCentre: v(0, 0),
    forkPivot,
    balanceCentre,
    teeth: toothPolygons(p, pose.wheelAngle),
    entryStone,
    exitStone,
    lever: leverRest.map(rot),
    arms: [arm(entryStone), arm(exitStone)],
    bankings,
    // Positive fork angle swings the lever head toward -x (CCW about a pivot below it), so the
    // pin must also move toward -x for positive balance angle, or it would sit outside the horns.
    impulsePin: add(balanceCentre, polar(pinOrbit, rad(-90 - pose.balanceAngle))),
    pinRadius: pinOrbit,
    balanceRadius: p.balanceRadius,
    wheelRadius: p.wheelRadius,
  };
}
