#!/usr/bin/env node
/**
 * Self-verifying runner. Runs the checker against all five fixtures and asserts
 * each produces the expected outcome (PASS = exit 0, FAIL/NON-PASS = non-zero).
 *
 * "Run it and eyeball the output" is itself operator-dependent. This runner makes
 * the example prove itself: if any fixture behaves wrongly, it exits non-zero.
 */

import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const checker = join(here, 'check-enforcement-path.mjs')
const fixturesDir = resolve(here, '..', 'fixtures')

// expectPass: true => must exit 0; false => must exit non-zero.
const EXPECTATIONS = [
  { name: 'bad-missing-import', expectPass: false },
  { name: 'bad-imported-unused', expectPass: false },
  { name: 'bad-dead-branch', expectPass: false },
  { name: 'good', expectPass: true },
  { name: 'good-aliased-import', expectPass: true },
]

let allOk = true
const rows = []

for (const { name, expectPass } of EXPECTATIONS) {
  const dir = join(fixturesDir, name)
  const res = spawnSync(process.execPath, [checker, dir], { encoding: 'utf8' })
  process.stdout.write(res.stdout || '')
  if (res.stderr) process.stderr.write(res.stderr)

  const actualPass = res.status === 0
  const ok = actualPass === expectPass
  if (!ok) allOk = false
  rows.push({ name, expectPass, code: res.status, actualPass, ok })
}

console.log('\n=== fixture results ===')
for (const r of rows) {
  const expect = r.expectPass ? 'PASS' : 'non-zero'
  const actual = r.actualPass ? 'PASS' : 'non-zero'
  console.log(
    `${r.ok ? 'OK  ' : 'MISS'}  ${r.name.padEnd(22)} expected=${expect.padEnd(8)} exit=${r.code} (${actual})`,
  )
}
console.log(
  allOk
    ? '\nALL FIXTURES BEHAVED AS EXPECTED'
    : '\nFIXTURE MISMATCH — see MISS rows above',
)

process.exit(allOk ? 0 : 1)
