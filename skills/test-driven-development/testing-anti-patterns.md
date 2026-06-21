# Testing Anti-Patterns

> Supporting reference for the `test-driven-development` skill. Load when writing
> or changing tests, adding mocks, or feeling the pull to add a method "just for
> the tests." Strict TDD prevents all of these — their presence is a tell that
> TDD was skipped.

## The iron laws

```
1. NEVER assert on mock behavior — assert on real behavior.
2. NEVER add a method to production code that only tests call.
3. NEVER mock a dependency you haven't first understood by running against the real one.
```

## Anti-pattern 1: Tests written after the code

**The smell:** the test passes the first time you run it.

**Why it's wrong:** a test that never failed proves nothing. It might test the
implementation instead of the requirement, test the wrong edge cases, or pass
for a reason unrelated to the behavior you think you're checking. You never saw
it catch a bug, so you don't know it can.

**The fix:** delete the test and the code, write the test first (RED), watch it
fail for the *right* reason (feature missing — not a typo), then write the
minimum code (GREEN). "I'll write tests after" is the rationalization that
produces this anti-pattern; see the TDD skill's Common Rationalizations table.

## Anti-pattern 2: Testing the mock, not the behavior

**The smell:** an assertion checks that a mock was called, or checks for a
`data-testid` that only the mock sets.

```ts
// ❌ Asserting the mock exists — tells you nothing about the real component
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**Why it's wrong:** the test passes whenever the mock is present and fails when
it's removed — it verifies the mock, not the page. Refactor the real component and
this test stays green even as the feature breaks.

**The fix:** test real behavior, or don't mock.

```ts
// ✅ Test the real component, or assert on Page's observable behavior with the sidebar present
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

**Gate:** before asserting on any mock element, ask "am I testing real behavior
or just mock existence?" If the latter — delete the assertion or unmock the
component.

## Anti-pattern 3: Vague test names

**The smell:** `test('works')`, `test('test1')`, `test('retry')`.

**Why it's wrong:** when this test fails in CI six months from now, the name has
to tell the reader *which* behavior broke. "works" never does. A good name is a
sentence about behavior: "retries failed operations 3 times before giving up".

**The fix:** name the test as a one-line spec of the behavior under test, in the
"subject verb object" form — what, under what condition, does what.

| ❌ Vague | ✅ Clear |
|----------|---------|
| `test('retry')` | `test('retries a failing op up to 3 times, then throws')` |
| `test('validate')` | `test('rejects an email that is empty or only whitespace')` |
| `test('test1')` | `test('returns the cached value when the key exists')` |

## Anti-pattern 4: "and" in a test name (or test body)

**The smell:** `test('validates email and domain and whitespace')`.

**Why it's wrong:** "and" means the test checks more than one behavior. When it
fails, you don't know which assertion broke. It also tempts you to stop at the
first passing assertion and skip the rest. One behavior per test.

**The fix:** split on the "and". Each behavior gets its own test with its own
clear name (see Anti-pattern 3). If the setup is shared, extract a helper — don't
share the test.

```ts
// ❌ One test, three behaviors, ambiguous on failure
test('validates email and domain and whitespace', () => { ... });

// ✅ Three tests, each names exactly what it proves
test('rejects an empty email');
test('rejects an email whose domain is missing');
test('trims surrounding whitespace before validating');
```

## Anti-pattern 5: Test-only methods in production code

**The smell:** a public method on a production class that is only ever called from
test files (a `destroy()`, a `__setState()`, a `reset()`).

**Why it's wrong:** it pollutes the production API with code that exists only for
tests, blurs the object's real responsibilities, and is dangerous if ever called
in production by accident. It's also a tell that the class is hard to test —
which is the real problem to fix.

**The fix:** move the helper into a test-utility module. The production class keeps
only its real API; the test util owns cleanup/teardown.

```ts
// ❌ destroy() only ever called from afterEach
class Session { async destroy() { /* ... */ } }

// ✅ test util owns cleanup; Session has no destroy()
export async function cleanupSession(s: Session) { /* ... */ }
```

## Anti-pattern 6: Mocking a dependency you don't understand

**The smell:** "I'll mock this to be safe" / "this might be slow, better mock it."

**Why it's wrong:** a mock of a method with side effects silently removes those
side effects. The test then passes (or fails) for reasons unrelated to the real
behavior — you've tested a fiction. Over-mocking "to be safe" is how mysterious
test-only bugs are born.

**The fix:** run the test against the real dependency *first* and watch what it
actually needs. Then mock at the lowest level that's genuinely slow or external,
preserving the side effects the test depends on. If you can't name the side
effects the real method has, you don't understand it well enough to mock it.

## Quick reference

| Anti-pattern | Fix |
|--------------|-----|
| Test passes on first run | Delete; write test first, watch it fail (RED) |
| Asserting on a mock | Test real behavior, or unmock |
| `test('works')` | Name it as a one-line behavior spec |
| "and" in the name | Split into one test per behavior |
| Test-only method in prod | Move to a test util |
| "Mock to be safe" | Understand the real dep first; mock the slow part only |

## Red flags

- A test that has never been seen to fail.
- An assertion on a `*-mock` test id.
- A public method called only from `*.test.*` files.
- Mock setup longer than the test body.
- "and" appearing in a test name.
- A test that breaks when you remove a mock it "doesn't need".

## Related

- `test-driven-development` SKILL.md — the RED-GREEN-REFACTOR cycle whose
  absence is the root cause of every anti-pattern above.
- `systematic-debugging` — a flaky or mysterious test is a bug; debug it
  systematically, don't bump the sleep (see [condition-based-waiting.md](../systematic-debugging/condition-based-waiting.md)).
