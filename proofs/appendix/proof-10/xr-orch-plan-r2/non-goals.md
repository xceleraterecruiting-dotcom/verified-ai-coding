# Non-goals

## Non-goals

- Publishing, scheduling, or sending posts to any external/social surface — the spec ends at
  the review queue ("nothing posts by itself"). The existing publish path is untouched and
  forbidden to every slice.
- Changes to the review/approval UI or the approval workflow itself; this feature only inserts
  drafts into the existing queue.
- Changes to the existing model pipeline's internals (prompting strategy, model selection,
  generation quality work) beyond invoking it and consuming/confirming its trace record.
- Offer ingestion, feed parsing, or the offer *verification* process itself — this feature
  consumes already-verified offers; it does not decide what "verified" means.
- Bulk backfill of historical verified offers predating the feature's lookback window (A8).
  If wanted later, it is a separate slice with its own queue-flooding analysis.
- Measurement/analytics of draft quality, engagement, or learning loops — deferred phase, not
  planned here.
- Alerting/paging beyond the dashboard-visible run history (e.g. Slack/email notifications on
  failed runs) — surfaced as a possible future want, not requested.
- Multi-operator review queues, roles, or permissions — single-founder queue assumed (A5).
- Handling of offer retraction/un-verification after a draft exists is NOT silently excluded:
  it is open question OQ-3 (high) and blocks; it is listed here only to record that no slice
  currently implements it pending the founder's answer.
- New dashboard construction — run history must surface through the existing internal dashboard
  convention (A6), not a new UI product.
