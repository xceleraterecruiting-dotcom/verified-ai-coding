#!/usr/bin/env node
/** Deterministic tests for regression-check's pure classification/mutation logic. No git/network. */

import { applyMutation, checkExpectations, classifyFileResult, classifyVitestReport, overallRedVerdict, parseArgs, parseMutationsSpec } from './regression-check.mjs'

let failures = 0
const check = (n, c) => { console.log(`${c ? 'OK  ' : 'MISS'}  ${n}`); if (!c) failures++ }
const throws = (fn) => { try { fn(); return false } catch { return true } }

// parseArgs — mode validation
check('parseArgs requires tests', throws(() => parseArgs(['--mutations', 'm.json'])))
check('parseArgs requires a red mode', throws(() => parseArgs(['--tests', 't.ts'])))
check('parseArgs mutations mode ok', parseArgs(['--tests', 't.ts', '--mutations', 'm.json']).mutations === 'm.json')
check('parseArgs mutations excludes base', throws(() => parseArgs(['--tests', 't.ts', '--mutations', 'm.json', '--base', 'abc'])))
check('parseArgs revert-files requires base', throws(() => parseArgs(['--tests', 't.ts', '--revert-files', 'f.ts'])))
check('parseArgs base mode ok', parseArgs(['--tests', 't.ts', '--base', 'abc']).base === 'abc')

// parseMutationsSpec — legacy array and provenance object shapes
const legacy = parseMutationsSpec('[{"file":"f","find":"a","replace":"b"}]')
check('spec: legacy array accepted, unattributed', legacy.findingId === null && legacy.mutations.length === 1)
const prov = parseMutationsSpec('{"findingId":"B2","invariant":"inv","expectedTests":["t1"],"mutations":[{"file":"f","find":"a","replace":"b"}]}')
check('spec: provenance shape parsed', prov.findingId === 'B2' && prov.expectedTests[0] === 't1')
check('spec: rejects empty mutations', throws(() => parseMutationsSpec('{"mutations":[]}')))
check('spec: rejects mutation missing fields', throws(() => parseMutationsSpec('[{"file":"f"}]')))

// checkExpectations — mutation-validity contract: declared discriminators must fail;
// undeclared failures flag a possibly over-broad mutation
const fr = (names) => [{ failedAssertions: names.map((n) => ({ fullName: n })) }]
const ok = checkExpectations(fr(['B2 suite refuses an amount that does not match']), ['refuses an amount'])
check('expectation: declared discriminator failed → no missing', ok.missing.length === 0 && ok.unexpected.length === 0)
const miss = checkExpectations(fr(['some other test']), ['refuses an amount'])
check('expectation: declared discriminator did not fail → missing', miss.missing.length === 1 && miss.unexpected.length === 1)
const broad = checkExpectations(fr(['refuses an amount', 'unrelated thing broke']), ['refuses an amount'])
check('expectation: undeclared failure flagged as over-broad', broad.missing.length === 0 && broad.unexpected[0] === 'unrelated thing broke')
const noDecl = checkExpectations(fr(['anything']), [])
check('expectation: no declarations → nothing unexpected (legacy)', noDecl.unexpected.length === 0)

// applyMutation — exactly-once contract
check('applyMutation replaces single occurrence', applyMutation('a GUARD b', { file: 'f', find: 'GUARD', replace: 'NOOP' }).content === 'a NOOP b')
check('applyMutation rejects absent find', !!applyMutation('a b', { file: 'f', find: 'GUARD', replace: 'x' }).error)
check('applyMutation rejects ambiguous find', !!applyMutation('GUARD GUARD', { file: 'f', find: 'GUARD', replace: 'x' }).error)
check('applyMutation handles multiline find', applyMutation('l1\nl2\nl3', { file: 'f', find: 'l1\nl2', replace: 'l2\nl1' }).content === 'l2\nl1\nl3')

// classifyFileResult — the STRONG/WEAK/INVALID taxonomy
const assertionFail = {
  status: 'failed',
  assertionResults: [
    { status: 'passed', title: 'ok one', fullName: 'suite > ok one', failureMessages: [] },
    { status: 'failed', title: 'catches bug', fullName: 'suite > catches bug', failureMessages: ['AssertionError: expected x to throw'] },
  ],
}
const r1 = classifyFileResult(assertionFail)
check('assertion failure → STRONG_RED', r1.classification === 'STRONG_RED')
check('STRONG_RED names the discriminating test', r1.failedAssertions[0].fullName === 'suite > catches bug')

const compileFail = {
  status: 'failed', assertionResults: [],
  message: "SyntaxError: The requested module '/src/server/services/payments.ts' does not provide an export named 'PaymentMismatchError'",
}
check('missing-export link error → WEAK_RED_COMPILE', classifyFileResult(compileFail).classification === 'WEAK_RED_COMPILE')
check('unresolved import → WEAK_RED_COMPILE', classifyFileResult({ status: 'failed', assertionResults: [], message: 'Error: Failed to resolve import "./fakes"' }).classification === 'WEAK_RED_COMPILE')

const envFail = { status: 'failed', assertionResults: [], message: "Error: Cannot find package 'vitest'" }
check('missing tooling → INVALID_RED_ENV', classifyFileResult(envFail).classification === 'INVALID_RED_ENV')

check('all passed → NOT_DISCRIMINATING', classifyFileResult({ status: 'passed', assertionResults: [{ status: 'passed' }] }).classification === 'NOT_DISCRIMINATING')
check('opaque failure → UNCLASSIFIED', classifyFileResult({ status: 'failed', assertionResults: [], message: 'something odd' }).classification === 'UNCLASSIFIED')

// classifyVitestReport + path mapping
const report = { testResults: [{ name: '/wt/tests/x.test.ts', status: 'failed', assertionResults: [{ status: 'failed', title: 't', fullName: 't', failureMessages: ['boom'] }] }] }
const mapped = classifyVitestReport(report, (p) => p.replace('/wt/', ''))
check('report maps file paths repo-relative', mapped[0].file === 'tests/x.test.ts' && mapped[0].classification === 'STRONG_RED')

// overallRedVerdict — environmental noise invalidates; compile-only stays weak; never claims
// strong discrimination from a compile failure
check('verdict: strong wins over weak', overallRedVerdict([{ classification: 'STRONG_RED' }, { classification: 'WEAK_RED_COMPILE' }]) === 'STRONG_RED')
check('verdict: env noise invalidates everything', overallRedVerdict([{ classification: 'STRONG_RED' }, { classification: 'INVALID_RED_ENV' }]) === 'INVALID_RED_ENV')
check('verdict: compile-only is weak, never strong', overallRedVerdict([{ classification: 'WEAK_RED_COMPILE' }]) === 'WEAK_RED_COMPILE')
check('verdict: all green red phase → NOT_DISCRIMINATING', overallRedVerdict([{ classification: 'NOT_DISCRIMINATING' }]) === 'NOT_DISCRIMINATING')
check('verdict: empty → UNCLASSIFIED', overallRedVerdict([]) === 'UNCLASSIFIED')

process.exit(failures ? 1 : 0)
