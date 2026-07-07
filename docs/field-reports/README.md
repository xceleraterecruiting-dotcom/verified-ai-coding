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
| Test-suite growth over the span (context, not proof — this repo's own thesis is that green counts lie; the evidence is the STRONG_RED row above) | 1,078 passing (marketing scope) | 0 → 298 | 397 | 21 → 159 | — |
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

## What it cost

The obvious objection to a workflow this heavy is price, so here is the honest
accounting. One caveat up front: only the **cold-review subagent tokens are
measured** (each review reports its usage); everything else is
operator-session estimation, not billing data. Dollar figures are
pay-as-you-go API terms, stated for readers who bill that way; all four field
projects actually ran on a Claude Code subscription, where the marginal cost
of every run was $0 beyond the plan. And be careful what the big numbers
refer to: the per-slice and per-arc rows price the **entire build** — the
skill's own share is the overhead slice, broken out below.

| Line item | Measured or estimated | Figure |
|---|---|---|
| Deterministic gates (regression-check, make-bundle, scope gate, test suites) | measured (they're local Node/vitest) | **~$0** — the 500+ mutation proofs and every test run burned CPU, not tokens |
| One cold review | **measured** (sasha arc: 18 reviews, ~1.23M subagent tokens, 33k–95k each, avg ~68k; email-cleaner reviewers 37k–57k) | **~$1–2 per review round** — the heavyweights were the adversarial ones (a live network-interceptor audit, a cold reproduction of a bundle failure) |
| One shipped slice end-to-end — **the whole feature**: read, design, implement, test, plus the skill's passes | estimated | **~$5–15** typical (sasha); up to ~$10–50 on the largest-context project (XR-Main) |
| A full multi-week arc — again, **the entire build at API list prices**, not the skill | estimated | low hundreds (sasha 19-PR arc: ~$75–200; email-cleaner: a few M tokens) up to low four figures for the biggest corpus (XR-Main, 52 runs) |
| **The skill's own marginal cost** — only the passes it adds on top of just writing the code (contracts, mutation runs, cold reviews, remediation) | reviews measured, rest estimated | **tens of dollars per arc** — e.g. ~$25 of cold reviews plus artifact/mutation passes on sasha's ~$75–200 arc |
| Overhead vs. unverified "just write it" coding | estimated, consistent across all four projects | **~2–3× tokens** (range 1.5–4×) — the contracts, mutation runs, review rounds, and remediation are extra passes |

Three findings worth stating plainly:

1. **The adversarial half is startlingly cheap.** The part of the workflow
   that caught ~40 real defects — the cold reviews — cost roughly $25 across
   sasha's entire arc. The proof mechanisms (STRONG_RED, bundles, scope gates)
   are effectively free.
2. **The dominant spend is not the ceremony.** It's the main reasoning loop
   re-reading large codebases across long sessions on a premium model. The
   skill's own overhead is a modest multiplier on a base cost you'd pay
   anyway; prompt caching does heavy lifting since the workflow's long stable
   contexts are cache-friendly.
3. **The counterfactual pays for it.** At ~$100 of overhead per arc, any one
   of the caught defects (an entitlement leak, a silent-data-loss bug, a
   never-bundling app store submission) discovered in production by a paying
   user costs more than the entire arc's verification bill.

Going forward the estimates get replaced by actuals: the ship-scorecard
template now carries a **Cost** field per run.

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
