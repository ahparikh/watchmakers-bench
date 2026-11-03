/** SVG renderer. Reads state, computes nothing: every coordinate comes from shapes(). */
import { type EscapementParams } from "../core/escapement/params";
import { type EscapementPose } from "../core/escapement/kinematics";
import { shapes, stoneOutline, type Stone } from "../core/escapement/shapes";
import { type Polygon, type Vec, polar, add } from "../core/escapement/geom2d";

const pts = (poly: Polygon) => poly.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(" ");

/** Phase colours: lock steel, unlock ochre, impulse ruby, drop green. Shared with the page palette. */
const PHASE_COLOUR: Record<string, string> = {
  lock: "#2b5c8a", unlock: "#b07d10", impulse: "#b2322b", drop: "#4e7d3a",
};
const PHASE_NAME: Record<string, string> = { lock: "Lock", unlock: "Unlock", impulse: "Impulse", drop: "Drop" };

const INK = "#1c2733";

/** Drafting centre mark: a small cross through a pivot. Pure decoration around a point the sim supplied. */
const centreMark = (c: Vec, r: number) =>
  `<g class="centremark"><line x1="${c.x - r}" y1="${c.y}" x2="${c.x + r}" y2="${c.y}"/><line x1="${c.x}" y1="${c.y - r}" x2="${c.x}" y2="${c.y + r}"/></g>`;

export function renderMovement(p: EscapementParams, s: EscapementPose, timeMs?: number): string {
  const g = shapes(p, s);
  const R = p.wheelRadius;
  const top = g.balanceCentre.y + g.balanceRadius + 24;
  const bottom = -R - 24;
  const half = Math.max(R, g.balanceRadius) + 44;
  const colour = PHASE_COLOUR[s.phase];
  const stone = (st: Stone, name: string) => {
    const active = s.contact?.stone === name;
    return `<polygon class="stone ${active ? "active" : ""}" points="${pts(stoneOutline(st))}"/>` +
      `<line class="face" x1="${st.corner.x}" y1="${st.corner.y}" x2="${st.letoff.x}" y2="${st.letoff.y}"/>`;
  };
  const bankings = g.bankings.map((q) => `<circle class="banking" cx="${q.x}" cy="${q.y}" r="1.8"/>`).join("");
  const spokes = [0, 60, 120].map((a) => {
    const ang = (a + s.balanceAngle) * Math.PI / 180;
    const q1 = add(g.balanceCentre, polar(g.balanceRadius, ang)), q2 = add(g.balanceCentre, polar(g.balanceRadius, ang + Math.PI));
    return `<line class="spoke" x1="${q1.x}" y1="${q1.y}" x2="${q2.x}" y2="${q2.y}"/>`;
  }).join("");
  const contactDot = (() => {
    if (!s.contact) return "";
    // The tooth tip nearest the active stone's faces.
    const st = s.contact.stone === "entry" ? g.entryStone : g.exitStone;
    let best: Vec | null = null, bd = Infinity;
    for (const tooth of g.teeth) {
      const tip = tooth[0];
      const dd = Math.min(Math.hypot(tip.x - st.corner.x, tip.y - st.corner.y), Math.hypot(tip.x - st.letoff.x, tip.y - st.letoff.y));
      if (dd < bd) { bd = dd; best = tip; }
    }
    return best ? `<circle class="contact" cx="${best.x}" cy="${best.y}" r="2.6"/>` : "";
  })();
  const note = s.contact ? `${PHASE_NAME[s.phase]} on the ${s.contact.stone} pallet, ${s.contact.face} face` : `${PHASE_NAME[s.phase]}, wheel free`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-top} ${2 * half} ${top - bottom}" data-phase="${s.phase}" font-family="Avenir Next, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif">
  <style>
    .wheel { fill: #fbfcf8; stroke: ${INK}; stroke-width: 1 }
    .tooth { fill: #fbfcf8; stroke: ${INK}; stroke-width: 0.9; stroke-linejoin: round }
    .stone { fill: #e4e9ee; stroke: ${INK}; stroke-width: 0.9 }
    .stone.active { fill: ${colour}2e }
    .face { stroke: ${colour}; stroke-width: 1.6; stroke-linecap: round }
    .lever { fill: #fbfcf8; stroke: ${INK}; stroke-width: 1 }
    .pivot { fill: #fbfcf8; stroke: ${INK}; stroke-width: 0.9 }
    .centremark line { stroke: ${INK}; stroke-width: 0.5 }
    .balance { fill: none; stroke: ${INK}; stroke-width: 3.2 }
    .balance-inner { fill: none; stroke: ${INK}; stroke-width: 0.5 }
    .spoke { stroke: ${INK}; stroke-width: 0.7 }
    .pin { fill: #b2322b; stroke: ${INK}; stroke-width: 0.5 }
    .centreline { fill: none; stroke: #7c8792; stroke-width: 0.5; stroke-dasharray: 6 2 1.2 2 }
    .banking { fill: ${INK} }
    .contact { fill: none; stroke: ${colour}; stroke-width: 1.1 }
    .label { font-size: 9.5px; fill: #4a5663 }
    .phase { font-size: 12px; font-weight: 600; fill: ${colour} }
    .swatch { fill: ${colour} }
  </style>
  <g transform="scale(1,-1)">
    <circle class="centreline" cx="0" cy="0" r="${R}"/>
    <circle class="wheel" cx="0" cy="0" r="${0.8 * R}"/>
    ${g.teeth.map((t) => `<polygon class="tooth" points="${pts(t)}"/>`).join("")}
    ${centreMark({ x: 0, y: 0 }, 0.9 * R)}
    <circle class="pivot" cx="0" cy="0" r="2.2"/>
    ${g.arms.map((a) => `<polygon class="lever" points="${pts(a)}"/>`).join("")}
    <polygon class="lever" points="${pts(g.lever)}"/>
    ${stone(g.entryStone, "entry")}
    ${stone(g.exitStone, "exit")}
    <circle class="pivot" cx="${g.forkPivot.x}" cy="${g.forkPivot.y}" r="2.2"/>
    ${bankings}
    <circle class="centreline" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="${g.pinRadius}"/>
    ${centreMark(g.balanceCentre, g.balanceRadius + 8)}
    <circle class="balance" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="${g.balanceRadius}"/>
    ${spokes}
    <circle class="pivot" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="2.2"/>
    <circle class="pin" cx="${g.impulsePin.x}" cy="${g.impulsePin.y}" r="2.6"/>
    ${contactDot}
  </g>
  <rect class="swatch" x="${-half + 6}" y="${-top + 7}" width="4" height="10"/>
  <text class="phase" x="${-half + 15}" y="${-top + 16}">${note}</text>
  <text class="label" x="${-half + 15}" y="${-top + 29}">balance ${s.balanceAngle.toFixed(1)}°, fork ${s.forkAngle.toFixed(2)}°, wheel ${s.wheelAngle.toFixed(2)}°${timeMs === undefined ? "" : `, t = ${timeMs.toFixed(1)} ms`}</text>
</svg>`;
}
