# Hyperframes Composition Brief: The Watchmaker's Bench

## Objective
Create a short launch-style brag video for The Watchmaker's Bench.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 24.5 seconds

## Source Material
- Project root: the repository root (one level above `brag-output/`)
- Primary files read: `index.html` (markup, CSS tokens), `README.md`, `CLAUDE.md`, `GLOSSARY.md`, `src/puzzles/index.ts`, `src/view/movement.ts`, `src/view/timegrapher.ts`, `src/main.ts`, `src/core/**`, `src/verify/states.ts`
- Product name: The Watchmaker's Bench
- Tagline / strongest claim: "Diagnose a live movement and regulate it, reading the timegrapher the way a watchmaker does."
- Key UI or visual moment to recreate: puzzle 1 solved on the three-column bench: sloping trace, Regulator index dragged toward S, trace flat, "solved"
- Copy that must appear verbatim:
  - "Ciechanowski's Mechanical Watch shows how a watch works." and "ciechanow.ski/mechanical-watch"
  - "The Watchmaker's Bench is about fixing one."
  - "The owner says it gains about 40 seconds a day."
  - "Puzzle 1 · Runs fast" with its goal text, "Regulator index", "State of wind"
  - "Why it worked" / "The regulator index had been pushed toward F."
  - "Out of beat", "Afternoon slump", "Position error"
  - "Why a watch keeps bad time, and how you fix it." (from the project's own description of itself)
  - "watchmakers-bench.pages.dev"

## Creative Direction
- Tone preset: polished
- Creative direction: quiet drafting-sheet product film; an instrument, a drawing, one adjustment
- Interpretation: few scenes, long holds, soft crossfades, no hype copy. The watch supplies the motion.
- Angle: a watch comes in with a complaint and the video is the repair. The drawing and the instrument are the app's own renderers driven by its own sim, frame by frame, so the video shows the product working rather than a picture of it.
- Hook: the movement ticking on paper with a one-line credit to Ciechanowski's Mechanical Watch and the turn ("is about fixing one"); then the dark screen, the tilting trace, "+41 s/day", the symptom line, ticking.
- Outro / punchline: "Why a watch keeps bad time, and how you fix it." and the URL.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - The words "Swiss lever" (project decision: say "lever" until club teeth exist)

## Visual Identity
- Background: `#dfe3d9` ground, `#f6f7f2` sheet, `#fbfcf8` paper with the 32 px `#e1e4dc` grid
- Text: `#1c2733` ink, `#4a5663` secondary
- Accent: `#b2322b` ruby
- Instrument: case `#202528`, screen `#10261f`, phosphor `#9be39b` / `#e0e39b`, readout `#eef1ea`
- Display font: Avenir Next (app stack, system font on the render machine)
- Body font: same
- Visual references from the project: 1.5 px ink rules and square corners of the title block; index-style slider thumb; paper job card; hold bar in leaf green `#d9ead3`
- LOOK: ink on drafting paper beside one dark phosphor instrument; ruby only where a part is being touched.

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Where this comes from — 5.45 s — live movement drawing on paper, credit line and URL, "is about fixing one", three drafting labels
2. The complaint — 3.82 s — timegrapher trace tilts, +41 s/day, symptom line
3. The repair — 7.11 s — the bench; drag Regulator index toward S; rate to 0; "solved"; "Why it worked"
4. Three more jobs — 4.37 s — three job cards with live mini traces
5. Outro — 3.75 s — title, line, URL

## Audio
- Audio role: warm bed with sparse professional accents
- Audio arc: bed alone → ticking watch under the bed → click, then bell on the fix → soft drops → bong and fade
- Music: `assets/music/vol-12-bed.mp3` (first 26 s of `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`; Sascha Ende, ende.app, CC BY 4.0)
- Music treatment: volume about 0.3, fade out over the last 1.5 s
- Music cue guidance: bundled preset `cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; locks at 9.83, 14.20 (beats) and 17.47, 22.93 (strong cues); beat grid for movement ticks, labels and cards as listed in the plan
- Audio-reactive treatment: subtle; per-frame music RMS drives the phosphor glow around the instrument screen
- Audio-coupled moments:
  - Scene 1, 2.73 — soft drop under the second line
  - Scene 2 — tick bed at 5 ticks a second under the tilting trace
  - Scene 3, 9.83 — click as the cursor grabs the regulator thumb
  - Scene 3, 14.20 — soft bell on "solved"
  - Scene 4 — one soft drop per job card
  - Scene 5, 22.93 — bong as the URL lands
- SFX selection guidance: low high-frequency-risk files only; nothing repeated except the tick bed
- SFX analysis guidance: `<skill-dir>/assets/sfx/sfx-analysis.md`
- Exact SFX choice: chosen during composition against the implemented motion
- Audio files: copied into `brag-output/composition/assets/`

## Hyperframes Instructions
The Hyperframes authoring skills (`hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`) are not installed in this session and installing them is the person's step, so the composition follows the scaffold's `AGENTS.md` key rules and `npx hyperframes docs` (data-attributes, compositions, gsap, audio, rendering). `check` is the gate.

Implementation notes that belong to this project rather than to Hyperframes:
- `composition/src/` holds a small TypeScript entry that imports the app's sim core and renderers unchanged; `composition/build/build.mjs` bundles it to `composition/bench.js` and precomputes the escapement poses to `composition/poses.js` (the contact stepper is too heavy to run per frame in the browser). The scenario (settings as a function of film frame) is one shared module, so the precompute and the runtime agree.
- All per-frame state is a pure function of the frame index: deterministic and seek-safe.
- Audio-reactive data: the `media-use` extraction helper is unavailable, so RMS is extracted with ffmpeg in the build script.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer.
- Run `hyperframes check` before render.
- Keep creation and rendering local.
