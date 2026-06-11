# Implementation slices

Greenfield layout (proposed, since Step 0 found no codebase): `db/migrations/` for schema,
`src/<area>/` per concern, `test/<area>/` per concern, `probes/` for the leak suite. Slices are
ordered; dependencies are explicit and acyclic. One slice = one verified-implementation run =
one ship-review. Slices 1 and 2 are independent of each other; everything else is ordered.

NOTE: high-severity open questions OQ-1 (per-source ACL semantics), OQ-2 (identity/group
resolution source), and OQ-3 (revocation staleness bound) block Slices 1–3 until resolved.

## Slice 1: Document store and canonical ACL normalization

### Scope
Postgres schema for documents, raw per-source permission metadata, and the CanonicalAcl
derivation: a per-source-system mapping registry that normalizes owner/teams/roles fields into
one canonical allow-set, tagging each document `normalized` | `unrecognized` | `missing`.
Anything not `normalized` is readable by no one. Consumes the existing sync's output (A1); the
authoritative per-source field semantics come from OQ-1's answer.

### Allowed files
- db/migrations/
- src/acl/
- test/acl/

### Forbidden files
- src/retrieval/
- src/answer/
- src/identity/
- src/dashboard/
- src/eval/

### Invariants touched
- INV-3

### Tests required
- Unit: each registered source-system mapping over fixture RawAcl payloads produces the expected
  canonical allow-set.
- Unit: missing metadata, malformed metadata, and unknown source schema each yield
  non-`normalized` status (AC-3 fixtures).
- Property-style: no RawAcl input path can yield an empty-restriction ("everyone") canonical ACL
  unless the mapping explicitly declares the document public.

### Proof obligations
- Regression test `test/acl/fail-closed.test.ts`: non-`normalized` documents are denied for all
  principals. L3 — will require an attributed STRONG_RED via
  `/Users/jorigeck/.verified-ai-coding/scripts/regression-check.mjs` at remediation/review time.
- Mapping-registry completeness check: a synced source system with no registered mapping is
  reported and its documents are `unrecognized`, never defaulted.

### Rollback notes
Revert the migration set and `src/acl/`; additive at this stage (no other slice depends on it
yet). New source mappings later are additive registry entries.

### Done criteria
AC-3 passes on fixtures; schema migrated; mapping registry covers the source systems named in
OQ-1's resolution; lint/tests green.

## Slice 2: Principal identity and membership resolution

### Scope
Resolve the authenticated principal from the SSO session and resolve group/team/role memberships
server-side (directory source per OQ-2). Expose a single `resolvePrincipal(request)` boundary the
rest of the system must use. Reject or ignore any client-supplied identity/team/role claims.

### Allowed files
- src/identity/
- test/identity/

### Forbidden files
- src/acl/
- src/retrieval/
- src/answer/
- src/dashboard/
- src/eval/

### Invariants touched
- INV-4

### Tests required
- Unit: session token → principal with memberships from the directory fixture.
- Negative: forged headers/body claims/JWT claims not issued by SSO do not alter the resolved
  principal (AC-4).
- Negative: missing/expired session yields 401, never an anonymous principal.

### Proof obligations
- Regression test `test/identity/forged-claims.test.ts` (AC-4). L3 — attributed STRONG_RED
  required at remediation/review time per regression-check.mjs.

### Rollback notes
Revert `src/identity/`; additive — no data migration. Downstream slices compile against the
boundary interface, so a revert blocks them rather than silently widening access.

### Done criteria
AC-4 passes; the only identity entry point is `resolvePrincipal`; tests green.

## Slice 3: ACL-filtered embedding retrieval

### Scope
Embedding-based retrieval over documents where the ACL predicate (principal's memberships ∩
CanonicalAcl, status = `normalized`) is part of the database query itself. No per-principal
authorization caching across metadata updates. Returns the RetrievalSet. Depends on: Slice 1,
Slice 2.

### Allowed files
- src/retrieval/
- db/migrations/
- test/retrieval/

### Forbidden files
- src/acl/
- src/identity/
- src/answer/
- src/dashboard/
- src/eval/

### Invariants touched
- INV-1
- INV-5
- INV-6

### Tests required
- Behavioral: cross-team fixtures (sales vs eng postmortem, engineer vs exec memo) return zero
  restricted rows (feeds AC-1, AC-5).
- Query-shape: ACL predicate present in the issued SQL/vector query (AC-5, via test-time query
  logging).
- Revocation: re-synced metadata revoking access takes effect on the next query with no cache
  invalidation step (AC-6); staleness bound per OQ-3's resolution.

### Proof obligations
- Regression test `test/retrieval/acl-filter.test.ts` (AC-5) and
  `test/retrieval/revocation.test.ts` (AC-6). L3/L2 — attributed STRONG_RED required at
  remediation/review time per regression-check.mjs.

### Rollback notes
Revert `src/retrieval/` and its index migrations. Fail-closed on revert: with no retrieval, the
assistant declines everything — degraded, never leaky.

### Done criteria
AC-5 and AC-6 pass; restricted fixtures unreachable for unauthorized principals; tests green.

## Slice 4: Answer generation with citations and abstention

### Scope
Compose the prompt strictly from the RetrievalSet, call the model via the existing gateway,
produce either an answer with citations (each citation ⊆ RetrievalSet, with click-through link)
or an explicit decline when the RetrievalSet doesn't support an answer or confidence is low.
Decline and not-found responses are byte-identical in shape regardless of whether restricted
documents were withheld. Depends on: Slice 3.

### Allowed files
- src/answer/
- src/gateway/
- test/answer/

### Forbidden files
- src/retrieval/
- src/acl/
- src/identity/
- src/dashboard/
- src/eval/

### Invariants touched
- INV-1
- INV-2
- INV-7
- INV-8
- INV-11

### Tests required
- Prompt capture: prompts contain only RetrievalSet content (AC-1).
- Response equivalence: restricted-vs-absent responses are equivalent modulo timestamps/ids
  (AC-2).
- Citation validation: every citation id ∈ RetrievalSet ids; out-of-set citation is rejected
  before the response is sent (AC-7).
- Abstention: unanswerable fixture questions yield declines, no fabricated citations (AC-8).
- Gateway-only: network-recording test shows no non-gateway model-provider calls (AC-11).

### Proof obligations
- Regression tests `test/answer/prompt-containment.test.ts` (AC-1),
  `test/answer/existence-suppression.test.ts` (AC-2), `test/answer/citation-set.test.ts` (AC-7),
  `test/answer/abstention.test.ts` (AC-8). L3/L2 — attributed STRONG_RED required at
  remediation/review time per regression-check.mjs.

### Rollback notes
Revert `src/answer/` and `src/gateway/`; service returns 503 for answer requests — degraded,
never leaky. No data migration.

### Done criteria
AC-1, AC-2, AC-7, AC-8, AC-11, AC-13 pass; tests green.

## Slice 5: Eval record capture

### Scope
Persist an EvalRecord per query: query text, principal, retrieved doc ids, answer/decline,
citations, grounding verdict (grounding measured per OQ-8's resolution; until then, store the raw
material and a method-versioned verdict field). Records embedding restricted document content
inherit those documents' access restrictions. Depends on: Slice 4.

### Allowed files
- src/eval/
- db/migrations/
- test/eval/

### Forbidden files
- src/answer/
- src/retrieval/
- src/acl/
- src/identity/
- src/dashboard/

### Invariants touched
- INV-10

### Tests required
- Every answered/declined query in a test run produces exactly one EvalRecord with the fields
  above.
- Access inheritance: reading an EvalRecord that embeds restricted content requires access to
  the underlying documents (feeds AC-10).
- Capture failures do not block or alter the user-facing answer path (write-aside, not inline).

### Proof obligations
- Regression test `test/eval/record-acl-inheritance.test.ts` (AC-10 storage half). L3 —
  attributed STRONG_RED required at remediation/review time per regression-check.mjs.

### Rollback notes
Revert `src/eval/` and its migration; answer path unaffected (capture is write-aside). Dashboard
(Slice 6) loses its data source and must not ship without this slice.

### Done criteria
EvalRecords captured for 100% of test-run queries; inheritance test passes; answer-path latency
unaffected in tests; tests green.

## Slice 6: Trust dashboard with pinned metric semantics

### Scope
Internal dashboard over EvalRecords showing groundedness rate (denominator: non-declined
answers), decline rate (denominator: all queries), and leak-probe suite status, each displayed
with its written definition. Viewers lacking access to underlying documents see aggregates only —
no per-query drill-down into restricted content. Depends on: Slice 5.

### Allowed files
- src/dashboard/
- test/dashboard/

### Forbidden files
- src/eval/
- src/answer/
- src/retrieval/
- src/acl/
- src/identity/

### Invariants touched
- INV-9
- INV-10

### Tests required
- Metric math: fixture datasets yield groundedness = g/(N−d), decline rate = d/N; declines can
  never increment the grounded numerator (AC-9).
- Definition display: the rendered dashboard includes the metric definitions verbatim (AC-9).
- Viewer access: an unprivileged dashboard viewer cannot reach restricted EvalRecord detail via
  any dashboard/eval endpoint; aggregates remain visible (AC-10).

### Proof obligations
- Regression tests `test/dashboard/metric-semantics.test.ts` (AC-9) and
  `test/dashboard/viewer-acl.test.ts` (AC-10). L2/L3 — attributed STRONG_RED required at
  remediation/review time per regression-check.mjs.

### Rollback notes
Revert `src/dashboard/`; purely a read surface — removing it affects no user-facing answers and
no data.

### Done criteria
AC-9 and AC-10 pass; dashboard renders both metrics with definitions and probe status; tests
green.

## Slice 7: Automated leak-probe suite (CI release gate)

### Scope
Adversarial probe matrix run in CI against the real retrieval + answer path (no mocked ACL
filter): cross-team probes (sales→eng postmortem), exec-only probes, missing/unrecognized
metadata probes, forged-identity probes, and existence-hint probes (paraphrase/title-fishing for
restricted docs). Any probe failure exits nonzero and blocks release. This is the machine-checked
answer to Legal's "how do you know it can't leak?". Depends on: Slice 3, Slice 4.

### Allowed files
- probes/
- test/probes/

### Forbidden files
- src/
- db/migrations/

### Invariants touched
- INV-12
- INV-2
- INV-3
- INV-4

### Tests required
- Probe-harness self-test: a deliberately leaky stub corpus makes the suite fail (the suite can
  actually catch a leak — guards against a vacuously green suite).
- Full matrix run on the fixture corpus: all probes pass against the real stack.
- CI wiring test: probe failure produces nonzero exit and a blocking status.

### Proof obligations
- Regression test `test/probes/harness-detects-leak.test.ts` proving the suite turns red on a
  seeded leak. L3 — attributed STRONG_RED required at remediation/review time per
  regression-check.mjs; this slice's whole point is attributable red evidence.

### Rollback notes
None — additive only (probes and CI wiring; no product code is touched, enforced by the
forbidden list).

### Done criteria
AC-12 passes; seeded-leak self-test red, real-stack matrix green, failure blocks release;
dashboard (Slice 6) can read probe status.
