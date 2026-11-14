/**
 * Browser runtime for the brag film. Everything on screen that looks like the app IS the app:
 * the sim core produces the readings and the app's own renderers draw them. This file only
 * decides what the watch and the hand are doing at each film frame, and writes the results
 * into the composition's DOM. State is a pure function of the frame index (seek-safe).
 */
import { readWatch, ZERO_SETTINGS, POSITIONS, type WatchSettings, type WatchReading, type WatchSpec } from "../../../src/core/watch";
import { analyze, type Reading } from "../../../src/core/timegrapher/analyze";
import { advanceTicks, emptyWindow, type TickWindow } from "../../../src/app/ticker";
import { renderMovement, type Highlight } from "../../../src/view/movement";
import { adjustmentShapes } from "../../../src/core/escapement/adjustments";
import { renderTimegrapher } from "../../../src/view/timegrapher";
import { fixedPoints } from "../../../src/core/escapement/shapes";
import { PUZZLES, type Puzzle } from "../../../src/puzzles";
import { mountSpeedControl, SPEED_STOPS } from "../../../src/view/speed";
import type { EscapementPose, Phase } from "../../../src/core/escapement/kinematics";
import { FPS, DURATION, FRAMES, S2, S3, S4, S5, GRAB, RELEASE, SOLVED, BEAT, BEAT0, T, calibre, esc, BENCH_SPEED, movementTime, regulatorAt, smooth, ramp } from "./scenario";

export { FPS, DURATION, FRAMES, S2, S3, S4, S5, GRAB, RELEASE, SOLVED, BEAT, BEAT0 };

const TRACE_BEATS = 300;
/** What the app's own label says (main.ts SIM_SPEEDUP). The film's edit runs the instrument faster. */
const SIM_SPEEDUP = 10;

// ---------- a watch on the instrument, as a function of film frame ----------
interface SimDef {
  spec: WatchSpec;
  faults: Partial<WatchSettings>;
  user: (t: number) => WatchSettings;
  /** Instrument seconds elapsed at film time t (monotonic). */
  simTime: (t: number) => number;
  /** Ticks already on the screen at frame 0, in instrument seconds. */
  prefill: number;
  band?: Puzzle["band"];
  holdSeconds?: number;
}
interface SimState { win: TickWindow; held: number; solved: boolean }

class Sim {
  private states: SimState[] = [];
  constructor(private def: SimDef) {}
  effective(t: number): WatchSettings {
    const user = this.def.user(t), f = this.def.faults;
    // Same sum as main.ts effective(): hidden faults plus the user's adjustments.
    return {
      ...user,
      regulatorIndex: user.regulatorIndex + (f.regulatorIndex ?? 0),
      beatOffsetDeg: user.beatOffsetDeg + (f.beatOffsetDeg ?? 0),
      unbalance: user.unbalance + (f.unbalance ?? 0),
      heavySpotDeg: f.heavySpotDeg ?? user.heavySpotDeg,
    };
  }
  reading(t: number): WatchReading { return readWatch(this.def.spec, this.effective(t)); }
  state(frame: number): SimState {
    const d = this.def;
    while (this.states.length <= frame) {
      const i = this.states.length, t = i / FPS, r = this.reading(t);
      if (i === 0) {
        this.states.push({ win: advanceTicks(emptyWindow(), r, d.simTime(0), TRACE_BEATS), held: 0, solved: false });
        continue;
      }
      const prev = this.states[i - 1];
      const win = advanceTicks(prev.win, r, d.simTime(t), TRACE_BEATS);
      let held = prev.held, solved = prev.solved;
      if (d.band && !solved) {
        const ds = d.simTime(t) - d.simTime((i - 1) / FPS);
        held = d.band(r, analyze(win.ticks, T, calibre.liftAngle)) ? held + ds : 0;
        if (held >= (d.holdSeconds ?? Infinity)) solved = true;
      }
      this.states.push({ win, held, solved });
    }
    return this.states[frame];
  }
  tg(frame: number): Reading | null { return analyze(this.state(frame).win.ticks, T, calibre.liftAngle); }
  html(frame: number): string {
    const r = this.reading(frame / FPS);
    return renderTimegrapher({ reading: this.tg(frame), nominalPeriod: T, liftAngle: calibre.liftAngle, running: r.running, knocking: r.knocking, spanSeconds: (TRACE_BEATS * T) / 2, speedup: SIM_SPEEDUP });
  }
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// Puzzle 1 on the main instrument. The trace grows through scene 1, waits through scene 2,
// and runs again on the bench. After the hand lets go, the clock runs at whatever speed puts
// the app's real completion rule (60 instrument seconds in band) on the "solved" cue.
const P1 = PUZZLES[0];
const mainUser = (t: number): WatchSettings => ({ ...ZERO_SETTINGS, regulatorIndex: regulatorAt(t) });
let afterRelease = 30;
const mainSimTime = (t: number) =>
  18 * clamp(t - 0.25, 0, S2 - 0.25) + 20 * clamp(t - (S3 - 0.5), 0, RELEASE - (S3 - 0.5)) + afterRelease * Math.max(0, t - RELEASE);
const mainDef: SimDef = { spec: calibre.watch, faults: P1.faults, user: mainUser, simTime: mainSimTime, prefill: 0, band: P1.band, holdSeconds: P1.holdSeconds };
{
  // Instrument seconds from release to solved do not depend on the clock speed, so measure them once.
  const probe = new Sim(mainDef);
  const rel = Math.round(RELEASE * FPS);
  let { win, held } = probe.state(rel);
  const r = probe.reading(RELEASE + 1), ds = 0.25;
  let s = mainSimTime(rel / FPS), elapsed = 0;
  while (held < P1.holdSeconds && elapsed < 600) {
    s += ds; elapsed += ds;
    win = advanceTicks(win, r, s, TRACE_BEATS);
    held = P1.band(r, analyze(win.ticks, T, calibre.liftAngle)) ? held + ds : 0;
  }
  afterRelease = elapsed / (SOLVED - RELEASE);
}
const main = new Sim(mainDef);

// Scene 4: the other three puzzles, each running on its own small instrument.
const miniClock = (speed: number) => (t: number) => 60 + speed * Math.max(0, t - S4);
const beatAt = (t: number) => Math.round((-6 * smooth(ramp(t, 18.0, 18.7))) / 0.1) * 0.1;
const windAt = (t: number) => Math.round((30 * smooth(ramp(t, 18.3, 20.3))) / 0.5) * 0.5;
const positionAt = (t: number): WatchSettings["position"] => (t < 18.9 ? "CU" : "CD");
const minis: { sim: Sim; value: (t: number) => string }[] = [
  {
    sim: new Sim({ spec: calibre.watch, faults: PUZZLES[1].faults, user: (t) => ({ ...ZERO_SETTINGS, beatOffsetDeg: beatAt(t) }), simTime: miniClock(30), prefill: 60 }),
    value: (t) => `${beatAt(t).toFixed(1)}°`,
  },
  {
    sim: new Sim({ spec: PUZZLES[2].specOverride!(calibre.watch), faults: PUZZLES[2].faults, user: (t) => ({ ...ZERO_SETTINGS, hoursSinceWind: windAt(t) }), simTime: miniClock(30), prefill: 60 }),
    value: (t) => `${windAt(t).toFixed(0)} h since wound`,
  },
  {
    sim: new Sim({ spec: calibre.watch, faults: PUZZLES[3].faults, user: (t) => ({ ...ZERO_SETTINGS, position: positionAt(t) }), simTime: miniClock(40), prefill: 60 }),
    value: (t) => POSITIONS.find((p) => p.id === positionAt(t))!.label,
  },
];

// ---------- the movement drawing ----------
interface PoseData { phases: Phase[]; contacts: (string | null)[]; segments: { f0: number; rows: number[][] }[] }
function poseAt(frame: number): EscapementPose {
  const data = (window as any).__POSES as PoseData;
  const seg = frame >= data.segments[1].f0 ? data.segments[1] : data.segments[0];
  const row = seg.rows[clamp(frame - seg.f0, 0, seg.rows.length - 1)];
  const c = data.contacts[row[4]];
  const [stone, face] = c ? c.split("/") : [];
  return { balanceAngle: row[0], forkAngle: row[1], wheelAngle: row[2], phase: data.phases[row[3]], contact: c ? ({ stone, face } as any) : null, violations: 0, maxNudge: 0 };
}
function movementHtml(frame: number, eff: WatchSettings, amplitudeDeg: number, hot: Highlight): string {
  const pose = poseAt(frame);
  const adj = adjustmentShapes(esc, { ...eff, balanceAngle: pose.balanceAngle, amplitudeDeg, revealHeavySpot: false });
  return renderMovement(esc, pose, movementTime(frame / FPS) * 1000, adj, hot);
}

// ---------- the job card (same markup as main.ts puzzleHtml) ----------
function puzzleHtml(puzzle: Puzzle, heldSeconds: number, solved: boolean): string {
  const idx = PUZZLES.indexOf(puzzle);
  const explanation = puzzle.explanation.replace(/^(.*?\.)\s/, "<mark>$1</mark> ");
  return `<h2>Puzzle ${idx + 1} · ${puzzle.title}</h2>
    <p class="symptom">${puzzle.symptom}</p>
    <p class="goal"><strong>Goal:</strong> ${puzzle.goal}</p>
    <div class="hold"><div class="bar" style="width:${Math.min(100, (100 * heldSeconds) / puzzle.holdSeconds).toFixed(1)}%"></div><span>${solved ? "solved" : `${heldSeconds.toFixed(0)} / ${puzzle.holdSeconds} s in band`}</span></div>
    ${solved ? `<details open><summary>Why it worked</summary><p>${explanation}</p></details>` : ""}`;
}

// ---------- mounting ----------
export function mount(): (frame: number) => void {
  const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;
  const root = $("root");
  const last = new Map<Element, string>();
  const put = (el: Element, html: string) => { if (last.get(el) !== html) { last.set(el, html); el.innerHTML = html; } };
  const text = (el: Element, s: string) => { if (last.get(el) !== s) { last.set(el, s); el.textContent = s; } };

  // Static bench furniture, filled the way main.ts fills it.
  $("calibre-name").textContent = calibre.name;
  $<HTMLSelectElement>("puzzle-select").innerHTML = `<option>Puzzle 1: ${P1.title}</option>`;
  mountSpeedControl($("tempo"), $<HTMLSelectElement>("speed"), $("pause"));
  const speedSlider = $<HTMLInputElement>("speed-slider");
  speedSlider.value = String(SPEED_STOPS.findIndex((s) => s.value === BENCH_SPEED));
  speedSlider.dispatchEvent(new Event("input"));
  $("wind-value").textContent = "0 h since wound";

  // Scene 2 drafting labels: an overlay sharing the movement's viewBox, so label anchors are scene coordinates.
  const first = movementHtml(Math.round(S2 * FPS), main.effective(S2), main.reading(S2).amplitudeDeg, null);
  const viewBox = /viewBox="([^"]+)"/.exec(first)![1];
  const { forkPivot, balanceCentre } = fixedPoints(esc);
  const [vx, , vw] = viewBox.split(" ").map(Number);
  const right = vx + vw + 14;
  const label = (id: string, at: { x: number; y: number }, y: number, name: string) =>
    `<g id="${id}" class="callout"><circle cx="${at.x}" cy="${-at.y}" r="2.2"/><polyline points="${at.x},${-at.y} ${right - 22},${-y} ${right},${-y}"/><text x="${right + 5}" y="${-y + 4.2}">${name}</text></g>`;
  $("mv-labels").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${
    label("lab-wheel", { x: esc.wheelRadius * 0.74, y: -esc.wheelRadius * 0.3 }, -52, "escape wheel") +
    label("lab-fork", { x: 9, y: forkPivot.y + 34 }, forkPivot.y + 22, "pallet fork") +
    label("lab-balance", { x: esc.balanceRadius * 0.82, y: balanceCentre.y + esc.balanceRadius * 0.57 }, balanceCentre.y + 62, "balance")
  }</svg>`;

  const tgHero = $("tg-hero"), mvHero = $("mv-hero"), mvOutro = $("mv-outro");
  const benchTg = $("timegrapher"), benchMv = $("movement"), puzzleEl = $("puzzle");
  const regulator = $<HTMLInputElement>("regulator"), regulatorValue = $("regulator-value"), trueRate = $("readout-rate");
  const cursor = $("cursor");
  const glows = Array.from(document.querySelectorAll<HTMLElement>(".tg-glow"));
  const miniEls = ["mini-1", "mini-2", "mini-3"].map((id) => ({ tg: $(id).getElementsByClassName("tg-case")[0], value: $(id).getElementsByClassName("value")[0] }));
  const rms = ((window as any).__RMS as number[]) ?? [];

  /** Centre of the regulator slider's thumb, in stage pixels. */
  const thumb = (value: number) => {
    const rr = root.getBoundingClientRect(), k = rr.width / 1920, r = regulator.getBoundingClientRect();
    const tw = 10 * (r.width / regulator.offsetWidth);
    const frac = (value - Number(regulator.min)) / (Number(regulator.max) - Number(regulator.min));
    return { x: (r.left + tw / 2 + frac * (r.width - tw) - rr.left) / k, y: (r.top + r.height / 2 - rr.top) / k };
  };

  return (f: number) => {
    const frame = clamp(Math.round(f), 0, FRAMES), t = frame / FPS;

    // Main instrument: scene 1 hero and the bench.
    if (t < S2 + 0.3) put(tgHero, main.html(frame));
    if (t > S3 - 0.6 && t < S4 + 0.3) {
      const st = main.state(frame), eff = main.effective(t), r = main.reading(t), v = regulatorAt(t);
      put(benchTg, main.html(frame));
      put(puzzleEl, puzzleHtml(P1, st.held, st.solved));
      const dragging = t >= GRAB && t < RELEASE + 0.15;
      put(benchMv, movementHtml(frame, eff, r.amplitudeDeg, dragging ? "regulator" : null));
      regulator.value = String(v);
      // Same formats as main.ts bindRange("regulator") and drawControls().
      text(regulatorValue, `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}° ${v > 0 ? "(toward F)" : v < 0 ? "(toward S)" : ""}`);
      text(trueRate, `${r.rateSecondsPerDay >= 0 ? "+" : "−"}${Math.abs(r.rateSecondsPerDay).toFixed(1)} s/day true rate`);

      // The hand: glide in, hold the thumb through the drag, let go and leave.
      const at = thumb(v), away = { x: at.x + 150, y: at.y + 170 };
      const inU = smooth(ramp(t, S3 + 0.05, GRAB - 0.04)), outU = smooth(ramp(t, RELEASE + 0.1, RELEASE + 1.0));
      const x = t < GRAB ? away.x + (at.x - away.x) * inU : at.x + (away.x - at.x) * outU;
      const y = t < GRAB ? away.y + (at.y - away.y) * inU : at.y + (away.y - at.y) * outU;
      cursor.style.transform = `translate(${x.toFixed(1)}px, ${(y + 3).toFixed(1)}px) scale(${dragging ? 0.88 : 1})`;
      cursor.style.opacity = (t < GRAB ? ramp(t, S3 + 0.05, S3 + 0.3) : 1 - ramp(t, RELEASE + 0.6, RELEASE + 1.0)).toFixed(3);
    }

    // Movement as hero (scene 2) and in the outro (free play: healthy watch, nothing touched).
    if (t > S2 - 0.6 && t < S3 + 0.3) put(mvHero, movementHtml(frame, main.effective(t), main.reading(t).amplitudeDeg, null));
    if (t > S5 - 0.6) put(mvOutro, movementHtml(frame, { ...ZERO_SETTINGS }, readWatch(calibre.watch, ZERO_SETTINGS).amplitudeDeg, null));

    // Scene 4 instruments.
    if (t > S4 - 0.6 && t < S5 + 0.3) minis.forEach((m, i) => { put(miniEls[i].tg, m.sim.html(frame)); text(miniEls[i].value, m.value(t)); });

    // Phosphor glow breathes with the music's loudness.
    const level = rms[Math.min(frame, rms.length - 1)] ?? 0;
    for (const g of glows) g.style.opacity = (0.3 + 0.7 * level).toFixed(3);
  };
}

/** Numbers the build prints so the timeline cues can be checked against the sim. */
export function report() {
  let solvedAt = -1;
  for (let f = 0; f <= FRAMES && solvedAt < 0; f++) if (main.state(f).solved) solvedAt = f / FPS;
  const at = (t: number) => { const f = Math.round(t * FPS), g = main.tg(f); return g ? `${g.rateSecondsPerDay.toFixed(1)} s/day, ${g.amplitudeDeg.toFixed(0)}°, ${g.beatErrorMs.toFixed(2)} ms` : "no reading"; };
  const mini = (i: number, t: number) => { const g = minis[i].sim.tg(Math.round(t * FPS)); return g ? `${g.rateSecondsPerDay.toFixed(1)} s/day, ${g.amplitudeDeg.toFixed(0)}°, ${g.beatErrorMs.toFixed(2)} ms` : "no reading"; };
  return {
    afterReleaseSpeed: afterRelease, solvedAt,
    main: { "1.0": at(1), "3.5": at(3.5), "8.7": at(8.7), "10.4": at(10.4), "12.0": at(12), "13.2": at(13.2), "16.0": at(16) },
    minis: [0, 1, 2].map((i) => ({ "17.0": mini(i, 17), "18.8": mini(i, 18.8), "20.5": mini(i, 20.5) })),
  };
}
