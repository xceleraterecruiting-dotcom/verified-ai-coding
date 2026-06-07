#!/usr/bin/env node
/**
 * Fresh-context / isolated-bundle reviewer launcher.
 *
 * Runs a cold-review bundle through a FRESH headless `claude -p` reviewer locked to the
 * probe-VERIFIED config #3 (expanded denylist + --strict-mcp-config), then DETERMINISTICALLY
 * verifies — on the launcher side — that the reviewer's effective toolset actually matched the
 * restriction before trusting any verdict. It fails CLOSED: a missing, malformed, or
 * forbidden-tool toolset block yields INVALID / INVALID-TOOLSET-MISMATCH, never a PASS.
 *
 * Why the launcher-side check exists: probe #4 proved an over-tightened denylist can SILENTLY
 * FAIL OPEN (the reviewer regains full tools with no error). So the reviewer's own prose is
 * never trusted — the launcher parses the machine-readable toolset block and enforces the gate.
 *
 * Honest label (record in the result, never drop the qualifiers):
 *   Fresh-context Claude + bundle-only enforced for standard write/read/delegate/egress tools,
 *   verified config #3. Same-vendor. NOT adversarial-isolated. NOT different-vendor.
 *   Residual: ToolSearch + deferred Task* remain (cannot be denied without failing open).
 *   Deterministic gates remain the source of truth; this review is advisory.
 *
 * No external (non-Claude) API. No dependencies.
 */

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Probe-verified config #3 denylist (do NOT extend — tightening it fails open, see probe #4). */
export const VERIFIED_DISALLOWED = [
  'Bash', 'Edit', 'Write', 'NotebookEdit', 'Read', 'Grep', 'Glob',
  'WebFetch', 'WebSearch', 'Agent', 'Workflow', 'Skill',
]

/** Directly-callable tools that legitimately remain under config #3 (the documented residual). */
export const ALLOWED_DIRECT_TOOLS = ['AskUserQuestion', 'ScheduleWakeup', 'ToolSearch']

export const VALID_VERDICTS = ['PASS', 'NEEDS_REVIEW', 'FAIL']

const here = dirname(fileURLToPath(import.meta.url))
const REVIEWER_PROMPT_PATH = resolve(here, '..', 'prompts', 'independent-reviewer.md')

export function buildPrompt(bundleText, promptTemplate) {
  return promptTemplate.replace('{{BUNDLE}}', bundleText)
}

/** Extract the LAST ```json fenced block from reviewer text. Fails closed (ok:false). */
export function extractReviewerJson(text) {
  if (typeof text !== 'string') return { ok: false, reason: 'reviewer output is not text' }
  const matches = [...text.matchAll(/```json\s*([\s\S]*?)```/g)]
  if (matches.length === 0) return { ok: false, reason: 'no ```json result block found' }
  const raw = matches[matches.length - 1][1].trim()
  try {
    return { ok: true, obj: JSON.parse(raw) }
  } catch (e) {
    return { ok: false, reason: `result JSON malformed: ${e.message}` }
  }
}

/** Deterministic toolset gate. Returns OK only if every reported tool is in the allowed set. */
export function assertToolset(obj) {
  if (!obj || typeof obj !== 'object') return { status: 'INVALID-TOOLSET-MISMATCH', reason: 'no result object' }
  const ts = obj.effective_toolset
  if (!Array.isArray(ts)) {
    return { status: 'INVALID-TOOLSET-MISMATCH', reason: 'effective_toolset missing or not an array' }
  }
  const norm = ts.map((t) => String(t).trim())
  const forbidden = norm.filter((t) => !ALLOWED_DIRECT_TOOLS.includes(t))
  if (forbidden.length > 0) {
    return {
      status: 'INVALID-TOOLSET-MISMATCH',
      reason: `forbidden tool(s) present — isolation failed open: ${forbidden.join(', ')}`,
      forbidden,
    }
  }
  return { status: 'OK' }
}

/**
 * Combine parse + toolset gate + verdict into a final, fail-closed result.
 *  - cannot parse a json block      -> INVALID
 *  - toolset missing/malformed/forbidden -> INVALID-TOOLSET-MISMATCH
 *  - verdict missing/not in enum     -> INVALID
 *  - otherwise                       -> PASS | NEEDS_REVIEW | FAIL
 */
export function evaluateReviewer(reviewerText) {
  const ex = extractReviewerJson(reviewerText)
  if (!ex.ok) return { final: 'INVALID', reason: ex.reason }

  const gate = assertToolset(ex.obj)
  if (gate.status !== 'OK') return { final: gate.status, reason: gate.reason, obj: ex.obj }

  const verdict = ex.obj.verdict
  if (!VALID_VERDICTS.includes(verdict)) {
    return { final: 'INVALID', reason: `missing/invalid verdict: ${JSON.stringify(verdict)}`, obj: ex.obj }
  }
  return { final: verdict, obj: ex.obj }
}

/** Pull the reviewer's final text out of the `claude -p --output-format json` envelope. */
export function extractReviewerText(stdout) {
  try {
    const env = JSON.parse(stdout)
    if (typeof env?.result === 'string') return env.result
    if (typeof env?.text === 'string') return env.text
    return stdout
  } catch {
    return stdout // fall back to raw stdout; evaluateReviewer will fail closed if unparseable
  }
}

/** Live review: spawn the restricted headless reviewer and evaluate it. */
export function runReview(bundlePath, { model } = {}) {
  const bundleText = readFileSync(bundlePath, 'utf8')
  const template = readFileSync(REVIEWER_PROMPT_PATH, 'utf8')
  const prompt = buildPrompt(bundleText, template)

  const args = [
    '-p', prompt,
    '--disallowedTools', ...VERIFIED_DISALLOWED,
    '--strict-mcp-config',
    '--output-format', 'json',
  ]
  if (model) args.push('--model', model)

  const proc = spawnSync('claude', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  if (proc.error) return { final: 'INVALID', reason: `failed to launch claude: ${proc.error.message}` }
  if (proc.status !== 0) {
    return { final: 'INVALID', reason: `claude -p exited ${proc.status}: ${(proc.stderr || '').slice(0, 400)}` }
  }
  const reviewerText = extractReviewerText(proc.stdout)
  return { ...evaluateReviewer(reviewerText), reviewerText }
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const bundlePath = process.argv[2]
  const modelIdx = process.argv.indexOf('--model')
  const model = modelIdx !== -1 ? process.argv[modelIdx + 1] : undefined
  if (!bundlePath) {
    console.error('usage: independent-review.mjs <bundle-path> [--model <claude-model>]')
    process.exit(2)
  }
  const r = runReview(bundlePath, { model })
  console.log(`FINAL: ${r.final}`)
  if (r.reason) console.log(`reason: ${r.reason}`)
  if (r.obj?.effective_toolset) console.log(`effective_toolset: ${JSON.stringify(r.obj.effective_toolset)}`)
  if (r.obj?.blockers?.length) console.log(`blockers: ${JSON.stringify(r.obj.blockers, null, 2)}`)
  console.log('---')
  console.log('reviewer context: Fresh-context Claude + bundle-only (enforced tools, config #3); same-vendor; NOT adversarial-isolated; NOT different-vendor.')
  console.log('residual: ToolSearch + deferred Task* remain. Deterministic gates remain source of truth; this review is advisory.')
  // PASS -> 0; everything else (NEEDS_REVIEW/FAIL/INVALID/MISMATCH) -> non-zero (fail closed).
  process.exit(r.final === 'PASS' ? 0 : 1)
}
