// PS-2: structural validator for pi-superpowers skills.
//
// Catches drift before an agent fails to load a skill: missing frontmatter
// (name/description), unknown slash-commands (a /foo that matches no skill and
// no external allowlist), and stale pi-tool references (get_subagent_result
// removed in the spawn_role migration). Pure functions (parseFrontmatter,
// extractSlashCommands, validateSkills) are unit-tested in
// __tests__/validate-skills.test.ts; the CLI entrypoint walks skills/*/SKILL.md.
//
// Run: npx tsx scripts/validate-skills.ts   (exit 0 = all skills valid)

import * as fs from "node:fs";
import * as path from "node:path";

/** Parse the YAML-ish frontmatter block (---\n...\n---). Returns {name, description}. */
export function parseFrontmatter(content: string): { name?: string; description?: string } {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return {};
	const block = match[1];
	const get = (key: string): string | undefined => {
		const m = block.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
		return m ? m[1].replace(/^["']|["']$/g, "") : undefined;
	};
	return { name: get("name"), description: get("description") };
}

/**
 * Extract slash-command tokens (/foo) using a REAL word-boundary regex — NOT
 * naive substring grep. Critically, this does NOT match path separators
 * (specs/buildplan.md, /api/user) or conjunctions (reviewer/planner), which
 * a naive `grep -oE '/[a-z]+'` would false-positive on. Matches /foo at start
 * of line, after whitespace, or inside backticks; requires the next char to be
 * a word boundary that is NOT a path continuation (not /, not word-char).
 */
export function extractSlashCommands(content: string): string[] {
	// Match /foo preceded by start-of-string OR whitespace (a real command
	// invocation, not a path separator or conjunction). Excludes:
	//   - path separators: specs/buildplan.md, docs/security-audit.md
	//   - URL paths: /api/user
	//   - conjunctions: reviewer/planner, `sleep`/timeout
	// A backtick-wrapped `` `/cmd` `` is NOT matched (rare in these skills; if it
	// appears, the prose context makes the intent clear without validator help).
	const re = /(^|[\s])(\/[a-z][\w-]*)(?=$|[\s`.,;:!?)"'\]\)])/gm;
	const cmds: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(content)) !== null) {
		cmds.push(m[2]);
	}
	return cmds;
}

export interface SkillEntry {
	path: string;
	content: string;
}

/** Validate a list of skill entries. Returns an array of error strings (empty = valid). */
export function validateSkills(
	entries: SkillEntry[],
	skillNames: Set<string>,
	externals: Set<string>,
): string[] {
	const errors: string[] = [];
	for (const entry of entries) {
		const fm = parseFrontmatter(entry.content);
		if (!fm.name) {
			errors.push(`${entry.path}: missing frontmatter 'name'`);
		}
		if (!fm.description || fm.description.trim().length === 0) {
			errors.push(`${entry.path}: missing frontmatter 'description'`);
		}
		// Unknown slash-commands: must match a skill name OR be in the externals allowlist.
		const cmds = extractSlashCommands(entry.content);
		for (const cmd of cmds) {
			const name = cmd.slice(1); // drop leading /
			if (skillNames.has(name)) continue;
			if (externals.has(cmd)) continue;
			errors.push(`${entry.path}: unknown command '${cmd}' (no skill or external matches)`);
		}
	}
	return errors;
}

// Stale pi-tool references that should not appear (migrated away).
const STALE_TOOLS = ["get_subagent_result"];

function checkStaleTools(entries: SkillEntry[]): string[] {
	const errors: string[] = [];
	for (const entry of entries) {
		for (const tool of STALE_TOOLS) {
			// Allow the tool name only in the migration-note context ("no X needed").
			const re = new RegExp(`(^|[^-\\w])${tool}([^\\w-]|$)`, "g");
			let m: RegExpExecArray | null;
			while ((m = re.exec(entry.content)) !== null) {
				// Look at the surrounding ~40 chars for a "no ... needed" negation.
				const ctx = entry.content.slice(Math.max(0, m.index - 40), m.index + tool.length + 40);
				if (/no\s+[\w-]*\s*(get_subagent_result|needed)/i.test(ctx)) continue;
				errors.push(`${entry.path}: stale pi-tool reference '${tool}' (migrated to spawn_role)`);
			}
		}
	}
	return errors;
}

// --- CLI entrypoint ---
function main(): void {
	const skillsDir = path.join(process.cwd(), "skills");
	if (!fs.existsSync(skillsDir)) {
		console.error(`No skills/ dir at ${skillsDir}`);
		process.exit(1);
	}
	const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
	const skillNames = new Set(skillDirs);
	// Externals: slash-commands that are NOT skills but are valid (pi built-ins,
	// other repos' commands). Extend as needed.
	const externals = new Set([
		"/goal", "/plan", "/build", "/reload", "/restart", "/clear", "/help",
		"/skill", "/memory-consolidate", "/memory-status", "/memory-export",
		"/tree", "/model", "/login", "/logout", "/settings", "/compact",
	]);

	const entries: SkillEntry[] = [];
	for (const name of skillDirs) {
		const p = path.join(skillsDir, name, "SKILL.md");
		if (!fs.existsSync(p)) {
			console.error(`No SKILL.md in skills/${name}/`);
			continue;
		}
		entries.push({ path: `skills/${name}/SKILL.md`, content: fs.readFileSync(p, "utf8") });
	}

	const errors = [
		...validateSkills(entries, skillNames, externals),
		...checkStaleTools(entries),
	];

	if (errors.length === 0) {
		console.log(`✓ all ${entries.length} skills valid (frontmatter + commands + stale-tools)`);
		process.exit(0);
	}
	console.error(`✗ ${errors.length} validation error(s):`);
	for (const e of errors) console.error(`  ${e}`);
	process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace("file://", ""))) {
	main();
}
