# Video outline (about 5 minutes)

Talking points, not a script. Each section says what to have on screen and what to cover, in the
order of the write-up (`docs/write-up.md`). Times add up to 5:00.

## Before you record

- Browser at about 1440×900 on https://watchmakers-bench.pages.dev. The three columns fit one
  window at that size.
- Click **Replay the guide** (or open `/?guide`) to show the first-visit guide again.
- Open in tabs, in this order: Ciechanowski's article (https://ciechanow.ski/mechanical-watch/),
  `watchmaker_brief.md`, `docs/judgment-log.md`, `CLAUDE.md` at "Ownership", `docs/handoffs.md`.
- Practise puzzle 1 once. When the rate is in band, the hold bar fills in about six seconds.
- The pin bug is fixed, so it cannot be shown live. Show the log row and the correct motion.

## 1. What it is and why I chose it (0:00–0:40)

**Show:** the live site with puzzle 1 loaded and the movement ticking.

- One sentence: you learn why a mechanical watch runs fast or slow by fixing a simulated one.
- I like exploring complex topics, and I love mechanical watches: art and science, function and
  form, in one object.
- I have long admired Ciechanowski's article on how a watch works. (Flash the article tab.) This
  builds on it: he explains how it works, this lets you repair one.

## 2. The app, live (0:40–1:50)

**Show:** point at the three columns, then solve puzzle 1, then open puzzle 3.

- The drawing is the movement. The dark screen is a timegrapher, the instrument a watchmaker
  listens with. Three numbers: rate, amplitude, beat error.
- Puzzle 1, "Runs fast": read the symptom. The trace slopes and the rate reads about +41 s/day.
  Drag **Regulator index** toward S. The trace flattens, the bar fills, the explanation appears.
- Puzzle 3, "Afternoon slump": drag **State of wind** and watch amplitude fall while rate climbs.
  No slider fixes this one. The answer is a new mainspring. Some errors are physics, not
  adjustment.
- Why this is interesting: a watch is very complex, but the watchmaker's skill is knowing which
  part to touch. This teaches you to debug a watch, not only how it works.

## 3. How it started: two ideas and a spike (1:50–2:30)

**Show:** `watchmaker_brief.md` at the go / no-go table, then `SPIKE.md` at the scoring table.

- About an hour of ideation with Claude produced two ideas: this one, and a fallback about
  reviewing past Claude sessions, kept only because I was not sure this one would work.
- The risk was the escapement: would it lock and release correctly and look right? So Claude
  wrote a 45-minute spike with a written go / fallback / pivot rubric.
- It passed the must-pass criteria, including me watching one beat at 1/20 speed. It took seven
  correction rounds against a target of three. I decided to go.

## 4. Key decisions (2:30–3:15)

**Show:** the movement at 1/20 speed with the phase label changing; then **Replay the guide** for
a step or two.

- 2D, not 3D: a flat technical drawing, cheaper to get right and easier to check with numbers.
- Physics first: a small tested model makes the numbers; the drawing is a separate layer that
  follows it. The physics was researched against sources before it became code.
- One simple, time-only calibre.
- An onboarding guide that lights up the part each slider moves.

## 5. How I built it (3:15–4:15)

**Show:** `CLAUDE.md` "Ownership", then `docs/handoffs.md`, then a preview URL next to
production, then `docs/judgment-log.md`.

- Several agents at once, each with a lane: physics and puzzles, design, onboarding, hosting.
- They told each other what they were doing through one-line notes in a handoffs file.
- Push to deploy: every branch gets its own preview URL, so I could test several solutions side
  by side. Production moves only on my go-ahead.
- A variety of skills, plus two written for this project: `verify-render` and `deploy`.
- The tools did not catch everything. Pick one or both:
  - The impulse pin was drawn on the wrong side of the fork. Every screenshot was frozen at the
    one angle where right and wrong look the same. I caught it watching one beat in slow motion.
  - Claude asserted the escapement makes a watch gain as its swing shrinks. The research said it
    makes it lose; the regulator pins cause the gain. The model and the puzzle text changed.

## 6. With more time (4:15–4:40)

**Show:** the live site in Free play.

- More complex calibres: a date, a stopwatch, other complications with new physics.
- 3D, so you can rotate the movement and view it from different angles.
- More complex puzzles.

## 7. Time spent and close (4:40–5:00)

**Show:** the live site with the URL visible.

- Between 5 and 6 hours at the keyboard: about an hour of ideation, 45 minutes on the spike, 45
  minutes to the first live version, two hours iterating design and usability, and the rest on
  the write-up and videos.
- The Claude transcripts hold the detail. Close on the URL.

## If it runs long

Cut in this order: the second judgment moment in section 5, puzzle 3's question in section 2
(keep the slider drag), the guide replay in section 4.
