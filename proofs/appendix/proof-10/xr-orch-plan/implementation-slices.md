# Implementation slices

> Path note (IN-1/A7): the engine repo is not readable from this compilation context. All file
> paths below are **proposed placeholders** using a `src/offer-drafts/` module convention; they
> MUST be remapped onto the real repo's layout (and the real migration/test directories) before
> any slice's verified-implementation run, preserving each slice's allowed/forbidden *intent*:
> the existing publisher, model-pipeline internals, and queue/approval code are forbidden in
> every slice. Slices 1–4 are sequential; Slice 5 depends on 1 and 4 only.
>
> Blocking note: Slice 1's ledger key and lifecycle semantics depend on OQ-1 and OQ-2 (both
> high, open). No slice may start implementation while those are open (plan-lint enforces).

## Slice 1: Draft-provenance and dedupe-ledger schema

### Scope
Additive schema for the new persistence: draft↔offer trace records (many-to-many, A2),
the persistent dedupe ledger keyed on offer identity (key per OQ-1 answer, with a uniqueness
constraint enforcing at-most-once at the database level), the model-call reference on drafts
(following the engine's existing traceability convention — confirm shape at handoff, A5), and
run-history tables (OrchestrationRun, RunItemFailure with sanitized-message + category +
correlation-id columns). No job logic, no generation, no UI. Depends on: OQ-1/OQ-2 resolved.

### Allowed files
- `migrations/`
- `src/offer-drafts/schema.ts`
- `src/offer-drafts/types.ts`
- `tests/offer-drafts/schema.test.ts`

### Forbidden files
- `src/publishing/`
- `src/pipeline/`
- `src/review-queue/`
- `src/dashboard/`
- `src/offer-drafts/job.ts`

### Invariants touched
- INV-2 (uniqueness constraint on offer identity in the ledger — DB-level backstop)
- INV-4 (trace + model-call columns non-nullable where the invariant demands completeness)
- INV-5 (failure table has only allowlisted columns: category, sanitized message, offer ref, correlation id)

### Tests required
- Migration applies and rolls back cleanly on an empty and a seeded database.
- Inserting two ledger rows with the same offer identity violates the uniqueness constraint.
- A draft-trace row cannot be created without an offer reference; the draft provenance columns
  reject null model-call IDs (per INV-4 shape).

### Proof obligations
- Regression test `ledger-unique-offer-identity` (INV-2 backstop) must exist and will require
  an attributed STRONG_RED via `regression-check.mjs` at remediation/review time.
- Regression test `trace-provenance-not-null` (INV-4) — same STRONG_RED requirement.
- Schema review confirms no column stores raw payloads/stack traces (INV-5 shape).

### Rollback notes
Revert the migration (down-migration provided); additive-only — no existing tables altered
destructively, so rollback is safe before any dependent slice ships.

### Done criteria
Migrations green both directions; uniqueness and not-null proofs red-then-green; no file
outside the allowed set touched; schema documented in the slice PR for Slices 2–4 to consume.

## Slice 2: Eligible-offer selection and record validation

### Scope
Read-only selection of eligible offers (verified status + recency window per OQ-5 default) and
per-record validation/normalization of the four public facts — including the date policy:
truthful partial dates pass through at known precision, unparseable/contradictory dates
produce a typed per-record validation failure (never a guess). Output is a pure
list of valid normalized records + typed failures; no writes to queue or ledger here.
Depends on: Slice 1 (types).

### Allowed files
- `src/offer-drafts/select-offers.ts`
- `src/offer-drafts/validate-offer.ts`
- `src/offer-drafts/offer-date.ts`
- `tests/offer-drafts/select-offers.test.ts`
- `tests/offer-drafts/validate-offer.test.ts`

### Forbidden files
- `migrations/`
- `src/publishing/`
- `src/pipeline/`
- `src/review-queue/`
- `src/dashboard/`
- `src/offer-drafts/schema.ts`

### Invariants touched
- INV-9 (selection filters on verified status; normalized record contains only the four public facts)
- INV-7 (date policy: truthful representation or typed failure, never fabrication)
- INV-6 (validation returns per-record failures instead of throwing batch-fatal errors)

### Tests required
- Seed verified + unverified offers; only verified ones are selected (INV-9).
- Date table tests: full date, month/year partial, garbage string, impossible date, empty —
  asserting truthful precision or typed failure per A3/OQ-4 policy, never a coerced default day.
- Normalized output contains exactly the four public facts and the offer identity — no extra
  athlete/offer fields (INV-9 input-restriction half).
- A batch with malformed records returns failures alongside the valid records (INV-6 shape).

### Proof obligations
- Regression test `date-never-fabricated` (INV-7) — attributed STRONG_RED required at
  remediation/review time via `regression-check.mjs`.
- Regression test `unverified-never-selected` (INV-9) — same STRONG_RED requirement.

### Rollback notes
None — additive pure modules; nothing else imports them until Slice 3. Revert the files.

### Done criteria
All date-policy table tests green; verified-only selection proven; module is pure/read-only
(no queue/ledger writes anywhere in the slice's diff); buildable from this plan alone.

## Slice 3: Draft generation and atomic enqueue with dedupe

### Scope
The per-offer pipeline: ledger check (skip-as-duplicate on hit), call the existing model
pipeline interface (confirm signature at handoff, A5) with only the normalized public facts,
then atomically commit — in one transaction — the draft in pending-review state, its offer
trace(s), its model-call ID, and the ledger entry. Any failure inside the unit rolls the whole
unit back and yields a typed per-record failure. No scheduler, no run bookkeeping yet.
Depends on: Slice 1, Slice 2.

### Allowed files
- `src/offer-drafts/generate-draft.ts`
- `src/offer-drafts/enqueue-draft.ts`
- `src/offer-drafts/dedupe.ts`
- `tests/offer-drafts/generate-draft.test.ts`
- `tests/offer-drafts/enqueue-draft.test.ts`

### Forbidden files
- `migrations/`
- `src/publishing/`
- `src/pipeline/`
- `src/review-queue/`
- `src/dashboard/`
- `src/offer-drafts/select-offers.ts`

### Invariants touched
- INV-1 (drafts created only in pending-review state; no publish call path)
- INV-2 (ledger check + ledger insert inside the same transaction as the draft — at-most-once under concurrency)
- INV-3 (draft + traces + model-call ID + ledger entry are one atomic unit)
- INV-4 (enqueue refuses a draft lacking offer trace or model-call ID)
- INV-7 (generation input carries the date exactly as validated; no reformatting that adds precision)

### Tests required
- Same offer processed twice (sequentially and concurrently, two workers) → exactly one draft;
  second attempt records skipped-duplicate (INV-2; AC-2).
- Fault injection between draft write and trace/ledger write → zero partial rows visible
  afterward (INV-3; AC-3).
- Pipeline returns no model-call ID → no draft enqueued, typed failure returned (INV-4; AC-4).
- Created draft asserted to be in pending-review state; no published-state write exists in the
  module's call graph (INV-1; AC-1).
- Generation request payload snapshot contains only the four public facts (INV-9 input half).

### Proof obligations
- Regression test `dedupe-at-most-once-concurrent` (INV-2) — attributed STRONG_RED required.
- Regression test `no-partial-draft-on-failure` (INV-3) — attributed STRONG_RED required.
- Regression test `no-publish-capability` (INV-1) — attributed STRONG_RED required.
- Regression test `provenance-required-to-enqueue` (INV-4) — attributed STRONG_RED required.

### Rollback notes
Revert the slice's files; data written by it (drafts + traces + ledger rows) is inert without
the scheduler (Slice 4) and individually deletable from the queue by the existing review flow.

### Done criteria
All four STRONG_RED-bound regression tests exist and pass; concurrency test green under
repeated runs; no imports from forbidden modules; buildable from this plan alone.

## Slice 4: Scheduled run loop and sanitized run history

### Scope
The scheduled job (cadence per OQ-7 default, registered via the engine's existing scheduler —
confirm at handoff): open an OrchestrationRun record, select (Slice 2), process each record
(Slice 3) with per-record error isolation, sanitize every captured error through an
allowlist serializer (category + human message + offer ref + correlation ID; raw
exception/stack/payload/model output logged internally only, never stored in run history),
close the run with outcome + counts. Also: overlapping-execution guard so two ticks don't
interleave destructively (the ledger already guarantees no duplicates; the guard keeps run
records coherent). Depends on: Slice 2, Slice 3.

### Allowed files
- `src/offer-drafts/job.ts`
- `src/offer-drafts/run-history.ts`
- `src/offer-drafts/sanitize-error.ts`
- `src/offer-drafts/scheduler-registration.ts`
- `tests/offer-drafts/job.test.ts`
- `tests/offer-drafts/sanitize-error.test.ts`

### Forbidden files
- `migrations/`
- `src/publishing/`
- `src/pipeline/`
- `src/review-queue/`
- `src/dashboard/`
- `src/offer-drafts/enqueue-draft.ts`

### Invariants touched
- INV-5 (allowlist sanitizer is the only path into stored failure text)
- INV-6 (per-record try/isolate; batch continues past failures)
- INV-8 (exactly one run record per execution, including zero-offer runs)
- INV-1 (the job wires together only Slices 2–3; no publish path is reachable)
- INV-3 (a run-level crash leaves no partial drafts — per-offer units already committed are whole; in-flight unit rolls back)

### Tests required
- Batch with K bad records of N → N−K drafts, K sanitized failures, run closed as
  succeeded_with_failures with correct counts (INV-6, INV-8; AC-6, AC-8).
- Sanitizer red-team: injected exception containing fake secret, stack trace, raw payload, and
  raw model output → none of those substrings in stored run history (INV-5; AC-5).
- Zero-eligible-offers tick → one run record, zeros (INV-8).
- Simulated crash mid-run → no partial draft visible; next tick proceeds normally and dedupes
  already-committed offers (INV-3, INV-2 interplay).
- Overlap guard: two simultaneous ticks → coherent run records, no duplicate drafts.

### Proof obligations
- Regression test `run-history-never-leaks` (INV-5) — attributed STRONG_RED required via
  `regression-check.mjs`.
- Regression test `bad-record-fails-alone` (INV-6) — regression test must exist (L1: STRONG_RED
  attribution not mandatory but recommended).
- Regression test `crash-leaves-no-partials` (INV-3) — attributed STRONG_RED required.

### Rollback notes
Feature flag / scheduler de-registration: disabling the schedule fully deactivates the feature
(Slices 1–3 are inert libraries + additive schema). Document the kill switch in the slice PR.

### Done criteria
End-to-end staging pass per AC-11 (seeded offers → tick → drafts + run record); sanitizer
red-team green; kill switch demonstrated; no file outside the allowed set touched.

## Slice 5: Run-history view in the internal dashboard

### Scope
Read-only run-history surface in the existing internal dashboard (existing internal auth,
A6): list of runs (time, outcome, created/skipped/failed counts) and per-run failure detail
(category, sanitized message, offer reference, correlation ID). Renders only the allowlisted
stored fields — no raw-object dumps in the UI layer. No new auth, no mutations.
Depends on: Slice 1 (schema), Slice 4 (data). Independent of any future Slice work in 2–3.

### Allowed files
- `src/dashboard/run-history/`
- `tests/dashboard/run-history.test.ts`

### Forbidden files
- `migrations/`
- `src/publishing/`
- `src/pipeline/`
- `src/review-queue/`
- `src/offer-drafts/`

### Invariants touched
- INV-5 (the view renders only allowlisted failure fields; it cannot widen the leak surface by
  serializing whole records)

### Tests required
- View renders runs and failure details from seeded run-history data (AC-10).
- Rendering a failure row outputs only the allowlisted fields; a seeded row with extra/raw
  columns (defense-in-depth fixture) does not leak them into markup.
- Route/view sits behind the existing internal-auth wrapper (assert per the real dashboard's
  auth convention at handoff).

### Proof obligations
- Regression test `dashboard-renders-allowlist-only` (INV-5 display half) — attributed
  STRONG_RED required at remediation/review time.

### Rollback notes
Revert the view files / hide the dashboard route; no data or behavior outside the dashboard
is affected — additive and read-only.

### Done criteria
Dashboard shows run history per AC-10 behind existing auth; allowlist-only rendering proven;
no writes anywhere in the slice's diff.
