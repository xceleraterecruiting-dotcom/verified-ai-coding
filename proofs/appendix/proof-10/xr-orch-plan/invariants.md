# Invariants

## Invariants

- INV-1 [L2] The orchestration job must never publish, schedule, or post content: every draft it creates enters the review queue in the pending-review (unpublished) state, and the job's code path has no capability to set any published/scheduled state.
- INV-2 [L2] For a given offer identity (key per OQ-1), the job must never auto-create more than one draft, across overlapping runs, retries, process restarts, and feed re-delivery — at-most-once draft creation enforced by a persistent dedupe ledger, not by run timing.
- INV-3 [L2] A failed run or failed record must never leave a partially written draft visible in the review queue: a draft and its offer-trace and model-call provenance commit in one atomic unit per offer, or nothing is written for that offer.
- INV-4 [L2] Every auto-created draft must carry complete provenance — at least one source offer reference and the model-call ID that generated it — before it becomes visible in the queue; a draft missing either must never be enqueued.
- INV-5 [L2] Stored run-history and failure text must never contain stack traces, secrets/credentials/connection strings, raw upstream payload dumps, or raw model output; only a sanitized human-readable message, a failure category, an offer reference, and an internal correlation ID.
- INV-6 [L1] One bad offer record must never abort processing of the other offers in the same run; each per-record failure is recorded in run history with the offer reference and the reason.
- INV-7 [L2] A draft must never contain a fabricated, guessed, or silently coerced offer date; a date the parser cannot truthfully represent fails that record per policy (A3/OQ-4) instead of being approximated.
- INV-8 [L1] Every scheduled run writes exactly one run-history record with start/finish times, outcome, and counts of created / skipped-duplicate / failed — including runs that process zero offers.
- INV-9 [L2] The job must only generate drafts from offers whose status is verified, and must use only the named public facts (athlete name, school, offering college, offer date) as generation input; unverified offers are never drafted.
