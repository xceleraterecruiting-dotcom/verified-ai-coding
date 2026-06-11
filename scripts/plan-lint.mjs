#!/usr/bin/env node
/**
 * Deterministic structure gate for spec-compiler plans.
 *
 * A compiled plan is nine markdown documents. This lint verifies STRUCTURE mechanically and
 * refuses to pretend it can judge semantics: risk classification is model-authored judgment
 * (validated here only for presence, shape, and citation discipline); whether the invariants are
 * the RIGHT ones is the cold plan-review's job (templates/plan-review-rubric.md).
 *
 *   node scripts/plan-lint.mjs <plan-dir> [--json]
 *
 * Fails closed (exit 1) when:
 *   - any required document is missing, or a non-.md file is present (no code during planning)
 *   - required sections are missing (explicit "None." is fine; absence is not)
 *   - any fenced code block exceeds 15 lines (implementation smuggled into planning)
 *   - risk-map lacks Initial/Final levels, a cited (blockquote) justification, or a downgrade
 *     justification when Final < Initial
 *   - Final level >= 2 but no invariant is tagged [L2]/[L3]
 *   - any slice lacks one of the eight required subsections (or has it empty)
 *   - a slice's allowed files intersect its forbidden files (per check-allowed-files matching)
 *   - any [L2]/[L3] invariant maps to no slice's "Invariants touched" or no acceptance criterion
 *   - any [L2]/[L3] invariant a slice touches is absent from that slice's "### Proof obligations",
 *     or referenced there without naming STRONG_RED (either the expected attributed STRONG_RED or
 *     an explicit "STRONG_RED not applicable: <reason>"). The lint checks token presence; the
 *     honesty of a not-applicable claim remains the cold plan-review's job. Promoted to a
 *     mechanical rule from proof-10's multi-slice NEEDS_REVISION (v0.7 item 4): the INV-14
 *     order-visibility gap was enumerable, so it belongs here, not in reviewer judgment.
 *   - any open question is [severity: high] with [status: open]  ← the ambiguity block
 *   - OQ/INV lines do not parse (unparseable risk lines are failures, not warnings)
 *
 * No dependencies beyond the sibling check-allowed-files matcher. Read-only.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { matchesPattern } from './check-allowed-files.mjs'

export const REQUIRED_DOCS = {
  'spec-intake.md': ['## Original spec (verbatim)', '## Compiler paraphrase', '## Interpretation notes', '## Assumptions', '## Open questions'],
  'requirements.md': ['## Requirements'],
  'non-goals.md': ['## Non-goals'],
  'domain-model.md': ['## Entities', '## States and transitions'],
  'invariants.md': ['## Invariants'],
  'risk-map.md': ['## Risk classification', '## Justification'],
  'acceptance-criteria.md': ['## Acceptance criteria'],
  'implementation-slices.md': [],
  'open-questions.md': ['## Open questions'],
}

export const SLICE_SUBSECTIONS = [
  '### Scope',
  '### Allowed files',
  '### Forbidden files',
  '### Invariants touched',
  '### Tests required',
  '### Proof obligations',
  '### Rollback notes',
  '### Done criteria',
]

export const MAX_FENCE_LINES = 15

/** Return the body text under a heading line, up to the next heading of the same depth. Pure. */
export function sectionBody(text, heading) {
  const lines = text.split('\n')
  const depth = heading.match(/^#+/)?.[0].length ?? 2
  const start = lines.findIndex((l) => l.trim() === heading || l.trim().startsWith(heading + ' ') || l.trim().startsWith(heading + ':'))
  if (start === -1) return null
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/)
    if (m && m[1].length <= depth) break
    out.push(lines[i])
  }
  return out.join('\n')
}

/** True when a section body has real content (not only blank lines). Pure. */
export function hasContent(body) {
  return body !== null && body.split('\n').some((l) => l.trim() !== '')
}

/** Fenced code blocks as arrays of inner lines. Pure. */
export function fencedBlocks(text) {
  const blocks = []
  const lines = text.split('\n')
  let current = null
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (current === null) current = []
      else {
        blocks.push(current)
        current = null
      }
    } else if (current !== null) current.push(line)
  }
  return blocks
}

/** Parse `- INV-<id> [L<n>] text` lines. Pure. Returns { invariants, malformed }. */
export function parseInvariants(text) {
  const invariants = []
  const malformed = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t.startsWith('- INV')) continue
    const m = t.match(/^- (INV-[\w.]+) \[L([0-3])\] (.+)$/)
    if (m) invariants.push({ id: m[1], level: Number(m[2]), text: m[3] })
    else malformed.push(t)
  }
  return { invariants, malformed }
}

/** Parse `- OQ-<id> [severity: ...] [status: ...] text` lines. Pure. */
export function parseOpenQuestions(text) {
  const questions = []
  const malformed = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t.startsWith('- OQ')) continue
    const m = t.match(/^- (OQ-[\w.]+) \[severity: (high|medium|low)\] \[status: (open|resolved)(?::[^\]]*)?\] (.+)$/)
    if (m) questions.push({ id: m[1], severity: m[2], status: m[3], text: m[4] })
    else malformed.push(t)
  }
  return { questions, malformed }
}

/** Parse `## Slice N: name` blocks with their subsection bodies. Pure. */
export function parseSlices(text) {
  const slices = []
  const headers = [...text.matchAll(/^## Slice ([\w.]+): (.+)$/gm)]
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length
    const body = text.slice(start, end)
    const sections = {}
    for (const sub of SLICE_SUBSECTIONS) sections[sub] = sectionBody(body, sub)
    slices.push({ id: headers[i][1], name: headers[i][2], body, sections })
  }
  return slices
}

/** Bullet entries (`- item`) from a section body. Pure. */
export function bullets(body) {
  if (!body) return []
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).replace(/^`|`$/g, '').trim())
    .filter((l) => l && !/^none\b/i.test(l))
}

/** Risk levels from risk-map.md. Pure. Returns { initial, final } or nulls. */
export function parseRiskLevels(text) {
  const initial = text.match(/^Initial classification:\s*L([0-3])\b/m)
  const final = text.match(/^Final level:\s*L([0-3])\b/m)
  return { initial: initial ? Number(initial[1]) : null, final: final ? Number(final[1]) : null }
}

/**
 * Lint a plan given as { filename: content }. Pure. Returns { failures, warnings, summary }.
 */
export function lintPlan(files) {
  const failures = []
  const warnings = []

  // 1. Required documents + no non-markdown files (no code during planning)
  for (const doc of Object.keys(REQUIRED_DOCS)) {
    if (!(doc in files)) failures.push(`missing required document: ${doc}`)
  }
  for (const name of Object.keys(files)) {
    if (!name.endsWith('.md')) failures.push(`non-markdown file in plan dir (no code during planning): ${name}`)
  }

  // 2. Required sections + oversized code fences
  for (const [doc, headings] of Object.entries(REQUIRED_DOCS)) {
    const text = files[doc]
    if (text === undefined) continue
    for (const h of headings) {
      if (!hasContent(sectionBody(text, h))) failures.push(`${doc}: section "${h}" missing or empty (write "None." explicitly if empty)`)
    }
    for (const block of fencedBlocks(text)) {
      if (block.length > MAX_FENCE_LINES) {
        failures.push(`${doc}: fenced block of ${block.length} lines exceeds ${MAX_FENCE_LINES} — implementation does not belong in planning docs`)
      }
    }
  }

  // 3. Risk map shape: levels, cited justification, downgrade rule
  const risk = files['risk-map.md']
  let finalLevel = null
  if (risk !== undefined) {
    const { initial, final } = parseRiskLevels(risk)
    finalLevel = final
    if (initial === null) failures.push('risk-map.md: missing "Initial classification: L<0-3>"')
    if (final === null) failures.push('risk-map.md: missing "Final level: L<0-3>"')
    const justification = sectionBody(risk, '## Justification')
    if (hasContent(justification) && !justification.split('\n').some((l) => l.trim().startsWith('> '))) {
      failures.push('risk-map.md: Justification has no blockquote citation from the spec (cite the lines that drove the level)')
    }
    if (initial !== null && final !== null && final < initial && !hasContent(sectionBody(risk, '## Downgrade justification'))) {
      failures.push('risk-map.md: level downgraded without a "## Downgrade justification" section')
    }
  }

  // 4. Invariants: parse, and require L2+ invariants when the plan is L2+
  const invText = files['invariants.md'] ?? ''
  const { invariants, malformed: badInv } = parseInvariants(invText)
  for (const b of badInv) failures.push(`invariants.md: unparseable invariant line (need "- INV-<id> [L<0-3>] text"): ${b.slice(0, 80)}`)
  if (finalLevel !== null && finalLevel >= 2 && !invariants.some((i) => i.level >= 2)) {
    failures.push(`risk level L${finalLevel} but no invariant tagged [L2] or [L3] — a Level 2+ plan with no Level 2+ invariant is misclassified somewhere`)
  }

  // 5. Slices: presence, subsections, allowed/forbidden disjointness
  const slicesText = files['implementation-slices.md'] ?? ''
  const slices = parseSlices(slicesText)
  if (files['implementation-slices.md'] !== undefined && slices.length === 0) {
    failures.push('implementation-slices.md: no "## Slice <n>: <name>" blocks found')
  }
  for (const s of slices) {
    for (const sub of SLICE_SUBSECTIONS) {
      if (!hasContent(s.sections[sub])) failures.push(`Slice ${s.id}: subsection "${sub}" missing or empty`)
    }
    const allowed = bullets(s.sections['### Allowed files'])
    const forbidden = bullets(s.sections['### Forbidden files'])
    for (const a of allowed) {
      for (const f of forbidden) {
        if (matchesPattern(a, f) || matchesPattern(f, a)) {
          failures.push(`Slice ${s.id}: allowed entry "${a}" intersects forbidden entry "${f}"`)
        }
      }
    }
  }

  // 6. L2+ invariant mapping: every L2/L3 invariant in >=1 slice AND >=1 acceptance criterion
  const acceptance = files['acceptance-criteria.md'] ?? ''
  for (const inv of invariants.filter((i) => i.level >= 2)) {
    const inSlice = slices.some((s) => (s.sections['### Invariants touched'] ?? '').includes(inv.id))
    if (!inSlice) failures.push(`${inv.id} [L${inv.level}] is mapped to no slice's "Invariants touched"`)
    if (!acceptance.includes(inv.id)) failures.push(`${inv.id} [L${inv.level}] appears in no acceptance criterion`)
  }

  // 6b. Proof-obligation mapping (v0.7, promoted from proof-10 multi-slice NEEDS_REVISION):
  // every L2+ invariant a slice touches must be referenced in that slice's proof obligations,
  // and the referencing line(s) must name STRONG_RED — the expected attributed STRONG_RED, or an
  // explicit "STRONG_RED not applicable: <reason>". L0/L1 invariants are exempt.
  for (const s of slices) {
    const touched = s.sections['### Invariants touched'] ?? ''
    const poBody = s.sections['### Proof obligations'] ?? ''
    for (const inv of invariants.filter((i) => i.level >= 2 && touched.includes(i.id))) {
      if (!poBody.includes(inv.id)) {
        failures.push(
          `Slice ${s.id}: touches ${inv.id} [L${inv.level}] but its "### Proof obligations" never references it — name the expected STRONG_RED or state why STRONG_RED is not applicable`,
        )
        continue
      }
      const referencingLines = poBody.split('\n').filter((l) => l.includes(inv.id))
      if (!referencingLines.some((l) => l.includes('STRONG_RED'))) {
        failures.push(
          `Slice ${s.id}: proof obligation for ${inv.id} [L${inv.level}] does not name STRONG_RED (write the expected attributed STRONG_RED, or "STRONG_RED not applicable: <reason>")`,
        )
      }
    }
  }

  // 7. Open questions: the ambiguity block
  const oqText = files['open-questions.md'] ?? ''
  const { questions, malformed: badOq } = parseOpenQuestions(oqText)
  for (const b of badOq) failures.push(`open-questions.md: unparseable line (need "- OQ-<id> [severity: ...] [status: ...] text"): ${b.slice(0, 80)}`)
  for (const q of questions.filter((q) => q.severity === 'high' && q.status === 'open')) {
    failures.push(`BLOCKED: high-severity open question unresolved — ${q.id}: ${q.text.slice(0, 100)}`)
  }

  return {
    failures,
    warnings,
    summary: {
      documents: Object.keys(files).length,
      finalLevel,
      invariants: invariants.length,
      l2plus: invariants.filter((i) => i.level >= 2).length,
      slices: slices.length,
      openQuestions: questions.length,
      highOpen: questions.filter((q) => q.severity === 'high' && q.status === 'open').length,
    },
  }
}

export function main(argv) {
  const json = argv.includes('--json')
  const dirArg = argv.find((a) => !a.startsWith('--'))
  if (!dirArg) {
    console.error('usage: plan-lint.mjs <plan-dir> [--json]')
    process.exit(1)
  }
  const dir = resolve(dirArg)
  const files = {}
  for (const name of readdirSync(dir)) {
    if (statSync(join(dir, name)).isDirectory()) continue
    files[name] = name.endsWith('.md') ? readFileSync(join(dir, name), 'utf8') : ''
  }
  const result = lintPlan(files)
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    for (const f of result.failures) console.log(`FAIL  ${f}`)
    for (const w of result.warnings) console.log(`warn  ${w}`)
    console.log(
      `plan-lint: ${result.failures.length === 0 ? 'GREEN' : `${result.failures.length} failure(s)`} — ` +
        `L${result.summary.finalLevel ?? '?'} plan, ${result.summary.slices} slice(s), ` +
        `${result.summary.invariants} invariant(s) (${result.summary.l2plus} at L2+), ` +
        `${result.summary.openQuestions} open question(s)`,
    )
  }
  process.exit(result.failures.length === 0 ? 0 : 1)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) main(process.argv.slice(2))
