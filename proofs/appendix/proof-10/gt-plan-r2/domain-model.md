# Domain model

## Entities

- **Document** — a synced source document: source system id, external id, content, raw permission
  metadata (heterogeneous), canonical ACL (after normalization), index status.
- **Chunk / Embedding** — a retrievable passage of a Document with its vector; inherits (denormalized
  copy of) the Document's canonical ACL so filtering happens at/before search.
- **PermissionGrant (canonical ACL)** — normalized statement "principal-set P may read Document D",
  where principal-set is owner | team | role | exec-group, produced per source system by the
  normalization mapping (mapping content pending OQ-1).
- **Principal** — an authenticated employee; identity provider-attested (A1). Carries directory
  identifiers only; never self-asserted teams/roles.
- **EntitlementSnapshot** — the team/role/group memberships resolved for a Principal from the
  authoritative directory at query time, with resolved-at timestamp (staleness bound pending OQ-3).
- **Query** — a Principal's question; links to its RetrievalSet, Answer, and AuditEvent.
- **RetrievalSet** — the ACL-filtered chunks considered for a Query (post-filter only; unauthorized
  chunks never enter it).
- **Answer** — either a grounded answer with Citations or a Decline; never a third state.
- **Citation** — a link from an answer claim to a Chunk in the RetrievalSet (authorized by
  construction).
- **GenerationRecord** — per-answer trace: model id, prompt version, run/trace id, exact source
  passages, gateway call ref.
- **EvalCase** — a fixed test input: golden (expected-grounded), adversarial (fabrication/leak
  elicitation), or canary (seeded restricted doc + planted query that must yield nothing).
- **EvalRun** — an execution of the eval suite against a pinned model id + prompt version +
  retrieval config + ACL-mapping version; produces Metric values with sample sizes.
- **Metric** — pinned-semantics measurement (numerator, denominator, exclusions, non-claims
  documented), e.g., groundedness rate, decline rate, canary leak count.
- **LaunchGateDecision** — PASS | FAIL | INSUFFICIENT_EVIDENCE, derived from EvalRun evidence with
  thresholds (values pending OQ-2), recorded with the evidence artifacts it consumed.
- **AuditEvent** — per-query record: principal, entitlement snapshot ref, docs considered vs
  filtered, answer/decline, generation record ref. Audit storage is itself ACL-restricted.

## States and transitions

Document ingest lifecycle (fail-closed):

```
synced(raw metadata)
  → normalized(canonical ACL)        — recognized metadata, mapping applied
  → quarantined(most-restricted)     — missing/unparseable/unrecognized metadata (INV-3)
normalized → indexed                 — chunks + embeddings written with ACL
indexed → reindex-pending → indexed  — ACL or content changed upstream
any → removed                        — deleted upstream; chunks+vectors purged
quarantined → normalized             — human remediation only (NG-5)
```

Query lifecycle: `received → entitlements-resolved → retrieved(ACL-filtered) →
(grounded-answer | declined)`; any internal error surfaces as a generic safe failure (INV-8),
never a raw model/stack message.

Launch gate: `evidence-collected → {PASS | FAIL | INSUFFICIENT_EVIDENCE}`; INSUFFICIENT_EVIDENCE
and FAIL both mean no-go; evidence voided by model/prompt/retrieval/ACL-mapping change returns the
gate to evidence-collected (INV-11).
