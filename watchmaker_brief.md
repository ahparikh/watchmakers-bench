# Watchmaker's Bench — Brief & Spike Plan

Oct 27, 2026 · @Akash Parikh

## Concept

The Watchmaker's Bench lets anyone learn why a mechanical watch keeps good or bad time by diagnosing and regulating a live, simulated movement. It is the primary plan; the escapement spike below decides whether it is viable within the first 45 minutes.

**Pitch:** a physics-driven 2D movement on a workbench, read through a timegrapher, the instrument real watchmakers use. The timegrapher shows rate (seconds per day), amplitude (degrees) and beat error (milliseconds). The reviewer adjusts the watch and watches those numbers respond.

**Why it is non-obvious:** Bartosz Ciechanowski's *Mechanical Watch* (2022) already explains how each part works, with 3D animation. This project does not compete on that. It moves from "how does it work" to "why does it run fast, and how do I fix it" — intuition built through diagnosis, not narration.

**Theme fit:** Theme 1, Exploration & Understanding: a simulation of a complex system that builds deep understanding. No LLM calls at runtime; Claude Code is the development story, shown through the transcripts.

**Time:** tracked separately by Akash, under the 8-hour hard limit. No time plan is imposed on the agent; the only gate is the spike's go / no-go.

## Experience

A reviewer opens the link and is solving a puzzle within 30 seconds, with no data or watch knowledge needed.

**Layout:** the movement on the left (escapement, balance, simplified gear train), the timegrapher trace and readouts on the right, controls below.

**Watch picker:** a dropdown of movements to work on. Each entry is a parameter set for the same simulation core: beat rate, balance inertia, mainspring torque curve, tooth count, and which puzzles apply. Start with one calibre; add a second (for example an 18,000 bph vintage movement and a 28,800 bph modern one) only once the core is stable, so the picker shows the physics changing rather than only the artwork.

**Controls:**

- Regulator index (shortens or lengthens the effective hairspring)
- Mainspring state of wind (full to run down)
- Balance inertia (timing screws)
- Beat adjustment
- Watch position (dial up, crown down, and so on)
- Time speed: real time to slow motion of one beat

**Demo mode = diagnosis puzzles.** Each puzzle loads a bundled faulty watch with a symptom and a goal:

| Puzzle | Symptom | Hidden cause | Fix |
| --- | --- | --- | --- |
| Runs fast | Gains about 40 s/day | Regulator off-centre | Move the index toward slow |
| Out of beat | Uneven tick, high beat error | Hairspring stud rotated | Adjust the beat |
| Afternoon slump | Fine when wound, drifts by evening | Low amplitude as the mainspring runs down | Explain the trade-off; there is no single knob |
| Position error | Good dial up, bad crown down | Poise error | Compare positions on the trace |

Puzzle 1 ships first; the others follow. Puzzle 3 is the teaching moment: some errors are physics, not adjustment.

**Difficulty ladder (stretch):** puzzles are ordered from one-knob fixes (Runs fast) to multi-cause faults (Position error) to open-ended builds. Later puzzles can require background reading: each links to the relevant section of Ciechanowski's *Mechanical Watch* as the "manual", so the Bench is the lab and the blog post is the textbook. The capstone is **Make your own complication**: given the gear train's output, the user wires up a date wheel or power-reserve indicator by choosing ratios and triggers, and the Bench checks that it advances correctly. This doubles as the complication stretch item in Scope.

## Scope

The core is one movement, one instrument and a handful of puzzles; stretch items are added only after the core is deployed and stable.

**Core:**

- Swiss lever escapement, balance wheel and hairspring, drawn to stay visually correct
- Mainspring torque curve feeding amplitude
- Timegrapher: tick trace, rate, amplitude, beat error
- Diagnosis puzzles, starting with one
- Watch picker with one calibre

**Stretch, in priority order:**

1. More puzzles and watch positions
2. A second calibre in the picker, with different physics
3. One complication, built as the capstone puzzle (a date wheel is the cheapest; a chronograph is a second gear train and is out)

**Out:**

- 3D rendering; automatic winding; multiple complications
- Any runtime LLM or backend
- Mobile-first layout (it must not break on a phone, but desktop is the target)

**Ordering rule for the agent:** core items are built and deployed before any stretch item starts. Stretch items go in the order above, each as its own branch, so an unfinished one never blocks the submission.

## Architecture

Simulation and rendering are strictly separate, so a bad drawing can never corrupt the physics and a renderer can be swapped without touching tested code.

&#91;embedded content: architecture · sim core, two views, tests\]

Controls and puzzles set parameters; the core advances state each tick; the movement view and timegrapher only read it. A watch catalog (one JSON entry per calibre) feeds the controls, so a new watch is data, not code. A complication would be a second state machine driven by the gear train's output. Stack: Vite + TypeScript + plain SVG, Vitest for the core, Playwright for render checks, static deploy.

## Escapement spike

The spike tests the riskiest visual — the escapement locking and releasing in sync with the balance — in a throwaway page, timeboxed to 45 minutes.

**Setup (5 min):** a fresh repo folder `spike/`, one HTML file plus one TypeScript module, Vite dev server, Playwright installed for screenshots. Keep the spike out of the main app; it may be thrown away.

**Steps:**

1. **Parameterized geometry (10 min).** Ask Claude to define the escape wheel (15 teeth), pallet fork and balance from a small set of named parameters: tooth count, lift angles, lock angle, drop. Shapes must be derived from those numbers, never hand-drawn paths.
2. **State machine before pictures (10 min).** Model one beat as phases: lock → unlock → impulse → drop → lock. Write tests first (`/tdd`): the escape wheel advances exactly half a tooth per beat; the pallet never overlaps a tooth; the balance swings both ways.
3. **Render (10 min).** Draw the state as flat SVG in a technical-drawing style. The renderer reads state only; it computes nothing.
4. **Look and correct (10 min).** Screenshot five phases of one beat with Playwright. Have Claude compare each frame to the phase it should show, and fix what is off.
5. **Slow-motion check.** Play one beat at 1/20 speed and watch it yourself. Your eye is the final judge.

**Prompt seed for step 1:**

> Build only a Swiss lever escapement as a 2D SVG in `spike/`. All geometry must come from named parameters in one config object. Before drawing, write a pure function `escapementState(t)` that returns angles for balance, fork and wheel plus the current phase, with unit tests for the invariants in the plan. Do not build anything else.

**Record during the spike:** the number of correction rounds, what Claude got wrong, and how you caught it. That is design-doc and video material whatever the outcome.

## Go / no-go evaluation

At minute 45, score the spike on five criteria; any "fail" on a must-pass criterion triggers the fallback or the pivot.

| Criterion | Must pass? | Pass | Fail |
| --- | --- | --- | --- |
| Invariant tests | Yes | All green, no skipped tests | Tests fail or were weakened to pass |
| Visual correctness at 1/20 speed | Yes | No clipping; lock, impulse and drop are visible | Parts overlap or engage at the wrong moment |
| Convergence | Yes | Each correction round fixed more than it broke | Fixes keep reintroducing earlier bugs |
| Correction rounds | No | 3 or fewer | 6 or more |
| Readability | No | A non-expert can follow one beat | Correct but unreadable |

**Decision:**

- **Go:** all must-pass criteria pass. Build the full Bench.
- **Fallback:** tests pass but the visual fails. Keep the Bench, replace the escapement with a schematic balance wheel and a phase indicator. The timegrapher and puzzles still carry the idea. Note this as a deliberate scoping call in the design doc.
- **Pivot:** tests fail or the fixes are not converging. Switch to Harness Lab (see the pivot brief). The spike transcript becomes evidence of a scoping decision, which the brief explicitly rewards.

Spend at most 15 extra minutes if the result is borderline. Past 1 hour total, decide.

## Claude Code workflow

The workflow is designed so the transcripts show you steering: aligning first, testing physics, verifying visuals, and rejecting wrong output.

| Step | Tool | What it shows reviewers |
| --- | --- | --- |
| Align on the design | `/grill-with-docs` | You make the design calls; horology terms land in `GLOSSARY.md` |
| Check the physics | `/research` | Claims checked against primary sources before they become code |
| Build the sim | `/tdd` | Invariants as tests; red-green-refactor |
| Verify visuals | Custom `verify-render` skill | You extended the toolkit for this project's real failure mode |
| Review before deploy | `/code-review` | Parallel review subagents (standards + spec) |

**The `verify-render` skill** (written by you, early): start the dev server, screenshot named states via Playwright, run numeric geometry assertions (no overlap, lock angle within tolerance), and report failures as test output. Vision alone is too weak for fine geometry; numbers make "looks wrong" actionable.

**Judgment moments to look for and keep:** Claude asserting incorrect horology, a test weakened to pass, a render that runs but looks wrong. Correct them visibly in the transcript.

## Physics to verify and risks

Every physics claim below gets checked with `/research` before it becomes code; none of the numbers here are verified yet.

**Claims to verify:**

- Balance period from inertia and hairspring stiffness (T = 2π√(I/k)), and how the regulator changes effective length
- Typical beat rates (for example 18,000 or 28,800 beats per hour) and how the timegrapher derives rate and beat error from tick timing
- How amplitude falls as the mainspring runs down, and why low amplitude changes rate (isochronism error)
- How position (dial up versus crown down) produces rate differences
- Escapement phases and typical lift angle

**Risks:**

| Risk | Mitigation |
| --- | --- |
| Escapement visual never looks right | Spike first; schematic fallback |
| Plausible but wrong physics | `/research` before code; tests on invariants |
| Compared to Ciechanowski | Different goal (diagnosis); 2D technical style, not 3D |
| Scope creep past 6 hours | Time plan with a deployable checkpoint at 2.75 hours |
| Reviewer gets lost | Puzzle 1 opens by default with a one-line goal |

**Deploy:** static Vite build on Vercel or Cloudflare Pages; no backend, no keys.
