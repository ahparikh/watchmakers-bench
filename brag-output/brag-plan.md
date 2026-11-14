# Brag Plan: The Watchmaker's Bench

## What is this app?
A browser bench where you learn why a mechanical watch runs fast or slow by diagnosing and regulating a live, simulated movement, read through a timegrapher (rate in s/day, amplitude in degrees, beat error in ms).

## The angle
A watch comes in with a complaint. The video is the repair: the timegrapher shows the fault as a sloping phosphor line, one slider on the bench moves a real part on the drawing, and the line goes flat. Nothing in the video is a mock-up: the movement drawing and the timegrapher are rendered frame by frame by the app's own sim core and SVG renderers (`src/core`, `src/view`), so every number on screen is the number the app would show.

## Hook (first 2-3 seconds)
Dark instrument screen. A phosphor trace draws itself, sloping away from the centre line, over the sound of a ticking watch. The readout settles on **+41 s/day**. One line, verbatim from puzzle 1: *"The owner says it gains about 40 seconds a day."*

## Key moments (the middle)
- The movement on the drafting sheet: escape wheel, lever and balance ticking in slow motion, the phase caption changing (Lock, Unlock, Impulse, Drop), three drafting labels landing one by one.
- Puzzle 1 solved live: cursor drags **Regulator index** toward S, the regulator glows ruby on the drawing, the rate falls from +41 to 0, the trace flattens, the hold bar fills to "solved", "Why it worked" opens.
- Three more jobs: "Out of beat" (two trace lines merge into one), "Afternoon slump" (the trace bends as the wind runs down), "Position error" (the slope flips between crown up and crown down). Each mini trace is the real sim running that puzzle.

## Outro / punchline
"The Watchmaker's Bench" / "Why a watch keeps bad time, and how you fix it." / watchmakers-bench.pages.dev, with the balance still swinging.

## User flow worth showing
Read the symptom and the sloping trace → drag Regulator index toward S (the part lights up on the drawing) → rate reads 0 s/day, hold bar fills, "solved", explanation.

## Tone
- Preset: polished
- Creative direction: quiet drafting-sheet product film; an instrument, a drawing, one adjustment
- Interpretation: few scenes, long holds, no hype copy. Motion comes from the watch itself (the balance swing, the trace) rather than from decoration. Ruby is the only accent, as in the app.

## Format: landscape — 1920x1080
## Duration: 24.5 seconds

## Visual identity (from the project)
- Background: `#dfe3d9` (desk mat) with the sheet `#f6f7f2` / paper `#fbfcf8`
- Accent: `#b2322b` (ruby)
- Text: `#1c2733` (blue-black ink); on the instrument `#eef1ea` on case `#202528`, screen `#10261f`, phosphor `#9be39b` / `#e0e39b`
- Display font: Avenir Next (the app's own stack: "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif)
- Body font: same
- Strongest visual element: the phosphor timegrapher trace against the ink-on-paper movement drawing

## Share copy (draft)
A watch that gains 40 seconds a day, and the one slider that fixes it. The Watchmaker's Bench: diagnose a live, simulated movement and regulate it, reading the timegrapher the way a watchmaker does.

## Audio direction
- Role: warm bed with sparse professional accents
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean), trimmed to the film length
- Music treatment: starts at 0 under the ticking, bed volume about 0.3, fades out over the last 1.5 s
- Music cue guidance: bundled preset read (`cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.md`, 109.96 BPM). Strong-cue locks: 8.74 s (cursor grabs the regulator), 13.11 s ("solved"), 22.93 s (URL lands). Beat grid: movement ticks land on every beat in scene 2 (0.545 s apart, non-text accents); drafting labels on 5.34 / 6.56 / 7.64 (every other beat, they are text); job cards on 16.93 / 18.02 / 19.10 (every other beat).
- Audio-reactive treatment: subtle; music RMS breathes the phosphor glow around the instrument screen. No waveform or equalizer visuals.
- SFX posture: sparse, motion-matched: a watch-tick bed under the hook, one click on the grab, one soft bell on "solved", soft drops for the three job cards, one bong on the URL.
- Audio-coupled moments: ticking under the growing trace; click on slider grab; bell on solved; card drops.
- Restraint rule: no whooshes, no risers, nothing louder than the bed except the bell.

## Storyboard

### Scene 1 — The complaint — 0.00 to 3.82 (3.82 s)
Dark case colour full frame. The real timegrapher (puzzle 1 as loaded) large on the right; its trace grows from the left, sloping; readout climbs to +41 s/day, 280°, 0.0 ms. Left: "The owner says it gains about 40 seconds a day." (9 words, settled about 2.9 s).
Sequential/interaction: the trace draws itself tick by tick.
Audio intent: intimate; a watch on a microphone.
Audio-coupled idea: tick bed at 5 ticks a second (18,000 bph) for the length of the scene.
Music: bed enters quietly from 0.
Transition mood: soft → Scene 2 (dark lifts to paper)

### Scene 2 — The movement — 3.82 to 8.19 (4.37 s)
Paper drafting sheet with the 32 px grid. The real movement drawing as hero on the right, running, phase caption live. Left: "The Watchmaker's Bench" then "Diagnose a live movement and regulate it." (trimmed from the app's tagline). Three drafting labels with leader lines, in the glossary's terms: "escape wheel", "pallet fork", "balance".
Sequential/interaction: labels arrive one by one (5.34, 6.56, 7.64), each held to the end of the scene.
Audio intent: the bed opens up.
Audio-coupled idea: escapement ticks land on the music beat (movement speed chosen so one beat of the watch equals one beat of the track).
Transition mood: clean → Scene 3

### Scene 3 — The repair — 8.19 to 16.38 (8.19 s)
The bench itself, three columns as in the app: job card (Puzzle 1 · Runs fast, symptom, goal, hold bar), movement, timegrapher with Regulator index and State of wind under it. Cursor grabs the regulator thumb (8.74), drags toward S until 10.4; the regulator index glows ruby on the drawing; the value reads "−1.20° (toward S)"; the rate falls and the trace flattens; hold bar fills; at 13.11 "solved" and "Why it worked" opens with its first sentence marked: "The regulator index had been pushed toward F."
Sequential/interaction: simulated drag on the real slider; counter and hold bar driven by the sim. The instrument clock is sped up in the edit so the 60-second hold fits; the label on the screen still reads what the app shows.
Audio intent: focus, then release.
Audio-coupled idea: click on grab; soft bell on solved.
Transition mood: clean → Scene 4

### Scene 4 — Three more jobs — 16.38 to 20.75 (4.37 s)
Paper. Header "Three more jobs on the bench". Three job cards arrive one by one (16.93, 18.02, 19.10): "Puzzle 2 · Out of beat", "Puzzle 3 · Afternoon slump", "Puzzle 4 · Position error". Each card carries a small live timegrapher running that puzzle: lines merge as the beat adjustment moves; the trace bends as hours since wind go 0 → 30; the slope flips from crown up to crown down.
Sequential/interaction: cards one by one, every other beat; all three held together to the end.
Audio intent: light, even.
Audio-coupled idea: one soft drop per card.
Transition mood: soft → Scene 5

### Scene 5 — Outro — 20.75 to 24.50 (3.75 s)
Paper. "The Watchmaker's Bench" large; "Why a watch keeps bad time, and how you fix it."; URL "watchmakers-bench.pages.dev" lands at 22.93. The movement runs small at the right. Music credit in small type.
Sequential/interaction: none.
Audio intent: resolve; bed fades.
Audio-coupled idea: one bong on the URL.
Transition mood: fade out.

**Music mood for this video:** steady, clean, restrained
**Audio summary:** a ticking watch under a quiet bed, one click when the hand touches the regulator, a soft bell when the watch comes right, and a fade.

## Grounding notes
- Every on-screen number comes from the app's sim (`readWatch`, `advanceTicks`, `analyze`) and both drawings from `renderMovement` / `renderTimegrapher`.
- Copy sources: puzzle titles, symptom, goal, explanation from `src/puzzles/index.ts`; title and tagline from `index.html`; "why it keeps bad time and how you fix it" from `CLAUDE.md`; labels from `GLOSSARY.md` terms; URL from `README.md`.
- UI copy says "lever", never "Swiss lever" (project decision).
- No personal data, keys or internal URLs appear anywhere in the video.
