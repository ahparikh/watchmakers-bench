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
  "onboarding-guide-balance": { kind: "guide", step: 3 },
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

/** A lit region: a selector, or a selector with its own margin in pixels. Anchor on parts that hold
 *  still (the balance ring, the wheel's tip circle) and pad for the parts that move around them,
 *  so the box never changes while the movement runs. */
type Spot = string | { sel: string; pad: number };
/** The balance ring, with room for the screws, stud track, swing arcs and regulator scale round it. */
const BALANCE: Spot = { sel: "#movement circle.balance, #movement text.mark", pad: 22 };

interface Step {
  title: string;
  /** Short paragraphs; each line under about 15 words. */
  body: string[];
  /** The Bench control and puzzle that touch this part, if any. */
  fix?: string;
  /** CSS selector for the part(s) to spotlight: the frame wraps the union of their boxes. Re-measured
   *  every frame, because the drawing is redrawn every frame. Hidden elements are ignored. */
  spot?: Spot | Spot[];
  /** Id of the control whose part should glow on the drawing while this step shows (main.ts lights
   *  the part a control acts on while that control is held). */
  hot?: string;
  /** Movement speed stop for this step (index into the speed slider; 0 is the slowest, 1/100).
   *  The guide runs the movement in slow motion so it does not distract from the reading. */
  speed?: number;
  /** Section anchor in the manual. */
  manual?: { anchor: string; label: string };
}

const STEPS: Step[] = [
  {
    title: "A watch that keeps bad time is on the bench",
    body: [
      "The drawing is a live watch movement. The dark screen is the instrument that listens to it.",
      "In eight short steps you will learn what each part does and which slider to touch when the watch runs wrong.",
      "While you read, every slider is unlocked. Your first job loads at the end.",
      "Two minutes. Skip any time and come back with <b>Replay the guide</b>, under the job card.",
    ],
  },
  {
    title: "1 · Power: the mainspring",
    body: [
      "A coiled spring in a drum stores the energy you put in by winding.",
      "Fully wound it pushes hard. As a day passes it pushes less, and the balance swings less.",
      "A healthy spring runs about 40 hours.",
    ],
    fix: "<b>State of wind</b> slider · Puzzle 3, Afternoon slump. Drag it now: the red arcs round the balance show how far it swings.",
    spot: ["#ctl-wind", BALANCE],
    hot: "wind",
    manual: { anchor: "power", label: "Power" },
  },
  {
    title: "2 · The escapement: one tooth per tick",
    body: [
      "Gears carry the spring's push to the escape wheel, the toothed wheel in the drawing.",
      "The pallet fork above it stops the wheel and lets one tooth go at a time. Each release is a tick.",
      "Each tick also gives the balance a tiny push, like pushing someone on a swing.",
    ],
    fix: "Nothing to adjust. It is running in slow motion here so you can watch one tooth escape.",
    // Both centreline circles: the wheel's tip circle and the impulse pin's path. Neither moves, and
    // between them they span the wheel, the fork and the pin.
    spot: { sel: "#movement circle.centreline", pad: 12 },
    speed: 1,
    manual: { anchor: "escapement", label: "Escapement" },
  },
  {
    title: "3 · The balance: the part that keeps time",
    body: [
      "The big ring is the balance. The fine spiral inside it is the hairspring, which pulls it back to centre.",
      "Together they set how long one swing takes. Here, five swings a second.",
      "Nothing else in the watch sets the rate. Every timekeeping fault is about this swing.",
    ],
    fix: "<b>Timing screws</b> are the brass dots on the rim. Drag the slider: screws further out mean slower swings.",
    spot: [BALANCE, "#ctl-screws"],
    hot: "screws",
    manual: { anchor: "balance", label: "Balance" },
  },
  {
    title: "4 · The regulator: faster or slower",
    body: [
      "The regulator is the short arm at the edge of the balance, pointing between <b>F</b> and <b>S</b>.",
      "Its two pins grip the hairspring near its outer end. Only the spring between the pins and the centre does the work.",
      "Toward <b>F</b> (fast): the working spring gets shorter and stiffer. The balance swings quicker and the watch gains time.",
      "Toward <b>S</b> (slow): the working spring gets longer and softer. The balance swings slower and the watch loses time.",
    ],
    fix: "<b>Regulator index</b> slider · Puzzle 1, Runs fast. Drag it now and watch the arm move along the spring.",
    spot: ["#ctl-regulator", BALANCE],
    hot: "regulator",
    manual: { anchor: "balance", label: "Balance" },
  },
  {
    title: "5 · The stud: tick equals tock",
    body: [
      "The hairspring's outer end is pinned to the stud, the dot on the curved track beside the balance.",
      "Sliding the stud along its track turns the whole spring, and with it where the balance rests. Off centre, tick and tock take unequal times.",
      "A watchmaker calls that beat error. It sounds like a limp.",
    ],
    fix: "<b>Beat adjustment</b> slider · Puzzle 2, Out of beat. Drag it now and watch the stud and the spring turn.",
    spot: ["#ctl-beat", BALANCE],
    hot: "beat",
    manual: { anchor: "balance", label: "Balance" },
  },
  {
    title: "6 · Positions: flat versus on edge",
    body: [
      "The balance turns in ruby bearings called jewels.",
      "Lying flat it rests on a pivot tip. On edge the pivots rub their sides, so the swing shrinks.",
      "If one spot on the ring is heavier, gravity drags on it every swing when the watch stands up, and the rate drifts.",
    ],
    fix: "<b>Position</b> and <b>Poising</b> · Puzzle 4, Position error. Change Position: the drawing turns and the <i>g</i> marker shows gravity. Poising drills the dashed spot on the rim.",
    spot: ["#ctl-poise, #ctl-poise-angle, #ctl-position", BALANCE, "#movement g.gravity"],
    hot: "poise",
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
    spot: "#timegrapher",
  },
  {
    title: "8 · Your first job",
    body: [
      "Jobs live in the <b>Job</b> picker. The first one: the owner's watch gains about 40 seconds a day.",
      "Gaining means the swing is too quick, so the regulator is the part to touch.",
      "Slide <b>Regulator index</b> toward S until <b>rate</b> reads within ±5. Hold it there and the bar on the job card fills.",
    ],
    fix: "Press <b>Start fixing</b> to load the job. Stuck for a minute? A hint appears under the job card.",
    spot: "#puzzle-select",
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

  /* The guide: a dim layer with a hole cut for each part being talked about, a ruby frame round each
     hole, and a card docked at the side so it never sits on the drawing. Nothing on the page moves. */
  #guide-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(28, 39, 51, 0.45) }
  #guide-backdrop[hidden] { display: none }
  #guide-frames[hidden] { display: none }
  .guide-frame { position: fixed; z-index: 1001; pointer-events: none; border: 3px solid var(--ruby); border-radius: 4px }
  #guide { position: fixed; left: 20px; top: 96px; z-index: 1002; width: min(340px, 44vw);
    max-height: calc(100vh - 116px); overflow: auto; background: var(--sheet); color: var(--ink); border: 1.5px solid var(--ink);
    box-shadow: 0 0 0 4px var(--sheet), 0 0 0 5px var(--rule), 0 12px 32px rgba(0,0,0,0.25); padding: 16px 18px 14px; font-size: 14.5px; line-height: 1.5 }
  #guide.right { left: auto; right: 20px }
  #guide.low { top: auto; bottom: 20px }
  #guide.center { right: auto; bottom: auto; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 40px) }
  #guide[hidden] { display: none }
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
    /* No room at the side on a phone: the card sits at the top and the page is padded below it. */
    #guide, #guide.right, #guide.low, #guide.center { transform: none; left: 16px; right: 16px; top: 10px; bottom: auto; width: auto; padding: 14px; font-size: 14px; max-height: calc(100vh - 20px) }
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

/** Switch the Job picker and let main.ts load the puzzle. "" is Free play. */
function selectPuzzle(id: string) {
  const sel = document.getElementById("puzzle-select") as HTMLSelectElement | null;
  if (!sel || sel.value === id) return;
  sel.value = id;
  sel.dispatchEvent(new Event("change"));
}

/** The step-by-step guide. Returns open(step, switchToFreePlay) so the strip can replay it. */
function mountGuide(onClose: () => void): (step?: number, freePlay?: boolean) => void {
  const backdrop = document.createElement("div");
  backdrop.id = "guide-backdrop"; backdrop.hidden = true;
  const frames = document.createElement("div");
  frames.id = "guide-frames"; frames.hidden = true;
  const card = document.createElement("section");
  card.id = "guide"; card.hidden = true;
  card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "guide-title");
  card.tabIndex = -1;
  document.body.append(backdrop, frames, card);

  let step = 0, open = false, selectors: Spot[] = [], raf = 0;
  const narrow = () => window.matchMedia("(max-width: 760px)").matches;
  /** Phones only: the page is padded below the card, since there is no side to dock it on.
   *  The band only grows during a tour, so content does not shift between steps. */
  let band = 0, bodyPadding = "";
  const reserveBand = () => {
    if (!narrow()) return;
    const need = card.getBoundingClientRect().bottom + 16;
    if (need <= band) return;
    band = need;
    document.body.style.paddingTop = `${band}px`;
  };
  /** The job that was selected when the guide opened; Skip puts it back. */
  let previousJob = "";

  type Box = { l: number; t: number; r: number; b: number };
  /** Padded union of one selector's visible elements, in viewport pixels. */
  const measure = (spot: Spot): Box | null => {
    const selector = typeof spot === "string" ? spot : spot.sel, PAD = typeof spot === "string" ? 8 : spot.pad;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, n = 0;
    for (const el of Array.from(document.querySelectorAll<Element>(selector))) {
      if (el instanceof HTMLElement && el.hidden) continue;
      const k = el.getBoundingClientRect();
      if (k.width === 0 && k.height === 0) continue;
      l = Math.min(l, k.left); t = Math.min(t, k.top); r = Math.max(r, k.right); b = Math.max(b, k.bottom); n++;
    }
    return n ? { l: l - PAD, t: t - PAD, r: r + PAD, b: b + PAD } : null;
  };
  /** Largest box seen for each selector this step, in page coordinates. Parts move (teeth, fork,
   *  swing arcs), so a box re-measured every frame flickers; one that only grows settles at once. */
  let steady: (Box | null)[] = [];
  const settle = () => { steady = []; };
  const boxes = () => {
    const sx = window.scrollX, sy = window.scrollY;
    return selectors.map((sel, i) => {
      const k = measure(sel), was = steady[i] ?? null;
      if (k) {
        const now = { l: Math.floor(k.l + sx), t: Math.floor(k.t + sy), r: Math.ceil(k.r + sx), b: Math.ceil(k.b + sy) };
        steady[i] = was ? { l: Math.min(was.l, now.l), t: Math.min(was.t, now.t), r: Math.max(was.r, now.r), b: Math.max(was.b, now.b) } : now;
      }
      const g = steady[i] ?? null;
      return g ? { l: g.l - sx, t: g.t - sy, r: g.r - sx, b: g.b - sy } : null;
    }).filter((k): k is Box => k !== null);
  };
  /** Cut the holes and move the frames. Runs every frame: the drawing is redrawn every frame. */
  const place = () => {
    const ks = boxes(), W = window.innerWidth, H = window.innerHeight;
    backdrop.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z${ks.map((k) => `M${k.l} ${k.t}H${k.r}V${k.b}H${k.l}Z`).join("")}")`;
    while (frames.children.length < ks.length) frames.appendChild(Object.assign(document.createElement("div"), { className: "guide-frame" }));
    while (frames.children.length > ks.length) frames.lastChild!.remove();
    ks.forEach((k, i) => Object.assign((frames.children[i] as HTMLElement).style, { left: `${k.l}px`, top: `${k.t}px`, width: `${k.r - k.l}px`, height: `${k.b - k.t}px` }));
    if (open) raf = requestAnimationFrame(place);
  };
  const spot = (sel?: Spot | Spot[]) => {
    selectors = sel === undefined ? [] : Array.isArray(sel) ? sel : [sel];
    settle();
    const first = selectors.length ? document.querySelector(typeof selectors[0] === "string" ? selectors[0] : selectors[0].sel) : null;
    first?.scrollIntoView({ block: "nearest", behavior: "auto" });
    // Bring every lit part on screen when they fit together (a footer slider plus the balance).
    const all = boxes();
    if (all.length > 1) {
      const top = Math.min(...all.map((k) => k.t)), bottom = Math.max(...all.map((k) => k.b));
      if (bottom - top <= window.innerHeight) {
        if (bottom > window.innerHeight) window.scrollBy({ top: bottom - window.innerHeight, behavior: "auto" });
        else if (top < 0) window.scrollBy({ top, behavior: "auto" });
      }
    }
    card.classList.remove("right", "low", "center");
    if (narrow()) {
      const k = boxes()[0], c = card.getBoundingClientRect();
      if (k && k.t < c.bottom + 4) window.scrollBy({ top: k.t - c.bottom - 4, behavior: "auto" });
    } else if (!selectors.length) {
      // Nothing to point at (the welcome): centred on the page.
      card.classList.add("center");
    } else {
      // The card lives over the left rail (the job card is not needed while reading). It moves only
      // when a lit part would be under it there: then the first slot that covers none, else the least.
      const lit = boxes();
      let best: string[] = [], least = Infinity;
      for (const slot of [[], ["right"], ["low"], ["right", "low"]]) {
        card.classList.remove("right", "low"); card.classList.add(...slot);
        const c = card.getBoundingClientRect();
        const covered = lit.reduce((sum, k) => sum + Math.max(0, Math.min(k.r, c.right) - Math.max(k.l, c.left)) * Math.max(0, Math.min(k.b, c.bottom) - Math.max(k.t, c.top)), 0);
        if (covered < least) { least = covered; best = slot; }
        if (covered === 0) break;
      }
      card.classList.remove("right", "low"); card.classList.add(...best);
    }
    cancelAnimationFrame(raf); place();
  };
  /** Put every control back to neutral, so what a reader tried on one step does not colour the next. */
  const resetControls = () => {
    for (const id of ["regulator", "beat", "wind", "screws", "poise", "poise-angle"]) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el && Number(el.value) !== 0) { el.value = "0"; el.dispatchEvent(new Event("input")); }
    }
    const pos = document.getElementById("position") as HTMLSelectElement | null;
    if (pos && pos.selectedIndex > 0) { pos.selectedIndex = 0; pos.dispatchEvent(new Event("change")); }
  };
  /** Movement speed: the guide slows the drawing right down, then puts the reader's choice back. */
  const speedSlider = () => document.getElementById("speed-slider") as HTMLInputElement | null;
  let speedBefore: string | null = null;
  const setSpeed = (value: string) => {
    const el = speedSlider();
    if (!el) return;
    if (speedBefore === null) speedBefore = el.value;
    if (el.value !== value) { el.value = value; el.dispatchEvent(new Event("input")); }
  };
  /** main.ts makes a part glow while its control is held. Hold the step's control; let go of the last. */
  let hotId: string | undefined;
  const arm = (id?: string) => {
    hotId = id;
    window.dispatchEvent(new Event("pointerup"));
    if (id) document.getElementById(id)?.dispatchEvent(new Event("pointerdown"));
  };
  // A real pointer release (after a drag, or a click on the card) lets go too: take hold again.
  const rearm = (e: Event) => { if (open && hotId && e.isTrusted) setTimeout(() => { if (open && hotId) document.getElementById(hotId)?.dispatchEvent(new Event("pointerdown")); }, 0); };

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
    reserveBand();
    resetControls();
    setSpeed(String(s.speed ?? 0));
    arm(s.hot);
    spot(s.spot);
    card.querySelector<HTMLButtonElement>(".primary")?.focus();
  };
  const close = (finished: boolean) => {
    open = false; cancelAnimationFrame(raf); selectors = [];
    card.hidden = backdrop.hidden = frames.hidden = true;
    document.body.style.paddingTop = bodyPadding; band = 0;
    write(GUIDE_DONE_KEY, "1");
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("pointerup", rearm);
    window.removeEventListener("resize", settle);
    document.removeEventListener("change", settle, true);
    resetControls(); arm(undefined);
    if (speedBefore !== null) { const back = speedBefore; setSpeed(back); }
    speedBefore = null;
    // Finishing loads the first job; skipping puts back whatever was selected before.
    selectPuzzle(finished ? "runs-fast" : previousJob);
    onClose();
  };
  const act = (a: string) => {
    if (a === "skip") close(false);
    else if (a === "back") { step = Math.max(0, step - 1); render(); }
    else if (a === "next") { if (step === STEPS.length - 1) close(true); else { step++; render(); } }
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); close(false); }
    else if (e.key === "ArrowRight") { e.preventDefault(); act("next"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); act("back"); }
  };
  backdrop.onclick = () => close(false);

  return (at = 0, freePlay = true) => {
    step = Math.min(Math.max(0, at), STEPS.length - 1); open = true;
    const sel = document.getElementById("puzzle-select") as HTMLSelectElement | null;
    previousJob = sel?.value ?? "";
    // Free play shows every slider, so each step can spotlight the one it names.
    if (freePlay) selectPuzzle("");
    bodyPadding = document.body.style.paddingTop; band = 0;
    card.hidden = backdrop.hidden = frames.hidden = false;
    document.addEventListener("keydown", onKey);
    window.addEventListener("pointerup", rearm);
    // A resize, or a new Position (the drawing turns), moves the parts for good: measure afresh.
    window.addEventListener("resize", settle);
    document.addEventListener("change", settle, true);
    speedBefore = null;
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
  const startGuide = (at = 0, freePlay = true) => { guideOpen = true; openGuide(at, freePlay); };
  strip.querySelector<HTMLButtonElement>('[data-act="replay"]')!.onclick = () => startGuide(0);

  if (forced?.kind === "guide") { startGuide(forced.step, false); return; }
  if (forced?.kind === "trace") { details.open = true; return; }
  if (forced?.kind === "hint") { showHint(puzzleId); return; }

  // Scripted browsers (the solve and drag scripts) load "/" and expect puzzle 1, so the guide opens
  // for them only when the URL asks with ?guide.
  const scripted = navigator.webdriver && !params.has("guide");
  if (read(GUIDE_DONE_KEY) !== "1" && !scripted) startGuide(0);
  setInterval(tick, 1000);
}
