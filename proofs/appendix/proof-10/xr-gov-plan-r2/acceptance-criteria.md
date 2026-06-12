# Acceptance criteria

## Acceptance criteria

- AC-1 (INV-1): With a fixture athlete whose row contains a seeded private-note canary string and
  parent contact info, the full pipeline (snapshot → generation → verification → render →
  dry-run publish) never emits the canary or contact values in any artifact; the verification
  private-data scan independently catches a draft into which the canary is injected.
- AC-2 (INV-2): For every verified draft, each factual claim is annotated with source references;
  a "why it said that" view resolves the spec's example ("12 offers") to the twelve offer rows
  and snapshot timestamp. A claim with a dangling reference fails verification.
- AC-3 (INV-3): An adversarial fixture where the model output asserts an offer count one higher
  than the snapshot is blocked from `verified`; the mismatch is recorded claim-by-claim. Same for
  an invented quote (IN-4: quotes must match a source verbatim).
- AC-4 (INV-4): The publish entry point rejects any request lacking a matching ApprovalDecision
  for the exact draft version; a scheduler-originated draft cannot reach the publisher without a
  human approval row. Code search confirms no second publish entry point exists.
- AC-5 (INV-5): A draft in `verification_failed` (or with no ClaimVerification) with a forged
  approval row attached is refused by the publisher and the state machine.
- AC-6 (INV-6): 100% of GenerationRecords in test runs contain non-null model id, prompt version
  id, run/trace id, and input snapshot reference; a generation write missing any of these is
  rejected at the persistence layer.
- AC-7 (INV-7): Rendering a graphic for an athlete with no PhotoRightsRecord produces a
  no-likeness variant (or a recorded skip); the photo never appears. With a rights record, the
  photo is used and the record id is captured on the RenderedGraphic.
- AC-8 (INV-8): An athlete below the OQ-3 floor — and an athlete with unknown age/grade — never
  produces a SignalEvent or draft; the exclusion is logged with reason.
- AC-9 (INV-9): A freshly configured BrandAccount is dry-run-only; dry-run publish logs the full
  payload and a network assertion shows zero external calls. Live mode requires an explicit
  enablement write that is itself audited.
- AC-10 (INV-10): Publishing the same approved draft version twice to the same account performs
  one external call; the second attempt is a recorded no-op. Concurrent double-submit yields one
  PublishRecord (uniqueness constraint, not application luck).
- AC-11 (INV-11): A malformed/truncated model response (broken JSON, missing required fields,
  wrong types) moves the draft to `rejected_generation`; no partial content is stored as a
  reviewable draft.
- AC-12 (INV-12): A generation request whose snapshot lacks required facts (e.g. top-performer
  card with no performance rows) produces a recorded decline and no draft text.
- AC-13 (INV-13): Published payloads and review-UI-visible draft fields contain no prompt text,
  no raw model envelope, and no stack traces; internal provenance fields are confined to the
  designated review-UI provenance panel.
- AC-14 (INV-14): For any published post in a test run, a single audit query reconstructs the
  chain publish → approval → verification → generation → snapshot; attempts to UPDATE or DELETE
  an AuditEntry through application code paths fail.
- AC-15 (INV-15): Repo scan and built client bundles contain no platform tokens; credentials
  resolve only from server-side secret storage at publish time; logs in test runs contain no
  token material.
- AC-16 (INV-16): Each illegal transition (generated→approved, generated→published,
  verification_failed→approved, rejected→published, etc.) is rejected at the persistence layer
  with a test per forbidden edge.
- AC-17 (INV-17): Re-running signal detection over unchanged data creates no new SignalEvent;
  a second draft/publish for an already-published SignalEvent on the same platform is refused.
- AC-18 (R2/OQ-5): Evergreen drafts are generated only from IdeaBankItems; the founder reviews a
  calibration set of evergreen drafts and the accepted voice prompt version is recorded
  (manual gate; mechanics finalized when OQ-5 is answered).
- AC-19 (R12): The golden + adversarial generator harness runs in CI on fixed fixtures; any
  golden property failure or adversarial leak blocks merge.
- AC-20 (R6): Review queue supports approve / reject / light-edit-then-reverify in one screen;
  an edited draft re-enters verification before it is approvable (INV-16, INV-3).
