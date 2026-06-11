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

Two skills carry the workflow:

| Skill | When it runs | What it produces |
|---|---|---|
| **`verified-implementation`** | You're about to build a feature | A feature contract, must-always / must-never invariants, business-invariant risk call, allowed/forbidden files, test + eval + redteam plans, observability and ship gates — *before any code* |
| **`ship-review`** | You have a diff and want to ship | A model-agnostic cold-review bundle, a PASS / NEEDS_REVIEW / FAIL verdict, blockers turned into proof obligations, a bounded remediation prompt when needed, and a ship/no-ship scorecard |

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

## What this is not

- **Not formal verification.** No proofs about all executions — evidence about specific invariants, specific mutations, specific tests.
- **Not runtime validation**, unless a scorecard's `Runtime verification` field says so. `NONE` means the code was never executed against real infrastructure, and the scorecard must say "merge-grade," never "production-ready."
- **Not independent or cross-vendor review yet.** Every verdict recorded here is same-vendor (Claude reviewing Claude), fresh-context, with tool isolation *attested* rather than enforced. The reviewer-context metadata records this honestly per review.
- **Not bug prevention.** The session that built this introduced bugs in every artifact class — page, fixes, tests, evidence bundles. The harness detected them; it did not prevent them.
- **Not proof that AI code is correct.** The defensible claim: it catches classes of business-invariant failures that normal green gates miss, and it forces every PASS to state its evidence boundary.

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
