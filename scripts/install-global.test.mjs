#!/usr/bin/env node
/**
 * Deterministic tests for the installer's pure path-rewrite + extraction logic.
 * Does NOT perform a real install (no writes to ~/.claude or ~/.verified-ai-coding), no git,
 * no network. Run: node scripts/install-global.test.mjs
 */

import { rewriteReferences, extractRewrittenPaths } from './install-global.mjs'

const VAC = '/home/u/.verified-ai-coding'
let failures = 0
function check(name, cond) {
  console.log(`${cond ? 'OK  ' : 'MISS'}  ${name}`)
  if (!cond) failures++
}

// --- rewrite: relative support refs -> absolute VAC paths ---
check(
  'rewrites a backticked templates ref',
  rewriteReferences('Use `templates/feature-contract.md`.', VAC) === 'Use `' + VAC + '/templates/feature-contract.md`.',
)
check(
  'rewrites prompts / scripts / agents / examples (.md and .mjs)',
  rewriteReferences(
    'see prompts/cold-reviewer.md and scripts/independent-review.mjs and agents/reviewer-agent.md and examples/independent-review-sample/bundle.md',
    VAC,
  ) ===
    `see ${VAC}/prompts/cold-reviewer.md and ${VAC}/scripts/independent-review.mjs and ${VAC}/agents/reviewer-agent.md and ${VAC}/examples/independent-review-sample/bundle.md`,
)

// --- must NOT rewrite: probe/ (informational) and bare prose words ---
check('does NOT rewrite probe/ references', rewriteReferences('see probe/results-foo.md', VAC) === 'see probe/results-foo.md')
check(
  'does NOT rewrite the bare word "templates" in prose',
  rewriteReferences('fill in the templates and prompts', VAC) === 'fill in the templates and prompts',
)
check(
  'does NOT double-rewrite an already-absolute path',
  rewriteReferences(`already ${VAC}/templates/x.md`, VAC) === `already ${VAC}/templates/x.md`,
)

// --- extract: returns the rewritten absolute paths for validation ---
const rewritten = rewriteReferences('a `templates/test-plan.md` and prompts/bounded-remediation.md and probe/results.md', VAC)
const paths = extractRewrittenPaths(rewritten, VAC)
check('extract finds the two rewritten paths', paths.length === 2)
check('extract includes the templates path', paths.includes(`${VAC}/templates/test-plan.md`))
check('extract excludes probe/ (never rewritten)', !paths.some((p) => p.includes('probe/')))

console.log('')
console.log(failures === 0 ? 'ALL INSTALLER LOGIC CASES PASSED' : `${failures} CASE(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
