---
name: spec-compiler
description: Use BEFORE verified-implementation when the input is a feature/product SPEC rather than a single bounded change. Compiles the spec into nine planning documents (intake, requirements, non-goals, domain model, invariants, risk map, acceptance criteria, implementation slices, open questions), risk-classifies the work, and decomposes it into single-concern slices that each feed one verified-implementation run. Produces NO code — this is verified decomposition, not autonomous coding. Do not use for a small bounded change (go straight to verified-implementation) or for reviewing an existing diff (ship-review).
---

# Spec Compiler / Slice Planner

You have a spec — a feature request, product description, or "build this" document. Before any
code exists, you will compile it into a build contract and a slice plan a senior engineer would
accept, with every ambiguity surfaced instead of papered over.

> **This is not one-shot magic; it is verified decomposition.** The compiler plans; the existing
> per-slice pipeline (`verified-implementation` → code → `ship-review`) implements and verifies.
> No code is written during spec compilation — `plan-lint` enforces that mechanically.

## Step 0 — Read project context

Same rule as `verified-implementation`: read the project context (CLAUDE.md, PROJECT-CONTEXT.md,
existing specs) before interpreting the user's spec. The spec is interpreted *into* a real
codebase and its existing invariants, not into a vacuum. If the spec contradicts an existing
project law, that is a high-severity open question, not a silent override.

## Step 1 — Intake (provenance before interpretation)

Create the plan directory (convention: `.verified-ai/specs/<slug>/`) and write `spec-intake.md`:

- **`## Original spec (verbatim)`** — the user's spec exactly as given. This is the provenance
  record that lets a reviewer detect interpretation drift later.
- **`## Compiler paraphrase`** — your restatement of what is being asked.
- **`## Interpretation notes`** — every place the paraphrase chooses a meaning the verbatim text
  did not force. Each note names the alternative reading it rejected.
- **`## Assumptions`** — defaults you are adopting (`- A<n>: ...`). An assumption is a decision
  you believe the user would endorse; if you are not confident of that, it is an open question.
- **`## Open questions`** — pointer to `open-questions.md`.

## Step 2 — Compile the nine documents

All nine, always — explicit "None." beats a missing section (`plan-lint` fails on absence):

| Document | Required content |
|---|---|
| `spec-intake.md` | as above |
| `requirements.md` | `## Requirements` — numbered, traceable to spec lines |
| `non-goals.md` | `## Non-goals` — what this plan deliberately excludes, incl. deferred phases |
| `domain-model.md` | `## Entities`, `## States and transitions` — short illustrative fences only (≤15 lines; longer is implementation and fails lint) |
| `invariants.md` | `## Invariants` — see format below |
| `risk-map.md` | `## Risk classification`, `## Justification` — see below |
| `acceptance-criteria.md` | `## Acceptance criteria` — each criterion testable; criteria covering an invariant cite its `INV-` id |
| `implementation-slices.md` | `## Slice <n>: <name>` blocks — see below |
| `open-questions.md` | `## Open questions` — see format below |

**Invariant format** (lint-enforced): `- INV-<id> [L<0-3>] <testable predicate>`. Write
must-always/must-never predicates, not vibes — "a draft whose gate status is blocked must never
reach the publisher", not "handle content safely". The level tag is the invariant's own risk
class, which may exceed the plan's overall level.

**Open-question format** (lint-enforced):
`- OQ-<id> [severity: high|medium|low] [status: open|resolved: <how/when>] <question>`.
**High severity** = the answer changes an invariant, a money/auth/privacy/publishing behavior, or
slice boundaries. A high-severity open question with `status: open` **blocks implementation** —
plan-lint exits nonzero until it is resolved (by the user, recorded in the status) or demoted with
a written reason. Never resolve a high-severity ambiguity by silently picking the convenient
reading; that was a real failure class (a remediation obligation once contradicted itself and the
deviation had to be adjudicated after the fact instead of asked about before).

### Identity & account-claim lens (apply wherever a principal gets bound to a resource)

Whenever the spec links a person/account to a resource — account linking, registration or order
ownership, profile claiming, invite acceptance, payment entitlement, any user↔record binding —
the plan must answer these, each as an invariant, assumption, or open question (never by
silence):

1. **What proves the principal controls the identifier used for the binding?** A *provided*
   identifier (typed email, phone, username) is a claim; a *verified* identifier (provider-attested
   email, confirmed possession) is evidence. Name which one the binding requires.
2. **Can a principal claim someone else's pending, paid, or existing record** via a guessable,
   shared, recycled, or merely-known identifier?
3. **Do money, PII, or entitlements bind to a verified principal** — or to an unverified
   identifier that anyone can assert?
4. **What happens when the identifier changes or is reassigned after binding** (email recycled,
   phone number reissued, employee offboarded)?

A spec that is silent on these is ambiguous at L2, not permissive — bindings involving minors'
data, money, or private records default to *verified control required* (assumption) or a
high-severity open question. This lens exists because the claimed-vs-verified distinction is a
recurring blind spot at both build time and plan time.

### Payment-depth lens (apply wherever money moves or paid entitlement changes state)

Triggers: checkout, payment sessions, invoices, paid subscriptions, refunds,
cancellations/reversals of paid things, paid entitlement activation, webhook-driven state
changes, stored payment identifiers, credits/balances/charge-like transfers.

When triggered, the plan must address each of these — as invariants, acceptance criteria, slice
proof obligations, assumptions, or open questions (never by silence):

1. **Amount/currency owed** — where the owed amount and currency are canonically computed
   (server-side, never client-supplied).
2. **Amount/currency captured** — the captured amount, currency, and captured-vs-authorized
   status are verified against what is owed BEFORE any entitlement is granted. Creation-time
   pricing is not a substitute for grant-time verification.
3. **Canonical payment/session identifier** — which identifier binds a payment to its domain
   object, and what happens when lookup by it misses.
4. **Stale/superseded sessions** — at most one payable session per obligation, or an explicit
   supersession rule; a payment landing on a superseded session must not be silently lost OR
   silently honored at a stale amount.
5. **Webhook/event idempotency** — replay of the same event is a no-op, keyed on a durable id.
6. **Duplicate payment detection** — a SECOND distinct payment for an already-satisfied
   obligation is detected and alerted, not absorbed as a replay.
7. **Payment after cancel/reversal** — money arriving for a canceled/reversed obligation has a
   defined outcome (no activation + alert/refund path), not an error loop.
8. **Cancel/reversal vs payment race** — the reversal writer and the payment writer are sibling
   writers; state the serialization (conditional update, lock, status predicate) for their
   interleaving.
9. **Money-moved-but-state-rejects path** — whenever funds are captured but the domain refuses
   activation, a refund/manual-reconciliation signal is required; "logged" is not a path.
10. **Paid entitlement binds to a verified principal** (compose with the identity lens).
11. **Fail-closed on missing/ambiguous payment data** — absent/null/unparseable
    intent/session/amount fields refuse activation; they never default to success.
12. **Audit of money-state transitions** — each transition records who/what/why enough to
    reconcile later.

Label lens-driven defaults as lens-derived when the spec does not state them directly. This lens
exists because grant-time amount/currency verification, session supersession, and the
reversal-vs-webhook race were missing in three consecutive fixture evals (proof-10) and the same
classes were real blockers in a reviewed payments codebase.

## Step 3 — Risk classification (model-authored judgment, cited)

Risk is a semantic judgment. You author it; the lint validates only its shape — a script that
pretended to classify risk from keywords would be false confidence, which this harness exists to
kill. In `risk-map.md`:

```
## Risk classification
Initial classification: L<0-3>
Final level: L<0-3>
```

- **L0 cosmetic** — presentation only. **L1 low-risk logic** — behavior, no business-invariant
  risk. **L2** — money, auth, permissions, user data, status transitions, private data,
  AI-generated public output. **L3** — regulated, minors' data + public output, production-critical
  at scale.
- `## Justification` must **quote the spec lines** (markdown blockquotes) that drove the level —
  lint requires at least one citation.
- Escalation is free. A downgrade (Final < Initial) requires `## Downgrade justification` — lint
  enforces presence; the cold plan-review judges its honesty.
- Per-area levels are welcome in `risk-map.md`'s prose (e.g. "publisher path L3, copy templates
  L1"); the Final level is the plan's maximum.

## Step 4 — Slice plan

Each slice in `implementation-slices.md` is a `## Slice <n>: <name>` block with all eight
subsections (lint-enforced): `### Scope`, `### Allowed files`, `### Forbidden files`,
`### Invariants touched`, `### Tests required`, `### Proof obligations`, `### Rollback notes`,
`### Done criteria`.

Slice discipline:

- **One concern per slice.** Schema + service + UI for one capability can share a slice; two
  unrelated capabilities cannot. If you cannot name the slice without "and", split it.
- **Independently buildable, explicitly ordered.** State dependencies (`depends on: Slice 2`);
  the graph must be acyclic, and a slice must be buildable from the plan alone.
- **Allowed/forbidden files** use the same pattern syntax as `check-allowed-files.mjs` (exact
  file, `dir/` prefix, simple glob) — they become that gate's input verbatim at build time. Lint
  fails on allowed∩forbidden overlap within a slice.
- **Every L2/L3 invariant maps somewhere**: at least one slice's `### Invariants touched` and at
  least one acceptance criterion (lint-enforced). An invariant no slice owns is a plan bug.
- **Proof obligations** are written so `ship-review` can later demand them: for L2+ invariants,
  name the regression test that must exist and note it will need an attributed STRONG_RED
  (`scripts/regression-check.mjs`) at remediation/review time.
- **Rollback notes**: what undoes this slice (revert? feature flag? additive-only?). "None —
  additive only" is acceptable when true.
- **Deferred work is a named non-goal**, not a missing thought: if measurement/learning/live
  publishing comes later, say so in `non-goals.md` and exclude it from slices.

## Step 5 — Gate, review, hand off

1. **Lint (mechanical):**
   ```
   node scripts/plan-lint.mjs <plan-dir>
   ```
   Must be GREEN before review. BLOCKED output means a high-severity ambiguity needs the user.
2. **Cold plan-review (semantic):** a fresh-context reviewer that did not compile the plan
   evaluates it against `templates/plan-review-rubric.md` (committed before any eval — do not
   edit the rubric per-run). NEEDS_REVISION findings become numbered revision obligations;
   re-lint and re-review after revising.
3. **Hand off, one slice at a time:** each slice's sections are the inputs
   `verified-implementation` consumes — Scope → the request, Invariants touched → the invariant
   checklist seed, Allowed/Forbidden files → the run's `allowed-forbidden-files.md`
   (`check-allowed-files.mjs` format), Proof obligations → the test/redteam plan seed. **One
   slice = one verified-implementation run = one ship-review.** Do not start slice N+1's
   implementation while slice N's ship-review verdict is open, unless the slices are declared
   independent.

## Guardrails (the ones lint cannot fully enforce, restated for the reviewer)

- No coding during spec compilation — also no "sketching the implementation" in 40-line fences.
- Ambiguity becomes an assumption (if you'd bet the user agrees) or an open question (if you
  wouldn't). High-risk ambiguity blocks.
- Large specs must be decomposed; a 1-slice plan for an L2+ multi-capability spec is a smell the
  plan-review should challenge.
- The compiler may surface *constraints* the spec missed (with cited risk reasoning); it may not
  invent *features* the spec never asked for.
