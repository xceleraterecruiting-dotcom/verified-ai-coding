# Non-goals

## Non-goals

- Publishing, scheduling, or auto-posting content anywhere. The job creates drafts only;
  approval and posting remain the existing human-gated flow ("nothing posts by itself").
- Changes to the review queue UI, the approval workflow, or draft editing.
- Offer ingestion or verification. Offers and their "verified" status arrive from existing
  upstream feeds; this plan consumes them read-only (A1).
- Model pipeline internals: prompt design, content quality tuning, model selection, or any
  change inside the existing pipeline. We call its existing interface only (A5).
- Backfill of historical offers that predate this feature. The job processes "recent" offers;
  a one-time backfill, if wanted, is a separate decision (relates to OQ-5).
- Updating or regenerating a draft when its source offer's facts change upstream — explicitly
  deferred until OQ-2 is answered; the initial build neither updates nor flags existing drafts.
- Grouped multi-offer drafts (one post covering an athlete's burst of offers) — deferred until
  OQ-3 is answered; initial build is one draft per offer (A2), with a trace schema that does
  not preclude grouping later.
- Alerting/paging on failed runs, retry/backoff policies beyond the natural next scheduled
  run, and run-history retention/archival policy.
- Dashboard redesign or new dashboard auth. Run history is a read-only addition to the
  existing internal dashboard (A6).
- Metrics, engagement measurement, or any learning loop on draft performance.
- Multi-operator review queues, assignment, or permissions changes (single-operator queue is
  the current reality per the spec's "my review queue").
