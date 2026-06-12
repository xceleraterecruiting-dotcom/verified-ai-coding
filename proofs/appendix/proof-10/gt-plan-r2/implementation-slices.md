# Implementation slices

Greenfield TypeScript repo. Proposed layout: `src/<area>/`, `tests/<area>/`, `db/migrations/`.
Each slice = one `verified-implementation` run = one `ship-review`. Dependency graph is acyclic:
S1, S2 → S3 → S4 → {S5, S6} → S7 → S8. NOTE: Slices 3 onward cannot finalize per-source ACL
semantics, staleness bounds, or gate thresholds until OQ-1/OQ-2/OQ-3 resolve — the plan is BLOCKED
on those; slice contents below are otherwise buildable from this plan alone.

## Slice 1: Canonical ACL model and fail-closed permission normalization

### Scope
Define the canonical PermissionGrant model and the per-source-system normalization layer that maps
heterogeneous raw permission metadata (owner/teams/roles, varying by source) into canonical
grants. Missing/unparseable/unrecognized metadata quarantines the document as most-restricted and
excludes it from indexing, with a human remediation queue. Mapping *content* per source system is
parameterized and lands only after OQ-1 resolves; this slice builds the mechanism and the
fail-closed default. Depends on: none.

### Allowed files
- src/acl/
- tests/acl/
- db/migrations/0001_documents_acl.sql
- db/migrations/0002_quarantine.sql

### Forbidden files
- src/retrieval/
- src/identity/
- src/answer/
- src/evals/
- src/dashboard/

### Invariants touched
- INV-3

### Tests required
- Unit: each recognized source-schema fixture maps to expected canonical grants; property test that
  no normalization path emits a grant broader than its raw input.
- Integration: AC-3 fixtures (absent, malformed, unknown-schema metadata) all quarantine; quarantined
  docs produce zero grants and are flagged for remediation.
- Negative: a new/unknown source system id added to fixtures lands in quarantine, not default-open.

### Proof obligations
- INV-3: regression test `tests/acl/fail-closed-quarantine.spec.ts` proving absent/malformed/unknown permission metadata yields most-restricted quarantine and never a readable grant; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
Additive (new tables + module); revert the migration pair and module. No external consumers yet.

### Done criteria
AC-3 passes; mapping mechanism accepts per-source mapping configs versioned with an
acl-mapping-version identifier (consumed later by INV-11); remediation queue lists quarantined docs.

## Slice 2: Provider-attested identity and entitlement resolution

### Scope
Authenticate requests via the company IdP/SSO (provider pending OQ-3) and resolve the principal's
EntitlementSnapshot (teams/roles/exec groups) from the authoritative directory with a configured
staleness bound and fail-closed behavior on resolver failure. No client-supplied identity or
entitlement fields are ever honored. Depends on: none.

### Allowed files
- src/identity/
- tests/identity/
- db/migrations/0003_entitlement_snapshots.sql

### Forbidden files
- src/acl/
- src/retrieval/
- src/answer/
- src/evals/
- src/dashboard/

### Invariants touched
- INV-14
- INV-6

### Tests required
- Unit: token verification rejects forged/expired/absent assertions; request-body teams/roles are
  ignored (AC-14).
- Integration: directory fixture membership change is reflected within the staleness bound (AC-6);
  resolver outage → denial, never cached-broad fallback.

### Proof obligations
- INV-14: regression test `tests/identity/attested-only.spec.ts` proving forged/absent IdP assertions are rejected and client-supplied entitlements are ignored; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-6: regression test `tests/identity/entitlement-freshness.spec.ts` proving revoked membership stops granting within the bound and resolver failure denies; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
Additive module; revert module + migration. Feature-flag the auth middleware off only in non-prod.

### Done criteria
AC-14 and AC-6 pass; EntitlementSnapshot persisted with resolved-at timestamp and referenced by id.

## Slice 3: Permission-filtered retrieval with non-existence semantics

### Scope
Chunking, embedding, and indexing of normalized documents with denormalized ACLs on chunks;
query-time retrieval (vector + lexical) that applies the principal's EntitlementSnapshot as a
filter AT or BEFORE search so unauthorized chunks never appear in candidates; reindex/purge on ACL
change or deletion. Empty-after-filter results are shape-identical to no-match results. Depends
on: Slice 1, Slice 2.

### Allowed files
- src/retrieval/
- tests/retrieval/
- db/migrations/0004_chunks_embeddings.sql

### Forbidden files
- src/acl/
- src/identity/
- src/answer/
- src/evals/
- src/dashboard/

### Invariants touched
- INV-1
- INV-2

### Tests required
- Integration: AC-1 (max-similarity unauthorized doc never in retrieval set or prompt-context log).
- Snapshot: AC-2 retrieval-layer portion (empty-after-filter vs truly-empty are identical shapes).
- Lifecycle: ACL tightened upstream → reindex removes chunks from the now-unauthorized audience;
  deleted doc → chunks and vectors purged.
- Property: for random principals/corpora, every returned chunk's ACL ⊇ check passes against the
  snapshot used for the query.

### Proof obligations
- INV-1: regression test `tests/retrieval/acl-filter-at-search.spec.ts` proving an unauthorized maximally-similar document never enters candidates, retrieval set, or prompt context; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-2: regression test `tests/retrieval/nonexistence-shape.spec.ts` proving empty-after-filter and no-match responses are indistinguishable at the retrieval layer; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
Additive (index tables + retrieval module); revert migration + module. Reindex is idempotent, so
re-running after rollback/redeploy is safe.

### Done criteria
AC-1 passes; retrieval-layer half of AC-2 passes; property test green over seeded random corpora.

## Slice 4: Grounded answer generation — citations, verified decline, surface hygiene

### Scope
Generation pipeline via the existing gateway: build prompt context exclusively from the ACL-filtered
RetrievalSet, produce either a cited answer or a decline; output-side verification rejects answers
whose claims are unsupported by the retrieved passages or whose citations point outside the
RetrievalSet (regenerate or decline); structured-output validation on the model response; generic
safe failure on any internal error; response shape for "nothing answerable" identical regardless of
whether the cause was no-match or ACL-filtered-to-empty. Depends on: Slice 3.

### Allowed files
- src/answer/
- tests/answer/

### Forbidden files
- src/acl/
- src/identity/
- src/retrieval/
- src/evals/
- src/dashboard/

### Invariants touched
- INV-4
- INV-5
- INV-2
- INV-8

### Tests required
- Unit: citation validator rejects ids outside the RetrievalSet (AC-4); malformed/structured-output
  failures degrade to decline or safe failure, never pass-through.
- Integration: AC-5 ablation (decline enforced with the instruction removed); AC-8 fault injection
  (gateway 500, malformed output) renders generic safe message with no prompt/stack leakage.
- Snapshot: AC-2 end-to-end portion — unauthorized-topic question and nonexistent-topic question
  render identically.

### Proof obligations
- INV-4: regression test `tests/answer/citation-in-retrieval-set.spec.ts` proving fabricated/out-of-set citations are never rendered; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-5: regression test `tests/answer/verified-decline-ablation.spec.ts` proving unsupported answers are converted to declines by output verification even without the prompt instruction; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-2: regression test `tests/answer/nonexistence-end-to-end.spec.ts` proving rendered responses for unauthorized vs nonexistent topics are indistinguishable; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-8: regression test `tests/answer/surface-hygiene.spec.ts` proving fault injection never surfaces system prompts, raw model errors, or stack detail; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
Additive module behind a serving feature flag (assistant disabled = honest degraded state); revert
module to roll back.

### Done criteria
AC-4, AC-5, AC-8 pass; AC-2 passes end to end; every answer/decline references its RetrievalSet.

## Slice 5: Generation traceability and access-decision audit trail

### Scope
Persist the GenerationRecord (model id, prompt version, run/trace id, exact source passages) for
every answer, enforced at the write path; persist the per-query AuditEvent (principal, entitlement
snapshot ref, considered/filtered docs, outcome, generation record ref); restrict audit storage
access so the trail cannot leak restricted content. Depends on: Slice 4.

### Allowed files
- src/trace/
- tests/trace/
- db/migrations/0005_generation_audit.sql

### Forbidden files
- src/acl/
- src/identity/
- src/retrieval/
- src/answer/
- src/evals/
- src/dashboard/

### Invariants touched
- INV-7
- INV-15

### Tests required
- Schema/write-path: an answer cannot persist without model id, prompt version, trace id, source
  passages (AC-7).
- End-to-end: every test query yields exactly one complete AuditEvent (AC-15).
- ACL: unauthorized read of the audit store is denied (AC-15).

### Proof obligations
- INV-7: regression test `tests/trace/generation-record-complete.spec.ts` proving answers cannot persist without model id, prompt version, trace id, and source passages; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-15: regression test `tests/trace/audit-event-and-acl.spec.ts` proving one complete audit record per query and denial of unauthorized audit-store reads; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
Additive tables + write hooks; revert migration + hooks. No user-visible behavior change.

### Done criteria
AC-7 and AC-15 pass; trace lookup by answer id returns the full chain in one query.

## Slice 6: Eval harness — goldens, adversarial cases, judge calibration

### Scope
Generator-side eval harness run against pinned versions (model id, prompt version, retrieval
config, acl-mapping-version): golden cases (fixed inputs, expected-grounded/expected-decline
properties), adversarial cases (fabrication elicitation, indirect restricted-topic probes per
AC-16), groundedness judge with a calibration report (FP/FN vs human-labeled set) required before
its scores count, and pinned-semantics metric definitions emitted with sample sizes. Dry-run/shadow
mode: render-and-log without serving (A2). Depends on: Slice 4.

### Allowed files
- src/evals/
- tests/evals/
- evals/cases/

### Forbidden files
- src/acl/
- src/identity/
- src/retrieval/
- src/answer/
- src/trace/
- src/dashboard/

### Invariants touched
- INV-10
- INV-13
- INV-5

### Tests required
- Unit: metric-definition lint fails on missing numerator/denominator/exclusions/non-claims
  (AC-10); groundedness scorer marks cited-but-unsupported as not grounded (AC-10).
- Harness: golden suite runs reproducibly against pinned versions and emits EvalRun records with
  sample sizes; judge scores are refused without a calibration report reference (AC-13).
- Adversarial: AC-16 cases scored automatically.

### Proof obligations
- INV-10: regression test `tests/evals/metric-semantics-pinned.spec.ts` proving metrics without pinned semantics are rejected and citation-presence is never scored as groundedness; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-13: regression test `tests/evals/judge-calibration-required.spec.ts` proving judge-derived evidence without a calibration report cannot enter an EvalRun; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-5: regression test `tests/evals/golden-decline-cases.spec.ts` proving the golden insufficient-evidence cases produce declines across the pinned harness run; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
None — additive only (harness + fixtures); does not sit in the serving path.

### Done criteria
AC-10, AC-13, AC-16 pass; EvalRun artifacts carry pinned version identifiers and sample sizes.

## Slice 7: Leak canary suite and negative controls

### Scope
Seeded restricted documents (synthetic "acquisition memo"-class fixtures) planted in the corpus
with eliciting queries from unauthorized test principals; canary detector scans responses,
retrieval sets, and prompt-context logs for canary markers; harness self-test runs a sandboxed
configuration with ACL filtering deliberately disabled to prove the detector fires (negative
control); any canary hit in a normal run is reported as gate-FAIL evidence. Depends on: Slice 3,
Slice 6.

### Allowed files
- src/canary/
- tests/canary/
- evals/canaries/

### Forbidden files
- src/acl/
- src/identity/
- src/retrieval/
- src/answer/
- src/evals/
- src/dashboard/

### Invariants touched
- INV-12
- INV-2
- INV-1

### Tests required
- Self-test: with ACL filtering disabled in the sandboxed run, the detector reports the seeded leak
  (AC-12b) — the detector demonstrably CAN fail red.
- Normal run: zero canary markers in responses, retrieval sets, and prompt contexts (AC-12a).
- Indirect elicitation: AC-16-style probes against canaries produce no existence hints (AC-2 class).

### Proof obligations
- INV-12: regression test `tests/canary/detector-self-test.spec.ts` proving the seeded-leak negative control is detected when filtering is disabled and clean when enabled; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-2: regression test `tests/canary/no-existence-hints.spec.ts` proving indirect canary probes yield responses with no existence signals for the seeded restricted docs; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-1: regression test `tests/canary/no-canary-in-context.spec.ts` proving canary content never appears in retrieval sets or prompt contexts for unauthorized principals; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
None — additive only (fixtures + detector); canary fixtures are synthetic and clearly marked, and
the ACL-disabled mode exists only in the sandboxed harness configuration, never in serving code.

### Done criteria
AC-12 passes both halves; canary results feed the gate as named evidence artifacts.

## Slice 8: Trust dashboard and launch gate (PASS / FAIL / INSUFFICIENT_EVIDENCE)

### Scope
Dashboard rendering the pinned-semantics metrics (groundedness, decline rate, canary leak count,
judge calibration status) with sample sizes and version pins; launch gate consuming EvalRun and
canary evidence with a decision↔evidence map, sufficiency thresholds (numeric values pending
OQ-2), staleness invalidation against current model/prompt/retrieval/acl-mapping versions, and
contradiction handling (disagreement → INSUFFICIENT_EVIDENCE). INSUFFICIENT_EVIDENCE is rendered
as a distinct third state defaulting to no-go. Depends on: Slice 6, Slice 7.

### Allowed files
- src/dashboard/
- tests/dashboard/

### Forbidden files
- src/acl/
- src/identity/
- src/retrieval/
- src/answer/
- src/trace/
- src/evals/
- src/canary/

### Invariants touched
- INV-9
- INV-10
- INV-11

### Tests required
- Unit: AC-9 matrix (thin-sample → INSUFFICIENT_EVIDENCE; below-threshold → FAIL; contradiction →
  INSUFFICIENT_EVIDENCE; only the full conjunction → PASS).
- Unit: AC-11 voiding for each of the four version dimensions.
- Rendering: dashboard displays the three states distinctly and shows each metric's sample size,
  version pins, and non-claims text (AC-10 rendering half).

### Proof obligations
- INV-9: regression test `tests/dashboard/gate-trichotomy.spec.ts` proving thin/stale/contradictory evidence lands in INSUFFICIENT_EVIDENCE (no-go) and never PASS; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-10: regression test `tests/dashboard/metric-nonclaims-render.spec.ts` proving every rendered metric carries pinned semantics and proxies are never labeled as the claim; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.
- INV-11: regression test `tests/dashboard/evidence-voiding.spec.ts` proving evidence predating any of the four pinned-version changes is voided and cannot support PASS; expected attributed STRONG_RED via regression-check.mjs at remediation/review time.

### Rollback notes
None — additive only; the gate is read-only over evidence and gates launch, not serving traffic.

### Done criteria
AC-9, AC-10, AC-11 pass; gate decision records list the exact evidence artifacts consumed
(decision↔evidence map); thresholds are config awaiting OQ-2 values, with the gate refusing to
emit PASS while thresholds are unset.
