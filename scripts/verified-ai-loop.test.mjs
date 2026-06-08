#!/usr/bin/env node
/**
 * Deterministic tests for verified-ai-loop. No network, no live Claude (the reviewer is injected),
 * no git mutations (commands use read-only git, exercised here in a non-git temp dir → skipped).
 * Run: node scripts/verified-ai-loop.test.mjs
 */

import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  slugify, hasStubMarker, isFilled, parseAllowedList, findOutsideAllowed, assembleBundle,
  reviewerResultDoc, parseReviewerVerdict, finalDecision, isAssembledBundle,
  cmdNew, cmdStatus, cmdBundle, cmdReview, cmdFinalize,
} from './verified-ai-loop.mjs'

let failures = 0
const check = (name, cond) => { console.log(`${cond ? 'OK  ' : 'MISS'}  ${name}`); if (!cond) failures++ }
const tmp = mkdtempSync(join(tmpdir(), 'vac-loop-test-'))
const fill = (dir, name, body) => writeFileSync(join(dir, name), `# ${name}\n\n${body}\n`)

// --- pure helpers ---
check('slugify', slugify('Fix the Thing!! v2') === 'fix-the-thing-v2')
check('slugify empty -> run', slugify('   ') === 'run')
check('hasStubMarker true on stub', hasStubMarker('# x\n\n> STATUS: fill before code\n'))
check('isFilled false on stub', !isFilled('# x\n\n> STATUS: fill before code\n'))
check('isFilled true on real content', isFilled('# x\n\nreal stuff'))

const allowed = parseAllowedList('## Allowed\n- `src/a.ts`\n- src/lib/\n\n## Forbidden\n- src/z.ts\n')
check('parseAllowedList', allowed.length === 2 && allowed.includes('src/a.ts') && allowed.includes('src/lib/'))
check('findOutsideAllowed', JSON.stringify(findOutsideAllowed(['src/a.ts', 'src/other.ts', 'src/lib/x.ts'], allowed)) === JSON.stringify(['src/other.ts']))

const bundle = assembleBundle({ request: 'R', contract: 'C', enforcementPath: 'E', redteam: 'RT', testOutput: 'TO', diff: 'DIFFTEXT' })
check('assembleBundle has all sections + diff', /## 1. Request/.test(bundle) && /## 8. Deterministic gates/.test(bundle) && bundle.includes('DIFFTEXT'))

const doc = reviewerResultDoc({ final: 'PASS', obj: { effective_toolset: ['ToolSearch'], blockers: [], suggestions: [], notes: 'ok' } })
check('reviewerResultDoc has VERDICT marker', /^VERDICT: PASS/m.test(doc))
check('parseReviewerVerdict round-trips', parseReviewerVerdict(doc) === 'PASS')

check('finalDecision PASS -> pass', finalDecision('PASS', false).pass === true)
check('finalDecision INVALID -> refuse', finalDecision('INVALID', false).pass === false)
check('finalDecision NEEDS_REVIEW no override -> refuse + remediate', (() => { const d = finalDecision('NEEDS_REVIEW', false); return !d.pass && d.needsRemediation })())
check('finalDecision FAIL + override -> pass with remediation noted', (() => { const d = finalDecision('FAIL', true); return d.pass && d.needsRemediation })())

// --- new ---
const n = cmdNew('Recover stuck paid evaluations', { cwd: tmp })
check('new exit 0', n.code === 0)
check('new created 12 files', n.created.length === 12)
check('new files exist on disk', ['request.md', 'contract.md', 'final-scorecard.md', 'pr-body.md'].every((f) => existsSync(join(n.dir, f))))
check('new contract sourced from template', readFileSync(join(n.dir, 'contract.md'), 'utf8').startsWith('# Feature Contract'))
check('new request seeded with title', readFileSync(join(n.dir, 'request.md'), 'utf8').includes('Recover stuck paid evaluations'))
check('new refuses overwrite', cmdNew('Recover stuck paid evaluations', { cwd: tmp }).code === 1)

// --- status detects unfilled stubs ---
const st = cmdStatus(n.dir)
const stState = (name) => st.report.find((r) => r.name === name).state
// inline-stub files report unfilled; template-sourced files (contract/redteam) can't be auto-detected.
check('status flags inline stubs unfilled', st.code === 0 && stState('test-output.md').startsWith('stub') && stState('enforcement-path.md').startsWith('stub'))

// --- bundle refuses unfilled inputs ---
check('bundle refuses while inputs are stubs', cmdBundle(n.dir).code === 1)

// fill the bundle inputs, then bundle should assemble
fill(n.dir, 'contract.md', 'invariant: exactly once')
fill(n.dir, 'enforcement-path.md', 'decision point: guard()')
fill(n.dir, 'redteam-plan.md', 'C1 cross-entrypoint race')
fill(n.dir, 'allowed-forbidden-files.md', '## Allowed\n- src/x.ts\n\n## Forbidden\n- prisma/schema.prisma')
fill(n.dir, 'test-output.md', 'Tests 16 passed (16); slice typecheck clean')
const b = cmdBundle(n.dir)
check('bundle assembles when inputs filled', b.code === 0 && existsSync(join(n.dir, 'review-bundle.md')))
check('assembled bundle carries the assembled marker', isAssembledBundle(readFileSync(join(n.dir, 'review-bundle.md'), 'utf8')))

// --- review with injected fake reviewer (no live Claude) ---
const fakeReviewer = (verdict) => () => ({ final: verdict, obj: { effective_toolset: ['ToolSearch'], blockers: [], suggestions: [], notes: 't' } })
check('review PASS -> code 0', cmdReview(n.dir, { runReview: fakeReviewer('PASS') }).code === 0)
check('review writes reviewer-result.md', existsSync(join(n.dir, 'reviewer-result.md')))
const rInvalid = cmdReview(n.dir, { runReview: fakeReviewer('INVALID') })
check('review INVALID -> fail closed (code 1)', rInvalid.code === 1 && rInvalid.failClosed === true)
check('review NEEDS_REVIEW -> code 1, not fail-closed', (() => { const r = cmdReview(n.dir, { runReview: fakeReviewer('NEEDS_REVIEW') }); return r.code === 1 && !r.failClosed })())

// --- finalize ---
writeFileSync(join(n.dir, 'reviewer-result.md'), 'VERDICT: PASS\n')
const fPass = cmdFinalize(n.dir, {})
check('finalize PASS -> pass + scorecard + pr-body', fPass.pass === true && existsSync(join(n.dir, 'final-scorecard.md')) && existsSync(join(n.dir, 'pr-body.md')))
writeFileSync(join(n.dir, 'reviewer-result.md'), 'VERDICT: INVALID\n')
check('finalize refuses INVALID', cmdFinalize(n.dir, {}).pass === false)
writeFileSync(join(n.dir, 'reviewer-result.md'), 'VERDICT: NEEDS_REVIEW\n')
check('finalize refuses NEEDS_REVIEW without override + writes remediation', (() => { const f = cmdFinalize(n.dir, {}); return f.pass === false && existsSync(join(n.dir, 'remediation-plan.md')) })())
check('finalize allows NEEDS_REVIEW with explicit override', cmdFinalize(n.dir, { override: 'accepted by lead, low risk' }).pass === true)

// --- safety: scripts never invoke destructive git / gh / deploy ---
const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, 'verified-ai-loop.mjs'), 'utf8') + readFileSync(join(here, 'install-global.mjs'), 'utf8')
const gitSubs = [...src.matchAll(/execFileSync\(\s*'git',\s*\[\s*'([a-z-]+)'/g)].map((m) => m[1])
check('only read-only git subcommands used', gitSubs.every((s) => ['rev-parse', 'diff', 'status', 'ls-files'].includes(s)))
check('no gh / git commit / push / merge / deploy invocation', !/execFileSync\(\s*'gh'|'git',\s*\[\s*'(commit|push|merge)'|\bvercel\b.*deploy/.test(src))

rmSync(tmp, { recursive: true, force: true })
console.log('')
console.log(failures === 0 ? 'ALL VERIFIED-AI-LOOP CASES PASSED' : `${failures} CASE(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
