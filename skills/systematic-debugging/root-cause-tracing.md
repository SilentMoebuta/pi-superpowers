# Root Cause Tracing

> Supporting technique for the `systematic-debugging` skill — apply inside Phase 1
> (Root Cause Investigation). A bug's *appearance* is almost never its *source*.

## When to reach for this

- The error fires deep in a call stack, far from the entry point.
- You can see *what* went wrong but not *why* the bad value got there.
- The same symptom shows up from several call sites.
- A fix "at the error line" keeps coming back or moves the bug sideways.

**Core principle:** walk the cause backward one hop at a time until you reach the
moment correct data turned into incorrect data. That boundary is the root cause.
Fix there — never at the symptom.

## Three ways to walk the chain

### 1. Five-Whys (cheap, no instrumentation)

Ask "why?" five times in a row, each answer becoming the next question. Write it
down so you can't hand-wave a hop:

```
1. Build failed.                            → Why? "Cannot find module './config'"
2. Module missing.                          → Why? config.ts was never written
3. Never written.                           → Why? the generate step was skipped
4. Generate skipped.                        → Why? the guard `if (env==='prod')` returned early
5. Guard returned early in dev.             → Why? env defaulted to 'prod' in .env.local  ← ROOT
```

Stop as soon as a hop lands on a *decision* you can change (a default, a guard, a
passed value). Five is a ceiling, not a quota — two sharp hops beat five fuzzy ones.

### 2. Hypothesis narrowing (one variable at a time)

Turn each candidate cause into a single falsifiable claim and kill them off:

1. List every input that *could* be bad (args, env, config, file contents, prior state).
2. Pick the **most likely** one. State it as a hypothesis: *"I think `dir` is empty
   because the caller never set it."*
3. Prove or disprove it with the **smallest possible probe** — one `read`, one
   `bash` echo, one `console.error` — not a fix.
4. Disproven → cross it off, move to the next. Proven → trace *that* value one hop up.

Never test two hypotheses at once. If you do, a pass proves nothing and a fail
blames the wrong one.

### 3. Bisect (when you can't see the cause, only the symptom)

When a regression appeared and you don't know where, binary-search history:

```bash
# Find the first bad commit. <good> is a known-working SHA, <bad> is HEAD.
git bisect start
git bisect bad HEAD
git bisect good <good-sha>
# pi runs the test command at each step; git moves you to the midpoint.
npm test            # pass → `git bisect good` ; fail → `git bisect bad`
git bisect reset    # back to your branch when done
```

The same shape applies inside a single run: disable half the steps, run, keep the
half that still fails, repeat. ~log₂(steps) probes instead of linear thrashing.

## Tracing with pi tools

| Need | Tool |
|------|------|
| Read the value being passed | `read` the calling file, or `bash` with `node -e`/`python -c` |
| Add a one-line probe at the boundary | `edit` (insert a `console.error`/`print` *before* the dangerous op) |
| Find every caller of a symbol | `grep` for the name; `find` to locate files |
| See what changed recently | `bash` `git log -p -- <path>` / `git diff <sha>` |
| Which test pollutes state | bisect the suite (script below) |

**Capture the stack, not just the value.** Log `new Error().stack` (JS) or a
traceback *before* the operation fails — after it throws, the interesting frame
is gone. Use `bash` to `grep` the probe output out of the run:

```bash
npm test 2>&1 | grep 'TRACE'
```

## Anti-patterns

- **Fixing where it throws.** The throw site is the symptom; the bad input
  arrived from upstream. Patching here just relocates the bug.
- **"It's probably X" without a probe.** A guess is a hypothesis you haven't
  falsified. One `bash` echo settles it.
- **Testing two fixes together.** If it passes you can't credit either; if it
  fails you can't blame either. One variable.
- **Stopping at "I found it."** If you can trace one more hop up, you haven't
  reached the source yet — you've reached a relay.

## Done when

You can point at a single line where *correct* data became *incorrect* data, and
a fix there (not downstream) makes the symptom disappear for good. Then hand off
to [defense-in-depth.md](defense-in-depth.md) to keep it from coming back.
