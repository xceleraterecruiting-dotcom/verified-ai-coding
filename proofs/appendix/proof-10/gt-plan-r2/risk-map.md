# Risk map

## Risk classification
Initial classification: L3
Final level: L3

## Justification

The core of this system is an access-control boundary between an AI retrieval pipeline and
confidential corporate material — HR data, unannounced M&A, exec-only memos — with an explicit
compliance audience. The spec's own words establish the stakes:

> The non-negotiable: people have different access.

> the same engineer asking about the unannounced acquisition memo should get nothing, not even a
> hint the memo exists.

> Legal will ask "how do you know it can't leak?" and I want a better answer than "we tested it by
> hand."

A leak of an unannounced acquisition memo is a material-nonpublic-information event with
regulatory exposure (securities/insider-trading territory), not merely an embarrassing bug; HR
policy answers touch employee personal-data handling. The permission boundary is enforced inside a
probabilistic retrieval+generation pipeline fed by heterogeneous, sometimes-absent ACL metadata —
exactly the conditions under which silent default-open failures happen. That combination
(private/regulated-adjacent data + AI-generated user-visible output + a launch decision a legal
function will rely on) places the leak path and non-existence semantics at L3.

Per-area levels:
- ACL normalization, permission-filtered retrieval, non-existence semantics (Slices 1–3): **L3
  path** (INV-1, INV-2 are tagged L3; INV-3, INV-6, INV-14 support it at L2).
- Grounded generation, citations, decline, surface hygiene (Slice 4): **L2** — AI-generated
  output reaching employees with HR-policy consequences.
- Traceability, audit, eval harness, canaries, dashboard/launch gate (Slices 5–8): **L2** — the
  evidence system a consequential go/no-go decision and a legal attestation will rely on.

Escalation note: a pure internal Q&A bot without the access boundary would be L2 (AI output +
user data). The "not even a hint" non-existence requirement plus the MNPI/exec corpus and the
legal attestation requirement drive the maximum to L3. Final equals Initial; no downgrade.
