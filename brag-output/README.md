# Brag video

A 24.5 s launch video for The Watchmaker's Bench, made with the `/brag` skill and Hyperframes. It opens by crediting Bartosz Ciechanowski's [Mechanical Watch](https://ciechanow.ski/mechanical-watch/), which explains how a watch works, then shows what this site is for: repairing one that keeps bad time.

- `brag.mp4`: the video (1920x1080, 60 fps). Frame 0 is the poster.
- `brag.jpg`: the poster frame.
- `brag-preview.gif`: silent 800 px preview, embedded in the repository README (GitHub does not play a committed MP4 inline; the GIF links to it).
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

Then bake the poster as frame 0 and remake the preview, from `brag-output/`:

```sh
ffmpeg -y -ss 15.6 -i brag.mp4 -frames:v 1 -q:v 2 brag.jpg
ffmpeg -y -i brag.mp4 -i brag.jpg -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" -map "[v]" -map "0:a?" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart brag.poster.mp4 && mv brag.poster.mp4 brag.mp4
ffmpeg -y -ss 0.1 -i brag.mp4 -vf "fps=12,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" brag-preview.gif
```

If the app's `src/` changes, rebuild before rendering: the video follows the sim.

## Notes

- The instrument clock is sped up in the edit (about 18x to 33x) so the 60-second hold fits; the on-screen label still reads what the app shows ("at 10x time").
- Hyperframes substitutes Inter for the app's Avenir Next so renders are the same on every machine.
- Music: "Happy Beats / Business Moves Vol. 12" by Sascha Ende, ende.app, CC BY 4.0 (first 26 s). Credit it wherever the video is posted. Sound effects: Kenney.nl, CC0.
- Hyperframes usage telemetry was turned off on this machine for the build (`hyperframes telemetry disable`).
