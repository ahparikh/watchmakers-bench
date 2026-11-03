# The Watchmaker's Bench

A browser app where anyone learns why a mechanical watch runs fast or slow by diagnosing and regulating a live, simulated movement, read through a timegrapher (rate in s/day, amplitude in degrees, beat error in ms).

`watchmaker_brief.md` is the source of truth for concept and scope. `CLAUDE.md` carries decisions and working rules. `SPIKE.md` records the escapement spike that preceded this build.

## Development

Requires Node 22 or newer.

```sh
npm ci            # install (no browser downloads; Playwright browsers are fetched only by the verify-render skill)
npm run dev       # Vite dev server
npm run build     # tsc --noEmit, then vite build → dist/
npm run preview   # serve dist/ locally
npm test          # vitest run (sim core)
```

## Deployment

Static site on Cloudflare Pages. Pushing to `main` redeploys production; every other branch gets a preview URL. See `docs/hosting.md`. Only the deploy agent pushes `main`; other agents request a deploy as described there.

Production URL: https://watchmakers-bench.pages.dev
