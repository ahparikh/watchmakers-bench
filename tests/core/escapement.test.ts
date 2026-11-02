import { describe, it, expect } from "vitest";
import { derived, deg, type EscapementParams } from "../../src/core/escapement/params";
import { initialPose, step, CONTACT_TOL, type EscapementPose, type Phase } from "../../src/core/escapement/kinematics";
import { shapes, stonePenetration } from "../../src/core/escapement/shapes";

/** Spike geometry; the catalog will own real values once research lands. */
const p: EscapementParams = {
  teeth: 15, wheelRadius: 100, liftAngle: 52, lockAngle: 1.5, liftLever: 8, runToBanking: 0.5,
  drop: 2, freeRunSpeed: 8000, forkLength: 110, balanceRadius: 60,
};
const AMPLITUDE = 270;
const T = 0.4; // 18,000 bph
const beat = T / 2;
const d = derived(p);

/** Drive the stepper with a sinusoid from t = T/4 (balance at +amplitude, fork parked) for `periods`. */
function trajectory(periods: number, stepsPerPeriod = 4000) {
  const bal = (t: number) => AMPLITUDE * Math.sin((2 * Math.PI * t) / T);
  const t0 = T / 4;
  const dt = T / stepsPerPeriod;
  const out: { t: number; pose: EscapementPose }[] = [];
  let pose = initialPose(p, bal(t0));
  out.push({ t: t0, pose });
  for (let i = 1; i <= periods * stepsPerPeriod; i++) {
    const t = t0 + i * dt;
    pose = step(p, pose, bal(t), dt);
    out.push({ t, pose });
  }
  return out;
}
const traj = trajectory(2);
const at = (t: number) => traj.reduce((best, s) => (Math.abs(s.t - t) < Math.abs(best.t - t) ? s : best)).pose;

describe("escape wheel", () => {
  it("advances exactly half a tooth per beat, measured from any locked instant", () => {
    let checked = 0;
    for (const { t, pose } of traj.filter((_, i) => i % 20 === 0)) {
      if (pose.phase !== "lock" || t + beat > traj[traj.length - 1].t) continue;
      const b = at(t + beat);
      expect(b.phase).toBe("lock");
      expect(b.wheelAngle - pose.wheelAngle).toBeCloseTo(d.pitch / 2, 3);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("advances exactly one tooth per full period", () => {
    expect(at(T / 4 + 0.123 + T).wheelAngle - at(T / 4 + 0.123).wheelAngle).toBeCloseTo(d.pitch, 3);
  });

  it("never runs backward beyond numerical noise", () => {
    for (let i = 1; i < traj.length; i++) expect(traj[i].pose.wheelAngle).toBeGreaterThanOrEqual(traj[i - 1].pose.wheelAngle - 1e-3);
  });

  it("is stationary while locked with the pin out of the notch", () => {
    const parked = (s: EscapementPose) => s.phase === "lock" && Math.abs(s.balanceAngle) > p.liftAngle / 2;
    let checked = 0;
    for (let i = 1; i < traj.length; i++) {
      if (parked(traj[i].pose) && parked(traj[i - 1].pose)) {
        checked++;
        // The contact solver may settle the tooth up to CONTACT_TOL deeper into the face; in wheel degrees that is ~6e-7.
        expect(traj[i].pose.wheelAngle - traj[i - 1].pose.wheelAngle).toBeLessThan(2 * deg(CONTACT_TOL / p.wheelRadius));
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it("is never shoved by lever motion by more than a thousandth of a degree", () => {
    expect(traj[traj.length - 1].pose.maxNudge).toBeLessThan(1e-3);
    expect(traj[traj.length - 1].pose.violations).toBe(0);
  });
});

describe("fork", () => {
  it("stays between its bankings and rests on one whenever the pin is out of the notch", () => {
    for (const { pose } of traj) {
      expect(Math.abs(pose.forkAngle)).toBeLessThanOrEqual(d.forkHalf + 1e-9);
      if (Math.abs(pose.balanceAngle) > p.liftAngle / 2 + 1e-6) expect(Math.abs(pose.forkAngle)).toBeCloseTo(d.forkHalf, 9);
    }
  });
});

describe("phases", () => {
  const seq = (from: number, to: number): Phase[] => {
    const out: Phase[] = [];
    for (const { t, pose } of traj) {
      if (t < from || t > to) continue;
      if (out[out.length - 1] !== pose.phase) out.push(pose.phase);
    }
    return out;
  };
  it("run lock → unlock → impulse → drop → lock once per beat, on both pallets", () => {
    const s = T / 4;
    expect(seq(s, s + beat)).toEqual(["lock", "unlock", "impulse", "drop", "lock"]);
    expect(seq(s + beat, s + 2 * beat)).toEqual(["lock", "unlock", "impulse", "drop", "lock"]);
  });
  it("alternate pallets beat by beat", () => {
    const stoneIn = (from: number) => traj.find(({ t, pose }) => t >= from && pose.phase === "impulse")?.pose.contact?.stone;
    const a = stoneIn(T / 4), b = stoneIn(T / 4 + beat);
    expect(a).toBeDefined(); expect(b).toBeDefined(); expect(a).not.toEqual(b);
  });
});

describe("geometry", () => {
  it("never lets a tooth overlap a pallet stone", () => {
    for (const { pose } of traj.filter((_, i) => i % 4 === 0)) {
      const g = shapes(p, pose);
      for (const tooth of g.teeth) for (const stone of [g.entryStone, g.exitStone]) expect(stonePenetration(tooth, stone)).toBeLessThanOrEqual(CONTACT_TOL * 1.01);
    }
  });
});

describe("stepper", () => {
  it("gives the same trajectory for coarse and fine caller steps (substepping)", () => {
    const bal = (t: number) => AMPLITUDE * Math.sin((2 * Math.PI * t) / T);
    const run = (n: number) => {
      let pose = initialPose(p, bal(T / 4));
      const dt = T / n;
      for (let i = 1; i <= n; i++) pose = step(p, pose, bal(T / 4 + i * dt), dt);
      return pose;
    };
    const fine = run(4000), coarse = run(25); // 25 frames per period ≈ 60 fps at real time for 18,000 bph
    expect(coarse.wheelAngle).toBeCloseTo(fine.wheelAngle, 2);
    expect(coarse.phase).toBe(fine.phase);
  });
});
