# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV id.

- AC-1 (INV-1, INV-12): Given a seeded database containing private material (internal
  evaluation text, a coach's private note, athlete and parent phone/email), generating any
  signal or evergreen draft produces copy, prompts, and rendered graphics containing none of the
  seeded private strings; an automated scan of the model prompt log and draft store finds zero
  occurrences. The engine's DB role fails (permission error) on any INSERT/UPDATE/DELETE against
  athletes/offers/commitments/rankings tables.
- AC-2 (INV-2): Generating a signal post that states "his 4th offer" stores a Claim bound to the
  four offer SourceRecord ids and the count derivation; the per-post provenance view renders
  each claim with its source records. A draft hand-crafted with an unbound numeric claim
  receives gate result = failed with reason `unbound-claim`.
- AC-3 (INV-3): Attempting to publish a draft with no Approval (via API, connector call, or
  scheduled job) is rejected and no platform API call is made; publishing succeeds only after a
  human approval is recorded, and the PublishedPost references that approver and timestamp.
  There exists no code path or configuration in this release that publishes without an Approval
  row (verified by a red-team test that exercises the scheduler end-to-end).
- AC-4 (INV-4, INV-9): A draft with gate result = failed cannot be approved (UI control absent
  AND server rejects a forged approval request). Editing an approved draft's copy moves it back
  to `generated`, voids the prior gate result and approval, and the server rejects publishing it
  until it re-passes the gate and is re-approved.
- AC-5 (INV-5): A draft whose copy contains quotation-attributed text matching no QuoteRecord
  fails the gate with reason `unverified-quote`; the identical text backed by a verbatim
  QuoteRecord passes. A near-match (paraphrase) also fails.
- AC-6 (INV-6): After a draft is generated claiming "12 offers", deleting one offer record and
  then attempting approval triggers re-verification failure; the draft returns to the gate and
  cannot be published with the stale number.
- AC-7 (INV-7): For an athlete with a photo lacking a recorded usage basis, the generated post
  renders without the photo (text/graphic-only variant) or is blocked if the template requires
  a photo; with the basis flag set, the photo attaches. No code path attaches a photo whose
  basis flag is unset.
- AC-8 (INV-8): A signal trigger for a middle-school athlete (below the configured grade floor)
  produces a draft that the gate blocks with reason `minor-floor`, and it cannot be approved;
  raising the configured floor is an admin action that is audit-logged.
- AC-9 (INV-10, INV-11): Forcing a timeout after the platform accepted a publish, then retrying,
  results in exactly one live platform post (connector reconciles before re-send). Every publish
  writes a PublishedPost snapshot; retracting deletes the platform post, sets retraction status,
  and leaves the snapshot byte-identical.
- AC-10 (INV-13): Rendered graphics for a gated draft use only BrandKit fonts/colors/templates
  and only the gated copy/fields; a rendering request for an un-gated draft revision is
  rejected.
- AC-11 (R3): Evergreen drafts are generated with the founder's VoiceSamples in the prompt
  context; with zero active voice samples, evergreen generation refuses with an actionable
  error rather than producing generic-voice copy.
- AC-12 (R11, R12): A scheduled run produces drafts (never publishes — see AC-3); the review
  queue supports approving or rejecting at least 10 gated drafts in a single screen session
  with per-draft one-click decisions and inline edit (edit triggers re-gate per AC-4).
- AC-13 (R13): Publishing uses the official Instagram and X APIs; scheduling an approved post
  publishes it within the configured window; deleting/retracting removes it from the platform.
- AC-14 (R14, R17): The audit view for any published post shows final copy, graphic, every
  claim with sources, approver, publish time, and platform post id; the PublishedPost schema
  includes reserved nullable metrics fields that are unused in this release.
