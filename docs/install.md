# Install

Verified AI Coding is markdown-first. There is nothing to build and no dependencies. Installation is: get the two skill folders to where Claude Code looks for skills.

## Where skills must live

Claude Code activates skills from `.claude/skills/` in your project (or `~/.claude/skills/` for global). The repo keeps the skills at `skills/` for clean open-sourcing — the install step is what makes them **active**.

Skills are **auto-discovered** — there's nothing to register or enable. Each `<name>/SKILL.md` is loaded by its folder name and resolves as the slash command `/<name>` (here: `/verified-implementation` and `/ship-review`). The only related toggle is the global off-switch (`--disable-slash-commands`). A **running** session loads skills at startup, so after installing you must **restart Claude Code** for the new skills to appear.

### Heads-up: the skills reference sibling files

Each `SKILL.md` points at supporting files by relative path — `templates/*.md`, `prompts/*.md`, and `agents/reviewer-agent.md` (e.g. "Use `templates/feature-contract.md`"). Those paths are **relative to the repo root**, not to the skill folder. Copying only the two skill folders installs the *workflow* (the steps are written out in full inside each `SKILL.md`), but the fill-in templates and pasteable prompts will not resolve unless `templates/`, `prompts/`, and `agents/` are also reachable from your working directory. See the per-option notes below.

## Option A — copy into an existing project

From your project root:

```bash
mkdir -p .claude/skills
cp -R /path/to/verified-ai-coding/skills/verified-implementation .claude/skills/
cp -R /path/to/verified-ai-coding/skills/ship-review          .claude/skills/
```

You now have:

```
.claude/skills/
  verified-implementation/SKILL.md
  ship-review/SKILL.md
```

Keep `templates/`, `prompts/`, `agents/`, and `docs/` somewhere reachable (e.g. copy the whole repo into your project, or reference it where it lives). The skills point at those paths.

## Option B — build the repo standalone, then copy

Clone/keep this repo as-is for open-sourcing, and copy the two skill folders into any project's `.claude/skills/` when you want them live there. Same two `cp -R` commands.

## Global install (available in every project)

```bash
mkdir -p ~/.claude/skills
cp -R /path/to/verified-ai-coding/skills/verified-implementation ~/.claude/skills/
cp -R /path/to/verified-ai-coding/skills/ship-review          ~/.claude/skills/
```

Then **restart Claude Code**. Both skills are now active in every project and resolve as `/verified-implementation` and `/ship-review`.

Note the sibling-file caveat above: a global skills-only install does **not** carry `templates/`, `prompts/`, or `agents/` to `~/.claude/skills/`, so those references won't open as files. The workflow still runs (it's described in full inside each `SKILL.md`). To use the fill-in templates and pasteable prompts globally, keep a clone of this repo somewhere and open the relevant `templates/`/`prompts/`/`agents/` file by its repo path when a step calls for it — or do a per-project install (Option A) with the whole repo present.

## Verify activation

Start (or restart) Claude Code in the project and ask it to list available skills, or simply ask it to "run verified-implementation on this feature." If the skill is found, it's installed correctly. If not, confirm the path is exactly `.claude/skills/<skill-name>/SKILL.md` and that the YAML frontmatter at the top of each `SKILL.md` is intact.

## Project context (recommended)

Fill in `templates/project-context.md` and drop it at your repo root as `PROJECT-CONTEXT.md` (or fold it into `CLAUDE.md`). `verified-implementation` reads it first, so invariants and file scopes are grounded in your real architecture.

## What "installed" proves vs. what "works" proves

Installing and activating proves the skills **parse and load**. That's necessary, not sufficient. The skills *work* when you run `ship-review` against a real diff on a real codebase and watch it catch something. Do the parse-check here; do the proof on the real repo.
