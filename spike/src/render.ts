/** SVG renderer. Reads state, computes nothing: every coordinate comes from shapes(). */
import { type EscapementParams } from "./params";
import { type EscapementState } from "./sim";
import { shapes, stoneOutline, type Stone } from "./shapes";
import { type Polygon, type Vec, polar, add } from "./geom2d";

const pts = (poly: Polygon) => poly.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(" ");

const PHASE_COLOUR: Record<string, string> = {
  lock: "#1f6f8b", unlock: "#c08a00", impulse: "#b3261e", drop: "#5a7d2a",
};

export function renderSvg(p: EscapementParams, s: EscapementState): string {
  const g = shapes(p, s);
  const R = p.wheelRadius;
  const top = g.balanceCentre.y + g.balanceRadius + 20;
  const bottom = -R - 20;
  const half = Math.max(R, g.balanceRadius) + 40;
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
    return best ? `<circle class="contact" cx="${best.x}" cy="${best.y}" r="2.2"/>` : "";
  })();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-top} ${2 * half} ${top - bottom}" data-phase="${s.phase}" data-t="${s.t}">
  <style>
    .wheel { fill: #fff; stroke: #222; stroke-width: 0.8 }
    .tooth { fill: #fff; stroke: #222; stroke-width: 0.8; stroke-linejoin: round }
    .stone { fill: #e9eef3; stroke: #222; stroke-width: 0.8 }
    .stone.active { fill: ${PHASE_COLOUR[s.phase]}22 }
    .face { stroke: ${PHASE_COLOUR[s.phase]}; stroke-width: 1.2 }
    .lever { fill: #fff; stroke: #222; stroke-width: 0.8 }
    .pivot { fill: #222 }
    .balance { fill: none; stroke: #222; stroke-width: 1.2 }
    .spoke { stroke: #222; stroke-width: 0.6 }
    .pin { fill: #b3261e }
    .pinorbit { fill: none; stroke: #999; stroke-width: 0.4; stroke-dasharray: 2 2 }
    .banking { fill: #444 }
    .contact { fill: none; stroke: ${PHASE_COLOUR[s.phase]}; stroke-width: 1 }
    .label { font: 9px ui-monospace, monospace; fill: #222 }
    .phase { font: 11px ui-monospace, monospace; font-weight: 600; fill: ${PHASE_COLOUR[s.phase]} }
  </style>
  <g transform="scale(1,-1)">
    <circle class="wheel" cx="0" cy="0" r="${0.8 * R}"/>
    <circle class="pinorbit" cx="0" cy="0" r="${R}"/>
    ${g.teeth.map((t) => `<polygon class="tooth" points="${pts(t)}"/>`).join("")}
    <circle class="pivot" cx="0" cy="0" r="2"/>
    ${g.arms.map((a) => `<polygon class="lever" points="${pts(a)}"/>`).join("")}
    <polygon class="lever" points="${pts(g.lever)}"/>
    ${stone(g.entryStone, "entry")}
    ${stone(g.exitStone, "exit")}
    <circle class="pivot" cx="${g.forkPivot.x}" cy="${g.forkPivot.y}" r="2"/>
    ${bankings}
    <circle class="pinorbit" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="${g.pinRadius}"/>
    <circle class="balance" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="${g.balanceRadius}"/>
    ${spokes}
    <circle class="pivot" cx="${g.balanceCentre.x}" cy="${g.balanceCentre.y}" r="2"/>
    <circle class="pin" cx="${g.impulsePin.x}" cy="${g.impulsePin.y}" r="2.5"/>
    ${contactDot}
  </g>
  <text class="phase" x="${-half + 6}" y="${-top + 14}">${s.phase.toUpperCase()}${s.contact ? ` · ${s.contact.stone} pallet, ${s.contact.face} face` : " · wheel free"}</text>
  <text class="label" x="${-half + 6}" y="${-top + 26}">balance ${s.balanceAngle.toFixed(1)}°  fork ${s.forkAngle.toFixed(2)}°  wheel ${s.wheelAngle.toFixed(2)}°  t=${(s.t * 1000).toFixed(1)} ms</text>
</svg>`;
}
