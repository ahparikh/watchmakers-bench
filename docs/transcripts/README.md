# Claude Code transcripts

Every Claude Code session that built The Watchmaker's Bench, exported as HTML with
[claude-code-transcripts](https://github.com/simonw/claude-code-transcripts). Each folder has an
`index.html` (timeline of prompts and commits) and paginated `page-NNN.html` files. GitHub shows
HTML as source, so clone the repo and open an `index.html` in a browser to read one.

| Session | What it did | Dates |
| --- | --- | --- |
| [00-spike-first-start](00-spike-first-start/index.html) | First, short start on the brief before the session was restarted | Nov 1–2 |
| [01-physics-and-spike](01-physics-and-spike/index.html) | The main session: CLAUDE.md, the grill, the escapement spike, physics research, sim core, puzzles, adjustment visuals, coordination of the other lanes | Nov 1–16 |
| [02-hosting](02-hosting/index.html) | GitHub repo, Cloudflare Pages, the deploy skill | Nov 2–16 |
| [03-design](03-design/index.html) | Technical-drawing design pass, speed slider, three-column layout | Nov 3–16 |
| [04-onboarding](04-onboarding/index.html) | First-run guide, trace explainer, hints, beginner puzzle copy | Nov 3–16 |
| [05-launch-video](05-launch-video/index.html) | Launch video built with the brag skill | Nov 14–16 |
| [06-code-review](06-code-review/index.html) | Deep-dive code review (snapshot; session still running at export) | Nov 16 |
| [07-design-doc](07-design-doc/index.html) | Design rationale doc and video outline (snapshot; session still running at export) | Nov 16 |

Exported 2026-11-16. Sessions 01, 06 and 07 were still live, so their transcripts end at the
moment of export. Re-run `scripts/export-transcripts.sh` for a later snapshot.

**Redactions.** The repo is public, so the export script replaces personal email addresses and
a few passages from a private note about an unrelated project that one session printed. Nothing
else was removed. The script refuses to finish if any of those, or anything shaped like an
access token, remains.
