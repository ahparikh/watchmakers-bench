/**
 * First-run guidance for a complete beginner: what the two pictures are, what the goal is,
 * which slider to touch, and how to tell they are winning. Plus a "how to read the trace"
 * explainer reachable any time, and one hint per puzzle after 60 wall-seconds without progress.
 *
 * Owned by onboarding. Reads the DOM only; computes nothing about the watch. Mounted from
 * src/main.ts with one line. Dismissal persists in localStorage.
 */

const DISMISS_KEY = "bench.onboarding.dismissed";
const HINT_AFTER_MS = 60_000;

/** Named states (src/verify/states.ts) that force an onboarding screen for screenshots. */
const FORCED: Record<string, "first-run" | "trace" | "hint"> = {
  "onboarding-first-run": "first-run",
  "onboarding-trace-explainer": "trace",
  "onboarding-hint": "hint",
};

/** One hint per puzzle, keyed by the puzzle id in the Job picker. Names the control and the number to watch. */
const HINTS: Record<string, string> = {
  "runs-fast": "The watch gains, so slow it. Slide <b>Regulator index</b> toward S until <b>rate</b> reads near 0.",
  "out-of-beat": "The two lines on the screen should become one. Slide <b>Beat adjustment</b> until <b>beat error</b> reads 0.0.",
  "afternoon-slump": "Slide <b>State of wind</b> from 0 h to 40 h. Watch <b>amplitude</b> fall and <b>rate</b> rise. Then answer below.",
  "position-error": "Set <b>Position</b> to crown up, then crown down: the rate changes sign. The heavy spot is at the bottom when crown up. Remove weight there with <b>Poising</b>, about 10 µg·cm at 0°.",
};

const STYLE = `
  #onboarding { border-bottom: 1.5px solid var(--ink); background: var(--sheet-2); padding: 12px 16px; font-size: 14px; line-height: 1.45 }
  #onboarding[hidden] { display: none }
  #onboarding .lead-row { display: flex; gap: 10px 16px; align-items: center; flex-wrap: wrap; margin-bottom: 8px }
  #onboarding .lead { margin: 0; font-weight: 600; flex: 1 1 auto }
  #onboarding .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap }
  #onboarding ol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 20px; margin: 0; padding: 0; list-style: none; counter-reset: step }
  #onboarding li { position: relative; padding-left: 28px; max-width: 46ch }
  #onboarding li::before { counter-increment: step; content: counter(step); position: absolute; left: 0; top: 1px; width: 20px; height: 20px; border: 1px solid var(--ink); border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 600 }
  #onboarding li b { color: var(--ink) }
  #onboarding button, #bench-help button { font: inherit; font-size: 13.5px; color: var(--ink); background: var(--sheet); border: 1px solid var(--ink); border-radius: 0; padding: 5px 12px; cursor: pointer; min-height: 32px }
  #onboarding button:hover, #bench-help button:hover { background: #fff }
  #onboarding .first-run[hidden] { display: none }
  #bench-help { display: flex; gap: 12px 20px; align-items: flex-start; flex-wrap: wrap }
  #onboarding .first-run:not([hidden]) + #bench-help details:not([open]) { display: none }
  #onboarding .first-run:not([hidden]) + #bench-help:has(details[open], .hint:not([hidden])) { margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--rule) }
  #bench-help details { margin: 0; flex: 1 1 320px }
  #bench-help summary { cursor: pointer; color: var(--steel); font-weight: 500 }
  #bench-help summary:hover { text-decoration: underline }
  #bench-help .explainer { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 28px; margin-top: 8px }
  #bench-help dl { margin: 6px 0 0; display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px }
  #bench-help dt { font-weight: 600 }
  #bench-help dd { margin: 0; color: var(--ink-2); max-width: 46ch }
  #bench-help p { margin: 0; color: var(--ink-2); max-width: 60ch }
  #bench-help .hint { flex: 1 1 320px; border: 1px dashed var(--ruby); background: var(--sheet); padding: 8px 12px; color: var(--ink); max-width: 60ch }
  #bench-help .hint[hidden] { display: none }
  #bench-help .hint .tag { color: var(--ruby); font-weight: 600; margin-right: 6px }
  @media (max-width: 760px) {
    #onboarding ol { grid-template-columns: 1fr }
    #bench-help .explainer { grid-template-columns: 1fr }
  }
`;

const FIRST_RUN = `<div class="first-run">
  <div class="lead-row">
    <p class="lead">First time at the bench? Three things to know.</p>
    <div class="row">
      <button type="button" data-act="trace">How do I read the screen?</button>
      <button type="button" data-act="dismiss">Got it</button>
    </div>
  </div>
  <ol>
    <li><b>Left: the movement.</b> The tick-tock engine of a watch, running live. The big ring is the balance; it swings five times a second.</li>
    <li><b>Right: the timegrapher.</b> The instrument a watchmaker listens with. It turns ticks into three numbers. The first, <b>rate</b>, is seconds gained or lost per day.</li>
    <li><b>Your job is on the card.</b> Read the symptom, then move one slider at the bottom of the page. You are winning when the bar on the card fills.</li>
  </ol>
</div>`;

const TRACE_EXPLAINER = `<div id="bench-help">
  <details>
    <summary>How to read the trace on the timegrapher screen</summary>
    <div class="explainer">
      <div>
        <p>Each dot is one tick. The screen holds about a minute of ticks.</p>
        <dl>
          <dt>Flat line</dt><dd>The watch keeps time.</dd>
          <dt>Sloping line</dt><dd>Gaining or losing. Here, down to the right means gaining. Steeper is worse.</dd>
          <dt>Two lines apart</dt><dd>Out of beat: the tick and the tock are not evenly spaced.</dd>
        </dl>
      </div>
      <div>
        <p>Below the screen, three numbers.</p>
        <dl>
          <dt>rate</dt><dd>Seconds gained (+) or lost (−) per day. Zero is perfect.</dd>
          <dt>amplitude</dt><dd>How far the balance swings each way, in degrees. Healthy is about 250 to 300.</dd>
          <dt>beat error</dt><dd>How uneven tick and tock are, in milliseconds. Under 0.5 is good.</dd>
        </dl>
      </div>
    </div>
  </details>
  <div class="hint" hidden></div>
</div>`;

export function mountOnboarding(): void {
  const sheet = document.querySelector(".sheet");
  const main = document.querySelector("main");
  const puzzleEl = document.getElementById("puzzle");
  if (!sheet || !main || !puzzleEl) return;

  const forced = FORCED[new URLSearchParams(location.search).get("state") ?? ""];
  const anyNamedState = new URLSearchParams(location.search).has("state");
  // Design's named states must screenshot without this layer; only onboarding's own states show it.
  if (anyNamedState && !forced) return;

  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: STYLE }));

  // One strip between the title block and the two pictures: the first-run guide (dismissible),
  // then the always-available explainer and the hint slot. Never covers the controls.
  const strip = document.createElement("section");
  strip.id = "onboarding";
  strip.setAttribute("aria-label", "Guide");
  strip.innerHTML = FIRST_RUN + TRACE_EXPLAINER;
  main.before(strip);
  const firstRun = strip.querySelector<HTMLElement>(".first-run")!;
  const details = strip.querySelector("details")!;
  const hintEl = strip.querySelector<HTMLElement>(".hint")!;

  let dismissed = false;
  try { dismissed = localStorage.getItem(DISMISS_KEY) === "1"; } catch { /* private mode: no persistence */ }
  if (forced) dismissed = forced !== "first-run";
  firstRun.hidden = dismissed;

  strip.querySelector<HTMLButtonElement>('[data-act="dismiss"]')!.onclick = () => {
    firstRun.hidden = true;
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };
  strip.querySelector<HTMLButtonElement>('[data-act="trace"]')!.onclick = () => {
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Progressive hint: one per puzzle, after 60 wall-seconds without the hold bar moving or an answer chosen.
  const select = document.getElementById("puzzle-select") as HTMLSelectElement | null;
  let puzzleId = select?.value ?? "";
  let since = performance.now();
  const showHint = (id: string) => {
    const text = HINTS[id];
    if (!text) return;
    hintEl.innerHTML = `<span class="tag">Hint</span>${text}`;
    hintEl.hidden = false;
  };
  const progressed = () => {
    const bar = puzzleEl.querySelector(".hold span")?.textContent ?? "";
    if (bar && !bar.startsWith("0 /")) return true;
    if (puzzleEl.querySelector(".choice.right, .choice.wrong")) return true;
    return false;
  };
  const tick = () => {
    const now = select?.value ?? "";
    if (now !== puzzleId) { puzzleId = now; since = performance.now(); hintEl.hidden = true; }
    if (!hintEl.hidden || !puzzleId) return;
    if (progressed()) { since = performance.now(); return; }
    if (performance.now() - since >= HINT_AFTER_MS) showHint(puzzleId);
  };

  if (forced === "trace") details.open = true;
  if (forced === "hint") showHint(puzzleId);
  if (!forced) setInterval(tick, 1000);
}
