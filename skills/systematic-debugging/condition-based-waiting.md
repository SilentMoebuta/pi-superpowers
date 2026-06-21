# Condition-Based Waiting

> Supporting technique for the `systematic-debugging` skill — the special case
> of defense-in-depth applied to **timing**. Reach for it whenever a test or
> script reaches for `sleep`, `setTimeout`, or a fixed delay.

## The failure mode

Arbitrary delays are guesses about how long something takes. They race:

- Fast machine / no load → delay is too long, suite is slow.
- CI / loaded runner → delay is too short, test flakes.
- Parallel runs → ordering shifts, the delay no longer covers the gap.

A flaky test that passes locally and fails in CI almost always hides a guessed
delay. The fix is never "bump the sleep to 200ms." The fix is to **wait for the
actual condition you care about**, with a timeout as a safety net.

## Core pattern

```ts
// ❌ Guessing at timing
await sleep(50);
expect(getResult()).toBeDefined();

// ✅ Waiting for the condition, with a bounded timeout
await waitFor(() => getResult() !== undefined, 'result to appear');
expect(getResult()).toBeDefined();
```

Wait on the *observable state change*, not on a duration. Poll it; throw a
clear, named error if it doesn't arrive in time.

## What to wait on

| You need | Wait on |
|----------|---------|
| An async op to finish | the settled promise / completion callback / exit code |
| A file to exist | `fs.existsSync(path)` polled, or a watcher event |
| A server to be ready | a health-check request returning 200 (not a sleep after start) |
| An event to fire | the event itself (subscribe, await its emission) |
| A count to be reached | `items.length >= n` |
| A state transition | `machine.state === 'ready'` |

**Prefer event-based waits over polling** when the system can emit the event:
subscribe to `on('done', ...)` / `on('ready', ...)` and resolve on emission.
Polling is the fallback when there's no event to hook.

## A minimal poller

```ts
async function waitFor<T>(
  cond: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000,
): Promise<T> {
  const start = Date.now();
  while (true) {
    const v = cond();          // re-read fresh each pass — never cache state outside the loop
    if (v) return v;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out: ${description} (after ${timeoutMs}ms)`);
    }
    await new Promise(r => setTimeout(r, 10));   // 10ms poll — fast enough, cheap on CPU
  }
}
```

Three things are load-bearing: the **fresh re-read** inside the loop, the
**bounded timeout**, and the **named description** in the error (so a flake
tells you *what* it was waiting for, not just "timeout").

## When a fixed delay IS correct

Rare, and always justified in a comment:

```ts
// Tick every 100ms; need 2 ticks to confirm partial output is flushed.
await waitForEvent(emit, 'FLUSHED');     // 1. first wait on the condition
await sleep(200);                        // 2. THEN a known, documented interval
```

Rules for the rare fixed delay: (1) wait on the triggering condition first, (2)
the duration comes from *known* timing (a tick interval, a debounce window), not
a guess, (3) a comment says **why** this number. If you can't write the comment,
you don't have a known interval — you have a guess; go back to polling.

## Common mistakes

- **Polling every 1ms.** Wastes CPU and can starve the very process you're
  waiting on. 10ms is the sweet spot.
- **No timeout.** An infinite loop that "works" hides a real deadlock. Always
  bound it.
- **Caching the value outside the loop.** `const x = getState(); while (!x.ready)`
  waits forever. Re-call the getter each pass.
- **"Bump the sleep."** A flake fixed by a bigger sleep is a flake deferred. The
  condition you should be polling on isn't the one you're polling on.

## Done when

The test is deterministic under load: run it in parallel, on a loaded CI box, and
after artificially slowing the producer — it passes (or fails with the named
timeout) the same way every time. No `sleep` appears anywhere it isn't justified
by a comment.

## Related

- [defense-in-depth.md](defense-in-depth.md) — condition-based waiting is the
  timing layer of the same layered-defense idea.
- `test-driven-development` — a RED test that flakes is usually a missing
  condition-based wait, not a flaky framework.
