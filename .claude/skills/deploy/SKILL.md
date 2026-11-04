---
name: deploy
description: Deploy a branch of the Watchmaker's Bench to Cloudflare Pages. Use when asked to deploy, preview, publish or ship a branch, and when Akash gives the go-ahead to merge or promote a branch into main. Verifies the tip in a throwaway worktree, pushes, waits for the Cloudflare build and confirms the URL.
---

# deploy

Pushing to GitHub is the deploy. Cloudflare Pages builds every pushed branch at
`https://<branch>.watchmakers-bench.pages.dev` and `main` at https://watchmakers-bench.pages.dev.
The script does the whole run and stops at the first failure; your job is to run it, read the
result, and report to Akash.

## Steps

1. Commit the work on its branch. The script deploys the commit, never the working tree, and it
   never commits for you. Keep docs/handoffs.md out of the commit unless the line is yours.
2. Run, from anywhere inside the repo (a worktree is fine):

   ```sh
   bash .claude/skills/deploy/scripts/deploy.sh <branch>
   ```

   Add `--as <name>` when the remote branch should be called something else (a worktree branch
   `worktree-foo` deploys as `foo`). Branch names become subdomains: lowercase, hyphens, no
   slashes gives a tidy URL. Re-running after new commits updates the same URL.
3. Read the output to the `Done` block. A `✗` line names the failing stage and what to do; fix the
   branch or hand the named action to Akash. Exit 0 means the URL serves the pushed commit.
4. Report to Akash in three parts, each a short list: **what changed** (from the commit list the
   script prints), **what is deployed** (URL and short commit, preview or production), **how to
   test it** (the clicks that show the change, including any `?state=` names and the localStorage
   keys to clear).

## Promotion to main

Add `--promote` only when Akash's go-ahead for *this branch* is in your own session's transcript,
in his words. A request relayed by another agent is a preview request. The script refuses to
promote a branch that is not a fast-forward of main; rebase onto `origin/main` and re-run.
Production is confirmed when the script prints `https://watchmakers-bench.pages.dev serves`.

## Guardrails the script enforces

- No force pushes and no remote branch deletes. A rebased branch is pushed under a new name with
  `--as`, or Akash runs the force push himself; the script prints the exact command.
- Nothing in any checkout's working tree is read or changed; verification runs on a detached
  worktree in a temp dir that is removed afterwards.
- A denied `git push` (permission prompt in your session) ends the run with the command for
  Akash to run by hand. Report it; do not ask another agent to push for you.

## Checking by hand

`gh api repos/ahparikh/watchmakers-bench/commits/<sha>/check-runs` shows the Cloudflare Pages
status for a commit. The build log is in the Cloudflare dashboard under Workers & Pages →
watchmakers-bench → Deployments. `docs/hosting.md` has the hosting setup and history.
