# Verified AI Coding

**Stop vibe-coding. Make AI prove the feature.**

An **evidence-backed review harness for AI-assisted code changes.** It converts business-invariant claims into: contracts, hashed evidence bundles, attributed mutation specs, discriminating regression checks, cold review, risk-tiered ship/no-ship scorecards, and explicit runtime-verification limits.

It is a workflow you run inside Claude Code, plus two dependency-free verification tools (`scripts/make-bundle.mjs`, `scripts/regression-check.mjs`).

**Start here:**
- [`docs/case-study-charleston-passing-academy.md`](docs/case-study-charleston-passing-academy.md) — one real payments app, from "all tests green" to 9 confirmed invariant violations to mechanically provable fixes
- [`proofs/proof-09-end-to-end-mechanized-run.md`](proofs/proof-09-end-to-end-mechanized-run.md) — the harness dogfooded end-to-end on a fresh Level 2 change
- [`proofs/proof-08-mechanized-regression-evidence.md`](proofs/proof-08-mechanized-regression-evidence.md) — pre-registered tool validation, including the falsified assumption now encoded in the tool

---

## The problem

AI writes code that *looks* right and passes a glance. The failure mode isn't syntax — it's silent violation of business rules below the UI. A disabled "Publish" button feels safe, but the button is not the boundary. The boundary is the guard in the service that creates the publish job, and AI routinely writes a guard that checks too little.

> **A disabled button is not a safety boundary.** Invariants must be enforced below the UI, and proven there.

## What this pack does

Three skills carry the workflow, macro to micro:

| Skill | When it runs | What it produces |
|---|---|---|
| **`spec-compiler`** *(v0.6)* | You have a SPEC — a feature/product description, not yet a bounded change | Nine planning documents (intake with verbatim provenance, requirements, non-goals, domain model, invariants, risk map, acceptance criteria, implementation slices, open questions), structure-gated by `scripts/plan-lint.mjs` and cold-reviewed against a pre-registered rubric. **No code** — this is verified decomposition, not autonomous coding. High-risk ambiguity blocks until resolved. |
| **`verified-implementation`** | You're about to build a feature (or one compiled slice) | A feature contract, must-always / must-never invariants, business-invariant risk call, allowed/forbidden files, test + eval + redteam plans, observability and ship gates — *before any code* |
| **`ship-review`** | You have a diff and want to ship | A model-agnostic cold-review bundle, a PASS / NEEDS_REVIEW / FAIL verdict, blockers turned into proof obligations, a bounded remediation prompt when needed, and a ship/no-ship scorecard |

The pipeline: **spec → slices → (contract → code → review) per slice.** One slice = one
verified-implementation run = one ship-review.

## Versions

- **v0.7.0 — decision-grade planning** (tagged `v0.7.0`; supersedes `v0.6-rc1`): the release
  where the spec compiler got materially better at saying *"show me the mechanism, show me the
  evidence, show me who decides, show me what blocks launch — and do not confuse a passing test
  with permission to act."* Four items, each pre-registered before its eval, re-proven on the
  fixture(s) that earned it, and accepted on falsifier-checked evidence:
  1. **plan-lint proof-obligation mapping rule** (mechanical) — every L2+ invariant a slice
     touches needs a named STRONG_RED proof obligation in that slice (or an explicit
     not-applicable rationale). Promoted from a reviewer-caught gap; retroactively catches both
     PO gaps human reviewers had found by hand.
  2. **Payment-depth lens** (12 requirements) — grant-time amount/currency/captured
     verification, session supersession, reversal-vs-payment race serialization,
     money-moved-but-state-rejects reconciliation, fail-closed payment data, money-state audit.
     Re-proven: CPA r3 PASS 5/5, multi-slice r2 PASS 5/5.
  3. **AI-output depth lens** (15 requirements) — per-generation model/prompt-version/run
     capture, claim provenance, no-fabrication by verification not instruction, generator
     goldens + adversarial cases, safe decline, leak-safe surfaces, structured-output validation,
     L2+ human approval, dry-run-first as a render-and-log stage, minors/likeness checks,
     end-to-end audit. Re-proven: XR-governance r2 PASS 9/9, XR-orchestration r2 PASS 8/8.
  4. **Evidence-sufficiency lens** (9 requirements) — a claim is satisfied only when the plan
     names the exact evidence, the decision it supports, the sufficiency threshold, and the
     behavior when evidence is missing/stale/ambiguous/contradicted. Launch gates carry an
     explicit **PASS / FAIL / INSUFFICIENT_EVIDENCE** trichotomy defaulting to no-go; judged
     metrics require instrument calibration before they gate anything. Re-proven: GroundTruth r2
     PASS 11/11 — "we launch when the numbers look good" became a blocking question ("what are
     the numbers, and who signs?").
  Every fixture that ever scored NEEDS_REVISION has been re-proven PASS under the deeper rubric;
  every lens round recorded overfitting falsifiers (lens-scoping, no escalation-for-vocabulary,
  discriminating lens-derived labels) and all came back clean. Known non-blocking ergonomic
  issue: the per-slice PO single-line format causes mechanical first-iteration lint failures that
  compiles self-correct (multi-line PO support is a recorded candidate). **Frozen backlog,
  deliberately untouched:** failure-class library, enforced reviewer isolation, cross-vendor
  review, runtime smoke.

- **v0.5 — evidence-backed review harness** (tagged `v0.5-review-harness`, frozen): make-bundle,
  regression-check, risk-leveled ship-review, proofs 01–09, the CPA case study.
- **v0.6 — spec → verified implementation planning** (status: **PARTIAL DOGFOOD**, see proof-10):
  spec-compiler skill, plan-lint gate, plan-review rubric, seven planning fixtures across three
  real systems and three synthetic sanity checks — see [`docs/fixture-domains.md`](docs/fixture-domains.md)
  (CPA: money/status; XR Marketing: AI-output governance + orchestration idempotency;
  GroundTruth: enterprise-agent trust boundaries; plus auth, multi-slice, cosmetic). Evals run so
  far: XR-governance FULL (PASS, 6/9 ground-truth HIT), CPA FULL (NEEDS_REVISION — the plan
  missed the verified-email class the real review caught, which is the eval working), cosmetic
  LIGHT (proportionate L0). Four fixture evals pending.

The rule that holds the whole thing together:

> **Review and scorecard are read-only. Bounded remediation is the only write step, and it runs only after a FAIL or NEEDS_REVIEW.**

## Principles

- **The reviewer model is pluggable.** GPT-5.5 is not the product. Drop in any capable model, or a fresh Claude session, as the cold reviewer.
- **Deterministic gates win; model review is advisory.** Tests, type checks, and assertions are the real gates. The cold review catches what they miss.
- **Invariants are enforced below the UI.** If the only thing stopping a bad action is a disabled button, it isn't stopped.
- **Failed reviews create proof obligations.** A blocker isn't "fix this vibe" — it's a named problem with a required proof, a minimal allowed fix, and a list of forbidden changes.
- **Bounded remediation stays bounded.** Fix only the listed blockers. One regression test per blocker. Smallest patch possible. No broad rewrites. If you discover a bigger issue, report it as a follow-up — don't silently fix it.

## How to inspect this repo

Don't trust the narrative — the proofs are designed to be checked. In rough order of effort:

```bash
# 1. Unit tests for the verification tools (no network, no fixture needed)
node scripts/make-bundle.test.mjs
node scripts/regression-check.test.mjs

# 2. Read a committed regression result and check its claims against its own JSON:
#    provenance (findingId), declared expectedTests, per-assertion failures, file hashes
cat proofs/appendix/proof-09/portal-F1-regression-result.json

# 3. The negative path: a spec declaring a wrong discriminator gets demoted, not counted
cat proofs/appendix/proof-08/e1d-expectation-mismatch-negative-path.json

# 4. With the fixture repo present (a real app with FAIL→PASS history), re-run a proof live:
node scripts/regression-check.mjs --repo <fixture> \
  --tests tests/portal-blockers.test.ts \
  --mutations examples/regression-check-sample/m-b2-amount-guard.json
# Expected: STRONG_RED, exactly the 2 declared discriminators, GREEN on HEAD

# 5. Verify any bundle manifest hash yourself
shasum -a 256 <bundle>/diff.patch   # compare against <bundle>/manifest.json
```

The case study separates builder-authored interpretation from these rerunnable artifacts — the
documents tell you which is which. Verbatim cold-review transcripts live in the fixture repo
under `verification/transcripts/`.

## Public evidence boundary

This repo is the harness plus its proof artifacts. Some **subject repositories used as fixtures
remain private** because they contain business-sensitive material (a real payments application, a
permission-aware enterprise assistant, an unreleased content engine). Consequences for a public
reader, stated plainly:

- **You can inspect:** every script, skill, template, and rubric; the proof documents
  (`proofs/`) with their pre-registrations; verbatim cold-review transcripts and complete
  compiled-plan appendices (`proofs/appendix/`); hashed result JSONs; and the release tags.
- **You can re-run:** the tool unit suites and the fixture *planning* evals (the fixture specs
  in `examples/spec-compiler-fixtures/` are in this repo) — compile a plan, lint it, review it.
- **You cannot re-run end-to-end:** the v0.5 code-level cases (live `regression-check` against
  the payments fixture repo's git history, manifest re-verification against its bundles) — those
  require the private subject repo. The generated proof artifacts and transcripts from those runs
  are committed here; the claims that rest on them are labeled in the case study's disclosure
  section. This is the harness's own evidence-sufficiency rule applied to itself: we state what
  the public evidence can and cannot show rather than letting "it's reproducible" blur the two.

**Fixture data note:** three fixtures are synthetic (auth, multi-slice, cosmetic); the others are
paraphrased from real product intent with answer-key material excluded (provenance headers in
each file say exactly what was excluded and why). Any real business details that appear inside
fixture specs and compiled-plan appendices — including pricing figures — are **historical fixture
evidence preserved for verbatim-evidence integrity, not an active offer, current price list, or
public pricing page.**

## What this is not

- **Not formal verification.** No proofs about all executions — evidence about specific invariants, specific mutations, specific tests.
- **Not runtime validation**, unless a scorecard's `Runtime verification` field says so. `NONE` means the code was never executed against real infrastructure, and the scorecard must say "merge-grade," never "production-ready."
- **Not independent or cross-vendor review yet.** Every verdict recorded here is same-vendor (Claude reviewing Claude), fresh-context, with tool isolation *attested* rather than enforced. The reviewer-context metadata records this honestly per review.
- **Not bug prevention.** The session that built this introduced bugs in every artifact class — page, fixes, tests, evidence bundles. The harness detected them; it did not prevent them.
- **Not proof that AI code is correct.** The defensible claim: it catches classes of business-invariant failures that normal green gates miss, and it forces every PASS to state its evidence boundary.
- **Not autonomous coding.** `spec-compiler` plans; it writes no code (plan-lint mechanically rejects code in planning docs). Planning outputs are model judgment with mechanical structure checks — the risk classification is model-authored with mandatory spec citations, validated for shape, and challenged by a cold plan-review; a script that pretended to classify risk semantically would be false confidence.

## Quick start

1. **Install** — copy `skills/verified-implementation` and `skills/ship-review` into your project's `.claude/skills/`. See [`docs/install.md`](docs/install.md).
2. **Plan a feature** — ask Claude Code to run `verified-implementation` on your feature request. You get a contract and invariants before code.
3. **Review a diff** — ask Claude Code to run `ship-review`. You get a cold-review bundle and a ship/no-ship call.
4. **Remediate if needed** — only on FAIL / NEEDS_REVIEW, run the bounded remediation prompt it generates.

## Repo layout

```
verified-ai-coding/
  README.md
  skills/                  # the two skills (copy into .claude/skills/ to activate)
  agents/reviewer-agent.md # internal reviewer persona spec used by ship-review
  prompts/                 # pasteable cold-review + bounded-remediation prompts
  templates/               # fill-in artifacts: contract, invariants, plans, scorecard
  examples/                # worked example, built backwards from a real failure
  docs/                    # install, workflow, philosophy
```

## The worked example

[`examples/business-invariant-publish-gate/`](examples/business-invariant-publish-gate/) is built **backwards from a failure**. A fast AI implementation writes a publish guard that checks whether an approval *exists* — but not whether it was actually approved, and not whether the draft is blocked. The result: rejected approvals and blocked drafts still create publish jobs.

The example preserves that FAIL end to end — baseline code, five redteam cases, a failed scorecard, the bounded remediation, and a final scorecard that passes only once the invariant is enforced below the UI.

> A loop that never fails proves nothing. The failure is the asset.

## Executable proof modules

The first executable proof module lives at:

`examples/multi-layer-entitlement-gate/`

It is a fixture-scoped AST checker that verifies a protected entry point routes through the canonical decision point. It is intentionally narrow and does not claim to be a general static-analysis framework — it makes one principle (*the tool's output is a lead, not truth; prove the invariant holds across the path*) runnable, with a self-verifying runner over five fixtures.

## Agentic review (fresh-context / isolated-bundle)

`skills/independent-ship-review/` runs a cold-review bundle through a fresh, tool-isolated Claude reviewer (`scripts/independent-review.mjs`) on a **probe-verified** configuration, and refuses to trust the verdict unless it confirms the isolation held at runtime. It is honestly labeled **fresh-context Claude + bundle-only (enforced standard tools), same-vendor — not adversarial-isolated, not different-vendor**. The capability probes behind it live in [`probe/`](probe/).

## v0.4 — the local verification loop

Install once, then run the loop from any repo — an orchestrator (not an agent) that scaffolds artifacts, validates them, runs the fresh-context reviewer, and drafts the scorecard. It never implements code, commits, opens PRs, merges, deploys, or calls external APIs.

```bash
node scripts/install-global.mjs                      # skills → ~/.claude/skills, support → ~/.verified-ai-coding
L=~/.verified-ai-coding/scripts/verified-ai-loop.mjs
node $L new "Fix the thing"   # scaffold .verified-ai/runs/<date>-<slug>/
node $L bundle <run-dir>      # assemble review-bundle.md (+ git diff)
node $L review <run-dir>      # fresh-context reviewer → reviewer-result.md (fail-closed on INVALID)
node $L finalize <run-dir>    # draft final-scorecard.md + pr-body.md  (commit/PR stay human-gated)
```

Deterministic gates outrank the reviewer; gates are slice-scoped; commit/PR/merge/deploy are always human. Full walkthrough: [`docs/daily-use.md`](docs/daily-use.md). Design rationale: [`docs/v0.4-plan.md`](docs/v0.4-plan.md).

## Status

`v0.1` — markdown-first, no backend. This is a practical verification workflow for AI-assisted builds, not a general methodology. It does not try to be a methodology competitor. It tries to make AI prove one feature at a time.

## License

Open source. Use it, fork it, ship safer code.
