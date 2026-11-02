import { DEFAULT_PARAMS } from "./params";
import { escapementState, period, type Phase } from "./sim";
import { renderSvg } from "./render";
import { STATES } from "./states";
import { runChecks } from "./verify";

const p = DEFAULT_PARAMS;
const T = period(p);
const stage = document.getElementById("stage")!;
const speedSel = document.getElementById("speed") as HTMLSelectElement;
const scrub = document.getElementById("scrub") as HTMLInputElement;
const playBtn = document.getElementById("play") as HTMLButtonElement;

/** Middle instant of the n-th occurrence (beat index) of a phase after T/4. */
export function timeForPhase(phase: Phase, beat: number, frac = 0.5): number {
  const N = 4000;
  const start = T / 4 + beat * (T / 2);
  let inPhase = false, t0 = 0;
  for (let i = 0; i <= N; i++) {
    const t = start + (i / N) * (T / 2);
    const ph = escapementState(p, t).phase;
    if (ph === phase && !inPhase) { inPhase = true; t0 = t; }
    if (ph !== phase && inPhase) return t0 + frac * (t - t0);
  }
  return inPhase ? t0 : start;
}

let simTime = T / 4;
let playing = true;
let speed = 1;
let last = performance.now();

const q = new URLSearchParams(location.search);
if (q.has("t")) { simTime = Number(q.get("t")); playing = false; }
if (q.has("phase")) {
  simTime = timeForPhase(q.get("phase") as Phase, Number(q.get("beat") ?? 0), Number(q.get("frac") ?? 0.5));
  playing = false;
}
let named: string | null = null;
if (q.has("state") && STATES[q.get("state")!]) {
  named = q.get("state")!;
  const n = STATES[named];
  simTime = timeForPhase(n.phase, n.beat, n.frac);
  playing = false;
}
if (q.has("speed")) speed = Number(q.get("speed"));
(window as any).__bench = {
  states: () => Object.keys(STATES),
  describe: () => (named ? STATES[named].describe : "free-running"),
  check: () => (named ? runChecks(p, escapementState(p, simTime), STATES[named]) : []),
};
speedSel.value = String(speed);

function draw() {
  stage.innerHTML = renderSvg(p, escapementState(p, simTime));
  if (named) stage.querySelector("svg")!.setAttribute("data-state", named);
  scrub.value = String((((simTime - T / 4) % T) + T) % T / T);
  playBtn.textContent = playing ? "Pause" : "Play";
}
function frame(now: number) {
  const dt = (now - last) / 1000; last = now;
  if (playing) { simTime += dt * speed; draw(); }
  requestAnimationFrame(frame);
}
speedSel.onchange = () => (speed = Number(speedSel.value));
playBtn.onclick = () => { playing = !playing; draw(); };
scrub.oninput = () => { playing = false; simTime = T / 4 + Number(scrub.value) * T; draw(); };
document.getElementById("step")!.onclick = () => { playing = false; simTime += T / 400; draw(); };
draw();
requestAnimationFrame(frame);
