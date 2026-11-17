// After `vite build`: copy docs/transcripts into dist/transcripts so the site serves them at
// /transcripts/, with a small landing page built from the folders that exist.
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const src = "docs/transcripts", out = "dist/transcripts";
if (!existsSync(src)) { console.log("no docs/transcripts; skipping"); process.exit(0); }
cpSync(src, out, { recursive: true, filter: (p) => !p.endsWith("README.md") });

// Descriptions come from the README table, so there is one source of truth.
const readme = readFileSync(join(src, "README.md"), "utf8");
const rows = [...readme.matchAll(/^\| \[([^\]]+)\]\(([^)]+)\) \| (.+?) \| (.+?) \|$/gm)].map((m) => ({ name: m[1], href: m[2], what: m[3], dates: m[4] }));
const known = new Set(rows.map((r) => r.name));
for (const d of readdirSync(src)) if (statSync(join(src, d)).isDirectory() && !known.has(d)) rows.push({ name: d, href: `${d}/index.html`, what: "", dates: "" });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
writeFileSync(join(out, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Transcripts · The Watchmaker's Bench</title>
<style>
  body { margin: 0; background: #f4f2ec; color: #1c2733; font: 16px/1.5 "Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif }
  main { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1rem 4rem }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem } p { color: #4a5663; margin: .25rem 0 1.5rem }
  a { color: #2b5c8a } ol { list-style: none; padding: 0; margin: 0; border-top: 1px solid #1c2733 }
  li { padding: .85rem 0; border-bottom: 1px solid #d8d4ca; display: grid; grid-template-columns: 1fr auto; gap: .25rem 1rem }
  li a { font-weight: 600; text-decoration: none } li a:hover { text-decoration: underline }
  .what { grid-column: 1 / -1; color: #4a5663; font-size: .95rem } .dates { color: #8d97a0; font-size: .9rem; white-space: nowrap }
</style></head><body><main>
<h1>Claude Code transcripts</h1>
<p>Every Claude Code session that built <a href="/">The Watchmaker's Bench</a>, exported with
<a href="https://github.com/simonw/claude-code-transcripts">claude-code-transcripts</a>. Personal email addresses and a few passages from a private note about an unrelated project are redacted; nothing else was removed.</p>
<ol>
${rows.map((r) => `<li><a href="${r.href}">${esc(r.name)}</a><span class="dates">${esc(r.dates)}</span><span class="what">${esc(r.what)}</span></li>`).join("\n")}
</ol></main></body></html>
`);
console.log(`published ${rows.length} transcripts to ${out}/`);
