/** Bessel function of the first kind, order 1, by power series (converges for all x; fine below ~30). */
export function besselJ1(x: number): number {
  const half = x / 2;
  let term = half; // k = 0: (x/2)^1 / (0! 1!)
  let sum = term;
  for (let k = 1; k < 60; k++) {
    term *= -(half * half) / (k * (k + 1));
    sum += term;
    if (Math.abs(term) < 1e-17 * Math.abs(sum)) break;
  }
  return sum;
}
