# Risk map

## Risk classification
Initial classification: L2
Final level: L3

## Justification

Initial read: an internal tool gated by permissions with AI-generated answers over private data —
squarely L2 territory (auth/permissions, private data, status-bearing output):

> The non-negotiable: people have different access.

> Answers should cite their sources so people can click through and verify.

Escalated to L3 on three grounds (escalation is free; no downgrade involved):

1. The confidentiality boundary covers material non-public information whose leak is a
   regulated-severity event, and the spec demands existence-suppression, not just
   content-suppression:

> the same engineer asking about the unannounced acquisition memo should get nothing, not even a
> hint the memo exists.

> nobody should see exec-only material except execs.

2. The enforcement input is heterogeneous, partially-specified metadata — the precise condition
   under which fail-open bugs are born:

> carry permission info — owner, teams, sometimes a roles field, that kind of metadata, it varies
> by source system.

3. The output is a compliance artifact: Legal will rely on the dashboard and the leak evidence,
   and the launch decision hangs on these numbers, so wrong metric semantics are not a cosmetic
   bug but false assurance:

> We launch when the numbers look good. Legal will ask "how do you know it can't leak?" and I
> want a better answer than "we tested it by hand."

## Per-area levels

- ACL normalization, identity resolution, ACL-filtered retrieval, existence suppression,
  EvalRecord/dashboard access control: **L3** (INV-1..5, INV-10, INV-12).
- Citation integrity, abstention behavior, metric semantics, revocation propagation, gateway
  constraint: **L2** (INV-6..9, INV-11).
- Answer formatting, UI presentation, dashboard layout: **L1** — but they ship inside L3 slices
  where they touch the deny path.

The plan's Final level is the maximum: **L3**.
