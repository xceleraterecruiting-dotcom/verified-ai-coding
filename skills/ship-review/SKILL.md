---
name: ship-review
description: Use AFTER a feature is implemented and you have a diff, when you need a ship/no-ship decision. Assembles a model-agnostic cold-review bundle, produces PASS/NEEDS_REVIEW/FAIL, converts blockers into proof obligations, and generates a bounded remediation prompt only when the verdict is FAIL or NEEDS_REVIEW. Do not use to plan a feature — use verified-implementation for that.
---

# Ship Review

A feature is implemented. Before it ships, you will subject it to a cold review by a model that did not write it, decide ship/no-ship against the contract, and — only if it fails — generate a bounded fix.

> **Review and scorecard are read-only. Bounded remediation is the only write step.** Do not edit code during the review. Reviewing is for finding; remediation is for fixing, and only after a FAIL or NEEDS_REVIEW.

## Step 1 — Gather the inputs

Collect everything the reviewer needs:
- The **original request** (the user's words).
- The **feature contract** and **invariant checklist** from `verified-implementation` (must-always / must-never).
- **Project context** (domain, layers, conventions).
- The **git diff** under review (`git diff`, or the PR diff).
- **Test / eval / redteam outputs** — actual run results, not "should pass."
- The **rubric** (the ship gates from the contract).

If any of these are missing — especially the invariants or the redteam results — say so. A review without invariants is a vibe check.

**Reconcile the contract against the project's existing specs**, not only the diff against the contract. The same principle that governs findings — *the tool's own output is a lead, not truth* — applies to the contract itself: a review can trace the code perfectly and still miss that the contract diverged from prior spec language. If the contract and an existing spec disagree, surface it as a finding; don't silently assume the contract wins.

## Step 2 — Build the cold-review bundle

Assemble `templates/review-bundle.md`: a single self-contained document a reviewer can read top to bottom with no other access. The reviewer is **pluggable** — it may be GPT-5.5, another model, or a fresh Claude session. GPT-5.5 is not the product; the bundle is model-agnostic on purpose.

Hand the bundle to the reviewer using `prompts/cold-reviewer.md` (the pasteable cold-review prompt). The reviewer persona it embodies is specified in `agents/reviewer-agent.md`.

## Step 3 — Verdict: PASS / NEEDS_REVIEW / FAIL

The reviewer returns one verdict:
- **PASS** — every invariant is enforced below the UI, every redteam case behaves, gates are green. Ship.
- **NEEDS_REVIEW** — works on the happy path but a gate is unproven, a redteam case is untested, or an invariant relies on the UI. Not shippable as-is.
- **FAIL** — an invariant is violated, a redteam case produces the wrong behavior, or a deterministic gate is red. Do not ship.

Remember: **deterministic gates win; model review is advisory.** If a test or type check is red, the verdict is FAIL regardless of model opinion. The model's job is to catch what the gates missed.

## Step 4 — Separate blockers from suggestions

Split findings into:
- **Blockers** — must be fixed before shipping (invariant violations, failing redteam cases, red gates).
- **Non-blocking suggestions** — improvements that do not block the ship (naming, structure, nice-to-haves). Record them; don't act on them now.

## Step 5 — Convert blockers into proof obligations

For each blocker, write a proof obligation:
- **Problem** — what is wrong, precisely.
- **Why it matters** — the real-world harm.
- **Required proof** — the test or check that must turn green to consider it fixed.
- **Minimal allowed fix** — the smallest change that satisfies the proof.
- **Allowed files** — what may be touched.
- **Forbidden changes** — what must not be touched (schema, adapters, UI redesign, unrelated refactors).

Before a blocker becomes a proof obligation, it must clear **Claim verification before remediation** (see `verified-implementation`): exact code evidence (file + actual lines), a counter-check that could disprove it, and any untraced equivalence the fix assumes flagged explicitly. A finding that fails its counter-check is retracted — and the remediation scope shrinks with it, before implementation. *The tool's own output is a lead, not truth* — that applies to this review's findings too.

## Step 6 — Bounded remediation (only if FAIL / NEEDS_REVIEW)

If and only if the verdict is FAIL or NEEDS_REVIEW, generate a bounded remediation prompt from `prompts/bounded-remediation.md`, parameterized by the proof obligations. Rules carried into remediation:
- Fix **only** the listed blockers.
- One **regression test per blocker**, written first or alongside.
- **Smallest patch possible.** No broad rewrites.
- Stay inside allowed files; never touch forbidden ones.
- **No silent fixing** of larger issues discovered along the way — report them as follow-ups.

After remediation, re-run gates and re-review.

## Step 7 — Ship/no-ship scorecard

Produce `templates/ship-scorecard.md`: per-dimension verdicts (Behavior, Safety, Tests, Redteam, Observability) and a single decision — **SHIP** or **DO NOT SHIP**. The scorecard is read-only output. It passes only when the invariant is enforced below the UI and every redteam case behaves correctly.
