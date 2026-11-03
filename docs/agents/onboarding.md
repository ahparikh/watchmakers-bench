# Brief: ONBOARDING agent

You are the ONBOARDING agent on The Watchmaker's Bench, at /Users/ahp/.personal/code/websites/anthropic. Read CLAUDE.md first (especially "Ownership": you own the copy strings in src/puzzles/index.ts — title, symptom, goal, explanation, and the `question` prompt/choices/whyCorrect — a new src/app/onboarding.ts, one mount line in src/main.ts, and may add named states to src/verify/states.ts; you do not touch src/core, src/view, index.html CSS, or tests). Then read watchmaker_brief.md ("Experience": a reviewer is solving a puzzle within 30 seconds with no watch knowledge; "Reviewer gets lost" risk), GLOSSARY.md, docs/research/02-beat-rates-and-timegrapher.md (what a timegrapher shows), docs/judgment-log.md, and docs/handoffs.md (requests waiting for you).

A previous attempt may have left partial edits; `git diff` shows them. Keep what is good.

Goal: a complete beginner lands on the page and, within 30 seconds, knows what the two pictures are, what the goal is, which knob to touch, and how to tell they are winning. Then they learn something true. Use the page yourself first (`npm run dev`, or screenshots from `node .claude/skills/verify-render/scripts/verify-render.mjs --root .`) to feel where a newcomer gets lost. The live site is https://watchmakers-bench.pages.dev.

Deliver, in priority order:
1. A first-run layer (src/app/onboarding.ts, mounted with one line in src/main.ts): short, dismissible, non-blocking; points at the three panels ("the movement: the tick-tock engine", "the timegrapher: the instrument a watchmaker listens with", "your job"), plus a "how to read the trace" explainer reachable any time (sloping line = gaining or losing; two lines apart = out of beat; the three numbers). Plain words, define each term on first use, lines under ~15 words. Persist dismissal in localStorage. Must not cover the controls.
2. Puzzle copy in src/puzzles/index.ts for a beginner, changing no mechanics field (faults, band, holdSeconds, controls, specOverride). Each goal names the control and the number to watch. Each explanation teaches one idea in ≤3 sentences, true to docs/research (puzzle 3: the escapement alone would make it lose; the regulator pins are why it gains; puzzle 4: a heavy spot at the bottom LOSES above ~220° of amplitude and gains below).
3. Progressive hints: after 60 wall-seconds without progress, one hint (from onboarding.ts, reading the DOM; if a tiny hook from main.ts is needed, that is your one mount line).
4. Named states in src/verify/states.ts for your screens.

Constraints: no new dependencies; no runtime LLM; plain TypeScript; check every string against GLOSSARY.md meanings; if unsure a sentence is true, report it rather than ship it. Keep `npm test` green and verify-render passing. Do not commit. Requests outside your files go in docs/handoffs.md. Report: what a newcomer sees in the first 30 seconds, strings you were unsure of, screenshot paths of the first-run layer.
