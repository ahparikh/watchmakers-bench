# Code review: The Watchmaker's Bench, 2026-11-16

Range `3522490..origin/main` (tip `2825770`, 37 commits, 50 files, about 3,900 lines): the whole application.
Review only; no application code was changed. Method: `mattpocock-skills:code-review` (Standards and Spec sub-agents in parallel, reports in the last section), plus a line-by-line read of `src/`, `tests/`, `scripts/` and the skill scripts, and numeric and headless-browser probes for every finding marked "measured".

## Verdict

1. The lumped physics (`src/core/oscillator`, `watch.ts`, `timegrapher/analyze.ts`) matches its research notes in form, sign and units; I found no wrong formula there.
2. The drawing contradicts that physics in two places a learner will see: the regulator moves the wrong way along the hairspring, and the heavy spot is drawn on the opposite side of the balance from where the model puts it.
3. Three behaviours are broken in the running app: "real time" speed runs at 7 fps, the two trace lines jump every frame in puzzle 2, and puzzle 4 solves in six seconds without diagnosing anything.
4. All five required checks pass, but they pass over these defects: the tests pin the wrong regulator direction, the screenshots carry a stray highlight, and `e2e-solve` cannot fail on two of its three puzzles.
5. Not ready to call the core "done" against its own rules; items 1 to 6 below are each a day or less and should land before any further stretch work.

## Evidence: the required checks

| Check | Result |
| --- | --- |
| `npm test` | 8 files, 59 tests pass, 0 skipped. 10 of the 59 are `spike/tests/`, collected because there is no vitest config. |
| `npm run build` | `tsc --noEmit` clean; bundle 60.0 kB (21.4 kB gzip). |
| `verify-render.mjs --root .` | All 21 named states pass their numeric checks, no page errors. |
| `scripts/e2e-solve.mjs` | Exit 0; prints puzzles 1, 4, 3 solved (see finding 12 on what that is worth). |
| `scripts/drag-stability.mjs` | 24 of 24 slider drags hold still at 1280, 1000, 760 and 390 px. |
| `scripts/onboarding-e2e.mjs` (not asked for, run anyway) | All checks ok. |

## Findings, most severe first

Sizes: S under an hour, M half a day, L more than a day.

### 1. The regulator is drawn moving the wrong way, and its pins are not on the spring (M)

- **Where:** `src/core/escapement/adjustments.ts:93-96`, pinned by `tests/core/adjustments.test.ts:34-39` and `src/verify/states.ts:31`.
- **What:** positive index (toward F) moves the pins *toward* the stud. The code comment says this is "shortening the active coil".
- **Standard broken:** "Horology is verified before it becomes code". `docs/research/01-balance-period-and-regulator.md:38-39` says the opposite: "Moving the curb pins *away* from the stud shortens the active length (fast); toward the stud lengthens it (slow)." The model in `period.ts:28-30` is right; only the drawing is wrong.
- **Also (measured):** the pins sit 6.8 scene units from the nearest point of the hairspring polyline, with a half-gap of 2.2. They are placed 24° past the stud, where the outer coil has already ended, so they straddle nothing.
- **Failure scenario:** guide step 4 (`src/app/onboarding.ts:117-118`) says, correctly, that only the spring between the pins and the centre works and that F shortens it. The reader drags the slider toward F and watches the pins move toward the outer end, which lengthens that span.
- **Copy:** puzzle 1's explanation (`src/puzzles/index.ts:36`) says the pins "pinch the hairspring nearer its end, so a shorter length of spring does the work". Read with the guide's "outer end", that is backwards too.
- **Fix:** put the pins on the outer coil on the collet side of the stud, move them away from the stud for F, rewrite the test name and assertion, and reword the explanation.

### 2. The heavy spot is drawn 180° from where the physics puts it (S to M)

- **Where:** `src/core/watch.ts:15-18` (`down: 0` for crown up) against `src/core/escapement/adjustments.ts:54-62` (`CROWN_AT_DEG = 0`, crown up rotates +90°).
- **What:** the model treats rim angle 0° as pointing straight down in crown up. The drawing puts the crown at rim 0° and turns it to the top.
- **Measured:** with the watch stopped (balance at rest) and a poise cut at 0°, the cut is drawn above the balance centre in crown up, below it in crown down, and on the crown side in crown left and right. The physics has it on the opposite side in all four.
- **Failure scenario:** puzzle 4's hint (`onboarding.ts:36`) says "The heavy spot is at the bottom when crown up". The watch loses 6.1 s/day there, which is right for a bottom heavy spot at 250° (research 04). On solving, the revealed heavy spot appears at the top of the balance. Research 04 says a top heavy spot above 220° gains.
- **Why the tests miss it:** `watch.test.ts:48-56` checks only that crown up and crown down have opposite signs; nothing ties `POSITIONS.down` to the view rotation.
- **Fix:** derive both from one table (crown rim angle and which way is down per position) and add a test that the rim angle the model calls "down" is drawn pointing down the page.
- **Unsure:** which side should change. Changing `down` flips the puzzle's rate signs and the judgment-log entry of puzzle 4; changing the drawing's reference angle does not.

### 3. "Real time" speed cannot run (M)

- **Where:** `src/core/escapement/kinematics.ts:32,59-64,141-149`, driven from `src/main.ts:141-147`.
- **Measured:** one `step()` for a 16.7 ms frame at real time costs 24 ms in Node. In headless Chromium the page drops to 6.8 fps, and the movement advances 2.70 s in 4.00 wall seconds.
- **Cause:** 167 substeps per frame; while the wheel is locked, each substep runs `advance()`'s 40-iteration bisection, and every iteration rebuilds all 15 tooth polygons and both stones.
- **Knock-on:** `wallDt` is capped at 0.1 s (`main.ts:141`), so the timegrapher clock and the 60-second hold also run slow, and sliders lag. The default speed (1/10) costs 2.4 ms a frame and is fine.
- **Fix:** return early from `advance()` when the wheel is already against a face; test only the teeth near the stones; substep finely only while the pin is in the notch or the wheel is free. Add a budget test (one real-time frame under about 4 ms).

### 4. The trace's two lines jump by the beat error on almost every frame (S)

- **Where:** `src/core/timegrapher/analyze.ts:40`, fed by the sliding window in `src/app/ticker.ts:27`.
- **What:** each dot's offset is measured from `ticks[0]`. Once the window holds 300 ticks it slides by one tick at a time, so the anchor alternates between a tick and a tock.
- **Measured:** in puzzle 2 after nine seconds, the first parity-0 dot's `cy` alternated between 134.4 and 150 on 33 of 39 frames. The numeric probe shows the same thing: offsets flip between 0 and 2.73 ms.
- **Failure scenario:** puzzle 2 asks the user to watch two lines merge into one. After six wall seconds the lines swap places continuously.
- **Why the tests miss it:** `timegrapher.test.ts` analyses one fixed window; named states are frozen.
- **Fix:** anchor offsets to an absolute beat index and time carried in `TickWindow`, not to the first tick in the window. Add a test that sliding the window by one tick moves no dot.

### 5. Puzzle 4 completes on hidden state and needs no diagnosis (S)

- **Where:** `src/puzzles/index.ts:74-77`, `src/main.ts:197`.
- **What:** the band is `r.netUnbalance <= 1.5e-11`. It reads no instrument value and no position.
- **Spec line:** Decisions, "Solved when readouts stay in a target band". Brief: "Compare positions on the trace".
- **Measured:** load puzzle 4, move only the Poising amount to 10, leave Position on dial up: solved in 6.0 s. The fault is at 0° and the angle slider resets to 0, so the angle is never searched for.
- **Also:** the goal text promises "crown up and crown down each read within 3 s/day of dial up"; nothing checks it. (The numbers are consistent: at the band edge crown up reads +0.3 and crown down +2.6.)
- **Fix:** put the fault at a non-zero angle, and require the instrument rate to have been read in band in crown up and crown down (state the puzzle keeps), or drop the hold for a "compare and answer" ending like puzzle 3.

### 6. A first-time visitor lands in a nine-card modal and Free play, not puzzle 1 (S, needs Akash's call)

- **Where:** `src/app/onboarding.ts:445,516-517`.
- **Spec lines:** "A reviewer opens the link and is solving a puzzle within 30 seconds"; risk table, "Puzzle 1 opens by default with a one-line goal".
- **Measured:** with the guide enabled the job picker reads Free play and the card reads "Two minutes".
- **Test blind spot:** `navigator.webdriver` suppresses the guide, so `e2e-solve`, `drag-stability` and `verify-render` never see what a person sees.
- **Fix options:** open on puzzle 1 with the guide offered from the strip; or keep the guide but leave puzzle 1 loaded behind it. Replace the `webdriver` sniff with an explicit `?noguide` that the scripts pass.

### 7. Named-state screenshots are not what the state says (S)

- **Where:** `src/main.ts:197-201,223-245`.
- **What:** `loadPuzzle` dispatches `input` on every slider; each handler calls `touch(part)`, so the last one leaves `hot = "poise"` for 600 ms.
- **Measured:** `?state=runs-fast-start` (no highlight declared) has one `.part.hot` group and a dashed cut circle in the frozen drawing. The same flash shows on every live puzzle load.
- **Also:** `Object.assign(user, s.settings)` never updates the sliders. In `runs-fast-fixed` the regulator slider shows 0 and "+0.00°" while the state runs at −1.2°.
- **Also:** in `__bench.check`, `rateWithin`, `amplitudeWithin` and `beatErrorBelow` are skipped when `tg` is null (`main.ts:261-263`), and `pose.violations` is never checked.
- **Fix:** reset sliders without going through `touch`; set slider values from the state; fail a check whose input is missing.

### 8. `src/main.ts` is one 271-line module doing six jobs, none testable (M to L)

- **State and rules:** `effective()`, `loadPuzzle`, the hold timer (`:50-60,156-160,193-202`) are pure logic with no test. `heavySpotDeg: f.heavySpotDeg ?? user.heavySpotDeg` and the additive faults are exactly the kind of line that needs one.
- **Rendering inside main:** `puzzleHtml()` (`:114-123`) builds the card, including hard-coded copy (`:121`, already in `docs/handoffs.md`).
- **Post-render patching:** `:97` overwrites the renderer's `.phase` text with "STOPPED · no torque at the escape wheel". That statement is false: measured, the healthy watch stops at 40 h with 26 % torque and the tired one at 38 h with 27 %. The stop is the model's 120° amplitude threshold.
- **Same conflation in the core:** `:147` passes `reading.running` as `step()`'s `driven` flag, documented in `kinematics.ts:56-57` as "a run-down watch has none".
- **Type holes:** `(user as any)[key]` (`:167`), `includes(name as never)` (`:125,129`); `|| puzzle.controls.length === 0` is dead.
- **Verify contract in the production bundle:** `:206-267`, including a 4,000-step scan.
- **Ownership:** CLAUDE.md gives onboarding one mount line and design none, so both reach in through the DOM instead (finding 13).
- **Fix:** `src/app/bench.ts` (state, `effective`, `loadPuzzle`, hold; pure, tested), `src/view/puzzleCard.ts`, `src/verify/contract.ts` behind `?state`, and `main.ts` as wiring only.

### 9. The tick stream that runs is not the one that is tested, and it invents ticks (S)

- **Where:** `src/app/ticker.ts:12-27` against `src/core/oscillator/ticks.ts:32-59`.
- **What:** `advanceTicks` re-implements `crossingDuration` and `tickTimes`. `tickTimes` is called only from tests; `advanceTicks` has none and lives in `src/app/`, though it is pure sim.
- **Measured:** run 10 s, stop for 100 sim-seconds, restart: the window fills with 299 ticks time-stamped inside the stopped interval. `nextTime` is not moved forward while stopped, so the restart back-fills.
- **Fix:** move it to `src/core/oscillator/`, build it on `beatIntervals` and an exported `crossingDuration`, set `nextTime = untilTime` while stopped, and test both.

### 10. Renderers compute (M)

- **Standard:** "Renderers read state and compute nothing"; `movement.ts:1` repeats the claim.
- **`src/view/movement.ts:41-51`:** frame size and viewBox chosen from the rotation.
- **`:60-70`:** spoke and wheel-arm angles from `balanceAngle` and `wheelAngle`, with literal `0.14 R`, `0.66 R`, `72`.
- **`:71-82`:** a nearest-tooth search to place the contact dot. It uses distance to the two corners, which is not the test `classify()` uses.
- **`:96-113`:** regulator arm start, track arcs, swing arcs.
- **`:99`:** `rg.scale.slow && 0 + (indexDeg - 10)` is an object `&&` a number; it works by accident.
- **Fix:** move these into `shapes()` and `adjustmentShapes()` as named outputs (contact point, spokes, arms, frame), and leave the view to format them.

### 11. Tests: what was restated, what is weak, what is missing

- **SPIKE's three restatements, my judgement:**
  - "Stationary while locked" excluding run to banking: a fair restatement. The lever does travel with the tooth on the locking face.
  - "Half a tooth per beat" lock-to-lock: fair, for the reason given (circular pallets).
  - "Never runs backward" with 0.001° allowed: no longer needed. Measured over seven trajectories (amplitude 122° to 280°, beat offset −10° to +10°, steps from 0.1 ms to 100 ms) the largest backward move was exactly 0 and `maxNudge` was 0. Tighten it to zero (S).
- **A fourth, unlisted:** the brief's "the pallet never overlaps a tooth" is tested as "no tooth *vertex* inside a stone" (`escapement.test.ts:105-110`). Measured: the exit let-off corner sits 0.044 units inside a tooth for 2 of 8,000 samples during drop. Invisible at wheel radius 100, but the test cannot see this class of overlap.
- **Tests of implementation:** `pin.test.ts:11` reads the notch by polygon index (`g.lever[7]`, `[6]`); `adjustments.test.ts:34` asserts a direction (finding 1).
- **Loose tolerances:** `toBeCloseTo(x, -1)` accepts ±5: "about +40 s/day" passes at 35.1 (`watch.test.ts:18,34,42`, `period.test.ts:31,35`).
- **Narrow coverage:** the escapement invariants run at one amplitude (270°), zero beat offset, and a private copy of the parameters (`escapement.test.ts:6-10`), not the catalog's. My probes at other amplitudes and offsets were clean; they should be tests.
- **No coverage:** `src/app/ticker.ts`, puzzle bands and hold, `effective()`, both views, `onboarding.ts` (Playwright only).
- **No vitest config:** `npm test` collects `spike/tests` here and other worktrees' copies in the shared checkout (open in `docs/handoffs.md` since 2026-11-03).

### 12. Scripts (S each)

- **`scripts/e2e-solve.mjs:15,21,25`:** prints `"puzzle 4 — solved:", true` as a literal; puzzles 1 and 3 print a boolean and exit 0 either way. Puzzle 2 is not exercised. Values are set by synthetic events, not a drag. A timeout leaves the server and browser open.
- **`verify-render.mjs:11,15`:** fixed port 5199 with `strictPort: true`; two agents running it at once collide. `ace91e8` fixed this only for the onboarding script. `:28` calls `process.exit(2)` before the `finally`.
- **`deploy.sh:72-73`:** runs the suite twice. The gate is tests and build only; CLAUDE.md asks for verify-render before "done" and the script does not run it.
- **Unsure:** `deploy.sh:41` does not truncate the preview subdomain. I believe Cloudflare shortens long branch aliases, which would make `wait_serve` time out on a long branch name; I did not verify the limit.

### 13. Onboarding and the speed control talk to main through the DOM (M)

- **Ids `onboarding.ts` depends on:** `puzzle-select`, `puzzle`, `speed-slider`, `regulator`, `beat`, `wind`, `screws`, `poise`, `poise-angle`, `position`, `ctl-*`, `timegrapher`, and SVG classes `balance`, `mark`, `centreline`, `gravity`.
- **Silent failure:** every lookup is optional-chained (`:254,365,372,385`), so a renamed id does nothing and throws nothing.
- **Text parsing:** `progressed()` (`:490-495`) reads the hold bar's text and tests `startsWith("0 /")`.
- **Synthetic events as an API:** `pointerdown`/`pointerup` to hold a highlight (`:382-388`), `input` and `change` to reset controls and pick a puzzle.
- **`src/view/speed.ts:26-27`:** drives a hidden `<select>` with a synthetic `change`; `index.html:252-257` mounts it from an inline module and re-parents `#onboarding`. It is a controller filed under `view/`.
- **Fix:** a small typed object exported by the app (`selectPuzzle`, `setSpeed`, `highlight`, `resetControls`, `onProgress`), which the 2026-11-13 handoff already asks for.

### 14. The catalog does not feed the app (S to M)

- `src/catalog/vintage18000.ts:10-25` states the beat rate three times, the lift angle three times, and inertia, length and radius twice.
- `Calibre.inertia`, `activeLength`, `regulatorRadius`, `amplitude` and `puzzles` are never read; `afterDayDeg: 250` can drift from the model.
- Slider ranges are literals in `index.html:238-243` (wind `max="42"`); `main.ts:192` lists every puzzle regardless of `calibre.puzzles`.
- Spec line: "A watch catalog … feeds the controls, so a new watch is data, not code."

### 15. Smaller physics and copy points

- **`watch.ts:94`:** knocking adds an unnamed `120` s/day. Research 03 gives "+50 to +300", low confidence. It is also unreachable: amplitude never exceeds 280°.
- **Puzzle 3 is faint:** +1.9 s/day at 12 h and +3.3 at 24 h, shown as whole seconds, and inside the ±5 band puzzle 1 calls fixed. The goal says slide to 40 h; this watch stops at 38 h.
- **Puzzle 4 symptom:** "loses on the wrist", but only crown up loses (−6.1); crown down gains 9.0; crown left and right gain 1.4.
- **Unsure:** the trace slopes down for a gaining watch. I believe Witschi and Weishi screens slope up for a gain; research 02 verified only `tg`'s vertical strip. Worth one `/research` pass, since the strip's explainer teaches the direction.
- **`classify()` (`kinematics.ts:116`):** the lock-arc distance ignores the arc's angular extent, so any tooth tip at the lock radius counts. No misfire observed.

### 16. Stale docs, dead code, leftover branches (S)

- **CLAUDE.md:** "Stack (planned)"; "Next: stretch items … each on its own branch" while puzzles 2 to 4 are on `main`; the Harness Lab brief note.
- **`docs/hosting.md` "What already exists":** still describes an untracked folder with a placeholder page and tells agents not to edit `src/`.
- **`docs/handoffs.md`:** lines 7 and 8 are superseded by line 12; three requests are open (vitest exclude, `whyWrong`, highlight hook).
- **Stale comments:** `GLOSSARY.md:3-4`, `catalog/types.ts:18`, `escapement.test.ts:6`; `kinematics.ts:2` says "Swiss lever" (a comment, not UI copy).
- **Glossary gaps:** `unbalance`, `knocking`, `collet`, balance cock, `tilt`.
- **Dead code:** `geom2d.penetration`, `Reading.beats`, `WatchReading.torqueFraction`, `AdjustmentShapes.scale.centre`, `docs/deploy-check.txt`.
- **Branches:** `origin/adjustment-visuals` (its one commit is on `main` as `1c379aa`); `origin/worktree-brag-video` (one unmerged commit, `b0966a5`); local `design-doc` (two unmerged); `worktree-onboarding` (merged).

## What is solid

- **The physics core.** `period.ts`, `amplitude.ts`, `poise.ts`, `bessel.ts`, `ticks.ts` and `analyze.ts` are pure, small, and each formula matches its research note: T = 2π√(I/k) with k ∝ 1/L; rate = 86400(T₀/T − 1); beat error |d2 − d1|/2 (2.73 ms for 6° at 280°, as logged); the sine form of the amplitude formula; the J1 poise term with the right crossover.
- **The two-layer rule holds.** No rate, amplitude or beat error is read from the drawing; the instrument and the model agree to 0.01 s/day in every named state.
- **The contact solver is robust.** Across amplitudes 122° to 280°, beat offsets of ±10° and caller steps up to 100 ms: exactly 96° of wheel travel in four periods, zero violations, zero backward motion. `step()` is pure; the only history is the previous pose.
- **No tests skipped, deleted or loosened in the range.**
- **Process artefacts work.** `docs/judgment-log.md` is honest and specific; `drag-stability.mjs` is a good regression test for a real bug; `deploy.sh` refuses rewrites and non-fast-forward promotes.
- **Mobile meets its bar.** At 390 px there is no horizontal scroll and puzzle 1 solves with a real pointer drag (measured).
- **Decisions honoured:** 18,000 bph, fixed 52° label, picker hidden, 10× instrument clock, two-choice ending for puzzle 3, no "Swiss lever" in UI copy.

## Standards and Spec reports (from the skill's two sub-agents, lightly cleaned)

The two axes are kept separate on purpose and are not merged with the ranking above.

<table>
<tr><th width="50%">Standards</th><th width="50%">Spec</th></tr>
<tr><td valign="top">

**Documented-standard breaches**

1. **Renderer computes** (CLAUDE.md "Simulation and rendering never mix").
   - `src/view/movement.ts:60-70`: spoke and arm angles, literals `0.14*R`, `0.66*R`, `72`.
   - `:71-82`: nearest-tooth search for the contact dot.
   - `:96`, `:99`, `:110-113`: regulator arm start, track arcs, swing arcs.
   - `:99`: `rg.scale.slow && 0 + (indexDeg - 10)` works by accident.
   - `src/main.ts:97`: overwrites the renderer's `.phase` text.
2. **Geometry outside the one config object** ("Geometry is derived, never drawn").
   - `adjustments.ts:76,91,95-104,111`: `0.12R`, `0.72R`, `±12`, `24`, `2.2`, `1.15R`, `1.25R`, `±4`, eight screw angles inline.
   - `movement.ts:31,92,105-106,117-118`: literal radii and gravity-glyph coordinates.
3. **Tested code is not the code that runs** ("Tests hold the line", spirit; judgement).
   - `src/app/ticker.ts:13-18` re-implements `ticks.ts:32-59`; `tickTimes` is called only from tests.
4. **Unnamed physics number** ("Horology is verified before it becomes code").
   - `watch.ts:94`: `knocking ? 120 : 0`, no name, no citation.
5. **Glossary gaps** ("Vocabulary").
   - No entries for `unbalance`, `knocking`, `collet`, balance cock, `tilt`.
   - `inertiaTrim` for "timing screws"; `beatOffsetDeg` for "beat adjustment".
6. **Ownership workarounds** (unsure on authorship: one git author).
   - `index.html:252-257`: inline module mounts `speed.ts` and re-parents `#onboarding`.
   - `speed.ts:26-27`: synthetic `change` on a hidden `<select>`.
   - `onboarding.ts:384-388`: synthetic pointer events (logged, unresolved).

**Baseline smells (judgement calls)**

- **Duplicated Code / Data Clumps:** `vintage18000.ts:10-25` repeats beat rate, lift angle, inertia, length, radius.
- **Speculative Generality:** unread `Calibre` fields; `screws[].angleDeg`, `scale.centre`, `Reading.beats`, `torqueFraction`.
- **Repeated Switches / Primitive Obsession:** string control names in `Puzzle.controls`, `Highlight`, `main.ts:126,130,197,201`, patched with `as never` and `as any`.
- **Divergent Change:** `main.ts` holds state, loop, card HTML, bindings, verify contract, unit conversion (`:179`).
- **Feature Envy:** `main.ts:88` hard-codes `"position-error"`; `:121` hard-codes copy.
- **Primitive Obsession (units):** `amplitudeDeg` vs `amplitude` in degrees vs `amplitude` in radians; literal `86400` in three files despite `SECONDS_PER_DAY`.
- **Mysterious Name:** `hot`, `tg`, `win`, `eff`, `touch`/`release`, `pts`.

No tests skipped, deleted or loosened; no "Swiss lever" in UI copy.

</td><td valign="top">

**(c) Implemented but looks wrong**

1. **Puzzle 4 completes on hidden physics.** "Solved when readouts stay in a target band". Band is `r.netUnbalance <= 1.5e-11` (`puzzles/index.ts:77`); the goal's "within 3 s/day" is unchecked; fault at 0° and slider reset to 0 (`main.ts:197`).
2. **First-time visitor does not land in puzzle 1.** "solving a puzzle within 30 seconds". `onboarding.ts:514` opens a modal and switches to Free play; `navigator.webdriver` hides it from the scripts.
3. **Trace span label is a constant.** "labels the sim time span honestly". `main.ts:100` always says 60 s, even with a few seconds of ticks.
4. **Catalog does not feed the app.** "a new watch is data, not code". `calibre.puzzles` unread; duplicate fields; ranges hard-coded in `index.html:238-243`.
5. **Puzzle 3's symptom is weak (unsure, hand-computed).** About +3 s/day at 24 h, shown in whole seconds.

**(b) Scope creep, including stretch on main**

6. **Stretch item 1 landed in the core commit.** "each as its own branch". `09da355` ships puzzles 2 to 4, six positions, and two poising controls not in the brief.
7. **Difficulty-ladder stretch on main.** Manual links at `onboarding.ts:396`, timed hints `:479`.
8. **Speed goes to 1/100.** "from real time down to 1/20". `speed.ts:5`.
9. **"True rate" readout bypasses the instrument.** `main.ts:136`.
10. **Knocking is unreachable.** `watch.ts:81,94`; the 120 is not in research 03.

**(a) Missing or partial**

11. **No gear train drawn.** "escapement, balance, simplified gear train".
12. **Layout differs.** Brief: timegrapher right, controls below. Now three columns (`index.html:46`).

**Conforming:** 18,000 bph; fixed 52° label; picker hidden; 10× clock; two-choice puzzle 3; no "Swiss lever"; puzzles 1 and 2 read the instrument for 60 sim-seconds; rate never read off the drawing.

</td></tr>
</table>

**Summary:** Standards, 6 documented breaches and 7 smells; worst is the renderer computing geometry (`movement.ts:60-113`). Spec, 12 findings; worst is puzzle 4 completing on hidden state without diagnosis.

## Where I am unsure

- Finding 2: which side of the model/drawing mismatch to change.
- Finding 12: Cloudflare's branch-alias length limit.
- Finding 15: the slope convention on real timegraphers.
- Performance figures are from Node and headless Chromium on this machine; a fast desktop will do better than 7 fps but the cost (1.4 ms of compute per ms simulated) leaves no margin anywhere.
- I did not read the 255 lines of CSS in `index.html` for design quality, only for ids and the inline script.
