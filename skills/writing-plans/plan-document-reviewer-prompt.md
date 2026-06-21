# Plan Document Reviewer Prompt

> Supporting prompt for the `writing-plans` skill. Dispatch a **reviewer**
> subagent to check a written plan is complete, matches the spec, and can be
> executed without the implementer getting stuck — *before* offering the user
> the execution choice.

## When to dispatch

After you have written the full plan (header, file structure, role/deps/wave
tags, every task with real code) and run your own inline self-review, but
*before* you present the "Subagent-Driven vs Inline Execution" handoff. The
reviewer catches the placeholders and type drift your author-eyes skipped.

## How to dispatch (pi)

Spawn the **reviewer** role. It is read-only (`read`, `bash`, `grep`, `find`,
`ls`) so it cannot alter the plan — only report. Pass the plan path, the spec
path, and this prompt as the `task`:

```
spawn_role:
  role: reviewer
  task: |
    You are a plan document reviewer. Verify this plan is complete and ready
    to hand to an implementer — not whether it is the perfect architecture.

    Plan to review: docs/superpowers/plans/YYYY-MM-DD-<feature>.md
    Spec for reference: docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md

    Read both with `read`, then check the plan against:

    | Category           | Flag if you find…                                                   |
    |--------------------|---------------------------------------------------------------------|
    | Placeholders       | "TBD", "TODO", "implement later", "add appropriate error handling"  |
    | Missing code       | a code step described in prose with no actual code block             |
    | Spec coverage      | a spec requirement with no task that implements it                  |
    | Scope creep        | a task that implements something the spec never asked for           |
    | Task granularity   | a step that is not 2-5 minutes of one action (too coarse to verify) |
    | Type consistency   | a name/signature used in a later task that differs from an earlier one |
    | DAG sanity         | steps editing the SAME file placed in the SAME parallel wave        |
    | Verification       | a task with no "run the test, expect PASS/FAIL" verification step   |

    Calibration — only flag issues that would make an implementer build the
    wrong thing or get stuck. Minor wording and stylistic preference are NOT
    issues. Approve unless there is a serious gap.

    Report via report_role_result with:
      findings: [
        { status: "Approved" | "Issues Found" },
        { issue: "Task N, Step M: <what> — <why it blocks implementation>" },
        ...
      ]
      artifacts: []
```

Foreground mode (`spawn_role` default) blocks until the reviewer calls
`report_role_result`, so you get the verdict inline.

## What to do with the result

- **Approved** → present the execution handoff (Subagent-Driven vs Inline).
- **Issues Found** → fix with `edit` and re-run your inline self-review. Re-dispatch
  the reviewer only for structural issues (missing tasks, type drift, DAG
  conflicts), not wording. Two agreeing passes is consensus.
- **Coverage gaps** are the highest-priority finding — a spec requirement with no
  task means an implementer will silently skip it. Add the task before anything else.

## Why a subagent, not a self-review

Your inline self-review answers "did I follow the format?" A fresh-context
reviewer answers "could a stranger execute this?" — and it will catch that your
Task 7 calls `clearLayers()` while Task 3 defined `clearFullLayers()`, which you
stopped seeing three edits ago. Run both; the reviewer is the second pair of eyes.

## Related

- `writing-plans` SKILL.md — "Self-Review" (the inline pass) and "Execution
  Handoff" (what runs after this reviewer approves).
- [spec-document-reviewer-prompt.md](../brainstorming/spec-document-reviewer-prompt.md)
  — the equivalent reviewer for the spec that `brainstorming` produced upstream.
