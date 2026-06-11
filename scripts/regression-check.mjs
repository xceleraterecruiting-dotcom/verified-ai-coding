#!/usr/bin/env node
/**
 * Red/green regression verification — proves a regression test DISCRIMINATES the fix.
 *
 * "RED on the old commit" is not enough: when a fix changes interfaces, the new tests fail on the
 * base commit with compile/link errors, which proves only that the tests are new — not that they
 * catch the original bug. This tool runs the red phase and classifies WHY it was red:
 *
 *   STRONG_RED          test compiled, ran, and failed by ASSERTION — it discriminates
 *   WEAK_RED_COMPILE    test failed to load (import/transform/syntax) — proves novelty, not power
 *   INVALID_RED_ENV     failure smells environmental (missing deps/tooling), not behavioral
 *   NOT_DISCRIMINATING  test passed in the red phase — it does not catch this bug
 *   UNCLASSIFIED        could not parse the runner output; raw logs preserved
 *
 * Red-phase modes (one required):
 *   --mutations <spec.json>   PREFERRED. Apply counter-mutations (exact find→replace edits that
 *                             reintroduce the bug under current interfaces) to a HEAD worktree.
 *                             Spec: [{ "file": "...", "find": "...", "replace": "...", "why": "..." }]
 *                             Each `find` must occur exactly once. Hashes recorded before/after.
 *   --base <sha>              Checkout base, copy the test files (+ --support-files) from head.
 *                             Expect WEAK_RED_COMPILE when the fix changed interfaces.
 *   --base <sha> --revert-files <p>...  HEAD worktree with selected files reverted to base.
 *
 * A green phase (clean HEAD worktree, same tests, must pass) always runs unless --skip-green.
 *
 *   node scripts/regression-check.mjs --repo <path> --tests <file>... --mutations spec.json \
 *     [--head HEAD] [--test-command 'npx vitest run'] [--out <dir>] [--allow-dirty] [--keep-worktrees]
 *
 * Safety: throwaway `git worktree`s under the OS tmpdir (node_modules symlinked from the repo),
 * removed afterwards; never commits; never touches the main working tree; refuses a dirty tracked
 * tree without --allow-dirty. Emits result.json + result.md. Vitest-aware (JSON reporter); other
 * runners fall back to UNCLASSIFIED with raw output preserved. No dependencies.
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const CLASSIFICATIONS = ['STRONG_RED', 'WEAK_RED_COMPILE', 'INVALID_RED_ENV', 'NOT_DISCRIMINATING', 'UNCLASSIFIED']

/** Parse CLI arguments. Pure. Throws on invalid combinations. */
export function parseArgs(argv) {
  const args = {
    repo: process.cwd(), head: 'HEAD', base: null, tests: [], supportFiles: [], revertFiles: [],
    mutations: null, testCommand: 'npx vitest run', out: null, allowDirty: false, skipGreen: false, keepWorktrees: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} requires a value`)
      return argv[++i]
    }
    if (a === '--repo') args.repo = next()
    else if (a === '--head') args.head = next()
    else if (a === '--base') args.base = next()
    else if (a === '--tests') args.tests.push(next())
    else if (a === '--support-files') args.supportFiles.push(next())
    else if (a === '--revert-files') args.revertFiles.push(next())
    else if (a === '--mutations') args.mutations = next()
    else if (a === '--test-command') args.testCommand = next()
    else if (a === '--out') args.out = next()
    else if (a === '--allow-dirty') args.allowDirty = true
    else if (a === '--skip-green') args.skipGreen = true
    else if (a === '--keep-worktrees') args.keepWorktrees = true
    else throw new Error(`unknown argument: ${a}`)
  }
  if (args.tests.length === 0) throw new Error('--tests is required (at least one test file)')
  if (!args.mutations && !args.base) throw new Error('a red-phase mode is required: --mutations <spec.json> or --base <sha>')
  if (args.mutations && (args.base || args.revertFiles.length)) throw new Error('--mutations cannot be combined with --base/--revert-files')
  if (args.revertFiles.length && !args.base) throw new Error('--revert-files requires --base')
  return args
}

/** Apply one counter-mutation to file content. Pure. `find` must occur exactly once. */
export function applyMutation(content, mutation) {
  const first = content.indexOf(mutation.find)
  if (first === -1) return { error: `mutation find-string not present in ${mutation.file}` }
  if (content.indexOf(mutation.find, first + 1) !== -1) {
    return { error: `mutation find-string occurs more than once in ${mutation.file} — make it unique` }
  }
  return { content: content.slice(0, first) + mutation.replace + content.slice(first + mutation.find.length) }
}

const COMPILE_MARKERS = /Failed to resolve import|does not provide an export|Cannot find module(?! ')|Transform failed|SyntaxError|Unexpected token|Failed to load|ERR_MODULE_NOT_FOUND/
const ENV_MARKERS = /Cannot find package|command not found|ENOENT.*(?:npx|vitest|node_modules)|EADDRINUSE|MODULE_NOT_FOUND.*node_modules/

/**
 * Classify one vitest JSON-reporter testResult (one test FILE). Pure.
 * Assertion-level failures are the only failures that count as STRONG_RED.
 */
export function classifyFileResult(tr) {
  const assertions = tr.assertionResults ?? []
  const failed = assertions.filter((a) => a.status === 'failed')
  if (tr.status === 'passed') return { classification: 'NOT_DISCRIMINATING', failedAssertions: [] }
  if (failed.length > 0) {
    return {
      classification: 'STRONG_RED',
      failedAssertions: failed.map((a) => ({
        fullName: a.fullName ?? a.title,
        message: String((a.failureMessages ?? [])[0] ?? '').split('\n').slice(0, 3).join(' ').slice(0, 300),
      })),
    }
  }
  const message = String(tr.message ?? '')
  if (ENV_MARKERS.test(message)) return { classification: 'INVALID_RED_ENV', failedAssertions: [], message: message.slice(0, 500) }
  if (COMPILE_MARKERS.test(message)) return { classification: 'WEAK_RED_COMPILE', failedAssertions: [], message: message.slice(0, 500) }
  return { classification: 'UNCLASSIFIED', failedAssertions: [], message: message.slice(0, 500) }
}

/** Classify a whole vitest JSON report into per-file results. Pure. */
export function classifyVitestReport(report, repoRelative) {
  const results = []
  for (const tr of report.testResults ?? []) {
    const file = repoRelative ? repoRelative(tr.name) : tr.name
    results.push({ file, ...classifyFileResult(tr) })
  }
  return results
}

/**
 * Overall red-phase verdict. Pure.
 * STRONG_RED needs at least one assertion-level failure and no environmental noise; a red phase
 * where every targeted test passed proves the tests do NOT discriminate the reintroduced bug.
 */
export function overallRedVerdict(fileResults) {
  if (fileResults.length === 0) return 'UNCLASSIFIED'
  const counts = Object.fromEntries(CLASSIFICATIONS.map((c) => [c, 0]))
  for (const r of fileResults) counts[r.classification]++
  if (counts.INVALID_RED_ENV > 0) return 'INVALID_RED_ENV'
  if (counts.STRONG_RED > 0) return 'STRONG_RED'
  if (counts.WEAK_RED_COMPILE > 0) return 'WEAK_RED_COMPILE'
  if (counts.UNCLASSIFIED > 0) return 'UNCLASSIFIED'
  return 'NOT_DISCRIMINATING'
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

function git(repo, gitArgs) {
  return execFileSync('git', ['-C', repo, ...gitArgs], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

function fail(msg) {
  console.error(`regression-check: error: ${msg}`)
  process.exit(1)
}

function makeWorktree(repo, sha, root, name) {
  const dir = join(root, name)
  git(repo, ['worktree', 'add', '--detach', dir, sha])
  const nm = join(repo, 'node_modules')
  if (existsSync(nm)) symlinkSync(nm, join(dir, 'node_modules'), 'dir')
  return dir
}

function removeWorktree(repo, dir) {
  try {
    git(repo, ['worktree', 'remove', '--force', dir])
  } catch {
    /* best effort; prune below */
  }
  try {
    git(repo, ['worktree', 'prune'])
  } catch { /* ignore */ }
}

function runTests(worktree, testCommand, tests, jsonPath, logPath) {
  const isVitest = /vitest/.test(testCommand)
  const cmd = isVitest
    ? `${testCommand} --reporter=json --outputFile=${jsonPath} ${tests.join(' ')}`
    : `${testCommand} ${tests.join(' ')}`
  const res = spawnSync('sh', ['-c', cmd], { cwd: worktree, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  writeFileSync(logPath, `$ ${cmd}\n(exit ${res.status})\n\n--- stdout ---\n${res.stdout ?? ''}\n--- stderr ---\n${res.stderr ?? ''}`)
  let report = null
  if (isVitest && existsSync(jsonPath)) {
    try {
      report = JSON.parse(readFileSync(jsonPath, 'utf8'))
    } catch { /* leave null → UNCLASSIFIED */ }
  }
  return { exitCode: res.status, report }
}

export function main(argv) {
  let args
  try {
    args = parseArgs(argv)
  } catch (e) {
    fail(e.message)
  }
  const repo = resolve(args.repo)

  let headSha, baseSha = null
  try {
    headSha = git(repo, ['rev-parse', '--verify', `${args.head}^{commit}`]).trim()
    if (args.base) baseSha = git(repo, ['rev-parse', '--verify', `${args.base}^{commit}`]).trim()
  } catch {
    fail(`cannot resolve --head ${args.head}${args.base ? ` / --base ${args.base}` : ''} to commits`)
  }

  const dirty = git(repo, ['status', '--porcelain']).split('\n').filter((l) => l && !l.startsWith('??'))
  if (dirty.length > 0 && !args.allowDirty) {
    fail(`tracked working tree is dirty (${dirty.length} paths); commit/stash or pass --allow-dirty`)
  }

  let mutations = null
  if (args.mutations) {
    try {
      mutations = JSON.parse(readFileSync(resolve(args.mutations), 'utf8'))
    } catch (e) {
      fail(`cannot read mutations spec ${args.mutations}: ${e.message}`)
    }
    if (!Array.isArray(mutations) || mutations.length === 0) fail('mutations spec must be a non-empty array')
    for (const m of mutations) {
      if (!m.file || !m.find || m.replace === undefined) fail('each mutation needs file, find, replace')
    }
  }

  const out = resolve(args.out ?? mkdtempSync(join(tmpdir(), 'regression-check-out-')))
  mkdirSync(out, { recursive: true })
  const wtRoot = mkdtempSync(join(tmpdir(), 'regression-check-wt-'))
  const worktrees = []

  const mode = mutations ? 'mutations' : args.revertFiles.length ? 'revert-files' : 'base'
  const result = {
    tool: 'verified-ai-coding/regression-check',
    createdAt: new Date().toISOString(),
    argv,
    repo,
    head: { ref: args.head, sha: headSha },
    base: baseSha ? { ref: args.base, sha: baseSha } : null,
    mode,
    tests: args.tests,
    green: null,
    red: null,
  }

  try {
    // GREEN phase: clean HEAD worktree, the tests must pass
    if (!args.skipGreen) {
      const wt = makeWorktree(repo, headSha, wtRoot, 'green')
      worktrees.push(wt)
      const { exitCode, report } = runTests(wt, args.testCommand, args.tests, join(out, 'vitest-green.json'), join(out, 'green.log'))
      const fileResults = report ? classifyVitestReport(report, (p) => relative(wt, p)) : []
      result.green = {
        exitCode,
        pass: exitCode === 0,
        files: fileResults.map((r) => ({ file: r.file, classification: r.classification === 'NOT_DISCRIMINATING' ? 'GREEN' : r.classification })),
      }
    }

    // RED phase
    let redWt
    const applied = []
    if (mode === 'mutations') {
      redWt = makeWorktree(repo, headSha, wtRoot, 'red')
      for (const m of mutations) {
        const abs = join(redWt, m.file)
        if (!existsSync(abs)) fail(`mutation target does not exist at head: ${m.file}`)
        const before = readFileSync(abs, 'utf8')
        const mutated = applyMutation(before, m)
        if (mutated.error) fail(mutated.error)
        writeFileSync(abs, mutated.content)
        applied.push({ file: m.file, why: m.why ?? null, find: m.find, replace: m.replace, sha256Before: sha256(before), sha256After: sha256(mutated.content) })
      }
    } else if (mode === 'revert-files') {
      redWt = makeWorktree(repo, headSha, wtRoot, 'red')
      for (const f of args.revertFiles) {
        const content = git(repo, ['show', `${baseSha}:${f}`])
        writeFileSync(join(redWt, f), content)
        applied.push({ file: f, revertedTo: baseSha })
      }
    } else {
      redWt = makeWorktree(repo, baseSha, wtRoot, 'red')
      for (const f of [...args.tests, ...args.supportFiles]) {
        const content = git(repo, ['show', `${headSha}:${f}`])
        const abs = join(redWt, f)
        mkdirSync(dirname(abs), { recursive: true })
        writeFileSync(abs, content)
        applied.push({ file: f, copiedFrom: headSha })
      }
    }
    worktrees.push(redWt)

    const { exitCode, report } = runTests(redWt, args.testCommand, args.tests, join(out, 'vitest-red.json'), join(out, 'red.log'))
    const fileResults = report ? classifyVitestReport(report, (p) => relative(redWt, p)) : args.tests.map((t) => ({ file: t, classification: 'UNCLASSIFIED', failedAssertions: [] }))
    result.red = { exitCode, applied, files: fileResults, verdict: overallRedVerdict(fileResults) }
  } finally {
    if (!args.keepWorktrees) {
      for (const wt of worktrees) removeWorktree(repo, wt)
      rmSync(wtRoot, { recursive: true, force: true })
    }
  }

  const discriminating = (result.red.files ?? []).filter((r) => r.classification === 'STRONG_RED')
  let verdictLine =
    result.red.verdict === 'STRONG_RED' && (args.skipGreen || result.green?.pass)
      ? `STRONG_RED — ${discriminating.reduce((n, r) => n + r.failedAssertions.length, 0)} assertion(s) discriminate the fix${args.skipGreen ? ' (green phase skipped)' : ', GREEN on fixed HEAD'}`
      : `${result.red.verdict}${result.green && !result.green.pass ? ' — WARNING: green phase failed; fix the suite before trusting any red' : ''}`
  if (mode === 'base') {
    // Fixture-proven (proof-08): esbuild does not enforce named exports, so head tests on a base
    // worktree can BOTH spuriously fail (TypeError on undefined) and spuriously pass
    // (toThrowError(undefined) accepts any error). Base-mode is advisory, never proof-grade.
    verdictLine += ' [ADVISORY: base-mode results are contaminated by missing-export→undefined degradation in both directions; use --mutations for proof-grade RED]'
  }
  result.verdict = verdictLine

  writeFileSync(join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  const md = [
    '# Regression check',
    '',
    `- Repo: ${repo}`,
    `- Head: ${args.head} (${headSha.slice(0, 7)})${baseSha ? ` · Base: ${args.base} (${baseSha.slice(0, 7)})` : ''}`,
    `- Mode: ${mode}`,
    `- Tests: ${args.tests.join(', ')}`,
    '',
    `## Verdict: ${verdictLine}`,
    '',
    `## Green phase ${args.skipGreen ? '(skipped)' : result.green.pass ? '— PASS' : '— FAIL'}`,
    '',
    `## Red phase (${mode})`,
    '',
    ...result.red.applied.map((a) => `- applied: ${JSON.stringify(a)}`),
    '',
    ...result.red.files.map((r) =>
      [
        `### ${r.file} — ${r.classification}`,
        ...(r.failedAssertions ?? []).map((f) => `- ✗ ${f.fullName}: ${f.message}`),
        ...(r.message ? [`- note: ${r.message}`] : []),
      ].join('\n'),
    ),
    '',
    'Raw logs: green.log / red.log; reporter JSON alongside.',
  ].join('\n')
  writeFileSync(join(out, 'result.md'), md)

  console.log(`regression-check: ${verdictLine}`)
  console.log(`results: ${out}`)
  if (result.red.verdict === 'INVALID_RED_ENV' || (result.green && !result.green.pass)) process.exit(2)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) main(process.argv.slice(2))
