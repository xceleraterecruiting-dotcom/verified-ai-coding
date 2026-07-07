# Field reports

The harness's original evidence was one case study and a set of proofs run
against itself. This directory is the other kind of evidence: **what happened
when the skills were run for weeks at a time on four real codebases**, by the
same operator, with the artifacts (contracts, invariant checklists, mutation
specs, scorecards) accumulating in each repo's `.verified-ai/` / `.verified/`
tree.

## Evidence boundary — read this first

All four subject repositories are **private**. Every number below was produced
by running the listed commands inside those repos and is reproducible **only
with access to them**. Nothing here is independently re-runnable from this
public repo, and every cold review cited was same-vendor (fresh-context or
different-Claude-model — reviewer context is recorded per scorecard in the
subject repos). These reports are the operator's account, checked against the
artifacts at the time of writing — treat them as labeled testimony with a paper
trail, not as mechanical proof. The mechanical proofs live in the subject
repos.

## Aggregate scoreboard

| Metric | XR-Main marketing | sasha.ai | Five Star | email-cleaner | Total |
|---|---|---|---|---|---|
| Verified runs with artifacts | 52 | 35 | 36 | 10 | **133** |
| Span | Jun 8 – Jul 2026 | Jun 12 – Jul 3 | Jun–Jul 2026 | Jun–Jul 2026 | ~4 weeks |
| Mutation specs / STRONG_RED records | 474 specs, 47 scorecards citing STRONG_RED | 37 | per-slice | 3 live-verified | **500+** |
| Cold reviews returning FAIL / NEEDS_REVIEW | multiple (defects fixed pre-merge) | 8 — every one a real defect | ~20 blockers across the AI slices | 4 slices, 10 blockers | **~40 real defects stopped pre-ship** |
| Tests at end of span | 1,078 passing (marketing scope) | 298 (0 at start) | 397 | 159 (21 at start) | **~1,900** |
| Human gates held | merge + invariant call | merge + invariant call | merge + invariant call | merge + invariant call | all |
| Autonomous dangerous actions (deploys, DDL, flag flips, secrets) | 0 | 0 | 0 | 0 | **0** |

## The reports

- **[XR-Main marketing engine](xr-main-marketing.md)** — 52 runs building a
  publish-governed content pipeline where the whole point was that nothing must
  ever publish. Largest STRONG_RED corpus (474 mutation specs); ends with the
  skill's loop being automated behind a fail-closed danger classifier.
- **[sasha.ai](sasha.md)** — 35 runs on a live consumer product with real
  users. The richest cold-review record: 8 FAIL/NEEDS_REVIEW verdicts, all real
  defects, including two entitlement leaks and three silent-data-loss bugs
  stopped pre-prod. Source of most of the failure classes now encoded in the
  skills.
- **[Five Star](five-star.md)** — 36 runs building an L3-classified game
  (minors' data + public AI-generated output + real money) from a
  `spec-compiler` plan. The AI-safety cluster: ~13 fabrication/leak/forge holes
  caught by cold review, including a forgeable human-approval gate.
- **[email-cleaner](email-cleaner.md)** — 10 slices, the smallest and the most
  instructive failure: a clean, all-green, cold-reviewed app that hit two
  production bugs on first contact with the real mail provider. The
  mock-fidelity lesson, in full.

## What the field record changed in the skills

Recurring failure classes from these runs are now encoded in the skills rather
than left as war stories:

| Failure class | Field evidence | Where it now lives |
|---|---|---|
| Grounding done against stubs/fixtures instead of the exporting source (the "fantasy enum") | sasha U1: presence filter checked `status === "active"`, a value that cannot exist; 289 green tests over a dead flagship feature. sasha slice 2: contract grounded on stub behavior missed a fourth caller leaking paid content | `verified-implementation` → Step 2 anti-pattern |
| Client tests validating payloads the author imagined, not what routes emit | sasha slice 11: "the unit tests validated payloads the client author imagined, not the ones the routes actually emit" — four blockers | `verified-implementation` → Step 7 server-real payload rule |
| Test suites silently reaching live paid APIs | sasha slices 7 and 9: pre-existing tests made live model calls; a dead key masked live embedding calls | `verified-implementation` → Step 7 provably-offline rule |
| Type gate structurally blind to the real bundler | sasha mobile-parity: Metro ignores package `exports` that `tsc` honors — the app didn't bundle while typecheck stayed green | `verified-implementation` → Step 7 platform-artifact gate |
| Safety gate forgeable through a returned mutable reference | Five Star 9c: `item.status = "APPROVED"` bypassed the human-review queue | `verified-implementation` → Step 7 redteam case; cold-reviewer prompt |
| STRONG_RED masked by an upstream check (NOT_DISCRIMINATING for the wrong reason) | sasha slice 1: a CAS test masked by the watermark, a SQL guard shielded by an upstream check — rewritten as direct seam tests | `ship-review` → mutation validity guidance |
| Reviewer trusting the contract's caller list | sasha slice 2: reviewer traced the call graph instead and found the fourth caller | `prompts/cold-reviewer.md` |
| Failures only reality can surface (env values, silent deploys, provider echo, provider quirks) | sasha §operator-checks; email-cleaner Yahoo bugs | `ship-review` → operator checks; `templates/operator-checklist.md` |
