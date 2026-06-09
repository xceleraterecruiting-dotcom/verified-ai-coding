#!/usr/bin/env node
/** Deterministic tests for the allowed-files scope gate's pure matcher/classifier. No git/network. */

import { parseSection, matchesPattern, classify } from './check-allowed-files.mjs'

let failures = 0
const check = (n, c) => { console.log(`${c ? 'OK  ' : 'MISS'}  ${n}`); if (!c) failures++ }

const md = `# Allowed / forbidden files

## Allowed
- src/lib/foo.ts
- src/app/api/x/
- src/components/*.tsx

## Forbidden
- prisma/schema.prisma
- src/lib/auth/
`
const allowed = parseSection(md, 'Allowed')
const forbidden = parseSection(md, 'Forbidden')
check('parseSection Allowed', allowed.length === 3 && allowed.includes('src/lib/foo.ts'))
check('parseSection Forbidden', forbidden.length === 2 && forbidden.includes('prisma/schema.prisma'))

check('exact file match', matchesPattern('src/lib/foo.ts', 'src/lib/foo.ts'))
check('dir prefix with slash', matchesPattern('src/app/api/x/route.ts', 'src/app/api/x/'))
check('bare dir prefix', matchesPattern('src/app/api/x/route.ts', 'src/app/api/x'))
check('glob *.tsx', matchesPattern('src/components/Button.tsx', 'src/components/*.tsx'))
check('no false match', !matchesPattern('src/other.ts', 'src/lib/foo.ts'))

const { allowedMatches, violations } = classify(
  ['src/lib/foo.ts', 'src/app/api/x/route.ts', 'src/components/Button.tsx', 'src/lib/auth/guard.ts', 'src/random.ts'],
  allowed, forbidden,
)
check('allowed matches counted', allowedMatches.length === 3)
check('forbidden file is a violation', violations.some((v) => v.file === 'src/lib/auth/guard.ts' && v.reason === 'forbidden'))
check('unlisted file is a violation', violations.some((v) => v.file === 'src/random.ts' && v.reason === 'not in allowed list'))
check('clean diff -> no violations', classify(['src/lib/foo.ts'], allowed, forbidden).violations.length === 0)

console.log('')
console.log(failures === 0 ? 'ALL ALLOWED-FILES CASES PASSED' : `${failures} CASE(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
