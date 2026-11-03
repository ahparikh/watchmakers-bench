# Beat rates and how a timegrapher reads a movement

Research note for The Watchmaker's Bench, 2026-11-01. Sources read directly: the `tg` open-source timegrapher source (vacaboja), Witschi product leaflets and the WisioScope product page, ETA's CT 2824-2 technical communication, Ciechanowski's *Mechanical Watch*, Wikipedia (ETA SA, Lever escapement), Caliber Corner, Watchguy's lift-angle table, and WatchRepairTalk threads. Claims are tagged **[verified]** (read in a primary or owning source), **[secondary]** (plausible, only seen second-hand), or **[unverified]**.

## (a) Beat rates, beat period, balance frequency

One **beat** (also "vibration", "alternance", French *alternance*, hence ETA's "A/h" or "alt/h") is one half-swing of the balance, from one extreme to the other. Each half-swing releases one escape-wheel tooth and makes one tick. One full oscillation is two beats. **[verified]** Ciechanowski: "the balance wheel does a full back-and-forth swing four times per second, hitting the pallet fork twice during each cycle, for a total of 8 beats per second or 28,800 beats per hour." ETA's CT 2824-2 lists "Fréquence 28'800 alt/h" and "Typical angle lift of balance 50°".

| bph | beat period (s) | oscillation period T (s) | balance frequency (Hz) | beats per day |
|---|---|---|---|---|
| 18,000 | 0.2000 | 0.4000 | 2.5 | 432,000 |
| 19,800 | 0.1818 | 0.3636 | 2.75 | 475,200 |
| 21,600 | 0.1667 | 0.3333 | 3.0 | 518,400 |
| 25,200 | 0.1429 | 0.2857 | 3.5 | 604,800 |
| 28,800 | 0.1250 | 0.2500 | 4.0 | 691,200 |
| 36,000 | 0.1000 | 0.2000 | 5.0 | 864,000 |

Formulas: beat period = 3600 / bph; T = 7200 / bph; f = bph / 7200. **[verified]** by arithmetic and matched to `tg` (`compute_period` searches around `7200 * sample_rate / bph`, so `tg`'s internal "period" is the full oscillation, two beats). `tg` presets exactly this list plus 12,000, 14,400, 17,280, 43,200 and 72,000 bph; Witschi instruments accept 3,600 to 72,000 A/h. **[verified]**

## (b) How the timegrapher derives rate, beat error and amplitude

**Rate.** The machine measures the actual tick-to-tick interval against the nominal one for the selected beat rate and scales the fractional error to a day. In `tg` (`computer.c`): `rate = (7200 / (bph * T_measured) - 1) * 24 * 3600` s/day, where `T_measured` is the measured two-beat period in seconds. Equivalent: rate = (T_nominal / T_measured − 1) × 86,400. Positive means the watch runs fast. **[verified, tg source]** The sensitivity is tiny per beat: 10 s/day at 28,800 bph is 14.5 µs per beat, so machines average many beats before displaying. Witschi quotes ±0.1 s/d accuracy with ranges of ±999 s/d. **[verified, Witschi X1 leaflet]** The lift angle setting does not affect rate. **[verified, tg source; secondary on forums]**

**Beat error.** With a beat error the tick→tock interval d1 and tock→tick interval d2 are unequal. `tg` computes `be = T/2 - d1` (`algo.c` `compute_parameters`), reported as |be| in ms. Since d2 = T − d1, this equals |d2 − d1| / 2, which is also exactly the horizontal separation of the two trace lines. **[verified, tg source]** Whether Witschi and Weishi report the half-difference (trace separation) or the full difference |d2 − d1| I could not confirm from a Witschi manual; forum and vendor guides only say "the difference between tic and toc". **[unverified; see recommendation below]** Range on every machine is 0 to 9.9 ms, resolution 0.1 ms. **[verified, Witschi leaflets; Weishi manual via search snippet, secondary]**

**Amplitude.** Acoustic machines cannot see the balance, so they time how long the balance takes to cross the lift angle, the arc over which the impulse pin is engaged with the pallet fork. Witschi's explanation, quoted on WatchRepairTalk: "To calculate the amplitude, the time between the first pulse and the third pulse of the beat noise is measured. Between these two pulses, the balance wheel rotates a certain angle. This so-called lift angle is determined by the construction of the movement and is entered as a parameter. The larger the amplitude ... the shorter is the time it needs to traverse this angle." **[secondary, forum quote attributed to Witschi]** Witschi's own WisioScope page confirms the principle by contrast: an optical sensor gives "actual amplitude, independent of lift angle". **[verified]**

The formula, from simple harmonic motion θ(t) = A·sin(2πt/T) with the lift angle λ centred on the rest position, is:

    A = (λ / 2) / sin(π · Δt / T)

where Δt is the unlock-to-lock interval within one beat and T is the full oscillation period (two beats). This is exactly what `tg` implements: `amp = la * 0.5 / sin(M_PI * pulse / period)` (`algo.c` `compute_amplitude`), and the inverse `asin(lift_angle / (2 * amp)) / M_PI` in `output_panel.c`. `tg` only accepts a result if both tick and tock give 135° to 360° and agree within 60°. **[verified, tg source]** The formula in the task brief, `lift_angle / (2π·Δt/T)`, is the small-angle approximation of this and is wrong by a few percent at normal amplitudes; use the sine form. Worked values at λ = 52°: 28,800 bph, A = 280° gives Δt = 7.4 ms; A = 200° gives 10.4 ms; 18,000 bph, A = 280° gives 11.8 ms. The reported amplitude is the half-amplitude: the swing from the rest position to one extreme, so "280°" means 280° each way. **[secondary, Watchguy comment; consistent with the formula]**

**Why 52°.** It is the long-standing default on timing machines (`tg` `DEFAULT_LA 52`; the Weishi 1000 manual says "factory set it to 52°", range 30° to 70°; Caliber Corner: "52° is a generally assumed average and also the default lift angle on most timing machines", most calibres fall "between 48-54 degrees"). **[verified for tg; secondary for Weishi and the "why"]** Real values differ by calibre. ETA states 50° for the 2824-2. **[verified, ETA CT 2824-2, 2011 and 2022 editions]** Watchguy's table lists ETA 2824 53°, 2892-A2 52°, 7750 49°, 6497 44°, Seiko 7S26/4R36 53°, Rolex 3135 52°, Unitas 52°. **[secondary, community table]** Amplitude reads linearly in λ, so a 1° error in the setting is about a 2% error in amplitude. Caliber Corner's example (52° vs 51° taking a reading from 239° to 228°) is larger than that and I could not reconcile it. **[unverified]** Witschi machines accept 10° to 90°. **[verified]**

## (c) What the trace shows

Each tick is plotted as one dot. The horizontal position (on a vertical strip like `tg`'s, or the vertical position on the horizontal Witschi/Weishi display) is the tick's time offset measured modulo the nominal beat period; successive beats advance by one row. If the watch runs exactly on time every dot lands in the same column. If it runs fast, each tick arrives slightly early and the dots drift, so the line's slope is the rate. In `tg`: `slope = -rate * zoom / 86400` in units of strip width per beat, with strip width = beat period / 10 (12.5 ms at 28,800 bph, 20 ms at 18,000), and a horizontal guide line every 10 s. **[verified, tg `output_panel.c`, `PAPERSTRIP_ZOOM 10`]** Ticks and tocks alternate, so with beat error the odd and even dots form two parallel lines separated by the beat error in ms; a single clean line means near-zero beat error. **[verified in tg; secondary for Witschi/Weishi]** Witschi's Watch Expert III leaflet gives the display scale as "Time scale adjustable from 1 up to 9 mm / ms (zoom)" on a 256 × 64-dot screen, and the Weishi 1900 display is 480 dots wide; so one screen is a few hundred beats, roughly 10 to 60 s of ticking. **[verified for Witschi; secondary for Weishi]** Scatter in the dots means an unstable escapement; two lines with different slopes do not occur in a healthy movement.

## (d) The sounds of one Swiss lever beat

Witschi's amplitude method implies three audible pulses per beat: (1) **unlocking**, the impulse pin hits the fork and the pallet stone slides off the escape-wheel tooth against the draw; (2) **impulse**, the tooth slides down the pallet's impulse plane and pushes the balance; (3) **drop/lock**, the escape wheel drops and the next tooth lands on the locking face of the other pallet while the lever hits the banking pin. The WatchRepairTalk quote attributes the measured pulses to "the escape-wheel tooth meeting the locking plane of the pallet-stone and the lever hitting the banking-pin". **[secondary]** The lever escapement phases themselves (unlock, impulse, drop, lock, with draw holding the lever on the banking) are standard. **[verified, Wikipedia Lever escapement; Ciechanowski's step list "escape wheel unlocks ... pallet fork pushes the jewel roller ... escape wheel locks again"]** Timing: pulse 1 to pulse 3 is the lift-angle traverse, Δt in the formula above, so about 7 to 12 ms at 280° depending on beat rate, and longer at lower amplitude. `tg` searches for pulse 1 up to one eighth of a period (31 ms at 28,800 bph) before the loudest pulse and treats the loudest pulse as the lock. **[verified, tg source]** The relative loudness and the position of the impulse pulse between the two I could not verify from a primary source. **[unverified]**

## (e) Tolerances

- ETA 2824-2 grades, mean rate and max positional variation: Standard, 2 positions, ±12 s/d, variation ±30; Elaboré, 3 positions, ±7 s/d, variation ±20; Top, 5 positions, ±4 s/d, variation ±15; Chronometer follows COSC (−4/+6 s/d mean daily rate). **[secondary, Wikipedia ETA SA; ETA's own manufacturing-information sheet with amplitude and beat-error limits was not found online]**
- Beat error: vendor and watchmaker guides treat under about 0.5 to 0.6 ms as good; ETA's own figure not found. Forum readings on a freshly serviced 2824-2 show 0.1 ms. **[secondary]**
- Amplitude: Caliber Corner quotes 260° to 310° for a healthy movement at full wind, dial up, falling as oils age; forum readings on a serviced 2824-2 show 278° to 286°. Vertical positions read lower than dial up. **[secondary]** Machines refuse readings below 70° to 80° (Witschi) or 135° (`tg`). **[verified]**
- Measurement precision of the instruments: rate ±0.1 s/d, amplitude ±0.4° to ±1°, beat error ±0.1 ms. **[verified, Witschi leaflets]**

## Numbers and formulas to use in the simulation

| Item | Recommendation | Confidence |
|---|---|---|
| Beat definition | 1 beat = 1 half-swing = 1 tick; beat period = 3600/bph; T = 7200/bph | High (verified) |
| Default calibre beat rate | 28,800 bph (4 Hz), optional second calibre 18,000 bph (2.5 Hz) | High |
| Rate | `rate_s_per_day = (T_nominal / T_measured - 1) * 86400`, average over many beats; + = fast | High (tg source) |
| Beat error | Display `abs(d2 - d1) / 2` in ms (equals the trace-line separation, matches tg); note in GLOSSARY that some machines may show the full difference | Medium (tg verified; Witschi convention unverified) |
| Amplitude | `A = (lift / 2) / sin(pi * dt / T)` where dt = unlock-to-lock time; invert to produce dt from the simulated amplitude | High (tg source, SHM derivation) |
| Lift angle | Parameter per calibre; machine default 52°, sim calibre 50° for an ETA 2824-2-like movement, 44° for a 6497-like pocket calibre | High for 52° default and ETA 50°; Medium for others |
| Healthy amplitude | 270° to 300° dial up at full wind; below 200° is a fault; trace invalid below 135° | Medium (secondary only) |
| Healthy rate / beat error | Within ±10 s/d and under 0.5 ms as "healthy"; ±12 s/d ETA Standard; puzzle "runs fast" at +40 s/d is clearly out of spec | Medium |
| Trace geometry | One dot per beat, x = tick offset mod beat period, slope ∝ rate, two lines separated by beat error; show about 300 beats per screen (about 37 s at 28,800 bph) | High for the mechanism; Medium for the screen scale |
| Beat sounds | Three pulses per beat: unlock, impulse, lock; pulse 1 to pulse 3 spans the lift angle (7 to 12 ms at 280°) | Medium (Witschi description is second-hand) |

Sources: `tg` source files `algo.c`, `computer.c`, `output_panel.c`, `tg.h` at https://github.com/vacaboja/tg ; Witschi Watch Expert III leaflet (cousinsuk.com/PDF/skus/643_leaflet_watchexpertIII t20214.pdf), Chronoscope X1 leaflet (cousinsuk.com/PDF/skus/3531_T32439_leaflet_chronoscope-X1 (G2).pdf), WisioScope page https://www.witschi.com/en/?p=2757 ; ETA CT 2824-2 https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1883 and /1884 ; https://ciechanow.ski/mechanical-watch/ ; https://en.wikipedia.org/wiki/ETA_SA ; https://en.wikipedia.org/wiki/Lever_escapement ; https://calibercorner.com/lift-angle/ ; https://calibercorner.com/amplitude/ ; https://watchguy.co.uk/cgi-bin/lift_angles ; https://watchguy.co.uk/?p=2502 ; https://www.watchrepairtalk.com/topic/2727-how-does-the-timegrapheror-vibrograph-measure-amplitude/ ; Weishi 1000 manual (manuals.online, via search snippet only).
