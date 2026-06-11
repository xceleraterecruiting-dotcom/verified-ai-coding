# Domain model

## Entities

- **Document** — a synced item from a source system: content, title, source link, source-system
  id, raw permission metadata (as delivered), embedding vector(s). Lives in Postgres.
- **RawAcl** — the per-source permission metadata exactly as synced (owner, teams, sometimes
  roles; shape varies by source system). Never used directly for authorization decisions.
- **CanonicalAcl** — the normalized access rule derived from RawAcl by a per-source-system
  mapping: a set of principals/groups/roles allowed to read the document, plus a normalization
  status (`normalized` | `unrecognized` | `missing`). Anything not `normalized` is unreadable by
  everyone (fail closed, A2).
- **Principal** — an authenticated employee: identity from SSO session, plus resolved group/team
  and role memberships (resolution source is OQ-2).
- **Query** — one question from one Principal at one time.
- **RetrievalSet** — the documents returned for a Query after server-side ACL filtering; the only
  documents eligible for the model context and citations.
- **Answer** — the assistant's response: either an answer with ≥1 Citation, or a Decline.
- **Citation** — a reference from an Answer to a Document in its RetrievalSet, with click-through
  link.
- **Decline** — an explicit "the documents don't answer this / not confident" response. Carries
  no citations of inaccessible material and no hint of withheld documents.
- **EvalRecord** — per-query capture (query text, principal, retrieved doc ids, answer or
  decline, citations, grounding verdict) feeding metrics and the leak suite. Inherits the access
  restrictions of any document content it embeds.
- **MetricSnapshot** — dashboard aggregates with pinned semantics: groundedness rate, decline
  rate, denominators documented.
- **LeakProbe** — an automated adversarial test case: (principal-fixture, query, forbidden
  documents) asserting nothing from the forbidden set surfaces in retrieval, context, answer, or
  citations.

## States and transitions

Document normalization lifecycle:

```
synced(RawAcl) ──mapping known──▶ normalized(CanonicalAcl)   [retrievable, ACL-filtered]
synced(RawAcl) ──mapping unknown─▶ unrecognized              [retrievable by no one]
synced(no acl) ─────────────────▶ missing                    [retrievable by no one]
re-sync with changed RawAcl ────▶ re-normalized              [old grants void next query]
```

Query lifecycle:

```
question ▶ authenticate(Principal) ▶ ACL-filtered retrieval ▶ RetrievalSet
RetrievalSet empty or insufficient ──▶ Decline (recorded in EvalRecord)
RetrievalSet sufficient ────────────▶ Answer + Citations ⊆ RetrievalSet (recorded)
```

There is no state in which an unauthenticated query, a raw-ACL authorization decision, or an
answer citing a document outside the RetrievalSet is reachable.
