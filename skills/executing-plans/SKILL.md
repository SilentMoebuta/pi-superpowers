---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** pi has role-based subagent support via the pi-roles extension (`spawn_role` tool). If `spawn_role` is available, prefer `superpowers:subagent-driven-development` instead of this skill (it runs tasks in isolated sessions with role-based agents). This skill is the fallback for executing a plan in the current session without `spawn_role`.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: proceed to execute the plan's tasks, tracking progress against the plan's task list.

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Red Flags — STOP

| Thought | Reality |
|---|---|
| "The plan is clear, I'll start executing without reviewing it" | Un-reviewed plans have gaps + wrong dependencies. Review first. |
| "This step is small, I'll batch it with the next" | Each step is a checkpoint for a reason. Batch defeats review. |
| "The plan says verify, but it obviously works" | 'Obviously works' = didn't verify. Run the check. |
| "I'm blocked, I'll guess and move on" | Blocked = stop + escalate. Guessing produces wrong code. |
| "I'll skip the referenced skill, I know it" | Skills evolve. Load the current version. |
| "Verifications pass, I'm done" | Did you run ALL the plan's checks, not just the easy ones? |

**Any of these mean: stop, review the plan + your progress before continuing.**

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Ensures isolated workspace (creates one or verifies existing)
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
