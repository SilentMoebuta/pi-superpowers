---
name: using-superpowers
description: "Bootstrap skill for the pi-superpowers bundle. Always relevant — read at the start of every session, before every action during active /goal execution, and before responding to any non-trivial request, to decide which phase you're in and whether another skill in this bundle applies. In goal mode, re-check before every turn — you are NOT exempt from process discipline just because the task is small."
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST load and follow it.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

Load relevant skills BEFORE any response or action — even a clarifying question. If even a 1% chance a skill applies, load it to check. Announce briefly which skill you are using and why.

If a skill clearly does not fit, proceed without it — but make that a deliberate decision, not a default.

## Red Flags

These thoughts mean STOP — you are rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Load it. |

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

In pi, skills auto-load based on description matching. You can `read` the SKILL.md file directly to load it, or use `/skill:name` to force-load a specific skill. Announce which skill you are loading and why.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Do not adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## Complete Workflow

When building or modifying anything, follow these phases in sequence:

| Phase | Skill | What Happens |
|-------|-------|--------------|
| 1. Requirements | `brainstorming` | Clarify intent, research existing solutions, sketch approaches, pick direction |
| 2. Code Understanding | `exploring-codebase` | Existing project — codegraph for structure, grep/read for details |
| 3. Workspace Setup | `using-git-worktrees` | Create isolated branch and worktree |
| 4. Plan | `writing-plans` | Produce combined spec+plan document (architecture + implementation steps with roles/deps/waves) → **save to `docs/superpowers/plans/`** |
| | | 🛑 **HUMAN APPROVAL GATE** — do not proceed until user confirms the plan |
| 5. Implementation | `subagent-driven-development` | Role-based subagents, parallel waves, two-stage review |
| 6. Testing | `test-driven-development` | RED-GREEN-REFACTOR during implementation |
| 7. Review | `requesting-code-review` | Structured review report → `docs/reviews/` |
| 8. Completion | `finishing-a-development-branch` | Verify tests, merge/PR, clean up |

**Cross-cutting skills** (triggered by situation, not phase):

| Situation | Skill |
|-----------|-------|
| Bug or unexpected behavior | `systematic-debugging` |
| 2+ independent subtasks | `dispatching-parallel-agents` |
| Before claiming "done" | `verification-before-completion` |
| Receiving review feedback | `receiving-code-review` |
| Batch execution with checkpoints | `executing-plans` |

## Skill Priority

When multiple skills could apply, follow this order:

1. **Process skills first** — `brainstorming`, `exploring-codebase`, `using-git-worktrees`, `writing-plans`. These determine HOW to approach the task, in this exact order.
2. **Execution skills second** — `subagent-driven-development`, `test-driven-development`, `dispatching-parallel-agents`, `executing-plans`.
3. **Review and closing skills last** — `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`.

## Common Triggers

| User says / situation | Skill to apply |
|---|---|
| "Build / add / design X" with fuzzy requirements | `brainstorming` |
| Modify existing code / fix bug in existing project | `exploring-codebase` |
| After design approval, before touching code | `using-git-worktrees` |
| Multi-file or multi-step change | `writing-plans` |
| Executing an implementation plan | `subagent-driven-development` |
| Adding testable behavior | `test-driven-development` |
| "It's broken", "X isn't working" | `systematic-debugging` |
| 2+ independent tasks queued up | `dispatching-parallel-agents` |
| Completing a task, before merge | `requesting-code-review` |
| Receiving code review feedback | `receiving-code-review` |
| All tasks complete, ready to merge | `finishing-a-development-branch` |
| About to say "done" / "fixed" / "shipped" | `verification-before-completion` |
| Batch execution with checkpoints (parallel session) | `executing-plans` |

## Available Specialized Agent Types

When dispatching subagents (via `subagent-driven-development` or `dispatching-parallel-agents`), use role-specific agents:

| Agent | Tools | Best For |
|-------|-------|----------|
| **coder** | read, bash, write, edit, grep, find, ls | Writing code, tests, docs, config |
| **researcher** | read, bash, write, grep, find, ls, web_search, fetch_content, get_search_content, code_search | Internet research, data collection |
| **reviewer** | read, bash, grep, find, ls | Code review, quality checks |
| **debugger** | read, bash, write, edit, grep, find, ls | Bug investigation, root cause analysis |
| **planner** | read, bash, grep, find, ls, web_search, fetch_content, get_search_content | Architecture design, trade-off analysis |
| `Explore` | read, bash, grep, find, ls | Fast codebase recon (Haiku, cheap) |
| `Plan` | read, bash, grep, find, ls | Implementation planning (read-only) |
| `general-purpose` | read, bash, write, edit, grep, find, ls | General file modification |

**Key rules:**
- Use **researcher** when a task needs internet search (web_search tool)
- Use **coder** for implementation (has write/edit)
- Use **reviewer** for code review (structured reports)
- Use **debugger** for bug investigation (has write for fixes)
- Explore/Plan are read-only — if a task needs to write files, use coder or general-purpose

## Workflow Artifact Directories

All workflow outputs are saved under `docs/` with a date-prefixed naming convention:

| Directory | Produced By | Contains | Human Approval Required? |
|-----------|------------|----------|:--:|
| `docs/research/` | brainstorming (researcher subagent) | Technology research, library comparisons, API surveys | No |
| `docs/superpowers/plans/` | writing-plans | Combined spec+plan: architecture, tech choices, implementation steps with role/deps/wave | Yes |
| `docs/reviews/` | subagent-driven-development (reviewer) | Structured code review reports | No |
| `docs/specs/` | (optional, complex projects only) | Standalone design specs when plan would be too large | No |

**Naming convention:** `YYYY-MM-DD-<topic>-<type>.md`
Example: `docs/superpowers/plans/2026-06-16-kdj-scanner-plan.md`

**Update vs create rule:**
- **Same topic, same session iteration** → **update in place**. The latest version is the only truth.
- **Same topic, new session** → **update in place** too — archive the old by renaming only if you need a historical record.
- **New topic** → **new file** with new date and topic.
- **Explicit user request to archive** → rename old file with `-archive` suffix before creating new.

Create the relevant directories before saving files.
