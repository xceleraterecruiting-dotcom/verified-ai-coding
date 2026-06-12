# Domain model

## Entities

- **SignalEvent** — a detected post-worthy fact change (offer #N for athlete A, commitment,
  weekly top-performer selection). Unique per (type, athlete, triggering record); the dedupe
  anchor (INV-17). References the platform rows that triggered it.
- **SourceFactSnapshot** — immutable copy of the exact allowlisted field values supplied to a
  generation run (athlete name/position/school, offer list with school+date, ranking, camp
  result). Only allowlisted public-safe fields may enter a snapshot (INV-1, A4). The provenance
  anchor for "why it said that" (INV-2).
- **IdeaBankItem** — founder-curated evergreen topic/take with optional founder notes; the only
  permitted source for evergreen posts (A5).
- **GenerationRecord** — one model call: model id, prompt version id, run/trace id, input
  snapshot reference, raw-output reference (internal only), schema-validation result, decline
  flag + reason (INV-6, INV-11, INV-12).
- **PostDraft** — generated copy + claim list, each claim annotated with source references; owns
  the lifecycle state (below). One draft may have multiple versions; only the exact approved
  version is publishable.
- **ClaimVerification** — per-draft gate result: claim-by-claim match against the
  SourceFactSnapshot, private-data scan result, minors-eligibility check result; pass/fail with
  reasons (INV-2, INV-3, INV-8).
- **ApprovalDecision** — approver identity, timestamp, decision, exact draft version approved
  (INV-4, INV-14).
- **PhotoRightsRecord** — per (athlete, asset) recorded rights/consent basis; required before any
  likeness use (INV-7; semantics pending OQ-1).
- **RenderedGraphic** — branded image artifact for a draft version; records template, assets, and
  photo-rights references used.
- **PublishRecord** — per (approved draft version, platform account): external post id, payload
  hash, dry-run vs live, timestamp. Uniqueness enforces idempotency (INV-10).
- **BrandAccount** — IG/X account config; live-posting enablement flag (INV-9); credentials live
  in server-side secrets, referenced by name only (INV-15).
- **AuditEntry** — append-only chain linking PublishRecord → ApprovalDecision →
  ClaimVerification → GenerationRecord → SourceFactSnapshot (INV-14).

## States and transitions

PostDraft lifecycle (the only legal transitions — INV-16):

```
generated ──verification──▶ verified
generated ──verification──▶ verification_failed   (terminal, auditable)
generated ──schema fail──▶ rejected_generation     (terminal, INV-11)
(no draft) ◀──decline────  generator declines       (GenerationRecord only, INV-12)
verified ──human approve─▶ approved                 (ApprovalDecision recorded)
verified ──human reject──▶ rejected                 (terminal)
approved ──publisher─────▶ published                (once per account, INV-10)
approved ──human retract─▶ rejected                 (before publish only)
```

No transition skips verification or approval; `verification_failed` and `rejected_generation`
never become approvable or publishable (INV-5). SignalEvents are processed at most once into a
published post per platform (INV-17). All state writes append an AuditEntry.
