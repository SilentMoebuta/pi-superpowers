---
name: dispatching-parallel-agents
description: Use when the task contains 2+ independent sub-tasks that don't depend on each other's outputs. Run them concurrently to save wall-clock time. Can use role-based agents for specialized work.
---

# Dispatching Parallel Agents

## Overview

You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

When you have multiple unrelated failures (different test files, different subsystems, different bugs), investigating them sequentially wastes time. Each investigation is independent and can happen in parallel.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently.

## When to Use

**Use when:**
- Reading multiple unrelated files for context.
- Running independent web searches or research queries.
- Investigating two or more unrelated bugs.
- Fetching data from multiple sources.
- Multiple independent implementation tasks from a plan.
- 3+ test files failing with different root causes.
- Multiple subsystems broken independently.
- Each problem can be understood without context from others.
- No shared state between investigations.

## When it does NOT apply

- **Sequential dependencies:** One task requires another's output first (e.g., "migrate schema, then update API").
- **Related failures:** Fixing one might fix others — investigate together first.
- **Tasks editing the same files:** Agents would conflict on writes.
- **Need full system context:** Understanding requires seeing the entire system.
- **Exploratory debugging:** You don't know what's broken yet — figure out the shape first.
- **Shared state:** Agents would interfere (editing same files, using same resources).

## Agent Roles for Parallel Tasks

Choosing the right role per parallel task maximizes quality and minimizes cost:

| Agent Role | Has Write? | Has Web? | Best For Parallel... |
|-----------|:---:|:---:|------|
| **researcher** | Yes | Yes | Multiple independent web searches or data fetches — each gets isolated context and runs concurrently |
| **coder** | Yes | No | Multiple independent implementation tasks from a plan — each coder works on different files |
| **debugger** | Yes | No | Investigating multiple unrelated bugs simultaneously |
| **reviewer** | No | No | Reviewing multiple independent code changes in parallel |
| `Explore` | No | No | Fast parallel reconnaissance of multiple code areas — cheapest option |

**Role selection for parallel dispatch:**
- Same role type across all parallel tasks usually works best (e.g., 3 researchers, 3 coders)
- Mix roles when tasks require different capabilities (e.g., 1 researcher + 2 coders)
- Don't use general-purpose when specialized roles exist — they have better tool allowlists

## Wave-Based Parallel Dispatch

Group tasks into waves via topological sort of the dependency graph:

**Wave determination:**
- Wave 0: All tasks with empty deps — no task depends on another's output
- Wave 1: Tasks whose deps are ALL in previous waves
- Wave N: Continue until all tasks assigned

**Dispatch pattern (Wave 0, 3 independent tasks):**

Today `spawn_role` runs in the **foreground** and blocks until the role reports back via `report_role_result` (the result is returned directly, no separate polling call). So wave dispatch is currently **sequential** — dispatch one role, collect its result, then dispatch the next:

```
# Dispatch sequentially (foreground blocks until each role reports back)
r1 = spawn_role({ role: "researcher", task: "Search for...", mode: "foreground" })
r2 = spawn_role({ role: "coder",     task: "Implement...", mode: "foreground" })
r3 = spawn_role({ role: "debugger",  task: "Investigate...", mode: "foreground" })

# Each spawn_role returns {status, result|error, agentId} directly — no get_subagent_result needed
```

**Future work (Phase 5):** true parallel/background dispatch. Once `spawn_role({..., mode: "background"})` is supported, dispatch all tasks in a wave up front and collect results afterward — restoring concurrent execution. Until then, sequential foreground dispatch still satisfies the wave contract (independent tasks, no shared state); you just lose wall-clock parallelism.

**Cost/timing analysis:**
- Wall-clock time = longest single task in the wave, NOT sum of all tasks
- Token cost = sum of all tasks (parallel doesn't save tokens, it saves time)
- Best ROI: parallelize long-running independent tasks (research, complex implementations)
- Worst ROI: parallelize trivial tasks (dispatch overhead > task time)

**Review and integrate (after wave completes):**
1. Read each summary — understand what changed
2. Verify fixes don't conflict — did agents edit same code?
3. Run full suite — verify all fixes work together
4. Integrate all changes

## When NOT to Parallelize — Decision Tree

Ask these questions before dispatching in parallel:

```
1. Are tasks truly independent?
   ├─ Yes → 2
   └─ No → Run sequentially

2. Do tasks edit different files?
   ├─ Yes → 3
   └─ No → Run sequentially (merge conflict risk)

3. Is each task substantial enough?
   ├─ Yes (longer than dispatch overhead) → 4
   └─ No (trivial, <5 sec each) → Batch into one agent

4. Do you need to review results before the next task?
   ├─ Yes → Sequential (review-driven workflow)
   └─ No → Dispatch in parallel ✓
```

**Red flags that signal "don't parallelize":**
- Tasks share a code path or data structure — fix one, re-evaluate all
- One failure means all tasks need re-evaluation
- You need to understand the "why" of Task A before starting Task B
- The parallel tasks would all produce findings you'd need to reconcile simultaneously

## Agent Prompt Structure

Good agent prompts are:
1. **Focused** — One clear problem domain
2. **Self-contained** — All context needed to understand the problem
3. **Specific about output** — What should the agent return?

```markdown
Fix the 3 failing tests in src/agents/agent-tool-abort.test.ts:

1. "should abort tool with partial output capture" - expects 'interrupted at' in message
2. "should handle mixed completed and aborted tools" - fast tool aborted instead of completed
3. "should properly track pendingToolCount" - expects 3 results but gets 0

These are timing/race condition issues. Your task:

1. Read the test file and understand what each test verifies
2. Identify root cause - timing issues or actual bugs?
3. Fix by:
   - Replacing arbitrary timeouts with event-based waiting
   - Fixing bugs in abort implementation if found
   - Adjusting test expectations if testing changed behavior

Do NOT just increase timeouts - find the real issue.

Return: Summary of what you found and what you fixed.
```

## Common Mistakes

**Too broad:** "Fix all the tests" — agent gets lost
**Specific:** "Fix agent-tool-abort.test.ts" — focused scope

**No context:** "Fix the race condition" — agent doesn't know where
**Context:** Paste the error messages and test names

**No constraints:** Agent might refactor everything
**Constraints:** "Do NOT change production code" or "Fix tests only"

**Vague output:** "Fix it" — you don't know what changed
**Specific:** "Return summary of root cause and changes"

## Anti-patterns

- Parallelizing writes to the same file (conflict).
- "Parallel" calls where call N needs output of call N-1.
- Using a generic agent when a specialized role would be better.
- Forcing parallelism on a naturally sequential task.

## Key Benefits

1. **Parallelization** — Multiple investigations happen simultaneously
2. **Focus** — Each agent has narrow scope, less context to track
3. **Independence** — Agents don't interfere with each other
4. **Speed** — N problems solved in time of 1
5. **Role specialization** — Each task gets the right tools (web, write, etc.)
6. **Cost efficiency** — Fast agents (Explore/Haiku) for simple recon, full agents for complex work

## Real Example

**Scenario:** 6 test failures across 3 files after major refactoring.

**Failures:**
- `agent-tool-abort.test.ts`: 3 failures (timing issues)
- `batch-completion-behavior.test.ts`: 2 failures (tools not executing)
- `tool-approval-race-conditions.test.ts`: 1 failure (execution count = 0)

**Decision:** Independent domains — abort logic is separate from batch completion, separate from race conditions.

**Dispatch:**
```
Agent 1 (debugger) → Fix agent-tool-abort.test.ts
Agent 2 (debugger) → Fix batch-completion-behavior.test.ts
Agent 3 (debugger) → Fix tool-approval-race-conditions.test.ts
```

**Results:**
- Agent 1: Replaced timeouts with event-based waiting
- Agent 2: Fixed event structure bug (threadId in wrong place)
- Agent 3: Added wait for async tool execution to complete

**Integration:** All fixes independent, no conflicts, full suite green. Three problems solved in parallel instead of sequentially.

## Verification

After agents return:
1. **Review each summary** — Understand what changed
2. **Check for conflicts** — Did agents edit same code?
3. **Run full suite** — Verify all fixes work together
4. **Spot check** — Agents can make systematic errors
