# Domain model

## Entities

- **VerifiedOffer** (existing, upstream-owned, read-only here): an athlete↔college offer record
  with a verification status. Fields consumed: stable offer identity (exact key = OQ-1),
  athlete name, athlete school, offering college, offer date (possibly messy/partial),
  verified flag, arrival timestamp. This plan never writes to it.
- **DraftPost** (existing queue entity, extended/inserted-into): a post awaiting human review.
  Created here only in the queue's pending-review state. Carries generated content and
  provenance links.
- **DraftOfferTrace** (new): join records linking one DraftPost to one or more source
  VerifiedOffers (many-to-many per A2/IN-2). With the dedupe ledger semantics, an offer
  identity may be auto-drafted at most once (INV-2; lifecycle nuance = OQ-1/OQ-2).
- **ModelCallRef** (existing convention): the model-call identifier returned by the existing
  pipeline, stored on the DraftPost per the engine's traceability convention (A5).
- **OrchestrationRun** (new): one execution of the scheduled job — started/finished times,
  outcome, and counts (created / skipped-duplicate / failed).
- **RunItemFailure** (new): one per-record failure inside a run — offer reference, failure
  category, sanitized human-readable message, internal correlation ID (never stack traces,
  secrets, or raw payload/model dumps).

## States and transitions

DraftPost (this feature exercises only the creation edge; later edges are existing behavior):

```
(none) --job creates, atomically with traces--> pending_review
pending_review --human approve/reject/edit--> (existing flow, out of scope)
```

OrchestrationRun:

```
running --> succeeded                 (no failures)
running --> succeeded_with_failures   (>=1 RunItemFailure, batch continued)
running --> failed                    (run-level abort; no partial drafts remain visible)
```

Per-offer processing outcome within a run (mutually exclusive):

```
eligible --> drafted            (draft + traces committed atomically)
eligible --> skipped_duplicate  (dedupe ledger hit; no write to queue)
eligible --> failed             (RunItemFailure recorded; batch continues)
```

The job never produces, touches, or transitions any published state.
