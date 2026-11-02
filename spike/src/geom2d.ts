export type Vec = { x: number; y: number };
export type Polygon = Vec[];

export const v = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => v(a.x + b.x, a.y + b.y);
export const sub = (a: Vec, b: Vec): Vec => v(a.x - b.x, a.y - b.y);
export const scale = (a: Vec, k: number): Vec => v(a.x * k, a.y * k);
export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
export const len = (a: Vec) => Math.hypot(a.x, a.y);
export const polar = (r: number, angleRad: number): Vec => v(r * Math.cos(angleRad), r * Math.sin(angleRad));

/** Rotate point about a centre by angle (radians, counter-clockwise in y-up coordinates). */
export function rotateAbout(pt: Vec, centre: Vec, angleRad: number): Vec {
  const d = sub(pt, centre);
  const c = Math.cos(angleRad), s = Math.sin(angleRad);
  return add(centre, v(d.x * c - d.y * s, d.x * s + d.y * c));
}

/** Separating-axis test for two convex polygons. Returns penetration depth (>0 means overlap). */
export function penetration(a: Polygon, b: Polygon): number {
  let minOverlap = Infinity;
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const axis = v(-(q.y - p.y), q.x - p.x);
      const l = len(axis);
      if (l === 0) continue;
      const n = scale(axis, 1 / l);
      const [a0, a1] = project(a, n), [b0, b1] = project(b, n);
      const overlap = Math.min(a1, b1) - Math.max(a0, b0);
      if (overlap < minOverlap) minOverlap = overlap;
    }
  }
  return minOverlap;
}

function project(poly: Polygon, n: Vec): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const p of poly) { const d = dot(p, n); if (d < lo) lo = d; if (d > hi) hi = d; }
  return [lo, hi];
}

/** Distance from a point to a segment. */
export function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const ab = sub(b, a), ap = sub(p, a);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / Math.max(dot(ab, ab), 1e-12)));
  return len(sub(p, add(a, scale(ab, t))));
}
