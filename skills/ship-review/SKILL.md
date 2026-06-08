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

**Check the whole enforcement path, not just the edited node.** An invariant usually spans multiple nodes — the decision point plus every page, route, service, or job that should enforce it. A fix that hardens one node leaves the invariant violated end to end if a sibling node gates independently or not at all. Require the contract's enforcement-path map (see "Map the enforcement path" in `verified-implementation`) and confirm each node's status: verified correct, assumed-not-verified, or out of scope. An unverified upstream/downstream node is a blocker-worthy open risk, not a PASS — even when the edited node is perfect.

**Check for sibling-writer races.** A claim/transition guard only protects the actors that go through it. If two entry points can mutate or trigger side effects for the same entity (webhook vs cron, user action vs worker, retry vs original request), confirm the tests cover *interleavings across those different actors* — not only duplicate delivery through one path. "Idempotent against its own replay" is not "idempotent against a sibling writer." If a recovery/retry path keys on age, confirm the timestamp measures the right lifecycle state. Untested cross-entrypoint concurrency is an open risk, not a PASS.

## Grounding review

Check whether the contract's description of **existing** code is true — not just whether the diff is internally consistent. *A summary of existing code is a claim; the grounding evidence is the proof.* For every load-bearing reused seam, helper, guard, route, or repository, ask:

- Did the bundle include the actual evidence for this existing code?
- Does the cited code match the contract's summary?
- Did the implementation route through the cited seam, or create a parallel path around it?
- Did the tests exercise the seam itself, or a mock/copy of it?
- Is the safety claim based on real code, or on the builder's description of it?

**Verdict rule:** if a contract relies on an existing seam but the bundle does not include grounding evidence for that seam, return **NEEDS_REVIEW**, not PASS.

**Blocker rule:** if the implementation bypasses a seam the contract claimed it reused, return **FAIL** — unless the contract was explicitly updated and re-approved.

## Client interpretation review

When the implementation includes a UI/client layer that calls reused seams, check that the client reports the backend outcome truthfully — a correct seam can still drive a dishonest product. Ask:

- Did the bundle include the seam response statuses / result shapes?
- Did the contract define what the client displays for success, idempotent success, refusal, and stale/error?
- Does the implementation actually branch on those outcomes correctly?
- Does the client avoid optimistic success when only an earlier step succeeded?
- Does the client treat idempotent success as success, not failure?
- Does the client recover/refetch on stale/error instead of leaving a false state?

**Verdict rule:** if a client composes backend seams but the bundle does not define or prove the client's interpretation of the seam outcomes, return **NEEDS_REVIEW**, not PASS.

**Failure rule:** if the client shows success for a state the backend did not create, or treats an idempotent-success response as failure in a way that contradicts the contract, return **FAIL** — unless the contract explicitly defines that behavior and the user approved it.

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

## Reviewer context

Every ship review must state **reviewer context** — who (or what) actually performed the review, and from what vantage. A verdict is only as independent as the reviewer behind it, and the builder cannot grade its own work from the same context and call it independent validation.

The review result must include:
- the **reviewer context level** (scale below);
- whether the reviewer had the **builder's chat history**;
- whether the reviewer received **only the cold-review bundle**;
- whether the reviewer was **same-session, fresh-context Claude, different-Claude-model, or different-vendor model**;
- whether **tool restrictions** were enforced, merely requested, unknown, or not applicable;
- whether **external API / code egress** occurred;
- if egress occurred, **which provider/model** was used and whether the bundle was **sanitized or proprietary**.

**Reviewer context levels (weakest → strongest):**
1. **Weak** — the same session/agent that implemented the change reviewed its own work.
2. **Fresh-context Claude** — a separate Claude subagent or fresh Claude session reviewed only the cold bundle. Removes builder narrative; still Claude reviewing Claude.
3. **Different-Claude-model** — a different Claude model reviewed only the cold bundle (e.g. Opus reviewing Sonnet's work). Stronger, still same vendor/family.
4. **Different-vendor model** — a non-Claude model reviewed only the cold bundle. Stronger independence; requires explicit code-egress approval.
5. **Different-vendor + isolated tools** — strongest practical mode: different vendor, cold bundle only, explicit egress approval, and tool scope restricted/enforced where supported.

**Rules:**
- A **PASS without reviewer-context metadata is incomplete evidence.**
- A **same-session PASS** may be used for local iteration, but must **not** be represented as an independent proof artifact.
- **Fresh-context Claude** review is better than same-session review, but it is **not** different-model independence.
- **Different-Claude-model** review is stronger than same-model fresh-context review, but **still not** different-vendor review.
- **Different-vendor** review requires **explicit egress approval per bundle** before proprietary code leaves the machine.
- **Deterministic gates outrank model-review judgment** — tests, redteam, typecheck, lint, executable proof modules, CI. Different-vendor review reduces correlated blind spots; it does not become the source of truth.
- For **proof artifacts, record reviewer context honestly.**

See `docs/reviewer-context.md` for the rationale and the egress policy.
