---
name: verified-implementation
description: Use BEFORE writing code for a feature, change, or bugfix that touches business rules, money, permissions, publishing, state transitions, or any "this must never happen" condition. Turns a feature request into a contract with must-always/must-never invariants, allowed/forbidden files, and test/eval/redteam plans before any implementation. Do not use for throwaway scripts or pure UI tweaks with no business invariant.
---

# Verified Implementation

You are about to build a feature. Before you write code, you will make explicit what must always happen and what must never happen, and you will define how that will be proven. This is the contract phase. Implementation does not start until the contract is clear.

> **Stop vibe-coding. Make AI prove the feature.** The most dangerous AI code is the code that looks right and silently violates a business rule below the UI. A disabled button is not a safety boundary.

## Slice mode (pick first)

Not every change needs the full invariant-heavy workflow.

**Full mode** — when the slice touches authorization, payments, webhooks, cron/recovery workers, publishing or external side effects, data writes, schema changes, tenant/user access, approval workflows, safety gates, queues/jobs, idempotency, or anything where "must never happen" matters. Full mode runs the whole workflow below: request → contract → grounding verification → invariants → enforcement-path map → allowed/forbidden files → redteam → implementation plan → test output → review bundle → ship review.

**Light mode** — only for genuinely low-risk changes: copy changes, static content, small visual-only components, placeholder UI, layout-only changes, docs-only updates. Light mode still requires: request, allowed/forbidden files, an acceptance check, and test/smoke evidence appropriate to the change.

**Escalation:** if a Light-mode slice uncovers an invariant, a write path, an authorization boundary, an external side effect, or a recovery/idempotency concern, escalate to Full mode **before** implementation.

> **Ceremony is not rigor; use Full mode when the risk is real, and Light mode when the change is truly low-risk.**

## Step 0 — Read project context

If a project context file exists (`templates/project-context.md` filled in, a `PROJECT-CONTEXT.md`, a `CLAUDE.md`, or similar), read it first. Pull out: the domain, the critical invariants the business already cares about, the architecture layers (where do guards belong?), and the test conventions. If no context exists, note that and infer carefully from the codebase — do not assume.

## Step 1 — Write the feature contract

Use `templates/feature-contract.md`. Capture:
- **What the user actually asked for** (their words, then your restatement).
- **The behavior in one sentence**: when X, the system does Y.
- **Inputs, outputs, and the boundary** where the behavior is enforced.
- **Open questions.** If the request is ambiguous on anything that affects an invariant, ask now. **Require contract clarity before implementation** — do not paper over ambiguity with a guess.

## Step 2 — Grounding verification

Before contract approval, any claim about **existing** code that the slice depends on must be grounded in actual code evidence. This is the same discipline as "Claim verification before remediation" and *the tool's own output is a lead, not truth*, pointed at the contract's premises: **a summary of existing code is a claim; the grounding evidence is the proof.**

It applies especially when the contract says things like: "reuses the canonical helper," "routes through the existing seam," "authorizes from DB state," "re-reads from the database," "actor is session-bound," "timestamp is server-controlled," "caller input cannot influence the decision," "route is owner-gated," "existing seam is idempotent," "existing guard already enforces this," "this route only accepts X," "this function ignores Y," or "this writer participates in the claim guard."

For each load-bearing existing seam, the contract must show:
- exact file / function / route;
- the decision point;
- what data it reads;
- what caller input it ignores;
- whether it reads DB state or trusts request state;
- whether actor/timestamp are server- or caller-controlled;
- whether the new slice routes through it or bypasses it;
- the actual evidence used: pasted snippet, line-level summary, or command output.

Record this in the **Grounding verification** table of `templates/feature-contract.md`.

**Rule:** a contract that depends on an existing seam is not approval-ready until the grounding evidence for that seam is present.

> **Polished planning artifacts do not prove the premise; the existing code must be verified before the contract can rely on it.**

> **If the contract says 'reuse the proven seam,' the grounding section must prove that the new path actually routes through that seam and does not create a parallel path.**

## Step 3 — State the invariants

This is the heart of the skill. Before any code, write:

> **Before implementation, here is what must always happen and what must never happen.**

Then fill `templates/invariant-checklist.md`:
- **MUST ALWAYS** — conditions that hold after every successful path.
- **MUST NEVER** — actions or states the system must refuse, no matter the input.

Write invariants as testable predicates, not vibes. "Rejected approvals must never create a publish job" — not "handle rejection properly."

## Step 4 — Call the business-invariant risk

Ask explicitly: **is there a business rule here that, if violated, causes real harm** (money moved, content published, access granted, data exposed)? If yes, flag it as a business invariant and require it to be enforced **below the UI** — in the service or domain layer, not in a disabled button or a hidden form field. Note where the real boundary is.

## Step 5 — Map the enforcement path

An invariant usually spans **more than one node**. The rule is decided in one place, but it is supposed to be enforced at every node that can trigger the action. Hardening the node in front of you while a sibling node enforces independently — or not at all — leaves the invariant violated end to end, and the fix *looks* done because its own layer is correct.

> Real session: a two-layer entitlement bug. One session fixed the decision function; a later session fixed a page that calls it. Neither diagnosed that the bug was two-layered — each treated the invariant as satisfied because its own layer was correct. End to end, the invariant was still broken.

Whenever a feature touches an invariant (entitlement, permission, publish-gate, approval, …), put an **enforcement-path map** in the contract:

- **Decision point** — where the rule is canonically decided (the predicate/guard function).
- **Entry points** — every path that is supposed to enforce the rule: pages, routes, services, jobs, schedulers.
- **Per entry point** — does it actually route through the canonical decision, gate independently (and is that copy correct?), or not enforce at all?

**Rule:** a fix that touches only ONE node on this path must explicitly state the status of the OTHER nodes — *verified correct*, *assumed correct — NOT verified*, or *out of scope (reason)*. An unverified upstream or downstream node is an **open risk in the contract**, flagged the same way untraced equivalences are (see "Claim verification before remediation"). Going silent on the other nodes is the failure mode.

This is the same principle — *the tool's own output is a lead, not truth* — extended one dimension: from "verify the claims this fix makes" to "verify the invariant holds across every node, not just the one you're editing."

**Concrete anti-pattern:** a fix wires a page to call the canonical entitlement function but never verifies the function itself is correct (it happened to have been fixed in a prior session). The page now ships a correct *call* to a possibly-broken function — green diff, satisfied-looking layer, invariant still violated end to end. Verify the node you call, not just the call to it.

### Sibling writers and cross-entrypoint races

The enforcement-path map is also a **concurrency** map. The same principle — more than one node touches the invariant — has a second failure mode: two entry points can mutate or trigger side effects for the **same entity at the same time**. A claim/transition guard only protects the actors that **participate in that guard**. A sibling writer that moves the state without going through the claim can still race it.

> Real session: a payment-triggered job was made replay-safe (duplicate deliveries no-op). A recovery worker was added to repair crash windows. The tests covered *worker vs worker*. The reviewer caught *worker vs the original trigger*: the original path transitioned the entity and then fired the side effect a moment later; the recovery worker could see that same entity as eligible in the gap and claim/trigger it — two side effects, because the original path never participated in the worker's claim.

For every invariant-bearing state transition, enumerate the **sibling writers / trigger paths** (e.g. webhook vs cron, user action vs worker, retry loop vs original request, approval route vs publish route, publisher retry vs publisher callback). For each, ask:

- Can both paths observe a state where each believes it owns the work?
- Do both paths participate in the **same** claim/transition guard?
- Can one path fire side effects while the other also fires them?
- Is the row moved **out of the rival path's candidate set** *before* side effects fire?
- Is the stale/recovery decision based on the **correct lifecycle timestamp** (see below)?

### Staleness-clock check

If a recovery or retry path decides eligibility by **age**, verify the timestamp actually measures the lifecycle state being recovered — not a convenient nearby one. A creation time does not prove when payment happened; it does not prove when work started. A recovery sweep needs a real lifecycle timestamp (a paid-at, work-started-at, last-attempt-at, or equivalent). **If the correct timestamp is missing or unpopulated, the recovery claim is unproven** — surface it as an open risk, the same as an untraced equivalence.

### Client interpretation of seam outcomes

Enforcing the invariant below the UI is necessary but not sufficient: the client still has to tell the user the truth about what the backend did. **A correct backend seam can still produce a dishonest product if the client misinterprets its result.**

When a slice has a UI/client call an existing backend seam, the contract must specify how the client interprets every meaningful outcome. For each reused route/seam response, record:
- success statuses / result shapes;
- idempotent-success statuses / result shapes;
- refusal statuses / result shapes;
- stale/error statuses / result shapes;
- what the client may display after each, and what it must **not** optimistically display;
- whether a multi-step client sequence can leave a partial state, and how it recovers/refreshes after stale/error.

**When a UI composes proven seams, the contract must define the client's state machine over the seam outcomes.** For multi-step flows, distinguish each step — e.g. *Step A succeeds: approval recorded; Step B succeeds or idempotently succeeds: job queued; Step B refuses or errors: approval may exist, but "queued" must not be shown.* The client may show the strongest state that is actually proven, not the state it hoped to reach.

**Do not mark a client flow complete until the specific backend step that creates that state has succeeded or returned an idempotent-success result.** Record this in the **Client interpretation contract** table of `templates/feature-contract.md` when a UI composes seams.

## Step 6 — Identify allowed and forbidden files

List the files the implementation is **allowed** to touch and the files that are **forbidden** (schema, adapters, unrelated modules, UI redesign). This scopes the work now and scopes remediation later. Forbidden-by-default: anything not needed to satisfy the contract.

## Step 7 — Plan the proofs

- **Tests** (`templates/test-plan.md`): unit, integration, and regression tests that exercise each invariant. Every MUST NEVER gets a test that proves the system refuses it.
- **Evals** (`templates/eval-plan.md`): only when AI behavior is part of the feature (a model makes a decision, generates content, classifies). Define inputs, expected behavior, and scoring. Skip if there's no AI in the runtime path.
- **Redteam / bypass cases** (`templates/redteam-plan.md`): adversarial inputs that try to slip past the guard — the rejected approval, the blocked draft, the edited-but-not-approved state. Each case states input → required behavior.

## Step 8 — Observability and ship gates

- **Observability**: what must be logged/metered so a violation is visible in production (e.g., log every refused publish attempt with reason).
- **Ship gates**: the deterministic conditions that must be green to ship — tests pass, type checks pass, every redteam case behaves, invariant enforced below the UI. These are the gates `ship-review` will check against.

## Claim verification before remediation

**The tool's own output is a lead, not truth.** Every finding this workflow produces — and every equivalence a proposed fix relies on — must be proven against the real code before any action is taken. AI audits are confidently wrong often enough that an unverified finding is a hypothesis, not a work item. (Real session: a headline finding claimed ~20 call sites imported the wrong function; precise tracing showed zero did.)

Before recommending any change that touches **more than the single file under direct edit**, or any change that **relies on a cross-file equivalence**, each finding must carry:

- **Exact code evidence** — the file and the actual lines, quoted, not a description of what you believe they say.
- **A counter-check that could disprove the finding** — name the query or trace that would show you're wrong, and run it. If you can't name one, you haven't verified it.
- **Untraced equivalences, flagged** — any assumption the fix leans on that you have NOT traced ("same function behavior," "same identity resolution," "same case coverage"). Mark it unproven until you've followed it in the real code.
- **Revised scope** — if verification narrows or retracts the finding, say so.

If a finding is retracted or narrowed, **the remediation plan must shrink before implementation** — never proceed on the original scope just because the plan was already written.

### Anti-pattern: grep co-occurrence is not import proof

`grep "from 'X'" | xargs grep "Y"` matches files where both strings merely appear; it does **not** prove `Y` is imported from `X`. Two unrelated lines in one file satisfy it. Trace the literal import statement — and what name it actually binds — before claiming a call site is affected.

### Anti-pattern: a passing mock is not proof the real lookup works

A test that mocks a dependency to return the expected value proves the logic **given that value** — not that the real resolution (DB lookup, identity match, enum mapping) actually produces it. When a fix changes **which mechanism** resolves a value, verify the real mechanism, not just the mocked path. A green test over a mock can hide a fix that assumed two code paths resolve identity the same way when they don't.

## Output

Produce the filled artifacts (contract, invariant checklist, file lists, test/eval/redteam plans, observability + gates). State the invariants sentence explicitly. **Only then** begin implementation, staying inside the allowed files.

## Handoff

When implementation is done and you have a diff, run **`ship-review`** to verify it before shipping.
