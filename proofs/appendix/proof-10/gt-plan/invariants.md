# Invariants

## Invariants

- INV-1 [L3] No content, title, or identifying metadata of a document the requesting principal
  lacks read access to may ever enter the model prompt context for that principal's query.
- INV-2 [L3] Answers, citations, declines, and error responses must be observably identical
  whether a relevant document is access-restricted or nonexistent — the system must never
  acknowledge the existence of a document the principal cannot read.
- INV-3 [L3] A document whose permission metadata is missing, malformed, or from an unrecognized
  source-system schema must be retrievable by no principal (fail closed); normalization status
  other than `normalized` means deny-all.
- INV-4 [L3] The principal's identity and group/role memberships used for authorization must come
  from the verified SSO session and server-side directory resolution; client-supplied identity,
  team, or role claims must never influence an access decision.
- INV-5 [L3] ACL filtering must be applied server-side within the retrieval query itself (SQL /
  vector-search predicate over CanonicalAcl); post-filtering by the LLM, the prompt, or the
  client must never be the enforcement mechanism.
- INV-6 [L2] After a document's re-synced permission metadata revokes a principal's access, no
  subsequent query by that principal may retrieve the document; per-principal authorization
  results must not be cached across metadata updates.
- INV-7 [L2] Every non-declined answer must carry at least one citation, and every citation must
  reference a document that was in that query's ACL-filtered RetrievalSet.
- INV-8 [L2] When the ACL-filtered RetrievalSet does not support an answer (empty, irrelevant, or
  below the grounding/confidence bar), the assistant must decline rather than generate an
  unsupported answer.
- INV-9 [L2] Dashboard metric semantics are pinned: a decline must never be counted as a grounded
  answer; the groundedness rate's denominator is non-declined answers only; the decline rate's
  denominator is all queries; both definitions are displayed with the metrics.
- INV-10 [L3] EvalRecords and the dashboard must never expose restricted document content,
  titles, or per-query detail derived from restricted documents to a viewer who lacks access to
  those documents; dashboard viewers without such access see aggregates only.
- INV-11 [L2] All model calls go through the existing gateway; no code path calls a model
  provider directly.
- INV-12 [L2] The automated leak-probe suite must execute against the real retrieval + answer
  path (not mocks of the ACL filter), and a probe failure must fail the build/release check.
