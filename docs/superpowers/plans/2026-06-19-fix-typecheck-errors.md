# Fix 33 Typecheck Errors Across pi-event-reminders and pi-hooks-system

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 33 existing `tsc --noEmit` errors (8 in pi-event-reminders, 25 in pi-hooks-system) so both repos typecheck clean with 0 errors and 0 test regressions. No logic changes, no new dependencies.

**Root causes:**
1. Both repos import `type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"` but don't have the pi package resolvable in their `node_modules` (unlike pi-agent-guard and pi-plan-execute-gate, which have it symlinked). `tsc --noEmit` in standalone repos can't resolve the module → 1 "Cannot find module" error + chain of `implicit any` on event/ctx params.
2. pi-hooks-system additionally has `"moduleResolution": "bundler"` without `"types": ["node"]` — `node:` prefixed imports (`node:test`, `node:assert/strict`, etc.) can't resolve → 16 test-file errors.

**Architecture:** Two independent fixes, both repos get a portable `pi-types.d.ts` that declares the pi module (committable, no node_modules hack). pi-hooks-system additionally adds `"types": ["node"]` to tsconfig. Zero logic changes — only tsconfig + new .d.ts files.

**Tech Stack:** TypeScript 6.0, `tsc --noEmit`, Node 22.

---

## Tasks

### Wave 1: pi-event-reminders (parallel with Wave 2)

| Step | Task | Role |
|------|------|------|
| 1.1 | Create `pi-types.d.ts` with `declare module "@earendil-works/pi-coding-agent"` declaring the two types used (`ExtensionAPI`, `ExtensionContext`) | coder |
| 1.2 | Verify: `tsc --noEmit` exits 0 (0 errors), `npm test` still 46 pass / 0 fail | coder |
| 1.3 | Commit + push to origin/main | coder |

### Wave 2: pi-hooks-system (parallel with Wave 1)

| Step | Task | Role |
|------|------|------|
| 2.1 | Edit `tsconfig.json`: add `"types": ["node"]` to compilerOptions — fixes `node:test`/`node:assert` resolution (brings 25 errors → ~9 chain errors from pi import) | coder |
| 2.2 | Create `pi-types.d.ts` with `declare module "@earendil-works/pi-coding-agent"` declaring the types — fixes remaining pi import + chain errors (brings 9 → 0) | coder |
| 2.3 | Verify: `tsc --noEmit` exits 0 (0 errors), `npm test` still 37 pass / 0 fail | coder |
| 2.4 | Commit + push to origin/main | coder |

### Verification (after both waves)

| Step | Task | Role |
|------|------|------|
| V.1 | Cross-check: both repos typecheck clean, tests pass, commits pushed | main agent |

---

**Files changed:** 1 new file + 0 modified per repo (event-reminders); 1 new file + 1 modified per repo (hooks-system).
**Estimated time:** 2-3 minutes total (parallel dispatch).
