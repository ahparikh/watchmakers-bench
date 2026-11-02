/** Escapement geometry. Every shape and motion derives from these numbers; nothing is hand-drawn.
 *  Part of a calibre's definition in the catalog. */
export interface EscapementParams {
  /** Escape wheel tooth count. */
  teeth: number;
  /** Escape wheel tip radius, scene units. */
  wheelRadius: number;
  /** Balance travel (degrees) during which the impulse pin is in the fork notch. */
  liftAngle: number;
  /** Lever rotation (degrees) spent unlocking before the tooth tip reaches the pallet corner. */
  lockAngle: number;
  /** Lever rotation (degrees) during which the tooth tip slides on the impulse face. */
  liftLever: number;
  /** Lever rotation (degrees) after drop before the lever reaches its banking. */
  runToBanking: number;
  /** Escape wheel rotation (degrees) in free flight between leaving one pallet and landing on the other. */
  drop: number;
  /** Escape wheel speed in free flight, degrees per second. Must exceed the fastest rate at
   *  which an impulse face can recede, or the stepper reports a false drop mid-impulse. */
  freeRunSpeed: number;
  /** Fork length from its pivot to the notch, scene units. Drives rendering only. */
  forkLength: number;
  /** Balance wheel radius, scene units. Drives rendering only. */
  balanceRadius: number;
}

/** Quantities the geometry needs, derived once from params. */
export function derived(p: EscapementParams) {
  const pitch = 360 / p.teeth;
  const halfEmbrace = (2.5 * pitch) / 2; // pallets straddle 2.5 teeth
  const pivotDistance = p.wheelRadius / Math.cos(rad(halfEmbrace)); // tangential geometry
  const stoneArm = p.wheelRadius * Math.tan(rad(halfEmbrace)); // pivot to tangent point
  const forkHalf = (p.lockAngle + p.liftLever + p.runToBanking) / 2;
  const liftWheel = pitch / 2 - p.drop;
  return { pitch, halfEmbrace, pivotDistance, stoneArm, forkHalf, liftWheel };
}

export const rad = (deg: number) => (deg * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
