/** Diagnosis puzzles: a bundled faulty watch, a symptom, a hidden cause, a completion rule. */
import type { WatchSettings, WatchSpec, WatchReading } from "../core/watch";
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
  explanation: string;
  /** Which controls this puzzle shows. */
  controls: ("regulator" | "beat" | "wind" | "screws" | "position" | "poise")[];
  /** For puzzles with no knob fix: a two-choice question ends them instead of a band. */
  question?: { prompt: string; choices: string[]; correct: number; whyCorrect: string };
}

export const PUZZLES: Puzzle[] = [
  {
    id: "runs-fast",
    title: "Runs fast",
    symptom: "The owner says it gains about 40 seconds a day.",
    goal: "Bring the rate within ±5 s/day and hold it there for 60 seconds of ticks.",
    faults: { regulatorIndex: 1.2 },
    band: (r, tg) => r.running && !!tg && Math.abs(tg.rateSecondsPerDay) <= 5,
    holdSeconds: 60,
    explanation:
      "The regulator index was sitting toward Fast. Its pins shorten the hairspring's active length, which stiffens it and shortens the period: the balance swings a little quicker every beat, and 86,400 seconds of quicker beats add up to 40 s/day. Moving the index toward Slow lengthens the spring and brings the period back.",
    controls: ["regulator"],
  },
  {
    id: "out-of-beat",
    title: "Out of beat",
    symptom: "The tick sounds uneven: tick-tock, tick-tock, like a limp. The rate is fine.",
    goal: "Bring the beat error under 0.5 ms and hold it for 60 seconds of ticks.",
    faults: { beatOffsetDeg: 6 },
    band: (r, tg) => r.running && !!tg && tg.beatErrorMs < 0.5,
    holdSeconds: 60,
    explanation:
      "The hairspring's rest position was rotated away from the fork's centre line, so the balance passed the notch late on one side and early on the other. The two half-swings had different lengths. Rotating the stud carrier (the beat adjustment) turns the rest position back under the fork.",
    controls: ["beat"],
  },
  {
    id: "afternoon-slump",
    title: "Afternoon slump",
    symptom: "Fine in the morning, drifts by evening. Regulating it only moves the problem.",
    goal: "Drag the state of wind through the day and explain what you see. There is no knob that fixes this.",
    faults: {},
    specOverride: (w) => ({ ...w, mainspring: TIRED_MAINSPRING }),
    band: () => false,
    holdSeconds: Infinity,
    question: {
      prompt: "You have watched it run down. What do you tell the owner?",
      choices: ["Move the regulator toward Slow to cancel the evening gain.", "The mainspring is tired; regulating only moves the error around the day. Replace the spring."],
      correct: 1,
      whyCorrect: "Regulating shifts the whole curve up or down; it cannot flatten it. The gain comes from amplitude falling, and only torque fixes amplitude.",
    },
    explanation:
      "The mainspring is tired: its torque falls 40 % over a day instead of 15 %. Amplitude follows torque, and rate follows amplitude: in a flat-spring watch the regulator pins make it gain as the swing shrinks, while the escapement alone would make it lose. Some errors are physics, not adjustment. The fix is a new mainspring, not the regulator.",
    controls: ["wind", "regulator"],
  },
  {
    id: "position-error",
    title: "Position error",
    symptom: "Keeps good time on the nightstand, loses on the wrist.",
    goal: "Compare dial up with the four crown positions. Find the heavy spot, then remove weight there with the poising control until the vertical positions agree with dial up within 3 s/day.",
    faults: { unbalance: 10e-11, heavySpotDeg: 0 },
    // Research 04: a well-milled balance has a residual of about 1.5 µg·cm = 1.5e-11 kg·m.
    band: (r) => r.running && r.netUnbalance <= 1.5e-11,
    holdSeconds: 60,
    explanation:
      "The balance is out of poise: one spot on the rim is heavier. Lying flat, gravity pulls along the axis and nothing happens. Standing up, gravity tugs the heavy spot on every swing, helping or hindering depending on where it sits. Below about 220° of amplitude the error has one sign, above it the other, which is why it changes between morning and evening too.",
    controls: ["position", "poise", "wind"],
  },
];
