/**
 * Balance period and the two rate adjustments, per docs/research/01-balance-period-and-regulator.md.
 *
 *   T = 2π √(I / k)          k ∝ 1 / L_active
 *   rate (s/day) ≈ −43200 · ΔL/L  ≈ −43200 · ΔI/I   (first order; exact forms below)
 */
export interface BalanceSpec {
  /** Moment of inertia, kg·m². */
  inertia: number;
  /** Hairspring torsional stiffness at the reference active length, N·m/rad. */
  stiffness: number;
  /** Reference active length of the hairspring, m. */
  activeLength: number;
  /** Outer coil radius where the regulator pins ride, m. Sets length change per degree of index. */
  regulatorRadius: number;
}

export interface RateAdjustments {
  /** Regulator index angle, degrees. Positive = toward Fast (shortens the active length). */
  regulatorIndex: number;
  /** Fractional change of inertia from timing screws / weights. Positive = more inertia = slower. */
  inertiaTrim: number;
}

export const SECONDS_PER_DAY = 86400;

/** Active length after the regulator moves the pins by `indexDeg` toward Fast. */
export function activeLength(b: BalanceSpec, indexDeg: number): number {
  return b.activeLength - (b.regulatorRadius * indexDeg * Math.PI) / 180;
}

/** Stiffness at a given active length (k ∝ 1/L). */
export function stiffnessAt(b: BalanceSpec, length: number): number {
  return (b.stiffness * b.activeLength) / length;
}

/** Natural period in seconds for the given adjustments. */
export function period(b: BalanceSpec, a: RateAdjustments): number {
  const I = b.inertia * (1 + a.inertiaTrim);
  const k = stiffnessAt(b, activeLength(b, a.regulatorIndex));
  return 2 * Math.PI * Math.sqrt(I / k);
}

/** Nominal period from the calibre's beat rate (beats per hour; one beat is a half period). */
export const nominalPeriod = (beatRate: number) => 7200 / beatRate;

/** Rate in seconds per day from an actual period against the nominal one. Positive = fast. */
export function rateSecondsPerDay(actualPeriod: number, nominal: number): number {
  return SECONDS_PER_DAY * (nominal / actualPeriod - 1);
}

/** A balance spec whose natural period at zero adjustment equals the beat rate exactly. */
export function balanceForBeatRate(beatRate: number, inertia: number, activeLengthM: number, regulatorRadiusM: number): BalanceSpec {
  const T = nominalPeriod(beatRate);
  const stiffness = inertia * (2 * Math.PI / T) ** 2;
  return { inertia, stiffness, activeLength: activeLengthM, regulatorRadius: regulatorRadiusM };
}
