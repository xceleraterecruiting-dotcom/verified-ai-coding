#!/usr/bin/env node
/**
 * Mechanical allowed-files scope gate.
 *
 * Verifies the current git diff only touches files listed under the run's allowed scope, and
 * touches nothing under its forbidden scope. This is NOT a security sandbox — it is a mechanical
 * scope check that catches a slice quietly editing files it was not supposed to.
 *
 *   "Allowed-files is not guidance; it is a gate."
 *
 *   node scripts/check-allowed-files.mjs .verified-ai/runs/<run-dir>/allowed-forbidden-files.md
 *
 * No dependencies. Read-only git.
 */

import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Parse bullet entries under a "## <heading>" section of the allowed-forbidden file. Pure. */
export function parseSection(content, heading) {
  const out = []
  let inSection = false
  for (const line of content.split('\n')) {
    if (new RegExp(`^##\\s+${heading}`, 'i').test(line)) { inSection = true; continue }
    if (/^##\s+/.test(line)) { inSection = false; continue }
    if (!inSection) continue
    const m = line.match(/^\s*[-*]\s+`?([^`\s][^`]*?)`?\s*$/)
    if (m && m[1] && m[1] !== '-') out.push(m[1].trim())
  }
  return out
}

/** Conservative match: exact file, dir prefix ("a/b/" or bare "a/b"), or simple glob. Pure. */
export function matchesPattern(file, pat) {
  if (!pat) return false
  if (file === pat) return true
  if (pat.endsWith('/')) return file.startsWith(pat)
  if (pat.includes('*')) {
    const re = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*+/g, '.*') + '$')
    return re.test(file)
  }
  return file.startsWith(pat + '/')
}

/** Classify changed files against allowed/forbidden patterns. Pure. Forbidden wins. */
export function classify(changed, allowed, forbidden) {
  const allowedMatches = []
  const violations = []
  for (const f of changed) {
    if (forbidden.some((p) => matchesPattern(f, p))) { violations.push({ file: f, reason: 'forbidden' }); continue }
    if (allowed.some((p) => matchesPattern(f, p))) { allowedMatches.push(f); continue }
    violations.push({ file: f, reason: 'not in allowed list' })
  }
  return { allowedMatches, violations }
}

function gitChangedFiles() {
  const set = new Set()
  const add = (args) => { try { execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean).forEach((f) => set.add(f)) } catch {} }
  add(['diff', '--name-only', 'HEAD'])
  add(['diff', '--name-only'])
  add(['ls-files', '--others', '--exclude-standard'])
  return [...set].filter((f) => !f.startsWith('.verified-ai/'))
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const afPath = process.argv[2]
  if (!afPath || !existsSync(afPath)) {
    console.error('usage: check-allowed-files.mjs <run-dir>/allowed-forbidden-files.md')
    process.exit(2)
  }
  const content = readFileSync(afPath, 'utf8')
  const allowed = parseSection(content, 'Allowed')
  const forbidden = parseSection(content, 'Forbidden')
  if (!allowed.length) {
    console.error(`no Allowed patterns found in ${afPath} — fill the Allowed section first`)
    process.exit(2)
  }
  const changed = gitChangedFiles()
  const { allowedMatches, violations } = classify(changed, allowed, forbidden)

  console.log('changed files:'); changed.forEach((f) => console.log('  ' + f))
  console.log('allowed matches:'); allowedMatches.forEach((f) => console.log('  ' + f))
  console.log('violations:'); violations.forEach((v) => console.log(`  ${v.file} (${v.reason})`))
  console.log(violations.length === 0
    ? 'PASS — all changed files within allowed scope'
    : `FAIL — ${violations.length} file(s) outside allowed scope`)
  console.log('(mechanical scope check, not a security sandbox)')
  process.exit(violations.length === 0 ? 0 : 1)
}
