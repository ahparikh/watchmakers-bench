import type { Phase, StoneName, Face } from "./sim";

export interface NamedState {
  phase: Phase;
  beat: 0 | 1;
  frac: number;
  describe: string;
  expect: { phase: Phase; stone?: StoneName; face?: Face };
}

export const STATES: Record<string, NamedState> = {
  "entry-lock": { phase: "lock", beat: 0, frac: 0.5, describe: "Balance far from centre, pin out of the notch, tooth resting on the ENTRY stone's locking face, wheel still.", expect: { phase: "lock", stone: "entry", face: "locking" } },
  "entry-unlock": { phase: "unlock", beat: 0, frac: 0.5, describe: "Pin in the notch, lever lifting the entry stone, tooth still on the locking face.", expect: { phase: "unlock", stone: "entry", face: "locking" } },
  "entry-impulse-start": { phase: "impulse", beat: 0, frac: 0.1, describe: "Tooth tip just past the entry corner, on the impulse face.", expect: { phase: "impulse", stone: "entry", face: "impulse" } },
  "entry-impulse-end": { phase: "impulse", beat: 0, frac: 0.9, describe: "Tooth tip near the entry let-off corner.", expect: { phase: "impulse", stone: "entry", face: "impulse" } },
  "entry-drop": { phase: "drop", beat: 0, frac: 0.5, describe: "Wheel free between the entry let-off and the exit stone.", expect: { phase: "drop" } },
  "exit-lock": { phase: "lock", beat: 1, frac: 0.5, describe: "Tooth resting on the EXIT stone's locking face, pin out of the notch.", expect: { phase: "lock", stone: "exit", face: "locking" } },
  "exit-impulse-mid": { phase: "impulse", beat: 1, frac: 0.5, describe: "Tooth sliding along the exit impulse face.", expect: { phase: "impulse", stone: "exit", face: "impulse" } },
  "exit-drop": { phase: "drop", beat: 1, frac: 0.5, describe: "Wheel free between the exit let-off and the entry stone.", expect: { phase: "drop" } },
};
