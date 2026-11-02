# Escapement spike — record

Date: 2026-11-01. Code in `spike/` (throwaway). Run it with `cd spike && npm run dev`, then open
`http://localhost:5173/?speed=0.05` for one beat at 1/20 speed. `npm test` runs the invariants;
`npm run shots` screenshots twelve phase frames into `spike/shots/`.

## What was built

- `src/params.ts`: one config object. Every shape derives from it; no hand-drawn paths.
- `src/shapes.ts`: pure geometry. Each pallet stone is an exact region (lock arc about the fork
  pivot, impulse plane, back edge, top edge). The same description is used for contact and for
  drawing, so what is drawn is what is computed.
- `src/sim.ts`: `escapementState(params, t)`, pure in `t`. Balance is a sinusoid; the fork follows
  the impulse pin while it is in the notch; the escape wheel advances as far as the stones
  physically allow (bisection on penetration). Phases lock / unlock / impulse / drop are read off
  the contact, never scripted.
- `src/render.ts`: SVG from shapes only. `src/main.ts`: play, step, speed, scrub, and `?phase=`
  URLs for screenshots.
- `tests/escapement.test.ts`: ten invariants, all green, none skipped.

## Invariants tested

1. Half a tooth (12°) per beat, measured from any locked instant.
2. One tooth (24°) per full period.
3. Wheel never runs backward beyond 0.001°.
4. Wheel stationary while locked with the pin out of the notch.
5. Lever motion never shoves the wheel by more than 0.001°.
6. Balance reaches ±amplitude.
7. Fork stays within its bankings and rests on one whenever the pin is out of the notch.
8. Phase sequence per beat is exactly lock → unlock → impulse → drop → lock, on both pallets.
9. Pallets alternate beat by beat.
10. No tooth vertex is ever inside a stone (beyond the contact solver's tolerance).

## Correction rounds (sim)

| # | Symptom | Cause | Fix | Net effect |
| --- | --- | --- | --- | --- |
| 1 | Wheel creeps while locked; beats asymmetric | Locking face built radial to the wheel; the stone moves on an arc about the fork pivot, so lever motion pushed the face into the tooth | Face tangent to the pivot arc | Worse (clearing penetration by moving the wheel forward drove the tooth deeper) |
| 2 | Same | Guessed the stone polygon was non-convex (it was, on the exit side) | Triangle-fan decomposition | No change; wrong diagnosis |
| 3 | Same | Chorded arc is not invariant under rotation; forward-only clearing | Exact stone region (annular sector about pivot ∩ planes); clear in either direction | 6 → 4 failures |
| 4 | Entry impulse never drops | Let-off placed in polar coordinates about the pivot, scaling the rise by the body radius | Cartesian let-off | 7 failures (let-off now too shallow on one side) |
| 5 | Same | Let-off at a different pivot radius than the lock arc lifts at a different rate (the circular-vs-equidistant pallet trade-off) | Place the let-off by construction at the drop point | 2 failures |
| 6 | Exit impulse releases 0.7° of lever early | Thought the stone's back arc was in the tooth path | Added a back edge | No change (harmless, kept) |
| 7 | Same | Free-run speed of the wheel was below the rate at which the exit face recedes, so the sim reported a false drop | Raised free-run speed | All green |

Seven rounds. The brief's soft criterion was three or fewer; six or more is a fail on that line.
No round reintroduced an earlier bug; each failure was a distinct geometric fact discovered in
order. Rounds 2 and 6 were wasted diagnoses.

## Tests that were restated (not loosened), for the reviewer to judge

- "Stationary while locked" now excludes run-to-banking: after drop the lever still travels to
  its banking with the tooth on the locking face, and the test originally counted that as lock.
- "Half a tooth per beat" is now measured lock-to-lock. Entry and exit impulses are not mirror
  images with circular pallets, so mid-impulse the two half-periods differ by up to a degree.
- "Never runs backward" allows 0.001° of numerical noise from the contact solver.

## Render rounds

One. First frames had the stones drawn as a sliver and a sail (outline not matching the region),
a lever tail poking into the wheel, and bankings in the wrong place. Second frames read correctly.

## Horology simplifications in the spike

- Pointed (ratchet) teeth, not club teeth. Contact is tip-only; with club teeth part of the lift
  is on the tooth and contact is face-on-face.
- Zero draw. Real locking faces are angled so the wheel pulls the lever onto its banking and
  recoils during unlock. Here the lever parks at the banking by construction.
- Fork angle is linear in balance angle while the pin is in the notch (true slider-crank omitted).
- No guard pin, roller crescent or safety action.
- Balance is a pure sinusoid: the escapement is kinematic, slaved to the balance. Rate, amplitude
  and beat error in the Bench would come from a separate lumped model, not from this contact sim.

## Go / no-go scoring

| Criterion | Must pass | Result |
| --- | --- | --- |
| Invariant tests | yes | pass (10 green, 0 skipped; three restated as above) |
| Visual correctness at 1/20 | yes | pass (Akash watched one beat at 1/20 on 2026-11-01: no clipping; lock, impulse and drop visible) |
| Convergence | yes | pass (no regressions; two wasted rounds) |
| Correction rounds | no | fail (7) |
| Readability | no | likely pass: phase label, coloured active face, contact ring |

**Decision (2026-11-01): go.** Build the full Bench.
