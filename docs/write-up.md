# The Watchmaker's Bench: write-up

Akash Parikh · Live: https://watchmakers-bench.pages.dev · Repo: https://github.com/ahparikh/watchmakers-bench

The Watchmaker's Bench is a browser app where you learn why a mechanical watch runs fast or slow
by fixing a simulated one. A lever escapement and balance tick in slow motion in the centre of the
page. Beside them is a timegrapher, the instrument a watchmaker listens with, showing rate
(seconds per day), amplitude (degrees) and beat error (milliseconds). Each of four puzzles hands
you a faulty watch and a symptom. You move the adjustments a watchmaker has and read the result
on the instrument. There is no backend and no LLM at runtime.

## Why this theme and this approach

I like exploring a complex topic until it makes sense, and I love mechanical watches. To me they
are the perfect blend of art and science, with function and form in one object. I have long
admired Bartosz Ciechanowski's *Mechanical Watch*, which explains how every part works. I started
a Claude session to find an idea in that territory, and it fit Theme 1, Exploration &
Understanding.

We landed on two ideas. The first was a site that builds on Ciechanowski's article: now that you
know how a watch works, adjust one to repair it. The second was a tool for looking back over past
Claude sessions to improve future ones. The second was there only as a fallback, because I was
not sure the first would work.

So before spending real time I asked Claude to write a spike plan. The riskiest part was the
escapement: would it lock and release correctly, in sync with the balance, and look right? The
plan gave the spike 45 minutes and a written go / fallback / pivot rubric (`watchmaker_brief.md`).
The spike passed its three must-pass criteria, including me watching one beat at 1/20 speed. It
missed one soft criterion: seven correction rounds against a target of three (`SPIKE.md`). I chose
to go.

## What makes it interesting

A mechanical watch is very complex, but the watchmaker's skill is something else again: hearing
that a watch is wrong and knowing which part to touch. Most explanations stop at how it works.
This one lets you debug a watch. It follows Ciechanowski's article and does not compete with it;
the first-visit guide is built from a summary of his article that maps each part to a slider
(`docs/onboarding/ciechanowski-summary.md`).

Two things were less obvious than I expected:

- **One puzzle has no fix.** In "Afternoon slump" the watch gains by evening and no slider cures
  it. The regulator moves the whole day's rate up or down; it cannot flatten the curve. The puzzle
  ends with a question, and the answer is a new mainspring. Some errors are physics, not
  adjustment.
- **Checking the physics changed the app.** Every physics claim was researched against sources
  before it became code (`docs/research/`). Claude had asserted that the escapement makes a watch
  gain as its swing shrinks. Airy (1826), Hoyng (2015) and a patent say the escapement alone makes
  it lose; the gain comes from the regulator pins. The model was split into two terms and the
  puzzle text now says so. Separately, a heavy spot at the bottom of the balance makes the watch
  lose above about 220° of amplitude and gain below it. Claude wrote the opposite expectation; the
  model, built from the research note, was right.

## Key decisions and tradeoffs

- **2D, not 3D.** A flat technical drawing, with every shape derived from one set of named
  parameters. Ciechanowski already did 3D well. 2D was cheaper to get correct and easier to check
  with numbers. The cost: you never see the movement as an object you could hold.
- **Physics first, proven by a spike.** The numbers come from a small oscillator model with tests
  (49 in the core). The escapement drawing is a separate layer that follows the balance, and rate
  is never read off the drawing. Simulation and rendering never mix, which let a design agent
  restyle the page without touching a test. The cost: the drawing cannot discover an effect by
  itself; each one has to be put into the model on purpose.
- **One simple calibre.** A time-only, 18,000 bph movement. The catalog is built for more, but the
  picker stays hidden until a second one exists. The escapement is simplified (pointed teeth, no
  draw), so the app says "lever escapement", not "Swiss lever".
- **An onboarding flow that shows what each slider does.** A first visit opens an eight-step
  guide. Each step lights the part on the drawing that a slider moves, and each puzzle shows only
  the sliders it needs. This cost a good share of the iteration time and was worth it: without it
  a newcomer faces seven controls and three numbers with no way in.
- **Two clocks.** The timegrapher runs at 10× so a trend shows in seconds; the movement runs in
  slow motion so one beat is visible. The screen labels the time span honestly.
## How I built it

- **Several agents, each with a lane.** Once the spike passed I ran separate Claude agents for
  physics and puzzles, design, onboarding, and hosting. `CLAUDE.md` names the files each one owns,
  so they could work at the same time without editing each other's code.
- **Agents told each other what they were doing.** A request that crossed a lane went into
  `docs/handoffs.md` as one line: who, what, why. For example, physics told design that two new
  controls needed styling, and design told onboarding which guide wording no longer matched the
  new layout. The file doubles as a record of who changed what.
- **Push to deploy, one branch per idea.** The site is static on Cloudflare Pages. Pushing any
  branch builds it at its own preview URL, so each agent worked on its own branch and I could
  open several candidate solutions side by side before choosing one. Production follows `main`,
  and `main` moves only on my go-ahead.
- **A variety of skills.** Existing skills covered the routine steps: stress-testing the design
  before building, researching the physics against sources, test-first development for the
  simulation, front-end design guidance, and a wizard for the hosting steps only I could do. I
  added two project skills for this project's own failure modes: `verify-render` (screenshots of
  named states plus numeric geometry checks) and `deploy` (verify the commit, push, wait for the
  build, confirm the URL).

The tools did not catch everything, and `docs/judgment-log.md` records each miss. Two were mine to
find. The impulse pin was drawn on the wrong side of the fork; every screenshot was frozen at the
one angle where right and wrong look the same, so the checks passed. I saw it watching one beat in
slow motion. Later the wind slider flickered at the point where the watch stops. Claude blamed
four different things in turn before my exact repro showed a readout changing width under the
pointer. Each fix added a test or a script so it stays fixed.

## With more time

- **More complex calibres.** This watch only keeps time. A date, a stopwatch (chronograph) or
  other complications would bring new mechanisms and new physics, and new faults to find.
- **3D.** Rotate the movement and view it from different angles.
- **Harder puzzles.** Faults with more than one cause, where the first fix exposes the second.

## Time spent

Between 5 and 6 hours at the keyboard, under the 8-hour limit. All figures are approximate.

| Phase | Time |
| --- | --- |
| Ideation with Claude: two ideas, the brief and the spike plan | 1 h |
| Running and judging the escapement spike | 45 min |
| First version of the site live, agents started | 45 min |
| Iterating design and usability: animations, onboarding, layout | 2 h |
| This write-up, the brag video and the 5-minute video | 30 min |

The Claude transcripts hold the detail of each phase.
