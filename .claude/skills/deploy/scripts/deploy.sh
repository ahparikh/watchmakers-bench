#!/usr/bin/env bash
# Deploy a branch of the Watchmaker's Bench to Cloudflare Pages.
#
#   deploy.sh <branch> [--as <remote-name>] [--promote]
#
# Preview (default): verify the branch tip in a throwaway worktree (npm ci, npm test,
# npm run build), push it to origin, wait for the Cloudflare build, confirm the preview
# URL serves that build.
# --promote: after the preview, fast-forward main to the same tip and confirm production.
#            Only with Akash's go-ahead; see SKILL.md.
# --as:      remote branch name when it differs from the local one (worktree-foo -> foo).
#
# Never force-pushes, never deletes remote branches, never touches any checkout's
# working tree. Exit 0 on success, non-zero with a reason otherwise.
set -euo pipefail

GH_REPO=ahparikh/watchmakers-bench
PROJECT=watchmakers-bench
PROD_URL="https://${PROJECT}.pages.dev"
BUILD_TIMEOUT=300   # seconds to wait for a Cloudflare build
SERVE_TIMEOUT=120   # seconds to wait for the URL to serve the new bundle

BRANCH=${1:-}; shift || true
AS=""; PROMOTE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --as) AS=$2; shift 2;;
    --promote) PROMOTE=1; shift;;
    *) echo "unknown argument: $1" >&2; exit 64;;
  esac
done
[ -n "$BRANCH" ] || { echo "usage: deploy.sh <branch> [--as <remote-name>] [--promote]" >&2; exit 64; }
AS=${AS:-$BRANCH}
[ "$AS" != "main" ] || { echo "push main through --promote on a branch, not as a branch name" >&2; exit 64; }

say() { printf '\n▸ %s\n' "$*"; }
ok()  { printf '  ✓ %s\n' "$*"; }
die() { printf '  ✗ %s\n' "$*" >&2; exit 1; }

# Subdomain Cloudflare derives from the branch name.
SUB=$(printf '%s' "$AS" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+//; s/-+$//')
PREVIEW_URL="https://${SUB}.${PROJECT}.pages.dev"

COMMON=$(git rev-parse --path-format=absolute --git-common-dir)
ROOT=$(dirname "$COMMON")
cd "$ROOT"

say "Resolving $BRANCH"
git fetch -q origin
SHA=$(git rev-parse --verify --quiet "${BRANCH}^{commit}") || die "no local commit named $BRANCH"
SHORT=${SHA:0:7}
ok "tip $SHORT: $(git log -1 --format=%s "$SHA")"

if git rev-parse --verify --quiet "origin/$AS" >/dev/null; then
  git merge-base --is-ancestor "origin/$AS" "$SHA" \
    || die "origin/$AS is not an ancestor of $SHORT: the branch was rewritten. A force push is Akash's call; ask him, or push under a new name with --as."
fi
if git merge-base --is-ancestor origin/main "$SHA"; then
  FF=1; ok "fast-forward of origin/main ($(git rev-list --count origin/main.."$SHA") commit(s) on top)"
else
  FF=0; echo "  · not a fast-forward of origin/main (base $(git merge-base origin/main "$SHA" | cut -c1-7)); fine for a preview, rebase before promoting"
fi
[ $PROMOTE -eq 0 ] || [ $FF -eq 1 ] || die "--promote needs a fast-forward of main. Rebase onto origin/main first."

say "Verifying $SHORT in a throwaway worktree"
TMP=$(mktemp -d "${TMPDIR:-/tmp}/bench-deploy.XXXXXX")
cleanup() { git worktree remove --force "$TMP" 2>/dev/null || rm -rf "$TMP"; }
trap cleanup EXIT
git worktree add -q --detach "$TMP" "$SHA"
( cd "$TMP"
  npm ci --silent --no-audit --no-fund
  npm test 2>&1 | grep -E "Tests |Test Files|FAIL|failed" || true
  npm test >/dev/null 2>&1 || exit 1
  npm run build >/dev/null 2>&1 || { npm run build 2>&1 | tail -20; exit 1; }
) || die "tests or build failed on $SHORT; fix the branch before deploying"
BUNDLE=$(grep -o 'assets/index-[^"]*\.js' "$TMP/dist/index.html" | head -1)
ok "npm test and npm run build pass; bundle $BUNDLE"
cleanup; trap - EXIT

say "Pushing $SHORT to origin/$AS"
git push -q origin "$SHA:refs/heads/$AS" 2>&1 | grep -v '^remote:' || true
[ "$(git ls-remote origin "refs/heads/$AS" | cut -f1)" = "$SHA" ] || die "push did not land (permission denied?). Ask Akash to run: git push origin $SHA:refs/heads/$AS"
ok "origin/$AS = $SHORT"

wait_build() { # $1 = sha
  local t=0 r
  while [ $t -lt $BUILD_TIMEOUT ]; do
    r=$(gh api "repos/$GH_REPO/commits/$1/check-runs" --jq '[.check_runs[]|select(.name=="Cloudflare Pages")|"\(.status)/\(.conclusion)"]|join(",")' 2>/dev/null || true)
    case "$r" in
      *completed/success*) return 0;;
      *completed/*) echo "  check runs: $r"; return 1;;
    esac
    sleep 10; t=$((t+10))
  done
  return 1
}
wait_serve() { # $1 = url
  local t=0 h
  while [ $t -lt $SERVE_TIMEOUT ]; do
    h=$(curl -sS "$1/?n=$RANDOM" 2>/dev/null | grep -o 'assets/index-[^"]*\.js' | head -1 || true)
    [ "$h" = "$BUNDLE" ] && return 0
    sleep 10; t=$((t+10))
  done
  echo "  serving $h, expected $BUNDLE"; return 1
}

say "Waiting for the Cloudflare preview build"
wait_build "$SHA" || die "Cloudflare build for $SHORT did not succeed. Log: https://dash.cloudflare.com → Workers & Pages → $PROJECT → Deployments"
wait_serve "$PREVIEW_URL" || die "$PREVIEW_URL is not serving $BUNDLE yet"
ok "$PREVIEW_URL serves $SHORT"

if [ $PROMOTE -eq 1 ]; then
  say "Promoting $SHORT to main"
  git push -q origin "$SHA:main" 2>&1 | grep -v '^remote:' || true
  [ "$(git ls-remote origin refs/heads/main | cut -f1)" = "$SHA" ] || die "push to main did not land (permission denied?). Ask Akash to run: git push origin $SHA:main"
  ok "origin/main = $SHORT"
  say "Waiting for the production build"
  sleep 20
  wait_serve "$PROD_URL" || { sleep 60; wait_serve "$PROD_URL" || die "$PROD_URL is not serving $BUNDLE yet; check the Cloudflare Deployments page"; }
  ok "$PROD_URL serves $SHORT"
fi

say "Done"
echo "  Commits in this deploy (relative to main before promotion):"
git log --format='    %h %s' "origin/main..$SHA" 2>/dev/null | head -20
[ $PROMOTE -eq 1 ] && echo "  Production: $PROD_URL ($SHORT)"
echo "  Preview:    $PREVIEW_URL ($SHORT)"
echo "  Now report to Akash: what changed, what is deployed (URL + commit), how to test it."
