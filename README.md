# pi-superpowers

Process-discipline skills bundle for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent). 35 skills that enforce a structured workflow: brainstorm → explore → plan → review-gate → TDD → verify → finish.

Inspired by Claude Code's superpowers plugin, adapted for pi's extension/skill model.

## Install

```
pi install git:github.com/SilentMoebuta/pi-superpowers
```

## What's included

35 skills, in two categories:

### Methodology skills (18) — how to do the work

| Skill | When |
|---|---|
| `using-superpowers` | Bootstrap; loaded at session start, re-checked every turn in goal mode. |
| `brainstorming` | Vague requirements / new features / "what should we build". |
| `exploring-codebase` | Before modifying existing code or fixing bugs. |
| `using-git-worktrees` | Risky / long-running changes that should be isolated. |
| `writing-plans` | Multi-file or multi-step changes (produces `docs/plans/`). |
| `writing-skills` | Authoring or refining a pi skill. |
| `executing-plans` | Executing a written plan with checkpoints. |
| `subagent-driven-development` | Implementing a plan via role-based subagents. |
| `dispatching-parallel-agents` | 2+ independent subtasks. |
| `test-driven-development` | Adding testable behavior (RED-GREEN-REFACTOR). |
| `systematic-debugging` | Bugs, regressions, unexpected behavior. |
| `verification-before-completion` | Before claiming anything is done. |
| `requesting-code-review` | Completing tasks / before merge. |
| `receiving-code-review` | Processing review feedback. |
| `finishing-a-development-branch` | Merge / PR / cleanup decision. |

### Command skills (17) — slash commands

`/commit /log /status /changes /restart /wrapup /rollback /rules /staging /scaffold /nextsteps /brief /audit-structure /debt /dependencies /optimise /security /review`

## Usage

Skills auto-load by description matching. To force-load a specific skill: `/skill:<name>` (e.g. `/skill:writing-plans`).

In autonomous goal mode, `using-superpowers` is re-checked before every turn to enforce process discipline (no skipped HARD-GATEs).

## License

MIT
