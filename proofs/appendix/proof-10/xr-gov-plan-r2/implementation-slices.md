# Implementation slices

Ordering: 1 → 2 → 3 → 4 → 5 → 6 → 7, with 8 and 9 after 3/4 (8 also needs 5 for the queue it
feeds). The graph is acyclic. One slice = one verified-implementation run = one ship-review.
All slices are BLOCKED from implementation until OQ-1, OQ-2, and OQ-3 are resolved (Slices 2 and
6 depend on their answers directly; the rest inherit the plan-level block).

File-layout convention (greenfield, per spec-intake Step 0): module code under
`src/marketing-engine/<area>/`, review UI under `src/app/marketing/`, schema under
`db/migrations/`, tests under `tests/marketing-engine/<area>/`. The first run must reconcile
these names against the real repo before coding; renames apply uniformly.

## Slice 1: Domain schema and post lifecycle state machine

### Scope
Create the marketing-engine tables (SignalEvent, SourceFactSnapshot, IdeaBankItem,
GenerationRecord, PostDraft, ClaimVerification, ApprovalDecision, PhotoRightsRecord,
RenderedGraphic, PublishRecord, BrandAccount, AuditEntry) and the PostDraft state machine with
persistence-layer enforcement of legal transitions, the SignalEvent dedupe uniqueness constraint,
and append-only AuditEntry semantics. Owns ALL migrations for the plan; later slices may not add
migrations. No generation, no UI, no external calls. Depends on: nothing.

### Allowed files
- db/migrations/
- src/marketing-engine/domain/
- tests/marketing-engine/domain/

### Forbidden files
- src/marketing-engine/generation/
- src/marketing-engine/publisher/
- src/marketing-engine/verification/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-16, INV-14, INV-17

### Tests required
- tests/marketing-engine/domain/state-machine.test.ts — one test per legal edge, one per
  forbidden edge (AC-16)
- tests/marketing-engine/domain/audit-append-only.test.ts — UPDATE/DELETE via app paths fail (AC-14)
- tests/marketing-engine/domain/signal-dedupe.test.ts — duplicate SignalEvent insert is a no-op (AC-17)

### Proof obligations
- INV-16: state-machine.test.ts forbidden-edge cases must show an attributed STRONG_RED (regression-check.mjs) when transition enforcement is removed.
- INV-14: audit-append-only.test.ts must show an attributed STRONG_RED when append-only enforcement is dropped.
- INV-17: signal-dedupe.test.ts must show an attributed STRONG_RED when the uniqueness constraint is removed.

### Rollback notes
Revert the migration set (new tables only — additive to the existing platform schema; no existing
table is altered). Module code is unreferenced by the platform until later slices.

### Done criteria
All three test files green; forbidden transitions rejected at persistence layer; migrations apply
and roll back cleanly against a copy of the platform schema; no existing table modified.

## Slice 2: Signal detection and source-fact snapshotting

### Scope
Detect signal events (new/Nth offer, commitment, weekly top performers) from platform data and
write SignalEvents + SourceFactSnapshots using a hard allowlist of public-safe fields. Enforce
the minors-eligibility filter (policy constant from OQ-3 resolution; unknown age/grade →
excluded). Private fields (evaluations, coach notes, contact info) are structurally unreadable by
this module (no select on those columns). Depends on: Slice 1. Blocked on: OQ-3 (floor value),
OQ-7 (whether coach-activity is a publishable source).

### Allowed files
- src/marketing-engine/signals/
- tests/marketing-engine/signals/

### Forbidden files
- db/migrations/
- src/marketing-engine/generation/
- src/marketing-engine/publisher/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-1, INV-2, INV-8, INV-17

### Tests required
- tests/marketing-engine/signals/allowlist.test.ts — seeded private-note/contact canaries never
  appear in any snapshot (AC-1 extraction half)
- tests/marketing-engine/signals/eligibility.test.ts — under-floor and unknown-age athletes
  produce no SignalEvent (AC-8)
- tests/marketing-engine/signals/snapshot-provenance.test.ts — snapshots carry record refs +
  timestamps for every value (AC-2 extraction half)
- tests/marketing-engine/signals/redetection.test.ts — re-run over unchanged data is a no-op (AC-17)

### Proof obligations
- INV-1: allowlist.test.ts canary cases must show an attributed STRONG_RED (regression-check.mjs) when the field allowlist is bypassed.
- INV-2: snapshot-provenance.test.ts must show an attributed STRONG_RED when snapshot record references are dropped.
- INV-8: eligibility.test.ts must show an attributed STRONG_RED when the eligibility filter (incl. unknown-age fail-closed) is removed.
- INV-17: redetection.test.ts must show an attributed STRONG_RED when dedupe is bypassed.

### Rollback notes
Feature-flag the detection job off; data written is additive (SignalEvents/snapshots) and inert
without downstream slices.

### Done criteria
Detection produces correct SignalEvents on fixtures for all three signal types; canary tests
prove private fields unreachable; eligibility fail-closed proven; re-runs idempotent.

## Slice 3: Copy generation service

### Scope
Anthropic-backed generation for signal and evergreen posts: structured-output schema, capture of
model id / prompt version id / run-trace id / input reference on every GenerationRecord,
decline-on-insufficient-facts, schema-validation fail → rejected_generation, and strict
separation of raw model output (internal storage only, never user-visible or publishable).
Evergreen uses IdeaBankItems only; voice prompt version recorded (calibration per OQ-5).
No publishing, no UI. Depends on: Slices 1, 2.

### Allowed files
- src/marketing-engine/generation/
- tests/marketing-engine/generation/

### Forbidden files
- db/migrations/
- src/marketing-engine/publisher/
- src/marketing-engine/signals/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-1, INV-6, INV-11, INV-12, INV-13

### Tests required
- tests/marketing-engine/generation/traceability.test.ts — every GenerationRecord complete;
  incomplete write rejected (AC-6)
- tests/marketing-engine/generation/schema-validation.test.ts — malformed model responses →
  rejected_generation, nothing reviewable stored (AC-11)
- tests/marketing-engine/generation/decline.test.ts — insufficient snapshot → recorded decline,
  no draft (AC-12)
- tests/marketing-engine/generation/no-leak.test.ts — prompt/raw-envelope absent from draft
  fields and payload-bound fields (AC-13)
- tests/marketing-engine/generation/input-allowlist.test.ts — generation reads only snapshot/
  idea-bank inputs; canary in a private column never reaches the prompt (AC-1 generation half)

### Proof obligations
- INV-1: input-allowlist.test.ts must show an attributed STRONG_RED (regression-check.mjs) when generation is fed non-snapshot data.
- INV-6: traceability.test.ts must show an attributed STRONG_RED when any of model id / prompt version / run id capture is removed.
- INV-11: schema-validation.test.ts must show an attributed STRONG_RED when permissive parsing is introduced.
- INV-12: decline.test.ts must show an attributed STRONG_RED when the insufficiency check is removed.
- INV-13: no-leak.test.ts must show an attributed STRONG_RED when raw output is exposed on a draft field.

### Rollback notes
Feature-flag generation off; GenerationRecords/PostDrafts are additive and inert without the
review and publish slices.

### Done criteria
All five test files green on mocked model responses; live-model smoke run produces a complete
GenerationRecord; declines and schema failures terminal per the state machine.

## Slice 4: Claim verification and private-data gate

### Scope
The automated gate between generated and verified: extract claims from generated copy, match each
against the SourceFactSnapshot (counts, dates, schools, rankings; quotes must match a source
verbatim), run the private-data scan (canary/contact/evaluation patterns), record a
claim-by-claim ClaimVerification, and fail closed — unmatched claim, scan hit, or gate error
means verification_failed. Unverified or failed drafts are not approvable/publishable. Depends
on: Slices 2, 3.

### Allowed files
- src/marketing-engine/verification/
- tests/marketing-engine/verification/

### Forbidden files
- db/migrations/
- src/marketing-engine/generation/
- src/marketing-engine/publisher/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-1, INV-2, INV-3, INV-5

### Tests required
- tests/marketing-engine/verification/fabrication.test.ts — off-by-one offer count, invented
  quote, invented school all blocked (AC-3)
- tests/marketing-engine/verification/claim-resolution.test.ts — every claim in a passing draft
  resolves; dangling reference fails (AC-2)
- tests/marketing-engine/verification/private-scan.test.ts — injected canary/contact strings
  caught (AC-1 gate half)
- tests/marketing-engine/verification/fail-closed.test.ts — gate exception or pending status →
  not approvable/publishable (AC-5)

### Proof obligations
- INV-1: private-scan.test.ts must show an attributed STRONG_RED (regression-check.mjs) when the scan is removed from the gate.
- INV-2: claim-resolution.test.ts must show an attributed STRONG_RED when unresolved claims are allowed to pass.
- INV-3: fabrication.test.ts must show an attributed STRONG_RED when claim matching is weakened or skipped.
- INV-5: fail-closed.test.ts must show an attributed STRONG_RED when pending/failed verification becomes publishable.

### Rollback notes
None needed beyond revert — the gate is a pure function over drafts plus a ClaimVerification
write; removing it leaves drafts stuck in `generated` (fail closed), never auto-verified.

### Done criteria
Adversarial fixtures blocked; golden fixtures pass with full claim resolution; gate errors fail
closed; verification result is the only path to `verified`.

## Slice 5: Human review and approval workflow

### Scope
Review queue UI (in-app, `src/app/marketing/`) showing verified drafts with rendered claim
provenance ("why it said that"), approve / reject / light-edit actions (edit returns the draft
through verification before it is approvable), and recorded ApprovalDecisions bound to the exact
draft version. Raw prompts/model output appear only in the designated internal provenance panel.
Depends on: Slices 1, 4.

### Allowed files
- src/app/marketing/
- src/marketing-engine/review/
- tests/marketing-engine/review/

### Forbidden files
- db/migrations/
- src/marketing-engine/publisher/
- src/marketing-engine/generation/
- src/marketing-engine/verification/
- .env
- .env.local

### Invariants touched
- INV-4, INV-5, INV-13, INV-14, INV-16

### Tests required
- tests/marketing-engine/review/approval-record.test.ts — approval writes approver/timestamp/
  version; absent approval leaves draft unpublishable (AC-4 review half)
- tests/marketing-engine/review/unverified-not-approvable.test.ts — failed/pending drafts not
  approvable even via direct action call (AC-5)
- tests/marketing-engine/review/edit-reverify.test.ts — edited draft re-enters verification
  before approvable (AC-20)
- tests/marketing-engine/review/ui-leak.test.ts — prompts/raw output confined to provenance
  panel (AC-13)
- tests/marketing-engine/review/audit-chain.test.ts — approval appends AuditEntry (AC-14)

### Proof obligations
- INV-4: approval-record.test.ts must show an attributed STRONG_RED (regression-check.mjs) when approval recording is bypassed.
- INV-5: unverified-not-approvable.test.ts must show an attributed STRONG_RED when the approvability predicate drops the verification check.
- INV-13: ui-leak.test.ts must show an attributed STRONG_RED when raw model output is rendered outside the provenance panel.
- INV-14: audit-chain.test.ts must show an attributed STRONG_RED when approval stops appending audit entries.
- INV-16: edit-reverify.test.ts must show an attributed STRONG_RED when edit→approve skips re-verification.

### Rollback notes
Revert; UI routes are additive and the publisher (Slice 7) refuses anything without an
ApprovalDecision regardless of UI state.

### Done criteria
A reviewer can approve a verified draft in one screen with visible per-claim provenance; all five
tests green; rejected and edited paths behave per the state machine.

## Slice 6: Branded graphic rendering and photo-rights gate

### Scope
Render branded graphics (brand fonts/colors; templates for offer/commitment/top-performer cards)
for draft versions, with the photo-rights gate: likeness used only with a PhotoRightsRecord for
that athlete+asset, fail closed to a no-likeness variant or recorded skip. Graphics draw text
solely from the verified draft + snapshot (no new claims). Depends on: Slice 1 (and Slice 4
upstream in the pipeline). Blocked on: OQ-1 (what constitutes a valid rights basis), OQ-9
(asset sources).

### Allowed files
- src/marketing-engine/render/
- public/marketing-assets/
- tests/marketing-engine/render/

### Forbidden files
- db/migrations/
- src/marketing-engine/publisher/
- src/marketing-engine/generation/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-1, INV-7

### Tests required
- tests/marketing-engine/render/photo-rights.test.ts — no rights record → no likeness; rights
  record → photo used and reference captured (AC-7)
- tests/marketing-engine/render/content-source.test.ts — rendered text comes only from the
  verified draft/snapshot; seeded private canary in an adjacent column never renders (AC-1
  render half)

### Proof obligations
- INV-7: photo-rights.test.ts must show an attributed STRONG_RED (regression-check.mjs) when the rights gate is removed or unknown-basis stops failing closed.
- INV-1: content-source.test.ts must show an attributed STRONG_RED when the renderer gains access to non-snapshot data.

### Rollback notes
Revert; rendering is a pure artifact producer — posts can ship text-only (publisher treats the
graphic as optional per template).

### Done criteria
All card templates render deterministic snapshot fixtures; rights gate proven fail-closed; visual
fixtures approved by the founder once (brand look), then locked as golden images.

## Slice 7: Publisher with dry-run-first posting to Instagram and X

### Scope
The only publish path: takes an approved draft version + ClaimVerification pass + ApprovalDecision,
publishes to a BrandAccount. Dry-run-first (full payload render-and-log, zero external calls);
live mode is per-account opt-in, default off, enablement audited. Idempotent per (draft version,
account). Credentials from server-side secrets only. Every publish/no-op appends to the audit
chain. Depends on: Slices 5, 6. Blocked on: OQ-2 (founder sign-off that approval-gated publishing
is the shipped behavior), OQ-4 (accounts/API tiers).

### Allowed files
- src/marketing-engine/publisher/
- tests/marketing-engine/publisher/

### Forbidden files
- db/migrations/
- src/marketing-engine/generation/
- src/marketing-engine/review/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-4, INV-5, INV-9, INV-10, INV-14, INV-15, INV-16

### Tests required
- tests/marketing-engine/publisher/approval-required.test.ts — no ApprovalDecision → refuse (AC-4)
- tests/marketing-engine/publisher/verification-required.test.ts — failed/pending verification →
  refuse despite approval row (AC-5)
- tests/marketing-engine/publisher/dry-run.test.ts — default dry-run, payload logged, network
  assertion zero external calls; live requires audited enablement (AC-9)
- tests/marketing-engine/publisher/idempotency.test.ts — duplicate + concurrent publish →
  exactly one external call / one PublishRecord (AC-10)
- tests/marketing-engine/publisher/credentials.test.ts — tokens only via server secret
  resolution; never logged or persisted (AC-15)
- tests/marketing-engine/publisher/audit.test.ts — publish and no-op both append AuditEntries;
  chain reconstructable (AC-14)
- tests/marketing-engine/publisher/state.test.ts — publish only from `approved`; published is
  terminal (AC-16)

### Proof obligations
- INV-4: approval-required.test.ts must show an attributed STRONG_RED (regression-check.mjs) when the approval check is removed from the publish path.
- INV-5: verification-required.test.ts must show an attributed STRONG_RED when the verification predicate is dropped.
- INV-9: dry-run.test.ts must show an attributed STRONG_RED when live becomes the default or dry-run makes external calls.
- INV-10: idempotency.test.ts must show an attributed STRONG_RED when the uniqueness guard is removed.
- INV-14: audit.test.ts must show an attributed STRONG_RED when publish stops appending audit entries.
- INV-15: credentials.test.ts must show an attributed STRONG_RED when a token reaches a log or row; repo/bundle scan is the second control.
- INV-16: state.test.ts must show an attributed STRONG_RED when publish accepts non-approved states.

### Rollback notes
Disable live mode per account (audited flag) — instant kill switch; then revert. Already-published
external posts require manual platform deletion (OQ-6 default).

### Done criteria
All seven tests green; end-to-end dry-run from approved fixture draft produces logged payloads
for IG and X formats; one live smoke post per platform on a sandbox/test account, then verified
in the audit chain.

## Slice 8: Scheduled generation orchestration

### Scope
Cron/scheduled runs that execute signal detection and generation on cadence and deposit
verified-or-failed drafts into the review queue. The scheduler has no publish capability — it
cannot reach the publisher module and produces nothing beyond queue entries. Cadence/platform
rate constraints per OQ-4. Depends on: Slices 3, 4, 5.

### Allowed files
- src/marketing-engine/scheduler/
- tests/marketing-engine/scheduler/

### Forbidden files
- db/migrations/
- src/marketing-engine/publisher/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-4, INV-16

### Tests required
- tests/marketing-engine/scheduler/no-publish.test.ts — a full scheduled run ends with drafts in
  reviewable states only; no PublishRecord exists; scheduler module imports no publisher code (AC-4)
- tests/marketing-engine/scheduler/state-respect.test.ts — scheduler writes only legal
  transitions; re-runs do not duplicate work (AC-16, with Slice 2's dedupe)

### Proof obligations
- INV-4: no-publish.test.ts must show an attributed STRONG_RED (regression-check.mjs) when the scheduler gains a path to the publisher.
- INV-16: state-respect.test.ts must show an attributed STRONG_RED when scheduler writes bypass the state machine.

### Rollback notes
Disable the cron entry; generation falls back to manual triggering from the review UI.

### Done criteria
Scheduled run on fixture data populates the review queue end-to-end with zero publishes; re-runs
idempotent; cadence configurable.

## Slice 9: Generator golden and adversarial regression harness

### Scope
CI harness over Slices 3–4: golden cases (fixed snapshots → expected-output properties: claims
subset of snapshot, required fields, tone constraints) and adversarial cases (prompts/data
crafted to elicit fabrication, private-data leakage, quote invention, insufficient-fact padding,
schema abuse). Failures block merge. This is the measurable basis for the founder's "once we
trust the quality" (OQ-2) — it produces evidence, not permission. Depends on: Slices 3, 4.

### Allowed files
- tests/marketing-engine/harness/
- tests/marketing-engine/fixtures/

### Forbidden files
- db/migrations/
- src/marketing-engine/
- src/app/
- .env
- .env.local

### Invariants touched
- INV-1, INV-3, INV-11, INV-12

### Tests required
- tests/marketing-engine/harness/golden.test.ts — golden snapshot set with per-case expected
  properties (AC-19)
- tests/marketing-engine/harness/adversarial.test.ts — fabrication bait, canary leakage bait,
  fake-quote bait, padding bait, malformed-output injection (AC-1, AC-3, AC-11, AC-12)

### Proof obligations
- INV-1: adversarial.test.ts leakage cases must show an attributed STRONG_RED (regression-check.mjs) when the private-data controls are weakened.
- INV-3: adversarial.test.ts fabrication cases must show an attributed STRONG_RED when claim verification is weakened.
- INV-11: adversarial.test.ts malformed-output cases must show an attributed STRONG_RED when schema validation is weakened.
- INV-12: adversarial.test.ts padding cases must show an attributed STRONG_RED when the decline path is weakened.

### Rollback notes
None — additive only (tests and fixtures); removing the harness is itself a reviewable red flag.

### Done criteria
Harness wired into CI as a required check; all golden and adversarial cases pass against the
shipped Slices 3–4; fixture set documented enough for the founder to add cases.
