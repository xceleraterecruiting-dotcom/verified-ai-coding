# Implementation slices

Greenfield note: no codebase was available during compilation, so all paths are a *proposed*
module layout inside the existing Next.js + Postgres app (`lib/marketing/`, `app/marketing/`,
`db/migrations/marketing/`, `tests/marketing/`). Before each slice's verified-implementation
run, re-anchor these patterns to the real repo structure; the allowed/forbidden intent (engine
code confined to its module; platform source tables and auth untouchable) is binding even if
names change. Slices 1–10 below; dependencies are explicit and acyclic. High-severity open
questions OQ-1/2/3 block the start of implementation overall; slices whose behavior they shape
note this.

## Slice 1: Marketing schema and post lifecycle state machine

### Scope
Create the engine's own Postgres schema (PostDraft, GateResult, Approval, PublishedPost,
ScheduledRun, BrandKit, Claim/QuoteRecord/PhotoAsset/IdeaBankEntry/VoiceSample table shells) and
the PostDraft lifecycle state machine with transition guards per domain-model.md. Includes the
read-only DB role for the engine against platform source tables and reserved nullable metrics
fields on PublishedPost (R17). No generation, gating, or publishing logic.

### Allowed files
- db/migrations/marketing/
- lib/marketing/domain/
- tests/marketing/domain/

### Forbidden files
- lib/marketing/publish/
- lib/marketing/generation/
- app/
- db/migrations/platform/
- lib/auth/

### Invariants touched
- INV-9 (lifecycle graph + revision invalidation enforced at the state-machine layer)
- INV-11 (PublishedPost snapshot table is append-only/immutable by constraint)
- INV-12 (engine DB role is read-only against platform source-of-truth tables)

### Tests required
- Transition-matrix test: every transition outside the lifecycle graph is rejected (INV-9).
- Edit-invalidation test: mutating draft copy voids gate result and approval (INV-9).
- Immutability test: UPDATE/DELETE on a PublishedPost snapshot fails (INV-11).
- Role test: engine role INSERT/UPDATE/DELETE on platform tables fails (INV-12, AC-1 part).

### Proof obligations
- Regression test `marketing/domain/lifecycle.invariants.test` must exist covering INV-9 and
  INV-11; at remediation/review it needs an attributed STRONG_RED via regression-check.mjs
  (test fails when the guard is removed).
- Regression test `marketing/domain/readonly-role.test` for INV-12, same STRONG_RED obligation.

### Rollback notes
Revert the migration set; additive-only schema (no platform tables altered), so rollback is a
clean drop of the marketing schema.

### Done criteria
All four test groups green; lifecycle graph matches domain-model.md exactly; engine role
demonstrably read-only; no generation/publish code exists in this slice's diff.

## Slice 2: Public-safe data boundary (PublicSafeView)

Depends on: Slice 1.

### Scope
Build the deny-by-default allowlisted projection over athletes and SourceRecords that is the
*only* data access path the rest of the engine may use: explicit field allowlists per entity,
a single query module exporting safe accessors, and a private-material canary harness (seeded
private strings that tests scan for downstream). Private tables (evaluations, private notes,
contact info) are not mapped at all.

### Allowed files
- lib/marketing/safeview/
- tests/marketing/safeview/

### Forbidden files
- lib/marketing/generation/
- lib/marketing/publish/
- lib/marketing/gate/
- db/migrations/
- app/

### Invariants touched
- INV-1 (the boundary itself: only allowlisted fields are reachable)
- INV-12 (safe accessors are read-only)

### Tests required
- Allowlist test: every field exposed by PublicSafeView is on the written allowlist; adding an
  unlisted field fails the test (INV-1).
- Negative test: private-material tables/columns are unreachable through the module's public
  API (no accessor exists; type-level and runtime checks).
- Canary seed fixture established for use by Slices 4–7 tests (AC-1).

### Proof obligations
- Regression test `marketing/safeview/allowlist.test` for INV-1 with attributed STRONG_RED at
  review time (test reddens if a private column is exposed).

### Rollback notes
None — additive only; deleting the module restores the prior state.

### Done criteria
Safe accessors are the only exported data API; allowlist + negative tests green; canary
fixture documented for downstream slices.

## Slice 3: Claim provenance ledger and quote records

Depends on: Slice 1, Slice 2.

### Scope
Implement Claim binding (claim text/value → SourceRecord ids + derivation expression),
re-verification of a claim against current data (recompute derivation, compare), QuoteRecord
storage/matching (verbatim match, near-match detection), and the per-post provenance read API
("why it said that"). No generation; operates on drafts handed to it.

### Allowed files
- lib/marketing/claims/
- db/migrations/marketing/
- tests/marketing/claims/

### Forbidden files
- lib/marketing/generation/
- lib/marketing/publish/
- lib/marketing/gate/
- app/
- lib/marketing/safeview/

### Invariants touched
- INV-2 (binding model: a claim without SourceRecord ids is representable only as "unbound",
  which downstream gates fail)
- INV-5 (QuoteRecord verbatim matching is the only quote-legitimacy source)
- INV-6 (re-verification recomputes from current SourceRecords and reports drift)

### Tests required
- Binding test: "4th offer" claim binds to exactly the four offer ids with count derivation
  (AC-2).
- Re-verification test: deleting a source offer makes re-verification fail (AC-6, INV-6).
- Quote tests: verbatim match passes; absent or paraphrased quote is flagged (AC-5, INV-5).
- Provenance view test: per-post claim → sources rendering is complete (AC-2).

### Proof obligations
- Regression tests `marketing/claims/binding.test` (INV-2), `marketing/claims/reverify.test`
  (INV-6), `marketing/claims/quotes.test` (INV-5) — each needs an attributed STRONG_RED at
  remediation/review time.

### Rollback notes
Revert migration additions and module; additive only, no platform data touched.

### Done criteria
Claims round-trip with derivations; drift detection proven; quote matcher rejects paraphrase;
provenance API returns sources for every claim on a draft.

## Slice 4: Signal post generation

Depends on: Slice 2, Slice 3.

### Scope
Generate signal-post drafts (offer announcements, commitment posts, weekly top-performer
cards) from PublicSafeView data using the existing Anthropic integration: trigger detection
from SourceRecords, prompt assembly (safe fields only), copy generation, and claim extraction +
binding for every factual assertion in the output. Drafts land in `generated` state only.

### Allowed files
- lib/marketing/generation/signal/
- tests/marketing/generation/signal/

### Forbidden files
- lib/marketing/publish/
- lib/marketing/gate/
- lib/marketing/safeview/
- lib/marketing/claims/
- app/
- db/migrations/

### Invariants touched
- INV-1 (prompts and copy built exclusively from PublicSafeView accessors; canary scan over
  prompt log and output)
- INV-2 (every factual assertion in generated copy gets a Claim binding or the draft is marked
  unbound for the gate to fail)

### Tests required
- Canary test: with seeded private material, generated prompts and drafts contain zero canary
  strings (AC-1, INV-1).
- Binding-completeness test: numeric assertions in generated copy have Claims (AC-2, INV-2).
- Trigger test: a new 4th offer produces an offer-announcement draft in `generated` state and
  nothing else (no publish call observable).

### Proof obligations
- Regression test `marketing/generation/signal/canary.test` (INV-1) and
  `marketing/generation/signal/claims.test` (INV-2), each requiring an attributed STRONG_RED
  at review time.

### Rollback notes
None — additive only; feature is inert without the gate/review slices.

### Done criteria
Signal drafts generate from triggers with complete claim bindings and zero private-data
leakage in the canary suite; drafts cannot leave `generated` from this slice's code.

## Slice 5: Evergreen generation, idea bank, and founder voice

Depends on: Slice 1, Slice 2.

### Scope
IdeaBankEntry and VoiceSample management (server logic + minimal internal CRUD screens),
evergreen draft generation conditioned on active VoiceSamples and a chosen idea-bank entry.
Refuses to generate with zero active voice samples (AC-11). Evergreen factual assertions, if
any, go through claim binding like signal posts.

### Allowed files
- lib/marketing/generation/evergreen/
- app/marketing/ideabank/
- db/migrations/marketing/
- tests/marketing/generation/evergreen/

### Forbidden files
- lib/marketing/publish/
- lib/marketing/gate/
- lib/marketing/generation/signal/
- lib/marketing/safeview/
- lib/auth/

### Invariants touched
- INV-1 (evergreen prompts may include idea bank + voice samples + safe fields only)
- INV-2 (factual assertions in evergreen copy require bindings; pure-opinion copy declares no
  claims and the gate treats undeclared factual-looking text per Slice 6 rules)

### Tests required
- Voice-conditioning test: prompt context contains active VoiceSamples; zero-samples case
  refuses with actionable error (AC-11).
- Canary test on evergreen prompts/outputs (AC-1, INV-1).
- Idea-bank lifecycle test: retired entries are never selected.

### Proof obligations
- Regression test `marketing/generation/evergreen/canary.test` (INV-1) with attributed
  STRONG_RED at review time.

### Rollback notes
Revert additive migrations and module; idea-bank content is user data — export before revert
if rollback happens after founder entry begins.

### Done criteria
Evergreen drafts generate in founder voice from the idea bank; refusal path works; canary
suite green.

## Slice 6: Safety gate

Depends on: Slice 3, Slice 4, Slice 5.

### Scope
The automated gate every draft revision must pass: private-data scan (canary + pattern scan
for contact info), claim verification (no unbound claims; re-verify at approval time per
INV-6), quote verification, minor-protection rules (grade-level floor per INV-8, deny-by-
default photo basis per INV-7), and the platform-policy checklist. Produces GateResult per
draft revision; failed/missing/stale gate blocks all forward transitions.

### Allowed files
- lib/marketing/gate/
- tests/marketing/gate/

### Forbidden files
- lib/marketing/generation/
- lib/marketing/publish/
- lib/marketing/claims/
- lib/marketing/safeview/
- app/
- db/migrations/

### Invariants touched
- INV-1 (gate is the second, independent leak check)
- INV-2 (unbound claim ⇒ fail, reason `unbound-claim`)
- INV-4 (failed/missing/stale gate blocks approval/schedule/publish)
- INV-5 (unverified quote ⇒ fail, reason `unverified-quote`)
- INV-6 (approval-time re-verification hook)
- INV-7 (photo without recorded usage basis ⇒ strip photo or block)
- INV-8 (below grade floor ⇒ fail, reason `minor-floor`; floor change is audit-logged admin
  action)

### Tests required
- One failing-and-passing pair per gate check: unbound claim (AC-2), unverified quote (AC-5),
  stale claim at approval (AC-6), missing photo basis (AC-7), middle-schooler block (AC-8),
  private-data pattern hit (AC-1).
- Stale-gate test: gate result older than draft revision counts as missing (INV-4, AC-4).

### Proof obligations
- Regression tests `marketing/gate/<check>.test` for INV-2/4/5/6/7/8 — each named check needs
  an attributed STRONG_RED at remediation/review time (gate check removed ⇒ test red).

### Rollback notes
None — additive only; but NOTE: disabling the gate is never a rollback option once review
(Slice 8) exists, because INV-4 is enforced at the state machine too (Slice 1).

### Done criteria
Every gate check has a red/green test pair; gate reasons match AC vocabulary; INV-8 default
floor blocks middle schoolers pending OQ-3.

## Slice 7: Branded graphic rendering

Depends on: Slice 1, Slice 2.

### Scope
Server-side rendering of branded graphics (offer announcement, commitment, top-performer card
templates) from BrandKit fonts/colors and a gated draft revision's copy/fields; photo
attachment honors the PhotoAsset usage-basis flag. Rendering requests for un-gated revisions
are rejected.

### Allowed files
- lib/marketing/render/
- tests/marketing/render/

### Forbidden files
- lib/marketing/generation/
- lib/marketing/publish/
- lib/marketing/gate/
- app/
- db/migrations/

### Invariants touched
- INV-13 (BrandKit-only assets; gated copy/fields only; un-gated revision rejected)
- INV-7 (renderer is the enforcement point that strips/blocks photos without usage basis)
- INV-1 (renderer reads via PublicSafeView/gated draft only; canary scan over rendered output)

### Tests required
- Un-gated revision rejection test (AC-10, INV-13).
- Photo-basis test: unset basis ⇒ photoless variant or block; set basis ⇒ photo attached
  (AC-7, INV-7).
- Canary scan over rendered text layers (AC-1, INV-1).
- Template snapshot tests for the three template families using BrandKit assets (AC-10).

### Proof obligations
- Regression test `marketing/render/photo-basis.test` (INV-7) and
  `marketing/render/gated-only.test` (INV-13), each with attributed STRONG_RED at review time.

### Rollback notes
None — additive only.

### Done criteria
Three template families render deterministically from gated drafts; photo basis enforced;
un-gated rendering impossible via public API.

## Slice 8: Review and approval workflow

Depends on: Slice 6, Slice 7.

### Scope
The internal review queue UI + approval server actions: batch list of gated drafts with
rendered previews, one-click approve/reject, inline edit (which re-enters `generated` and
re-gates), recorded Approval (approver identity + timestamp) bound to the exact revision.
Server rejects approvals on failed/missing/stale gate results and forged approval attempts.
Designed for AC-12 throughput (≥10 decisions per session screen).

### Allowed files
- app/marketing/review/
- lib/marketing/approval/
- tests/marketing/approval/

### Forbidden files
- lib/marketing/publish/
- lib/marketing/gate/
- lib/marketing/generation/
- lib/marketing/domain/
- db/migrations/

### Invariants touched
- INV-3 (Approval rows are creatable only by authenticated humans; no system principal path)
- INV-4 (server-side rejection of approval on failed/missing/stale gate)
- INV-9 (inline edit invalidates gate + approval, revision re-enters lifecycle at `generated`)
- INV-6 (approval action triggers claim re-verification before recording)

### Tests required
- Forged-approval test: API call without an authenticated human principal is rejected (AC-3,
  INV-3).
- Failed-gate approval test: UI control absent and server rejects (AC-4, INV-4).
- Edit-revokes test: inline edit voids approval/gate, publish then rejected (AC-4, INV-9).
- Re-verification-at-approval test wiring to Slice 3 (AC-6, INV-6).
- Batch-throughput test: 10 drafts approvable in one queue session flow (AC-12).

### Proof obligations
- Regression tests `marketing/approval/human-only.test` (INV-3) and
  `marketing/approval/gate-required.test` (INV-4) — attributed STRONG_RED required at review.

### Rollback notes
Revert UI/module; approvals already recorded remain valid data. Additive otherwise.

### Done criteria
No path to an Approval without a human principal and a passing, fresh gate result; review
throughput criterion demonstrated; edits always re-gate.

## Slice 9: Publishing connector (Instagram + X), scheduling of approved posts, retraction

Depends on: Slice 8.

### Scope
Official-API connectors for Instagram and X: publish an approved (and optionally scheduled)
draft, write the immutable PublishedPost snapshot, idempotent delivery with reconcile-on-retry,
scheduled publishing *of approved posts only*, and retraction (platform delete + status mark,
snapshot retained). Publishing precondition: Approval present for this exact revision AND gate
fresh (INV-3, INV-4). No auto-approval, no publish of un-approved drafts under any
configuration in this release (NG2/OQ-1).

### Allowed files
- lib/marketing/publish/
- tests/marketing/publish/

### Forbidden files
- lib/marketing/approval/
- lib/marketing/gate/
- lib/marketing/generation/
- app/
- db/migrations/

### Invariants touched
- INV-3 (connector refuses without a recorded human Approval for the exact revision)
- INV-4 (connector re-checks gate freshness as last line of defense)
- INV-10 (at-most-once per (post, platform); reconcile against platform before re-send)
- INV-11 (immutable snapshot written on publish; retraction never mutates it)

### Tests required
- No-approval publish attempt (direct call + scheduled path) makes zero platform API calls
  (AC-3, INV-3) — red-team style test exercising the scheduler end-to-end.
- Ambiguous-failure retry test: timeout after platform accept ⇒ reconcile ⇒ exactly one live
  post (AC-9, INV-10).
- Snapshot test: publish writes complete snapshot; retraction leaves it byte-identical (AC-9,
  AC-14, INV-11).
- Official-API contract tests against sandbox/mocked endpoints (AC-13).

### Proof obligations
- Regression tests `marketing/publish/approval-required.test` (INV-3),
  `marketing/publish/idempotency.test` (INV-10), `marketing/publish/snapshot.test` (INV-11) —
  each needs an attributed STRONG_RED at remediation/review time. INV-3's test is the plan's
  single most important proof: it is what makes NG2 mechanical rather than aspirational.

### Rollback notes
Feature-flag the connectors (publish disabled ⇒ system degrades to draft+approve only).
Retraction path doubles as operational rollback for bad posts.

### Done criteria
Approved posts publish to both platforms via official APIs; un-approved publish is impossible
including via scheduler; idempotency and snapshot tests green; retraction works.

## Slice 10: Scheduled draft generation runs

Depends on: Slice 4, Slice 5. Independent of Slice 9 (may build in parallel after 8).

### Scope
ScheduledRun configuration and execution: cron-style cadence per post kind, signal-trigger
polling, evergreen cadence from the idea bank — producing PostDrafts only. The run principal
has no approval or publish capability (enforced by Slices 8/9; asserted again here). Run
history and failure reporting for operability.

### Allowed files
- lib/marketing/schedule/
- app/marketing/schedule/
- tests/marketing/schedule/

### Forbidden files
- lib/marketing/publish/
- lib/marketing/approval/
- lib/marketing/gate/
- lib/marketing/generation/
- db/migrations/

### Invariants touched
- INV-3 (scheduler principal cannot create Approvals — asserted by test from this slice's side)
- INV-9 (runs create drafts in `generated` only; no other transition issued)

### Tests required
- End-to-end run test: scheduled run produces drafts, zero publish/approval calls observable
  (AC-3, AC-12, INV-3).
- Cadence test: runs fire per configuration; failures are recorded and reported.
- State test: all run-produced drafts are in `generated` (INV-9).

### Proof obligations
- Regression test `marketing/schedule/no-publish.test` (INV-3, scheduler side) with attributed
  STRONG_RED at review time.

### Rollback notes
Disable/delete the schedule configuration; drafts already generated remain inert in the queue.
Additive otherwise.

### Done criteria
Hands-off draft generation works on schedule; scheduler provably cannot approve or publish;
run failures visible to operators.
