#!/usr/bin/env node
/**
 * verified-ai-loop — local verification-loop orchestrator (v0.4).
 *
 * Scaffolds run artifacts, validates them, assembles a cold-review bundle, runs the existing
 * fresh-context isolated-bundle reviewer, and drafts the scorecard + PR body. It is an
 * ORCHESTRATOR, not an agent: it never implements code, runs tests, commits, opens PRs, merges,
 * deploys, or calls external APIs. Git access is read-only (diff/status). No dependencies.
 *
 *   new "<title>"      scaffold .verified-ai/runs/<date>-<slug>/
 *   status <run-dir>   report which artifacts are filled; warn on changes outside allowed files
 *   bundle <run-dir>   validate inputs, capture diff, assemble review-bundle.md
 *   review <run-dir>   run the fresh-context reviewer, write reviewer-result.md (fail closed on INVALID)
 *   finalize <run-dir> draft final-scorecard.md + pr-body.md (refuses PASS unless reviewer PASS)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = resolve(HERE, '..', 'templates')

const PRE_CODE = ['request.md', 'contract.md', 'enforcement-path.md', 'redteam-plan.md', 'implementation-plan.md', 'allowed-forbidden-files.md']
const BUNDLE_INPUTS = ['contract.md', 'enforcement-path.md', 'redteam-plan.md', 'allowed-forbidden-files.md', 'test-output.md']
const ALLOWED_RESIDUAL_TOOLS = '`AskUserQuestion`, `ScheduleWakeup`, `ToolSearch`'

// --- pure helpers (exported for tests) -------------------------------------

export function slugify(title) {
  const s = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return s || 'run'
}

/** A scaffolded file still carries its stub marker until filled. */
export function hasStubMarker(content) {
  return /> STATUS: (fill|produced after|only if)/i.test(content)
}
export function isFilled(content) {
  return content.trim().length > 0 && !hasStubMarker(content)
}

/** Extract allowed file paths from the "## Allowed" section of allowed-forbidden-files.md. */
export function parseAllowedList(content) {
  const lines = content.split('\n')
  const out = []
  let inAllowed = false
  for (const line of lines) {
    if (/^##\s+Allowed/i.test(line)) { inAllowed = true; continue }
    if (/^##\s+/.test(line)) { inAllowed = false; continue }
    if (!inAllowed) continue
    const m = line.match(/^\s*[-*]\s+`?([A-Za-z0-9._/\-*]+)`?\s*$/)
    if (m && m[1] && m[1] !== '-') out.push(m[1])
  }
  return out
}

/** Changed files not matched by any allowed entry (prefix or glob-dir match). */
export function findOutsideAllowed(changedFiles, allowedList) {
  const matches = (f) =>
    allowedList.some((a) => f === a || f.startsWith(a.replace(/\*+$/, '')) || (a.endsWith('/') && f.startsWith(a)))
  return changedFiles.filter((f) => !matches(f))
}

/** True once `bundle` has assembled it (positive marker — embedded artifacts may contain stub text). */
export function isAssembledBundle(content) {
  return /assembled by verified-ai-loop/.test(content)
}

export function assembleBundle({ request, contract, enforcementPath, redteam, testOutput, diff }) {
  return `# Cold-review bundle (assembled by verified-ai-loop)

## 1. Request
${request || '(missing)'}

## 2. Contract
${contract || '(missing)'}

## 3. Enforcement-path map
${enforcementPath || '(missing)'}

## 4. Redteam plan
${redteam || '(missing)'}

## 5. Test / typecheck output (actual, slice-scoped)
${testOutput || '(missing)'}

## 6. Diff under review
\`\`\`diff
${diff || '(no diff captured — not in a git repo, or no changes)'}
\`\`\`

## 7. Reviewer-context instructions
Review ONLY the contents above. You are a fresh-context, isolated-bundle reviewer; reason from the bundle, not from any builder narrative. Verdict: PASS / NEEDS_REVIEW / FAIL.

## 8. Deterministic gates (source of truth)
Tests, typecheck, redteam, and executable checks outrank this review. A red gate is FAIL regardless of model judgment; this review only catches what the gates missed.
`
}

export function reviewerResultDoc(result) {
  const obj = result.obj || {}
  const lines = [
    `VERDICT: ${result.final}`,
    '',
    '# Reviewer result (fresh-context isolated-bundle)',
    '',
    `- effective_toolset: ${JSON.stringify(obj.effective_toolset || null)}`,
    result.reason ? `- reason: ${result.reason}` : '',
    `- blockers: ${JSON.stringify(obj.blockers || [])}`,
    `- suggestions: ${JSON.stringify(obj.suggestions || [])}`,
    obj.notes ? `- notes: ${obj.notes}` : '',
    '',
    '## Reviewer context',
    '- Fresh-context Claude + bundle-only (enforced standard tools)',
    '- same-vendor',
    '- not different-vendor',
    '- not adversarial-isolated',
    '- external egress = no',
    '- Deterministic gates remain the source of truth; this review is advisory.',
  ]
  return lines.filter((l) => l !== '').join('\n') + '\n'
}

export function parseReviewerVerdict(content) {
  const m = content.match(/^VERDICT:\s*(\S+)/m)
  return m ? m[1] : null
}

/** Pure final decision. */
export function finalDecision(verdict, hasOverride) {
  if (verdict === 'INVALID' || verdict === 'INVALID-TOOLSET-MISMATCH') {
    return { pass: false, needsRemediation: false, decision: 'DO NOT SHIP', reason: 'reviewer isolation INVALID — review not trustworthy' }
  }
  if (verdict === 'PASS') {
    return { pass: true, needsRemediation: false, decision: 'SHIP (pending human commit/PR gate)', reason: 'reviewer PASS; deterministic gates must also be green' }
  }
  // NEEDS_REVIEW / FAIL
  if (hasOverride) {
    return { pass: true, needsRemediation: true, decision: 'SHIP — human override', reason: 'reviewer not PASS; explicit human override recorded' }
  }
  return { pass: false, needsRemediation: true, decision: 'DO NOT SHIP', reason: `reviewer ${verdict}; bounded remediation required (or explicit human override)` }
}

// --- io helpers ------------------------------------------------------------

function readRun(runDir, name) {
  const p = join(runDir, name)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}
function gitInfo() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
/** Read-only diff capture: tracked changes vs HEAD + contents of untracked files (via --no-index).
 *  Never mutates the index/repo. Excludes the .verified-ai/ run folder itself. */
function captureDiff() {
  let diff = ''
  try { diff = execFileSync('git', ['diff', 'HEAD'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }) }
  catch { try { diff = execFileSync('git', ['diff'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }) } catch {} }
  let untracked = []
  try { untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean) } catch {}
  for (const f of untracked) {
    if (f.startsWith('.verified-ai/')) continue
    try {
      execFileSync('git', ['diff', '--no-index', '--no-color', '/dev/null', f], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    } catch (e) {
      if (e && e.stdout) diff += '\n' + e.stdout // --no-index exits non-zero when files differ
    }
  }
  return diff.trim()
}
function gitChangedFiles() {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
    return out.split('\n').map((l) => l.slice(3).trim()).filter(Boolean)
  } catch {
    return []
  }
}

// --- commands (return {code, ...}; CLI maps to exit code) ------------------

export function cmdNew(title, { cwd = process.cwd() } = {}) {
  if (!title || !title.trim()) return { code: 2, error: 'usage: verified-ai-loop new "<feature title>"' }
  const date = new Date().toISOString().slice(0, 10)
  const dir = join(cwd, '.verified-ai', 'runs', `${date}-${slugify(title)}`)
  if (existsSync(dir)) return { code: 1, error: `run folder already exists: ${dir} (refusing to overwrite)`, dir }
  mkdirSync(dir, { recursive: true })

  const stub = (role, status, body = '') => `# ${role}\n\n> STATUS: ${status}\n${body ? '\n' + body + '\n' : ''}`
  const manifest = [
    { name: 'request.md', content: stub('Request', 'fill — restate precisely', `## Raw\n${title}\n\n## Restated (one sentence)\nWhen ____, the system ____.`) },
    { name: 'contract.md', template: 'feature-contract.md' },
    { name: 'enforcement-path.md', content: stub('Enforcement-path map', 'fill before code', '- **Decision point:**\n- **Entry points (each writer/trigger):**\n- **Sibling-writer races?** (webhook vs cron, user vs worker, retry vs original)\n- **Per node:** routes through canonical decision / gates independently / not at all') },
    { name: 'redteam-plan.md', template: 'redteam-plan.md' },
    { name: 'implementation-plan.md', content: stub('Implementation plan', 'fill before code', '- **Approach:**\n- **Steps:**\n- **Tests/redteam to add:**') },
    { name: 'allowed-forbidden-files.md', content: stub('Allowed / forbidden files', 'fill before code', '## Allowed\n- \n\n## Forbidden\n- ') },
    { name: 'test-output.md', content: stub('Test / typecheck output', 'produced after implementation — paste ACTUAL slice-scoped output', '> Scope to touched files. Do not paste a repo-wide pass/fail.') },
    { name: 'review-bundle.md', content: stub('Review bundle', 'produced after implementation — assembled by `bundle`') },
    { name: 'reviewer-result.md', content: stub('Reviewer result', 'produced by `review`') },
    { name: 'remediation-plan.md', content: stub('Bounded remediation plan', 'only if reviewer = NEEDS_REVIEW/FAIL') },
    { name: 'final-scorecard.md', content: stub('Final scorecard', 'produced by `finalize`') },
    { name: 'pr-body.md', content: stub('PR body draft', 'produced by `finalize`') },
  ]
  const created = []
  for (const f of manifest) {
    let content = f.content
    if (f.template) {
      const tpl = join(TEMPLATES_DIR, f.template)
      content = existsSync(tpl) ? readFileSync(tpl, 'utf8') : `# ${f.name.replace('.md', '')}\n\n> STATUS: fill — template ${f.template} not found at install location.\n`
    }
    writeFileSync(join(dir, f.name), content)
    created.push(f.name)
  }
  return { code: 0, dir, created }
}

export function cmdStatus(runDir) {
  if (!existsSync(runDir)) return { code: 2, error: `run dir not found: ${runDir}` }
  const report = []
  for (const name of PRE_CODE.concat(['test-output.md'])) {
    const c = readRun(runDir, name)
    report.push({ name, state: c == null ? 'MISSING' : isFilled(c) ? 'filled' : 'stub (unfilled)' })
  }
  const afc = readRun(runDir, 'allowed-forbidden-files.md')
  const warnings = []
  if (afc == null) warnings.push('allowed-forbidden-files.md missing')
  else if (gitInfo()) {
    const allowed = parseAllowedList(afc)
    if (allowed.length) {
      const changed = gitChangedFiles().filter((f) => !f.startsWith('.verified-ai/'))
      const outside = findOutsideAllowed(changed, allowed)
      for (const f of outside) warnings.push(`changed file outside allowed list: ${f}`)
    }
  }
  return { code: 0, report, warnings }
}

export function cmdBundle(runDir) {
  if (!existsSync(runDir)) return { code: 2, error: `run dir not found: ${runDir}` }
  const missing = []
  for (const name of BUNDLE_INPUTS) {
    const c = readRun(runDir, name)
    if (c == null) missing.push(`${name} (missing)`)
    else if (hasStubMarker(c)) missing.push(`${name} (still a stub — fill it)`)
  }
  if (missing.length) return { code: 1, error: 'cannot assemble bundle — required inputs not ready:\n  - ' + missing.join('\n  - ') }

  const diff = gitInfo() ? captureDiff() : ''
  const bundle = assembleBundle({
    request: readRun(runDir, 'request.md'),
    contract: readRun(runDir, 'contract.md'),
    enforcementPath: readRun(runDir, 'enforcement-path.md'),
    redteam: readRun(runDir, 'redteam-plan.md'),
    testOutput: readRun(runDir, 'test-output.md'),
    diff,
  })
  writeFileSync(join(runDir, 'review-bundle.md'), bundle)
  return { code: 0, diffCaptured: Boolean(diff), bundlePath: join(runDir, 'review-bundle.md') }
}

export function cmdReview(runDir, { runReview } = {}) {
  if (!existsSync(runDir)) return { code: 2, error: `run dir not found: ${runDir}` }
  const bundlePath = join(runDir, 'review-bundle.md')
  const bundle = existsSync(bundlePath) ? readFileSync(bundlePath, 'utf8') : null
  if (bundle == null || !isAssembledBundle(bundle)) return { code: 1, error: 'review-bundle.md not assembled — run `bundle` first' }

  const runner = runReview // injected in tests; CLI provides the real one
  const result = runner(bundlePath)
  writeFileSync(join(runDir, 'reviewer-result.md'), reviewerResultDoc(result))
  const invalid = result.final === 'INVALID' || result.final === 'INVALID-TOOLSET-MISMATCH'
  return { code: result.final === 'PASS' ? 0 : 1, final: result.final, failClosed: invalid }
}

export function cmdFinalize(runDir, { override } = {}) {
  if (!existsSync(runDir)) return { code: 2, error: `run dir not found: ${runDir}` }
  const rr = readRun(runDir, 'reviewer-result.md')
  if (rr == null || hasStubMarker(rr)) return { code: 1, error: 'reviewer-result.md missing — run `review` first' }
  const verdict = parseReviewerVerdict(rr)
  if (!verdict) return { code: 1, error: 'could not parse VERDICT from reviewer-result.md' }

  const decision = finalDecision(verdict, Boolean(override))

  if (decision.needsRemediation) {
    writeFileSync(join(runDir, 'remediation-plan.md'),
      `# Bounded remediation plan\n\n> Reviewer verdict: ${verdict}\n\n- One regression test per blocker (write first).\n- Smallest patch; allowed files only; no silent scope creep.\n- Re-run slice-scoped gates, then re-run \`review\`.\n` +
      (override ? `\n## Human override\nReason: ${override}\n` : ''))
  }

  writeFileSync(join(runDir, 'final-scorecard.md'),
    `# Final scorecard\n\n- Reviewer verdict: ${verdict}\n- Decision: ${decision.decision}\n- Rationale: ${decision.reason}\n\n` +
    `> Deterministic gates (tests/typecheck/redteam) are the source of truth and must be green. This scorecard does NOT commit, push, open a PR, merge, or deploy — those remain human-gated.\n`)
  writeFileSync(join(runDir, 'pr-body.md'),
    `# PR body (draft)\n\n> Reviewer verdict: ${verdict} · Decision: ${decision.decision}\n\nFill: summary, scope (allowed files), verification (slice-scoped tests + typecheck), reviewer-context.\n\nDo NOT open the PR until a human approves.\n`)

  return { code: decision.pass ? 0 : 1, verdict, decision: decision.decision, pass: decision.pass }
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2)
  let r
  if (cmd === 'new') {
    r = cmdNew(rest.join(' ').replace(/\s*--.*$/, '').trim() || rest.join(' '))
    if (r.code === 0) {
      console.log(`Created run folder:\n  ${r.dir}\n\nFiles (${r.created.length}): ${r.created.join(', ')}`)
      console.log('\nNext (manual, gated): fill request/contract/enforcement-path/redteam/implementation/allowed-forbidden,')
      console.log('approve scope, implement in allowed files, paste slice-scoped output into test-output.md,')
      console.log('then: verified-ai-loop bundle <run> → review <run> → finalize <run>. Commit/PR are human-gated.')
    }
  } else if (cmd === 'status') {
    r = cmdStatus(rest[0])
    if (r.report) { for (const x of r.report) console.log(`  ${x.state.padEnd(16)} ${x.name}`); for (const w of r.warnings) console.log(`  WARN  ${w}`) }
  } else if (cmd === 'bundle') {
    r = cmdBundle(rest[0])
    if (r.code === 0) console.log(`Assembled ${r.bundlePath} (diff captured: ${r.diffCaptured})`)
  } else if (cmd === 'review') {
    // Real reviewer wired here so tests can inject a fake instead.
    const { runReview } = await import('./independent-review.mjs')
    r = cmdReview(rest[0], { runReview })
    if (r.final) console.log(`Reviewer verdict: ${r.final}${r.failClosed ? ' — FAIL CLOSED (isolation not verified)' : ''}`)
  } else if (cmd === 'finalize') {
    const oi = process.argv.indexOf('--override')
    const override = oi !== -1 ? process.argv[oi + 1] : undefined
    r = cmdFinalize(rest[0], { override })
    if (r.verdict) console.log(`Finalize: verdict=${r.verdict} → ${r.decision} (final PASS: ${r.pass})`)
  } else {
    r = { code: 2, error: 'usage: verified-ai-loop <new|status|bundle|review|finalize> ...' }
  }
  if (r && r.error) console.error(r.error)
  process.exit(r ? r.code : 0)
}
