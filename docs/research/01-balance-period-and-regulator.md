# Balance period, regulator index and timing screws

Research note for The Watchmaker's Bench. Written 2026-11-01. Scope: questions (a) to (d) from the
brief's "balance period from inertia and hairspring stiffness" item. No code, no other files touched.

Legend: **[V]** verified from a primary or standard reference, **[P]** plausible, secondary source only,
**[X]** could not verify. Sign convention throughout: rate in s/day is positive when the watch gains.

## (a) Period formula and stiffness vs active length

- **[V] T = 2π·√(I/k).** Derived from τ = −kθ = Iα, giving simple harmonic motion with period
  T = 2π√(I/κ); I in kg·m², κ in N·m/rad. Wikipedia, *Balance spring*, section "Physical principles"
  (https://en.wikipedia.org/wiki/Balance_spring). Horopedia (Swiss non-profit watchmaking foundation,
  public-interest status 2023) states the same relation with the same units and names T, I and C:
  https://horopedia.org/moment-of-inertia/. Ciechanowski's *Mechanical Watch* says the rate is set by
  "the stiffness of the spring, which primarily depends on its height, thickness, and length, as well as
  the type of material" and "the moment of inertia of the object that the spring rotates"
  (https://ciechanow.ski/mechanical-watch/, section "Balance").
- **[V] k ∝ 1/L, with k = E·h·t³ / (12·L) for a flat spiral of rectangular section.** Horopedia's
  hairspring page gives "Stiffness (spring rate) of the hairspring" as a function of exactly these
  variables: C (N·mm/rad), E modulus (MPa), h height, e thickness, L length
  (https://horopedia.org/?p=69799, section 4; the formula itself is an image). The 1/12 constant is
  standard beam theory: bending stiffness E·I_section with I_section = h·t³/12, and a strip of length L
  under a uniform moment M rotates by θ = M·L/(E·I_section). Engineering spring references state it as
  M = E·b·t³·θ/(12·L) (https://calculator.academy/spiral-torsion-spring-calculator/,
  https://www.formuladen.com/en/flat-spiral-spring-controlling-torque-formula/Formula-22074).
  Horopedia also records the trade convention "CGS number" K = C·(length) in N·mm³/rad, i.e. the
  length-independent product that makes k = K/L explicit.
- **[P] Caveat.** The k ∝ 1/L law is first-order. A real curb-pin regulator leaves play between the
  pins, so effective stiffness varies a little with amplitude (Wikipedia *Balance spring*, "Regulator";
  SJX, https://watchesbysjx.com/2025/03/rate-regulators-mechanical-movement.html). Ignore in the core sim.

## (b) Regulator index: fractional length change to s/day

- **[V] Direction.** Shortening the active length stiffens the spring, raises frequency, watch gains;
  lengthening it makes the watch lose. Wikipedia *Balance spring* "Regulator"; Horopedia
  "Correction of the daily rate" (https://horopedia.org/?p=69271) states "if the active length of the
  hairspring decreases, the frequency increases, which results in gaining time". Moving the curb pins
  *away* from the stud shortens the active length (fast); toward the stud lengthens it (slow).
- **[V] First-order relation (derivation).** T ∝ √(I/k) and k ∝ 1/L give T ∝ √L, so
  ΔT/T ≈ ½·ΔL/L. Rate (s/day) = −86400·ΔT/T = **−43200·ΔL/L**. Likewise rate = −43200·ΔI/I
  and rate = +43200·Δk/k. One s/day corresponds to ΔL/L = 2.3×10⁻⁵.
- **[V] Empirical anchor.** Horopedia: "If a medium-sized wristwatch is running 10 s/day slow, the
  active length of the hairspring must be shortened by about 0.02 mm (approximate value for a hairspring
  with a length of 100 mm at the counting point and a balance of 11 mm diameter oscillating at
  28,800 A/h)." The formula gives 43200 × 0.02/100 = 8.6 s/day; Horopedia's "about 10" agrees within
  the rounding of its own example. Also gives L ≈ 100 mm as a representative hairspring length.
- **[P] Index angle to length.** The pins slide along the outer coil, so ΔL ≈ r_outer × Δθ(rad).
  For r_outer = 4–5 mm, 1° of index travel = 0.07–0.09 mm, i.e. roughly **30–40 s/day per degree**
  when L = 100 mm (my derivation from the Horopedia numbers, no source states it directly). Consistent
  with a repair-forum report that "one tenth mm of movement might change as much as 40 or 50 seconds per
  day" (https://watchrepairtalk.com/topic/20603-watch-regulation) and with the 1881 *Watch Adjuster's
  Manual* (C. E. Fritts, archive.org cihm_03260, §350) treating regulator moves of "half a minute per
  day, or more" as routine but isochronism-threatening.

## (c) Typical numbers

- **[V] Beat rates.** ETA 2824-2 family: 28,800 A/h (4 Hz, T = 0.25 s), lift angle 50°, Etachron
  regulator (ETA Technical Communication CT 2801-2, 18.07.2006,
  https://www.cousinsuk.com/PDF/categories/29_ETA2801.2-ETA2836.2.pdf; Ciechanowski: "four times per
  second ... 8 beats per second or 28,800 beats per hour"). Vintage: "Watches made prior to the 1970s
  usually had a rate of 5 beats per second (18,000 BPH)" (2.5 Hz, T = 0.4 s), Wikipedia *Balance wheel*.
- **[V] Balance inertia order of magnitude.** "For a frequency of 4 Hz, balance inertia of 12 mg·cm²
  is considered to be good, since this type of balance conventionally has a diameter of 9 to 10 mm",
  US patent 8,414,184 B2 (2013, contributors include Nivarox-FAR SA),
  https://patents.google.com/patent/US8414184B2/en. 12 mg·cm² = 1.2×10⁻⁹ kg·m².
- **[V by derivation] Hairspring stiffness.** k = I·(2πf)². With I = 1.2×10⁻⁹ kg·m²:
  4 Hz gives 7.6×10⁻⁷ N·m/rad; 2.5 Hz with the same I gives 3.0×10⁻⁷ N·m/rad. Firgelli's calculator
  pages quote 1.9×10⁻⁷ for a "4 Hz" 1.2×10⁻⁹ balance, which only follows if f = 2 Hz; their numbers are
  internally inconsistent and unsourced, so do not use them (https://www.firgelliauto.com/blogs/mechanisms/hairspring).
- **[P] Regulator sensitivity on real calibres.** No manufacturer figure found. Secondary sources:
  Etachron fine screw spans "+/-15 to 20 seconds" (https://calibercorner.com/etachron); vintage pocket
  watch "major marks are somewhere around one minute per day" (forum,
  https://www.watchprosite.com/horological-meandering/technical-question/17.1488341.14215956/);
  Fritts 1881, §310: "One beat in 5 minutes would (in an 18,000 train) be ... about one minute per day."
- **[X] 18,000 bph balance inertia.** No source gives I for a vintage calibre. Larger balances have
  larger I; treat any value as a design choice, not a fact.
- **[X] Daniels *Watchmaking* and de Carle *Practical Watch Repairing*.** archive.org copies are
  lending-only (HTTP 401/404 for full text); not consulted. Nothing above rests on them.

## (d) Timing screws and rim mass

- **[V] Sign.** Horopedia (https://horopedia.org/?p=69271, section 3): moving screw or weight mass
  "toward the inside of the balance, its moment of inertia is decreased and its frequency ... increases,
  causing the watch to run fast"; outward increases I, watch runs slow. I = m·r², so
  rate = −43200·ΔI/I. Opposite screws must be moved equally or the balance goes out of poise
  (Boley manuals below; Horopedia; Wikipedia *Balance wheel*).
- **[V] Magnitude, manufacturer tool manuals (Gebr. Boley).** Rolex cal. 3035/3135-type Microstella
  nuts: "allow setting over a range of 150 seconds per day"; low-head pair "one division of the graduated
  scale represent 1 seconds per day", high-head pair 2 s/day per division; "to set the watch on fast,
  turn the screw clockwise" (screw moves inward)
  (https://boley.de/downloads/48ba47cc7d854ba0ab446fdef4117350/Operating%20instructions.pdf).
  Omega 8xxx co-axial free-sprung screws: Type A "one complete revolution = 52 seconds", Type B
  "= 86 seconds" per day; German text gives 1 and 1.5 s/day per scale division, English says 1 for both
  (https://boley.de/downloads/0393584e7d0b443b967ab21ca75d98b9/Operating%20instructions.pdf).
  150 s/day full range implies ΔI/I = 0.35 %; 86 s/day per turn implies 0.2 % per turn.
- **[V] Vintage practice.** Fritts 1881, §346: compensation balances carry "four mean-time screws ...
  a quarter of a circle apart, and hence also termed quarter-screws"; §332: drawing the mean-time screws
  out "to cause a loss of a few seconds per day, (two to five, generally)". Timing washers under screws
  are the other inertia-only adjustment (Horopedia, https://horopedia.org/balance).
- **[P] Relative leverage.** SJX notes a change in r is more effective than the same change in L
  because r is squared in I = m·r². Correct for a single mass; for the whole rim I ∝ r².

## Numbers to use in the simulation

| Quantity | Value | Confidence |
|---|---|---|
| Period | T = 2π√(I/k); f = 1/T; bph = 7200·f | High [V] |
| Hairspring stiffness | k = E·h·t³/(12·L); expose k ∝ 1/L through L only | High on form, medium on 1/12 constant |
| Rate from length | rate(s/day) = −43200·ΔL/L (first order) | High [V], matches Horopedia 0.02 mm ≈ 10 s/day |
| Rate from inertia | rate(s/day) = −43200·ΔI/I | High [V] |
| Modern calibre (ETA 2824-2 style) | 28,800 A/h, 4 Hz, T = 0.25 s, lift angle 50°, I = 1.2×10⁻⁹ kg·m², k = 7.6×10⁻⁷ N·m/rad, L = 100 mm | Beat rate and lift angle high; I medium-high (patent); k derived |
| Vintage calibre | 18,000 A/h, 2.5 Hz, T = 0.4 s; pick I in 1.5–3×10⁻⁹ kg·m² and derive k | Beat rate high; I is a design choice [X] |
| Regulator index gain | ΔL per degree = r_outer·π/180 with r_outer = 4.5 mm → ≈ 0.08 mm/deg ≈ 34 s/day per degree at L = 100 mm | Medium-low, derived; forum data 40–50 s/day per 0.1 mm agrees |
| Regulator puzzle ("gains about 40 s/day") | index ≈ 1.2° toward F, or ΔL/L ≈ −0.09 % | Medium, follows from the above |
| Timing screws | 1–2 s/day per scale division, 50–150 s/day full range, inward = fast, move pairs together | High for Rolex/Omega (manufacturer tool manuals); medium that it transfers to other calibres |
| Sensitivity sanity check | 1 s/day = 2.3×10⁻⁵ fractional change in L, I or k | High [V] |
