---
name: using-git-worktrees
description: Use when starting risky, experimental, or long-running changes that should be isolated from the main working tree. Sets up a git worktree so the user's primary checkout stays clean.
---

# Using Git Worktrees

Use when:

- The change is exploratory and may be discarded.
- The user is mid-work on another branch and you need a clean slate.
- You need to compare two branches side-by-side.
- A long-running refactor would otherwise block other work.

## Setup

From the repo root:

```bash
git worktree add ../<repo>-<feature> -b <branch-name>
```

This creates a sibling directory checked out to a new branch. The user's main checkout is untouched.

## Working in the worktree

- All git commands operate on the worktree's branch.
- Changes here do not affect the main checkout until merged.
- Build artifacts and `node_modules` live separately — you may need to install deps fresh.

## Cleanup

When done:

```bash
# Merge or PR first, then:
git worktree remove ../<repo>-<feature>
git branch -d <branch-name>   # if merged
```

## When NOT to use

- Single-file changes on the current branch.
- Tasks the user expects to land on the current branch directly.
- When the user has uncommitted changes you'd be hiding from.

## Red Flags — STOP

You are about to skip worktree isolation if you catch yourself thinking:

- "It's just one file, I'll edit in place." — single-file changes on the main branch still need isolation if they're risky.
- "The user is mid-work; I don't want to disturb them." — that's exactly when a worktree protects their checkout.
- "I'll branch but keep working in the main checkout." — a branch without a worktree still leaves uncommitted changes exposed.
- "I'll clean up the worktree later." — orphaned worktrees pile up; create with a plan to remove.
- "I'll just stash instead." — a stash is not an isolated workspace; you lose side-by-side comparison and can collide on reapply.
- "node_modules will rebuild, too slow." — a slow install is cheaper than corrupting the user's working tree.

**All of these mean: stop, create the worktree, then proceed.**

## Handoff

Pair with `writing-plans` for multi-step work in the worktree, and `verification-before-completion` before merging back.
