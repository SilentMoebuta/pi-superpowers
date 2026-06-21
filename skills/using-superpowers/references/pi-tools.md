# Pi Tool Mapping

> Platform-neutrality reference for the `using-superpowers` skill. Skills speak
> in **actions** ("dispatch a subagent", "read a file", "run the tests") so the
> same prose works on any runtime. This file pins those actions to the **pi**
> tools they resolve to today, so skill authors don't drift back into naming a
> specific runtime's API by hand.

## Why this file exists

Two prior commits (`2691574` "migrate subagent tool syntax to spawn_role",
`b64ce86` "remove Claude-Code-isms") hand-fixed drift where skills had named
another runtime's tools directly. That's reactive. This reference is the
**structural** fix: keep tool names here, keep prose action-neutral, and a new
runtime or a renamed tool is a one-file edit instead of a repo-wide grep.

**Authoring rule:** in `SKILL.md` and supporting prose, write the *action*. Put
the concrete tool name in this file (or a sibling `references/<harness>-tools.md`).
When pi's tools change, update this file — not every skill.

## Core file/shell actions

| Action skills request | pi tool |
|-----------------------|---------|
| Read a file | `read` |
| Create / overwrite a file | `write` |
| Make a precise edit to an existing file | `edit` |
| Run a shell command | `bash` |
| Search file contents (regex) | `grep` |
| Find files by glob | `find` |
| List a directory | `ls` |

These are the pi core tools every session has. Use them by name in skill code
examples; in skill *prose* prefer the action ("read the file", "grep for the
symbol") so the line survives a tool rename.

## Subagents — the pi-roles tools

Pi core does not ship a subagent tool. The optional **pi-roles** package
provides the role-scoped subagent surface that `subagent-driven-development`,
`dispatching-parallel-agents`, and the reviewer prompts in this bundle assume.
If pi-roles is not installed, do **not** fabricate a `Task` or `subagent` call —
execute sequentially in the current session and say so.

| Action skills request | pi-roles tool |
|-----------------------|---------------|
| Spawn one role-scoped subagent (researcher, coder, reviewer, planner, debugger) and get its result | `spawn_role` — foreground blocks until the role calls `report_role_result`; returns `{status, result|error, agentId}` |
| Run a role in the background while you keep talking to the user | `spawn_role` with `mode: "background"`, then a later `spawn_role` join by `agentId` |
| Execute a whole DAG of roles in topological waves with parallelism per wave | `dag_execute` |
| Resume a DAG from a checkpoint after a crash/compact, skipping completed waves | `dag_resume` |
| A spawned role reports its structured result | `report_role_result` — the output-contract tool every role MUST call once before finishing; payload is `{findings, artifacts}` |

**Key facts to keep skills honest:**

- `spawn_role` returns the role's result **directly**. There is **no**
  `get_subagent_result` to call afterward (that name is from a retired API and
  is flagged by `scripts/validate-skills.ts`). The result is in the
  `report_role_result` payload the service extracts from the child session.
- Roles are **anti-cascade** by default: an executing role cannot itself spawn
  further subagents unless its frontmatter sets `canSpawn: true` (reserved for
  orchestrator roles). Don't write skills that assume nested spawning works.
- Depth is capped (`maxDepth`, default 5). When exhausted, `spawn_role` /
  `dag_execute` / `dag_resume` are stripped from the child's tool set rather
  than erroring at call time.

## Built-in roles

When a skill says "dispatch a coder" or "send this to a reviewer", these are the
pi-roles role names (each has a persona, tool whitelist, and model default):

| Role | Has write? | Has web? | Use for |
|------|:---:|:---:|---------|
| `coder` | yes | no | writing code, tests, docs, config |
| `researcher` | yes | yes | internet search, doc lookup, data collection |
| `reviewer` | no | no | code review, spec/plan compliance, quality checks (read-only — cannot edit) |
| `debugger` | yes | no | bug investigation, root-cause analysis, applying fixes |
| `planner` | no | yes | architecture analysis, trade-off evaluation (read-only) |

The reviewer prompts in this bundle ([spec-document-reviewer-prompt.md](../../brainstorming/spec-document-reviewer-prompt.md),
[plan-document-reviewer-prompt.md](../../writing-plans/plan-document-reviewer-prompt.md))
target the read-only `reviewer` role on purpose — a reviewer that can't edit can
only report, which is the contract.

## Skills

Pi discovers skills from configured skill directories and installed pi packages
(via the `pi.skills` manifest entry, which this repo sets to `./skills`). There
is no standalone `Skill` tool to invoke; to load a skill, `read` its `SKILL.md`
directly, or use `/skill:<name>` in interactive mode to force-load it. The
superpowers discipline is unchanged: when a skill applies, load and follow it
**before** responding.

## Task tracking

Pi core does not ship a todo/task-list tool. Track tasks in the plan document
itself (the checkbox `- [ ]` syntax `writing-plans` uses) or in a repo-local
`TODO.md`. Older or ported docs may mention `TodoWrite` — treat that as the
task-tracking action above, not a real pi tool.

## Extension author hooks (for reference, not for skill prose)

If you ever write a pi extension (not a skill) that needs to survive context
compaction or inject context every turn, the relevant pi extension surface is:

- **Events:** `session_start` (inject once at open), `session_compact`
  (re-inject *after* compaction summaries, so context survives),
  `agent_end` (turn end), `resources_discover` (advertise skills/resources),
  `before_provider_request` (last-chance tool/model shaping),
  `onTelemetry` (inert unless wired).
- **Tool context:** `ctx.modelRegistry` (resolve a role's model ref),
  `ctx.getContextUsage().tokens` (read context pressure),
  `ctx.compact({customInstructions})` (trigger compaction),
  `ctx.setActiveTools(...)` (additively enable tools per session).
- **Manifest:** `package.json` `pi.extensions` (an extension file) and
  `pi.skills` (a skills directory) — both are repo-owned, not pi-core edits.

Keep these out of skill prose. They belong here, where extension authors look,
so skills stay runtime-agnostic.

## When the mapping changes

If a tool is renamed or a new harness is added, edit **this file** (or add a
sibling `references/<harness>-tools.md`). Do **not** bake the new tool name into
skill prose, and do not delete the old name without grepping the skills for it.
The validator (`scripts/validate-skills.ts`) already flags retired tool names
like `get_subagent_result`; extend its `STALE_TOOLS` list when a name is retired.
