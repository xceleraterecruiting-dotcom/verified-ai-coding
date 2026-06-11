#!/usr/bin/env node
/**
 * Deterministic evidence-bundle assembly.
 *
 * The review bundle is evidence; assembling it by hand is how evidence gets silently dropped
 * (session-proven: `git diff` omits untracked files, which cost a full review round). This tool
 * captures a base..head range mechanically and emits a hashed manifest so a reviewer can verify
 * the bundle is complete before trusting it.
 *
 *   node scripts/make-bundle.mjs --base <commit> [--head <commit>] --out <dir> [--repo <path>]
 *     [--include-untracked <path>]... [--capture <label>:<command>]... [--allow-dirty]
 *
 * Emits into --out: diff.patch, changed-files.txt, new-files/<path> (FULL contents of files added
 * in the range), untracked-files.txt, untracked/<path> (explicitly included untracked files),
 * outputs/<label>.txt (captured gate commands), manifest.json (sha256/bytes/lines for everything),
 * bundle-summary.md.
 *
 * Fails closed: unresolvable commits, missing referenced files, dirty tracked tree without
 * --allow-dirty, or an --out inside the repo. Never mutates the source repo (read-only git).
 * No dependencies.
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Parse CLI arguments. Pure. Throws on unknown/missing args. */
export function parseArgs(argv) {
  const args = { repo: process.cwd(), base: null, head: 'HEAD', out: null, includeUntracked: [], capture: [], allowDirty: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} requires a value`)
      return argv[++i]
    }
    if (a === '--repo') args.repo = next()
    else if (a === '--base') args.base = next()
    else if (a === '--head') args.head = next()
    else if (a === '--out') args.out = next()
    else if (a === '--include-untracked') args.includeUntracked.push(next())
    else if (a === '--capture') args.capture.push(next())
    else if (a === '--allow-dirty') args.allowDirty = true
    else throw new Error(`unknown argument: ${a}`)
  }
  if (!args.base) throw new Error('--base is required')
  if (!args.out) throw new Error('--out is required')
  return args
}

/** Split `git status --porcelain` into dirty-tracked lines and untracked paths. Pure. */
export function classifyPorcelain(porcelain) {
  const lines = porcelain.split('\n').filter(Boolean)
  return {
    dirtyTracked: lines.filter((l) => !l.startsWith('??')),
    untracked: lines.filter((l) => l.startsWith('??')).map((l) => l.slice(3)),
  }
}

/** Extract paths with status A (added) from `git diff --name-status` output. Pure. */
export function addedFiles(nameStatus) {
  return nameStatus
    .split('\n')
    .filter((l) => l.startsWith('A\t'))
    .map((l) => l.slice(2))
}

/** Parse a `<label>:<command>` capture spec. Pure. Throws on malformed input. */
export function parseCaptureSpec(spec) {
  const idx = spec.indexOf(':')
  if (idx < 1) throw new Error(`--capture must be <label>:<command>, got: ${spec}`)
  const label = spec.slice(0, idx)
  if (!/^[\w.-]+$/.test(label)) throw new Error(`capture label must match [\\w.-]+: ${label}`)
  return { label, command: spec.slice(idx + 1) }
}

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

/** Render the human summary from the manifest + listings. Pure. */
export function buildSummary(manifest, nameStatus, untrackedList) {
  return [
    '# Evidence bundle',
    '',
    `- Repo: ${manifest.repo}`,
    `- Range: ${manifest.base.ref} (${manifest.base.sha.slice(0, 7)}) .. ${manifest.head.ref} (${manifest.head.sha.slice(0, 7)})`,
    `- Created: ${manifest.createdAt}`,
    `- Tracked tree dirty: ${manifest.trackedTreeDirty}`,
    '',
    `## Contents (${manifest.files.length} files, hashes in manifest.json)`,
    '',
    ...manifest.files.map((f) => `- \`${f.path}\` — ${f.role}, ${f.bytes} bytes, ${f.lines} lines, sha256 ${f.sha256.slice(0, 12)}…`),
    '',
    '## Changed files (tracked)',
    '',
    '```',
    nameStatus.trim() || '(none)',
    '```',
    '',
    '## Untracked at bundle time',
    '',
    '```',
    untrackedList.join('\n') || '(none)',
    '```',
    '',
    ...(manifest.captures.length
      ? ['## Captures', '', ...manifest.captures.map((c) => `- ${c.label}: \`${c.command}\` → exit ${c.exitCode}`), '']
      : []),
  ].join('\n')
}

function git(repo, gitArgs) {
  return execFileSync('git', ['-C', repo, ...gitArgs], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

function fail(msg) {
  console.error(`make-bundle: error: ${msg}`)
  process.exit(1)
}

export function main(argv) {
  let args
  try {
    args = parseArgs(argv)
  } catch (e) {
    fail(e.message)
  }
  const repo = resolve(args.repo)
  const out = resolve(args.out)

  let repoTop
  try {
    repoTop = git(repo, ['rev-parse', '--show-toplevel']).trim()
  } catch {
    fail(`not a git repo: ${repo}`)
  }
  if ((out + sep).startsWith(repoTop + sep)) {
    fail(`--out must be outside the repo (${repoTop}) so bundling never mutates the source tree`)
  }

  let baseSha, headSha
  try {
    baseSha = git(repo, ['rev-parse', '--verify', `${args.base}^{commit}`]).trim()
    headSha = git(repo, ['rev-parse', '--verify', `${args.head}^{commit}`]).trim()
  } catch {
    fail(`cannot resolve --base ${args.base} / --head ${args.head} to commits`)
  }

  const { dirtyTracked, untracked } = classifyPorcelain(git(repo, ['status', '--porcelain']))
  if (dirtyTracked.length > 0 && !args.allowDirty) {
    fail(`tracked working tree is dirty (${dirtyTracked.length} paths); commit/stash or pass --allow-dirty:\n${dirtyTracked.join('\n')}`)
  }

  mkdirSync(out, { recursive: true })
  const emitted = []
  const writeOut = (relPath, content, role) => {
    const abs = join(out, relPath)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content)
    emitted.push({ relPath, role })
  }

  // Tracked diff + listings
  const diff = git(repo, ['diff', `${baseSha}..${headSha}`])
  writeOut('diff.patch', diff, 'diff')
  const nameStatus = git(repo, ['diff', '--name-status', `${baseSha}..${headSha}`])
  writeOut('changed-files.txt', nameStatus, 'listing')

  // FULL contents of files added in the range — a diff alone under-evidences new files
  for (const f of addedFiles(nameStatus)) {
    let content
    try {
      content = git(repo, ['show', `${headSha}:${f}`])
    } catch {
      fail(`new file referenced by the range is missing at head: ${f}`)
    }
    writeOut(join('new-files', f), content, 'new-file')
  }

  // Untracked: list everything, embed what was explicitly requested
  writeOut('untracked-files.txt', untracked.join('\n') + (untracked.length ? '\n' : ''), 'listing')
  for (const f of args.includeUntracked) {
    const abs = join(repoTop, f)
    if (!existsSync(abs)) fail(`--include-untracked path does not exist: ${f}`)
    if (!untracked.includes(f)) fail(`--include-untracked path is not untracked: ${f}`)
    writeOut(join('untracked', f), readFileSync(abs), 'untracked-file')
  }

  // Captured gate commands (tests, typecheck, build) — output recorded verbatim with exit code
  const captures = []
  for (const spec of args.capture) {
    let parsed
    try {
      parsed = parseCaptureSpec(spec)
    } catch (e) {
      fail(e.message)
    }
    const res = spawnSync('sh', ['-c', parsed.command], { cwd: repo, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
    const body = `$ ${parsed.command}\n(exit ${res.status})\n\n--- stdout ---\n${res.stdout ?? ''}\n--- stderr ---\n${res.stderr ?? ''}`
    writeOut(join('outputs', `${parsed.label}.txt`), body, 'capture')
    captures.push({ label: parsed.label, command: parsed.command, exitCode: res.status })
  }

  // Manifest last — hashes cover every emitted file
  const files = emitted.map(({ relPath, role }) => {
    const buf = readFileSync(join(out, relPath))
    return { path: relPath, role, bytes: buf.length, lines: buf.toString('utf8').split('\n').length, sha256: sha256(buf) }
  })
  const manifest = {
    tool: 'verified-ai-coding/make-bundle',
    createdAt: new Date().toISOString(),
    argv,
    repo: repoTop,
    base: { ref: args.base, sha: baseSha },
    head: { ref: args.head, sha: headSha },
    trackedTreeDirty: dirtyTracked.length > 0,
    untrackedCount: untracked.length,
    captures,
    files,
  }
  writeOut('manifest.json', JSON.stringify(manifest, null, 2) + '\n', 'manifest')
  writeOut('bundle-summary.md', buildSummary(manifest, nameStatus, untracked), 'summary')

  console.log(`bundle written: ${out} (${files.length + 2} files)`)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) main(process.argv.slice(2))
