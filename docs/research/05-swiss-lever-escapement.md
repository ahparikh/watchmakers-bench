# Swiss lever escapement: phases, design numbers, and the spike's parameters

Researched 2026-11-01 for The Watchmaker's Bench. Question: what are the phases of one beat, what numbers do
the design texts give, what geometric rules apply, how long do the phases take, and do the spike's parameters
(15 teeth, lock 1.5°, lift 8° of lever, run to banking 0.5°, drop 2° of wheel, 52° balance lift angle,
pointed teeth, zero draw) hold up.

## Sources actually read

| Tag | Source | Standing |
| --- | --- | --- |
| [P] | H. R. Playtner, *An Analysis of the Lever Escapement* (1910), Project Gutenberg #21978, full text | primary (period design text) |
| [H] | Horopedia (FHH / Fondation de la Haute Horlogerie), "Swiss lever escapement", "Lift" | primary (industry reference; machine-translated from French) |
| [A] | Mark Headrick, *Clock and Watch Escapement Mechanics*, web chapters 12–17 at abbeyclock.com | secondary (worked drawing method) |
| [C] | Ciechanowski, *Mechanical Watch*, ciechanow.ski/mechanical-watch | secondary (no design numbers) |
| [S] | Watches by SJX, "Geometric efficiency of escapements" (2024), quoting Défossez and Daniels | secondary, quoting primaries |
| [M] | Mumford MicroSet, "Analyzing watch ticks" | secondary (timer manufacturer) |
| [W] | WatchGuy lift-angle database; Caliber Corner "Lift angle"; forum quotes of Witschi training text | secondary / community |
| [Wk] | Wikipedia "Lever escapement" (draw section is uncited) | tertiary |

Not reached: Daniels *Watchmaking* and *The Practical Watch Escapement*, de Carle *Practical Watch Repairing*,
Gazeley, Fried *The Watch Escapement*, BHI course notes, Witschi's per-calibre lift-angle list. Archive.org has
no readable copy; web searches surfaced only tables of contents. Every claim attributed to them below is
marked "could not verify".

## (a) Phases of one beat and their names

Verified from [H] and [P], consistent with [C] and [Wk]:

1. **Rest (lock).** A tooth sits on the locking (resting) face of one pallet stone; the lever rests on its
   banking pin, held there by draw. The balance is in its supplementary arc, detached. [H]
2. **Unlocking.** The impulse pin enters the fork and pushes the lever; the tooth slides back up the locking
   face. Because of draw the wheel recoils: geometric recoil about 0.15–0.25° of wheel, plus a dynamic recoil
   of about 0.04° where the tooth briefly leaves the face. Unlocking ends when the tooth tip reaches the
   locking corner of the stone. [H] Horopedia's translation calls this phase "drop angle"; Playtner calls the
   same quantity "lock". Use *lock* for the depth and *unlocking* for the phase, never "drop", which is a
   different thing below.
3. **Impulse.** The tooth drives across the impulse face. With a club tooth the first part of the lift is
   given by the tooth's own impulse face acting on the stone's locking corner, the rest by the stone's impulse
   face acting on the tooth tip [P §Lift, A ch.13]. With a pointed (ratchet, "English") tooth the whole lift is
   on the pallet face [P]. Impulse begins before the balance's dead point and ends after it [H]. There is a
   short free travel of the balance between end of unlocking and start of impulse (fork catches up with pin) [H].
4. **Drop.** The wheel runs free from the moment the tooth leaves one impulse face until the next tooth lands
   on the other stone's locking face. Measured at the wheel. [H, P] Playtner: "a clear loss of power".
5. **Run to banking (slide).** After the tooth lands, the lever keeps moving until it hits the banking pin;
   the tooth slides down the locking face by the same amount. Measured at the lever. [H, P] Lock seen at rest
   is therefore the locking depth at drop plus the run ("total lock" [P]).
6. **Draw** is not a phase but the inclination of the locking faces that makes the wheel's torque pull the
   lever onto its banking and keep the guard pin clear of the roller during the supplementary arc. It is what
   makes unlocking cost energy and causes the recoil. [H §Draw, P §Draw, Wk]

Safety action: the guard pin (dart) against the safety roller, and the fork horns against the impulse pin,
stop the lever from crossing to the wrong banking during the supplementary arc (overbanking) [H §8, P].
The roller crescent lets the guard pin pass only when the pin is in the notch [P].

## (b) Numbers from the texts

| Quantity | Value | Source and status |
| --- | --- | --- |
| Escape wheel teeth | 15 "nearly all"; 14 or 16 possible; 12 in complicated watches; 30 in old English | [P] verified. 15 gives 24° pitch, divides 360 evenly, and lets the pallets span 3 teeth with centres on tangents [P]. 20 teeth in a Rolex high-frequency patent claim (>36,000 vph) only; no text found giving a 20/21 rationale: could not verify |
| Wheel advance per beat | half a pitch: 12° for 15 teeth; 24° per full oscillation | [A, S, P] verified. Each beat moves one pallet out and the other in, so the wheel goes from one stone to the other, i.e. half the tooth spacing |
| Pallets embrace | 3 teeth = 2.5 spaces = 60° lock-to-lock; 4 teeth would be 84°; fewer teeth makes side-shake fatal, more makes the pallets heavy | [P] verified; [A] uses the same 2.5-tooth span (30° each side) |
| Total lever angle | 10° drop-to-drop, 10.25–10.5° bank-to-bank; "some of the finest 8 or 9°" | [P] verified. Horopedia says total pallet lift "generally between 12° and 20°" [H]: conflicts with [P]; may be a translation or modern-calibre figure. Treat 10° as the design-text value, flag the discrepancy |
| Lock | 1.5° of lever "generally allowed", less in large escapements | [P] verified. [A]: "ideal 1°", uses 3° only to make drawings forgiving |
| Run to banking | 0.25–0.5° of lever | [P] verified ("the run or slide") |
| Drop | 1.5° of wheel for club tooth, 2° for ratchet tooth; smaller for larger wheels | [P] verified. [A] uses 2° in drawings, "theoretically correct 1°" |
| Inside / outside drop | the two drops (entry vs exit) are set equal by design; [S] quotes Défossez's drops "together about 1°" | [P] implies equal; inside/outside terminology not found in sources read: could not verify |
| Lift split, club tooth | Playtner spec: 3° on tooth, 5.5° on pallet (of 10.25° total with 1.75° total lock). An equal 4.25/4.25 split is shown as wrong: the pallet corner scrapes the tooth face. Tooth lift must be less than pallet lift | [P] verified. [A] in wheel degrees: tooth face 2° (later 4°), drop 2°, pallet 8° (later 6°), summing to 12° |
| Tooth / pallet widths (wheel degrees) | 12° per beat = tooth 4.5° + pallet 6° + drop 1.5°; tooth 3/4 of pallet width | [P] verified |
| Draw | 12° each pallet (Playtner), some texts 15° entry / 12° exit; tooth locking faces inclined 24° (twice the draw) | [P] verified. [H]: ideal 13–16° for steel wheel on ruby; also states "ideally 9°" in the same section, an internal contradiction, likely translation. [A] draws 15°. [Wk] 11–15° (uncited) |
| Impulse at the wheel | 11° each pallet for a 15-tooth model (Défossez), "similar values suggested by Daniels" | [S] secondary quoting primaries; consistent with 12° − drop |
| Balance lift angle | Playtner: "impulse angle" 28° in his spec, 31.5° at a 3:1 fork-to-impulse-radius ratio. Horopedia: 40–52° depending on calibre. Lists: 48–54° typical, 52° the default on most timing machines | [P] verified for 1910 practice; [H] verified; [W] secondary. Modern angles are larger than Playtner's because the fork is longer relative to the roller: Horopedia says small movements raise the pallet-to-balance lift ratio by shortening the roller and lengthening the fork, at the cost of isochronism |
| Why 52° | no source gives a derivation. It is the modal value in practice: 1018 of ~3000 WatchGuy entries are 52°, then 53, 49, 50, 51 | [W] secondary; "why" could not verify beyond "industry average" |
| Vintage 42–45° | lists show 42° (93 entries), 44°, 45° clustered on older calibres (e.g. Unitas 6497 44°, Hamilton 992E 42°) | [W] secondary; the published lists disagree with each other (ETA 2824: 53° on WatchGuy, 50° elsewhere). Treat per-calibre values as ±2° |
| Fork length vs roller | Playtner: acting fork length = wheel-to-pallet centre distance; fork-angle to balance-angle ratio 3:1 "good for an ordinary watch"; safety roller radius 4/7 of impulse radius; slot width half the fork's total motion; guard pin freedom 1.25°; horn freedom 1.5°; guard freedom must be less than lock so the draw can recover | [P] verified for his design |

## (c) Geometric design rules

- **Tangential planting.** The pallet pivot is placed on the lines from the wheel centre's locking points
  tangent to the primitive circle, so that locking and unlocking are performed "on the tangent" with the
  tooth's force at 90° to the pallet arm. Playtner: unlocking resistance is least and lift most efficient when
  planted on the tangents; not possible in very small movements. Headrick's construction: 30° either side of
  the centre line, 90° between escape radius and pallet radius. [P, A] verified. The spike's
  `pivotDistance = R / cos(30°)` is exactly this.
- **Equidistant vs circular pallets.** Equidistant (also "tangential"): both locking corners at the same
  radius from the pallet pivot, so lock and unlock are equal on both sides, but the lifting arms differ (entry
  lifts on a shorter arm). Circular ("equal lifts"): impulse faces centred on one circle, arms equal, but the
  lockings cannot both lie on the tangent. Neither can make unlocking identical on both pallets. Finest Swiss
  work used equidistant; English ratchet-tooth levers should be circular. [P] verified. Headrick shows the
  resulting entry/exit asymmetry: with identical stones on both sides the exit pallet releases about 1° early
  ("out of angle"); a "semi-tangential" layout splits the difference. [A]
- **Club vs ratchet tooth.** Club tooth: wheel carries part of the lift, teeth hollowed so less drop is
  needed (1.5° vs 2°), stronger teeth, more inertia and face-on-face sliding. Ratchet: point on jewel, least
  adhesion, all lift on the pallet, needs more drop and wider pallets. The Swiss industry standardised on the
  club tooth. [P, A] verified.
- **Impulse face angle.** For efficiency the stone's impulse face bisects the angle between the escape
  radius and the pallet radius (45° when they are at 90°). [A] secondary.

## (d) Timing within a beat

Derived here from a sinusoidal balance (angle = A·sin ωt), not found stated in any source. The escapement is
engaged while the balance is within ±L/2 of centre, where L is the balance lift angle. Fraction of a beat =
(2/π)·asin(L/2A). This is the same model Witschi's amplitude formula inverts: forum quotes of Witschi training
text give A = L / (2·sin(π·Δt·bph/7200)), with Δt the time between the first and third pulses [W].

| bph | beat | A | L | engaged fraction | engaged time |
| --- | --- | --- | --- | --- | --- |
| 18,000 | 200 ms | 270° | 52° | 6.1 % | 12.3 ms |
| 18,000 | 200 ms | 200° | 52° | 8.3 % | 16.6 ms |
| 28,800 | 125 ms | 270° | 52° | 6.1 % | 7.7 ms |
| 28,800 | 125 ms | 200° | 44° | 7.0 % | 8.8 ms |

Drop itself is a free flight of 1.5–2° of wheel under train torque; its duration depends on wheel inertia and
is not given by any source read. MicroSet observes whole ticks of 10–12 ms up to 75–80 ms and places the drop
sound at about 22 ms for a 200° reading [M]. Horopedia counts five impacts per vibration: unlocking (pin hits
fork), tooth lands on impulse face, fork catches up with pin, end of drop (tooth lands on locking face), end of
run to banking (lever hits pin) [H]. A timing machine resolves three bursts, unlocking, impulse, drop, and
takes amplitude from the interval between the first and the third [M, W]. Rate comes from the beat-to-beat
period and is independent of the lift-angle setting; lift angle scales only the amplitude reading [W].

## Numbers to use in the simulation

| Parameter | Recommended | Confidence |
| --- | --- | --- |
| Teeth | 15 (24° pitch, 12° per beat) | high [P, A, S] |
| Pallet embrace | 2.5 spaces (60°), tangential planting | high [P, A] |
| Lock | 1.5° of lever (1° for a "fine" calibre) | high [P, A] |
| Lift on lever | 8–8.5° so total bank-to-bank is 10–10.5° | high [P]; flag [H] 12–20° |
| Run to banking | 0.25–0.5° of lever | high [P] |
| Drop | 2° of wheel with pointed teeth, 1.5° with club teeth | high [P] |
| Draw | 12° on both pallets (range 12–15°); tooth locking face 24° | high [P]; medium range [H, A, Wk] |
| Club-tooth lift split | tooth 3° : pallet 5.5° of lever (about 1:2) | medium [P one spec, A agrees in shape] |
| Balance lift angle | 52° default; 50–53° modern; 42–45° for a "vintage" calibre | medium [H, W] |
| Guard pin freedom / horn freedom | 1.25° / 1.5°, both less than lock | medium [P] |
| Recoil during unlocking | 0.15–0.25° of wheel | medium [H] |

## Spike parameters: verdict

- **15 teeth, 2.5-space embrace, tangential pivot**: correct, verified [P, A].
- **Lock 1.5° of lever**: correct, the textbook value [P]; 1° is the refined choice [A].
- **Lift 8° of lever with total 10° bank-to-bank**: correct against Playtner (8.5° lift in 10–10.5° total).
  Horopedia's 12–20° is the one dissenting figure and is unexplained; keep 10° and note it.
- **Run to banking 0.5°**: correct, top of Playtner's 0.25–0.5° range.
- **Drop 2° of wheel**: correct for the pointed teeth the spike uses; must fall to 1.5° if club teeth are adopted.
- **52° balance lift angle**: correct as the industry default; not a design constant. The rendered balance
  swing per 10° of lever implies a fork-to-roller ratio near 5:1, larger than Playtner's 3:1, which is the
  modern direction [H]. Expose it as a per-calibre parameter (42–53°).
- **Zero draw**: off. Every source treats draw of 12–15° as essential; it is what holds the lever on the
  banking, produces the 0.15–0.25° recoil during unlocking, and makes unlocking cost the balance energy. A
  kinematic spike can park the lever by construction, but the Bench's energy model needs draw or the
  unlocking loss and the "runs fast at low amplitude" behaviour will have no mechanism.
- **Pointed teeth, all lift on the pallet**: internally consistent (it is the English lever) but not Swiss.
  Promote to club teeth with the lift split above before the model is called a Swiss lever.
