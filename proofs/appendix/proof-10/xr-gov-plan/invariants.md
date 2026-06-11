# Invariants

## Invariants

- INV-1 [L3] Generation, rendering, and publishing code paths must read athlete/source data
  only through the PublicSafeView allowlisted projection; internal evaluations, coaches'
  private notes, and athlete/parent contact information must never appear in any draft,
  rendered graphic, prompt sent to the model, or published post.
- INV-2 [L3] Every factual claim in a post draft (offer counts, commitment facts, rankings,
  standout stats) must be bound to at least one SourceRecord id plus its derivation; a draft
  containing an unbound factual claim must never receive a passing gate result.
- INV-3 [L3] No post may be delivered to Instagram or X without a recorded human Approval
  (approver identity + timestamp) attached to the exact draft revision being published; no
  system or scheduled principal can create an Approval. (Stands until OQ-1 is resolved by the
  user; relaxing it requires a new risk classification.)
- INV-4 [L3] A draft revision whose gate result is failed, missing, or stale (predates the
  revision) must never transition to approved, scheduled, or published.
- INV-5 [L3] Text formatted as a quotation attributed to a person must match a stored
  QuoteRecord verbatim (with source); otherwise the gate must fail the draft. The system must
  never publish an invented or paraphrased-as-verbatim quote.
- INV-6 [L3] Every numeric/factual claim must be re-verified against current SourceRecords at
  approval time; if the underlying data changed since generation, the draft must fail
  re-verification and return to the gate rather than publish a stale claim.
- INV-7 [L3] An athlete photo may be attached to a post only if a PhotoAsset exists for that
  athlete with a recorded public-marketing usage basis; absent that basis the post must render
  without the photo (or be blocked if the template requires one). (Basis taxonomy pending
  OQ-2; deny-by-default until resolved.)
- INV-8 [L3] Posts referencing an athlete below the configured grade-level floor (default:
  below 9th grade, i.e. all middle schoolers) must be blocked by the gate until OQ-3 is
  resolved by the user.
- INV-9 [L2] PostDraft state transitions may only follow the lifecycle graph in
  domain-model.md; in particular, any edit to copy, graphic, or claim bindings invalidates
  prior gate results and approvals for that draft.
- INV-10 [L2] Publishing is idempotent: for a given (PublishedPost, platform) pair the
  connector must deliver at most once; retries after ambiguous failures must reconcile against
  the platform before re-sending.
- INV-11 [L2] Every publish writes an immutable PublishedPost snapshot (final copy, graphic
  ref, claim bindings, approval ref, platform post id, time); retraction marks status but
  never deletes or mutates the snapshot.
- INV-12 [L2] The marketing engine must never write to platform source-of-truth tables
  (athletes, offers, commitments, rankings, coach activity); its database role/queries are
  read-only against them.
- INV-13 [L1] Rendered graphics must use only BrandKit fonts/colors/templates and only copy and
  fields that passed the gate for that draft revision (no rendering from raw entity data).
