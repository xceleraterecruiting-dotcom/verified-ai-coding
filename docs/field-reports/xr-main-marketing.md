# Field report — XR-Main marketing engine

**52 verified runs · ~40 PR merges to main (#28–#65) · 2026-06-08 → 2026-07**

The subject: a marketing/publishing engine inside a recruiting platform, where
the governing constraint was *"nothing must ever publish, decrypt, deploy, or
alter schema without a human."* Every merged change was inert (behind
default-OFF flags), schema-additive-or-zero, and human-approved at the merge
gate. The repo is private; every figure below was verified against it at the
time of writing (commands listed so the operator can re-verify).

## Headline metrics

| Metric | Value | How to reproduce (in the private repo) |
|---|---|---|
| Verified-AI run directories | 52 | `ls .verified-ai/runs/` |
| Scorecards on record | 52 | `find .verified-ai/runs -name '*scorecard.md'` |
| Scorecards citing STRONG_RED proofs | 47 | `grep -rl STRONG_RED .verified-ai/runs/*/*scorecard.md` |
| Committed mutation-spec files (`v*.json`) | 474 | `find .verified-ai/runs -path '*regression*' -name 'v*.json' ! -path '*out*'` |
| Marketing PR merges to main | ~40 (PR #28 → #65) | `git log --merges origin/main` |
| Marketing test files / passing tests | 100 files / 1,078 (+23 skipped) | `npx vitest run src/lib/marketing` |
| `Marketing*` Prisma models (all additive) | 19 | `grep -c '^model Marketing' prisma/schema.prisma` |
| Production deploys triggered | **0** | `gh api .../deployments` |
| Schema-destructive changes shipped | **0** | every scorecard: "schema diff 0" |

## The loop every run followed

Each run is a directory under `.verified-ai/runs/<date>-<slug>/` with up to 12
artifacts, enforced by this repo's scripts:

```
contract.md → invariant-checklist.md → allowed-forbidden-files.md
  → implement (allowed files only)
  → gate battery (typecheck · full suite · check-allowed-files · schema-diff-0 · source-trace)
  → regression-check.mjs --mutations → STRONG_RED proof per invariant
  → make-bundle.mjs (sha256 manifest, assembled outside the repo)
  → cold review (different Claude model, cold bundle only, no repo/chat access)
  → ship-scorecard.md → HELD (no push)
  → [separate human approval] → branch/PR hygiene → review → merge
```

The two ungameable inputs stayed human: the invariant/risk call in the
contract, and the merge.

## The core mechanism at scale: STRONG_RED

This project produced the largest mutation-spec corpus of any field run — 474
specs. A representative one, from the console command-center run:

```json
{ "findingId": "milestone-7.3-v1-publish-control-absent",
  "invariant": "The command center never exposes a publish control (publishControl constant 'absent').",
  "expectedTests": ["CC9"],
  "mutations": [{ "file": "src/lib/marketing/console/command-center.ts",
    "find": "publishControl: 'absent',", "replace": "publishControl: 'present',",
    "why": "a publish control appears on the command center -> CC9 must catch it" }] }
```

Tool verdict: `STRONG_RED`, `missing: []`, `unexpected: []` — the mutation
compiled, failed exactly the declared assertion, and fixed HEAD is green. That
is proof the test *discriminates* the invariant, not merely that it exists. 47
of 52 scorecards cite STRONG_RED batches (publish-readiness 16, command-center
10, distribution-ops 9, packet+workspace 13, campaign/variants 8, …).

## Standing guards (re-run at reporting time)

| Guard | Result | What it proves |
|---|---|---|
| `create-publish-job-route.test.ts` | 7/7 | Approval gates job *creation*, not publishing: 401/403/404/400 refusals, 201 create, 200 idempotent, 422 REFUSED when blocked |
| `fail-closed-crypto-config.test.ts` | 11/11 | Encryption config fails closed in prod (throws on missing/short key) |
| `console-scope.test.ts` (C11) | green | Recursively scans every console file for forbidden tokens (provider SDK, decrypt, createPublishJob, cron, `fetch(`) |
| `classifier.test.mjs` | 14/14 | The accelerator's allow-list safety boundary + parity with the workflow copy |
| `go-live/preconditions.test.ts` | 6/6 | Fail-closed go/no-go for ever flipping publishing on |
| `instagram/build-requests.test.ts` | 6/6 | Request builder is pure, inert, token-free |

Note the pattern: several guards are **architecture tests** — a test that greps
the built artifact or the source tree for forbidden tokens is a cheap,
deterministic way to keep an invariant true against future edits, not just
present ones.

## What cold review caught here

Every merged milestone carried a cold review by a different Claude model
reading only a sha256-manifested bundle (no repo, no chat). Real defects caught
and fixed pre-merge included: the danger classifier's `..`-traversal
false-INERT, a double-quote `"use server"` detection gap, and a
"Not configured" → "Not available" normalization bug in campaign intake.

## The meta-achievement: the loop automated behind a classifier

The final phase used the skill to build an accelerator that runs the mechanical
loop autonomously (`.verified-ai/autoloop/` + a workflow script):

- The linchpin is a **fail-closed allow-list danger classifier** (14/14 tests,
  cold-reviewed twice). Anything not provably inert is ticketed for a human,
  not built.
- It auto-built 3 inert slices (each: build-agent → workflow-owned gates →
  independent cold review → held branch), and a **negative test** confirmed
  that a planted drift into the publish-gate file was ticketed, not built.

This is the first field instance of the harness running its own loop with the
human gates intact — the classifier decides *inert vs. human*, never *safe vs.
unsafe on its own authority*.

## Boundaries held

Zero of these ever happened autonomously across 52 runs: live publishing, flag
flips, `prisma db push`/DDL apply, secret rotation, git-history rewrite or
force-push, deploys, credential decryption, wiring a provider SDK live. The
go-live gate, run at reporting time, returns NOT READY and names the three
genuine blockers — the system reports its own incompleteness.

## What this report does and does not prove

It **does** show the harness holding a "must never happen" boundary across 52
consecutive runs at production scale, with mechanical mutation proof behind
most scorecards. It does **not** prove reviewer independence beyond
different-Claude-model (same vendor), and the numbers are operator-verified
against a private repo — see the [evidence boundary](README.md).
