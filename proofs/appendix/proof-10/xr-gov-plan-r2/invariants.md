# Invariants

## Invariants

- INV-1 [L3] No value from private/internal fields (internal evaluations, private coach notes, athlete or parent contact info) may appear in any source-fact snapshot, generated copy, rendered graphic, or published payload; an automated allowlist at extraction plus a private-data scan at verification enforce this — a prompt instruction is not the control.
- INV-2 [L3] Every factual claim in a post draft (offer counts, commitments, rankings, performance stats, quotes, school/coach/person facts) must resolve to a stored SourceFactSnapshot entry with record reference and timestamp; a claim with no resolvable source fails verification and blocks the draft.
- INV-3 [L3] A draft containing a claim the verification gate cannot match to its source facts — a fabricated stat, quote, offer, ranking, school, coach, or person fact — must never reach approved or published state.
- INV-4 [L3] Every publish to an external platform requires a recorded human ApprovalDecision (approver identity, timestamp, exact approved draft version); no code path — including the scheduler — publishes without one.
- INV-5 [L3] A draft whose verification status is failed, pending, or absent must never be publishable, even if an approval record exists for it.
- INV-6 [L2] Every generation run records model id, prompt version id, run/trace id, and a reference to the exact SourceFactSnapshot or IdeaBankItem supplied to the model.
- INV-7 [L3] An athlete photo or likeness may be used in a rendered graphic only when a PhotoRightsRecord exists for that athlete and asset; absent or unknown rights basis fails closed (render without likeness, or skip the graphic).
- INV-8 [L3] Athletes failing the minors-eligibility policy (age/grade floor per OQ-3) are excluded from signal detection and generation entirely; unknown age/grade fails closed (excluded).
- INV-9 [L2] The publisher is dry-run-first: dry-run renders and logs the full payload with zero external calls, and live posting requires explicit per-BrandAccount enablement that defaults to off.
- INV-10 [L2] Publishing is idempotent: the same approved draft version is published at most once per platform account; retries and replays are no-ops recorded in the audit trail.
- INV-11 [L2] Model output that fails structured-output schema validation moves the draft to rejected_generation; it is never permissively parsed, truncated into shape, or passed downstream.
- INV-12 [L2] When source facts are insufficient for a requested post, the generator declines and records the decline with a reason; it never pads with plausible content.
- INV-13 [L2] Raw prompts, raw model output, and stack/system internals never appear in published payloads or on user-visible surfaces outside the review UI's designated internal-provenance fields.
- INV-14 [L2] An append-only audit trail links every published post to its ApprovalDecision, ClaimVerification, GenerationRecord, and SourceFactSnapshot; audit entries are never updated or deleted by application code.
- INV-15 [L2] Brand-account platform credentials exist only in server-side secret storage, referenced by name; never in client bundles, repo files, database rows, or logs.
- INV-16 [L2] PostDrafts move only through the legal transitions defined in domain-model.md; transitions that skip verification or approval, or that revive a terminal state, are rejected at the persistence layer.
- INV-17 [L2] At most one published post per SignalEvent per platform account; re-detection of the same underlying signal is a no-op (dedupe keyed on the SignalEvent uniqueness constraint).
