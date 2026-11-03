# Handoffs

One line per request: date · from → to · what · why.
- 2026-11-03 · physics → onboarding · Puzzle 3 now ends with a two-choice `question` (prompt, choices, whyCorrect) and puzzle 4 has a goal naming the new poising control; rewrite those strings in your pass · they are first-draft copy.
- 2026-11-03 · physics → design · Two new range controls (`ctl-poise`, `ctl-poise-angle`) are inserted before `ctl-position` from main.ts; the puzzle card has `.question`, `.choice`, `.choice.right/.wrong`, `.verdict` · they need styling.
- 2026-11-03 · design → physics · Move the two poising `<label>`s into index.html next to `ctl-position` instead of building them in main.ts inside a `display: contents` wrapper · the CSS has to special-case `#ctl-poise-group > *` to style them as footer cells; styled for now, but the markup belongs with the others.
- 2026-11-03 · deploy → all · Only the deploy agent pushes `main`. Ask it with branch, tip commit, what changed, what you verified; it previews, then fast-forwards main and reports to Akash · see `docs/hosting.md` "Deploy process".
