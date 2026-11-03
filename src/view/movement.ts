/** SVG renderer. Reads state, computes nothing: every coordinate comes from shapes(). */
import { type EscapementParams } from "../core/escapement/params";
import { type EscapementPose } from "../core/escapement/kinematics";
import { shapes, stoneOutline, type Stone } from "../core/escapement/shapes";
import { type Polygon, type Vec, polar, add } from "../core/escapement/geom2d";

const pts = (poly: Polygon) => poly.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(" ");
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Phase colours: lock steel, unlock ochre, impulse ruby, drop green. Shared with the page palette. */
const PHASE_COLOUR: Record<string, string> = {
  lock: "#2b5c8a", unlock: "#b07d10", impulse: "#b2322b", drop: "#4e7d3a",
};
const PHASE_NAME: Record<string, string> = { lock: "Lock", unlock: "Unlock", impulse: "Impulse", drop: "Drop" };

/* Drawing palette: blue-black ink on paper, brass for the wheel and lever, ruby for every jewel. */
const INK = "#1c2733";
const INK_FAINT = "#8d97a0";
const PAPER = "#fbfcf8";
const BRASS = "#f1ead6";
const RUBY = "#b2322b";
const RUBY_PALE = "#f2d9d6";

/** Drafting centre mark: a small cross through a pivot. Pure decoration around a point the sim supplied. */
const centreMark = (c: Vec, r: number) =>
  `<g class="centremark"><line x1="${c.x - r}" y1="${c.y}" x2="${c.x + r}" y2="${c.y}"/><line x1="${c.x}" y1="${c.y - r}" x2="${c.x}" y2="${c.y + r}"/></g>`;

/** A jewelled pivot: ruby hole jewel with the pivot drawn through it. */
const pivot = (c: Vec) =>
  `<circle class="jewel" cx="${c.x}" cy="${c.y}" r="3.4"/><circle class="pivot" cx="${c.x}" cy="${c.y}" r="1.3"/>`;

export function renderMovement(p: EscapementParams, s: EscapementPose, timeMs?: number): string {
  const g = shapes(p, s);
  const R = p.wheelRadius;
  // Margins: room above the balance for the two-line caption, a little either side.
  const top = g.balanceCentre.y + g.balanceRadius + 46;
  const bottom = -R - 22;
  const half = Math.max(R, g.balanceRadius) + 40;
  const colour = PHASE_COLOUR[s.phase];
  const stone = (st: Stone, name: string) => {
    const active = s.contact?.stone === name;
    return `<polygon class="stone ${active ? "active" : ""}" points="${pts(stoneOutline(st))}"/>` +
      `<line class="face" x1="${st.corner.x}" y1="${st.corner.y}" x2="${st.letoff.x}" y2="${st.letoff.y}"/>`;
  };
  const bankings = g.bankings.map((q) => `<circle class="banking" cx="${q.x}" cy="${q.y}" r="2"/>`).join("");
  // Balance: three crossing arms through the centre, turning with the balance.
  const spokes = [0, 60, 120].map((a) => {
    const ang = rad(a + s.balanceAngle);
    const q1 = add(g.balanceCentre, polar(g.balanceRadius, ang)), q2 = add(g.balanceCentre, polar(g.balanceRadius, ang + Math.PI));
    return `<line class="spoke" x1="${q1.x}" y1="${q1.y}" x2="${q2.x}" y2="${q2.y}"/>`;
  }).join("");
  // Escape wheel: a crossed-out brass wheel, five arms turning with the teeth (same angle convention as toothPolygons).
  const arms = [0, 1, 2, 3, 4].map((k) => {
    const ang = rad(90 - s.wheelAngle + k * 72);
    const q1 = polar(0.14 * R, ang), q2 = polar(0.66 * R, ang);
    return `<line class="arm" x1="${q1.x}" y1="${q1.y}" x2="${q2.x}" y2="${q2.y}"/>`;
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
    return best ? `<circle class="contact" cx="${best.x}" cy="${best.y}" r="3.2"/>` : "";
  })();
  const note = s.contact ? `${PHASE_NAME[s.phase]} on the ${s.contact.stone} pallet, ${s.contact.face} face` : `${PHASE_NAME[s.phase]}, wheel free`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-top} ${2 * half} ${top - bottom}" data-phase="${s.phase}" font-family="Avenir Next, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif">
  <style>
    .wheel { fill: ${BRASS}; stroke: ${INK}; stroke-width: 1.1 }
    .wheel-web { fill: ${PAPER}; stroke: ${INK}; stroke-width: 0.6 }
    .arm { stroke: ${INK}; stroke-width: 1.4; stroke-linecap: round }
    .tooth { fill: ${BRASS}; stroke: ${INK}; stroke-width: 0.9; stroke-linejoin: round }
    .stone { fill: ${RUBY_PALE}; stroke: ${INK}; stroke-width: 0.9 }
    .stone.active { fill: ${colour}33 }
    .face { stroke: ${colour}; stroke-width: 1.8; stroke-linecap: round }
    .lever { fill: ${BRASS}; stroke: ${INK}; stroke-width: 1 }
    .jewel { fill: ${RUBY_PALE}; stroke: ${INK}; stroke-width: 0.7 }
    .pivot { fill: ${INK} }
    .centremark line { stroke: ${INK_FAINT}; stroke-width: 0.5 }
    .balance { fill: none; stroke: ${INK}; stroke-width: 3.4 }
    .spoke { stroke: ${INK}; stroke-width: 0.8 }
    .pin { fill: ${RUBY}; stroke: ${INK}; stroke-width: 0.5 }
    .centreline { fill: none; stroke: ${INK_FAINT}; stroke-width: 0.5; stroke-dasharray: 6 2 1.2 2 }
    .banking { fill: ${INK} }
    .contact { fill: none; stroke: ${colour}; stroke-width: 1.2 }
    .label { font-size: 9.5px; fill: #4a5663 }
    .phase { font-size: 12.5px; font-weight: 600; fill: ${colour} }
    .swatch { fill: ${colour} }
  </style>
  <g transform="scale(1,-1)">
    <circle class="centreline" cx="0" cy="0" r="${R}"/>
    <circle class="wheel" cx="0" cy="0" r="${0.8 * R}"/>
    <circle class="wheel-web" cx="0" cy="0" r="${0.68 * R}"/>
    ${arms}
    ${g.teeth.map((t) => `<polygon class="tooth" points="${pts(t)}"/>`).join("")}
    ${centreMark({ x: 0, y: 0 }, 0.9 * R)}
    ${pivot({ x: 0, y: 0 })}
    ${g.arms.map((a) => `<polygon class="lever" points="${pts(a)}"/>`).join("")}
    <polygon class="lever" points="${pts(g.lever)}"/>
    ${stone(g.entryStone, "entry")}
    ${stone(g.exitStone, "exit")}
    ${pivot(g.forkPivot)}
    ${bankings}
    <circle class="centreline" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="${g.pinRadius}"/>
    ${centreMark(g.balanceCentre, g.balanceRadius + 8)}
    <circle class="balance" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="${g.balanceRadius}"/>
    ${spokes}
    ${pivot(g.balanceCentre)}
    <circle class="pin" cx="${g.impulsePin.x}" cy="${g.impulsePin.y}" r="2.6"/>
    ${contactDot}
  </g>
  <rect class="swatch" x="${-half + 4}" y="${-top + 6}" width="4" height="11"/>
  <text class="phase" x="${-half + 13}" y="${-top + 16}">${note}</text>
  <text class="label" x="${-half + 13}" y="${-top + 29}">balance ${s.balanceAngle.toFixed(1)}°, fork ${s.forkAngle.toFixed(2)}°, wheel ${s.wheelAngle.toFixed(2)}°${timeMs === undefined ? "" : `, t = ${timeMs.toFixed(1)} ms`}</text>
</svg>`;
}
