import { VINTAGE_18000 } from "./catalog/vintage18000";
import { readWatch, ZERO_SETTINGS, POSITIONS, type WatchSettings, type WatchReading, type WatchSpec } from "./core/watch";
import { nominalPeriod } from "./core/oscillator/period";
import { initialPose, step, type EscapementPose, type Phase } from "./core/escapement/kinematics";
import { shapes, stonePenetration } from "./core/escapement/shapes";
import { derived } from "./core/escapement/params";
import { CONTACT_TOL } from "./core/escapement/kinematics";
import { analyze, type Reading } from "./core/timegrapher/analyze";
import { advanceTicks, emptyWindow, type TickWindow } from "./app/ticker";
import { renderMovement } from "./view/movement";
import { renderTimegrapher } from "./view/timegrapher";
import { PUZZLES, type Puzzle } from "./puzzles";
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
let heldSeconds = 0;
let solved = false;
let answered: number | null = null;
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

function balanceAngleAt(t: number) {
  return reading.running ? reading.amplitudeDeg * Math.sin((2 * Math.PI * t) / reading.period) - reading.beatOffsetDeg : -reading.beatOffsetDeg;
}

function recompute() {
  reading = readWatch(spec(), effective());
}

function drawMovement() {
  movementEl.innerHTML = renderMovement(esc, pose, animTime * 1000);
  if (!reading.running) movementEl.querySelector(".phase")!.textContent = "STOPPED · no torque at the escape wheel";
}
function drawTimegrapher() {
  tgEl.innerHTML = renderTimegrapher({ reading: tg, nominalPeriod: T, liftAngle: calibre.liftAngle, running: reading.running, knocking: reading.knocking, spanSeconds: (TRACE_BEATS * T) / 2, speedup: SIM_SPEEDUP });
}
function drawPuzzle() {
  if (!puzzle) { puzzleEl.innerHTML = `<h2>Free play</h2><p>Adjust anything. The timegrapher shows what a watchmaker would see.</p>`; return; }
  const idx = PUZZLES.indexOf(puzzle);
  puzzleEl.innerHTML = `<h2>Puzzle ${idx + 1} · ${puzzle.title}</h2>
    <p class="symptom">${puzzle.symptom}</p>
    <p class="goal"><strong>Goal:</strong> ${puzzle.goal}</p>
    ${Number.isFinite(puzzle.holdSeconds) ? `<div class="hold"><div class="bar" style="width:${Math.min(100, (100 * heldSeconds) / puzzle.holdSeconds).toFixed(1)}%"></div><span>${solved ? "solved" : `${heldSeconds.toFixed(0)} / ${puzzle.holdSeconds} s in band`}</span></div>` : ""}
    ${puzzle.question ? `<div class="question"><p>${puzzle.question.prompt}</p>${puzzle.question.choices.map((c, i) => `<button class="choice ${answered === i ? (i === puzzle!.question!.correct ? "right" : "wrong") : ""}" data-choice="${i}">${c}</button>`).join("")}${answered !== null ? `<p class="verdict">${answered === puzzle.question.correct ? puzzle.question.whyCorrect : "Not quite. Watch the rate as the wind runs down, then try again."}</p>` : ""}</div>` : ""}
    ${solved ? `<details open><summary>Why it worked</summary><p>${puzzle.explanation}</p></details>` : ""}`;
  puzzleEl.querySelectorAll<HTMLButtonElement>(".choice").forEach((b) => (b.onclick = () => { answered = Number(b.dataset.choice); if (answered === puzzle!.question!.correct) solved = true; drawPuzzle(); }));
}
function drawControls() {
  const show = (name: string) => !puzzle || puzzle.controls.includes(name as never) || puzzle.controls.length === 0;
  for (const name of ["regulator", "beat", "wind", "screws", "position"]) $(`ctl-${name}`).hidden = !show(name);
  $("ctl-poise").hidden = $("ctl-poise-angle").hidden = !show("poise");
  $("readout-rate").textContent = reading.running ? `${reading.rateSecondsPerDay >= 0 ? "+" : "−"}${Math.abs(reading.rateSecondsPerDay).toFixed(1)} s/day true rate` : "stopped";
}

// ---------- frame loop ----------
function frame(now: number) {
  const wallDt = Math.min(0.1, (now - lastWall) / 1000);
  lastWall = now;
  if (!animPaused) {
    const dt = wallDt * animSpeed;
    animTime += dt;
    pose = step(esc, pose, balanceAngleAt(animTime), Math.max(dt, 1e-6));
    drawMovement();
  }
  // Timegrapher clock.
  const simDt = wallDt * SIM_SPEEDUP;
  simTime += simDt;
  win = advanceTicks(win, reading, simTime, TRACE_BEATS);
  tg = analyze(win.ticks, T, calibre.liftAngle);
  drawTimegrapher();
  if (puzzle && !solved && Number.isFinite(puzzle.holdSeconds)) {
    heldSeconds = puzzle.band(reading, tg) ? heldSeconds + simDt : 0;
    if (heldSeconds >= puzzle.holdSeconds) solved = true;
    drawPuzzle();
  }
  requestAnimationFrame(frame);
}

// ---------- controls ----------
function bindRange(id: string, key: keyof WatchSettings, fmt: (v: number) => string) {
  const el = $<HTMLInputElement>(id), out = $(`${id}-value`);
  const apply = () => { (user as any)[key] = Number(el.value); out.textContent = fmt(Number(el.value)); recompute(); drawControls(); };
  el.oninput = apply; apply();
}
bindRange("regulator", "regulatorIndex", (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}° ${v > 0 ? "(toward F)" : v < 0 ? "(toward S)" : ""}`);
bindRange("beat", "beatOffsetDeg", (v) => `${v.toFixed(1)}°`);
bindRange("wind", "hoursSinceWind", (v) => `${v.toFixed(0)} h since wound`);
bindRange("screws", "inertiaTrim", (v) => `${(v * 100).toFixed(2)} % inertia`);
{
  const amt = $<HTMLInputElement>("poise"), ang = $<HTMLInputElement>("poise-angle");
  const apply = () => {
    user.poiseCorrection = Number(amt.value) * 1e-11; user.poiseCorrectionDeg = Number(ang.value);
    $("poise-value").textContent = `${Number(amt.value).toFixed(2)} µg·cm`; $("poise-angle-value").textContent = `${ang.value}° on the rim`;
    recompute(); drawControls();
  };
  amt.oninput = apply; ang.oninput = apply; apply();
}
$<HTMLSelectElement>("position").onchange = (e) => { user.position = (e.target as HTMLSelectElement).value as WatchSettings["position"]; recompute(); drawControls(); };
$<HTMLSelectElement>("position").innerHTML = POSITIONS.map((p) => `<option value="${p.id}">${p.label}</option>`).join("");
$<HTMLSelectElement>("speed").onchange = (e) => { animSpeed = Number((e.target as HTMLSelectElement).value); };
$("pause").onclick = () => { animPaused = !animPaused; $("pause").textContent = animPaused ? "Play" : "Pause"; };
const puzzleSel = $<HTMLSelectElement>("puzzle-select");
puzzleSel.innerHTML = `<option value="">Free play</option>` + PUZZLES.map((p, i) => `<option value="${p.id}">Puzzle ${i + 1}: ${p.title}</option>`).join("");
function loadPuzzle(id: string | null) {
  puzzle = PUZZLES.find((p) => p.id === id) ?? null;
  puzzleSel.value = puzzle?.id ?? "";
  user = { ...ZERO_SETTINGS };
  for (const id of ["regulator", "beat", "wind", "screws", "poise", "poise-angle"]) { $<HTMLInputElement>(id).value = "0"; }
  $<HTMLSelectElement>("position").value = "DU";
  heldSeconds = 0; solved = false; answered = null; win = emptyWindow(); simTime = 0;
  recompute(); drawControls(); drawPuzzle();
  for (const id of ["regulator", "beat", "wind", "screws", "poise", "poise-angle"]) $<HTMLInputElement>(id).dispatchEvent(new Event("input"));
}
puzzleSel.onchange = () => loadPuzzle(puzzleSel.value || null);
$("calibre-name").textContent = calibre.name;

// ---------- verify-render contract ----------
const q = new URLSearchParams(location.search);
let named: string | null = null;
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
  Object.assign(user, s.settings);
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
