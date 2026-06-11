#!/usr/bin/env node
/** Deterministic tests for plan-lint's pure parsing/validation. No filesystem reads beyond this file. */

import {
  bullets,
  fencedBlocks,
  hasContent,
  lintPlan,
  parseInvariants,
  parseOpenQuestions,
  parseRiskLevels,
  parseSlices,
  sectionBody,
} from './plan-lint.mjs'

let failures = 0
const check = (n, c) => { console.log(`${c ? 'OK  ' : 'MISS'}  ${n}`); if (!c) failures++ }

// --- a minimal GREEN plan, reused by the failure-mode cases below ---
const slice = (id, name, inv) => `## Slice ${id}: ${name}

### Scope
Build the thing.

### Allowed files
- src/server/services/x.ts
- tests/x.test.ts

### Forbidden files
- prisma/schema.prisma

### Invariants touched
${inv}

### Tests required
- unit: refusal path

### Proof obligations
- STRONG_RED for ${inv.replace('- ', '').split(' ')[0]}

### Rollback notes
Additive only; revert the commit.

### Done criteria
- plan-lint green, tests green
`

const green = {
  'spec-intake.md': `# Intake

## Original spec (verbatim)
Build X.

## Compiler paraphrase
Build X, interpreted as Y.

## Interpretation notes
None.

## Assumptions
- A1: single tenant.

## Open questions
See open-questions.md.
`,
  'requirements.md': '# R\n\n## Requirements\n- R1: do X.\n',
  'non-goals.md': '# NG\n\n## Non-goals\n- no mobile app.\n',
  'domain-model.md': '# DM\n\n## Entities\n- Draft.\n\n## States and transitions\n- DRAFT -> APPROVED.\n',
  'invariants.md': '# I\n\n## Invariants\n- INV-1 [L2] A blocked draft must never reach the publisher.\n- INV-2 [L1] Slugs are unique.\n',
  'risk-map.md': `# Risk

## Risk classification
Initial classification: L2
Final level: L2

## Justification
> "posts are generated from private athlete data" (spec line 4)
Money/private-data per the table.
`,
  'acceptance-criteria.md': '# AC\n\n## Acceptance criteria\n- AC-1 (INV-1): publisher refuses blocked drafts.\n',
  'implementation-slices.md': `# Slices\n\n${slice('1', 'gate', '- INV-1')}`,
  'open-questions.md': '# OQ\n\n## Open questions\n- OQ-1 [severity: medium] [status: open] Which timezone for schedules?\n',
}

check('green plan lints clean', lintPlan(green).failures.length === 0)
check('summary counts slices and L2+ invariants', (() => { const s = lintPlan(green).summary; return s.slices === 1 && s.l2plus === 1 && s.finalLevel === 2 })())

// --- failure modes, one by one ---
const drop = (k) => { const c = { ...green }; delete c[k]; return c }
check('missing document fails', lintPlan(drop('non-goals.md')).failures.some((f) => f.includes('missing required document')))

const nonMd = { ...green, 'helper.ts': 'export const x = 1' }
check('non-markdown file fails (no code during planning)', lintPlan(nonMd).failures.some((f) => f.includes('non-markdown')))

const emptySection = { ...green, 'requirements.md': '# R\n\n## Requirements\n\n' }
check('empty required section fails', lintPlan(emptySection).failures.some((f) => f.includes('"## Requirements" missing or empty')))

const bigFence = { ...green, 'domain-model.md': green['domain-model.md'] + '\n```ts\n' + 'line\n'.repeat(20) + '```\n' }
check('oversized code fence fails', lintPlan(bigFence).failures.some((f) => f.includes('exceeds 15')))
const smallFence = { ...green, 'domain-model.md': green['domain-model.md'] + '\n```ts\nstatus: DRAFT | APPROVED\n```\n' }
check('small illustrative fence allowed', lintPlan(smallFence).failures.length === 0)

const noCitation = { ...green, 'risk-map.md': green['risk-map.md'].replace('> "posts are generated from private athlete data" (spec line 4)\n', '') }
check('justification without blockquote citation fails', lintPlan(noCitation).failures.some((f) => f.includes('no blockquote citation')))

const downgraded = { ...green, 'risk-map.md': green['risk-map.md'].replace('Initial classification: L2', 'Initial classification: L3') }
check('downgrade without justification section fails', lintPlan(downgraded).failures.some((f) => f.includes('Downgrade justification')))
const downgradeOk = { ...downgraded, 'risk-map.md': downgraded['risk-map.md'] + '\n## Downgrade justification\nScoped to dry-run only; no live publishing in this plan.\n' }
check('downgrade with justification passes', lintPlan(downgradeOk).failures.length === 0)

const noL2Inv = { ...green, 'invariants.md': '# I\n\n## Invariants\n- INV-2 [L1] Slugs are unique.\n', 'implementation-slices.md': `# Slices\n\n${slice('1', 'gate', '- INV-2')}`, 'acceptance-criteria.md': '# AC\n\n## Acceptance criteria\n- AC-1 (INV-2): slugs unique.\n' }
check('L2 plan with no L2+ invariant fails', lintPlan(noL2Inv).failures.some((f) => f.includes('no invariant tagged')))

const badInvLine = { ...green, 'invariants.md': green['invariants.md'] + '- INV-3 missing level tag\n' }
check('unparseable invariant line fails', lintPlan(badInvLine).failures.some((f) => f.includes('unparseable invariant')))

const missingSub = { ...green, 'implementation-slices.md': `# Slices\n\n${slice('1', 'gate', '- INV-1').replace(/### Rollback notes\nAdditive only; revert the commit.\n\n/, '')}` }
check('slice missing a subsection fails', lintPlan(missingSub).failures.some((f) => f.includes('"### Rollback notes"')))

const overlap = { ...green, 'implementation-slices.md': `# Slices\n\n${slice('1', 'gate', '- INV-1').replace('- prisma/schema.prisma', '- src/server/services/')}` }
check('allowed/forbidden intersection fails', lintPlan(overlap).failures.some((f) => f.includes('intersects forbidden')))

const unmapped = { ...green, 'implementation-slices.md': `# Slices\n\n${slice('1', 'gate', '- INV-2')}` }
check('L2 invariant mapped to no slice fails', lintPlan(unmapped).failures.some((f) => f.includes('mapped to no slice')))
const noAc = { ...green, 'acceptance-criteria.md': '# AC\n\n## Acceptance criteria\n- AC-1: something else.\n' }
check('L2 invariant absent from acceptance criteria fails', lintPlan(noAc).failures.some((f) => f.includes('no acceptance criterion')))

const highOpen = { ...green, 'open-questions.md': '# OQ\n\n## Open questions\n- OQ-9 [severity: high] [status: open] Can generation read raw athlete contact info?\n' }
check('high-severity open question BLOCKS', lintPlan(highOpen).failures.some((f) => f.startsWith('BLOCKED')))
const highResolved = { ...green, 'open-questions.md': '# OQ\n\n## Open questions\n- OQ-9 [severity: high] [status: resolved: owner said no, 2026-06-11] Can generation read raw contact info?\n' }
check('resolved high-severity question passes', lintPlan(highResolved).failures.length === 0)

const badOqLine = { ...green, 'open-questions.md': '# OQ\n\n## Open questions\n- OQ-2 needs a severity\n' }
check('unparseable OQ line fails', lintPlan(badOqLine).failures.some((f) => f.includes('unparseable line')))

// --- pure helpers ---
check('sectionBody scopes to same heading depth', sectionBody('## A\na-body\n## B\nb', '## A').trim() === 'a-body')
check('hasContent rejects whitespace-only', !hasContent('\n  \n'))
check('fencedBlocks counts inner lines', fencedBlocks('```\n1\n2\n```')[0].length === 2)
check('parseInvariants reads id/level', parseInvariants('- INV-7 [L3] x').invariants[0].level === 3)
check('parseOpenQuestions reads resolved-with-note', parseOpenQuestions('- OQ-1 [severity: high] [status: resolved: said no] q').questions[0].status === 'resolved')
check('parseSlices finds subsections', parseSlices(slice('2', 'n', '- INV-1'))[0].sections['### Scope'].includes('Build'))
check('bullets strips backticks and skips None', bullets('- `a.ts`\n- None\n- b.ts').join(',') === 'a.ts,b.ts')
check('parseRiskLevels reads both', JSON.stringify(parseRiskLevels('Initial classification: L3\nFinal level: L2')) === '{"initial":3,"final":2}')

process.exit(failures ? 1 : 0)
