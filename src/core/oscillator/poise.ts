/**
 * Rate error from a balance poise error (heavy spot), per docs/research/04-positional-error.md,
 * verified against Rolex patent US10120341B2 claim 9 (citing Augsburger 1966):
 *
 *   rate_sd = 86400 · g · u · cos(φ) · sin(tilt) / (I · ω0²) · J1(Θ) / Θ
 *
 * Sign: heavy spot at the bottom (φ = 0) in a vertical position gains below the first zero of
 * J1 (Θ ≈ 219.5°) and loses above it.
 */
import { besselJ1 } from "./bessel";

export const G = 9.80665;

export interface PoiseInput {
  /** Unbalance, mass × eccentricity, kg·m (1 µg·cm = 1e-11 kg·m). */
  unbalance: number;
  /** Heavy-spot angle from the downward vertical when the balance is at rest, radians. */
  heavySpotAngle: number;
  /** Angle of the balance axis from vertical: 0 dial up or down, π/2 in any vertical position. */
  tilt: number;
  /** Balance moment of inertia, kg·m² (1 mg·cm² = 1e-10 kg·m²). */
  inertia: number;
  /** Natural angular frequency, rad/s (2π × balance frequency in Hz). */
  omega0: number;
  /** Amplitude, radians. */
  amplitude: number;
}

export function poiseRateSecondsPerDay(i: PoiseInput): number {
  if (i.amplitude <= 0) return 0;
  return (86400 * G * i.unbalance * Math.cos(i.heavySpotAngle) * Math.sin(i.tilt)) / (i.inertia * i.omega0 * i.omega0) * (besselJ1(i.amplitude) / i.amplitude);
}

/** Amplitude at which poise error vanishes: the first zero of J1, in degrees. */
export const POISE_CROSSOVER_DEG = 219.54;
