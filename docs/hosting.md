# Hosting spec: The Watchmaker's Bench

- **Production:** https://watchmakers-bench.pages.dev (branch `main`, verified 2026-11-03)
- **Previews:** every other branch deploys to `https://<branch>.watchmakers-bench.pages.dev` (verified 2026-11-03)
- **GitHub:** https://github.com/ahparikh/watchmakers-bench (public), Cloudflare Pages project `watchmakers-bench`

Goal: pushing to `main` on GitHub redeploys the static site to Cloudflare Pages within a couple
of minutes, with a preview URL for every other branch. No backend, no secrets, no runtime keys.

Decided 2026-11-01 (see CLAUDE.md "Decisions"): Cloudflare Pages over Vercel because the free
tier has no commercial-use clause and no bandwidth cap, and nothing in this project needs
Vercel's serverless features.

## What already exists

- `/Users/ahp/.personal/code/websites/anthropic/` is the project root. It is currently an
  **untracked folder inside the parent repo** `~/.personal/code`, which manages each website
  as a git submodule (see `websites/shahparikh`: its own GitHub repo `ahparikh/shahparikh`,
  pushed over the SSH host alias `github-personal`).
- A root Vite app already builds: `npm ci && npm run build` produces `dist/` with a
  placeholder page. Node 22+ is required. The build runs `tsc --noEmit` first, so a type error
  fails the deploy on purpose.
- `spike/` is a separate throwaway package with its own `package.json`. It is not part of the
  build and must not be served.
- `.gitignore` already excludes `node_modules/`, `dist/`, and screenshot PNGs.
- `gh` is installed and logged in as `ahparikh`. `wrangler` is not installed.

Another agent is building the app in `src/` and `tests/` concurrently. **Do not edit
`package.json` scripts, `index.html`, `src/`, `tests/`, or `spike/`.** Add files only under
`docs/`, `.github/` if needed, and repo-level config (`README.md`, `wrangler.toml` if you choose
to use it).

## Steps

1. **Make this folder its own repository.** `git init` here (branch `main`), commit the current
   tree, create `ahparikh/watchmakers-bench` on GitHub (private or public, Akash's call; ask),
   push over `github-personal`. Then register it in the parent repo as a submodule at
   `websites/anthropic`, matching the `shahparikh` entry in `~/.personal/code/.gitmodules`.
   Do not push the parent repo without Akash's approval.
2. **Connect Cloudflare Pages.** Dashboard: Workers & Pages → Create → Pages → Connect to Git →
   select the repo. Settings: production branch `main`, build command `npm run build`, build
   output `dist`, root directory `/` (not `spike`), environment variable `NODE_VERSION=22`.
   The GitHub app authorisation and the Cloudflare login are steps only Akash can perform, so
   drive them with the `wizard` skill rather than describing them in prose.
3. **Verify.** After the first deploy, make a trivial docs-only commit, push to `main`, and
   confirm the `*.pages.dev` URL updates. Create a throwaway branch, push it, and confirm a
   preview URL appears. Delete the branch afterwards.
4. **Record.** Write the production URL and the preview-URL pattern at the top of this file and
   in the "Status" section of `CLAUDE.md` (one line each). Add a `README.md` with the one-line
   pitch, the dev commands, and the production URL.

## Constraints

- Playwright is a devDependency (used for render checks). `npm ci` installs it but must not
  download browsers during the Cloudflare build; the `playwright` package does not do so by
  default. If the build log shows a browser download, set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.
- Build time budget: under 2 minutes. If `tsc` plus `vite build` exceeds that, report it rather
  than removing the type check.
- No custom domain for now. If Akash wants one later it is a DNS step in the same dashboard.

## Acceptance

- Push to `main` → production URL shows the new build within 3 minutes.
- Push to any other branch → preview URL, production untouched.
- A failing `tsc` makes the deploy fail visibly in the Cloudflare build log.
- URLs recorded in this file and in `CLAUDE.md`.

## Deploy process (agreed 2026-11-03)

One agent, the **deploy agent** (session "hosting-env-setup-spec"), owns every push to `main`.
Other agents do not push to `main`; a denied push in another session is expected, not a bug.

**To request a deploy**, send the deploy agent a message (SendMessage, or tell Akash) with:

1. The branch name and tip commit. The branch must be committed in the shared checkout
   `/Users/ahp/.personal/code/websites/anthropic`; pushing it to origin is optional.
2. What changed, in a sentence or two, and what Akash should look at to check it.
3. What you verified: `npm test` count, `verify-render` result, anything manual.

**What the deploy agent does**, in order, and stops at the first failure:

1. Confirms the branch is a fast-forward of `main` and the working tree is clean enough to build.
   It never discards or commits anyone else's uncommitted work.
2. Runs `npm test` and `npm run build` on the tip.
3. Pushes the branch to origin and waits for the Cloudflare preview build
   (`https://<branch>.watchmakers-bench.pages.dev`). The GitHub check run "Cloudflare Pages"
   on the commit must succeed.
4. Fast-forwards `main` to the tip (`git push origin <sha>:main`) and waits for the production
   build, then confirms https://watchmakers-bench.pages.dev serves the new bundle.
5. Reports to Akash: what changed, which commits went live, and what to test in the browser.
   Replies to the requesting agent if anything blocked the build.

Merge commits are avoided: rebase onto `main` before asking if the branch has diverged.
Docs-only commits also redeploy; that is fine, the build takes under a minute.

To check a deploy by hand: `gh api repos/ahparikh/watchmakers-bench/commits/<sha>/check-runs`
shows the Cloudflare Pages status; the Cloudflare dashboard has the build log.
