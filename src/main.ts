import { VINTAGE_18000 } from "./catalog/vintage18000";
import { readWatch, ZERO_SETTINGS, POSITIONS, type WatchSettings, type WatchReading, type WatchSpec } from "./core/watch";
import { nominalPeriod } from "./core/oscillator/period";
import { initialPose, step, type EscapementPose, type Phase } from "./core/escapement/kinematics";
import { shapes, stonePenetration } from "./core/escapement/shapes";
import { derived } from "./core/escapement/params";
import { CONTACT_TOL } from "./core/escapement/kinematics";
import { analyze, type Reading } from "./core/timegrapher/analyze";
import { advanceTicks, emptyWindow, type TickWindow } from "./app/ticker";
import { renderMovement, type Highlight } from "./view/movement";
import { adjustmentShapes } from "./core/escapement/adjustments";
import { renderTimegrapher } from "./view/timegrapher";
import { PUZZLES, type Puzzle } from "./puzzles";
import { advanceProgress, NO_PROGRESS, type Progress } from "./puzzles/progress";
import { STATES } from "./verify/states";
import { mountOnboarding } from "./app/onboarding";

const calibre = VINTAGE_18000;
const esc = calibre.escapement;
const T = nominalPeriod(calibre.beatRate);
const TRACE_BEATS = 300;
/** Timegrapher clock runs this many times faster than the wall clock (decision: two clocks). */
const SIM_SPEEDUP = 10;

// ---------- state ----------
let puzzle: Puzzle | null = PUZZLES[0];
let user: WatchSettings = { ...ZERO_SETTINGS };
let animSpeed = 1;
let animPaused = false;
let animTime = T / 4;
let simTime = 0;
let win: TickWindow = emptyWindow();
let pose: EscapementPose = initialPose(esc, 0);
let reading: WatchReading = readWatch(calibre.watch, user);
let tg: Reading | null = null;
let progress: Progress = NO_PROGRESS;
let solved = false;
let answered: number | null = null;
let revealHeavySpot = false;
/** The control being moved, highlighted on the drawing until `hotUntil` (wall ms). */
let hot: Highlight = null;
let hotUntil = 0;
function touch(part: Highlight) { hot = part; hotUntil = performance.now() + 600; if (animPaused) drawMovement(); }
/** On release the glow goes out quickly. */
let pointerHeld = false;
function release() { pointerHeld = false; if (hot) hotUntil = Math.min(hotUntil, performance.now() + 150); }
window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release);
let lastWall = performance.now();

const spec = (): WatchSpec => (puzzle?.specOverride ? puzzle.specOverride(calibre.watch) : calibre.watch);
const effective = (): WatchSettings => {
  const f = puzzle?.faults ?? {};
  return {
    ...user,
    regulatorIndex: user.regulatorIndex + (f.regulatorIndex ?? 0),
    beatOffsetDeg: user.beatOffsetDeg + (f.beatOffsetDeg ?? 0),
    unbalance: user.unbalance + (f.unbalance ?? 0),
    heavySpotDeg: f.heavySpotDeg ?? user.heavySpotDeg,
    inertiaTrim: user.inertiaTrim,
  };
};

// ---------- DOM ----------
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const movementEl = $("movement"), tgEl = $("timegrapher"), puzzleEl = $("puzzle");

/** Balance angle at an absolute time with the current reading: used only for frozen, named states. */
function balanceAngleAt(t: number) {
  return reading.running ? reading.amplitudeDeg * Math.sin((2 * Math.PI * t) / reading.period) - reading.beatOffsetDeg : -reading.beatOffsetDeg;
}
/** Live loop: the oscillator's phase is accumulated frame by frame, so a change of period or
 *  amplitude from a slider never jumps the balance (phase from absolute time would). */
let balancePhase = Math.PI / 2; // start at +amplitude, fork parked
function balanceAngleNow() {
  return reading.running ? reading.amplitudeDeg * Math.sin(balancePhase) - reading.beatOffsetDeg : -reading.beatOffsetDeg;
}

function recompute() {
  reading = readWatch(spec(), effective());
  if (animPaused) drawMovement();
}

/** Named verify-render state, if the URL asked for one. */
let named: string | null = null;
let lastMovementHtml = "";
let lastTimegrapherHtml = "";
function drawMovement() {
  const eff = effective();
  const adj = adjustmentShapes(esc, { ...eff, balanceAngle: pose.balanceAngle, amplitudeDeg: reading.amplitudeDeg, revealHeavySpot: revealHeavySpot || (solved && puzzle?.id === "position-error") });
  if (hot && !pointerHeld && performance.now() > hotUntil) hot = null;
  // Write the DOM only when the picture changed: a stopped watch redraws nothing, so a slider
  // being dragged is not fighting sixty SVG replacements a second.
  const html = renderMovement(esc, pose, animTime * 1000, adj, hot) + (reading.running ? "" : "<!--stopped-->");
  if (html === lastMovementHtml) return;
  lastMovementHtml = html;
  movementEl.innerHTML = html;
  if (named) movementEl.querySelector("svg")!.setAttribute("data-state", named);
  // Stopped is the model's low-amplitude threshold, reached with some torque still left in the spring.
  if (!reading.running) movementEl.querySelector(".phase")!.textContent = "STOPPED · the mainspring has run down";
}
function drawTimegrapher() {
  const html = renderTimegrapher({ reading: tg, nominalPeriod: T, liftAngle: calibre.liftAngle, running: reading.running, knocking: reading.knocking, spanSeconds: (TRACE_BEATS * T) / 2, speedup: SIM_SPEEDUP });
  if (html === lastTimegrapherHtml) return;
  lastTimegrapherHtml = html;
  tgEl.innerHTML = html;
}
let lastPuzzleHtml = "";
/** Re-renders only when the card's content changes: it is called every frame for the hold bar. */
function drawPuzzle() {
  const html = puzzleHtml();
  if (html === lastPuzzleHtml) return;
  lastPuzzleHtml = html;
  puzzleEl.innerHTML = html;
  puzzleEl.querySelectorAll<HTMLButtonElement>(".choice").forEach((b) => (b.onclick = () => { answered = Number(b.dataset.choice); if (answered === puzzle!.question!.correct) solved = true; drawPuzzle(); }));
}
function puzzleHtml(): string {
  if (!puzzle) return `<h2>Free play</h2><p>Adjust anything. The timegrapher shows what a watchmaker would see.</p>`;
  const idx = PUZZLES.indexOf(puzzle);
  return `<h2>Puzzle ${idx + 1} · ${puzzle.title}</h2>
    <p class="symptom">${puzzle.symptom}</p>
    <p class="goal"><strong>Goal:</strong> ${puzzle.goal}</p>
    ${Number.isFinite(puzzle.holdSeconds) ? `<div class="hold"><div class="bar" style="width:${solved ? 100 : Math.min(100, (100 * progress.heldSeconds) / puzzle.holdSeconds).toFixed(1)}%"></div><span>${solved ? "solved" : `${progress.heldSeconds.toFixed(0)} / ${puzzle.holdSeconds} s in band`}</span></div>` : ""}
    ${puzzle.holdIn ? `<p class="positions">${puzzle.holdIn.map((id) => `${solved || progress.passed.includes(id) ? "✓" : "○"} ${POSITIONS.find((p) => p.id === id)!.label}`).join(" · ")}</p>` : ""}
    ${puzzle.question ? `<div class="question"><p>${puzzle.question.prompt}</p>${puzzle.question.choices.map((c, i) => `<button class="choice ${answered === i ? (i === puzzle!.question!.correct ? "right" : "wrong") : ""}" data-choice="${i}">${c}</button>`).join("")}${answered !== null ? `<p class="verdict">${answered === puzzle.question.correct ? puzzle.question.whyCorrect : "Not quite. Watch the rate as the wind runs down, then try again."}</p>` : ""}</div>` : ""}
    ${solved ? `<details open><summary>Why it worked</summary><p>${puzzle.explanation}</p></details>` : ""}`;
}
function drawControls() {
  const show = (name: string) => !puzzle || puzzle.controls.includes(name as never) || puzzle.controls.length === 0;
  for (const name of ["regulator", "beat", "wind", "screws", "position"]) $(`ctl-${name}`).hidden = !show(name);
  $("ctl-poise").hidden = $("ctl-poise-angle").hidden = !show("poise");
  // Controls appear in the order the puzzle lists them; free play keeps the page's own order.
  const rank = (name: string) => (puzzle ? puzzle.controls.indexOf(name as never) : -1);
  for (const name of ["regulator", "beat", "wind", "screws", "position", "poise"]) {
    const order = rank(name) < 0 ? "" : String(rank(name) * 2);
    $(`ctl-${name}`).style.order = order;
    if (name === "poise") $("ctl-poise-angle").style.order = order === "" ? "" : String(rank(name) * 2 + 1);
  }
  $("readout-rate").style.order = "99";
  $("readout-rate").textContent = reading.running ? `${reading.rateSecondsPerDay >= 0 ? "+" : "−"}${Math.abs(reading.rateSecondsPerDay).toFixed(1)} s/day true rate` : "stopped";
}

// ---------- frame loop ----------
function frame(now: number) {
  const wallDt = Math.min(0.1, (now - lastWall) / 1000);
  lastWall = now;
  if (!animPaused) {
    const dt = reading.running ? wallDt * animSpeed : 0; // a stopped watch holds still
    animTime += dt;
    if (reading.running) balancePhase += (2 * Math.PI * dt) / reading.period;
    pose = step(esc, pose, balanceAngleNow(), Math.max(dt, 1e-6), reading.running);
    drawMovement();
  }
  // Timegrapher clock.
  const simDt = wallDt * SIM_SPEEDUP;
  simTime += simDt;
  win = advanceTicks(win, reading, simTime, TRACE_BEATS);
  tg = analyze(win.ticks, T, calibre.liftAngle);
  drawTimegrapher();
  if (puzzle && !solved && Number.isFinite(puzzle.holdSeconds)) {
    progress = advanceProgress(puzzle, progress, reading, tg, user.position, simDt);
    if (progress.solved) solved = true;
    drawPuzzle();
  }
  requestAnimationFrame(frame);
}

// ---------- controls ----------
/** Reads each control into `user` and refreshes its label, without lighting the part it acts on
 *  (that is for a person moving the control, not for a reset or a named state). */
const syncFromControls: (() => void)[] = [];
type RangeKey = "regulatorIndex" | "beatOffsetDeg" | "hoursSinceWind" | "inertiaTrim";
function bindRange(id: string, key: RangeKey, fmt: (v: number) => string, part: Highlight) {
  const el = $<HTMLInputElement>(id), out = $(`${id}-value`);
  const apply = () => { user[key] = Number(el.value); out.textContent = fmt(Number(el.value)); recompute(); drawControls(); };
  el.oninput = () => { apply(); touch(part); };
  el.onpointerdown = () => { pointerHeld = true; touch(part); };
  syncFromControls.push(apply);
  apply();
}
/** Put every control at the given settings and read them back, so sliders, labels and state agree. */
function setControls(s: WatchSettings) {
  const set = (id: string, v: number) => { $<HTMLInputElement>(id).value = String(v); };
  set("regulator", s.regulatorIndex); set("beat", s.beatOffsetDeg); set("wind", s.hoursSinceWind); set("screws", s.inertiaTrim);
  set("poise", s.poiseCorrection / 1e-11); set("poise-angle", s.poiseCorrectionDeg);
  $<HTMLSelectElement>("position").value = s.position;
  user.position = s.position;
  for (const sync of syncFromControls) sync();
}
bindRange("regulator", "regulatorIndex", (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}° ${v > 0 ? "(toward F)" : v < 0 ? "(toward S)" : ""}`, "regulator");
bindRange("beat", "beatOffsetDeg", (v) => `${v.toFixed(1)}°`, "beat");
bindRange("wind", "hoursSinceWind", (v) => `${v.toFixed(0)} h since wound`, "wind");
bindRange("screws", "inertiaTrim", (v) => `${(v * 100).toFixed(2)} % inertia`, "screws");
{
  const amt = $<HTMLInputElement>("poise"), ang = $<HTMLInputElement>("poise-angle");
  const apply = () => {
    user.poiseCorrection = Number(amt.value) * 1e-11; user.poiseCorrectionDeg = Number(ang.value);
    $("poise-value").textContent = `${Number(amt.value).toFixed(2)} µg·cm`; $("poise-angle-value").textContent = `${ang.value}° on the rim`;
    recompute(); drawControls();
  };
  amt.oninput = () => { apply(); touch("poise"); }; ang.oninput = () => { apply(); touch("poise"); };
  amt.onpointerdown = ang.onpointerdown = () => { pointerHeld = true; touch("poise"); };
  syncFromControls.push(apply);
  apply();
}
$<HTMLSelectElement>("position").onchange = (e) => { user.position = (e.target as HTMLSelectElement).value as WatchSettings["position"]; recompute(); drawControls(); touch("position"); };
$<HTMLSelectElement>("position").innerHTML = POSITIONS.map((p) => `<option value="${p.id}">${p.label}</option>`).join("");
$<HTMLSelectElement>("speed").onchange = (e) => { animSpeed = Number((e.target as HTMLSelectElement).value); };
$("pause").onclick = () => { animPaused = !animPaused; $("pause").textContent = animPaused ? "Play" : "Pause"; };
const puzzleSel = $<HTMLSelectElement>("puzzle-select");
puzzleSel.innerHTML = `<option value="">Free play</option>` + PUZZLES.map((p, i) => `<option value="${p.id}">Puzzle ${i + 1}: ${p.title}</option>`).join("");
function loadPuzzle(id: string | null) {
  puzzle = PUZZLES.find((p) => p.id === id) ?? null;
  puzzleSel.value = puzzle?.id ?? "";
  user = { ...ZERO_SETTINGS };
  progress = NO_PROGRESS; solved = false; answered = null; win = emptyWindow(); simTime = 0;
  setControls(user);
  recompute(); drawControls(); drawPuzzle();
}
puzzleSel.onchange = () => loadPuzzle(puzzleSel.value || null);
$("calibre-name").textContent = calibre.name;

// ---------- verify-render contract ----------
const q = new URLSearchParams(location.search);
function timeForPhase(phase: Phase, beat: 0 | 1, frac: number): number {
  // Scan one period from T/4 with a fresh pose, find the phase window on the requested beat.
  const N = 4000;
  let p = initialPose(esc, balanceAngleAt(T / 4));
  let t = T / 4, start: number | null = null, found: [number, number] | null = null, beatIdx = -1, lastPhase: Phase = p.phase;
  for (let i = 1; i <= N && !found; i++) {
    const nt = T / 4 + (i / N) * T;
    p = step(esc, p, balanceAngleAt(nt), nt - t); t = nt;
    if (p.phase === "unlock" && lastPhase === "lock") beatIdx++;
    if (beatIdx === beat && p.phase === phase && start === null) start = t;
    if (start !== null && p.phase !== phase) found = [start, t];
    lastPhase = p.phase;
  }
  return found ? found[0] + frac * (found[1] - found[0]) : T / 4;
}
if (q.has("state") && STATES[q.get("state")!]) {
  named = q.get("state")!;
  const s = STATES[named];
  loadPuzzle(s.puzzle);
  setControls({ ...user, ...s.settings });
  revealHeavySpot = !!s.reveal;
  if (s.highlight) { hot = s.highlight; hotUntil = Infinity; }
  recompute();
  // Accumulate ticks for the requested sim span, then freeze everything.
  win = advanceTicks(win, reading, s.simSeconds, TRACE_BEATS);
  simTime = s.simSeconds;
  tg = analyze(win.ticks, T, calibre.liftAngle);
  animPaused = true;
  animTime = T / 4;
  pose = initialPose(esc, balanceAngleAt(T / 4));
  if (s.freeze) {
    animTime = timeForPhase(s.freeze.phase, s.freeze.beat, s.freeze.frac ?? 0.5);
    let t = T / 4;
    while (t < animTime) { const nt = Math.min(animTime, t + 1e-4); pose = step(esc, pose, balanceAngleAt(nt), nt - t); t = nt; }
  }
  drawMovement(); drawTimegrapher(); drawPuzzle(); drawControls();
  movementEl.querySelector("svg")!.setAttribute("data-state", named);
}
(window as any).__bench = {
  states: () => Object.keys(STATES),
  describe: () => (named ? STATES[named].describe : "free-running"),
  check: () => {
    if (!named) return [];
    const e = STATES[named].expect;
    const out: { name: string; pass: boolean; detail: string }[] = [];
    const g = shapes(esc, pose);
    let worst = -Infinity;
    for (const tooth of g.teeth) for (const st of [g.entryStone, g.exitStone]) worst = Math.max(worst, stonePenetration(tooth, st));
    out.push({ name: "no tooth inside a stone", pass: worst <= CONTACT_TOL * 1.01, detail: `max penetration ${worst.toExponential(2)}` });
    out.push({ name: "lever within bankings", pass: Math.abs(pose.forkAngle) <= derived(esc).forkHalf + 1e-9, detail: `fork ${pose.forkAngle.toFixed(3)}°` });
    if (e.phase) out.push({ name: "escapement phase", pass: pose.phase === e.phase, detail: `got ${pose.phase}, expected ${e.phase}` });
    if (e.running !== undefined) out.push({ name: "running", pass: reading.running === e.running, detail: `running=${reading.running}` });
    if (e.rateWithin && tg) out.push({ name: "timegrapher rate", pass: tg.rateSecondsPerDay >= e.rateWithin[0] && tg.rateSecondsPerDay <= e.rateWithin[1], detail: `${tg.rateSecondsPerDay.toFixed(1)} s/day, expected ${e.rateWithin.join("..")}` });
    if (e.amplitudeWithin && tg) out.push({ name: "timegrapher amplitude", pass: tg.amplitudeDeg >= e.amplitudeWithin[0] && tg.amplitudeDeg <= e.amplitudeWithin[1], detail: `${tg.amplitudeDeg.toFixed(1)}°, expected ${e.amplitudeWithin.join("..")}` });
    if (e.beatErrorBelow !== undefined && tg) out.push({ name: "beat error", pass: tg.beatErrorMs < e.beatErrorBelow, detail: `${tg.beatErrorMs.toFixed(2)} ms` });
    out.push({ name: "instrument agrees with physics on rate", pass: !tg || !reading.running || Math.abs(tg.rateSecondsPerDay - reading.rateSecondsPerDay) < 0.5, detail: `instrument ${tg?.rateSecondsPerDay.toFixed(2)} vs true ${reading.rateSecondsPerDay.toFixed(2)}` });
    return out;
  },
};

if (!named) { loadPuzzle(PUZZLES[0].id); pose = initialPose(esc, balanceAngleAt(animTime)); drawMovement(); drawTimegrapher(); }
mountOnboarding(); // onboarding: first-run guide, trace explainer, hints (src/app/onboarding.ts)
requestAnimationFrame(frame);
