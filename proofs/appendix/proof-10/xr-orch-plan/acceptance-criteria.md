# Acceptance criteria

## Acceptance criteria

- AC-1 (INV-1): Every draft created by the job is observable in the queue in the pending-review,
  unpublished state; a test that runs a full successful job pass asserts zero drafts in any
  published/scheduled state, and a red-team test confirms the job module exposes/imports no
  publish capability (compile-time or call-graph assertion, per the real repo's structure).
- AC-2 (INV-2): Running the job twice over the same set of verified offers — including two
  overlapping/concurrent runs and a re-delivered identical feed batch — yields exactly one
  draft per offer identity; the second encounter is recorded as skipped-duplicate in run
  history. Includes a process-restart case (ledger is durable, not in-memory).
- AC-3 (INV-3): When draft creation fails mid-write (fault injection between content write and
  trace write), the queue contains no partial draft afterward and the run record shows the
  failure; no orphan trace rows or trace-less drafts exist after the test.
- AC-4 (INV-4): For every draft the job creates, the stored record links at least one source
  offer ID and a non-empty model-call ID; a test that forces the pipeline to return no
  model-call ID asserts the draft is not enqueued and the record is reported as failed.
- AC-5 (INV-5): For each failure category (bad date, pipeline error, write error), the stored
  error text matches the sanitization allowlist; tests inject an exception whose message
  contains a fake secret, a stack trace, and a raw payload blob, and assert none of those
  substrings appear anywhere in stored run history.
- AC-6 (INV-6): A batch of N offers containing K malformed records completes with N−K drafts
  created and exactly K RunItemFailure records, each carrying the offer reference and a
  category/reason — the batch never aborts on a per-record failure.
- AC-7 (INV-7): Given an offer whose date is unparseable or contradictory, no draft is created
  for it (record fails, visible in run history) and no draft anywhere contains a date not
  literally derivable from the source offer; given a truthful partial date, output follows the
  OQ-4 policy at the known precision only.
- AC-8 (INV-8): Every scheduled execution — including one that finds zero eligible offers —
  produces exactly one run-history record with start/finish, outcome, and created /
  skipped-duplicate / failed counts that sum to the number of offers considered.
- AC-9 (INV-9): Offers with non-verified status are never selected and never drafted (test
  seeds verified + unverified offers, asserts drafts exist only for verified ones); the
  generation request payload is asserted to contain only the four named public facts and no
  other offer/athlete fields.
- AC-10 (R11): The internal dashboard renders the run-history list (runs with outcome and
  counts) and per-run failure details (sanitized message, category, offer reference),
  read-only, behind the existing internal auth (cites INV-5 for content shown).
- AC-11 (R1): The job is registered on a recurring schedule and an end-to-end pass (seeded
  verified offers → scheduled tick → drafts in queue + run record) succeeds in a staging-like
  environment before ship.
