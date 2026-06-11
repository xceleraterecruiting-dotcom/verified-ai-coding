# Domain model

## Entities

- **Athlete** *(existing platform data, read-only to the engine)* — identity, grad year /
  grade level, school, sport/position, photo assets. The engine consumes a restricted
  projection of this entity (see PublicSafeView), never the raw row.
- **SourceRecord** *(existing, read-only)* — offers, commitments, rankings, camp standouts,
  coach activity events. Each has a stable id; these ids are what claims bind to.
- **PrivateMaterial** *(existing, read-only, NEVER readable by the engine)* — internal
  evaluations, coaches' private notes, athlete/parent contact info. Exists in the model only to
  name what the boundary excludes.
- **PublicSafeView** — the explicit allowlisted projection (per entity type) that generation and
  rendering are permitted to read. Deny-by-default: a field is public-safe only if listed.
- **IdeaBankEntry** — founder-curated topic/take/educational seed for evergreen posts; includes
  status (active/retired) and optional reference notes.
- **VoiceSample** — founder-approved writing sample used to condition evergreen copy style.
- **PostDraft** — a candidate post: kind (signal | evergreen), target platform(s), copy,
  graphic template + rendered asset ref, claim bindings, gate result, lifecycle state.
- **Claim** — a factual assertion extracted from/embedded in a draft (e.g. "12 offers"), bound
  to one or more SourceRecord ids plus the computation that derived the value (e.g.
  count(offers where athlete=X)). Unbound claims are gate failures.
- **QuoteRecord** — a verbatim quote with speaker and source provenance; the only legal basis
  for quotation-formatted text in a post.
- **PhotoAsset** — an athlete photo plus its usage-rights/consent basis flag (basis taxonomy
  pending OQ-2).
- **GateResult** — outcome of the automated safety gate for a draft revision: per-check results
  (private-data scan, claim verification, quote verification, minor-protection rules,
  platform-policy checklist), overall pass/fail, timestamps.
- **Approval** — a human decision on a gated draft: approver identity, decision
  (approve/reject/edit-and-approve), timestamp, the exact draft revision approved.
- **ScheduledRun** — a configured generation job (cadence, post kind, signal triggers) that
  produces PostDrafts only.
- **PublishedPost** — immutable snapshot at publish: final copy, graphic, claim bindings,
  approval ref, platform, platform post id, publish time; plus retraction status. Reserved
  (empty for now) metrics fields per R17.
- **BrandKit** — fonts, colors, logo refs, graphic templates.

## States and transitions

PostDraft lifecycle (the only path to publication):

```
generated → gated:passed → approved → scheduled → published
         ↘ gated:failed → (revise → re-gate) or discarded
approved/scheduled → withdrawn (human pulls it back before publish)
published → retracted (deleted on platform, snapshot retained)
```

Transition rules:

- Every edit to copy/graphic/claims creates a new draft revision that re-enters `generated`
  and must re-pass the gate; approvals attach to a specific revision and do not carry over.
- `gated:failed` can never transition to `approved` or beyond.
- `approved` requires a recorded Approval by a human; there is no system principal that can
  approve (per INV-3, pending OQ-1).
- `published` is reached only from `scheduled` (or directly from `approved` for immediate
  publish) via the connector, which enforces once-per-platform idempotency.
- `retracted` is terminal for the platform copy but the PublishedPost snapshot is never deleted
  (audit, R14).

GateResult is per draft revision and is consumed exactly once by the approval step; a stale
gate result (older than the revision) counts as no gate result.
