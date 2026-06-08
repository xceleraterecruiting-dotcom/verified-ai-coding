#!/usr/bin/env node
/**
 * Self-contained global installer for Verified AI Coding (v0.4, Phase 1).
 *
 * Approach A: copy support files into ~/.verified-ai-coding/ and install the skills into
 * ~/.claude/skills/, REWRITING each SKILL.md's relative references (templates/ prompts/ scripts/
 * agents/ examples/) to absolute ~/.verified-ai-coding/ paths so the skills resolve from any
 * working directory — not just when this repo is open. Every rewritten path is validated to exist
 * before anything is written; a broken reference fails the install loudly.
 *
 * Evidence pointers (probe/…) are intentionally left repo-relative — informational, not workflow
 * dependencies. The proven fresh-context reviewer config is untouched: scripts/ and prompts/ are
 * copied adjacent in ~/.verified-ai-coding so independent-review.mjs still finds its prompt.
 *
 * No dependencies. Flags: --dry-run, --uninstall. Idempotent.
 *   node scripts/install-global.mjs [--dry-run] [--uninstall]
 */

import { existsSync, cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const VAC_HOME = process.env.VAC_HOME || join(homedir(), '.verified-ai-coding')
const CLAUDE_SKILLS = join(homedir(), '.claude', 'skills')

/** Support dirs copied verbatim into ~/.verified-ai-coding (structure preserved). */
const COPY_DIRS = ['templates', 'prompts', 'scripts', 'agents', 'examples/independent-review-sample']
/** Skills installed into ~/.claude/skills with references rewritten. */
const SKILLS = ['verified-implementation', 'ship-review', 'independent-ship-review']
/** Reference prefixes rewritten to absolute VAC_HOME paths. (probe/ is left relative on purpose.) */
const REWRITE_RE = /(?<![\w/])(templates|prompts|scripts|agents|examples)\/([A-Za-z0-9._/-]+\.(?:md|mjs))/g

/** Rewrite relative support references in a SKILL.md to absolute VAC_HOME paths. Pure. */
export function rewriteReferences(content, vacHome) {
  return content.replace(REWRITE_RE, (_m, prefix, rest) => `${vacHome}/${prefix}/${rest}`)
}

/** Return the absolute VAC_HOME paths a rewritten SKILL.md now references. Pure. */
export function extractRewrittenPaths(content, vacHome) {
  const out = []
  const re = new RegExp(`${vacHome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[A-Za-z0-9._/-]+\\.(?:md|mjs)`, 'g')
  let m
  while ((m = re.exec(content)) !== null) out.push(m[0])
  return [...new Set(out)]
}

/** Map an absolute VAC_HOME path back to its repo-source path (for pre-write validation). */
function vacPathToRepo(vacPath, vacHome) {
  return join(REPO_ROOT, vacPath.slice(vacHome.length + 1))
}

function log(dry, msg) {
  console.log(`${dry ? '[dry-run] ' : ''}${msg}`)
}

function uninstall(dry) {
  for (const name of SKILLS) {
    const dest = join(CLAUDE_SKILLS, name)
    if (existsSync(dest)) {
      log(dry, `remove skill ${dest}`)
      if (!dry) rmSync(dest, { recursive: true, force: true })
    }
  }
  if (existsSync(VAC_HOME)) {
    log(dry, `remove support home ${VAC_HOME}`)
    if (!dry) rmSync(VAC_HOME, { recursive: true, force: true })
  }
  console.log('Uninstall complete.' + (dry ? ' (dry-run — nothing changed)' : ''))
}

function install(dry) {
  // 1. Compute rewritten skill contents and VALIDATE every reference resolves BEFORE writing.
  const planned = []
  const problems = []
  for (const name of SKILLS) {
    const src = join(REPO_ROOT, 'skills', name, 'SKILL.md')
    if (!existsSync(src)) {
      problems.push(`missing source skill: ${src}`)
      continue
    }
    const rewritten = rewriteReferences(readFileSync(src, 'utf8'), VAC_HOME)
    for (const abs of extractRewrittenPaths(rewritten, VAC_HOME)) {
      if (!existsSync(vacPathToRepo(abs, VAC_HOME))) {
        problems.push(`${name}: reference will not resolve -> ${abs} (no source ${vacPathToRepo(abs, VAC_HOME)})`)
      }
    }
    planned.push({ name, dest: join(CLAUDE_SKILLS, name, 'SKILL.md'), rewritten })
  }
  if (problems.length) {
    console.error('INSTALL ABORTED — broken references (nothing written):')
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }

  // 2. Copy support dirs into VAC_HOME.
  for (const rel of COPY_DIRS) {
    const from = join(REPO_ROOT, rel)
    const to = join(VAC_HOME, rel)
    if (!existsSync(from)) continue
    log(dry, `copy ${rel}/ -> ${to}`)
    if (!dry) {
      mkdirSync(dirname(to), { recursive: true })
      cpSync(from, to, { recursive: true })
    }
  }

  // 3. Write each rewritten SKILL.md into ~/.claude/skills/<name>/.
  for (const { name, dest, rewritten } of planned) {
    log(dry, `install skill ${name} -> ${dest} (references rewritten + validated)`)
    if (!dry) {
      mkdirSync(dirname(dest), { recursive: true })
      writeFileSync(dest, rewritten)
    }
  }

  console.log('')
  console.log(`Installed ${SKILLS.length} skills + support files.` + (dry ? ' (dry-run — nothing changed)' : ''))
  console.log(`  support home: ${VAC_HOME}`)
  console.log(`  skills:       ${CLAUDE_SKILLS}/{${SKILLS.join(', ')}}`)
  console.log('Note: restart Claude Code to pick up newly installed skills.')
  console.log('Note: probe/ evidence references remain repo-relative (informational, not rewritten).')
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dry = process.argv.includes('--dry-run')
  if (process.argv.includes('--uninstall')) uninstall(dry)
  else install(dry)
}
