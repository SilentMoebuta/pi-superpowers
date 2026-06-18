---
name: dag-run
description: Execute a task DAG manifest (dag-tasks.json) by dispatching nodes as subagents. Use after the dag skill has produced a final task manifest.
---

# DAG Runner

You are a DAG execution engine. When this skill is loaded, read the task manifest and execute it using the `subagent` tool.

## Input

Read `docs/plans/dag-tasks.json` from the working directory. If it doesn't exist (also check the cwd root for `dag-tasks.json` as a legacy location), tell the user to run the `dag` skill first.

The manifest format:
```json
{
  "tasks": {
    "A": {
      "label": "Short task title",
      "prompt": "Detailed instructions for the subagent...",
      "deps": [],
      "agent": "Explore",
      "maxTurns": 15,
      "inherit_context": false
    },
    "B": {
      "label": "Another task",
      "prompt": "Read and analyze the output of task A, then...",
      "deps": ["A"],
      "agent": "Plan",
      "maxTurns": 20
    },
    "C": {
      "label": "Implement the change",
      "prompt": "Following the plan from B...",
      "deps": ["B"],
      "agent": "general-purpose",
      "maxTurns": 30,
      "inherit_context": true
    }
  }
}
```

- `inherit_context` (optional, default: `false`): when `true`, the subagent receives a snapshot of the parent conversation history. When omitted, the executor should decide based on the task nature. This matches the `subagent` tool's parameter name exactly — no translation needed.

## Process

1. **Topological sort**: compute execution waves.
   - Wave 0 = all nodes with empty `deps`
   - Wave 1 = nodes whose deps are all in previous waves
   - Repeat until all nodes assigned.

2. **Execute waves sequentially**. Within each wave, launch nodes in parallel using the `subagent` tool with `run_in_background: true`:

   ```
   For each node in wave 0:
     subagent({
       subagent_type: "<agent>",
       prompt: "<prompt>",
       description: "<label>",
       run_in_background: true,
       max_turns: <maxTurns>
     })
   ```

3. **Wait for wave**: use `get_subagent_result` to poll each background agent until all complete.

4. **Feed results forward**: when a node's prompt references output from a previous node (e.g., "Based on the exploration results from task A"), collect the completed subagent's output and include it in the dependent node's prompt.

5. **Repeat** for each subsequent wave.

6. **Summarize**: after all waves complete, report:
   - Which nodes succeeded / failed
   - Key outputs from each node
   - Any next steps

## Execution strategy

### Within a wave — parallel dispatch

Launch all nodes in a wave simultaneously as background subagents:

```
# Wave 0: two Explore tasks, no deps
subagent({ subagent_type: "Explore", prompt: "...", description: "Map auth module", run_in_background: true })
subagent({ subagent_type: "Explore", prompt: "...", description: "Find all call sites", run_in_background: true })
```

Then poll for results:
```
get_subagent_result({ agent_id: "<id-1>" })
get_subagent_result({ agent_id: "<id-2>" })
```

### Between waves — feed results

When wave N+1 depends on wave N's outputs, collect the completed results and weave them into the prompt:

```
# Wave 1 (depends on A and C from wave 0)
# Node B's prompt should include summaries from A and C
subagent({
  subagent_type: "Plan",
  prompt: "Task A found these auth files: <summary>. Task C found these call sites: <summary>. Now plan...",
  description: "Design auth refactor",
  run_in_background: false  # or true, depending on whether there are parallel siblings
})
```

### Sequential vs parallel

- Nodes in the same wave: always parallel (`run_in_background: true`)
- Single-node waves: foreground is fine (`run_in_background: false`), shows progress inline
- For waves with 1 node, foreground is simpler. For waves with 2+ nodes, background parallel is faster.

## Output format

After execution completes, provide a structured summary:

```
=== DAG Execution Summary ===

✓ A: Map auth module (Explore, 5 turns, 12.4k tokens)
   Found 8 auth-related files, 3 entry points

✓ C: Find all call sites (Explore, 3 turns, 8.1k tokens)
   Found 24 call sites across 12 files

✓ B: Design auth refactor (Plan, 8 turns, 18.2k tokens)
   Produced a 5-step implementation plan

✓ D: Implement auth service (general-purpose, 12 turns, 45.3k tokens)
   Created auth.ts, updated 6 files, all tests pass

Total: 4/4 succeeded, 84.0k tokens used
```

## Agent Types and Tool Availability

Subagent tool access is governed by **agent definitions** (`.md` files in `~/.pi/agent/agents/` or `.pi/agents/`). Each agent type has an explicit tool allowlist. The built-in agent types and their tool sets:

| Agent Type | Tools | Can Write? | Extension Tools? |
|-----------|-------|------------|------------------|
| `Explore` | read, bash, grep, find, ls | No | No |
| `Plan` | read, bash, grep, find, ls | No | No |
| `general-purpose` | read, bash, write, edit, grep, find, ls | Yes | No |
| `researcher` | read, bash, write, grep, find, ls, web_search, fetch_content, get_search_content, code_search | Yes | Yes |
| `planner` | read, bash, grep, find, ls, web_search, fetch_content, get_search_content | No | Yes |
| `coder` | read, bash, write, edit, grep, find, ls | Yes | No |
| `reviewer` | read, bash, grep, find, ls | No | No |
| `debugger` | read, bash, write, edit, grep, find, ls | Yes | No |

**IMPORTANT**: The default `Explore` and `Plan` agents CANNOT access extension-registered tools like `web_search` or `fetch_content`. When a DAG task needs web search or other extension tools, use `researcher` or `planner` (custom agents that include those tools in their allowlist).

## Context Inheritance

Each subagent has an `inherit_context` parameter that controls whether it sees the parent conversation history.

**Default: `false` (fresh context)** — the subagent only receives its own prompt.

**When `true`**: the subagent's prompt is prefixed with the full parent conversation formatted as:
```
# Parent Conversation Context
[User]: What was discussed earlier...
[Assistant]: Here's what we found...

---
# Your Task (below)
```

### Decision logic (executor determines per-node at runtime)

Use `inherit_context: true` when:
- The task needs to understand decisions or findings discussed in the parent session
- The task continues or refines work that was discussed conversationally
- The task's prompt alone does not provide enough context (e.g., "implement the change we discussed")

Keep `inherit_context: false` when:
- The task is self-contained with all information in its prompt
- The task reads input from files written by previous DAG nodes (file-based handoff is sufficient)
- Context window is tight and the parent history is large or irrelevant

**The executor decides `inherit_context` per-node at dispatch time**, based on the task's prompt and dependency structure. The manifest can pre-set it, but the default is executor discretion.

## Handling File Output from Read-Only Agents

If a task assigned to `Explore` or `Plan` needs to save output to a file, the orchestrator (dag-run) must:

1. Collect the agent's output from `get_subagent_result`
2. Use `write` to save it as a file before the next wave starts
3. Include a one-sentence note in the summary: "Saved <agent> output as <filename>"

This is especially important when downstream tasks depend on reading those files.

## Rules

- If `docs/plans/dag-tasks.json` (and legacy `dag-tasks.json`) is missing, tell the user and stop. Do not guess.
- Use the `subagent` tool from @gotgenes/pi-subagents. Do NOT spawn shell scripts or `pi -p` processes.
- Do not modify node prompts — use them exactly as written in the manifest.
- When feeding results from earlier waves to later nodes, summarize concisely (3-5 key points), don't paste raw output.
- If a node fails, report the error and ask the user whether to continue or abort.
- If the user interrupts mid-execution, report which nodes completed and which are pending.
- Respect the `maxTurns` field from the manifest. If absent, use sensible defaults: 15 for Explore, 20 for Plan, 30 for general-purpose.
- When DAG tasks need extension tools (web_search, fetch_content, etc.), ensure the dag-tasks.json uses an agent type that has those tools in its allowlist (researcher, planner).
