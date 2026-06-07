#!/usr/bin/env node
/**
 * Deterministic smoke test for the isolated-bundle reviewer's FAIL-CLOSED guard.
 *
 * This does NOT call claude. It feeds canned reviewer outputs to evaluateReviewer() and asserts
 * the launcher-side gate behaves correctly — proving the guard fails closed on missing /
 * malformed / forbidden-tool toolset blocks (the probe #4 fail-open hazard). A separate LIVE
 * positive test (`independent-review.mjs <bundle>`) exercises the real reviewer end to end.
 */

import { evaluateReviewer, assertToolset } from './independent-review.mjs'

let failures = 0
function check(name, cond) {
  console.log(`${cond ? 'OK  ' : 'MISS'}  ${name}`)
  if (!cond) failures++
}

const json = (obj) => '```json\n' + JSON.stringify(obj) + '\n```'

// --- POSITIVE: clean restricted toolset + valid verdict -> verdict passes through ---
check(
  'valid PASS with restricted toolset -> PASS',
  evaluateReviewer('here is my review ' + json({ effective_toolset: ['AskUserQuestion', 'ScheduleWakeup', 'ToolSearch'], verdict: 'PASS', blockers: [], suggestions: [], notes: 'ok' })).final === 'PASS',
)
check(
  'valid FAIL with restricted toolset -> FAIL',
  evaluateReviewer(json({ effective_toolset: ['ToolSearch'], verdict: 'FAIL', blockers: ['x'], suggestions: [], notes: '' })).final === 'FAIL',
)

// --- NEGATIVE: fail-open (forbidden tool present) -> INVALID-TOOLSET-MISMATCH ---
check(
  'forbidden Bash in toolset -> INVALID-TOOLSET-MISMATCH (even with verdict PASS)',
  evaluateReviewer(json({ effective_toolset: ['Bash', 'Read', 'ToolSearch'], verdict: 'PASS', blockers: [], suggestions: [], notes: '' })).final === 'INVALID-TOOLSET-MISMATCH',
)
check(
  'forbidden Agent/Workflow -> INVALID-TOOLSET-MISMATCH',
  evaluateReviewer(json({ effective_toolset: ['Agent', 'Workflow'], verdict: 'PASS', blockers: [], suggestions: [], notes: '' })).final === 'INVALID-TOOLSET-MISMATCH',
)

// --- NEGATIVE: missing / malformed toolset block -> INVALID (never NEEDS_REVIEW/PASS) ---
check(
  'no json block at all -> INVALID',
  evaluateReviewer('I reviewed it and it looks fine, PASS').final === 'INVALID',
)
check(
  'malformed json -> INVALID',
  evaluateReviewer('```json\n{verdict: PASS,,}\n```').final === 'INVALID',
)
check(
  'effective_toolset missing -> INVALID-TOOLSET-MISMATCH',
  evaluateReviewer(json({ verdict: 'PASS', blockers: [], suggestions: [] })).final === 'INVALID-TOOLSET-MISMATCH',
)
check(
  'effective_toolset not an array -> INVALID-TOOLSET-MISMATCH',
  evaluateReviewer(json({ effective_toolset: 'ToolSearch', verdict: 'PASS' })).final === 'INVALID-TOOLSET-MISMATCH',
)

// --- NEGATIVE: toolset clean but verdict bogus -> INVALID (no PASS leakage) ---
check(
  'clean toolset, invalid verdict -> INVALID',
  evaluateReviewer(json({ effective_toolset: ['ToolSearch'], verdict: 'SHIP_IT' })).final === 'INVALID',
)

// --- unit: assertToolset directly ---
check('assertToolset clean -> OK', assertToolset({ effective_toolset: ['ToolSearch'] }).status === 'OK')
check('assertToolset forbidden -> MISMATCH', assertToolset({ effective_toolset: ['Write'] }).status === 'INVALID-TOOLSET-MISMATCH')

console.log('')
console.log(failures === 0 ? 'ALL GUARD CASES BEHAVED AS EXPECTED' : `${failures} GUARD CASE(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
