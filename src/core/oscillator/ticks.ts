/**
 * Tick times of a sinusoidal balance, θ(t) = A·sin(ωt), that engages the fork whenever it
 * crosses the notch centre. If the hairspring's rest position is offset from the notch centre
 * by `beatOffset`, the crossings are unevenly spaced: that is beat error, and it grows as
 * amplitude falls (the same offset is a larger fraction of a smaller swing).
 *
 * Each tick also carries the unlock-to-lock time the timegrapher hears: the time the balance
 * spends inside the lift angle, which is what encodes amplitude in the sound.
 * See docs/research/02-beat-rates-and-timegrapher.md.
 */
export interface Tick {
  /** Absolute time of the tick (balance passing the notch centre), seconds. */
  t: number;
  /** Time from the unlock pulse to the lock pulse within this beat, seconds. */
  liftDuration: number;
  /** Alternates each beat. */
  parity: 0 | 1;
}

export interface TickSource {
  /** Actual period of the balance, seconds. */
  period: number;
  /** Amplitude, degrees. */
  amplitude: number;
  /** Notch centre's angle from the hairspring rest position, degrees. Zero = in beat. */
  beatOffset: number;
  /** Balance travel while engaged with the fork, degrees. */
  liftAngle: number;
}

/** Time the balance spends crossing an angular band of `band` degrees centred on `centre`. */
function crossingDuration(s: TickSource, centre: number, band: number): number {
  const omega = (2 * Math.PI) / s.period;
  const A = s.amplitude;
  const lo = Math.max(-A, Math.min(A, centre - band / 2));
  const hi = Math.max(-A, Math.min(A, centre + band / 2));
  return Math.abs(Math.asin(hi / A) - Math.asin(lo / A)) / omega;
}

/** The two half-period intervals between successive crossings of the notch centre. */
export function beatIntervals(s: TickSource): [number, number] {
  if (Math.abs(s.beatOffset) >= s.amplitude) return [s.period, 0]; // never crosses: stopped
  const omega = (2 * Math.PI) / s.period;
  const phi = Math.asin(s.beatOffset / s.amplitude);
  const d1 = (Math.PI - 2 * phi) / omega;
  return [d1, s.period - d1];
}

/** `count` consecutive ticks starting at time `start` (which is itself a tick of parity 0). */
export function tickTimes(s: TickSource, start: number, count: number): Tick[] {
  const [d1, d2] = beatIntervals(s);
  const lift = crossingDuration(s, s.beatOffset, s.liftAngle);
  const out: Tick[] = [];
  let t = start;
  for (let i = 0; i < count; i++) {
    out.push({ t, liftDuration: lift, parity: (i % 2) as 0 | 1 });
    t += i % 2 === 0 ? d1 : d2;
  }
  return out;
}
