/** SVG renderer. Reads state, computes nothing: every coordinate comes from shapes(). */
import { type EscapementParams } from "../core/escapement/params";
import { type EscapementPose } from "../core/escapement/kinematics";
import { shapes, stoneOutline, type Stone } from "../core/escapement/shapes";
import { type Polygon, type Vec, polar, add } from "../core/escapement/geom2d";
import { type AdjustmentShapes } from "../core/escapement/adjustments";

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

/** Which drawn part each control acts on. */
export type Highlight = "regulator" | "beat" | "wind" | "screws" | "poise" | "position" | null;

export function renderMovement(p: EscapementParams, s: EscapementPose, timeMs?: number, adj?: AdjustmentShapes, hot: Highlight = null): string {
  const g = shapes(p, s);
  const R = p.wheelRadius;
  // Square viewBox centred between wheel and balance, so the whole movement can rotate for
  // the watch positions without leaving the frame. Caption sits in the top margin.
  const extentTop = g.balanceCentre.y + g.balanceRadius * 1.3;
  const extentBottom = -R - 10;
  const midY = (extentTop + extentBottom) / 2;
  const rotation = adj?.view.rotationDeg ?? 0;
  // Dial positions keep the tall frame; vertical positions use a square one so the rotated
  // movement stays inside it.
  const tallHalf = Math.max(R, g.balanceRadius) + 40;
  const side = rotation === 0 ? 2 * tallHalf : Math.max(2 * tallHalf, extentTop - extentBottom + 52);
  const half = side / 2;
  const top = rotation === 0 ? extentTop + 30 : midY + half;   // y-up top edge
  const bottom = rotation === 0 ? extentBottom - 12 : midY - half;
  const colour = PHASE_COLOUR[s.phase];
  const stone = (st: Stone, name: string) => {
    const active = s.contact?.stone === name;
    return `<polygon class="stone ${active ? "active" : ""}" points="${pts(stoneOutline(st))}"/>` +
      `<line class="face" x1="${st.corner.x}" y1="${st.corner.y}" x2="${st.letoff.x}" y2="${st.letoff.y}"/>`;
  };
  const bankings = g.bankings.map((q) => `<circle class="banking" cx="${q.x}" cy="${q.y}" r="2"/>`).join("");
  // Balance: three crossing arms through the centre, turning with the balance (same sense as the impulse pin in shapes()).
  const spokes = [0, 60, 120].map((a) => {
    const ang = rad(a - s.balanceAngle);
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
  const adjustments = adj ? (() => {
    const hs = `<polyline class="hairspring" points="${pts(adj.hairspring)}"/>`;
    const t = adj.studTrack;
    // Arc from a0 to a1 (degrees, counter-clockwise if a1 > a0), any span under 360°.
    const arc = (c: Vec, rr: number, a0: number, a1: number) => {
      const span = Math.max(-359.9, Math.min(359.9, a1 - a0));
      const p0 = add(c, polar(rr, rad(a0))), p1 = add(c, polar(rr, rad(a0 + span)));
      return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${rr} ${rr} 0 ${Math.abs(span) > 180 ? 1 : 0} ${span > 0 ? 1 : 0} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    };
    const stud = `<g class="part ${hot === "beat" ? "hot" : ""}"><path class="track" d="${arc(t.centre, t.radius + 5, t.fromDeg, t.toDeg)}"/><circle class="stud" cx="${adj.stud.x}" cy="${adj.stud.y}" r="2.4"/></g>`;
    const rg = adj.regulator;
    // Draw only the outer part of the index arm, from inside the rim to the pointer tip, so it
    // does not cross the spiral.
    const armStart = add(rg.arm[0], polar(adj.studTrack.radius - 6, rad(rg.indexDeg)));
    const regulator = `<g class="part ${hot === "regulator" ? "hot" : ""}"><line class="regulator" x1="${armStart.x}" y1="${armStart.y}" x2="${rg.arm[1].x}" y2="${rg.arm[1].y}"/>` +
      rg.pins.map((q) => `<circle class="regpin" cx="${q.x}" cy="${q.y}" r="1.1"/>`).join("") +
      `<path class="track" d="${arc(t.centre, t.radius * 1.3 + 4, rg.scale.slow && 0 + (adj.regulator.indexDeg - 10), adj.regulator.indexDeg + 10)}"/>` +
      `<text class="mark" transform="translate(${rg.scale.fast.x},${rg.scale.fast.y}) scale(1,-1)" text-anchor="middle">F</text>` +
      `<text class="mark" transform="translate(${rg.scale.slow.x},${rg.scale.slow.y}) scale(1,-1)" text-anchor="middle">S</text></g>`;
    const screws = `<g class="part ${hot === "screws" ? "hot" : ""}">` + adj.screws.map((sc) => `<circle class="screw" cx="${sc.head.x}" cy="${sc.head.y}" r="2.2"/>`).join("") + `</g>`;
    // The poise cut is always drawn while the poising control is active, so an amount of zero still shows where the cut would go.
    const cutShape = adj.poiseCut ?? (hot === "poise" ? { at: adj.screws[0].head, depth: 0 } : null);
    const cut = cutShape ? `<g class="part ${hot === "poise" ? "hot" : ""}"><circle class="cut" cx="${cutShape.at.x}" cy="${cutShape.at.y}" r="${Math.min(5, 1 + cutShape.depth)}"/></g>` : "";
    const heavy = adj.heavySpot ? `<circle class="heavy" cx="${adj.heavySpot.at.x}" cy="${adj.heavySpot.at.y}" r="4"/>` : "";
    // Swing: from the notch centre to each extreme, one arc per direction just outside the rim
    // (the two overlap past 180°, so they sit at different radii), with a ghost pin at each end.
    const sw = adj.swingArc;
    const mid = (sw.fromDeg + sw.toDeg) / 2, amp = (sw.toDeg - sw.fromDeg) / 2;
    const rimR = g.balanceRadius;
    const ghost = (deg: number) => { const q = add(sw.centre, polar(sw.radius, rad(deg))); return `<circle class="ghostpin" cx="${q.x}" cy="${q.y}" r="2.6"/>`; };
    const swing = hot === "wind" ? `<g class="part hot"><path class="swing" d="${arc(sw.centre, rimR + 6, mid, mid + amp)}"/><path class="swing" d="${arc(sw.centre, rimR + 10, mid, mid - amp)}"/>${ghost(mid + amp)}${ghost(mid - amp)}</g>` : "";
    return { hs, stud, regulator, screws, cut, heavy, swing };
  })() : null;
  const gravity = adj ? (adj.view.gravity === "down"
    ? `<g class="gravity ${hot === "position" ? "hot" : ""}" transform="translate(${half - 22},${-top + 20})"><line x1="0" y1="0" x2="0" y2="18"/><polyline points="-4,13 0,18 4,13"/><text x="7" y="14">g</text></g>`
    : `<g class="gravity ${hot === "position" ? "hot" : ""}" transform="translate(${half - 22},${-top + 24})"><circle cx="0" cy="0" r="6"/>${adj.view.gravity === "into-page" ? `<line x1="-4" y1="-4" x2="4" y2="4"/><line x1="-4" y1="4" x2="4" y2="-4"/>` : `<circle cx="0" cy="0" r="1.4" fill="currentColor"/>`}<text x="10" y="4">g</text></g>`) : "";
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
    .hairspring { fill: none; stroke: ${INK}; stroke-width: 0.55 }
    .stud { fill: ${INK} }
    .track { fill: none; stroke: ${INK_FAINT}; stroke-width: 0.6 }
    .regulator { stroke: ${INK}; stroke-width: 1.6; stroke-linecap: round }
    .regpin { fill: ${INK} }
    .mark { font-size: 8px; font-weight: 600; fill: #4a5663 }
    .screw { fill: ${BRASS}; stroke: ${INK}; stroke-width: 0.7 }
    .cut { fill: ${PAPER}; stroke: ${INK}; stroke-width: 0.8; stroke-dasharray: 1.5 1 }
    .heavy { fill: ${RUBY}; stroke: ${INK}; stroke-width: 0.6 }
    .gravity { stroke: #4a5663; fill: none; stroke-width: 1; color: #4a5663 } .gravity text { stroke: none; fill: #4a5663; font-size: 9px; font-style: italic }
    .swing { fill: none; stroke: ${RUBY}; stroke-width: 1.6; stroke-linecap: round }
    .ghostpin { fill: none; stroke: ${RUBY}; stroke-width: 0.9; stroke-dasharray: 1.5 1 }
    /* A control is being moved: its part glows. */
    .part.hot line, .part.hot path, .part.hot circle { stroke: ${RUBY}; stroke-width: 2.2; filter: drop-shadow(0 0 2.5px ${RUBY}99) }
    .part.hot circle.stud, .part.hot circle.regpin, .part.hot circle.screw { fill: ${RUBY_PALE} }
    .part.hot text { fill: ${RUBY}; font-weight: 700 }
    .gravity.hot { stroke: ${RUBY}; color: ${RUBY}; stroke-width: 1.8 } .gravity.hot text { fill: ${RUBY} }
  </style>
  <g transform="scale(1,-1) rotate(${rotation} 0 ${midY})">
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
    ${adjustments ? adjustments.swing + adjustments.screws + adjustments.cut + adjustments.heavy + adjustments.hs + adjustments.stud + adjustments.regulator : ""}
    ${pivot(g.balanceCentre)}
    <circle class="pin" cx="${g.impulsePin.x}" cy="${g.impulsePin.y}" r="2.6"/>
    ${contactDot}
  </g>
  ${gravity}
  <rect class="swatch" x="${-half + 4}" y="${-top + 6}" width="4" height="11"/>
  <text class="phase" x="${-half + 13}" y="${-top + 16}">${note}</text>
  <text class="label" x="${-half + 13}" y="${-top + 29}">balance ${s.balanceAngle.toFixed(1)}°, fork ${s.forkAngle.toFixed(2)}°, wheel ${s.wheelAngle.toFixed(2)}°${timeMs === undefined ? "" : `, t = ${timeMs.toFixed(1)} ms`}</text>
</svg>`;
}
