import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSkills, parseFrontmatter, extractSlashCommands } from "../scripts/validate-skills";

// PS-2: a structural validator that catches skill drift before an agent fails
// to load a skill. TDD'd here (RED first). The validator is PURE (takes a list
// of {path, content} entries + a skill-names set + an externals allowlist) so
// it's unit-testable without touching the real filesystem.

describe("parseFrontmatter", () => {
	it("parses name + description from valid frontmatter", () => {
		const fm = parseFrontmatter("---\nname: my-skill\ndescription: Does X when Y.\n---\n# body");
		assert.equal(fm.name, "my-skill");
		assert.equal(fm.description, "Does X when Y.");
	});
	it("returns empty for a file with no frontmatter", () => {
		const fm = parseFrontmatter("# just a heading, no frontmatter");
		assert.equal(fm.name, undefined);
		assert.equal(fm.description, undefined);
	});
	it("handles a missing description (still valid YAML, but incomplete)", () => {
		const fm = parseFrontmatter("---\nname: partial\n---\nbody");
		assert.equal(fm.name, "partial");
		assert.equal(fm.description, undefined);
	});
});

describe("extractSlashCommands (real regex, not naive substring)", () => {
	it("extracts /command tokens at word boundaries", () => {
		const cmds = extractSlashCommands("Use /commit then /changes to track work");
		assert.deepEqual(cmds, ["/commit", "/changes"]);
	});
	it("does NOT match path separators (specs/buildplan.md)", () => {
		const cmds = extractSlashCommands("Write to specs/buildplan.md and docs/security-audit.md");
		assert.deepEqual(cmds, []);
	});
	it("does NOT match URL paths (/api/user endpoint)", () => {
		const cmds = extractSlashCommands('Add validation to /api/user endpoint');
		assert.deepEqual(cmds, []);
	});
	it("does NOT match conjunctions (reviewer/planner, monitoring/logging)", () => {
		const cmds = extractSlashCommands("use reviewer/planner with monitoring/logging");
		assert.deepEqual(cmds, []);
	});
	it("matches backtick-wrapped commands", () => {
		const cmds = extractSlashCommands("run `/status` or `/goal`");
		assert.deepEqual(cmds, ["/status", "/goal"]);
	});
	it("matches at start of line", () => {
		const cmds = extractSlashCommands("/commit\nnext line");
		assert.deepEqual(cmds, ["/commit"]);
	});
});

describe("validateSkills", () => {
	const skillNames = new Set(["commit", "changes", "status", "review", "log", "security"]);
	const externals = new Set(["/goal", "/plan", "/build", "/reload", "/skill"]);

	it("passes for a valid skill with frontmatter + known commands", () => {
		const errors = validateSkills([{
			path: "skills/commit/SKILL.md",
			content: "---\nname: commit\ndescription: Commit changes. Use when user types /commit.\n---\nUse /status after.",
		}], skillNames, externals);
		assert.deepEqual(errors, []);
	});

	it("flags a skill with missing name", () => {
		const errors = validateSkills([{
			path: "skills/bad/SKILL.md",
			content: "---\ndescription: no name.\n---\nbody",
		}], skillNames, externals);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /missing.*name/i);
	});

	it("flags a skill with missing description", () => {
		const errors = validateSkills([{
			path: "skills/bad/SKILL.md",
			content: "---\nname: bad\n---\nbody",
		}], skillNames, externals);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /missing.*description/i);
	});

	it("flags an unknown slash-command (not a skill, not in externals)", () => {
		const errors = validateSkills([{
			path: "skills/x/SKILL.md",
			content: "---\nname: x\ndescription: d\n---\nRun /nonexistent-skill now.",
		}], skillNames, externals);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /unknown.*command.*\/nonexistent-skill/i);
	});

	it("does NOT flag externals like /goal /plan /build", () => {
		const errors = validateSkills([{
			path: "skills/x/SKILL.md",
			content: "---\nname: x\ndescription: d\n---\nUse /goal and /plan and /build.",
		}], skillNames, externals);
		assert.deepEqual(errors, []);
	});

	it("does NOT flag path separators (specs/buildplan.md)", () => {
		const errors = validateSkills([{
			path: "skills/x/SKILL.md",
			content: "---\nname: x\ndescription: d\n---\nWrite to specs/buildplan.md.",
		}], skillNames, externals);
		assert.deepEqual(errors, []);
	});
});
