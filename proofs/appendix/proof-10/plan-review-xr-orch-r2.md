# XR-orchestration plan r2 — cold plan-review after AI-output depth lens (verbatim)

> Reviewer: fresh-context Claude subagent `ae2dda1170d85294d`, 2026-06-11, rubric with the
> expanded 15-point AI-output depth lens. Lint: structurally clean incl. rule 6b; BLOCKED on 3
> high OQs (designed terminal state). Inputs: rubric + fixture spec + the nine r2 plan documents.
> Verbatim final output follows.

---

# Cold Plan Review — XR offer-draft orchestration, Round 2

## Q1 — Intent preservation: **YES**

The verbatim spec is reproduced in `spec-intake.md` and the paraphrase tracks it clause-for-clause. Every place the compiler moved beyond the literal text carries an interpretation note: IN-1 ("one draft per verified offer… Rejected alternative: aggregating"), IN-4 (item-level atomicity, with the rejected whole-batch reading explicitly noted as contradicting "I don't want the whole batch dying"), IN-5 ("presentable" read as sanitization "not merely a formatting preference"). The one genuine strengthening — R10's "bounded length, with a structured cause code" — is anchored to IN-5's recorded rationale. Requirements R1–R12, R15 each cite the spec wording that forces them. No silent drift found.

## Q2 — No invented requirements: **YES**

The two additions beyond the spec, R13 (fact verification before enqueue) and R14 (golden/adversarial harness), are constraints, not features, and both are explicitly labeled "(lens-derived, AI-output #6/#11)" / "(#7/#8)" with risk rationale. Slice 4 is test-only. No invented features: no notifications (explicitly declined in non-goals: "Alerting/paging beyond the dashboard-visible run history… surfaced as a possible future want, not requested"), no backfill, no new dashboard, no approval-UI changes.

## Q3 — High-risk ambiguity surfaced: **YES** — and the three blockers are the right ones

- **OQ-1 (high, dedupe identity)** — "does the verified-offers store guarantee a stable unique id per real-world offer, or can feeds materialize the same real-world offer as multiple rows" — this is exactly the ambiguity where a wrong guess "either floods the queue… or suppresses real offers." It defines INV-2/INV-3's key and Slice 1's schema. Correct blocker.
- **OQ-2 (high, minors/likeness)** — drafts name "very likely minors" destined post-approval for public posting; the answer can add an invariant and escalate the generation area to L3 (risk-map: "This Final level is provisional on OQ-2"). The spec is silent on this; guessing would be the dangerous resolution. Correct blocker.
- **OQ-3 (high, retraction after draft)** — a state transition the spec never addresses; "a stale draft asserting a retracted offer about a minor is a publishing-integrity risk even with human review." Correct blocker.

**Severity discipline: good.** Mediums are mediums for stated reasons — OQ-6 is medium *because* "the invariant and slice boundary are written to absorb either answer"; OQ-5 is medium because "Correctness does not depend on it (dedupe is the guarantee)"; OQ-7's interim default is the fail-closed A3, not a guess. Nothing dangerous is silently resolved; nothing harmless is inflated to high to look cautious. The BLOCKED terminal state is justified.

## Q4 — Invariants specific and testable: **YES**

All 14 are checkable predicates with enforcement mechanisms named, e.g. INV-2 "enforced by an atomic storage-level uniqueness claim… not check-then-insert, and holds under two concurrently overlapping runs"; INV-7 names the verifier and adds "'We told the model not to fabricate' is not a control"; INV-9 enumerates the forbidden content classes. No vibes.

## Q5 — Slices independently buildable: **YES**

Dependency graph is explicit and acyclic ("1 → 2 → 3 → 4; 5 depends on 1–2 and may run parallel to 3–4"). Slice 2 "STUBS" generation so it does not need Slice 3 to exist; Slice 5 is read-only over Slice 1 data. Each slice has allowed/forbidden files, tests, proof obligations, rollback, and done criteria. The OQ-blocks are per-slice and explicit ("Slice 1 cannot start until OQ-1… Slice 3 cannot start until OQ-2 and OQ-3"). The placeholder-path caveat is handled honestly (A7/OQ-10 + the path-placeholder notice requiring Step 0 re-grounding).

## Q6 — Single-concern slices: **YES**

Schema (1), job shell (2), generation path (3), test harness (4), dashboard read (5). Slice 3 bundles generation + verification + enqueue, but these form one atomic item path — INV-5 requires draft+provenance+claim to commit together, so splitting them would manufacture a cross-slice transaction. Cohesive, not mixed.

## Q7 — L2 invariants → proof obligations + acceptance criteria: **YES**

Every invariant INV-1..14 has a matching AC (AC-1..14, criterion-to-invariant cited inline) and at least one slice proof obligation demanding an "attributed STRONG_RED via regression-check.mjs" with the mutation named (e.g. INV-3: "collapse key to athlete id → test fails"; INV-7: "disable verifier → test fails"). Cross-cutting invariants are proven at each layer they touch (INV-5 in Slices 1 and 3; INV-9 in Slices 2 and 5; INV-10 in 1, 2, and 5). Ship-review could demand a STRONG_RED for each.

## Domain lenses

**AI-output depth (triggers — model content about real people, public post-approval): YES.** Point by point:

| # | Point | Verdict | Evidence |
|---|---|---|---|
| 1 | model id | YES | INV-8, R11, AC-8 |
| 2 | prompt version | YES | INV-8; IN-6: "A model-call id alone is NOT sufficient" |
| 3 | run/trace id | YES | INV-8 "orchestration run id"; AC-8 |
| 4 | source facts captured | YES | INV-13, AC-13; OQ-6 fallback "store them in draft provenance directly" (Slice 3 scope) |
| 5 | claim-level provenance | YES | INV-7: "Every factual claim in an enqueued draft… matches the source verified-offer record" |
| 6 | no-fabrication by verification | YES | INV-7's explicit "not a control" line; AC-7 seeded fabricated-output fixture |
| 7 | generator-side goldens | YES | R14, Slice 4 golden suite "pinned to prompt version," AC-15 — not safety canaries |
| 8 | generator-side adversarial | YES | Slice 4: "fabrication bait (sparse facts), injection via fact fields, PII/prompt leakage probes, off-policy tone bait" |
| 9 | safe decline | YES | A3/INV-6/AC-6: "never defaulted, guessed, or silently dropped" |
| 10 | no leakage to surfaces | YES | INV-9, AC-9; Slice 5 render-half test |
| 11 | structured-output validation, safe degradation | YES | INV-11, AC-11 |
| 12 | human approval before publish | YES (legitimately scoped) | The fixture ends at an internal queue; spec design itself is the gate (INV-1, "nothing posts by itself"); risk-map maps it honestly: "satisfied by spec design (INV-1) at L2" |
| 13 | dry-run-first | YES (legitimately scoped) | Risk-map: "inapplicable here because no slice posts externally." Honest call — and the plan *de facto* stages anyway (Slice 2 stub run in staging, Slice 3 "one supervised staging run," prod schedule off until ship-review) |
| 14 | minors/likeness/rights | YES | OQ-2 high + blocking, with provisional L3 escalation in risk-map |
| 15 | audit trail | YES | INV-8 + INV-10 + INV-13 chain output → facts → prompt version → run; approval leg belongs to the existing engine (non-goal, recorded) |

**Enterprise-agent lens:** not applicable (no LLM answering over permissioned data). **Payment lens:** not applicable; risk-map states it. **Identity lens:** not applicable, and the plan argues it rather than ignoring it — "athletes are content *subjects*, not principals claiming anything" (risk-map), A5 single-founder queue. Sound reasoning.

## VERDICT: **PASS**

All of Q1–Q7 YES; the applicable lens is YES on all 15 points (12/13 by honest scoping, not evasion). The BLOCKED-on-3-OQs state is the designed terminal state, and Q3 confirms all three are genuine blockers with disciplined severities. A senior engineer could start building Slice 1 the moment OQ-1 is answered.

## Q8 — Ground-truth blocker classes (does not affect verdict)

| Class | Score | Evidence (round-1 status) |
|---|---|---|
| O1 offer-distinguishing dedupe, idempotent re-runs | **HIT** | INV-2 (atomic storage claim, concurrent-safe), INV-3 ("never collapses to athlete identity"), AC-2/AC-3, OQ-1 high, Slice 1+2 STRONG_RED POs (HIT) |
| O2 strict date validation, no silent normalization | **HIT** | INV-6/AC-6 "never defaulted, guessed, or silently dropped," A3, OQ-7; Slice 3 PO "add a date fallback → test fails" (HIT) |
| O3 no-persist-on-invalid-input | **HIT** | INV-5 + INV-6, AC-5 fault injection "at each step," AC-6; Slice 1+3 atomicity POs (HIT) |
| O4 failed runs finalize with inspectable history | **HIT** | INV-10, AC-10 (crashed distinguishable from completed and never-ran), Slice 2 crash-visibility test. Nuance: crash is "inferable (stale heartbeat / no finished-at)" rather than an actively-written FAILED status — but "never recorded as success and never invisible" satisfies the class (HIT) |
| O5 stored errors leak no internals | **HIT** | INV-9, R10, AC-9 (injected stack/prompt/secret fixture), Slice 2 + Slice 5 POs (HIT) |
| O6 per-draft provenance to offer(s) + model run | **HIT** | INV-8, R11, AC-8 ("missing any one reference is refused at enqueue") (HIT) |
| AO-a model id + prompt version + run id explicit, not deferred | **HIT** | IN-6: convention treated as "an interface to be confirmed… A model-call id alone is NOT sufficient unless the model-call record is itself specified to contain model id and prompt version"; INV-8; OQ-6 "the requirement itself stands regardless" (round 1: model-call-id-only) |
| AO-b generator-side golden/adversarial obligations | **HIT** | R14, dedicated Slice 4 with golden + adversarial suites, AC-15 CI-gated, per-invariant STRONG_RED mutations (round 1: none) |

8/8 HIT, including both round-1 observation classes.

## Overfitting check (pre-registered falsifiers)

- **Lens silent on non-generation slices: PASS.** Slice 1's lens-touched invariant is only INV-8's schema capability (refs exist and are required) — legitimate, since the schema must hold them; Slice 2 touches no lens-labeled invariant (INV-9 is spec-derived from "presentable," and the plan honestly does *not* label it lens-derived); Slice 5 demands no goldens, no fabrication checks, no provenance ceremony — just rendering and crash visibility.
- **No dashboard escalation for containing text: PASS.** Risk-map: "Dashboard surfacing of run history (Slice 5): L2 only via INV-9…; the rendering itself is otherwise low-risk internal UI." No L3 creep, no approval gate on the dashboard.
- **Lens-derived labels present: PASS.** A3 "(lens-derived, AI-output #9)", R13/R14 labeled, INV-6/7/8/11/13 each tagged with the lens point number; risk-map has an explicit lens-applicability mapping including two honest "does not trigger" rulings with reasons.
- **No approval ceremony on deterministic internals: PASS.** Slices 1, 2, 5 carry only standard tests/ship-review. The two staged-rollout touches sit exactly where risk justifies them: Slice 2's schedule "not enabled in production until Slice 3's ship-review passes" (don't run a half-built job) and Slice 3's "one supervised staging run" (model output about likely minors). No dry-run theater on the schema migration or dashboard.

No overfitting evidence found; counter-signals (unlabeled spec-derived INV-9, the declined #13, two "does not trigger" lens rulings) indicate the lens was applied judgmentally, not pattern-matched.

## Files read

- /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
- /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/xr-orchestration-offers.md
- /tmp/spec-eval/xr-orch-r2/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,open-questions,acceptance-criteria,implementation-slices}.md
