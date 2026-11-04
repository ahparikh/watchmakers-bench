import { describe, it, expect } from "vitest";
import { shapes } from "../../src/core/escapement/shapes";
import { forkFor } from "../../src/core/escapement/kinematics";
import { VINTAGE_18000 } from "../../src/catalog/vintage18000";

describe("impulse pin and notch", () => {
  it("the pin sits between the horns whenever it is inside the lift angle", () => {
    const esc = VINTAGE_18000.escapement;
    for (let bal = -esc.liftAngle / 2; bal <= esc.liftAngle / 2; bal += 2) {
      const g = shapes(esc, { balanceAngle: bal, forkAngle: forkFor(esc, bal), wheelAngle: 0 });
      const left = g.lever[7], right = g.lever[6]; // notch floor corners
      const lo = Math.min(left.x, right.x), hi = Math.max(left.x, right.x);
      expect(g.impulsePin.x).toBeGreaterThan(lo);
      expect(g.impulsePin.x).toBeLessThan(hi);
    }
  });
});
