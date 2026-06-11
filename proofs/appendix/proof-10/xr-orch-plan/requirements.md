# Requirements

## Requirements

- R1: A scheduled job runs every few minutes and selects recently arrived offers whose status
  is verified. (Spec: "a scheduled job picks up recent verified offers"; "the job will run
  every few minutes".)
- R2: For each eligible offer, the job extracts exactly the public facts: athlete name,
  athlete's school, offering college, offer date. (Spec: "pulls the public facts (athlete
  name, school, the offering college, offer date)".)
- R3: For each eligible offer, the job generates one draft post by invoking the engine's
  existing model pipeline. (Spec: "the system should automatically produce a draft post for
  each one"; "generates the draft through our existing model pipeline".)
- R4: Each generated draft is inserted into the founder's review queue in a pending-review,
  unpublished state; the job has no capability to publish. (Spec: "put it in my review queue";
  "Drafts wait in the queue for me — nothing posts by itself".)
- R5: Re-encountering an offer that already produced a draft must not create a duplicate
  draft, across overlapping runs, retries, restarts, and feed re-delivery. (Spec: "it has to
  cope with seeing the same offers again without flooding my queue with duplicates of drafts
  it already made".)
- R6: A malformed or unprocessable offer record (e.g. weird/partial date) fails individually:
  the run continues with the remaining offers. (Spec: "Offer data is sometimes messy"; "If a
  run hits a bad record I don't want the whole batch dying silently".)
- R7: Every run writes a run-history record including, per failed record, what failed and why.
  (Spec: "I want to see what failed and why in the run history".)
- R8: A failed run or failed record never leaves partially written drafts visible in the
  review queue: draft + trace links commit atomically per offer or not at all. (Spec: "a
  failed run shouldn't leave half-written junk in the queue".)
- R9: Stored error text is presentable for internal-dashboard rendering: sanitized,
  human-readable, no stack traces / secrets / raw payload or model dumps. (Spec: "Keep
  whatever errors we store presentable; the run history shows up in our internal dashboard".)
- R10: Every draft records provenance: the source offer ID(s) and the model-call ID that
  produced it, per the engine's existing traceability convention. (Spec: "Every draft should
  trace back to the offer(s) it came from and the model call that wrote it, same as the rest
  of the engine".)
- R11: Run history is visible in the existing internal dashboard. (Spec: "the run history
  shows up in our internal dashboard".)
- R12: An offer date that cannot be truthfully represented is never guessed or fabricated in a
  draft; such records are handled per the date policy (fail the record; partial-precision
  handling pending OQ-4). (Derived from R2 + R6: "feeds give us weird or partial dates" and
  the public-output destination of drafts; see IN-6.)
