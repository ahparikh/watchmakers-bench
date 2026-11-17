# Video outline (about 5 minutes)

> **Status: draft plan.** The "Say" column is a suggested direction in plain words, not a script.
> Akash supplies the real wording. `[AKASH: …]` marks what only he can say. Times add up to 5:00.

## Before recording

- Browser at about 1440×900 on https://watchmakers-bench.pages.dev. The three columns fit one
  window at that size.
- To see the first-visit guide again, open `/?guide` or click **Replay the guide**.
- Have these open in tabs or an editor, in this order: `docs/judgment-log.md`,
  `docs/research/03-amplitude-and-isochronism.md` (section b), `CLAUDE.md` ("Ownership"),
  `docs/handoffs.md`.
- Puzzle 1 takes about six wall-seconds to complete once the rate is in band (60 s of ticks at
  10×). Practise it once so the hold bar fills on camera.
- The pin bug is fixed, so it cannot be shown live. Show the log row, then the correct motion at
  1/20 or 1/100 speed, and say what was wrong.

## Beats

| # | Time | On screen | Say (direction) | Covers |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:25 | The live site, puzzle 1 loaded, movement ticking | What it is in one sentence: you learn why a watch runs fast or slow by fixing one. I love mechanical watches, art and science in one object, and have long admired Ciechanowski's article on how they work. | Why this theme |
| 2 | 0:25–0:45 | Point at the three columns in turn: job card, movement, timegrapher | The drawing is the movement. The dark screen is a timegrapher, the instrument a watchmaker listens with. Three numbers: rate, amplitude, beat error. Ciechanowski already explains how a watch works; this starts where he stops. | Non-obvious |
| 3 | 0:45–1:25 | Solve puzzle 1 live: trace slopes, +41 s/day. Drag **Regulator index** toward S. Trace flattens, hold bar fills, explanation card appears | Read the symptom aloud. Say what the sloping line means. Move the one slider. Let the card explain: shorter active hairspring, stiffer, faster. | The approach: diagnosis |
| 4 | 1:25–2:05 | Switch to puzzle 3. Drag **State of wind** from 0 h toward 40 h; amplitude falls, rate climbs. Try the regulator. Answer the question | This one has no fix. The regulator moves the whole day up or down; it cannot flatten the curve. The answer is a new mainspring. Some errors are physics, not adjustment. | Non-obvious |
| 5 | 2:05–2:35 | Set movement speed to 1/20, point at the phase label changing (lock, unlock, impulse, drop). Then one glance at `src/core/` folders | Two layers. A small oscillator model makes the numbers. The escapement drawing is kinematic and follows the balance. Rate is never read off the drawing. That split is why the physics has tests and the drawing can be restyled freely. | Key decision |
| 6 | 2:35–3:05 | `docs/judgment-log.md`, the impulse-pin row. Then the movement at 1/100 through an unlock | Judgment moment 1. The pin was drawn on the wrong side of the fork. Every screenshot was frozen at the one angle where right and wrong look the same, so the checks passed. I caught it watching one beat in slow motion. Now there is a test and a named state for it. | Tradeoffs; human steering |
| 7 | 3:05–3:35 | `docs/research/03`, section (b), then puzzle 3's explanation card | Judgment moment 2. Claude told the research agent the escapement makes a watch gain at low amplitude. The sources say the escapement alone makes it lose; the regulator pins cause the gain. The model was split in two and the puzzle text changed. | Physics verified before code |
| 8 | 3:35–4:00 | The wind-slider row in the log; then drag the wind slider past 40 h on the live site, steady | Judgment moment 3. A flicker at the stop threshold. Claude blamed four things. I gave the exact repro; the cause was a readout changing width under the pointer. A script now drags every slider and fails if it jumps. | Human steering |
| 9 | 4:00–4:25 | `CLAUDE.md` "Ownership", then `docs/handoffs.md`, then `.claude/skills/` | How it was built: four agent lanes with file ownership, a one-line handoffs file, two project skills (`verify-render`, `deploy`). Main moves only on my go-ahead. `[AKASH: one sentence on what this was like to run.]` | Approach |
| 10 | 4:25–4:50 | Back on the live site, free play | With more time: more complex calibres (date, chronograph), a 3D view you can rotate, harder puzzles with more than one cause. | Extend |
| 11 | 4:50–5:00 | Live site, URL visible | Between 5 and 6 hours at the keyboard, against an 8-hour limit. Close on the URL. | Time spent |

## Options and cuts

- **If it runs long**, cut beat 8 first (the slider), then shorten beat 9 to one sentence.
- **Alternative judgment moment** in place of beat 8: puzzle 4's sign. Claude expected "crown up
  gains" for a heavy spot at the bottom; the model lost 6 s/day and the model was right (above
  about 220° a bottom heavy spot loses). Shows a test catching Claude's expectation, not the code.
  On screen: puzzle 4, switch Position between crown up and crown down.
- **Alternative opening:** start cold on puzzle 1 being solved, then say what it is at 0:20.
- **Not planned for the video:** the spike's seven correction rounds and the restated tests. They
  are in the written doc. One sentence in beat 5 could mention the spike if there is room.

## Checks against the prompt

| Prompt bullet | Beats |
| --- | --- |
| Why this theme and approach | 1, 3 |
| Interesting or non-obvious | 2, 4 |
| Key decisions and tradeoffs | 5, 6, 7, 8, 9 |
| How you'd extend it | 10 |
| Time spent | 11 |
