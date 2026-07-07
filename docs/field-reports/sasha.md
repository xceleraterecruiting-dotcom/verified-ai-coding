# Field report — sasha.ai

**35 verified runs · PRs #15–#45 · 2026-06-12 → 2026-07-03 · test suite grown
0 → 52 files / 298 tests, all DB-real and provably offline**

The subject: a live consumer AI-companion product (web + mobile) with real
users, real entitlement tiers, and live model APIs on the hot path. This is
the field run that generated most of the failure classes now encoded in the
skills, because it had the richest adversarial-review record: **8 cold reviews
returned FAIL or NEEDS_REVIEW, and every one was a real defect.** Artifacts
live under `.verified/<slice>-<date>/` in the private repo — contract,
invariant checklist, and scorecard per run, with 37 STRONG_RED mutation
records.

## Scoreboard

| Metric | Value |
|---|---|
| Verified runs with full artifacts | 35 |
| PRs shipped through the workflow | 31 (#15–#45) |
| Cold reviews returning FAIL / NEEDS_REVIEW | 8 — every one a real defect |
| STRONG_RED mutation records | 37 |
| Reviewer-original finds (not in the builder's contracts) | 6 |
| Entitlement leaks stopped pre-prod | 2 |
| Silent-data-loss bugs stopped pre-prod | 3 |

The honest headline: **the builder wrote every one of those bugs, and the
workflow's adversarial half caught them before users did** — except three that
only reality could surface, which the operator-check discipline caught instead
(see below). That is the system working as designed.

## The catches that became skill rules

### The reviewer traced the call graph instead of trusting the contract

Slice 2 (memory read path): pgvector blend retrieval with the entitlement gate
in SQL (`AND "tier" IN (${tierList})`). Verdict: **FAIL** — the reviewer
enumerated the function's callers itself and found a **fourth caller** (the
group route) leaking paid PERMANENT memories to FREE users. The contract's
grounding had been done against **stub behavior**. This is now an explicit
instruction in `prompts/cold-reviewer.md`: enumerate the callers of every
touched decision point yourself; the contract's caller list is a claim.

### The fantasy enum: 289 green tests over a dead feature

Slice U1 (ui-alive-home): **FAIL** — the presence filter checked
`status === "active"`, a value that **cannot exist** (real enum is
`open|advancing|resolved`; a sanitizer coerces anything else). Contract
grounding and test fixtures shared the same fantasy, so 289 tests were green
over a flagship feature that never fired. The fix types against the package's
*exported* type; the re-verifier planted the bogus literal back and got
`error TS2367: no overlap` — **the compiler is now the gate.** Encoded as the
grounding-against-stubs anti-pattern in `verified-implementation` Step 2.

### "The unit tests validated payloads the client author imagined"

Slice 11 (interview UI): **FAIL, four blockers.** The unit tests validated
payloads the author imagined, not the ones the routes actually emit — a beat
choreography dead-ended every interview, the success redirect read the wrong
query param, a gallery had no link, an input mode was unreachable. Remediation
introduced **server-real payload tests** (fixtures captured from the actual
route responses). The re-reviewer then found on its own that refreshing after
preview-approval silently destroyed a finished interview. Encoded as the
server-real payload rule in `verified-implementation` Step 7.

### The suite that wasn't offline

Slice 7 (inner-life): three *pre-existing* test files were making live Haiku
calls through a new step's default client — one test had become a race against
real model latency. All 22 call sites stubbed; the final reviewer ran the
entire suite against a **dead network port with bogus keys** — 232/232 in
8.5s — proving zero calls even attempted. Slice 9 repeated the class: three
test files reached the embeddings provider live, invisible only because the
key in the local `.env` was dead (it 401s). Fixed with stubs plus a permanent
**credential tripwire** (dummy keys injected into every vitest worker); the
re-reviewer ran a blocking network interceptor: 254 tests, zero external
attempts. Encoded as the provably-offline rule in `verified-implementation`
Step 7.

### The type gate was structurally blind to the real bundler

mobile-parity: **FAIL** — the app didn't bundle, because Metro ignores package
`exports` that `tsc` (`moduleResolution: bundler`) honors. Typecheck was green
over an app that could not build; a handoff also routed to a dead screen whose
fallback sat *after* a throwing fetch. The bundle gate is now the real
platform artifact (`expo export` producing the Hermes bundle), reproduced cold
by the re-reviewer. In app-store-readiness, the re-verifier **byte-searched
the compiled Hermes bundle in ASCII and UTF-16** to prove every purchase
string was dead-code-eliminated. Encoded as the platform-artifact gate in
`verified-implementation` Step 7.

### Non-discriminating mutations, rejected for the right reason

Slice 1 (memory write path): two STRONG_RED attempts came back
NOT_DISCRIMINATING — a CAS test masked by a watermark check, a SQL guard
shielded by an upstream check. Both were **rewritten as direct seam tests**
rather than loosening the mutations until something failed. The same slice's
cold review caught a silent-data-loss blocker: bad-JSON extraction flagged
sessions as swept with no retry — memory loss. Fixed with a `parseFailed`
discriminant; the sweep now throws and releases its claim.

## Other verdicts in brief

- **Slice 0 (migrate-baseline):** converted prod from `prisma db push` to real
  migration history; proof reproduced the P3005 failure first, then proved
  `migrate resolve` → no-op deploy. STRONG_RED: a removed column detected as
  drift.
- **Slice 3 (bleed):** NEEDS_REVIEW for three missing proofs; also killed a
  live bug — a route wrote per-user state onto shared archetype rows. Route
  deleted.
- **Slice 6 (user-model):** FAIL, two blockers — one reproduced line-for-line
  a starvation bug class fixed in a prior slice (the reviewer cited the
  builder's own fix comment predicting it), and paid-tier memory content was
  being distilled into paragraphs rendered in free-tier prompts ("leak in
  substance"). Consolidation became tier-aware; the re-reviewer mutation-tested
  both leak paths independently.
- **Slice 9 (sync-score):** besides the live-API blocker above, a contracted
  proof had simply never been written, and a backfill script's filter-after-map
  re-indexed embeddings — every vector after a blank example misattributed, in
  the one prod run the script existed for.
- **Slice 10 (co-creation):** PASS with a real find — an idempotency backstop
  keyed on `(userId, name)` would have silently destroyed a finished interview
  on a name collision. The reviewer also computed worst-case per-interview
  spend against the spec budget.
- **group-identity:** a user-visible bug root-caused to mapping every
  character message to an `assistant` turn — in groups, each responder saw
  other characters' messages as its own prior statements. Fixed and
  STRONG_RED-verified by reverting the exact mapping.

## What operator checks caught that tests couldn't

Three production failures were structurally invisible to any test suite:

1. **All 8 piped `vercel env add` values were empty in prod** for ~a day
   (every feature degraded fail-safe). Fixed via the REST API with
   length-verified pulls.
2. **Five releases silently failed for 5 hours** — a client import dragged
   `node:fs` into the webpack build; the domain alias kept answering health
   checks from the old deploy; the release script's piping ate the exit code.
   The release script now polls the *newest deployment by ID* to READY.
3. **A double-render** — a latent realtime-echo blind-append that unmasked the
   moment realtime actually started working.

These are the origin of `templates/operator-checklist.md` and the operator-
check requirement in `ship-review`: for changes that touch deployment or
config surface, `OPERATOR-CHECK` evidence is part of the gate, not an
afterthought.

## Evidence boundary

Private repo; all reviews same-vendor (fresh-context or different-Claude-model,
recorded per scorecard); numbers operator-verified against the artifacts. See
the [field-reports evidence boundary](README.md).
