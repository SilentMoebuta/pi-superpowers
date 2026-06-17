---
name: exploring-codebase
description: Use when modifying existing code, fixing bugs, or adding features to an existing project. Systematically understands codebase structure before making changes.
---

# Exploring Codebase

Before modifying any existing code, you MUST understand the codebase structure. Use a layered approach: structural overview first (codegraph), then targeted deep dives (grep/read).

## When to Use

- Adding a feature to an existing project
- Fixing a bug in existing code
- Refactoring or modifying existing modules
- Any task where you're NOT starting from scratch

**Skip only if:** the project was just scaffolded and has no existing code, or the task is purely creating new standalone files.

## Process

### Layer 1: Structural Overview (codegraph CLI)

Start with the `codegraph` CLI for fast structural understanding. These shell commands query the indexed symbol graph without reading every file:

```
codegraph explore   → Broad area exploration: entry points, related symbols, key code with source
codegraph files     → Indexed file tree — what exists and where
codegraph query     → Find symbols by name (add -k <kind> to filter)
codegraph node      → One symbol's signature, source, callers, callees
codegraph callers   → Who calls this function/module?
codegraph callees   → What does this function call?
codegraph impact    → What would break if I change this?
```

**Typical first queries (via bash):**
1. `codegraph files` — see the project layout
2. `codegraph query <relevant keywords>` — find relevant symbols
3. `codegraph explore <main entry point or module>` — understand the flow

### Layer 2: Targeted Deep Dives (grep/read)

`codegraph` shows the skeleton. Use traditional tools for the muscle:

- **grep** for text patterns, error messages, TODO markers, config keys, imports
- **read** for full file content when you need to understand implementation details
- **find** for files outside the codegraph index (configs, assets, data files)

**When to use grep over codegraph:**
- Searching for text constants or error message strings
- Finding all imports of a module
- Locating TODO/FIXME/HACK comments
- Pattern matching across the entire codebase (not just indexed code)

## Required Output

Before proceeding to `writing-plans`, document your understanding:

```
## Codebase Understanding

### Project Structure
- Entry points: [list]
- Key modules: [list with brief descriptions]
- External dependencies: [list]

### Relevant Code Areas
For each area affected by the task:
1. File paths + symbol names
2. Call chain (from → to)
3. What would break if changed (`codegraph impact`)

### Unknowns
- [things that need further investigation]
```

If the codegraph index is not initialized, run `codegraph init` first. If `codegraph` CLI is not installed, fall back to grep/find/read for a manual exploration.
