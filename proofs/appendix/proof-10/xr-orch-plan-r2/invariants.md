# Invariants

## Invariants

All predicates are must-always/must-never and testable. Lens-derived items are marked.
Levels are per-invariant risk, not the plan's overall level.

- INV-1 [L2] No code path in this feature publishes, posts, or sends a draft externally: every
  draft it creates enters the review queue in pending-review state, and the feature's slices
  contain no write to any publish/send surface (enforced by forbidden-files plus a test that a
  freshly orchestrated draft is in pending-review and the publish path was never invoked).
- INV-2 [L2] Reprocessing an offer that already produced a draft creates no second draft: dedupe
  is enforced by an atomic storage-level uniqueness claim (unique constraint or equivalent),
  not check-then-insert, and holds under two concurrently overlapping runs processing the same
  offer.
- INV-3 [L2] Two distinct verified offers for the same athlete each produce their own draft: the
  dedupe key distinguishes offers, never collapses to athlete identity.
- INV-4 [L2] A failing record fails only its own run item: the run continues processing the
  remaining offers, and the item's failure (offer reference + structured cause code + sanitized
  message) is durably recorded in run history.
- INV-5 [L2] A draft and its provenance (source offer refs, model-call ref, run ref, dedupe-key
  consumption) become visible atomically or not at all: no failed item or crashed run leaves a
  partial draft, orphaned provenance, or a consumed key without a draft in the queue.
- INV-6 [L2] (lens-derived: AI-output #9) When any required source fact (athlete name, school,
  offering college, offer date) is missing or unparseable, the item is recorded as
  failed/skipped and no draft is generated — required facts are never defaulted, guessed, or
  silently dropped to let generation proceed.
- INV-7 [L2] (lens-derived: AI-output #6) Every factual claim in an enqueued draft (athlete
  name, school, offering college, offer date) matches the source verified-offer record,
  enforced by a post-generation programmatic verification step; a draft failing verification is
  recorded as a failed item and never enqueued. "We told the model not to fabricate" is not a
  control.
- INV-8 [L2] (lens-derived: AI-output #1–#4) Every enqueued draft carries resolvable references
  to: its source offer id(s), the model-call record, the model id, the prompt version, and the
  orchestration run id; a draft missing any of these never enters the queue. A bare model-call
  id satisfies this only if that record is confirmed to resolve to model id, prompt version,
  and source facts (OQ-6).
- INV-9 [L2] Stored run-history errors contain no stack traces, secrets, prompt text, or raw
  model output; each is a bounded-length presentable message plus a structured cause code,
  safe to render on the internal dashboard.
- INV-10 [L2] Every job execution produces a durable run record with start, end (or detectable
  crash state), and counts (picked-up, drafted, deduped, failed) plus per-item failures; a run
  that dies mid-way is distinguishable in run history from both success and never-ran.
- INV-11 [L2] (lens-derived: AI-output #11) Model output that fails structured-output/schema
  validation degrades to a recorded item failure; malformed output never reaches the review
  queue.
- INV-12 [L2] Only offers whose status is verified at pickup time produce drafts; unverified,
  retracted, or unknown-status offers never generate a draft.
- INV-13 [L2] (lens-derived: AI-output #4, IN-7) Generation input from the domain is exactly the
  public facts of the source verified-offer record(s); the orchestration supplies no athlete
  data from any other source to the generator.
- INV-14 [L2] A failed run item does not permanently consume its dedupe key: only successful
  atomic draft creation consumes the key, so a transiently failing offer remains drafted-exactly
  -once-eventually rather than lost.
