# Requirements

## Requirements

- R1: Employees can ask natural-language questions and receive answers synthesized from company
  documents (wikis, HR policies, engineering docs, sales material, exec memos). [spec: "answers
  employees' questions from our company documents … ask anything, get an answer with sources"]
- R2: Document-level access control is enforced on every answer: a principal only ever receives
  content derived from documents they are authorized to read. [spec: "The non-negotiable: people
  have different access"]
- R3: Permission metadata arriving from several source systems (owner, teams, sometimes roles —
  varying by source) is normalized into one canonical, enforceable ACL model. [spec: "Documents
  come synced from several systems and carry permission info … it varies by source system"]
- R4: An unauthorized document is indistinguishable from a nonexistent one in every user-visible
  respect: no content, no title, no citation, no access-denied message naming it. [spec: "should
  get nothing, not even a hint the memo exists"]
- R5: Group-scoped visibility holds across team and role boundaries (e.g., sales cannot see eng
  postmortems; only execs see exec-only material). [spec: "Sales shouldn't see eng postmortems,
  and nobody should see exec-only material except execs"]
- R6: Every answer cites its source documents with click-through links so the reader can verify.
  [spec: "Answers should cite their sources so people can click through and verify"]
- R7: When the authorized retrieved documents do not actually answer the question, or confidence
  is insufficient, the assistant declines instead of generating unsupported content. [spec: "it
  should say so instead of winging it — a wrong-but-confident answer … is worse than no answer"]
- R8: A pre-launch trust dashboard reports, at minimum: how often answers are grounded in their
  cited documents, and how often the assistant declines — with pinned metric semantics. [spec:
  "a dashboard that shows us the thing is trustworthy: how often answers are grounded in the
  cited documents, how often it declines"]
- R9: The launch decision is gated on identified, sufficient, reproducible evidence — including
  adversarial leak testing with seeded restricted documents — so Legal's "how do you know it
  can't leak?" has a better answer than manual testing. [spec: "We launch when the numbers look
  good. Legal will ask 'how do you know it can't leak?' … better answer than 'we tested it by
  hand'"]
- R10: Implementation stack: TypeScript; documents + metadata + embeddings in Postgres; all model
  calls routed through the existing gateway. [spec: "Stack: TypeScript, our docs land in Postgres
  with their metadata, embeddings for retrieval, model calls go through our existing gateway"]
- R11 (lens-derived, identity lens): The requesting principal is authenticated via
  provider-attested identity (IdP/SSO), and team/role entitlements are resolved from the
  authoritative directory at query time within a bounded staleness — never from user input.
- R12 (lens-derived, AI-output lens): Every generated answer is traceable end to end: model id,
  prompt version, run/trace id, and the exact retrieved source passages are persisted per answer.
- R13 (lens-derived, evidence-sufficiency lens): The launch gate distinguishes PASS, FAIL, and
  INSUFFICIENT_EVIDENCE; thin, stale, or contradictory evidence defaults to no-go, and evidence
  predating a relevant change (model, prompt, retrieval config, ACL mapping) is void.
