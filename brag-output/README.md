# Brag video

A 24.5 s launch video for The Watchmaker's Bench, made with the `/brag` skill and Hyperframes.

- `brag.mp4`: the video (1920x1080, 60 fps). Frame 0 is the poster.
- `brag.jpg`: the poster frame.
- `share-copy.txt`: one caption, postable as is.
- `brag-plan.md`, `composition-brief.md`: the plan and the handoff brief.
- `composition/`: the Hyperframes project.

The timegrapher and the movement drawing in the video are not mock-ups. `composition/src/film.ts` imports the app's sim core and renderers unchanged and draws every frame from them; `composition/src/scenario.ts` scripts what the hand does. The escapement's contact stepper is run offline into `poses.js`.

## Rebuild and re-render

From the repository root (Node 22, ffmpeg on PATH):

```sh
npm ci
node brag-output/composition/build/build.mjs   # bench.js, poses.js, rms.js
cd brag-output/composition
npm run check
npx hyperframes@0.9.44 render --fps 60 --quality delivery --output ../brag.mp4
```

If the app's `src/` changes, rebuild before rendering: the video follows the sim.

## Notes

- The instrument clock is sped up in the edit (about 18x to 33x) so the 60-second hold fits; the on-screen label still reads what the app shows ("at 10x time").
- Hyperframes substitutes Inter for the app's Avenir Next so renders are the same on every machine.
- Music: "Happy Beats / Business Moves Vol. 12" by Sascha Ende, ende.app, CC BY 4.0 (first 26 s). Credit it wherever the video is posted. Sound effects: Kenney.nl, CC0.
- Hyperframes usage telemetry was turned off on this machine for the build (`hyperframes telemetry disable`).
