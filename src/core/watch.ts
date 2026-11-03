/**
 * The whole watch as one pure reading: given a calibre, its faults, the user's adjustments and
 * the hours since winding, what is the balance doing right now? Everything the views and the
 * timegrapher need derives from this; nothing here draws or accumulates.
 */
import { type BalanceSpec, type RateAdjustments, period as balancePeriod, nominalPeriod, rateSecondsPerDay } from "./oscillator/period";
import { type MainspringSpec, type IsochronismSpec, torqueFraction, amplitudeFromTorque, escapementErrorSecondsPerDay, pinErrorSecondsPerDay, STOP_AMPLITUDE_DEG, KNOCK_AMPLITUDE_DEG } from "./oscillator/amplitude";
import { poiseRateSecondsPerDay } from "./oscillator/poise";

export type Position = "DU" | "DD" | "CU" | "CR" | "CD" | "CL";

export const POSITIONS: { id: Position; label: string; tilt: number; /** balance angle that points straight down at rest */ down: number }[] = [
  { id: "DU", label: "dial up", tilt: 0, down: 0 },
  { id: "DD", label: "dial down", tilt: 0, down: 0 },
  { id: "CU", label: "crown up", tilt: Math.PI / 2, down: 0 },
  { id: "CR", label: "crown right", tilt: Math.PI / 2, down: 90 },
  { id: "CD", label: "crown down", tilt: Math.PI / 2, down: 180 },
  { id: "CL", label: "crown left", tilt: Math.PI / 2, down: 270 },
];

export interface WatchSpec {
  beatRate: number;
  liftAngle: number;
  balance: BalanceSpec;
  mainspring: MainspringSpec;
  isochronism: IsochronismSpec;
  /** Amplitude dial up at full torque, and how much less in any vertical position. */
  fullWindAmplitudeDeg: number;
  verticalDropDeg: number;
}

/** Hidden faults a puzzle bakes into the watch, plus the user's adjustments on top. */
export interface WatchSettings extends RateAdjustments {
  /** Notch centre's angle from the hairspring rest, degrees. Zero = in beat. */
  beatOffsetDeg: number;
  /** Balance unbalance, kg·m, and where the heavy spot sits on the rim, degrees. */
  unbalance: number;
  heavySpotDeg: number;
  /** The watchmaker's poising correction: weight removed at `poiseCorrectionDeg` on the rim,
   *  expressed as the unbalance it would create on its own (kg·m). Sums as a vector with the fault. */
  poiseCorrection: number;
  poiseCorrectionDeg: number;
  position: Position;
  hoursSinceWind: number;
}

export interface WatchReading {
  running: boolean;
  knocking: boolean;
  amplitudeDeg: number;
  torqueFraction: number;
  /** True period of the balance including every error term, seconds. */
  period: number;
  /** Rate the watch actually keeps, s/day, and its decomposition. */
  rateSecondsPerDay: number;
  rateTerms: { regulation: number; escapement: number; pins: number; poise: number; knocking: number };
  beatOffsetDeg: number;
  liftAngle: number;
  /** Net unbalance after correction, kg·m, and where its heavy spot sits, degrees. */
  netUnbalance: number;
  netHeavySpotDeg: number;
}

export const ZERO_SETTINGS: WatchSettings = { regulatorIndex: 0, inertiaTrim: 0, beatOffsetDeg: 0, unbalance: 0, heavySpotDeg: 0, poiseCorrection: 0, poiseCorrectionDeg: 0, position: "DU", hoursSinceWind: 0 };

/** Vector sum of the fault's heavy spot and the correction (removing weight at an angle is adding
 *  an opposite unbalance there). Returns magnitude and heavy-spot angle. */
export function netPoise(s: WatchSettings): { unbalance: number; heavySpotDeg: number } {
  const r = (d: number) => (d * Math.PI) / 180;
  const x = s.unbalance * Math.cos(r(s.heavySpotDeg)) - s.poiseCorrection * Math.cos(r(s.poiseCorrectionDeg));
  const y = s.unbalance * Math.sin(r(s.heavySpotDeg)) - s.poiseCorrection * Math.sin(r(s.poiseCorrectionDeg));
  const mag = Math.hypot(x, y);
  return { unbalance: mag, heavySpotDeg: mag < 1e-18 ? 0 : (Math.atan2(y, x) * 180) / Math.PI };
}

export function readWatch(w: WatchSpec, s: WatchSettings): WatchReading {
  const pos = POSITIONS.find((p) => p.id === s.position)!;
  const torque = torqueFraction(w.mainspring, s.hoursSinceWind);
  const fullAmp = w.fullWindAmplitudeDeg - (pos.tilt > 0 ? w.verticalDropDeg : 0);
  let amplitude = amplitudeFromTorque(fullAmp, torque);
  const knocking = amplitude > KNOCK_AMPLITUDE_DEG;
  if (knocking) amplitude = KNOCK_AMPLITUDE_DEG;
  const running = amplitude >= STOP_AMPLITUDE_DEG;

  const nominal = nominalPeriod(w.beatRate);
  const regulation = rateSecondsPerDay(balancePeriod(w.balance, s), nominal);
  const escapement = running ? escapementErrorSecondsPerDay(w.isochronism, amplitude) : 0;
  const pins = running ? pinErrorSecondsPerDay(w.isochronism, amplitude) : 0;
  const omega0 = (2 * Math.PI) / nominal;
  const net = netPoise(s);
  const poise = running
    ? poiseRateSecondsPerDay({ unbalance: net.unbalance, heavySpotAngle: ((net.heavySpotDeg - pos.down) * Math.PI) / 180, tilt: pos.tilt, inertia: w.balance.inertia, omega0, amplitude: (amplitude * Math.PI) / 180 })
    : 0;
  const knock = knocking ? 120 : 0;
  const rate = regulation + escapement + pins + poise + knock;
  return {
    running,
    knocking,
    amplitudeDeg: running ? amplitude : 0,
    torqueFraction: torque,
    period: nominal / (1 + rate / 86400),
    rateSecondsPerDay: rate,
    rateTerms: { regulation, escapement, pins, poise, knocking: knock },
    beatOffsetDeg: s.beatOffsetDeg,
    liftAngle: w.liftAngle,
    netUnbalance: net.unbalance,
    netHeavySpotDeg: net.heavySpotDeg,
  };
}
