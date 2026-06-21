# Spec Document Reviewer Prompt

> Supporting prompt for the `brainstorming` skill. Dispatch a **reviewer**
> subagent to check a written spec is complete, consistent, and ready for
> `writing-plans` to turn into a plan — *before* the user reviews it.

## When to dispatch

After you have written the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
and run your own inline self-review, but *before* you hand it to the user for the
approval gate. The reviewer catches the gaps your author-eyes miss because you
wrote it.

## How to dispatch (pi)

Spawn the **reviewer** role. It is read-only (`read`, `bash`, `grep`, `find`,
`ls`) so it cannot edit the spec — it can only report. Pass the spec path and
this prompt as the `task`:

```
spawn_role:
  role: reviewer
  task: |
    You are a spec document reviewer. Verify this spec is complete and ready
    for implementation planning — not whether it is elegant.

    Spec to review: docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md

    Read it in full with `read`, then check:

    | Category        | Flag if you find…                                                  |
    |-----------------|--------------------------------------------------------------------|
    | Completeness    | "TBD", "TODO", placeholders, or sections left as stubs             |
    | Consistency     | sections that contradict each other (architecture vs. data flow)   |
    | Clarity         | a requirement two reasonable engineers would build differently      |
    | Scope           | multiple independent subsystems that belong in separate plans     |
    | YAGNI           | features nobody asked for, speculative generality                 |
    | Traceability    | a tech choice with no link back to a research finding              |

    Calibration — only flag issues that would cause a flawed PLAN or the wrong
    thing to get built. Minor wording, stylistic preference, and "this section
    is thinner than that one" are NOT issues. Approve unless there is a serious
    gap.

    Report via report_role_result with:
      findings: [
        { status: "Approved" | "Issues Found" },
        { issue: "<section>: <what> — <why it matters for planning>" },
        ...
      ]
      artifacts: []
```

Foreground mode (`spawn_role` default) blocks until the reviewer calls
`report_role_result`, so you get the verdict inline.

## What to do with the result

- **Approved** → proceed to the user approval gate.
- **Issues Found** → fix them with `edit`, re-run your inline self-review, and
  re-dispatch the reviewer only if the issues were structural (not if they were
  wording). Don't loop forever — two reviewer passes that agree is consensus.
- **Reviewer and you disagree** → trust the reviewer on completeness/consistency
  (it has fresh eyes); trust yourself on intent (you know what you meant).

## Why a subagent, not a self-review

Your inline self-review is fast and biased — you wrote the words, so you read
what you meant, not what's there. A fresh-context reviewer has no memory of your
intent and will flag the placeholder you stopped seeing on the third read. The
two together (fast biased pass, then slow fresh-eyes pass) catch more than
either alone.

## Related

- `brainstorming` SKILL.md — "Spec Self-Review" (the inline pass) and "User
  Review Gate" (what runs after this reviewer approves).
- [plan-document-reviewer-prompt.md](../writing-plans/plan-document-reviewer-prompt.md)
  — the equivalent reviewer for the plan that `writing-plans` produces next.
