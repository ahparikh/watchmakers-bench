# Glossary

Terms used in code, tests and docs. Identifiers use these words, not synonyms. Entries marked
*(spike)* are already encoded in `spike/`; the rest enter the vocabulary when the core is built.
Physics claims behind them are checked in `docs/research/`.

## Oscillator

- **balance** — the oscillating wheel. Its angle from rest is `balanceAngle` (degrees). *(spike)*
- **hairspring** — the spiral spring returning the balance to rest. Its stiffness sets the period together with balance inertia.
- **amplitude** — peak balance angle from rest, degrees. Healthy at full wind: roughly 250–300° dial up. *(spike, as `balanceAmplitude`)*
- **beat** — one half-swing of the balance, from one extreme to the other. One tick. *(spike)*
- **beat rate** — beats per hour (bph). 18,000 bph = 5 beats/s = 0.4 s period. *(spike)*
- **period** — time for a full swing (two beats). *(spike)*
- **regulator index** — the lever that slides the curb pins along the hairspring, changing its active length and so the rate. Marked F/S or +/−.
- **timing screws** — screws on the balance rim; turning them in or out changes balance inertia and so the rate.
- **stud** — the fixed outer anchor of the hairspring. Rotating the stud carrier changes where the balance rests relative to the fork: the **beat adjustment**.
- **poise** — the balance's mass balance about its axis. A **poise error** (heavy spot) changes rate in vertical positions.
- **isochronism** — the property of keeping the same period at any amplitude. Its absence is **isochronism error**.

## Escapement

- **escape wheel** — the toothed wheel the gear train drives; released one half-tooth per beat. `wheelAngle` is degrees of rotation in the direction of tooth travel. *(spike)*
- **tooth pitch** — 360° / tooth count. 24° for 15 teeth. *(spike)*
- **pallet fork** (lever) — the pivoted piece carrying two pallet stones and the notch. Its angle from centre is `forkAngle`. *(spike)*
- **pallet stone** (pallet) — the jewel that stops and then pushes the escape wheel. **Entry** stone meets each tooth first; **exit** stone last. *(spike)*
- **locking face** — the stone face a tooth rests on while the wheel is stopped. *(spike)*
- **impulse face** — the inclined stone face a tooth slides along, pushing the fork. *(spike)*
- **locking corner** — where the two faces meet. **Let-off corner** — the far end of the impulse face, where the tooth leaves. *(spike)*
- **lock** — the phase with the tooth at rest on a locking face. `lockAngle` is the lever rotation needed to unlock. *(spike)*
- **unlock** — the lever lifting a stone until the tooth tip passes the locking corner. *(spike)*
- **impulse** — the tooth sliding along an impulse face and pushing the fork, which pushes the balance. `liftLever` is the lever rotation it spans. *(spike)*
- **drop** — the escape wheel in free flight between leaving one stone and landing on the other. `drop` is the wheel rotation it spans. *(spike)*
- **run to banking** — the lever's remaining travel after drop until it rests on a banking pin. *(spike)*
- **banking** — the pins that limit lever travel; the lever rests on one between beats. *(spike)*
- **draw** — an angle (12–15° in practice) on the locking face so the wheel's torque pulls the lever onto its banking and recoils the wheel slightly during unlock. Zero in the drawing; its energy cost is a loss term in the oscillator model.
- **ratchet tooth / club tooth** — pointed teeth (English lever, all lift on the pallet) versus teeth with their own impulse face (Swiss, lift split roughly 3° tooth : 5.5° pallet). The drawing uses ratchet teeth on a Swiss in-line layout; UI copy says "lever escapement".
- **impulse pin** (roller jewel) — the pin on the balance that enters the fork's **notch** each beat. *(spike)*
- **lift angle** — the balance's travel while the impulse pin is in the notch. Timegraphers assume it (52° default) to compute amplitude. *(spike, as `liftAngle`)*
- **tangential geometry** — the layout rule placing the fork pivot where lines tangent to the escape wheel meet, with the stones at the tangent points. *(spike)*
- **circular / equidistant pallets** — two conventions for where the entry and exit lock arcs sit; the choice makes the two impulses asymmetric. The spike is circular.

## Instrument

- **timegrapher** — the bench instrument that listens to the ticks and reports rate, amplitude and beat error.
- **rate** — gain or loss in seconds per day (s/day). Positive = fast.
- **beat error** — the difference in milliseconds between tick-to-tock and tock-to-tick intervals. Zero means the balance rests centred.
- **trace** — the timegrapher's dotted plot of tick timing against beat number: slope is rate, separation of the two lines is beat error.

## Power

- **mainspring** — the coiled spring that stores energy. Its **torque curve** falls as it unwinds, lowering amplitude.
- **state of wind** — how much of the mainspring's run time remains.
- **gear train** — the wheels between mainspring and escape wheel; simplified in the drawing.

## Bench

- **calibre** — a named movement; one parameter set in the watch catalog.
- **position** — the watch's orientation (dial up, crown down, …) during timing.
- **puzzle** — a bundled faulty calibre with a symptom, a hidden cause and a completion rule.
