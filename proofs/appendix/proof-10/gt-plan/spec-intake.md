# Spec intake — enterprise knowledge assistant

## Original spec (verbatim)

We're building an internal AI assistant that answers employees' questions from our company
documents — wikis, HR policies, engineering docs, sales material, exec memos. Think "ask anything,
get an answer with sources."

The non-negotiable: people have different access. Documents come synced from several systems and
carry permission info — owner, teams, sometimes a roles field, that kind of metadata, it varies by
source system. An engineer asking about parental leave should get the HR policy; the same engineer
asking about the unannounced acquisition memo should get nothing, not even a hint the memo exists.
Sales shouldn't see eng postmortems, and nobody should see exec-only material except execs.

Answers should cite their sources so people can click through and verify. If the assistant isn't
confident or the docs don't actually answer the question, it should say so instead of winging it —
a wrong-but-confident answer about an HR policy is worse than no answer.

Before launch I want a dashboard that shows us the thing is trustworthy: how often answers are
grounded in the cited documents, how often it declines, that kind of thing. We launch when the
numbers look good. Legal will ask "how do you know it can't leak?" and I want a better answer than
"we tested it by hand."

Stack: TypeScript, our docs land in Postgres with their metadata, embeddings for retrieval, model
calls go through our existing gateway.

## Compiler paraphrase

Build an internal retrieval-augmented Q&A assistant over company documents already synced into
Postgres with per-source permission metadata. Every answer must be restricted to documents the
asking employee is allowed to read — denial must be silent (no acknowledgment that a restricted
document exists). Answers must cite their source documents with click-through links. When the
accessible documents do not actually answer the question, or confidence is low, the assistant
must decline rather than guess. Before launch, ship a trust dashboard reporting at minimum a
groundedness rate (answers supported by their cited documents) and a decline rate, backed by
evidence strong enough to answer Legal's "how do you know it can't leak?" with something better
than manual testing — i.e., a repeatable, automated leak-verification mechanism. Stack:
TypeScript, Postgres for docs+metadata, embedding-based retrieval, all model calls via the
existing gateway.

## Interpretation notes

- **Step 0 yielded no project context.** This is a greenfield engagement: no CLAUDE.md,
  PROJECT-CONTEXT.md, existing codebase, or prior invariants were available or consulted. All
  file layouts in the slice plan are proposed, not discovered.
- "not even a hint the memo exists" — interpreted as: denial must be indistinguishable from
  absence (no different error message, no citation stub, no "1 result withheld" count, no
  existence leak via timing-irrelevant UI differences we control). Rejected the narrower reading
  "just don't show the content", which would still leak existence via titles or counts.
- "permission info — owner, teams, sometimes a roles field, that kind of metadata, it varies by
  source system" — interpreted as: heterogeneous, incomplete, per-source ACL schemas that must be
  normalized into one canonical access model, with fail-closed handling for unrecognized or
  missing fields. Rejected the reading that each source's raw metadata can be checked ad-hoc at
  query time without a defined canonical semantics — that reading hides exactly the ambiguity
  (what does "teams" grant? is `roles` absent = public or = private?) that causes leaks. The
  authoritative meaning of each source's fields is an open question (OQ-1), not a guess.
- "how often answers are grounded in the cited documents, how often it declines" — interpreted as
  two metrics with **pinned, mutually consistent semantics**: groundedness rate over non-declined
  answers, decline rate over all queries, declines never counted as grounded. Rejected the
  reading that any plausible-looking aggregate satisfies the requirement — undefined metric
  denominators would let the dashboard show "good numbers" that mean nothing (the spec's launch
  gate depends on these numbers).
- "We launch when the numbers look good" — interpreted as: the launch decision is human and out
  of scope; this plan delivers the numbers and their definitions, not an automated launch gate.
  Numeric thresholds are an open question (OQ-5).
- "a better answer than 'we tested it by hand'" — interpreted as a requirement for an automated,
  repeatable leak-verification suite (adversarial access-control probes run against the real
  retrieval path), not merely the dashboard. Rejected the reading that the dashboard alone
  satisfies Legal — groundedness/decline rates do not measure leakage.
- "our docs land in Postgres with their metadata" — interpreted as: the sync pipeline from source
  systems exists and is out of scope; this plan consumes its output. Rejected the reading that we
  build connectors.
- "model calls go through our existing gateway" — interpreted as a hard constraint: the gateway
  is the only model-call path; no direct provider SDK calls.

## Assumptions

- A1: Greenfield service consuming an existing Postgres sync of documents + per-source permission
  metadata; building or modifying the sync/connectors is out of scope.
- A2: Documents whose permission metadata is missing, malformed, or from an unrecognized schema
  are treated as accessible to no one (fail closed) until OQ-1 resolves their semantics.
- A3: Users are authenticated employees behind the company's SSO; there is no anonymous access.
  The assistant derives the principal from the authenticated session, never from client-supplied
  identity claims.
- A4: "No hint it exists" applies to every surface this system controls: answers, citations,
  declines, error messages, and result counts must be identical whether a matching document is
  restricted or simply absent.
- A5: Single-turn Q&A initially; multi-turn conversation memory is deferred (see non-goals,
  OQ-7).
- A6: The trust dashboard is an internal pre-launch instrument; its viewers are the launch team,
  and it must not itself become a leak channel for restricted document content.
- A7: Embeddings for restricted documents are computed and stored, with access enforced at
  retrieval time by server-side filtering (pending OQ-4 on whether the most sensitive classes
  should be excluded from the index entirely).

## Open questions

See `open-questions.md`. OQ-1, OQ-2, and OQ-3 are high severity and block implementation until
the user resolves them.
