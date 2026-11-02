# The Watchmaker's Bench

An exploration, not yet a committed build. The idea: a browser app where anyone learns why a mechanical watch runs fast or slow by diagnosing and regulating a live, simulated movement, read through a timegrapher (rate in s/day, amplitude in degrees, beat error in ms). Diagnosis puzzles ("runs fast: find and fix it") carry the teaching. Ciechanowski's *Mechanical Watch* already explains *how* a watch works; this is about *why it keeps bad time and how you fix it*.

`watchmaker_brief.md` is the source of truth for concept, scope, puzzles, controls, architecture and the go / no-go rubric. Read it before any design or build work. This file only carries what the brief does not say or what has changed since.

## Status

- **Phase:** building the core. The escapement spike passed on 2026-11-01 (`SPIKE.md` has the evidence, the seven correction rounds, and the decision). `spike/` stays as reference; the app lives at the repo root.
- **Order of work:** `/research` on the five physics claims → `verify-render` skill → sim core (TDD) → movement view → timegrapher → puzzle 1 → deploy → stretch.
- **Hosting:** `docs/hosting.md` is the spec; a separate agent is executing it. Production URL: not yet.
- **Hard limit:** 8 hours total build time, tracked by Akash outside this repo. Treat every stretch item as optional.

## Decisions (grilled 2026-11-01, not in the brief)

- **Two layers.** A lumped balance model (period from inertia and hairspring stiffness, amplitude from mainspring torque against losses, beat error from hairspring offset, isochronism and position as explicit corrections) produces the timegrapher numbers. The escapement drawing is kinematic and slaved to the balance angle. Rate is never read off the drawing.
- **Escapement fidelity.** Keep the spike's simplifications in the core: pointed teeth, zero draw, no guard pin, fork linear in balance angle. Draw and club teeth are a stretch item below the brief's three.
- **Two clocks.** The timegrapher accumulates ticks at accelerated sim time (about 60× real) so a slope shows within seconds; the movement view runs from real time down to 1/20. The readout labels the sim time span honestly.
- **Puzzle completion.** Solved when readouts stay in a target band for a stretch of sim time (for example rate within ±5 s/day and beat error under 0.5 ms for 60 sim-seconds), then an explanation card. Puzzle 3 ends with a two-choice question instead of a band.
- **Picker.** Hidden until a second calibre exists; the calibre name shows as a static label. The catalog file exists from day one.
- **First calibre:** 18,000 bph. **Lift angle:** fixed 52° label on the timegrapher, not a control.
- **Mobile means:** panels stack, no horizontal scroll, controls tappable, puzzle 1 solvable. Nothing more.
- **Docs layout:** `docs/research/` one file per physics claim; `docs/hosting.md`; design doc draws on `SPIKE.md`. The Harness Lab pivot brief should be added to `docs/` when Akash supplies it.
- **Skills:** project-scoped under `.claude/skills/`; `verify-render` is seeded from `spike/shots.mjs`.

## Rules that outrank convenience

- **Simulation and rendering never mix.** The sim core is pure functions over state and parameters, tested with Vitest. Renderers read state and compute nothing. A renderer may be deleted without touching a test.
- **Geometry is derived, never drawn.** Every shape comes from named parameters in one config object (tooth count, lift angle, lock angle, drop). Hand-tuned path strings are a bug.
- **Horology is verified before it becomes code.** None of the physics numbers in the brief are checked yet. Run `/research` against primary sources and record findings in `docs/research/` before encoding a claim. When you are unsure whether a horological statement is true, say so in the transcript rather than asserting it.
- **Tests hold the line.** A failing invariant test is fixed in the sim, never loosened. Skipped tests count as failures at the gate.
- **Core before stretch.** Core (one calibre, escapement + balance, torque curve, timegrapher, puzzle 1) is deployed before any stretch item starts. Each stretch item lives on its own branch.
- **Spike code stays in `spike/`.** It is throwaway. Promote ideas, not files, into the main app.

## Stack (planned)

Vite + TypeScript, plain SVG, Vitest for the sim core, Playwright for render screenshots and numeric geometry assertions, static deploy (Vercel or Cloudflare Pages). No backend, no runtime LLM, no keys. Node 22 is installed.

## Workflow

The transcripts are part of the deliverable. They should show the human steering: `/grill-with-docs` to align on design, `/research` before physics, `/tdd` for the sim, a custom `verify-render` skill for screenshots plus geometry assertions, `/code-review` before deploy. Keep visible in the transcript any moment where Claude asserted wrong horology, a test was weakened, or a render ran but looked wrong, and the correction that followed.

## Vocabulary

Horology terms used in code and docs go in `GLOSSARY.md` the first time they appear (escapement, pallet, lock, drop, impulse, lift angle, beat error, amplitude, isochronism, poise, regulator index, stud). Use the glossary term, not a synonym, in identifiers.
