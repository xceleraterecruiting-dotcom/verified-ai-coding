# Implementation slices

Ordering: 1 → 2 → 3 → 4; 5 depends on 1–2 and may run parallel to 3–4. The graph is acyclic.
One slice = one verified-implementation run = one ship-review.

**Path placeholder notice (A7/OQ-10):** the engine repo was not readable during compilation, so
all file patterns below use a placeholder layout (`src/marketing-engine/…`,
`src/internal-dashboard/…`, `db/migrations/`, `tests/…`). Each slice's verified-implementation
run MUST re-ground these against the real repo at its Step 0 before using them as gates. The
intent of each list (especially "never the publish/send surface") is binding even where the
literal path differs.

**Blocked notice:** OQ-1, OQ-2, OQ-3 are high-severity and open. Slice 1 cannot start until
OQ-1 is resolved (it defines the dedupe key); Slice 3 cannot start until OQ-2 and OQ-3 are
resolved (they may add invariants to generation/enqueue).

## Slice 1: Persistence foundation — runs, run items, draft provenance, dedupe key

### Scope
Create the durable structures this feature owns: OrchestrationRun and RunItem records,
draft-provenance linkage (draft ↔ source offer id(s) many-to-many, model-call ref, run ref),
and the storage-level dedupe uniqueness (per the OQ-1 answer) that makes draft creation
atomically claim-or-refuse. No job, no generation — schema, data-access functions, and their
tests only. Depends on: nothing (but blocked on OQ-1 for the key definition).

### Allowed files
- db/migrations/
- src/marketing-engine/offer-drafts/domain/
- tests/offer-drafts/domain/

### Forbidden files
- src/marketing-engine/publisher/
- src/marketing-engine/social/
- src/marketing-engine/model-pipeline/
- src/marketing-engine/review-queue/
- src/internal-dashboard/
- .env
- .env.*

### Invariants touched
- INV-2, INV-3, INV-5, INV-8 (schema capability: all four reference fields exist and are
  required), INV-10 (run-record shape incl. crash distinguishability), INV-14

### Tests required
- Unique-constraint test: two inserts with the same dedupe key — second refused at the storage
  layer; concurrent-transaction variant (two open transactions claiming the same key) admits
  exactly one.
- Distinct-offers test: same athlete, two offers per the OQ-1 key — both insert (AC-3).
- Atomicity test: provenance write failing mid-transaction leaves no draft row, no provenance
  rows, no consumed key (AC-5 storage half).
- Schema test: draft/provenance rows refuse persistence with any of offer-ref/model-call-ref/
  run-ref absent (AC-8 storage half).
- Run-record test: crashed-run representation distinguishable from completed and absent (AC-10
  storage half); failed RunItem leaves key unconsumed (AC-14 storage half).

### Proof obligations
- INV-2: regression test "duplicate dedupe-key insert refused (incl. concurrent claim)" must exist and yield an attributed STRONG_RED via regression-check.mjs at remediation/review time (revert the constraint → test fails).
- INV-3: regression test "two distinct offers, same athlete, both persist" with attributed STRONG_RED (collapse key to athlete id → test fails).
- INV-5: regression test "mid-transaction failure leaves zero partial rows and unconsumed key" with attributed STRONG_RED.
- INV-8: regression test "provenance refs are non-nullable / enqueue-blocking at schema level" with attributed STRONG_RED.
- INV-10: regression test "run record encodes crashed vs completed vs absent" with attributed STRONG_RED.
- INV-14: regression test "failed item leaves dedupe key claimable" with attributed STRONG_RED.

### Rollback notes
Revert the migration(s); additive-only — no existing engine tables are altered, so rollback is
a drop of the new structures plus code revert. Confirm at Step 0 that no existing table needed
altering; if one did, write the down-migration in the same slice.

### Done criteria
All tests above green in CI; migration applies and reverses cleanly on a copy of the schema;
data-access API documented for Slices 2–3; no file outside the allowed list changed.

## Slice 2: Scheduled pickup and run lifecycle

### Scope
The scheduled job shell: runs every few minutes; selects offers that are status=verified within
the lookback window (OQ-5 default until answered: a window comfortably exceeding the cadence)
and not yet successfully drafted; opens an OrchestrationRun; iterates items with per-item
failure isolation; records sanitized per-item failures and final counts; marks crash-detectable
state via heartbeat/finished-at. Calls a generation interface that this slice STUBS
(no model calls here — generation is Slice 3's concern). Depends on: Slice 1.

### Allowed files
- src/marketing-engine/offer-drafts/job/
- config/scheduler/
- tests/offer-drafts/job/

### Forbidden files
- src/marketing-engine/publisher/
- src/marketing-engine/social/
- src/marketing-engine/model-pipeline/
- src/marketing-engine/offer-drafts/domain/
- db/migrations/
- src/internal-dashboard/
- .env
- .env.*

### Invariants touched
- INV-2 (job-level: re-run and overlapping-run behavior), INV-4, INV-9, INV-10, INV-12, INV-14

### Tests required
- Re-run idempotency: same offer set, two sequential runs → second run all-deduped, zero new
  drafts (AC-2).
- Overlap test: two runs in flight over the same offers → exactly one draft per offer (AC-2).
- Per-item isolation: N offers, one poisoned → N−1 succeed, one failed item recorded (AC-4).
- Status filter: mixed-status fixture → only verified offers picked (AC-12).
- Sanitization: injected exception carrying stack trace + fake secret + prompt text → stored
  message clean, bounded, cause-coded (AC-9).
- Crash visibility: kill the run mid-iteration → run record shows crashed, partial counts
  durable (AC-10); failed items retried next run, drafted ones not (AC-14).

### Proof obligations
- INV-2: regression test "sequential + overlapping runs produce no duplicate drafts" with attributed STRONG_RED via regression-check.mjs (bypass the claim → test fails).
- INV-4: regression test "poisoned record fails alone; batch completes" with attributed STRONG_RED.
- INV-9: regression test "stored run errors contain no stack/secret/prompt/raw-model strings" with attributed STRONG_RED (remove sanitizer → test fails).
- INV-10: regression test "every execution leaves a run record; crash is distinguishable" with attributed STRONG_RED.
- INV-12: regression test "non-verified statuses never picked up" with attributed STRONG_RED.
- INV-14: regression test "transient failure on run 1 → drafted on run 2; drafted on run 1 → deduped on run 2" with attributed STRONG_RED.

### Rollback notes
Disable the schedule entry (job is registered but off by default until Slice 3 lands); code
revert removes the job. No data migration involved; run records already written are inert.

### Done criteria
All tests green; job runs end-to-end against the stubbed generator in a staging-like
environment producing run records and dedupe behavior per AC-2/4/9/10/12/14; schedule entry
exists but is not enabled in production until Slice 3's ship-review passes.

## Slice 3: Draft generation, fact verification, atomic enqueue

### Scope
Replace the Slice 2 stub with the real path: build generation input strictly from the offer's
public facts; invoke the existing model pipeline through its public interface; validate the
structured output; programmatically verify every factual claim against the source record;
atomically persist draft + provenance (offer refs, model-call ref with model id + prompt
version, run ref) and enqueue into the review queue in pending-review state; fail closed on
missing/unparseable facts (A3) and on verification/schema failure. If OQ-6 reveals the
pipeline's call record lacks prompt version or inputs, store them in draft provenance directly.
Depends on: Slices 1, 2. Blocked on OQ-2 and OQ-3 (their answers may add checks here).

### Allowed files
- src/marketing-engine/offer-drafts/generation/
- src/marketing-engine/offer-drafts/enqueue/
- tests/offer-drafts/generation/

### Forbidden files
- src/marketing-engine/publisher/
- src/marketing-engine/social/
- src/marketing-engine/model-pipeline/
- src/marketing-engine/offer-drafts/domain/
- db/migrations/
- config/scheduler/
- src/internal-dashboard/
- .env
- .env.*

### Invariants touched
- INV-1, INV-5, INV-6, INV-7, INV-8, INV-11, INV-13

### Tests required
- Pending-review + no-publish test: orchestrated draft is pending-review; publish/send surface
  spy records zero calls (AC-1).
- Fail-closed fact tests: each required fact missing/unparseable (incl. partial-date fixtures)
  → failed item, no draft, no defaulted values (AC-6).
- Fabrication rejection: seeded model output with wrong school/college/date/name → verifier
  rejects, failed item, queue empty (AC-7).
- Schema-validation: malformed/empty/wrong-typed model output → failed item (AC-11).
- Traceability resolution: enqueued draft resolves offer id(s), model-call record, model id,
  prompt version, run id; fixture missing any one is refused (AC-8).
- Input-minimization: generator call payload contains exactly the public facts, nothing else
  athlete-related (AC-13).
- End-to-end atomicity with fault injection at each step (AC-5).

### Proof obligations
- INV-1: regression test "no publish-surface invocation; drafts pending-review only" with attributed STRONG_RED via regression-check.mjs (route a draft to publish → test fails).
- INV-5: regression test "fault at any step leaves no partial draft/provenance/claim" with attributed STRONG_RED.
- INV-6: regression test "missing/unparseable fact → skip, never default" with attributed STRONG_RED (add a date fallback → test fails).
- INV-7: regression test "fabricated fact in model output rejected before enqueue" with attributed STRONG_RED (disable verifier → test fails).
- INV-8: regression test "draft missing any provenance ref refused at enqueue" with attributed STRONG_RED.
- INV-11: regression test "schema-invalid model output never enqueued" with attributed STRONG_RED.
- INV-13: regression test "generation payload limited to source public facts" with attributed STRONG_RED.

### Rollback notes
Feature-flag the generation path: flag off restores the Slice 2 stub (job runs, drafts nothing,
records skipped items). Code revert is also clean — Slices 1–2 remain valid without this slice.

### Done criteria
All tests green; AC-1, AC-5–AC-8, AC-11, AC-13 demonstrated; one supervised staging run over
fixture offers produces correct drafts in the queue with resolvable provenance; production
schedule remains off until ship-review passes.

## Slice 4: Generator golden and adversarial regression harness

### Scope
A CI-runnable harness for the generation step itself (AI-output lens #7–#8): golden cases
(fixed offer fixtures with expected-output property assertions — names/school/college/date
present and correct, no extra factual claims, length/format bounds) and adversarial cases
(offer fixtures crafted to elicit fabrication, prompt/PII leakage, off-policy content —
e.g. hostile strings inside athlete/school name fields). Test-only slice; failures it finds are
remediated under Slice 3's contract. Depends on: Slice 3.

### Allowed files
- tests/offer-drafts/generation-harness/
- tests/fixtures/offer-drafts/
- ci/

### Forbidden files
- src/marketing-engine/
- src/internal-dashboard/
- db/migrations/
- config/scheduler/
- .env
- .env.*

### Invariants touched
- INV-6, INV-7, INV-11, INV-13

### Tests required
- Golden suite: ≥5 representative offer fixtures (typical, burst-sibling, long names, edge
  dates) with expected-output property assertions, pinned to prompt version (AC-15).
- Adversarial suite: fixtures attempting fabrication bait (sparse facts), injection via fact
  fields, PII/prompt leakage probes, off-policy tone bait (AC-15).
- Harness wiring test: CI fails when a golden or adversarial assertion regresses.

### Proof obligations
- INV-6: adversarial sparse-fact cases must yield skip-not-pad; expected attributed STRONG_RED via regression-check.mjs by weakening the fail-closed gate.
- INV-7: golden + fabrication-bait cases assert claim-source equality; expected attributed STRONG_RED by disabling the verifier.
- INV-11: malformed-output goldens assert safe degradation; expected attributed STRONG_RED by bypassing schema validation.
- INV-13: harness asserts recorded generation inputs equal fixture facts; expected attributed STRONG_RED by injecting an extra enrichment field.

### Rollback notes
None — additive only (tests, fixtures, CI wiring); removing the harness reverts cleanly with no
runtime impact.

### Done criteria
Harness green in CI on the Slice 3 implementation; AC-15 satisfied; each suite documented so
new offer shapes get fixtures added as a checklist item.

## Slice 5: Run-history surfacing in the internal dashboard

### Scope
Surface OrchestrationRun records in the existing internal dashboard's run-history convention
(A6/OQ-9): run status (including crashed), counts (picked-up/drafted/deduped/failed), and
per-item failures rendering the stored sanitized message + cause code. Read-only over Slice 1
data; no new dashboard product. Depends on: Slices 1–2; independent of Slices 3–4.

### Allowed files
- src/internal-dashboard/run-history/
- tests/internal-dashboard/run-history/

### Forbidden files
- src/marketing-engine/
- db/migrations/
- config/scheduler/
- .env
- .env.*

### Invariants touched
- INV-9 (rendering side: only the stored sanitized message is ever displayed), INV-10
  (crashed/completed/never-ran distinguishable to the operator)

### Tests required
- Rendering test: seeded run with mixed item outcomes displays status, all four counts, and
  per-item sanitized messages (AC-16).
- Sanitization-at-render test: a run-history row seeded with hostile content (markup/script,
  oversize string) renders escaped and truncated — the dashboard never displays anything beyond
  the stored sanitized message field (AC-9 rendering half).
- Crash-visibility test: crashed run visually distinguishable from completed and from absence
  (AC-10 rendering half).

### Proof obligations
- INV-9: regression test "dashboard renders only the sanitized message field, escaped and bounded" with attributed STRONG_RED via regression-check.mjs (render raw error field → test fails).
- INV-10: regression test "crashed run distinguishable in the run-history view" with attributed STRONG_RED.

### Rollback notes
None — additive only; the dashboard section can be removed/hidden without affecting the job,
data, or queue.

### Done criteria
AC-16 green; founder can answer "what failed and why" for any seeded failure scenario from the
dashboard alone; no engine-side files changed.
