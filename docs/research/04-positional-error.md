# 04 Positional error: positions, pivot friction, poise

Researched 2026-11-01 for the Watchmaker's Bench sim. Scope: (a) the standard positions and why horizontal and vertical differ, (b) poise error and the "220° rule", (c) magnitudes, (d) a formula the sim can use.

Confidence labels: **[P]** verified from a primary source (standard, manufacturer document, patent citing the horological literature); **[S]** plausible, secondary only (blogs, forum practitioners); **[U]** could not verify.

## (a) Positions and why horizontal differs from vertical

**Vocabulary [P].** Witschi's *Testing of mechanical watches* (2025 PDF, p. 21) lists the six industry positions: dial up (CH), dial down (CB), crown down (9H), crown left (6H), crown up (3H), crown right (12H). The `nH` code names the hour index that sits at the **top**: the Rolex patent US10120341B2 defines 12H as "the index 12H of the dial ... situated at the top relative to the vector g" and 3H as "with the movement shaft at the top", citing NIHS notation and *Traité de construction horlogère* p. 741. ISO 3159 / COSC use five of these: 6H, 3H, 9H, FH (fond haut = dial down, Witschi's CB) and CH; 12H (crown right) is not tested (COSC: "tested in 5 positions"; Wikipedia lists "3 o'clock, 6 o'clock, 9 o'clock, dial on top, dial on the bottom"). Note Witschi's own p. 27 calls 6H "crown down", contradicting its p. 21 and the patent; treat 6H = crown left, 9H = crown down.

**Why vertical is worse [P for mechanism, S for the numbers].** Witschi p. 21 gives three reasons for multi-position testing: gravity acting on balance and escapement, imbalance of the balance, and "friction in the balance bearings varies with the position of the watch, leading to changes in both amplitude and rate". SJX (Richard Lee and Ashton Tracy, 2020) describe the geometry: dial up/down "has the least friction, with the main contact being the tip of the lower pivot ... akin to a spinning top on a table", while on its side "both pivots [are] turning against the wall of the bearings ... akin to a pen being laid flat", so "friction on the pivots will always be higher when the watch is placed on its side" and the visible symptom is "a drop in amplitude".

**Size of the amplitude drop.** Witschi's worked six-position dataset (p. 26) is a real-looking example: fully wound CH 298°, CB 294°, vertical 278–287°; after 24 h horizontal 286–298°, vertical 264–279°. Its DVH amplitude value is −12° at 0 h **[P, one example]**. Practitioner consensus on watchrepairtalk is "around 30° (±10°)" for wristwatches, ~40° for slow-beat vintage, ~60° for Unitas 6498 pocket calibres; drops near 100° indicate a fault (pivot ends polished too round, excess lock) **[S]**. Witschi p. 12: healthy full-wind amplitude 270–310°, lift angle ≈ 51° for most modern movements **[P]**.

## (b) Poise error and the 220° rule

**What it is [P].** The Rolex patent defines static imbalance as "the product of the mass of the balance times the distance between its center of gravity and the axis of rotation ... typically measured in µg·cm or nN·m. With terrestrial gravity, 1 µg·cm corresponds to approximately 0.1 nN·m." It states, citing J.-J. Augsburger, *La mise d'équilibre des balanciers*, Proc. Swiss Chronometry Congress 1966 p. 324: the rate effect "is proportional to the imbalance itself", "inversely proportional to the inertia of the balance", "highly dependent on the amplitude of oscillation ... It is even cancelled out completely for an amplitude close to 220°", "varies as the sine of the azimuth angle between the axis of the balance ... and the vertical" (so zero when dial up/down) and "varies with the angle between the direction of the imbalance and the vertical", with two opposite vertical positions where it vanishes and two, 90° away, where it is maximal. A second zero exists near 400° (patent, description).

**Why 220° [P, derivation checked here].** Put the heavy spot at angle φ from the downward vertical when the balance is at rest (φ = 0: heavy spot at the bottom). Gravity adds the torque −g·u·cos φ·sin θ to the hairspring's −k·θ (u = mass × eccentricity; the sin φ part only shifts the rest position and is second order). Harmonic balance of sin(Θ cos ωt) gives a fundamental 2J1(Θ)cos ωt, so

    ω² = ω0² · [1 + (g·u·cos φ / (I·ω0²)) · 2·J1(Θ)/Θ]
    rate [s/d] ≈ 86400 · (g · u · cos φ / (I · ω0²)) · J1(Θ)/Θ

with I the balance inertia, ω0 = 2πf, Θ the amplitude in radians (zero to turning point, the timegrapher convention). J1's first zero is 3.8317 rad = **219.54°**, which is the 220° rule. The patent's claim 9 is exactly the least-squares inverse of this expression: `3H(θ) − 9H(θ) = 2·86400·g·bx /(I·(2πf)²) · J1(θ)/θ`, with x the 9H direction, so the model and the primary source agree on form and on the (2πf)² factor.

**Sign [P via patent axes, S via practitioners].** In the patent, bx > 0 (heavy spot toward the 9H index) makes 3H(θ) − 9H(θ) positive for Θ < 220°; in position 3H the 9H index is at the bottom. Hence: **heavy spot at the bottom at rest, amplitude below 220° → the watch gains; above 220° → it loses; heavy spot at the top is the mirror image.** Practitioners state the same: "influence is zero at about 220 degrees, and it changes from fast to slow under and over 220 deg", and the Greiner dynamic-poising procedure (Mark, watchrepairtalk, 19 Dec 2014) tests at 150–180° and takes the fastest vertical position as the one with the heavy spot down. Physical picture (forum, [S]): at low amplitude the heavy spot stays near the bottom and gravity stiffens the restoring torque like a pendulum; above 220° it spends enough of each swing past the horizontal that the net effect reverses.

**Dynamic poising at one amplitude is unreliable [P].** The patent, quoting Vermot et al. *Traité de construction horlogère* (PPUR 2011, pp. 190–200), warns that single-amplitude "rate to positions" poising "lacks precision" because other position errors (hairspring, escapement) are mixed in; Rolex's method fits the J1 curve across amplitudes either side of 220°. A side note: WO2012007460 recommends correcting at 137° or 316.5° (the zeros of J0) so the material removed does not itself unbalance; that is a manufacturing detail, not a rate rule **[U, not pursued]**.

## (c) Magnitudes

| Quantity | Value | Source |
|---|---|---|
| ISO 3159 / COSC, movements > 20 mm: mean daily rate | −4 / +6 s/d | COSC FAQ [P] |
| mean variation in rates | ≤ 2 s/d | Wikipedia table from von Osterhausen [S] |
| greatest variation in rates (one position, day to day) | ≤ 5 s/d | same [S] |
| difference horizontal − vertical (mean CH/FH days 9–10 minus mean 6H days 1–2) | −6 / +8 s/d | same [S] |
| largest variation in rates (any rate vs mean) | ≤ 10 s/d | same [S] |
| thermal variation | ±0.6 s/d/°C; rate resumption ±5 s/d | same [S] |
| Test: 15 days, 5 positions, 8 / 23 / 38 °C | | COSC FAQ [P] |
| Witschi worked example: max position delta D | 8.0 s/d at 0 h, 9.1 s/d at 24 h; DVH −2.1 s/d | Witschi p. 26–27 [P, example] |
| Patent example: position spread before/after balancing | ≈ ±7 s/d → ±2–3 s/d; apparent imbalance 10.5 → <0.2 µg·cm | US10120341B2 [P] |
| Good milled balance alone | mean residual 1.5 µg·cm | Augsburger 1966 via patent [P] |
| Correction range of Rolex inertia blocks | ≥ 20 µg·cm | patent [P] |
| Balance inertia, 4 Hz wristwatch | ≈ 12 mg·cm² (patent design example, ≥ 12·10⁻¹⁰ kg·m²; engineering calculator 1.2·10⁻⁹ kg·m²) | [S] |
| Practitioner tolerance for vertical spread after poising | within ±60 s/d is "properly poised" (forum) | [S] |

Model check (computed from the formula above, f = 4 Hz, I = 12 mg·cm², cos φ = 1): 10 µg·cm gives about +37 s/d at 100°, +20 at 150°, +10 at 180°, 0 at 219.5°, −3.6 at 240°, −6.7 at 270°, −7.4 at 300°. A 10 µg·cm fault at full wind therefore reads as a 10–15 s/d spread between opposite vertical positions, which matches the patent's "±7 s/d" example in scale.

## Could not verify

- Daniels *Watchmaking*, de Carle, Jendritzki and Fried were not reachable online; no quote from them is used. Ciechanowski's *Mechanical Watch* covers regulator and beat adjustment but says nothing about positions or poise.
- ISO 3159's day-by-day position schedule (6H days 1–2 ... CH days 9–10) is inferred from the Wikipedia footnote on criterion D, not from the standard text.
- Whether the vertical amplitude drop should be modelled as viscous or Coulomb friction is not settled by any source found; the brief's 20–60° range is consistent with everything above but no primary source states a range.

## Numbers and model to use in the simulation

| Item | Recommendation | Confidence |
|---|---|---|
| Positions | Six: CH (dial up), CB/FH (dial down), 9H crown down, 6H crown left, 3H crown up, 12H crown right. Puzzles and the COSC check use the ISO five (drop 12H). | High [P] |
| Amplitude, horizontal → vertical | Default drop 30°, parameter range 10–60°; treat > 80° as a fault symptom. Implement as extra pivot damping in vertical positions, scaled by sin(tilt). | Medium [S, one Witschi example] |
| Poise error model | `rate_sd = 86400 · g · u · cos(φ) · sin(tilt) / (I · ω0²) · J1(Θ)/Θ` with u in kg·m (1 µg·cm = 1e-11 kg·m), φ = heavy-spot angle from the downward vertical at rest in the current position, tilt = angle of the balance axis from vertical (0 dial up, 90° vertical), Θ = amplitude in rad. Use a series or `besselj` for J1. | High [P] |
| Sign convention | Heavy spot at bottom (φ = 0), Θ < 219.5°: gains. Θ > 219.5°: loses. Crossover 219.54° (first zero of J1); second zero ≈ 400°, irrelevant. | High [P] |
| Default fault magnitude for puzzles | u = 10 µg·cm, I = 12 mg·cm², f = 4 Hz: ≈ +10 s/d at 180°, ≈ −7 s/d at 290°. Tolerance target after fix: < 1.5 µg·cm. | Medium |
| Pass/fail readout | COSC-style: horizontal − vertical within −6/+8 s/d, largest position spread ≤ 10 s/d, mean rate −4/+6 s/d. | High for −4/+6 [P], medium for the rest [S] |

## Sources

- Witschi Electronic AG, *Testing of mechanical watches* (2025), https://www.witschi.com/wp-content/uploads/firmwares/o0kUcAHH/20250717_witschi_testing-methods-for-mechanical-watches_en.pdf, pp. 12, 21–27.
- Rolex SA, US10120341B2 *Method for determining an imbalance characteristic of an oscillator*, https://patents.google.com/patent/US10120341B2/en (background, claims 5 and 9; cites Augsburger 1966, Furer et al. 1996, Vermot et al. 2011).
- COSC FAQ, https://www.cosc.swiss/cosc-faq; COSC methods page https://cosc.swiss/en/certification/methods-measurement (JS-rendered, text not retrievable).
- Wikipedia, *COSC*, ISO 3159 criteria table (from F. von Osterhausen, *Wristwatch Chronometers*, Schiffer 1997), https://en.wikipedia.org/wiki/COSC.
- R. Lee and A. Tracy, *Why the Position of a Watch Influences Accuracy*, SJX 2020, https://watchesbysjx.com/2020/02/positional-error-and-accuracy.html.
- watchrepairtalk: *Dynamic poising* (Mark, 2014) https://watchrepairtalk.com/topic/1222-dynamic-poising; *Question about poising* https://watchrepairtalk.com/topic/11380-question-about-poising; amplitude-delta threads 34934, 18558, 17242.
- B. Ciechanowski, *Mechanical Watch*, https://ciechanow.ski/mechanical-watch/ (checked, nothing on positions).
