# Fixture spec — enterprise knowledge assistant (expected: Level 2–3, agent trust boundaries)

> Provenance: PM-voice paraphrase of the GroundTruth product intent. The real system's audit
> findings (its metric-semantics and ACL-metadata issues) and its eval architecture are
> deliberately EXCLUDED — they are the answer key for the pre-registered ground truth (proof-10).
> The spec retains only the natural product surface those findings hide behind. Builder is
> contaminated; compilation and scoring run in fresh contexts.

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
