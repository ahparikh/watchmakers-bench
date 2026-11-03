# Judgment log

Moments where Claude asserted wrong horology, a test was restated, or a render ran but looked
wrong, and the correction. Kept for the design doc; the brief rewards these being visible.

| When | What Claude did | How it was caught | Correction |
| --- | --- | --- | --- |
| Spike, round 1 | Built the pallet locking face radial to the escape wheel | Invariant tests: wheel crept while locked, beats asymmetric | Face is an arc about the fork pivot (zero draw); later an exact region, not a polygon |
| Spike, round 2 | Diagnosed the failure as polygon non-convexity | Tests unchanged after the fix | Wrong diagnosis; recorded as a wasted round |
| Spike, round 7 | Reported a false "drop" mid-impulse | Phase trace showed the wheel losing contact before the let-off | Free-run speed was below the face's recession rate; raised it |
| Spike, tests | Wrote "half a tooth per beat from any instant" and "stationary while locked" including run-to-banking | Both failed on real geometry | Restated as lock-to-lock and pin-out-of-notch; the original wording encoded a false symmetry. Akash to confirm these are restatements, not loosenings |
| Spike, render 1 | Stones drawn as a sliver and a sail, lever tail into the wheel, bankings misplaced | Screenshots read with the verify-render loop | Outline now derived from the same region used for collision |
| Research brief | Claude told the isochronism agent that a lever watch gains at low amplitude *because the impulse is mostly an advance* | The agent read Airy (1826), Hoyng (2015) and patent US 9,323,223: the escapement alone is a loss that grows at low amplitude; the net gain in flat-spring watches comes from the regulator pins | Model split into an escapement loss term and a pin gain term; puzzle 3 text says "the escapement alone would make it lose" |
| Research brief | The brief's "280° → 200° after a day" was taken as a healthy watch | Witschi and bench reports: healthy is a 10–15 % drop; 200° at 24 h is a tired spring | Healthy curve 280° → 250°; the slump puzzle uses a tired-spring torque curve |
| App, first render | Timegrapher states showed "LOCK" with the pin inside the notch | Screenshot review: an impossible pose | Movement parks at a true lock before freezing; `initialPose` only reports lock when actually blocked |
| App, first render | Beat error of 2.7 ms invisible on a ±100 ms trace scale | Screenshot review | Scale ±20 ms with wrapping, like a real machine |
| App, first build | Puzzle 2's completion rule never looked at beat error | Hold bar started filling the moment the puzzle loaded | Bands receive the instrument reading as well as the physics |
| App, first build | 60× sim clock made the 60-second hold finish in one wall second | Reasoning about the rule, not a screenshot | 10×, recorded in CLAUDE.md |
| App, puzzle 4 states | Claude wrote the expectation "crown up gains" for a heavy spot at the bottom | verify-render: the model lost 6 s/day; research 04 says above 219.5° a bottom heavy spot loses | Expectation corrected; the model was right |
