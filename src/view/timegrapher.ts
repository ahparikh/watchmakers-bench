/** Timegrapher panel: trace plus readouts. Reads a Reading; computes nothing but pixels. */
import type { Reading } from "../core/timegrapher/analyze";

export interface TimegrapherView {
  reading: Reading | null;
  nominalPeriod: number;
  liftAngle: number;
  running: boolean;
  knocking: boolean;
  /** Sim seconds the trace spans, for the honest label. */
  spanSeconds: number;
  /** Sim seconds per wall second, for the honest label. */
  speedup: number;
}

const fmt = (x: number, d: number) => (Math.abs(x) < 0.5 * 10 ** -d ? "" : x > 0 ? "+" : "−") + Math.abs(x).toFixed(d);

export function renderTimegrapher(v: TimegrapherView): string {
  const W = 420, H = 300, pad = 36;
  const beatMs = (v.nominalPeriod / 2) * 1000;
  const yRange = Math.min(20, beatMs / 2); // ±20 ms, wrapping like a real machine's screen
  const r = v.reading;
  const dots = r
    ? r.trace.map((p) => {
        const x = pad + ((W - 2 * pad) * p.beat) / Math.max(1, r.trace.length - 1);
        let off = ((p.offsetMs + yRange) % (2 * yRange) + 2 * yRange) % (2 * yRange) - yRange; // wrap
        const y = H / 2 - (off / yRange) * (H / 2 - pad);
        return `<circle class="dot p${p.parity}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5"/>`;
      }).join("")
    : "";
  const rate = r && v.running ? fmt(r.rateSecondsPerDay, 0) : "—";
  const amp = r && v.running ? r.amplitudeDeg.toFixed(0) : "—";
  const be = r && v.running ? r.beatErrorMs.toFixed(1) : "—";
  // Faint horizontal grid at ±10 ms: half the screen range, purely a reading aid.
  const gridY = [H / 2 - (H / 2 - pad) / 2, H / 2 + (H / 2 - pad) / 2];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H + 84}" class="timegrapher" data-rate="${r?.rateSecondsPerDay ?? ""}">
  <rect x="0" y="0" width="${W}" height="${H}" rx="2" class="screen"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="2" class="screen-edge"/>
  ${gridY.map((y) => `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" class="grid"/>`).join("")}
  <line x1="${pad}" y1="${H / 2}" x2="${W - pad}" y2="${H / 2}" class="axis"/>
  <text x="${pad}" y="${pad - 10}" class="axislabel">+${yRange.toFixed(0)} ms</text>
  <text x="${pad}" y="${H - pad + 18}" class="axislabel">−${yRange.toFixed(0)} ms</text>
  <text x="${W - pad}" y="${H - pad + 18}" class="axislabel" text-anchor="end">${v.spanSeconds.toFixed(0)} s of ticks at ${v.speedup}× time</text>
  ${v.knocking ? `<text x="${W / 2}" y="${H / 2}" class="warn" text-anchor="middle">Knocking: amplitude unreliable</text>` : ""}
  ${v.running ? dots : `<text x="${W / 2}" y="${H / 2}" class="warn" text-anchor="middle">No signal. The watch has stopped.</text>`}
  <g class="readouts" transform="translate(0,${H + 10})">
    <line x1="${W / 3}" y1="8" x2="${W / 3}" y2="56" class="divider"/>
    <line x1="${2 * W / 3}" y1="8" x2="${2 * W / 3}" y2="56" class="divider"/>
    <text x="${pad}" y="34" class="big">${rate}<tspan class="unit"> s/day</tspan></text>
    <text x="${W / 2}" y="34" class="big" text-anchor="middle">${amp}<tspan class="unit">°</tspan></text>
    <text x="${W - pad}" y="34" class="big" text-anchor="end">${be}<tspan class="unit"> ms</tspan></text>
    <text x="${pad}" y="56" class="small">rate</text>
    <text x="${W / 2}" y="56" class="small" text-anchor="middle">amplitude at ${v.liftAngle}° lift angle</text>
    <text x="${W - pad}" y="56" class="small" text-anchor="end">beat error</text>
  </g>
</svg>`;
}
