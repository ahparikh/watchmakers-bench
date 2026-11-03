/**
 * The instrument. Reads a window of ticks and reports what a bench timegrapher reports.
 * Formulas per docs/research/02-beat-rates-and-timegrapher.md (verified against the `tg`
 * open-source timegrapher):
 *   rate  = (T_nominal / T_measured − 1) · 86400          (+ = fast)
 *   beat error = |d2 − d1| / 2                             (equals trace-line separation)
 *   amplitude = (lift / 2) / sin(π · dt / T)               (dt = unlock-to-lock time)
 */
import type { Tick } from "../oscillator/ticks";

export interface Reading {
  rateSecondsPerDay: number;
  beatErrorMs: number;
  amplitudeDeg: number;
  /** One point per tick: beat index and the tick's offset from the nominal grid, ms. */
  trace: { beat: number; offsetMs: number; parity: 0 | 1 }[];
  beats: number;
}

export function analyze(ticks: Tick[], nominalPeriod: number, liftAngleDeg: number): Reading | null {
  if (ticks.length < 4) return null;
  const beat = nominalPeriod / 2;
  const n = ticks.length;
  // Measured period from first and last tick of matching parity (whole periods between them).
  const lastSame = n - 1 - ((n - 1) % 2);
  const periods = lastSame / 2;
  const measuredPeriod = (ticks[lastSame].t - ticks[0].t) / periods;
  const rateSecondsPerDay = (nominalPeriod / measuredPeriod - 1) * 86400;

  let d1 = 0, d2 = 0, c1 = 0, c2 = 0;
  for (let i = 1; i < n; i++) {
    const d = ticks[i].t - ticks[i - 1].t;
    if (ticks[i - 1].parity === 0) { d1 += d; c1++; } else { d2 += d; c2++; }
  }
  const beatErrorMs = c1 && c2 ? (Math.abs(d2 / c2 - d1 / c1) / 2) * 1000 : 0;

  const dt = ticks.reduce((a, k) => a + k.liftDuration, 0) / n;
  const amplitudeDeg = liftAngleDeg / 2 / Math.sin((Math.PI * dt) / measuredPeriod);

  const trace = ticks.map((k, i) => ({ beat: i, offsetMs: (k.t - ticks[0].t - i * beat) * 1000, parity: k.parity }));
  return { rateSecondsPerDay, beatErrorMs, amplitudeDeg, trace, beats: n };
}
