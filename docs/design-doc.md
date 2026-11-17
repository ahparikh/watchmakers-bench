# The Watchmaker's Bench: design rationale

> **Status: skeleton.** Each section holds evidence from the repo as short notes with file
> references. Nothing here is polished prose yet. `[AKASH: …]` marks what only Akash can supply;
> the same items are in the question list at the end. The finished doc should be about two pages,
> so most of these notes will be cut down, not expanded.

- Live: https://watchmakers-bench.pages.dev
- Repo: https://github.com/ahparikh/watchmakers-bench
- Video: `[AKASH: link once recorded]`

## What it is (two sentences for a reviewer who has not seen it)

- A browser app where you learn why a mechanical watch runs fast or slow by fixing a simulated
  one. You read a timegrapher (rate in s/day, amplitude in degrees, beat error in ms), move the
  same adjustments a watchmaker has, and watch the numbers respond. (`README.md`,
  `watchmaker_brief.md` "Concept")
- What a reviewer sees on the live site today (checked 2026-11-16 at 1440×900): three columns.
  Left, the job card with a puzzle selector. Centre, a lever escapement and balance running in
  slow motion with the current phase named above it. Right, a dark timegrapher screen with three
  readouts, and under it only the sliders the current puzzle needs. A first visit opens an
  eight-step guide; puzzle 1 loads after it.
- Four puzzles plus free play, one calibre (18,000 bph), no backend, no runtime LLM.
  (`src/puzzles/index.ts`, `src/catalog/vintage18000.ts`)

## 1. Why this theme and this approach

Evidence in the repo:

- Theme fit as stated in the brief: "Theme 1, Exploration & Understanding: a simulation of a
  complex system that builds deep understanding." (`watchmaker_brief.md` "Concept")
- The approach is diagnosis, not narration. Each puzzle is a faulty watch with a symptom, a hidden
  cause and a completion rule. (`watchmaker_brief.md` "Experience"; `src/puzzles/index.ts`)
- The instrument is the real one. Rate, amplitude and beat error are derived from tick timing the
  way a timegrapher does it; the amplitude formula matches the open-source `tg` timegrapher.
  (`docs/research/02-beat-rates-and-timegrapher.md`; `src/core/timegrapher/analyze.ts`)
- No LLM at runtime was a choice made in the brief: "Claude Code is the development story, shown
  through the transcripts." (`watchmaker_brief.md` "Concept", "Scope → Out")
- The riskiest part was tested first. A 45-minute throwaway spike of the escapement had a written
  go / fallback / pivot rubric before any app code existed. (`watchmaker_brief.md` "Escapement
  spike", "Go / no-go evaluation"; `SPIKE.md`)

Needs Akash:

- `[AKASH: why watches, and why this theme over the others. One or two sentences in your voice.]`
- `[AKASH: was there a moment or a source (owning a watch, the Ciechanowski article, a
  timegrapher) that led to the idea?]`

## 2. What makes it interesting or non-obvious

Evidence in the repo:

- **It starts where the best existing explainer stops.** Ciechanowski's *Mechanical Watch* (2022)
  explains how each part works. The Bench does not redo that. It asks why the watch keeps bad time
  and how you fix it, and uses the article as the manual: the first-visit guide is built from a
  summary that maps each part to a Bench control and puzzle. (`watchmaker_brief.md` "Why it is
  non-obvious"; `docs/onboarding/ciechanowski-summary.md`)
- **One puzzle has no fix.** Puzzle 3 (Afternoon slump) cannot be solved with a slider. It ends
  with a two-choice question, and the right answer is "fit a new mainspring". The lesson is that
  some errors are physics, not adjustment. (`src/puzzles/index.ts` lines 52–69; `CLAUDE.md`
  "Puzzle completion")
- **The physics was checked, and the check changed the app.** Five research notes tag each claim
  as verified, plausible or unverified. Two findings overturned what had been assumed:
  - Claude told the research agent that a lever watch gains at low amplitude because of the
    escapement's impulse. Airy (1826), Hoyng (2015) and patent US 9,323,223 say the escapement
    alone makes it lose; the net gain in a flat-hairspring watch comes from the regulator pins.
    The model now has two separate terms and the puzzle text says so.
    (`docs/research/03-amplitude-and-isochronism.md` (b), (c); `docs/judgment-log.md` row 6)
  - A fall from 280° to 200° in a day was taken as a healthy watch. Sources put a healthy drop at
    10–15 %. So the healthy curve is 280° → 250°, and the slump puzzle uses a tired mainspring.
    (`docs/research/03-amplitude-and-isochronism.md` (a); `docs/judgment-log.md` row 7)
- **A sign that surprises.** A heavy spot at the bottom of the balance makes the watch lose above
  about 220° of amplitude and gain below it (the first zero of the Bessel function J1, 219.5°).
  Claude wrote the opposite expectation for a named state; the model, built from the research
  note, was right and the expectation was corrected. (`docs/research/04-positional-error.md` (b);
  `docs/judgment-log.md` row 12; `src/verify/states.ts` comment on `position-crown-up`)
- **"Looks wrong" was made measurable.** Screenshots alone miss fine geometry, so the page exposes
  named states and numeric checks computed from the same shapes it draws.
  (`.claude/skills/verify-render/SKILL.md`; `src/verify/states.ts`, 24 named states)

Needs Akash:

- `[AKASH: which one of these do you most want a reviewer to remember? That one leads.]`

## 3. Key design decisions and tradeoffs

Each line: the decision, what it cost, where it is recorded.

- **Two layers.** A lumped oscillator model produces the numbers (period from inertia and
  hairspring stiffness, amplitude from mainspring torque against losses, beat error from stud
  offset, isochronism and position as explicit corrections). The escapement drawing is kinematic
  and follows the balance angle. Rate is never read off the drawing. Cost: the drawing cannot
  discover a rate effect on its own; every effect has to be put into the model deliberately.
  (`CLAUDE.md` "Two layers"; `src/core/oscillator/`, `src/core/escapement/`, `src/core/watch.ts`)
- **Simulation and rendering never mix.** The core is pure functions with tests; renderers read
  state and compute nothing. This is what let a separate design agent restyle the views without
  touching a test. (`CLAUDE.md` "Rules"; `tests/core/`, 49 tests in 7 files, plus the spike's 10)
- **Geometry is derived, never drawn.** Every shape comes from one parameter object. The same
  region is used for contact and for drawing. (`src/core/escapement/params.ts`, `shapes.ts`;
  `SPIKE.md` "What was built")
- **Escapement simplified, and labelled honestly.** Pointed teeth, zero draw, no guard pin, fork
  linear in balance angle. Research confirmed the angles but noted that pointed teeth are the
  English tooth form, so the UI says "lever escapement", not "Swiss lever". Draw's energy cost is
  a loss term in the model. (`CLAUDE.md` "Escapement fidelity";
  `docs/research/05-swiss-lever-escapement.md` "Spike parameters: verdict")
- **Two clocks.** The timegrapher accumulates ticks at 10× so a slope shows within seconds; the
  movement runs from real time down to 1/100 so one beat is visible. The screen says "60 s of
  ticks at 10× time". 60× was tried first and made the 60-second hold finish in one second.
  (`CLAUDE.md` "Two clocks"; `docs/judgment-log.md` row 11)
- **Completion is a held band, not a click.** A puzzle is solved when the instrument reading stays
  in the target band for 60 sim-seconds. The first build of puzzle 2 did not look at beat error at
  all and started filling the bar on load. (`src/puzzles/index.ts`; `docs/judgment-log.md` row 10)
- **Scope cuts.** One calibre, so the picker is hidden and the calibre is a static label. Lift
  angle is a fixed 52° label. Mobile means "does not break": panels stack, puzzle 1 is solvable.
  2D only. (`CLAUDE.md` "Picker", "First calibre", "Mobile means"; `watchmaker_brief.md` "Out")
- **Tests are restated in the open, never loosened quietly.** Three spike invariants were reworded
  because the original wording encoded a false symmetry. They are listed for the reviewer to
  judge. (`SPIKE.md` "Tests that were restated"; `docs/judgment-log.md` row 4)
- **Spike result: go, with one soft criterion failed.** Seven correction rounds against a target
  of three; two were wrong diagnoses. All three must-pass criteria passed, including Akash watching
  one beat at 1/20 speed. (`SPIKE.md` "Correction rounds", "Go / no-go scoring")
- **How the work was split.** Four agent lanes (physics / puzzles, design, onboarding, hosting)
  with file ownership and a one-line handoffs file for requests across lanes. `main` moves only on
  Akash's go-ahead in the deploying agent's own transcript. (`CLAUDE.md` "Ownership";
  `docs/handoffs.md`, 15 entries; `docs/agents/`; `.claude/skills/deploy/SKILL.md`)
- **Two project skills, each written for a failure that actually happened.** `verify-render`
  (screenshots plus numeric geometry checks) and `deploy` (verify the commit in a throwaway
  worktree, push, wait for Cloudflare, confirm the URL; no force pushes). (`.claude/skills/`)
- **Hosting.** Cloudflare Pages over Vercel: no commercial-use clause, no bandwidth cap, nothing
  needs serverless. Every branch gets a preview URL. (`docs/hosting.md`)

Where the human caught what the tools did not (pick two or three for the final doc):

- The impulse pin was drawn on the wrong side of the fork. Every frozen screenshot sat at balance
  0°, where right and wrong coincide, so the checks passed. Akash saw it watching one beat at
  1/20. Fix: a sign in `shapes()`, plus a pin-in-notch test and a mid-unlock named state.
  (`docs/judgment-log.md` row 13; `tests/core/pin.test.ts`)
- The wind slider flickered at the stop threshold. Claude blamed four different things in turn.
  Akash gave the exact repro; the cause was a readout changing width and reflowing the slider
  under the pointer. Fix: fixed width, and `scripts/drag-stability.mjs` now guards it.
  (`docs/judgment-log.md` row 14)
- A frozen frame showed "LOCK" with the pin inside the notch, an impossible pose, caught reading
  screenshots. (`docs/judgment-log.md` row 8)

Needs Akash:

- `[AKASH: which tradeoff was hardest, or which would you make differently?]`
- `[AKASH: confirm the three restated spike tests are restatements, not loosenings. The judgment
  log still marks this as open.]`
- `[AKASH: was /code-review run before deploy, and did it change anything? A code-review worktree
  exists but the repo records no findings.]`

## 4. How I'd extend this with more time

From the brief's stretch list and the repo, in the brief's order:

- **Done from the stretch list:** more puzzles and positions (four puzzles, six positions).
- **A second calibre** (for example 28,800 bph) so the picker shows the physics changing. The
  catalog file and types exist; the picker is hidden until then. (`src/catalog/`; `CLAUDE.md`)
- **One complication as a capstone puzzle**: wire a date wheel from the gear train's output.
  (`watchmaker_brief.md` "Difficulty ladder", "Stretch")
- **Draw and club teeth**, which would make it a true Swiss lever and let the UI say so.
  (`CLAUDE.md` "Escapement fidelity"; `docs/research/05-swiss-lever-escapement.md`)
- **Puzzles that link to the manual**: each puzzle pointing at the relevant section of
  Ciechanowski's article. The mapping already exists. (`docs/onboarding/ciechanowski-summary.md`)
- **Effects researched but not modelled:** knocking at very high amplitude, vertical-position
  friction as its own term, multi-cause faults. (`docs/research/03`, `04`)
- **Small open requests between lanes:** a `whyWrong` string for puzzle 3, a
  `window.__bench.highlight` hook to replace synthetic pointer events. (`docs/handoffs.md`)

Needs Akash:

- `[AKASH: which one would you do first, and why?]`

## 5. Time spent

- `[AKASH: total hours. You track this outside the repo.]`
- The brief sets an 8-hour hard limit. (`watchmaker_brief.md` "Time"; `CLAUDE.md` "Hard limit")
- What the repo can show, without implying hours: commits fall on four dates, 2026-11-01 (spike
  and scaffold), 11-03 (core, four puzzles, design, onboarding, production deploy), 11-13 and
  11-14 (polish, slider fix, three-column layout). 39 commits on `main`.
- `[AKASH: rough split if you want one, for example spike / core / polish.]`

## Open questions for Akash

See the numbered list in the handoff message; each `[AKASH: …]` above maps to one of them.
