# Verified AI Coding

**Stop vibe-coding. Make AI prove the feature.**

An evidence-backed review harness for AI-assisted code changes. It converts
business-invariant claims into contracts, hashed evidence bundles, attributed
mutation specs, discriminating regression checks, cold review, and risk-tiered
ship/no-ship scorecards — each with an explicit statement of its own evidence
boundary.

It is a workflow you run inside Claude Code, plus a small set of
**dependency-free verification tools** that do the mechanical work.

## What's mechanical vs. what's judgment — read this first

This repo mixes two kinds of thing, and it's important to know which you're
looking at:

**Executable, tested tools (~1,800 lines of Node, 140 passing unit tests).**
These are real and you can run them yourself:

- `scripts/regression-check.mjs` — the centerpiece. Mutation testing with
  provenance: it reintroduces a bug via an exact `find → replace` (verifying the
  file's SHA-256 before and after), runs the target test in an isolated git
  worktree, and classifies the result. A test only earns `STRONG_RED` if it fails
  **by assertion** — a compile error is `WEAK_RED_COMPILE`, a test that passes
  anyway is `NOT_DISCRIMINATING` (i.e. it doesn't actually catch the bug it
  claims to). This mechanically distinguishes a real regression test from theater.
- `scripts/make-bundle.mjs` — assembles a hashed review bundle (diff + captures)
  with a verifiable manifest.
- `scripts/plan-lint.mjs`, `scripts/check-allowed-files.mjs`,
  `scripts/independent-review.mjs` — structural gates over plans, file allow-lists,
  and review isolation.

**A prose workflow layer (~15,000 lines of Markdown).** The skills
(`spec-compiler`, `verified-implementation`, `ship-review`) are instructions for
Claude, and the "evals" for the planning layer are **model judgment recorded as
documents**, not mechanical checks. A cold plan-review challenges each plan, but
it is a model reviewing a model. This layer is genuinely useful structure — it
just isn't executable verification, and this README won't pretend it is.

The honest one-line summary: **the tools prove specific things mechanically; the
workflow makes a model's reasoning legible and disciplined. Both matter; only the
first is machine-checked.**

## Public evidence boundary

Some subject repositories used as fixtures **remain private** (a real payments
app, a permission-aware assistant, an unreleased content engine). Concretely:

- **You can inspect and re-run here:** every script, skill, template, and rubric;
  the tool unit suites; the fixture *planning* evals; hashed result JSONs; the
  proof documents with their pre-registrations.
- **You cannot re-run here:** the end-to-end code-level proofs (live
  `regression-check` against the private payments repo's git history). The
  generated artifacts and transcripts from those runs are committed; every claim
  that rests on them is labeled as such. This is the harness's evidence-
  sufficiency rule applied to itself.

## The problem

AI writes code that *looks* right and passes a glance. The failure mode isn't
syntax — it's silent violation of business rules below the UI. A disabled
"Publish" button feels safe, but the button is not the boundary. The boundary is
the guard in the service that creates the publish job, and AI routinely writes a
guard that checks too little.

> **A disabled button is not a safety boundary.** Invariants must be enforced
> below the UI, and proven there.

## What this is not

- **Not formal verification.** No proofs about all executions — evidence about
  specific invariants, specific mutations, specific tests.
- **Not runtime validation**, unless a scorecard's `Runtime verification` field
  says so. `NONE` means the code was never executed against real infrastructure,
  and the scorecard says "merge-grade," never "production-ready."
- **Not independent or cross-vendor review yet.** Every verdict recorded here is
  same-vendor (Claude reviewing Claude), fresh-context, with tool isolation
  *attested* rather than enforced. The reviewer-context metadata records this
  honestly per review.
- **Not bug prevention.** The session that built this introduced bugs in every
  artifact class. The harness detected them; it did not prevent them.
- **Not proof that AI code is correct.** The defensible claim: it catches classes
  of business-invariant failures that normal green gates miss, and it forces every
  PASS to state its evidence boundary.
- **Not autonomous coding.** `spec-compiler` plans; it writes no code. Planning
  outputs are model judgment with mechanical *structure* checks — a script that
  pretended to classify risk semantically would be false confidence.

## The three skills

The pipeline is **spec → slices → (contract → code → review) per slice.** One
slice = one `verified-implementation` run = one `ship-review`.

| Skill                       | When it runs                                   | What it produces                                                                                                    |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **`spec-compiler`**         | You have a SPEC, not yet a bounded change       | Nine planning documents, structure-gated by `plan-lint.mjs` and cold-reviewed against a pre-registered rubric. No code. |
| **`verified-implementation`** | You're about to build a feature or slice       | A feature contract, must-always/must-never invariants, allowed/forbidden files, test + eval + redteam plans — *before any code* |
| **`ship-review`**           | You have a diff and want to ship               | A model-agnostic cold-review bundle, a PASS / NEEDS_REVIEW / FAIL verdict, blockers turned into proof obligations, and a ship/no-ship scorecard |

## Principles

- **Deterministic gates win; model review is advisory.** Tests, type checks, and
  assertions are the real gates. The cold review catches what they miss.
- **The reviewer model is pluggable.** Drop in any capable model, or a fresh
  session, as the cold reviewer.
- **Invariants are enforced below the UI.** If the only thing stopping a bad
  action is a disabled button, it isn't stopped.
- **Failed reviews create proof obligations.** A blocker isn't "fix this vibe" —
  it's a named problem with a required proof, a minimal allowed fix, and a list of
  forbidden changes.
- **Bounded remediation stays bounded.** Fix only the listed blockers. One
  regression test per blocker. Smallest patch possible. Report bigger issues as
  follow-ups; don't silently fix them.
- **Review and scorecard are read-only. Bounded remediation is the only write
  step, and it runs only after a FAIL or NEEDS_REVIEW.**

## How to inspect this repo

Don't trust the narrative — the proofs are designed to be checked. In rough order
of effort:

```bash
# 1. Unit tests for the verification tools (no network, no fixture needed)
node scripts/make-bundle.test.mjs
node scripts/regression-check.test.mjs
node scripts/plan-lint.test.mjs

# 2. Read a committed regression result and check its claims against its own JSON:
#    provenance (findingId), declared expectedTests, per-assertion failures, file hashes
cat proofs/appendix/proof-09/portal-F1-regression-result.json

# 3. The negative path: a spec declaring a wrong discriminator gets demoted, not counted
cat proofs/appendix/proof-08/e1d-expectation-mismatch-negative-path.json

# 4. With a fixture repo present (a real app with FAIL→PASS history), re-run a proof live:
node scripts/regression-check.mjs --repo <fixture> \
  --tests tests/portal-blockers.test.ts \
  --mutations examples/regression-check-sample/m-b2-amount-guard.json
# Expected: STRONG_RED, exactly the declared discriminators, GREEN on HEAD

# 5. Verify any bundle manifest hash yourself
shasum -a 256 <bundle>/diff.patch   # compare against <bundle>/manifest.json
```

> **Tooling note:** `regression-check` drives tests via vitest's JSON reporter
> (`--test-command` overrides the default `npx vitest run`) and runs each phase in
> a git worktree. Point it at a repo with a working test setup.

## Quick start (using it on your own work)

1. **Install** — copy `skills/verified-implementation` and `skills/ship-review`
   into your project's `.claude/skills/`. See `docs/install.md`. Or install
   globally: `node scripts/install-global.mjs`.
2. **Plan a feature** — ask Claude Code to run `verified-implementation`. You get
   a contract and invariants before code.
3. **Review a diff** — ask Claude Code to run `ship-review`. You get a cold-review
   bundle and a ship/no-ship call.
4. **Remediate if needed** — only on FAIL / NEEDS_REVIEW, run the bounded
   remediation prompt it generates. Commit / PR / merge / deploy stay human-gated.

## Start here

- `docs/case-study-charleston-passing-academy.md` — one real payments app, from
  "all tests green" to confirmed invariant violations to mechanically provable
  fixes (labeled where evidence rests on the private fixture).
- `proofs/proof-09-end-to-end-mechanized-run.md` — the harness dogfooded
  end-to-end on a fresh change.
- `proofs/proof-08-mechanized-regression-evidence.md` — pre-registered tool
  validation, including a falsified assumption now encoded in the tool.

## Repo layout

```
skills/                  # the skills (copy into .claude/skills/ to activate)
scripts/*.mjs            # the executable verification tools (+ their .test.mjs suites)
agents/reviewer-agent.md # internal reviewer persona spec used by ship-review
prompts/                 # pasteable cold-review + bounded-remediation prompts
templates/               # fill-in artifacts: contract, invariants, plans, scorecard
examples/                # worked examples, built backwards from real failures
proofs/                  # proof documents + hashed result JSONs (appendix/)
docs/                    # install, workflow, philosophy, release history
```

## The worked example

`examples/business-invariant-publish-gate/` is built **backwards from a failure**.
A fast AI implementation writes a publish guard that checks whether an approval
*exists* — but not whether it was actually approved, and not whether the draft is
blocked. Rejected approvals and blocked drafts still create publish jobs. The
example preserves that FAIL end to end — baseline code, five redteam cases, a
failed scorecard, the bounded remediation, and a final scorecard that passes only
once the invariant is enforced below the UI.

> A loop that never fails proves nothing. The failure is the asset.

## Status & releases

Tagged releases: `v0.5-review-harness` (the evidence-backed review tools),
`v0.6-rc1`, and `v0.7.0` (decision-grade planning). This is a practical
verification workflow for AI-assisted builds, not a general methodology — it makes
AI prove one feature at a time. See `docs/release-history.md`.

## License

MIT — use it, fork it, ship safer code.
