---
name: writing-plans
description: Use before multi-step or multi-file changes. Produces a written, ordered plan with role assignments and dependency tags, enabling parallel subagent dispatch.
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `superpowers:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

If the `brainstorming` phase produced a research output file (e.g., `tech_research.md`), reference it in the **Architecture** or **Tech Stack** line. Library choices and architecture decisions should cite the research, not personal preference.

## Role Assignment

For each step, specify which agent type should execute it. This enables automatic role-based subagent selection during execution.

| Role | Has Write? | Has Web? | Use when the step involves... | Best Model |
|------|:---:|:---:|------|------|
| **coder** | Yes | No | Writing code, tests, docs, config files | Standard |
| **researcher** | Yes | Yes | Internet search, API doc lookup, data collection | Standard |
| **reviewer** | No | No | Code review, spec compliance, quality checks | Capable |
| **debugger** | Yes | No | Bug investigation, root cause analysis, applying fixes | Standard |
| **planner** | No | Yes | Design evaluation, architecture analysis | Capable |
| `Explore` | No | No | Quick file search, grep, structure mapping | Haiku (cheap) |
| `general-purpose` | Yes | No | General file modification, mixed tasks | Standard |

**Role selection rules:**
- Prefer specialized roles over general-purpose — they have focused context and clear quality bars
- For mechanical tasks (1-2 files, clear spec): use cheapest capable model
- For integration tasks (multi-file, coordination): use standard model
- For judgment tasks (architecture, review): use most capable model

## Dependency Tags & Parallel Waves

Each step has `deps: [N, M]` indicating which prior steps must complete first. Steps with empty deps `[]` can run in parallel.

**DAG topology:** The dependency graph forms a Directed Acyclic Graph. Steps are grouped into waves via topological sort:
- Wave 0: All steps with no dependencies → dispatch in parallel
- Wave 1: Steps that depend only on Wave 0 outputs → parallel after Wave 0
- Continue until all steps assigned

**Parallel safety rules:**
- Steps editing the SAME files MUST NOT be in the same wave (conflict risk)
- Steps that depend on each other's output MUST be in different waves
- Within a wave, all steps run concurrently via `run_in_background: true`

**Wave example:**
```
Wave 0 (parallel): [Step 1: Explore auth module] + [Step 3: Find call sites]
Wave 1 (after 0):  [Step 2: Design refactor]  (depends on 1,3)
Wave 2 (after 1):  [Step 4: Implement]        (depends on 2)
```

## Task Structure

````markdown
### Task N: [Component Name]
**Role:** coder | **Deps:** [N, M]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

**Reviewer subagent (fresh-eyes pass):** after your inline self-review, dispatch
a read-only `reviewer` subagent against the plan — it catches type drift and
missing spec coverage you stopped seeing three edits ago. Use the prompt in
[plan-document-reviewer-prompt.md](plan-document-reviewer-prompt.md). Fix any
"Issues Found" with `edit`; re-dispatch only for structural issues (missing
tasks, DAG conflicts), not wording. Two agreeing passes is consensus.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review
- The role tags and dependency annotations enable:
  1. Automatic role-based subagent selection (coder vs researcher vs reviewer)
  2. Wave-based parallel dispatch for independent steps
  3. Two-stage review (spec compliance → code quality) after each task

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Batch execution with checkpoints for review

## Red Flags — STOP

| Thought | Reality |
|---|---|
| "The plan is in my head, I'll write it as I go" | No written plan = no plan. Write it first. |
| "This step is obvious, I'll skip detailing it" | Vague steps become rabbit holes. Detail enough to act. |
| "I'll fill in the role/dependency later" | A plan with TBDs is not a plan. Resolve before execution. |
| "The plan is long enough, skip self-review" | Self-review catches placeholders + missing dependencies. Do it. |
| "I'll start executing while still writing the plan" | Writing + executing in parallel produces a plan that justifies the code. Finish, review, then execute. |

**Any of these mean: stop, complete/review the plan before proceeding.**
