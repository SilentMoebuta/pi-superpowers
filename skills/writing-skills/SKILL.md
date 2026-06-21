---
name: writing-skills
description: Use when authoring a new pi skill, or revising one that isn't being picked up, misfires, or misleads the agent — before any skill change ships.
---

# Writing Skills

Authoring a pi skill is TDD applied to process documentation: watch an agent
fail without the skill (RED), write the skill (GREEN), then close the loopholes
the agent finds (REFACTOR). If you didn't watch an agent fail without it, you
don't know the skill teaches the right thing.

**REQUIRED BACKGROUND:** understand `test-driven-development` first. The
RED-GREEN-REFACTOR cycle is the same; this skill adapts it to markdown.

## Anatomy

```
my-skill/
├── SKILL.md          # required — always in context, the only file the model must read
├── references/       # optional deep-dive docs (loaded on demand via links)
└── scripts/          # optional reusable helpers
```

## Frontmatter

```yaml
---
name: my-skill                    # must match parent dir; lowercase a-z, 0-9, hyphens
description: <when to use it>     # the ONLY field always in context — see SDO below
---
```

Two fields are required: `name` and `description`. Pi enforces the
[Agent Skills spec](https://agentskills.io/specification): name 1–64 chars,
lowercase + hyphens only, must match the parent directory; description ≤ 102
chars; missing description → skill not loaded.

## Skill Discovery Optimization (SDO)

The `description` is the **only** part the model sees until it decides to load
the skill. It is the skill's trigger — it answers one question: *should I read
this skill right now?*

> **SDO rule:** the description states **when to use** the skill. It does **not**
> summarize what the skill does.

**Why this is the rule, not a style preference:** testing showed that when a
description summarizes the skill's workflow, an agent will *follow the
description* and skip reading the skill body. A description that said "code
review between tasks" made an agent do one review even though the skill's
flowchart required two (spec compliance, then code quality). Changing the
description to just the trigger — "use when executing plans with independent
tasks" — made the agent read the flowchart and follow the two-stage process.

The trap is seductive: a description that reads like a mini-TOC feels
informative. It is — and that's the bug. It gives the agent enough to act on the
summary, so it never loads the body that holds the real rules. **A summarized
description turns the skill body into documentation agents skip.**

The old version of this file taught the opposite — that a description "must say
what the skill does *and* when to reach for it." That was wrong, and it is the
single most important thing to unlearn. Say *when*, not *what*.

## Writing skill descriptions

Start with "Use when…", name the **triggering conditions and symptoms** (the
problem, not the language-specific surface), keep it third person, and keep it
short.

```yaml
# ❌ BAD — summarizes workflow. An agent can act on this and skip the body.
description: Use when authoring a skill — covers frontmatter rules, description quality, and progressive-disclosure structure.

# ❌ BAD — too much process; reads like a procedure.
description: For TDD — write test first, watch it fail, write minimal code, refactor.

# ❌ BAD — too abstract; no trigger.
description: For async testing.

# ✅ GOOD — trigger only, no workflow summary.
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently.

# ✅ GOOD — trigger only.
description: Use when implementing any feature or bugfix, before writing implementation code.
```

Describe the **problem** (race conditions, inconsistent behavior) — not a
specific tool's symptoms (`setTimeout`, `sleep`) — unless the skill is itself
tool-specific, in which case name the tool in the trigger.

## Match the Form to the Failure

Before writing guidance, classify the baseline failure. The form that bulletproofs
one failure type measurably backfires on another. This is the decision the old
file was missing.

| Baseline failure | Right form | Wrong form |
|---|---|---|
| Skips a rule under pressure (knows better, does it anyway) | Prohibition + rationalization table + red flags | Soft guidance ("prefer…", "consider…") |
| Complies, but output has the wrong shape (bloated prompt, buried verdict, restated spec) | **Positive recipe / contract** — state what the output *is*, its parts in order | Prohibition list ("don't restate", "never narrate") |
| Omits a required element from something they already produce | Structural: a REQUIRED slot in the template they fill | Prose reminders near the template |
| Behavior should depend on a condition | Conditional keyed to an observable predicate ("if the brief exists, reference it") | Unconditional rule + exemption clauses |

**Why prohibitions backfire on shaping problems:** under a competing incentive
("make the prompt self-contained"), an agent negotiates with "don't X" — and
wording tests show the prohibition arm produces *more* of the unwanted content
than a positive recipe, sometimes worse than no guidance at all. A recipe leaves
nothing to negotiate: the output matches the stated shape or it doesn't.

**Two rules for whichever form you pick:**

- **No nuance clauses.** "Don't X unless it matters" reopens the negotiation —
  appending one nuance clause to a winning recipe degrades it from consistent to
  noisy. Express a real exception as its own conditional on an observable
  predicate.
- **Exemption clauses don't scope.** "This limit doesn't apply to code blocks"
  still suppresses code blocks. If part of the output must be exempt, restructure
  so the rule can't reach it.

This is also why the SDO description is a trigger, not a prohibition: the failure
is "agent skips the body," which is a *shaping* problem — and a prohibition
("don't summarize workflow") would be the wrong form. The recipe is "say when,
not what."

## Progressive disclosure

Keep `SKILL.md` short (under ~200 lines). The model loads `SKILL.md` first and
follows links only when it needs depth — so put the rules up top and push heavy
reference material into `references/*.md`, linked by relative path. A reader who
never opens the references should still get the load-bearing rules from
`SKILL.md` alone.

One excellent, runnable example beats five mediocre ones. Inline code under ~50
lines; anything heavier goes in a supporting file.

## Body structure

1. **Trigger** — one paragraph: "use this when X".
2. **Process / rules** — numbered, executable steps.
3. **Anti-patterns** — what NOT to do (often more useful than the rules).
4. **Handoff** — which skills pair naturally.

## Validation

`scripts/validate-skills.ts` is the structural gate: every `skills/*/SKILL.md`
must have non-empty `name` + `description`, every slash-command must resolve to a
real skill or an external allowlist, and retired tool names from the spawn_role migration are flagged. Run it
before committing:

```bash
npx tsx scripts/validate-skills.ts   # exit 0 = all skills valid
```

Structural validation is necessary but not sufficient — it can't tell you
whether the skill changes agent behavior. That needs the test below.

## Test it (behavioral, not just structural)

1. **Micro-test the wording first.** One fresh-context call per variant, with a
   no-guidance control. If the control doesn't exhibit the failure, there's
   nothing to fix — stop. 5+ reps per variant (single samples lie). Read every
   flagged match by hand — template echoes masquerade as hits.
2. **Pressure-scenario the discipline.** For rule-enforcing skills, run a
   `spawn_role` subagent (e.g. the `reviewer` role) through a scenario that
   tempts the violation, without the skill, and record the rationalizations
   verbatim (RED). Then with the skill (GREEN). Close new loopholes (REFACTOR).
3. **Deploy check.** Restart pi; the header lists your skill. `/skill:<name>`
   force-loads it so you can confirm the body renders cleanly.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The skill is obviously clear" | Clear to you ≠ clear to an agent. Test it. |
| "It's just a reference doc" | References have gaps. Test retrieval. |
| "Testing is overkill here" | Untested skills have issues. Always. 15 min saves hours. |
| "I'll test if problems emerge" | Problems = agents can't use it. Test *before* shipping. |
| "The description should explain what it does" | That's the SDO trap. Trigger only — see above. |
| "I'll just add a 'don't do X' line" | Wrong form for a shaping problem. Use a recipe. |

## Red Flags — STOP

- The description summarizes the skill's workflow (the SDO trap — rewrite as trigger only).
- A `SKILL.md` over ~200 lines with reference material inlined instead of linked.
- Guidance for a wrong-shape problem written as a prohibition list.
- A nuance clause ("unless it matters") tacked onto a recipe.
- Shipping a skill change without running the validator *and* at least one pressure scenario.
- "I'll test it after it lands."

**All of these mean: stop, rewrite, test before shipping.**

## Handoff

- `test-driven-development` — the RED-GREEN-REFACTOR cycle this skill adapts.
- `using-superpowers` references [pi-tools.md](../using-superpowers/references/pi-tools.md)
  — keep skill prose action-neutral; pin concrete tool names there, not in skills.
- `systematic-debugging` — when a skill's pressure scenario reveals a real bug.
