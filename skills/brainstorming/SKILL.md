---
name: brainstorming
description: Use before any non-trivial creative or design work — new features, vague requirements, "what should we build", architecture decisions. Surfaces intent and constraints before code is written.
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

## When to Use

Trigger this skill when the user's request is open-ended or under-specified: "build X", "design Y", "what should we do about Z", new features, architecture decisions, or any work where requirements are not yet pinned down. If the user has already provided a detailed, specific spec with concrete implementation steps, skip brainstorming and go directly to writing-plans.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Checklist

You MUST create a task for each of these items and complete them in order. Each step must be visibly completed before moving to the next. The checklist acts as a state machine — you are always at exactly one step, and you cannot skip ahead.

If you catch yourself thinking "this project is too simple for research" or "I already know the answer to this design question," re-read the Anti-Pattern section above. Those thoughts are the #1 source of designs that fail during implementation.

1. **Explore project context** — check files, docs, recent commits. Restate the goal in one sentence and confirm with the user.
2. **Ask clarifying questions** — one at a time, 3-5 sharp questions maximum. Understand purpose, constraints, success criteria, scope, and the simplest version that would be useful. Prefer multiple choice (A/B/C) over open-ended. Only one question per message. If the user's answer reveals a new unknown, ask a follow-up — but keep the total question count disciplined.
3. **Research Before Designing** — dispatch a researcher subagent to investigate the landscape (see expanded section below). Save findings to `docs/research/YYYY-MM-DD-<topic>-research.md`.
4. **Propose 2-3 approaches** — with trade-offs and your recommendation, grounded in the research findings.
5. **Present design** — in sections scaled to their complexity, get user approval after each section.
6. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit.
7. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below).
8. **User reviews written spec** — ask user to review the spec file before proceeding.
9. **Transition to implementation** — invoke writing-plans skill to create implementation plan.

### Step 3: Research Before Designing

Before sketching approaches, dispatch a **researcher** subagent to investigate the landscape. Do not skip this step for any non-trivial project — guessing at technology choices without evidence is the root cause of most bad designs.

**What to research:**
- **Existing solutions:** Open-source projects, libraries, or tools that solve similar problems. What can be learned from their architecture, API design, and limitations? Examples: look at how popular frameworks structure similar features, check npm/pip registry for packages in the domain, search for "awesome-X" curated lists.
- **Best practices:** Patterns, architectures, and conventions recommended by the community. What do the experts reach for? What patterns have emerged as standard? Check official documentation guides, community style guides, and architecture decision records (ADRs) from well-known projects.
- **Library/API landscape:** Available tools — which are mature and battle-tested vs experimental and risky. Catalog their trade-offs: bundle size, learning curve, maintenance activity, community size, release cadence, TypeScript support, breaking-change history.
- **Pitfalls:** Common mistakes, failure modes, or limitations others have encountered. What do people regret choosing? What are the known sharp edges? Search for "X vs Y", "why we moved away from X", GitHub issues labeled "bug" or "performance", and community post-mortems.

**How to research:**
- Use `web_search` with `workflow: "none"` to skip interactive approval and reduce friction
- Use `fetch_content` liberally to read documentation, GitHub READMEs, API references, and community discussions
- Dispatch the researcher subagent with `run_in_background: true` so research runs concurrently while you continue the dialogue with the user
- Time-box research to at most 3 search queries unless the context clearly demands deeper investigation

**Output:**
Save findings to `docs/research/YYYY-MM-DD-<topic>-research.md`. The research document must include:
- **Library comparison table:** Name, maturity (stable / maintained / deprecated), pros, cons, and a clear recommendation column
- **Key findings:** 2-3 sentences per finding. Be specific — name libraries, reference GitHub stars or last-commit dates, cite community consensus
- **Design connection:** Explicit links between findings and design decisions. Format: "We chose X because Y (see research finding Z)"

**Anti-patterns (research-specific):**
- **Designing from memory without research** — when you don't know the landscape, you're guessing. Most bad technology choices come from this. You cannot make informed trade-offs from memory alone.
- **Skipping research because "it's a simple project"** — simple projects still benefit from knowing what exists. A 30-minute research sweep can save days of wrong-path implementation. Even a single-function utility has library alternatives worth understanding.
- **Asking the user to decide between libraries you haven't researched** — you're the expert. Do the investigation, present informed trade-offs with evidence, and make a clear recommendation. Users hire you for judgment, not just for execution.
- **Researching forever** — time-box it. Three well-targeted searches beat ten unfocused ones. Ship the research doc and move on. You can always do follow-up research if the design surfaces new questions.
- **Taking the first Google result as truth** — verify with multiple sources. Check GitHub activity, recent commits, open issues, and community sentiment. A high-ranking blog post may be outdated or wrong.

## The Process

**Understanding the idea:**

- Check out the current project state first (files, docs, recent commits). Understand what already exists and what patterns are established.
- Before asking detailed questions, assess scope: if the request describes multiple independent subsystems (e.g., "build a platform with chat, file storage, billing, and analytics"), flag this immediately. Don't spend questions refining details of a project that needs to be decomposed first.
- If the project is too large for a single spec, help the user decompose into sub-projects: what are the independent pieces, how do they relate, what order should they be built? Then brainstorm the first sub-project through the normal design flow. Each sub-project gets its own spec → plan → implementation cycle.
- For appropriately-scoped projects, restate the goal in one sentence and confirm before proceeding. This prevents misalignment from accumulating through the design process.
- Ask questions one at a time to refine the idea. Focus on the load-bearing unknowns — the questions whose answers will most change the design.
- Prefer multiple choice questions when possible, but open-ended is fine when you genuinely can't anticipate the options.
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria, what's explicitly out of scope
- Question categories to probe:
  - **Users:** Who will use this? What's their technical level? What's their workflow?
  - **Success:** How will we know this is done? What's the acceptance test?
  - **Constraints:** Performance requirements? Deadlines? Must-use dependencies? Compatibility requirements?
  - **Scope boundaries:** What's explicitly NOT part of this? What's a stretch goal vs core?
  - **MVP:** What's the simplest version that would still be useful? What can wait for v2?

**Exploring approaches:**

- Propose 2-3 meaningfully different approaches with clear trade-offs. Avoid straw-man alternatives or options you wouldn't actually recommend.
- Ground each approach in the research findings from step 3. For each approach, reference specific findings that support it ("research shows X scales well for this use case") or caution against it ("the community reports Y has sharp edges with authentication").
- Present options conversationally with your recommendation and reasoning. Structure each as: what the approach is, when it works best, what it trades off, and which research findings apply.
- Lead with your recommended option and explain why it wins on the criteria that matter most for this project.

**Presenting the design:**

- Once you believe you understand what you're building, present the design for approval
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far. This incremental checkpointing catches misunderstandings early.
- Cover: architecture, components, data flow, error handling, testing. Each section should be self-contained enough that the user can approve or redirect it independently.
- If the user objects to part of a section, revise just that part and re-confirm before moving on. Don't barrel through with pending objections.
- Be ready to go back and clarify if something doesn't make sense — the design conversation is iterative, not linear.

**Design for isolation and clarity:**

- Break the system into smaller units that each have one clear purpose, communicate through well-defined interfaces, and can be understood and tested independently
- For each unit, you should be able to answer: what does it do, how do you use it, and what does it depend on?
- Can someone understand what a unit does without reading its internals? Can you change the internals without breaking consumers? If not, the boundaries need work.
- Smaller, well-bounded units are also easier for you to work with - you reason better about code you can hold in context at once, and your edits are more reliable when files are focused. When a file grows large, that's often a signal that it's doing too much.

**Working in existing codebases:**

- Explore the current structure before proposing changes. Follow existing patterns.
- Where existing code has problems that affect the work (e.g., a file that's grown too large, unclear boundaries, tangled responsibilities), include targeted improvements as part of the design - the way a good developer improves code they're working in.
- Don't propose unrelated refactoring. Stay focused on what serves the current goal.

**Scope management:**

- If the design starts to grow during discussion, call it out: "This has expanded beyond our original scope. Should we split this into two specs, or is this still one coherent unit?"
- When the user suggests features mid-design, don't automatically include them. Ask: "Should this be part of this spec, or saved for a follow-up?"
- It's better to ship a focused spec well than a sprawling spec half-baked. Err on the side of smaller, more frequent specs.

## After the Design

**Documentation:**

- Write the validated design (spec) to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Use elements-of-style:writing-clearly-and-concisely skill if available to keep the spec crisp and actionable
- Structure the spec: overview (one paragraph), architecture diagram (ASCII art or component list), component breakdown (what each piece does, its interface, its dependencies), data flow (what moves where and when), error handling strategy, testing approach, and open questions (if any)
- Commit the design document to git with a descriptive message referencing the research document

**Spec Self-Review:**
After writing the spec document, look at it with fresh eyes before showing the user:

1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections, or vague requirements? Fix them. A spec with placeholders is a draft, not a spec.
2. **Internal consistency:** Do any sections contradict each other? Does the architecture match the feature descriptions? Does the data flow section agree with the component breakdown?
3. **Scope check:** Is this focused enough for a single implementation plan, or does it need decomposition? If the spec feels like it has natural seams, flag them for the user.
4. **Ambiguity check:** Could any requirement be interpreted two different ways by a reasonable person? If so, pick one and make it explicit. Ambiguity in the spec becomes bugs in the code.
5. **Research traceability:** Does every technology/architecture choice in the spec trace back to a finding in the research document? If not, either the spec needs updating or you skipped research.

Fix any issues inline. No need to re-review — just fix and move on. The self-review should take 2-3 minutes, not 20.

**User Review Gate:**
After the spec review loop passes, ask the user to review the written spec before proceeding:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. Only proceed once the user approves.

**Implementation:**

- Invoke the writing-plans skill to create a detailed implementation plan.
- Do NOT invoke frontend-design, mcp-builder, or any other implementation skill. The ONLY skill you invoke after brainstorming is writing-plans.
- The writing-plans skill must reference the research from `docs/research/` and the approach chosen in brainstorming.

## Key Principles

- **One question at a time** — Don't overwhelm with multiple questions. Each answer should inform the next question.
- **Multiple choice preferred** — Easier to answer than open-ended when possible. A/B/C options reduce user cognitive load compared to blank-page prompts.
- **Research before deciding** — Ground every technology choice in evidence, not memory. If you can't cite a research finding for a decision, you haven't done enough research.
- **YAGNI ruthlessly** — Remove unnecessary features from all designs. Every feature you don't build is a feature you don't have to maintain, test, or debug.
- **Explore alternatives** — Always propose 2-3 approaches before settling. Never settle on one "obvious" answer — the first solution you think of is rarely the best one.
- **Incremental validation** — Present design section by section, get approval before moving on. Catching a misunderstanding early saves rewriting the entire spec.
- **Be flexible** — Go back and clarify when something doesn't make sense. The process is a spiral, not a waterfall.
- **Plan before code** — No implementation without a written, approved plan. Plans are the contract between you and the user about what will be built.

## Anti-patterns

- **Jumping to implementation on a fuzzy request** — if you don't know what success looks like, you can't build it. Design first, always.
- **Producing one "obvious" answer** — the first solution you think of is rarely the best. Force yourself to generate alternatives.
- **Asking too many questions at once** — pick the 3-5 load-bearing ones. More than that and the user tunes out.
- **Designing from memory without research** — when you don't know the landscape, you're guessing. Most bad technology choices come from this.
- **Skipping research because "it's a simple project"** — simple projects benefit from knowing what exists. A 30-minute sweep saves days of wrong-path work.
- **Proceeding to implementation without a written, approved plan** — the plan is the contract. No plan, no code.
- **Designing in a vacuum** — if an existing codebase is involved, explore it first. Proposals that ignore existing patterns will be rejected.

## Handoff

When the user approves the written spec, proceed to `writing-plans` to produce a combined spec+plan document that includes:
- **Spec section:** Architecture overview, technology choices (with research citations), component breakdown, data flow, error handling strategy, testing approach
- **Plan section:** Ordered implementation steps with role/deps/wave annotations, each step referencing the spec section it implements

The writing-plans skill must reference:
- The approved design spec from `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- The research document from `docs/research/YYYY-MM-DD-<topic>-research.md`

Do NOT write the full plan here — brainstorming is about clarifying WHAT and WHY. `writing-plans` handles HOW.

**The terminal state of brainstorming is invoking writing-plans.** Do NOT invoke exploring-codebase, frontend-design, mcp-builder, or any other skill. The ONLY skill you invoke after brainstorming is writing-plans.
