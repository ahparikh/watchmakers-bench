/**
 * Onboarding for a complete beginner.
 *
 * 1. A step-by-step guide (dialog) on first visit: how a watch works, part by part, and which
 *    Bench control fixes each part. Skippable at every step; completion persists in localStorage;
 *    replayable from the strip. Content follows docs/onboarding/ciechanowski-summary.md and links
 *    each step to the matching section of Ciechanowski's "Mechanical Watch" as the manual.
 * 2. A strip under the title block with "Replay the guide", a "how to read the trace" explainer
 *    reachable any time, and a hint slot.
 * 3. One hint per puzzle after 60 wall-seconds without progress.
 *
 * Owned by onboarding. Reads the DOM only; computes nothing about the watch. Mounted from
 * src/main.ts with one line.
 */

const GUIDE_DONE_KEY = "bench.guide.done";
const HINT_AFTER_MS = 60_000;
const MANUAL = "https://ciechanow.ski/mechanical-watch/";

type Forced = { kind: "guide"; step: number } | { kind: "trace" } | { kind: "hint" };
/** Named states (src/verify/states.ts) that force an onboarding screen for screenshots. */
const FORCED: Record<string, Forced> = {
  "onboarding-guide-welcome": { kind: "guide", step: 0 },
  "onboarding-guide-regulator": { kind: "guide", step: 4 },
  "onboarding-guide-instrument": { kind: "guide", step: 7 },
  "onboarding-trace-explainer": { kind: "trace" },
  "onboarding-hint": { kind: "hint" },
};

/** One hint per puzzle, keyed by the puzzle id in the Job picker. Names the control and the number to watch. */
const HINTS: Record<string, string> = {
  "runs-fast": "The watch gains, so slow it. Slide <b>Regulator index</b> toward S until <b>rate</b> reads near 0.",
  "out-of-beat": "The two lines on the screen should become one. Slide <b>Beat adjustment</b> until <b>beat error</b> reads 0.0.",
  "afternoon-slump": "Slide <b>State of wind</b> from 0 h to 40 h. Watch <b>amplitude</b> fall and <b>rate</b> rise. Then answer below.",
  "position-error": "Set <b>Position</b> to crown up, then crown down: the rate changes sign. The heavy spot is at the bottom when crown up. Remove weight there with <b>Poising</b>, about 10 µg·cm at 0°.",
};

interface Step {
  title: string;
  /** Short paragraphs; each line under about 15 words. */
  body: string[];
  /** The Bench control and puzzle that touch this part, if any. */
  fix?: string;
  /** Element id to spotlight while this step shows. Skipped when the element is hidden. */
  spot?: string;
  /** Pin the card's place instead of choosing it from where the spotlight is. Never the bottom. */
  cardAt?: "top" | "center";
  /** Section anchor in the manual. */
  manual?: { anchor: string; label: string };
}

const STEPS: Step[] = [
  {
    title: "A watch that keeps bad time is on the bench",
    body: [
      "The drawing is a live watch movement. The dark screen is the instrument that listens to it.",
      "In eight short steps you will learn what each part does and which part to touch when the watch runs wrong.",
      "Two minutes. Skip any time and come back from the strip above the pictures.",
    ],
  },
  {
    title: "1 · Power: the mainspring",
    body: [
      "A coiled spring in a drum stores the energy you put in by winding.",
      "Fully wound it pushes hard. As a day passes it pushes less, and the balance swings less.",
      "A healthy spring runs about 40 hours.",
    ],
    fix: "<b>State of wind</b> slider · Puzzle 3, Afternoon slump",
    spot: "ctl-wind",
    manual: { anchor: "power", label: "Power" },
  },
  {
    title: "2 · The escapement: one tooth per tick",
    body: [
      "Gears carry the spring's push to the escape wheel, the toothed wheel at the bottom of the drawing.",
      "The pallet fork above it stops the wheel and lets one tooth go at a time. Each release is a tick.",
      "Each tick also gives the balance a tiny push, like pushing someone on a swing.",
    ],
    fix: "Nothing to adjust. Watch it in the drawing; slow it with <b>Movement speed</b>.",
    spot: "movement",
    cardAt: "top",
    manual: { anchor: "escapement", label: "Escapement" },
  },
  {
    title: "3 · The balance: the part that keeps time",
    body: [
      "The big ring at the top is the balance. A fine spiral spring, the hairspring, pulls it back to centre.",
      "Together they set how long one swing takes. Here, five swings a second.",
      "Nothing else in the watch sets the rate. Every timekeeping fault is about this swing.",
    ],
    fix: "<b>Timing screws</b> change the ring's mass; mass further out means slower swings.",
    spot: "movement",
    cardAt: "center",
    manual: { anchor: "balance", label: "Balance" },
  },
  {
    title: "4 · The regulator: faster or slower",
    body: [
      "Two small pins pinch the hairspring near its outer end.",
      "Slide them toward F and less spring is free to flex: stiffer, quicker swings, the watch gains.",
      "Slide toward S and more spring is free: slower swings, the watch loses.",
    ],
    fix: "<b>Regulator index</b> slider · Puzzle 1, Runs fast",
    spot: "ctl-regulator",
    manual: { anchor: "balance", label: "Balance" },
  },
  {
    title: "5 · The stud: tick equals tock",
    body: [
      "The hairspring's outer end is pinned to a carrier called the stud.",
      "Turning the stud rotates where the balance rests. If the rest point is off centre, tick and tock take unequal times.",
      "A watchmaker calls that beat error. It sounds like a limp.",
    ],
    fix: "<b>Beat adjustment</b> slider · Puzzle 2, Out of beat",
    spot: "ctl-beat",
    manual: { anchor: "balance", label: "Balance" },
  },
  {
    title: "6 · Positions: flat versus on edge",
    body: [
      "The balance turns in ruby bearings called jewels.",
      "Lying flat it rests on a pivot tip. On edge the pivots rub their sides, so the swing shrinks.",
      "If one spot on the ring is heavier, gravity drags on it every swing when the watch stands up, and the rate drifts.",
    ],
    fix: "<b>Position</b> and <b>Poising</b> · Puzzle 4, Position error",
    spot: "ctl-position",
    manual: { anchor: "mainplate", label: "Mainplate" },
  },
  {
    title: "7 · The timegrapher: three numbers",
    body: [
      "The dark screen listens to the ticks and plots each one as a dot. A flat line keeps time; a slope gains or loses.",
      "<b>Rate</b>: seconds gained (+) or lost (−) per day. Zero is perfect.",
      "<b>Amplitude</b>: how far the balance swings, in degrees. 250 to 300 is healthy.",
      "<b>Beat error</b>: how uneven tick and tock are, in milliseconds. Under 0.5 is good.",
    ],
    fix: "Read these before you touch anything. They tell you which part is wrong.",
    spot: "timegrapher",
  },
  {
    title: "8 · Your first job",
    body: [
      "The job card says the owner's watch gains about 40 seconds a day. The timegrapher agrees: a sloping line and a plus rate.",
      "Gaining means the swing is too quick, so the regulator is the part to touch.",
      "Slide <b>Regulator index</b> toward S until <b>rate</b> reads within ±5. Hold it there and the bar on the card fills.",
    ],
    fix: "Stuck for a minute? A hint appears in the strip above the pictures.",
    spot: "puzzle",
  },
];

const STYLE = `
  #onboarding { border-bottom: 1.5px solid var(--ink); background: var(--sheet-2); padding: 10px 16px; font-size: 14px; line-height: 1.45 }
  #onboarding[hidden] { display: none }
  #onboarding button, #guide button { font: inherit; font-size: 13.5px; color: var(--ink); background: var(--sheet); border: 1px solid var(--ink); border-radius: 0; padding: 5px 12px; cursor: pointer; min-height: 32px }
  #onboarding button:hover, #guide button:hover { background: #fff }
  #bench-help { display: flex; gap: 10px 20px; align-items: flex-start; flex-wrap: wrap }
  #bench-help .replay { flex: 0 0 auto }
  #bench-help details { margin: 0; flex: 1 1 320px; padding-top: 5px }
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

  /* The guide: a backdrop, a spotlight on the part being talked about, and a card that keeps clear of it. */
  #guide-backdrop { position: fixed; inset: 0; background: rgba(28, 39, 51, 0.45); z-index: 1000 }
  #guide-backdrop[hidden] { display: none }
  .guide-spot { position: relative; z-index: 1001; outline: 3px solid var(--ruby); outline-offset: 4px; background: var(--sheet) }
  #guide { position: fixed; left: 50%; z-index: 1002; width: min(600px, calc(100vw - 32px));
    max-height: calc(100vh - 32px); overflow: auto; background: var(--sheet); color: var(--ink); border: 1.5px solid var(--ink);
    box-shadow: 0 0 0 4px var(--sheet), 0 0 0 5px var(--rule), 0 12px 32px rgba(0,0,0,0.25); padding: 16px 18px 14px; font-size: 14.5px; line-height: 1.5 }
  #guide[hidden] { display: none }
  #guide.at-center { top: 50%; transform: translate(-50%, -50%) }
  #guide.at-top { top: 20px; transform: translateX(-50%) }
  #guide h2 { margin: 0 0 8px; font-size: 17px; font-weight: 600; line-height: 1.3; padding-bottom: 8px; border-bottom: 1px solid var(--rule) }
  #guide p { margin: 6px 0; max-width: 62ch }
  #guide .fix { margin-top: 10px; padding: 8px 12px; border-left: 3px solid var(--ruby); background: var(--sheet-2) }
  #guide .fix small { display: block; font-size: 11.5px; color: var(--ink-3); letter-spacing: 0.04em; text-transform: uppercase }
  #guide .manual { font-size: 13px; color: var(--ink-2); margin-top: 8px }
  #guide .manual a { color: var(--steel) }
  #guide .nav { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap }
  #guide .nav .dots { flex: 1 1 auto; font-size: 12.5px; color: var(--ink-3) }
  #guide .nav .primary { background: var(--ink); color: var(--sheet) }
  #guide .nav .primary:hover { background: var(--case-2) }
  #guide .nav .skip { border-color: var(--rule); color: var(--ink-2) }
  @media (max-width: 760px) {
    #bench-help .explainer { grid-template-columns: 1fr }
    #guide { padding: 14px; font-size: 14px }
    #guide.at-top { top: 10px }
  }
`;

const STRIP = `<div id="bench-help">
  <button type="button" class="replay" data-act="replay">Replay the guide</button>
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

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch { /* private mode */ } };

/** The step-by-step guide. Returns open(step) so the strip can replay it. */
function mountGuide(onClose: () => void): (step?: number) => void {
  const backdrop = document.createElement("div");
  backdrop.id = "guide-backdrop"; backdrop.hidden = true;
  const card = document.createElement("section");
  card.id = "guide"; card.hidden = true;
  card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "guide-title");
  card.tabIndex = -1;
  document.body.append(backdrop, card);

  let step = 0, spotted: HTMLElement | null = null, open = false;

  const unspot = () => { spotted?.classList.remove("guide-spot"); spotted = null; };
  const spot = (id?: string, cardAt?: "top" | "center") => {
    unspot();
    const el = id ? document.getElementById(id) : null;
    if (!el || el.hidden) { card.className = `at-${cardAt ?? "center"}`; return; }
    el.classList.add("guide-spot"); spotted = el;
    el.scrollIntoView({ block: "nearest", behavior: "auto" });
    // Centred by default; at the top when the spotlight is in the lower half of the screen. Never at the bottom.
    const r = el.getBoundingClientRect();
    card.className = `at-${cardAt ?? (r.top + r.height / 2 > window.innerHeight / 2 ? "top" : "center")}`;
  };
  const render = () => {
    const s = STEPS[step], last = step === STEPS.length - 1, first = step === 0;
    card.innerHTML = `
      <h2 id="guide-title">${s.title}</h2>
      ${s.body.map((p) => `<p>${p}</p>`).join("")}
      ${s.fix ? `<div class="fix"><small>${first ? "" : "On the bench"}</small>${s.fix}</div>` : ""}
      ${s.manual ? `<p class="manual">Read more in the manual: <a href="${MANUAL}#${s.manual.anchor}" target="_blank" rel="noopener">${s.manual.label} ↗</a> (Ciechanowski, <i>Mechanical Watch</i>)</p>` : ""}
      <div class="nav">
        <span class="dots">${first ? "" : `${step} of ${STEPS.length - 1}`}</span>
        ${first ? `<button type="button" class="skip" data-act="skip">Skip, I know watches</button>` : `<button type="button" class="skip" data-act="skip">Skip</button>`}
        ${first ? "" : `<button type="button" data-act="back">Back</button>`}
        <button type="button" class="primary" data-act="next">${first ? "Start" : last ? "Start fixing" : "Next"}</button>
      </div>`;
    card.querySelectorAll<HTMLButtonElement>("[data-act]").forEach((b) => (b.onclick = () => act(b.dataset.act!)));
    spot(s.spot, s.cardAt);
    card.querySelector<HTMLButtonElement>(".primary")?.focus();
  };
  const close = () => {
    open = false; unspot(); card.hidden = backdrop.hidden = true;
    write(GUIDE_DONE_KEY, "1");
    document.removeEventListener("keydown", onKey);
    onClose();
  };
  const act = (a: string) => {
    if (a === "skip") close();
    else if (a === "back") { step = Math.max(0, step - 1); render(); }
    else if (a === "next") { if (step === STEPS.length - 1) close(); else { step++; render(); } }
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); act("next"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); act("back"); }
  };
  backdrop.onclick = close;

  return (at = 0) => {
    step = Math.min(Math.max(0, at), STEPS.length - 1); open = true;
    card.hidden = backdrop.hidden = false;
    document.addEventListener("keydown", onKey);
    render();
  };
}

export function mountOnboarding(): void {
  const main = document.querySelector("main");
  const puzzleEl = document.getElementById("puzzle");
  if (!main || !puzzleEl) return;

  const params = new URLSearchParams(location.search);
  const forced = FORCED[params.get("state") ?? ""];
  // Design's named states must screenshot without this layer; only onboarding's own states show it.
  if (params.has("state") && !forced) return;

  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: STYLE }));

  // The strip between the title block and the two pictures: replay, explainer, hint. Never covers the controls.
  const strip = document.createElement("section");
  strip.id = "onboarding";
  strip.setAttribute("aria-label", "Guide");
  strip.innerHTML = STRIP;
  main.before(strip);
  const details = strip.querySelector("details")!;
  const hintEl = strip.querySelector<HTMLElement>(".hint")!;

  // Progressive hint: one per puzzle, after 60 wall-seconds without the hold bar moving or an answer chosen.
  // The clock restarts when the guide closes, so time spent reading does not count.
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
  let guideOpen = false;
  const tick = () => {
    const now = select?.value ?? "";
    if (now !== puzzleId) { puzzleId = now; since = performance.now(); hintEl.hidden = true; }
    if (guideOpen) { since = performance.now(); return; }
    if (!hintEl.hidden || !puzzleId) return;
    if (progressed()) { since = performance.now(); return; }
    if (performance.now() - since >= HINT_AFTER_MS) showHint(puzzleId);
  };

  const openGuide = mountGuide(() => { guideOpen = false; since = performance.now(); });
  const startGuide = (at = 0) => { guideOpen = true; openGuide(at); };
  strip.querySelector<HTMLButtonElement>('[data-act="replay"]')!.onclick = () => startGuide(0);

  if (forced?.kind === "guide") { startGuide(forced.step); return; }
  if (forced?.kind === "trace") { details.open = true; return; }
  if (forced?.kind === "hint") { showHint(puzzleId); return; }

  if (read(GUIDE_DONE_KEY) !== "1") startGuide(0);
  setInterval(tick, 1000);
}
