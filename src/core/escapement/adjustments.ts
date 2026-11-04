/**
 * Geometry of the adjustments a watchmaker touches, derived from the settings so every slider
 * moves something on the drawing. Pure: parameters and settings in, points out. The renderer
 * draws these and computes nothing. Nothing here feeds the physics; the physics reads the same
 * settings directly (src/core/watch.ts).
 */
import { type EscapementParams, rad } from "./params";
import { type Vec, add, polar, v } from "./geom2d";
import { fixedPoints } from "./shapes";
import type { Position } from "../watch";

export interface AdjustmentInput {
  balanceAngle: number;
  /** Regulator index angle, degrees; positive toward Fast. Drawn 1:1. */
  regulatorIndex: number;
  /** Stud carrier rotation, degrees. Drawn 1:1. */
  beatOffsetDeg: number;
  /** Fractional inertia change from the timing screws. */
  inertiaTrim: number;
  position: Position;
  /** Where weight is being removed on the rim, and how much (kg·m). */
  poiseCorrection: number;
  poiseCorrectionDeg: number;
  /** The hidden heavy spot, shown only once revealed. */
  heavySpotDeg: number;
  unbalance: number;
  revealHeavySpot: boolean;
}

export interface AdjustmentShapes {
  /** Hairspring as a polyline from the collet (inner end, turns with the balance) to the stud (fixed). */
  hairspring: Vec[];
  /** Outer attachment of the hairspring; moves with the beat adjustment. */
  stud: Vec;
  /** The arc the stud carrier can swing through, for drawing the carrier's slot. */
  studTrack: { centre: Vec; radius: number; fromDeg: number; toDeg: number };
  /** Regulator: pivoted on the balance axis, its pins straddle the outer coil at `pins`. */
  regulator: { arm: [Vec, Vec]; pins: [Vec, Vec]; scale: { fast: Vec; slow: Vec; centre: Vec }; indexDeg: number };
  /** Timing screws on the rim: head position and how far it stands proud (positive = out = slower). */
  screws: { head: Vec; proud: number; angleDeg: number }[];
  /** Weight removed for poising: a cut in the rim at the chosen angle, depth ∝ amount. */
  poiseCut: { at: Vec; depth: number; angleDeg: number } | null;
  /** The hidden heavy spot, if revealed. */
  heavySpot: { at: Vec; angleDeg: number } | null;
  /** Rotation to apply to the whole movement so "crown down" points down the page, and where gravity points. */
  view: { rotationDeg: number; gravity: "into-page" | "out-of-page" | "down" };
}

/** Rim angle of the crown relative to the movement's +x axis: crown at 3 o'clock. */
const CROWN_AT_DEG = 0;

const VIEW: Record<Position, AdjustmentShapes["view"]> = {
  DU: { rotationDeg: 0, gravity: "into-page" },
  DD: { rotationDeg: 0, gravity: "out-of-page" },
  CU: { rotationDeg: 90 - CROWN_AT_DEG, gravity: "down" },
  CR: { rotationDeg: 0 - CROWN_AT_DEG, gravity: "down" },
  CD: { rotationDeg: -90 - CROWN_AT_DEG, gravity: "down" },
  CL: { rotationDeg: 180 - CROWN_AT_DEG, gravity: "down" },
};

export const HAIRSPRING_TURNS = 5;
/** Regulator and stud sit on the balance cock at this angle from +x at zero adjustment (top of the drawing). */
export const COCK_ANGLE_DEG = 90;
/** Inertia trim of ±0.4 % draws as ±4 units of screw travel. */
export const SCREW_PROUD_PER_TRIM = 1000;
/** A poise cut of 10 µg·cm draws 4 units deep. */
export const POISE_CUT_PER_UNBALANCE = 4 / 10e-11;

export function adjustmentShapes(p: EscapementParams, a: AdjustmentInput): AdjustmentShapes {
  const { balanceCentre: B } = fixedPoints(p);
  const R = p.balanceRadius;
  const rInner = 0.12 * R, rOuter = 0.72 * R;

  // Hairspring: an Archimedean spiral whose inner end is pinned to the balance (angle follows the
  // balance 1:1) and whose outer end is pinned to the stud. Between them the coil angle is
  // interpolated, so winding the balance tightens or opens the coils visibly.
  const studAngle = COCK_ANGLE_DEG + a.beatOffsetDeg;
  const innerAngle = COCK_ANGLE_DEG - a.balanceAngle; // balance turns the same sense as the impulse pin
  const sweep = 360 * HAIRSPRING_TURNS + (studAngle - innerAngle);
  const N = 160;
  const hairspring: Vec[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    hairspring.push(add(B, polar(rInner + (rOuter - rInner) * s, rad(innerAngle + sweep * s))));
  }
  const stud = add(B, polar(rOuter, rad(studAngle)));
  const studTrack = { centre: B, radius: rOuter, fromDeg: COCK_ANGLE_DEG - 12, toDeg: COCK_ANGLE_DEG + 12 };

  // Regulator: index lever pivoted on the balance axis; toward Fast (positive) the pins move
  // toward the stud, shortening the active coil. Drawn 1:1 with the model's index angle.
  const indexDeg = COCK_ANGLE_DEG + 24 - a.regulatorIndex; // pins rest 24° from the stud; Fast closes the gap
  const pinsAt = add(B, polar(rOuter, rad(indexDeg)));
  const across = polar(2.2, rad(indexDeg));
  const regulator = {
    arm: [B, add(B, polar(R * 1.15, rad(indexDeg)))] as [Vec, Vec],
    pins: [add(pinsAt, across), add(pinsAt, scaleNeg(across))] as [Vec, Vec],
    scale: {
      fast: add(B, polar(R * 1.25, rad(COCK_ANGLE_DEG + 24 - 4))),
      slow: add(B, polar(R * 1.25, rad(COCK_ANGLE_DEG + 24 + 4))),
      centre: add(B, polar(R * 1.25, rad(COCK_ANGLE_DEG + 24))),
    },
    indexDeg,
  };

  // Timing screws: four pairs on the rim, turning with the balance; proud = out = more inertia.
  const proud = a.inertiaTrim * SCREW_PROUD_PER_TRIM;
  const screws = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const angleDeg = deg - a.balanceAngle;
    return { head: add(B, polar(R + proud, rad(angleDeg))), proud, angleDeg };
  });

  const poiseCut = a.poiseCorrection > 0
    ? { at: add(B, polar(R, rad(a.poiseCorrectionDeg - a.balanceAngle))), depth: a.poiseCorrection * POISE_CUT_PER_UNBALANCE, angleDeg: a.poiseCorrectionDeg - a.balanceAngle }
    : null;
  const heavySpot = a.revealHeavySpot && a.unbalance > 0
    ? { at: add(B, polar(R, rad(a.heavySpotDeg - a.balanceAngle))), angleDeg: a.heavySpotDeg - a.balanceAngle }
    : null;

  return { hairspring, stud, studTrack, regulator, screws, poiseCut, heavySpot, view: VIEW[a.position] };
}

const scaleNeg = (q: Vec): Vec => v(-q.x, -q.y);
