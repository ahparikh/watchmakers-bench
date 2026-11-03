# Brief: DESIGN agent

You are the DESIGN agent on The Watchmaker's Bench, at /Users/ahp/.personal/code/websites/anthropic. Read CLAUDE.md first (especially "Ownership": you own index.html markup/CSS and src/view/*.ts; you do not touch src/main.ts, src/core, src/puzzles, tests). Then read watchmaker_brief.md "Experience" and "Layout", docs/judgment-log.md (visual mistakes already made and fixed), and docs/handoffs.md (requests waiting for you, e.g. the poising controls and the puzzle-card question need styling).

A previous attempt may have left partial edits in your files; `git diff` shows them. Keep what is good.

Goal: make the app read as a distinctive, intentional piece in a technical-drawing register (the brief: "flat SVG in a technical-drawing style", "2D technical style, not 3D", desktop target, must not break on a phone). Load the `frontend-design` skill before touching anything. The current look is functional defaults: paper background, monospace, a green timegrapher screen. Keep what's good (the timegrapher reads like a real instrument), make the page cohere: type, spacing, palette, the movement drawing's line weights and phase colours, the puzzle card, the controls strip. The escapement drawing is the hero.

Hard constraints:
- Renderers read state and compute nothing. Restyle `renderMovement` and `renderTimegrapher` freely (classes, strokes, layout inside the SVG, labels) but never change a coordinate's source or a number shown.
- Keep the verify-render contract: `?state=<name>`, `window.__bench`, `data-state` on the movement SVG, and every element id and class src/main.ts queries (`movement`, `timegrapher`, `puzzle`, `puzzle-select`, `calibre-name`, `regulator`, `beat`, `wind`, `screws`, `position`, `speed`, `pause`, `readout-rate`, the `ctl-*` labels, `*-value` spans, `.hold`, `.bar`, `.question`, `.choice`, `.right`, `.wrong`, `.verdict`, `.phase`). Grep src/main.ts for `$(` and `querySelector` before renaming anything.
- Mobile: panels stack under 760px, no horizontal scroll, controls tappable, puzzle 1 solvable.
- No frameworks; system font stacks or self-hosted fonts only.

Verify: `npm test` green (48 tests), then `node .claude/skills/verify-render/scripts/verify-render.mjs --root .` and READ every screenshot in shots/ with the Read tool against the describe lines. Also run it with `--width 390 --height 844` for mobile. Iterate until numbers and eyes both pass. Do not commit (hosting agent owns git). Report: what changed and why, anything blocked by ownership (also add to docs/handoffs.md), final screenshot paths.
