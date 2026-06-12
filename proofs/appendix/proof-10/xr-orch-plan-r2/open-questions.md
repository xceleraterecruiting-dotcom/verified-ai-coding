# Open questions

## Open questions

High severity = the answer changes an invariant, a publishing/data-integrity behavior, or slice
boundaries. The three high-severity items below are deliberately left open: resolving them
needs the founder/engine facts, and silently picking the convenient reading is the failure
class this process exists to prevent. The plan is BLOCKED until they are answered.

- OQ-1 [severity: high] [status: open] What is the durable identity of an offer for dedupe
  purposes? Specifically: (a) does the verified-offers store guarantee a stable unique id per
  real-world offer, or can feeds materialize the same real-world offer as multiple rows (e.g.
  re-delivery with a corrected date)? (b) If multiple rows are possible, what natural key
  (athlete + offering college + normalized date? athlete + college regardless of date?) defines
  "the same offer" for the must-never-duplicate rule? The answer defines INV-2/INV-3's dedupe
  key and the Slice 1 schema, and a wrong guess either floods the queue ("flooding my queue
  with duplicates") or suppresses real offers ("a kid often has several offers").
- OQ-2 [severity: high] [status: open] The drafts name real athletes — in this domain, very
  likely minors — and are destined (post-approval) for public posting. What minors'/likeness/
  rights/eligibility control applies (AI-output lens #14)? Is there an existing engine check
  (consent flag, eligibility list, policy gate) the orchestration must consult before drafting
  about an athlete, or is the founder's manual review the sole control? The answer determines
  whether a new invariant (and possibly an L3 escalation of the generation area per risk-map)
  is required.
- OQ-3 [severity: high] [status: open] Can an offer be retracted/un-verified after a draft was
  created from it, and if so what must happen to a still-pending draft in the queue (withdraw,
  flag, leave for manual review)? The spec is silent; the answer adds or excludes an invariant
  and possibly a slice (a stale draft asserting a retracted offer about a minor is a publishing
  -integrity risk even with human review).
- OQ-4 [severity: medium] [status: open] Confirm one-draft-per-offer (A2/IN-1) over aggregating
  an athlete's burst of simultaneous offers into one combined draft — the spec says "a draft
  post for each one" but also "the offer(s) it came from" (plural). Provenance is modeled
  many-to-many so the schema survives either answer; generation and dedupe behavior differ.
- OQ-5 [severity: medium] [status: open] What lookback window defines "recent verified offers"
  (and is there a verified-at timestamp to window on)? Correctness does not depend on it
  (dedupe is the guarantee) but queue noise after downtime and missed late-arriving offers do.
- OQ-6 [severity: medium] [status: open] Does the existing model pipeline's call record resolve
  to model id, prompt version, and the exact inputs given (AI-output lens #1–#4)? The
  requirement (INV-8) stands regardless; the answer only moves work — if the record lacks
  prompt version or inputs, Slice 3 must store them alongside the draft provenance itself.
  Severity medium because the invariant and slice boundary are written to absorb either answer.
- OQ-7 [severity: medium] [status: open] When the offer date is unparseable but all other facts
  are present, is a deliberately date-less draft acceptable, or skip entirely? Lens-derived
  default adopted meanwhile (A3): fail closed — skip and record, never guess or omit-and-pad.
- OQ-8 [severity: medium] [status: open] Retry policy for failed items: retried on every
  subsequent run within the window (A4 default)? Should permanently-bad records be parked after
  N failures so run history is not flooded with the same failure every few minutes?
- OQ-9 [severity: low] [status: open] What are the existing review-queue entry contract and the
  internal dashboard's run-history rendering convention (fields, message length budget)?
  Needed to size INV-9's bound and Slice 5's integration; to be confirmed at slice Step 0.
- OQ-10 [severity: medium] [status: open] Real file layout of the marketing engine: slice
  allowed/forbidden lists use placeholder paths (`src/marketing-engine/…`, A7) and must be
  re-grounded against the actual repo at each slice's verified-implementation Step 0 before
  being used as gates — in particular the true location of the publish/send surface, which
  every slice forbids (INV-1).
