#!/usr/bin/env node
/** Deterministic tests for make-bundle's pure parsing/classification/summary functions. No git/network. */

import { addedFiles, buildSummary, classifyPorcelain, parseArgs, parseCaptureSpec, sha256 } from './make-bundle.mjs'

let failures = 0
const check = (n, c) => { console.log(`${c ? 'OK  ' : 'MISS'}  ${n}`); if (!c) failures++ }
const throws = (fn) => { try { fn(); return false } catch { return true } }

// parseArgs
const a = parseArgs(['--base', 'abc', '--out', '/tmp/x', '--include-untracked', 'f1', '--include-untracked', 'f2', '--capture', 'tests:npm test', '--allow-dirty'])
check('parseArgs base/out', a.base === 'abc' && a.out === '/tmp/x')
check('parseArgs head defaults to HEAD', a.head === 'HEAD')
check('parseArgs repeatable include-untracked', a.includeUntracked.length === 2)
check('parseArgs capture + allow-dirty', a.capture.length === 1 && a.allowDirty === true)
check('parseArgs requires --base', throws(() => parseArgs(['--out', '/tmp/x'])))
check('parseArgs requires --out', throws(() => parseArgs(['--base', 'abc'])))
check('parseArgs rejects unknown flag', throws(() => parseArgs(['--base', 'a', '--out', 'b', '--bogus'])))
check('parseArgs rejects dangling value flag', throws(() => parseArgs(['--base'])))

// classifyPorcelain — the round-2 lesson: untracked files are NOT dirt, but must be listed
const p = classifyPorcelain(' M src/app.ts\n?? tests/new.test.ts\nA  staged.ts\n?? docs/\n')
check('classifyPorcelain dirty tracked excludes untracked', p.dirtyTracked.length === 2)
check('classifyPorcelain untracked paths extracted', p.untracked.length === 2 && p.untracked.includes('tests/new.test.ts'))
check('classifyPorcelain empty input', classifyPorcelain('').dirtyTracked.length === 0)

// addedFiles — new files in the range get full-content embedding
const ns = 'A\ttests/portal-blockers.test.ts\nM\tsrc/services/payments.ts\nD\tsrc/old.ts\nA\tsrc/components/Ticker.tsx\n'
const added = addedFiles(ns)
check('addedFiles picks only A-status', added.length === 2 && added.includes('tests/portal-blockers.test.ts'))

// parseCaptureSpec
const cap = parseCaptureSpec('typecheck:npx tsc --noEmit')
check('parseCaptureSpec splits on first colon', cap.label === 'typecheck' && cap.command === 'npx tsc --noEmit')
check('parseCaptureSpec keeps colons in command', parseCaptureSpec('t:a:b').command === 'a:b')
check('parseCaptureSpec rejects missing label', throws(() => parseCaptureSpec(':npm test')))
check('parseCaptureSpec rejects bad label chars', throws(() => parseCaptureSpec('my label:npm test')))

// sha256 — stable, content-addressed
check('sha256 deterministic', sha256('abc') === sha256('abc') && sha256('abc') !== sha256('abd'))
check('sha256 known vector', sha256('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')

// buildSummary
const manifest = {
  repo: '/r', createdAt: 't', trackedTreeDirty: false,
  base: { ref: 'a867337', sha: 'a867337deadbeef' }, head: { ref: 'HEAD', sha: '15e5fbbdeadbeef' },
  captures: [{ label: 'tests', command: 'npm test', exitCode: 0 }],
  files: [{ path: 'diff.patch', role: 'diff', bytes: 10, lines: 2, sha256: 'ab'.repeat(32) }],
}
const summary = buildSummary(manifest, 'A\tx.ts\n', ['un.txt'])
check('summary names the range', summary.includes('a867337') && summary.includes('15e5fbb'))
check('summary lists files with hash prefix', summary.includes('diff.patch') && summary.includes('abababababab'))
check('summary lists untracked', summary.includes('un.txt'))
check('summary lists captures with exit code', summary.includes('npm test') && summary.includes('exit 0'))

process.exit(failures ? 1 : 0)
