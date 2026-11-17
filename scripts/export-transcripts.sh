#!/usr/bin/env bash
# Export this project's Claude Code sessions to docs/transcripts/ as HTML, using
# https://github.com/simonw/claude-code-transcripts, then redact what must not be public.
# Re-run any time; it overwrites the previous export. Requires uv (uvx).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
P="$HOME/.claude/projects/-Users-ahp--personal-code-websites-anthropic"
OUT=docs/transcripts
# name : session file. Add a line when a new session should be published.
SESSIONS=(
  "00-spike-first-start:$P/47027f50-bc89-4c27-99fe-5d3c683cf061.jsonl"
  "01-physics-and-spike:$P/991f649c-daad-4622-afa5-bbc7a37d0729.jsonl"
  "02-hosting:$P/f3d19341-3a08-4d56-83e0-a1c249a9433e.jsonl"
  "03-design:$P/f6f29c5d-5cfe-40e1-a154-c4e4e2310367.jsonl"
  "04-onboarding:$P/0c66f344-94eb-4271-acf3-ebb7f1098be8.jsonl"
  "05-launch-video:$P--claude-worktrees-brag-video/27352baa-3a67-4d70-8d19-0ea2f66c859f.jsonl"
  "06-code-review:$P/c49e7ff8-54f6-41ec-b4bc-73bf59af703b.jsonl"
  "07-design-doc:$P/5c547c74-4556-4b1a-ab76-52b9c6baf6b7.jsonl"
)
mkdir -p "$OUT"
for pair in "${SESSIONS[@]}"; do
  name="${pair%%:*}"; file="${pair#*:}"
  [ -f "$file" ] || { echo "missing: $file" >&2; exit 1; }
  rm -rf "$OUT/$name"
  uvx claude-code-transcripts json "$file" -o "$OUT/$name" --repo ahparikh/watchmakers-bench >/dev/null
  echo "exported $name ($(ls "$OUT/$name" | wc -l | tr -d ' ') files)"
done

# Redactions. The repo is public. Generic patterns live here; phrases that are themselves private
# live in a local file outside the repo, one regular expression per line.
PRIVATE="${TRANSCRIPT_REDACTIONS:-$HOME/.config/watchmakers-bench/redactions.txt}"
[ -f "$PRIVATE" ] || { echo "✗ missing private redaction list: $PRIVATE (refusing to export without it)" >&2; exit 1; }
python3 - "$OUT" "$PRIVATE" <<'PY'
import glob, re, sys
out, private = sys.argv[1], sys.argv[2]
phrases = [l.strip() for l in open(private, encoding="utf-8") if l.strip() and not l.startswith("#")]
email = re.compile(r"[A-Za-z0-9._%+-]+@(gmail|icloud|yahoo|outlook|hotmail|proton|protonmail)\.[a-z.]+")
# A private phrase takes its neighbourhood with it: up to 220 characters either side, never
# crossing a tag, so quoted snippets around the phrase go too.
window = re.compile(r"[^<>]{0,220}(?:" + "|".join(phrases) + r")[^<>]{0,220}") if phrases else None
n_email = n_priv = 0
for f in glob.glob(f"{out}/*/*.html"):
    s = open(f, encoding="utf-8").read()
    s, a = email.subn("[email redacted]", s)
    b = 0
    if window:
        prev = None
        while prev != s:  # repeat: a long private passage needs several overlapping windows
            prev = s
            s, k = window.subn("[redacted: private note about an unrelated project]", s)
            b += k
    if a or b:
        open(f, "w", encoding="utf-8").write(s)
    n_email += a; n_priv += b
print(f"redacted {n_email} email address(es), {n_priv} private passage(s)")

# Refuse to finish if anything sensitive is left.
bad = re.compile(r"@(gmail|icloud|yahoo|outlook|hotmail|proton|protonmail)\.|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-ant-[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----\s*[A-Za-z0-9+/]{40}" + ("|" + "|".join(phrases) if phrases else ""))
left = [f for f in glob.glob(f"{out}/*/*.html") if bad.search(open(f, encoding="utf-8").read())]
if left:
    print("✗ sensitive strings remain in: " + ", ".join(left), file=sys.stderr); sys.exit(1)
PY
echo "✓ export clean: $(du -sh "$OUT" | cut -f1) in $OUT"
