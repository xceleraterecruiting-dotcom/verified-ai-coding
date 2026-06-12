# Spec intake — enterprise knowledge assistant (permission-aware RAG)

## Project context (Step 0)

Greenfield. No existing codebase, CLAUDE.md, PROJECT-CONTEXT.md, or prior specs were found or
provided for this plan. There are no existing project invariants to reconcile against. Recorded
explicitly: Step 0 yields none.

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

Build an internal retrieval-augmented question-answering assistant over synced company documents,
where document-level access control is the primary product constraint. Permission metadata arrives
in heterogeneous shapes from several source systems and must be normalized into one enforceable
model. A requesting employee may only ever receive answer content, citations, or any signal of
existence from documents they are authorized to read; unauthorized documents must be
indistinguishable from nonexistent ones. Answers must carry verifiable citations to the retrieved
sources; when the authorized retrieved documents do not support an answer, the assistant declines
rather than fabricating. Before launch, a trust dashboard reports groundedness and decline metrics
with semantics rigorous enough to answer Legal's "how do you know it can't leak?" — i.e., the
launch decision must rest on identified, sufficient, reproducible evidence including adversarial
leak testing, not on manual spot checks. Stack: TypeScript, Postgres (docs + metadata), embedding
retrieval, model calls via the existing gateway.

## Interpretation notes

- IN-1: "get nothing, not even a hint the memo exists" is read as a *non-existence semantics*
  requirement: the unauthorized case must be indistinguishable from the no-matching-document case
  in content, citations, and error shape. Rejected reading: a polite "you don't have access to
  this document" message — that confirms existence and contradicts "not even a hint".
- IN-2: "it varies by source system" is read as: permission metadata is heterogeneous and a
  canonical internal ACL model with per-source normalization is required. Rejected reading: pass
  raw per-source metadata through to query-time checks ad hoc — that makes fail-closed behavior
  and auditability unverifiable. The *content* of each per-source mapping is NOT decided here; it
  is OQ-1 (high, blocking).
- IN-3: "If the assistant isn't confident or the docs don't actually answer the question, it
  should say so" is read as a verified-decline requirement enforced by output verification
  (groundedness checking), not merely a prompt instruction. Rejected reading: instruct the model
  to be careful and trust it — the spec itself says a wrong-but-confident answer is worse than no
  answer, and "we told the model not to" is not a control.
- IN-4: "We launch when the numbers look good" is read as: the launch decision is gated on the
  dashboard's evidence, therefore the evidence-sufficiency lens applies in full (pinned metric
  semantics, sufficiency thresholds, INSUFFICIENT_EVIDENCE state, negative controls). Rejected
  reading: the dashboard is informational and launch is vibes — that cannot answer Legal's
  question. The *numeric thresholds* are not invented here; they are OQ-2 (high, blocking).
- IN-5: "embeddings for retrieval" with "docs land in Postgres" is read as vector search colocated
  with Postgres (e.g., pgvector) as the default architecture. Rejected reading: a separate vector
  store — possible, but the spec's stack sentence points at Postgres; either way the ACL-filter
  invariants are store-agnostic and the choice is left to the slice implementer within A7.
- IN-6: "employees" implies an authenticated workforce identity (SSO/IdP) exists; the spec never
  says how the assistant knows who is asking. The requirement that identity be provider-attested
  is lens-derived (identity lens); *which* directory is authoritative is OQ-3 (high, blocking).
- IN-7: "exec memos … nobody should see exec-only material except execs" is read as: "exec" is an
  entitlement group resolvable from the authoritative directory, same mechanism as teams/roles —
  not a special-cased hardcoded list. Folded into OQ-3.

## Assumptions

- A1: The requesting principal's identity is provider-attested via the company IdP/SSO; the
  assistant never accepts a client-asserted identity. Lens-derived (identity lens question 1:
  verified, not claimed, control of the identifier) — the spec is silent; at L2+ with private HR
  and exec data the default is verified-identity-required.
- A2: Per-answer human approval is NOT required for this interactive internal assistant; the
  AI-output lens item 12 (human approval at L2+) is satisfied at the system level by the
  human-decided launch gate, and item 13 (dry-run-first) by a pre-launch shadow/eval phase in
  which generated answers are rendered and logged against the eval corpus but not served to
  employees. Lens-derived adaptation; per-answer approval would make an interactive assistant
  unusable and the output is internal, not public.
- A3: AI-output lens item 14 (minors/likeness/rights checks) is not applicable: subjects are
  internal corporate documents and employees, not minors or public-figure likenesses. Recorded,
  not silent.
- A4: The payment-depth lens is not triggered: no money movement, paid entitlement, or
  webhook-driven payment state exists anywhere in this spec. Recorded, not silent.
- A5: Documents whose permission metadata is missing, unparseable, or in an unrecognized schema
  are quarantined as most-restricted (visible to no principal) until remediated. Lens-derived
  fail-closed default (identity lens: silence at L2 is ambiguity, not permission; spec's own
  "should get nothing" direction supports fail-closed).
- A6: Initial corpus and queries are English; multi-language is out of scope (non-goal).
- A7: Greenfield TypeScript service; Postgres holds documents, metadata, and embeddings (pgvector
  or equivalent — see IN-5); model calls go only through the existing gateway (spec-stated).
- A8: Document sync FROM the source systems exists or is built elsewhere; this plan consumes
  synced rows ("our docs land in Postgres with their metadata" is read as the landing already
  happening). The normalization layer in Slice 1 starts from those landed rows.

## Open questions

See `open-questions.md`. Three high-severity questions (OQ-1 ACL mapping semantics, OQ-2 launch
thresholds, OQ-3 authoritative identity/entitlement source) are open and BLOCK implementation.
