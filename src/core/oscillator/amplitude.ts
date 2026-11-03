/**
 * Mainspring torque over the wind, and the amplitude it produces, per
 * docs/research/03-amplitude-and-isochronism.md.
 *
 *   torque fraction  τ(t) = 1 − fall·(t/24)  for t ≤ 36 h, then linear to 0 at 42 h
 *   amplitude        A = A_pos · τ^k,  k = 0.7
 */
export interface MainspringSpec {
  /** Fractional torque lost per 24 h of running: 0.15 healthy, 0.40 for a tired spring. */
  fallPerDay: number;
  /** Hours of roughly linear torque before the "ineffective turns". */
  linearHours: number;
  /** Hours at which torque reaches zero. */
  stopHours: number;
}

export const HEALTHY_MAINSPRING: MainspringSpec = { fallPerDay: 0.15, linearHours: 36, stopHours: 42 };
export const TIRED_MAINSPRING: MainspringSpec = { ...HEALTHY_MAINSPRING, fallPerDay: 0.4 };

export function torqueFraction(m: MainspringSpec, hoursSinceWind: number): number {
  const t = Math.max(0, hoursSinceWind);
  const atLinearEnd = 1 - m.fallPerDay * (m.linearHours / 24);
  if (t <= m.linearHours) return Math.max(0, 1 - m.fallPerDay * (t / 24));
  if (t >= m.stopHours) return 0;
  return atLinearEnd * (1 - (t - m.linearHours) / (m.stopHours - m.linearHours));
}

/** Exponent relating amplitude to torque: 0.5 for viscous losses, 1 for Coulomb; 0.7 recommended. */
export const AMPLITUDE_EXPONENT = 0.7;

/** Amplitude below which the sim treats the watch as stopped. */
export const STOP_AMPLITUDE_DEG = 120;

/** Amplitude above which the impulse pin strikes the fork's back: "knocking" / rebanking. */
export const KNOCK_AMPLITUDE_DEG = 330;

export function amplitudeFromTorque(fullTorqueAmplitudeDeg: number, torque: number): number {
  return fullTorqueAmplitudeDeg * Math.pow(Math.max(0, torque), AMPLITUDE_EXPONENT);
}

/**
 * Rate corrections that depend on amplitude, s/day. Both are referenced to A_ref so a healthy
 * watch at full wind reads its regulated rate.
 *   escapement error  r_esc = −k_e · (A_ref/A − 1)       always a loss, grows at low amplitude
 *   regulator pins    r_pin = +k_p · (A_ref − A)/10°     a gain at low amplitude in flat-spring watches
 */
export interface IsochronismSpec {
  refAmplitudeDeg: number;
  /** s/day scale of the escapement error; ~8 recommended. */
  escapementCoefficient: number;
  /** s/day per 10° of amplitude from the regulator-pin effect; 0.8 default, ~5–8 when the spring rests on a pin. */
  pinCoefficient: number;
}

export const DEFAULT_ISOCHRONISM: IsochronismSpec = { refAmplitudeDeg: 280, escapementCoefficient: 8, pinCoefficient: 0.8 };

export function escapementErrorSecondsPerDay(s: IsochronismSpec, amplitudeDeg: number): number {
  if (amplitudeDeg <= 0) return 0;
  return -s.escapementCoefficient * (s.refAmplitudeDeg / amplitudeDeg - 1);
}

export function pinErrorSecondsPerDay(s: IsochronismSpec, amplitudeDeg: number): number {
  return s.pinCoefficient * ((s.refAmplitudeDeg - amplitudeDeg) / 10);
}
