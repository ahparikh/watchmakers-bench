---
name: verify-render
description: Verify that the movement renders correctly. Use after any change to shapes, the renderer, the sim core, or a named state, before saying a visual is done, and when a user reports a render that looks wrong. Screenshots named states via Playwright and runs numeric geometry checks the page exposes.
---

# verify-render

Vision alone misses fine geometry. This skill pairs screenshots with numbers: the page exposes
named states and a `check()` that returns pass/fail assertions computed from the same shapes
the renderer draws. The script drives both and reports like a test run.

## Contract the app must honour

- `?state=<name>` in the URL loads a named state, paused.
- `window.__bench` exists after render with:
  - `states(): string[]` — every named state.
  - `check(): { name: string; pass: boolean; detail: string }[]` — numeric assertions for the
    state currently shown (no overlap, contact on the expected face, lever within bankings,
    anything the state declares it expects).
  - `describe(): string` — one line: what this state is supposed to show.
- The root `<svg>` carries `data-state="<name>"` once rendered.

Named states and their expectations live in `src/verify/states.ts` (root app) or
`spike/src/states.ts` (spike). A new visual feature adds a state there; it never adds a check
to the renderer.

## Steps

1. Run the script from the app directory. It starts the Vite dev server itself.
   ```
   node .claude/skills/verify-render/scripts/verify-render.mjs --root <app dir> [--state <name>]
   ```
   It writes `shots/<state>.png` under the app dir and prints one line per check. Exit code is
   non-zero if any check fails or any state fails to render.
2. **Read every screenshot** with the Read tool. For each, compare the frame against the
   state's `describe()` line printed above it. Decide: does the picture show what the line
   says? Numbers catch overlap; only eyes catch "the stone is on the wrong side of the wheel".
3. Report in three groups: numeric failures (quote the detail line), visual disagreements
   (name the frame and what is off), and frames that pass both. A state passes only when both
   agree.
4. Fix in the sim or shapes, never by editing a check's tolerance or a state's expectation to
   match the picture. If an expectation was genuinely wrong, say so in the transcript and
   change it in `states.ts` with a one-line comment giving the reason.

Done when every state passes both the numbers and your eyes, or the remaining failures are
listed with a cause for each.
