# Verified AI Coding

A review harness for AI-assisted code changes. AI code that passes tests can still violate business rules underneath the UI — this catches that class of failure and makes the ship decision explicit.

The idea: before code is written, you declare the invariants the feature must never break. After the code exists, a fresh-context reviewer (no memory of having written it) reads a self-contained bundle and issues PASS / NEEDS_REVIEW / FAIL. A failed review becomes named proof obligations with a minimal allowed fix, not "clean this up." Small dependency-free Node scripts handle the mechanical parts: `make-bundle.mjs` hashes the evidence so a review is auditable, and `regression-check.mjs` confirms a regression test actually discriminates — fails on the broken code, passes on the fix.

## The failure that motivated it

An AI implementation of a publish flow wrote a guard that checked whether an approval record *existed*, not whether it was approved. Rejected approvals and blocked drafts still created publish jobs. Every test was green and the UI looked fine, because the disabled "Publish" button hid the hole. A disabled button is not a safety boundary. The guard below the UI is, and that's where this harness makes you prove things.

[`examples/business-invariant-publish-gate/`](examples/business-invariant-publish-gate/) preserves that failure end to end: the broken code, the redteam cases that expose it, the failed scorecard, and the bounded fix.

## How it works

Three Claude Code skills, macro to micro:

- `spec-compiler` — turns a feature spec into bounded slices with named invariants and risk levels. Planning only; it writes no code and a lint step rejects code in planning docs.
- `verified-implementation` — for one slice, produces the contract, invariants, and test/redteam plan before implementation starts.
- `ship-review` — packages the diff into a cold-review bundle, gets a verdict, and turns blockers into proof obligations plus a bounded remediation prompt.

The rule that keeps it honest: review is read-only. The only write step is bounded remediation, and it runs only after a FAIL or NEEDS_REVIEW. Deterministic gates — tests, types, assertions — always outrank the model's opinion.

## Check it yourself

```bash
# unit tests for the verification tools (no network, no fixtures)
node scripts/make-bundle.test.mjs
node scripts/regression-check.test.mjs

# read a committed result and check its claims against its own JSON
cat proofs/appendix/proof-09/portal-F1-regression-result.json

# the negative path: a wrongly-declared discriminator gets demoted, not counted
cat proofs/appendix/proof-08/e1d-expectation-mismatch-negative-path.json

# verify any bundle hash
shasum -a 256 <bundle>/diff.patch   # compare against manifest.json
```

Deeper material is in `proofs/` and `docs/`. Start with [`proofs/proof-09-end-to-end-mechanized-run.md`](proofs/proof-09-end-to-end-mechanized-run.md) (the harness's first end-to-end run on a fresh change) and [`docs/case-study-charleston-passing-academy.md`](docs/case-study-charleston-passing-academy.md), a real payments app taken from "all tests green" to nine confirmed invariant violations to verified fixes. Some fixture repos are private because they contain real business code; the case study labels which claims rest on committed artifacts you can re-check and which rest on the private fixtures.

## What it isn't

- Not formal verification. It produces evidence about specific invariants and mutations, not proofs about all executions.
- Not runtime validation unless the scorecard says so. A PASS with no runtime verification means merge-grade, never production-ready.
- Not bug prevention. The sessions that built this introduced bugs; the harness caught them after the fact.

## Quick start

Copy `skills/` into your project's `.claude/skills/`, then ask Claude Code to run `verified-implementation` on a feature request. Details in [`docs/install.md`](docs/install.md).

MIT licensed.
