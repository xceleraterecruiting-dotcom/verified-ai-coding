# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its id.

- AC-1 (INV-1): Given a completed orchestration run that created drafts, every created draft is
  in pending-review state, and instrumentation/spies on the engine's publish/send surface show
  zero invocations originating from this feature's code paths.
- AC-2 (INV-2): Given an offer already drafted, running the job again (including a second run
  started while the first is still in flight against the same offer set) produces zero
  additional drafts for that offer; the later run records the item as `deduped`.
- AC-3 (INV-3): Given one athlete with two distinct verified offers (different colleges, or
  same college with distinct offer events per the OQ-1 resolution), one run produces exactly
  two drafts, one per offer.
- AC-4 (INV-4): Given a batch of N offers where one has an unparseable date, the run completes,
  N−1 drafts are produced, and the run history shows exactly one failed item with that offer's
  reference, a structured cause code, and a presentable message.
- AC-5 (INV-5): When generation or enqueue fails mid-item (fault injected at each step:
  generation, verification, provenance write, queue write), the review queue and provenance
  store contain nothing for that item and its dedupe key is not consumed.
- AC-6 (INV-6): Offers missing any required fact (athlete name, school, offering college, offer
  date — including the spec's "weird or partial dates") produce no draft; each is recorded as a
  failed/skipped item; no draft anywhere contains a defaulted or guessed value for these fields.
- AC-7 (INV-7): A draft whose generated text contains an athlete name, school, college, or date
  that does not match the source offer record is rejected by the post-generation verifier,
  recorded as a failed item, and absent from the queue — demonstrated with a seeded
  fabricated-output fixture.
- AC-8 (INV-8): Every enqueued draft, inspected via its stored references, resolves to: ≥1
  source offer id, a model-call record, a model id, a prompt version, and an orchestration run
  id. A draft fixture missing any one reference is refused at enqueue.
- AC-9 (INV-9): For a run whose item failed with an injected exception carrying a stack trace,
  prompt text, and a fake secret in its message, the stored run-history error contains none of
  these, is within the defined length bound, and carries a structured cause code.
- AC-10 (INV-10): Every job execution (success, partial failure, and a fault-injected mid-run
  crash) yields a run record; the crashed run is distinguishable in run history from completed
  runs and from never-ran, with whatever counts were durably recorded.
- AC-11 (INV-11): A model response violating the expected output schema (malformed structure,
  wrong types, empty content) results in a failed item with sanitized reason; nothing reaches
  the queue.
- AC-12 (INV-12): Offers in unverified, retracted, or unknown status present in the lookback
  window are never picked up into drafting; a status-mix fixture run drafts only the verified
  ones.
- AC-13 (INV-13): The recorded generation inputs (source facts) for any draft are exactly the
  public-fact fields of its source offer record(s); a test asserts the generator call payload
  contains no other athlete-related data.
- AC-14 (INV-14): An offer whose item failed on run 1 (transient fault) is picked up and
  successfully drafted on run 2; an offer drafted on run 1 is not.
- AC-15 (R14): The generator regression harness runs in CI with golden cases (fixed offer
  fixtures asserting expected-output properties) and adversarial cases (fixtures crafted to
  elicit fabrication, prompt/PII leakage, off-policy content), and fails the build on
  regression.
- AC-16 (R15): The internal dashboard's run-history view displays, for a seeded run, its
  status, counts (picked-up/drafted/deduped/failed), and per-item sanitized failure messages.
