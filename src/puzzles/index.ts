/** Diagnosis puzzles: a bundled faulty watch, a symptom, a hidden cause, a completion rule. */
import type { Position, WatchSettings, WatchSpec, WatchReading } from "../core/watch";
import type { Reading } from "../core/timegrapher/analyze";
import { TIRED_MAINSPRING } from "../core/oscillator/amplitude";

export interface Puzzle {
  id: string;
  title: string;
  symptom: string;
  goal: string;
  /** Hidden faults added to the user's settings. */
  faults: Partial<WatchSettings>;
  /** Hidden changes to the calibre itself. */
  specOverride?: (w: WatchSpec) => WatchSpec;
  /** Band the readings must stay inside (what the instrument shows, plus the physics), and for how long (sim seconds). */
  band: (r: WatchReading, tg: Reading | null) => boolean;
  holdSeconds: number;
  /** If set, the band must be held for `holdSeconds` in each of these positions in turn, with no
   *  failure in between (src/puzzles/progress.ts). */
  holdIn?: Position[];
  explanation: string;
  /** Which controls this puzzle shows, in display order, left to right. State of wind is a condition
   *  of the watch, not a repair, so every puzzle shows it. */
  controls: ("regulator" | "beat" | "wind" | "screws" | "position" | "poise")[];
  /** For puzzles with no knob fix: a two-choice question ends them instead of a band. */
  question?: { prompt: string; choices: string[]; correct: number; whyCorrect: string };
}

export const PUZZLES: Puzzle[] = [
  {
    id: "runs-fast",
    title: "Runs fast",
    symptom: "The owner says it gains about 40 seconds a day.",
    goal: "Slide <b>Regulator index</b> toward S (slow) until <b>rate</b> reads between −5 and +5 s/day. Hold it there for 60 seconds of ticks.",
    faults: { regulatorIndex: 1.2 },
    band: (r, tg) => r.running && !!tg && Math.abs(tg.rateSecondsPerDay) <= 5,
    holdSeconds: 60,
    explanation:
      "The regulator index had been pushed toward F. Its two pins hold the hairspring a little short of its outer end, and only the spring between the pins and the centre does the work. Toward F the pins slide away from the outer end, so the working length is shorter; a shorter spring is stiffer and swings the balance back a little quicker on every beat. Moving the index toward S slides the pins back out, more spring works, and the beats slow back to true time.",
    controls: ["regulator", "wind"],
  },
  {
    id: "out-of-beat",
    title: "Out of beat",
    symptom: "The ticking sounds uneven: tick-tock, tick-tock, like a limp. It keeps good time.",
    goal: "Slide <b>Beat adjustment</b> until the two lines on the screen become one and <b>beat error</b> reads under 0.5 ms. Hold it there for 60 seconds of ticks.",
    faults: { beatOffsetDeg: 6 },
    band: (r, tg) => r.running && !!tg && tg.beatErrorMs < 0.5,
    holdSeconds: 60,
    explanation:
      "The hairspring held the balance at rest slightly off centre, so the balance reached the fork early on one side of its swing and late on the other. Tick and tock were unequal: that gap is the beat error. Turning the stud carrier (the beat adjustment) moves the rest position back to centre, and the two lines on the screen merge.",
    controls: ["beat", "wind"],
  },
  {
    id: "afternoon-slump",
    title: "Afternoon slump",
    symptom: "Fine in the morning, gains by evening. Regulating it only moves the problem.",
    goal: "Slide <b>State of wind</b> from 0 h toward 40 h and watch <b>amplitude</b> and <b>rate</b> change together. Then answer the question below. No slider fixes this one.",
    faults: {},
    specOverride: (w) => ({ ...w, mainspring: TIRED_MAINSPRING }),
    band: () => false,
    holdSeconds: Infinity,
    question: {
      prompt: "You have watched it run down. What do you tell the owner?",
      choices: ["Move the regulator toward S to cancel the evening gain.", "The mainspring is tired. Regulating only shifts the error around the day. Fit a new mainspring."],
      correct: 1,
      whyCorrect: "Right. The regulator moves the whole day's rate up or down together; it cannot flatten the curve. The evening gain comes from the swing shrinking, and only the mainspring's push sets the swing.",
    },
    explanation:
      "This mainspring is tired: its push fades 40 % over a day instead of 15 %, so the balance's swing shrinks by evening. In a flat-hairspring watch like this one a smaller swing runs faster, because the regulator pins touch the spring differently; the escapement alone would make it lose, but the pins win. Some errors are physics, not adjustment: the fix is a new mainspring.",
    controls: ["wind", "regulator"],
  },
  {
    id: "position-error",
    title: "Position error",
    symptom: "Keeps good time lying on the nightstand, loses on the wrist.",
    goal: "Read <b>rate</b> in each of the four crown <b>Position</b>s. At this swing, the one that loses most has the heavy spot at the bottom. Remove weight there with <b>Poising</b> (the rim reads 0° at the bottom when crown up, 90° crown right, 180° crown down, 270° crown left). Then show <b>rate</b> within ±3 s/day in every crown position, 15 seconds of ticks each.",
    // Heavy spot at the bottom when crown down: the brief's "good dial up, bad crown down".
    faults: { unbalance: 10e-11, heavySpotDeg: 180 },
    // What the instrument shows must be in band in every crown position. The unbalance itself is
    // also checked (research 04: a well-milled balance has a residual of about 1.5 µg·cm =
    // 1.5e-11 kg·m), only so that running the watch down to the 220° crossover, where a poise error
    // vanishes from the rate without being fixed, does not count as a repair.
    band: (r, tg) => r.running && !!tg && Math.abs(tg.rateSecondsPerDay) <= 3 && r.netUnbalance <= 1.5e-11,
    holdSeconds: 15,
    holdIn: ["CU", "CR", "CD", "CL"],
    explanation:
      "One spot on the balance rim is heavier than the rest: the balance is out of poise. Lying flat, gravity pulls along the axis and the heavy spot does nothing; standing up, gravity tugs it on every swing. A heavy spot at the bottom makes the watch lose above about 220° of amplitude and gain below it, so the error even changes between a fresh wind and the evening.",
    controls: ["position", "poise", "wind"],
  },
];
