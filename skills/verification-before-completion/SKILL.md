---
name: verification-before-completion
description: Use before claiming a task is done, fixed, shipped, or working. Requires running the relevant checks and showing evidence — never claim success without proof.
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command via `bash` (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Rules

- **Type checks verify *code correctness*, not *feature correctness*.** For UI or product behavior, you must also exercise the feature (run the actual command, endpoint, or UI flow), not just compile it.
- **If you cannot run something** (no env, no creds, sandbox), say so explicitly — "I could not verify X because Y" — rather than silently skipping it.
- **Never claim success on the basis of "the code looks right."** Looking right is not running.

## Output Template

```
✅ Verified:
- tests: <command> — <result>
- types: <command> — <result>
- repro: <how reproduced original bug, now fixed>

⚠️ Not verified:
- <thing> — <why> — <how user can verify>
```

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Key Patterns

**Tests:**
> ✅ `[Run test command]` — 34/34 pass — "All tests pass"
> ❌ "Should pass now" / "Looks correct"

**Regression tests (TDD Red-Green):**
> ✅ Write → Run → Revert fix → Run (MUST FAIL) → Restore → Run
> ❌ "I've written a regression test" without red-green verification

**Build:**
> ✅ `[Run build]` — exit 0 — "Build passes"
> ❌ "Linter passed" (linter doesn't check compilation)

**Requirements:**
> ✅ Re-read plan → Create checklist → Verify each → Report gaps
> ❌ "Tests pass, phase complete"

**Agent delegation:**
> ✅ Agent reports success → Check VCS diff → Verify changes
> ❌ Trusting agent report without verification

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Anti-patterns

- "This should work" without running it.
- Running tests, seeing failures, and not mentioning them.
- "All tests pass" when you only ran one file.

## Why This Matters

- Broken trust with collaborators
- Undefined functions shipped — would crash at runtime
- Missing requirements shipped — incomplete features
- Time wasted on false completion → redirect → rework

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to subagents

**Rule applies to:** Exact phrases, paraphrases, implications, or ANY communication suggesting completion or correctness.

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
