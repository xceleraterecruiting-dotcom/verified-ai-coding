# Requirements

## Requirements

- R1: Employees can ask natural-language questions and receive answers synthesized from company
  documents (wikis, HR policies, engineering docs, sales material, exec memos) stored in
  Postgres. ("answers employees' questions from our company documents")
- R2: Retrieval is embedding-based over the synced document corpus, and all model calls go
  through the existing gateway, in TypeScript. ("Stack: TypeScript … embeddings for retrieval,
  model calls go through our existing gateway")
- R3: Per-source permission metadata (owner, teams, optional roles, varying by source system) is
  normalized into a single canonical access model with defined semantics per source system.
  ("carry permission info — owner, teams, sometimes a roles field … it varies by source system")
- R4: Every query is evaluated against the asking employee's access: only documents the principal
  is permitted to read may enter retrieval results, the model context, the answer, or the
  citations. ("people have different access")
- R5: When a relevant document exists but the principal lacks access, the system's observable
  behavior is identical to the document not existing — no content, no title, no count, no
  distinct error. ("should get nothing, not even a hint the memo exists")
- R6: Cross-team restrictions hold generally: e.g., sales principals cannot retrieve engineering
  postmortems; exec-only material is retrievable only by exec principals. ("Sales shouldn't see
  eng postmortems, and nobody should see exec-only material except execs")
- R7: Every answer cites the source documents it draws from, with links the user can click
  through to verify. ("Answers should cite their sources so people can click through and verify")
- R8: When the accessible retrieved documents do not answer the question, or model confidence is
  insufficient, the assistant declines explicitly instead of fabricating an answer. ("it should
  say so instead of winging it")
- R9: A pre-launch trust dashboard reports, at minimum: groundedness rate (how often non-declined
  answers are supported by their cited documents) and decline rate, each with pinned, documented
  metric semantics (defined numerator and denominator). ("how often answers are grounded in the
  cited documents, how often it declines")
- R10: An automated, repeatable access-control verification suite (adversarial leak probes run
  against the real retrieval and answer path) exists so the leak question is answered by
  machine-checked evidence, not manual testing. ("Legal will ask 'how do you know it can't leak?'
  and I want a better answer than 'we tested it by hand'")
- R11: Per-query evaluation records (question, retrieved doc ids, answer/decline, citations)
  are captured to feed R9 and R10, stored such that restricted document content in those records
  inherits the source documents' access restrictions.
