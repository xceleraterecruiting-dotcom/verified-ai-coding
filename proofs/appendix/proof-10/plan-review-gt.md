# GroundTruth plan — cold plan-review (verbatim)

> Reviewer: fresh-context Claude subagent `afae536df14f7eb7d`, 2026-06-11, rubric v2 (both
> domain lenses exercised; identity lens judged applicable to principal↔entitlement binding).
> Inputs: rubric + fixture spec + the nine plan documents (listed at end). Verbatim final output
> follows.

---

All eleven files read (rubric, original spec, nine plan documents). Review follows.

---

## V1 Questions

**Q1 Intent preservation — YES.**
The verbatim spec in `spec-intake.md` matches the fixture word-for-word. The paraphrase is faithful, and every place a reading was chosen carries an interpretation note with the rejected alternative: existence-suppression ("denial must be indistinguishable from absence… Rejected the narrower reading 'just don't show the content'"), metric semantics ("two metrics with **pinned, mutually consistent semantics**… Rejected the reading that any plausible-looking aggregate satisfies"), and the Legal requirement ("interpreted as a requirement for an automated, repeatable leak-verification suite… Rejected the reading that the dashboard alone satisfies Legal"). The one strengthening (leak suite, R10) is explicitly noted and grounded in the spec's own words ("better answer than 'we tested it by hand'"). No drift found.

**Q2 No invented requirements — YES.**
R11 (EvalRecord capture) is derived infrastructure for R9/R10 with a stated chain; INV-10/A6 (dashboard must not itself leak) is a surfaced constraint with risk rationale, not a feature. Non-goals correctly excludes things a careless compiler might invent (connectors, multi-turn, Slack, redaction, automated launch gate). Nothing in requirements lacks a spec citation.

**Q3 High-risk ambiguity surfaced — YES.**
The three BLOCKED high-severity OQs are exactly the right ones for this spec: OQ-1 ("what exactly do `owner`, `teams`, and `roles` grant per system… does an absent `roles` field mean unrestricted or restricted?… guessing here is exactly how a leak ships"), OQ-2 (identity source of truth and membership propagation), OQ-3 (revocation staleness, with the exec-material live-verification question). Each names the invariants/slices it changes. Lower-stakes ambiguities (OQ-4 index exclusion, OQ-6 dashboard viewers, OQ-7 multi-turn leak surface, OQ-8 groundedness measurement method and its own error rate) are surfaced rather than guessed, and the dangerous interim default is pinned fail-closed (A2/INV-3), not fail-open. The BLOCKED terminal state is correct behavior, not a defect.

**Q4 Invariants specific and testable — YES.**
All twelve are checkable predicates with level tags. E.g. INV-3: "normalization status other than `normalized` means deny-all"; INV-7: "every citation must reference a document that was in that query's ACL-filtered RetrievalSet"; INV-9: "the groundedness rate's denominator is non-declined answers only". No vibes.

**Q5 Slices independently buildable — YES.**
Dependencies are explicit and acyclic ("Slices 1 and 2 are independent of each other; everything else is ordered"; each slice lists "Depends on"). Each slice has allowed/forbidden file boundaries, its own tests, rollback notes with leak-direction reasoning ("Fail-closed on revert: with no retrieval, the assistant declines everything — degraded, never leaky"). Slice N never references N+1's artifacts.

**Q6 Single-concern slices — YES.**
One concern per slice: ACL normalization / identity / retrieval / answer / capture / dashboard / probes. Minor note: Slice 4 owns both `src/answer/` and `src/gateway/`, but the gateway client exists only to serve the answer path and INV-11 is tested there; cohesive, not a mixed concern.

**Q7 L2+ invariants → proof obligations — PARTIAL (recorded rationale).**
INV-1 through INV-10 and INV-12 each map to a named regression-test proof obligation flagged for attributed STRONG_RED plus a matching AC (INV-1→Slice 4 `prompt-containment.test.ts`/AC-1; INV-3→Slice 1 `fail-closed.test.ts`/AC-3; INV-5/6→Slice 3 `acl-filter`/`revocation`/AC-5,6; INV-9/10→Slices 5–6/AC-9,10; INV-12→Slice 7 `harness-detects-leak.test.ts`/AC-12). The one gap: **INV-11 (L2, gateway-only)** has AC-11 and a required test in Slice 4 ("network-recording test shows no non-gateway model-provider calls") but is absent from Slice 4's proof-obligations block — it never gets a named STRONG_RED artifact. Concretely fixable; does not undermine the rest of the mapping.

## V2 Domain lenses

**Enterprise-agent lens — YES (all five elements present).**
- Pre-context ACL filtering: INV-1 + INV-5 ("ACL filtering must be applied server-side within the retrieval query itself… post-filtering by the LLM, the prompt, or the client must never be the enforcement mechanism"), proven by AC-1 prompt capture and AC-5 query-shape inspection.
- Abstention: INV-8, AC-8, Slice 4 abstention tests.
- Leak validation on outputs: AC-2 byte-equivalence, AC-7 ("out-of-set citation is rejected before the response is sent"), Slice 7 existence-hint probes against the real path.
- Grounded citations the asker can access: INV-7 forces citations ⊆ the ACL-filtered RetrievalSet — accessibility by construction; AC-13 verifies click-through.
- Metric semantics stated precisely: INV-9/AC-9 pin numerators and denominators ("a decline must never be counted as a grounded answer"), and OQ-8 demands the groundedness method's "own error rate characterized for Legal".

**Identity/account-claim lens — applicable (principal↔entitlement binding), YES.**
There is no user-claims-a-record flow, but principal-to-entitlement binding is the load-bearing identity question here, and the plan handles claimed-vs-verified explicitly: INV-4 ("client-supplied identity, team, or role claims must never influence an access decision"), A3 (principal from authenticated session only), AC-4 forged-claims probe, OQ-2 explicitly invoking "identity lens: verified control required", and reassignment-after-binding covered by INV-6 + OQ-3 revocation propagation.

**Risk escalation honesty (requested judgment):** honest. All three escalation grounds quote the spec verbatim (MNPI existence-suppression, heterogeneous ACL metadata as "the precise condition under which fail-open bugs are born", dashboard as compliance artifact = "false assurance"), the per-area table doesn't blanket-inflate (formatting stays L1), and escalation-only direction is noted.

---

## VERDICT: **PASS**

Q1–Q7 all YES except Q7 PARTIAL with recorded rationale; no NO on Q1/3/4/7; both applicable lenses YES. The plan's terminal BLOCKED state on OQ-1/2/3 is the designed, correct outcome. One non-blocking revision recommendation: add INV-11/AC-11 as a named proof obligation (STRONG_RED artifact) in Slice 4.

---

## Q8 — Ground-truth class scoring (does not affect verdict)

| Class | Score | Plan evidence |
|---|---|---|
| GT1 pre-context ACL filtering | **HIT** | INV-1; AC-1 (prompt capture, "assert zero occurrences… in the prompt"); Slice 4 `prompt-containment.test.ts` |
| GT2 permission-scoped retrieval layer | **HIT** | INV-5 ("within the retrieval query itself"); AC-5 query-logging + disabled-post-filter test; Slice 3 query-shape test |
| GT3 leak validation on outputs | **HIT** | AC-2 byte-equivalence; AC-7 out-of-set citation rejected pre-send; Slice 7 existence-hint probes on real answer path |
| GT4 abstention | **HIT** | INV-8; AC-8; Slice 4 abstention tests ("declines contain no fabricated citations") |
| GT5 grounded citations asker can access | **HIT** | INV-7 (citation ⊆ ACL-filtered RetrievalSet ⇒ asker-accessible by construction); AC-7; AC-13 click-through |
| GT6 metric honesty | **HIT** | INV-9 pinned denominators; AC-9 ("a decline can never increment the grounded numerator"); R9 groundedness defined as *supported by* cited docs (not mere citation presence); OQ-8 method + error-rate |
| GT7 ACL semantic ambiguity (roles field) | **HIT** | OQ-1 names the exact field ("does an absent `roles` field mean unrestricted or restricted?"), high-severity, BLOCKED; intake interpretation note rejects ad-hoc checking |
| GT8 orphan/unknown default-deny | **HIT** | INV-3; A2; AC-3 (missing/malformed/unknown-schema fixtures, "returned to no principal — including an admin-like principal"); Slice 1 `fail-closed.test.ts` |
| GT9 negative controls / red-team evals | **HIT** | Slice 7 probe matrix (cross-team, exec-only, missing-metadata, forged-identity, existence-hint) plus the seeded-leak harness self-test ("guards against a vacuously green suite") — a true negative control |
| GT10 launch gates PASS vs not-enough-evidence | **PARTIAL** | OQ-5 asks for "required probe-suite history" and OQ-8 for the grounding method's error rate, and the launch call is explicitly human (non-goals) — but nothing requires the dashboard or gate to *represent* an "insufficient evidence" state (minimum query N, eval-set coverage) distinct from good numbers |

**Miss category for GT10 (PARTIAL):** (1) compiler prompt gap — the compiler pins metric *semantics* but has no prompt-level instruction to demand evidence-*sufficiency* conditions (sample size / coverage floor) wherever a launch decision consumes metrics; OQ-5 brushes it but the plan never makes "not enough data ≠ good numbers" an invariant or AC.

---

## Unscored observation — model output/schema robustness

Partially addressed. Citation-id hallucination in structured output **is** covered: AC-7/Slice 4 validate every citation id against the logged RetrievalSet and reject out-of-set citations before the response is sent. But general malformed-model-response handling (unparseable gateway output, schema-violating responses, missing decline/answer discriminator) has no invariant, test, or specified fallback behavior — nothing states that a malformed response must degrade to a decline/error rather than passing through. A reasonable hardening item for Slice 4.

## Files read

1. /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
2. /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/groundtruth-enterprise-agent.md
3–11. /tmp/spec-eval/gt/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,implementation-slices,open-questions}.md
