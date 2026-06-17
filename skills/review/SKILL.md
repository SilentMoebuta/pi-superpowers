---
name: review
description: Run a structured code review against the project's own conventions in claude/claude.md. Use when the user types /review or asks for a code review.
allowed-tools: Read, Bash(git diff:*), Bash(git log:*), Bash(find:*)
---

## Task: Code review against project conventions

This review checks code against YOUR project's rules in `claude/claude.md`, not just generic best practices.

### Step 1: Load project conventions
Read `claude/claude.md` in full. Extract:
- Naming conventions
- Architectural rules
- Forbidden patterns
- Stack preferences
- Folder structure rules

If `claude/claude.md` does not exist, note this and fall back to general best practices. Recommend creating it after the review.

### Step 2: Determine what to review
If $ARGUMENTS is provided, review that specific file or folder.
Otherwise, review changed files since last commit: `git diff HEAD --name-only`

### Step 3: Run the review
For each file, check against:

**Convention violations** — anything that breaks rules explicitly defined in claude/claude.md. These are highest priority.

**Architecture issues** — files in wrong folders, responsibilities in wrong modules, patterns that conflict with the project's established approach.

**Code quality** — logic errors, edge cases, missing error handling, security issues (hardcoded secrets, unvalidated inputs).

**Consistency** — naming that doesn't match the rest of the codebase, patterns used differently from how they're used elsewhere.

### Step 4: Output the review

Format as:

```
## Code Review — [date]

### 🔴 Convention Violations (must fix)
- [file:line] — [what rule it breaks] — [suggested fix]

### 🟠 Architecture Issues
- [file] — [issue] — [suggested fix]

### 🟡 Code Quality
- [file:line] — [issue] — [suggested fix]

### 🔵 Consistency
- [file:line] — [issue] — [suggested fix]

### ✅ Summary
[count] issues found. [count] must fix, [count] advisory.
```

If no issues found in a category, omit that section.
If claude/claude.md is missing, append: "⚠️ No claude/claude.md found — review used general standards only. Run /scaffold to create it."
