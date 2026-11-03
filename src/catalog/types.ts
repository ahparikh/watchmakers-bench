/** One calibre = one parameter set for the same simulation core. A new watch is data, not code. */
import type { EscapementParams } from "../core/escapement/params";

export interface Calibre {
  id: string;
  name: string;
  /** Beats per hour. */
  beatRate: number;
  /** Lift angle the timegrapher must assume for this calibre, degrees. */
  liftAngle: number;
  /** Balance moment of inertia, kg·m². */
  inertia: number;
  /** Hairspring active length at the reference index, m, and outer coil radius, m. */
  activeLength: number;
  regulatorRadius: number;
  /** Escapement geometry for the drawing. */
  escapement: EscapementParams;
  /** Amplitude model: filled from docs/research/03 once it lands. */
  amplitude: AmplitudeModel;
  /** Which puzzles apply. */
  puzzles: string[];
}

export interface AmplitudeModel {
  /** Amplitude dial up at full wind, degrees. */
  fullWindDeg: number;
  /** Amplitude dial up after 24 h, degrees. */
  afterDayDeg: number;
  /** Run time from full wind to stop, hours. */
  reserveHours: number;
  /** Amplitude lost in any vertical position, degrees. */
  verticalDropDeg: number;
}
