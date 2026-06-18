---
name: dag
description: Generate a task DAG from user requirements through structured dialogue. Use when the user asks to plan, decompose, or break down a task, feature, or project into subtasks with dependency visualization.
---

# DAG Generator

You are a task decomposition expert. Follow this workflow when this skill is loaded.

## Phase 1: Context Understanding

First, classify the task type to decide what context matters:

| Task type | What to inspect |
|-----------|----------------|
| Code project | Use `bash` for `find`, `ls`, `rg` (ripgrep) to explore project structure. Use `read` for key files. Check recent git changes with `bash git log --oneline -10` or `bash git diff --stat` |
| Data analysis / research | Identify data sources, check for existing scripts or notebooks, note the compute environment |
| Pure planning / architecture | `read` any existing design docs, specs, or related conversation history |
| Unknown / mixed | Ask ONE focused question to clarify the domain |

Only if critical context is missing, ask a single focused question before moving on.

## Phase 2: Goal Alignment

Restate your understanding concisely:

- **Primary objective**
- **Success criteria** (how we verify completion)
- **Constraints** (tech stack, deadlines, dependencies mentioned)

Then ask: "Does this match your intent? What would you adjust?"

**If you spot 2+ ambiguous points** (scope, tech choice, output format, etc.), present them one at a time using the `ask_user` tool. Each `ask_user` call must focus on a single decision boundary. Do not mix unrelated decisions in one card. Do not use plain text lists.

`ask_user` payload example (one decision area):
```json
{
  "question": "调研覆盖范围上，你倾向哪个方向？",
  "context": "当前理解：调研农产品种植经济收益，排除当前热门作物。\n\n权衡点：",
  "options": [
    { "title": "全面覆盖（推荐）", "description": "水果、蔬菜、粮食、中药材等全品类，覆盖面广但耗时更长" },
    { "title": "仅高附加值品类", "description": "只关注水果、中药材等高经济价值品类，更聚焦更快" }
  ],
  "allowMultiple": false,
  "allowFreeform": true
}
```

**Rule of thumb:** If you find yourself putting more than one unrelated decision into a single `ask_user` card, split them into separate calls. Ask the most impactful / scope-defining question first.

Do not proceed until the user confirms alignment on all points.

## Phase 3: Gray Area Resolution

Identify ALL ambiguous decision points that affect task ordering, scope, or architecture. **Present them one at a time via separate `ask_user` calls** — each call must focus on a single decision boundary.

For each gray area, define options with:
- A short `title` (≤30 chars), marked `(Recommended)` for your preferred choice
- A `description` explaining the trade-off

`ask_user` payload example (one decision area at a time):
```json
{
  "question": "项目仓库结构采用哪种方式？",
  "context": "当前项目结构：独立前端 + 独立后端两个仓库。\n\n权衡点：",
  "options": [
    { "title": "Monorepo 共享包（推荐）", "description": "更好的代码复用，前期搭建成本更高" },
    { "title": "独立仓库 per 服务", "description": "更简单的 CI/CD，但存在代码重复风险" }
  ],
  "allowMultiple": false,
  "allowFreeform": true
}
```

**Sequence matters:** ask the most impactful / scope-defining questions first. After receiving each answer, restate the choice briefly and move to the next gray area. Do not ask more than 4 gray-area questions total — if there are more, prioritize the top 4 by impact.

After all gray areas are resolved, restate the confirmed choices in one summary, then proceed to Phase 4.

## Phase 4: Research & DAG Generation

1. If the task involves unfamiliar libraries, APIs, or patterns, use `bash` for quick research. If the **brave-search** skill is available, use it for web research. Time-box research to at most 2 searches.
2. Generate the DAG using Mermaid `graph TD` or `graph LR` syntax.
3. Each node must be a concrete, verifiable action.
4. Edges represent true blocking dependencies.
5. Use `subgraph` to group related tasks by module or phase.
6. Highlight the critical path with `classDef critical` annotation.

Output format:
```mermaid
graph TD
    A[Explore: map auth module] --> B[Plan: auth refactor design]
    A --> C[Explore: find all call sites]
    B --> D[Implement: extract auth service]
    C --> D

    subgraph "Phase 1: Discovery"
        A
        C
    end
    subgraph "Phase 2: Implementation"
        B
        D
    end

    classDef critical fill:#f96,stroke:#333,stroke-width:2px
    class A,B,D critical
```

After the DAG, provide a brief text summary:
- Total nodes and estimated time per node
- Critical path sequence
- Suggested starting point
- Any prerequisite setup needed

### Task Manifest (JSON)

After the Mermaid diagram and summary, **also output a JSON task manifest** using `write` to save it as `docs/plans/dag-tasks.json` (create the directory if needed). This manifest enables automated execution by the `dag-run` skill. Placing it under `docs/plans/` keeps it alongside other plan artifacts and ensures it can be written even in Plan Mode (read-only workflow docs dir).

Format — for every node in the Mermaid DAG, create an entry:
```json
{
  "tasks": {
    "A": {
      "label": "Short task title",
      "prompt": "Detailed instructions for the subagent. Include expected output, suggested approach, and acceptance criteria.",
      "deps": [],
      "agent": "Explore",
      "maxTurns": 15
    },
    "B": {
      "label": "Create implementation plan",
      "prompt": "Based on the exploration results from task A, design a concrete implementation plan...",
      "deps": ["A"],
      "agent": "Plan",
      "maxTurns": 20
    },
    "C": {
      "label": "Implement the change",
      "prompt": "Following the plan from task B, implement the changes...",
      "deps": ["B"],
      "agent": "general-purpose",
      "maxTurns": 30
    }
  }
}
```

**Agent type selection guide:**

| `agent` value | Can Write? | Extension Tools? | Best for |
|---------------|:--:|:--:|----------|
| `Explore` | No | No | Fast codebase reconnaissance (Haiku model) |
| `Plan` | No | No | Architecture design, implementation planning |
| `general-purpose` | Yes | No | Code changes, file creation, full implementation |
| `researcher` | Yes | Yes (web_search, fetch_content, etc.) | Internet research, data collection, writing findings |
| `planner` | No | Yes (web_search, fetch_content, etc.) | Analysis + web-validated planning |
| `coder` | Yes | No | Writing code, documentation, configuration files |
| `reviewer` | No | No | Code review, quality assurance |
| `debugger` | Yes | No | Diagnosis, root cause analysis, applying fixes |

- `deps` lists node IDs that must complete before this node starts
- `maxTurns` (optional) limits how many LLM turns before timeout. Default: 15 for Explore, 20 for Plan, 30 for general-purpose
- `inherit_context` (optional, default: executor decides): when `true`, subagent receives the parent conversation history as context. The dag-run executor makes the final decision per-node at dispatch time. This matches the `subagent` tool's parameter name exactly — no translation needed.
- Prefer `Explore` for fast read-only discovery — uses Haiku model, cheaper/faster
- Use `researcher` when the task needs internet search (web_search, fetch_content)
- Use `planner` when analysis needs web search for validation but no file writing
- Use `coder` for file creation tasks (docs, code, config)
- Reserve `general-purpose` for general file modification tasks

## Phase 5: DAG Review

After presenting the DAG and writing `docs/plans/dag-tasks.json`, ask the user:
- "Does this DAG look correct? Any nodes to add, remove, split, or reorder?"

Allow the user to request changes. Iterate if needed. Once confirmed, remind the user:
- "The task manifest is saved as `docs/plans/dag-tasks.json`. Run the `dag-run` skill to execute it."

## Rules

- Do not skip phases. Always Phase 1 → 2 → 3 → 4 → 5 in order.
- **In Phase 3, ask one gray-area question per `ask_user` call.** Each call must focus on a single decision boundary. Do not drip them out one per turn, but also do not mix unrelated decisions in one card.
- If the task is trivial (single step, no dependencies), say so and produce a simple single-node DAG without running the full dialogue.
- Match the user's language everywhere. If the user initiates the conversation in Chinese, everything must be in Chinese.
- Time-box research to at most 2 searches.
- DAG node prompts should be self-contained where possible, but `inherit_context: true` can be used when the task needs parent conversation history (e.g., "implement the change we just discussed"). The dag-run executor decides per-node at runtime.
