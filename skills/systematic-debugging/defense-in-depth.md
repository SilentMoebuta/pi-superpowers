# Defense in Depth

> Supporting technique for the `systematic-debugging` skill — apply in Phase 4
> (Implementation), *after* you have found and fixed the true root cause. It
> makes the same class of failure hard to repeat, not just absent this once.

## Why layer it

A single check at the point of failure is brittle. Different code paths bypass
it, refactors move it, mocks skip it, and the next person won't know it's
load-bearing. Validating at **every layer data crosses** makes the bug
structurally impossible instead of merely patched.

One fix says "we handled this bug." Layered validation says "this bug can't
happen here again."

## The four-layer loop: repro → isolate → fix → verify

Treat defense-in-depth as a small closed loop you run once per root cause:

1. **Reproduce** — Confirm you can trigger the failure on demand (Phase 1 of the
   skill). No repro, no confidence the layers work.
2. **Isolate** — Name the exact boundary where bad data entered (the root cause
   from [root-cause-tracing.md](root-cause-tracing.md)). List every other place
   that same shape of data is *received*.
3. **Fix** — Correct the value at its source.
4. **Verify** — Add a guard at each boundary, then prove each layer catches the
   failure when the layers above it are removed.

### The four layers

| Layer | Purpose | Catches |
|-------|---------|---------|
| **1. Entry / boundary** | Reject obviously invalid input at the API edge | Wrong types, empty strings, missing paths — before they travel |
| **2. Business logic** | Assert the operation's invariants hold | Values that pass type checks but break domain rules |
| **3. Environment guard** | Refuse dangerous ops by context | `git init` outside a temp dir in tests; writes to `src/` in CI |
| **4. Forensic logging** | Capture enough to debug the *next* time | Directory, cwd, env, and a stack trace *before* the op |

Layers are additive, not alternative — each one catches a case the others miss
(different paths skip layer 1; mocks skip layer 2; cross-platform edge cases need
layer 3; layer 4 is what tells you what happened when all three somehow let it through).

## Shape of a good guard

Fail **fast**, fail **loud**, fail **at the boundary**:

```ts
// Layer 1 — entry boundary. Reject early, with the offending value in the message.
function createProject(name: string, dir: string) {
  if (!dir || dir.trim() === '') {
    throw new Error(`createProject: dir must not be empty (got ${JSON.stringify(dir)})`);
  }
}
```

- The message names the **function** and prints the **bad value** — a bare
  `"invalid dir"` forces the next debugger to re-trace what you just traced.
- Guard at the *boundary* (where untrusted data arrives), not deep inside.

## Verify each layer independently

A layer you can't bypass-test is a layer you don't actually have. After wiring
the guards, prove they fire:

- Call the entry point with each invalid input → expect layer 1 to throw.
- Hand a type-valid but domain-invalid value to the business function → expect
  layer 2 to throw.
- Run the dangerous op in the guarded context → expect layer 3 to refuse.
- Check the log line appears *before* the op, with the stack.

If removing layer 1 still leaves the bug impossible, layer 1 was decorative —
keep it anyway (depth is the point), but be honest that layer 2 was load-bearing.

## When NOT to layer

- **Throwaway scripts.** A one-shot probe doesn't need guards; it needs to be
  deleted. Layering invites the script to live forever.
- **Hot paths where the guard costs more than the bug.** Validate once at the
  edge, not per iteration.
- **Pure formatting/output transforms** with no invalid input space to defend.

## Done when

The original repro now fails to reproduce *even if you delete the root-cause
fix* — because a downstream layer rejects the bad input on its own. That's the
definition of "structurally impossible."

## Related

- [root-cause-tracing.md](root-cause-tracing.md) — find the source first; this
  doc layers guards around it.
- [condition-based-waiting.md](condition-based-waiting.md) — a special case of
  defense-in-depth for timing: poll the condition, never sleep on a guess.
