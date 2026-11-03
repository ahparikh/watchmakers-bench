/** Incremental tick stream: extends a window of ticks from the current watch reading. */
import type { Tick } from "../core/oscillator/ticks";
import { beatIntervals } from "../core/oscillator/ticks";
import type { WatchReading } from "../core/watch";

export interface TickWindow { ticks: Tick[]; nextParity: 0 | 1; nextTime: number }

export const emptyWindow = (): TickWindow => ({ ticks: [], nextParity: 0, nextTime: 0 });

/** Append every tick due up to `untilTime` (sim seconds), keeping at most `keep` ticks. */
export function advanceTicks(win: TickWindow, r: WatchReading, untilTime: number, keep: number): TickWindow {
  if (!r.running) return win;
  const src = { period: r.period, amplitude: r.amplitudeDeg, beatOffset: r.beatOffsetDeg, liftAngle: r.liftAngle };
  const [d1, d2] = beatIntervals(src);
  const omega = (2 * Math.PI) / r.period;
  const half = r.liftAngle / 2, A = r.amplitudeDeg, c = r.beatOffsetDeg;
  const clamp = (x: number) => Math.max(-A, Math.min(A, x));
  const lift = Math.abs(Math.asin(clamp(c + half) / A) - Math.asin(clamp(c - half) / A)) / omega;
  const ticks = win.ticks.slice();
  let t = win.nextTime, parity = win.nextParity;
  let guard = 0;
  while (t <= untilTime && guard++ < 100000) {
    ticks.push({ t, liftDuration: lift, parity });
    t += parity === 0 ? d1 : d2;
    parity = parity === 0 ? 1 : 0;
  }
  return { ticks: ticks.length > keep ? ticks.slice(ticks.length - keep) : ticks, nextParity: parity, nextTime: t };
}
