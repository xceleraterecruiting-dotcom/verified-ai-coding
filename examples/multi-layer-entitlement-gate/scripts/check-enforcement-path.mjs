#!/usr/bin/env node
/**
 * Enforcement-path checker (fixture-scoped, AST-based).
 *
 * Proves ONE thing, within the controlled fixtures in this folder: that a
 * protected entry point (`page.ts`) ROUTES THROUGH the canonical decision point
 * (`isUserEntitled` exported from `./canonical-entitlement`) before allowing
 * access. It uses the TypeScript compiler API — never grep/string search.
 *
 * It does NOT prove the canonical decision function is correct, and it is NOT a
 * general import resolver. See README.md for the exact boundaries.
 *
 * Exit: 0 = PASS; non-zero = FAIL / NON-PASS / usage error. Fails closed.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

// Load the SCOPED TypeScript dependency relative to this script, not the cwd.
const require = createRequire(import.meta.url)
let ts
try {
  ts = require('typescript')
} catch {
  console.error(
    'ERROR: scoped TypeScript not installed. Run `npm install` inside ' +
      'examples/multi-layer-entitlement-gate before running this checker.',
  )
  process.exit(2)
}

const EXPECTED_MODULE = './canonical-entitlement'
const CANONICAL_NAME = 'isUserEntitled'

function parse(file) {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  )
}

function isExported(node) {
  const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined
  return !!mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
}

/** Does the canonical module actually export `isUserEntitled`? (existence, not correctness.) */
function moduleExportsCanonical(sf) {
  for (const s of sf.statements) {
    if (!isExported(s)) continue
    if (ts.isFunctionDeclaration(s) && s.name?.text === CANONICAL_NAME) return true
    if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === CANONICAL_NAME) return true
      }
    }
  }
  return false
}

function normalizeModule(m) {
  return m.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '')
}

/** Local binding name the page uses for the canonical decision (alias-aware), or null. */
function findCanonicalBinding(sf) {
  for (const s of sf.statements) {
    if (!ts.isImportDeclaration(s) || !ts.isStringLiteral(s.moduleSpecifier)) continue
    if (normalizeModule(s.moduleSpecifier.text) !== EXPECTED_MODULE) continue
    const clause = s.importClause
    if (!clause || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    for (const el of clause.namedBindings.elements) {
      // el.propertyName is the original name when aliased: `{ orig as local }`.
      const original = el.propertyName ? el.propertyName.text : el.name.text
      if (original === CANONICAL_NAME) return el.name.text
    }
  }
  return null
}

/** First exported function-like with a block body (the entry point), or null. */
function findEntryFunction(sf) {
  for (const s of sf.statements) {
    if (!isExported(s)) continue
    if (ts.isFunctionDeclaration(s) && s.body) return s
    if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
          return d.initializer
        }
      }
    }
  }
  return null
}

/** Does the subtree contain a call whose callee is the identifier `name`? */
function subtreeCallsBinding(node, name) {
  let found = false
  const visit = (n) => {
    if (found) return
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name) {
      found = true
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

/** Does the subtree reference any identifier in `names` (ignoring property-member names)? */
function subtreeReferencesNames(node, names) {
  if (!names || names.size === 0) return false
  let found = false
  const visit = (n) => {
    if (found) return
    if (ts.isIdentifier(n) && names.has(n.text)) {
      const p = n.parent
      const isMemberName = p && ts.isPropertyAccessExpression(p) && p.name === n
      if (!isMemberName) {
        found = true
        return
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

function pass(reason) {
  return { status: 'PASS', reason }
}
function fail(reason) {
  return { status: 'FAIL', reason }
}
function nonpass(reason) {
  return { status: 'NON-PASS', reason }
}

function analyze(pageSf) {
  const binding = findCanonicalBinding(pageSf)
  if (!binding) {
    return fail(`canonical decision '${CANONICAL_NAME}' is not imported from '${EXPECTED_MODULE}'`)
  }

  const fn = findEntryFunction(pageSf)
  if (!fn || !fn.body || !ts.isBlock(fn.body)) {
    return fail('no exported entry function with a block body found')
  }

  const stmts = fn.body.statements

  // Dumb, honest reachability: the first top-level bare return/throw ends the
  // reachable region. Statements after it cannot gate access.
  let deadFrom = -1
  for (let i = 0; i < stmts.length; i++) {
    if (ts.isReturnStatement(stmts[i]) || ts.isThrowStatement(stmts[i])) {
      deadFrom = i
      break
    }
  }
  const reachable = (i) => deadFrom === -1 || i < deadFrom

  // Variables whose initializer calls the canonical binding: `const x = await isUserEntitled(...)`.
  const derived = new Set()
  let canonicalCalledAnywhere = false
  let canonicalCalledReachable = false

  stmts.forEach((s, i) => {
    if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (d.initializer && ts.isIdentifier(d.name) && subtreeCallsBinding(d.initializer, binding)) {
          derived.add(d.name.text)
        }
      }
    }
    if (subtreeCallsBinding(s, binding)) {
      canonicalCalledAnywhere = true
      if (reachable(i)) canonicalCalledReachable = true
    }
  })

  // A gating `if` is one whose condition uses the canonical call result —
  // either the binding directly, or a variable derived from it.
  let gatingIfReachable = false
  let gatingIfDeadOnly = false
  stmts.forEach((s, i) => {
    if (!ts.isIfStatement(s)) return
    const usesCanonical =
      subtreeCallsBinding(s.expression, binding) || subtreeReferencesNames(s.expression, derived)
    if (!usesCanonical) return
    if (reachable(i)) gatingIfReachable = true
    else gatingIfDeadOnly = true
  })

  if (gatingIfReachable) {
    return pass(`'${binding}' result gates access before the allow path`)
  }
  if (!canonicalCalledAnywhere) {
    return fail(`'${binding}' is imported but never called — the gate uses something else`)
  }
  if (canonicalCalledReachable) {
    return fail(`'${binding}' is called but its result is never used to gate access`)
  }
  // Called/guarded only in unreachable code.
  return nonpass(
    `cannot verify that the canonical decision gates access — '${binding}' appears only after an unconditional return (unreachable)`,
  )
}

function report(dir, r) {
  console.log(`${r.status}: ${dir}`)
  console.log(`  → ${r.reason}`)
  if (r.status === 'PASS') {
    console.log('  proves: entry point routes through the canonical decision point')
    console.log('  (does NOT prove the canonical decision itself is correct)')
  }
}

// --- main --------------------------------------------------------------------

const fixtureDir = process.argv[2]
if (!fixtureDir) {
  console.error('usage: check-enforcement-path.mjs <fixture-dir>')
  process.exit(2)
}

const pagePath = resolve(fixtureDir, 'page.ts')
const canonicalPath = resolve(fixtureDir, 'canonical-entitlement.ts')

if (!existsSync(pagePath)) {
  console.error(`ERROR: ${pagePath} not found`)
  process.exit(2)
}

// The canonical decision target must exist (existence, not correctness).
if (!existsSync(canonicalPath) || !moduleExportsCanonical(parse(canonicalPath))) {
  report(fixtureDir, fail(`canonical module does not export '${CANONICAL_NAME}'`))
  process.exit(1)
}

const result = analyze(parse(pagePath))
report(fixtureDir, result)
process.exit(result.status === 'PASS' ? 0 : 1)
