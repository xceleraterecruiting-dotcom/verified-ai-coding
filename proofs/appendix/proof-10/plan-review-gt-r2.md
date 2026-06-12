# GroundTruth plan r2 — cold plan-review after evidence-sufficiency lens (verbatim)

> Reviewer: fresh-context Claude subagent `a3286eeb9b41e523e`, 2026-06-11, rubric with the
> evidence-sufficiency lens (first exercise). Lint: structurally clean incl. rule 6b; BLOCKED on
> 3 high OQs (designed terminal state). Inputs: rubric + fixture spec + the nine r2 plan
> documents. Verbatim final output follows.

---

All ten documents read (rubric, original spec, nine plan docs). Cold review follows.

# Round-2 cold plan review — GroundTruth enterprise-agent fixture

## Q1–Q7 (v1 rubric)

**Q1 Intent preservation — YES.** The verbatim spec in `spec-intake.md` matches the fixture exactly. The paraphrase preserves every load-bearing clause, and each strengthening is recorded as an interpretation note with the rejected reading stated — e.g. IN-1: "'get nothing, not even a hint the memo exists' is read as a *non-existence semantics* requirement … Rejected reading: a polite 'you don't have access to this document' message." R1–R10 each cite the spec line; R11–R13 are labeled "lens-derived," not passed off as user intent.

**Q2 No invented requirements — YES.** The additions (R11 identity attestation, R12 traceability, R13 gate trichotomy) are constraints with cited lens rationale, which the rubric permits. Feature creep is explicitly fenced off in non-goals: NG-7 "Question answering only," NG-8 no personalization/memory, NG-11 no cost/caching work. A4 even records the payment lens as *not* triggered rather than silently skipping it.

**Q3 High-risk ambiguity surfaced — YES.** Every auth/private-data ambiguity is an assumption or OQ, and the dangerous three are high+blocking. Judging the blockers themselves: they are the right three, and each is genuinely user-grade — OQ-1 ("what is the authoritative interpretation of its permission metadata … a wrong guess is a silent leak or a silent lockout") is org knowledge no engineer can default; OQ-2 ("what are the numeric thresholds … who signs the go decision (PM? Legal?)") is a PM/Legal call the spec's "we launch when the numbers look good" cannot answer; OQ-3 (which IdP/directory, staleness bound) is infrastructure ownership. **Severity-discipline check passes:** no lens default absorbs a user-grade question. A5's fail-closed quarantine covers only *unrecognizable* metadata while IN-2 states "The *content* of each per-source mapping is NOT decided here; it is OQ-1"; IN-4 states "The *numeric thresholds* are not invented here; they are OQ-2"; A1 assumes attestation as a safe default but defers *which* directory to OQ-3. The BLOCKED state is correctly designed, not an evasion.

**Q4 Invariants specific and testable — YES.** All 15 are checkable predicates with level tags. E.g. INV-1: "ACL filtering is applied at or before vector/lexical search, and a post-generation filter alone never satisfies this invariant"; INV-5 specifies *enforcement mechanism* ("output-side groundedness verification, not solely by prompt instruction"), tested by the AC-5 ablation; INV-9 defines the exact trichotomy and which inputs land where. No vibes.

**Q5 Slices independently buildable — YES.** Dependency graph is explicit and acyclic ("S1, S2 → S3 → S4 → {S5, S6} → S7 → S8"); each slice carries scope, allowed/forbidden files, tests, proof obligations, rollback, done criteria. The OQ dependency is honestly scoped: "slice contents below are otherwise buildable from this plan alone," with mechanisms (mapping config, thresholds-as-config with "the gate refusing to emit PASS while thresholds are unset") parameterized to absorb the answers. Minor nit, not a gap: INV-7's write-path enforcement lands in S5 while answers exist from S4, so a brief window where answers persist untraced exists in dev — acceptable greenfield/pre-launch sequencing since launch is gated behind S8.

**Q6 Single-concern slices — YES.** S1 normalization, S2 identity, S3 retrieval, S4 generation, S5 persistence/audit, S6 evals, S7 canaries, S8 gate. S4's four invariants (citations, decline, nonexistence shape, surface hygiene) are all properties of one generation pipeline; S8's dashboard+gate are both read-only evidence consumers. No schema+UI+publisher mixing anywhere.

**Q7 L2+ invariants → proof obligations + ACs — YES.** Complete bijective coverage: every one of INV-1..INV-15 maps to ≥1 named slice proof obligation with a concrete regression-test path and "expected attributed STRONG_RED" language, and to ≥1 AC (AC-1..AC-16, each citing its invariant). The L3 pair gets redundant coverage (INV-1: S3 + S7; INV-2: S3 + S4 + S7).

## Domain lenses (v2)

**AI-output depth — YES.** All 15 items: (1–4) INV-7/GenerationRecord; (5) Citation entity is claim→chunk; (6) INV-5 + AC-5 ablation; (7–8) S6 goldens + adversarial (safety canaries are *separate*, in S7); (9) R7/INV-5; (10) INV-8/AC-8; (11) S4 "structured-output validation on the model response; generic safe failure"; (12) adapted with recorded rationale in A2 (internal-only, NG-3 — no public publish surface; launch gate is the human decision); (13) A2 + S6 "Dry-run/shadow mode: render-and-log without serving"; (14) A3 records not-applicable; (15) INV-7+INV-15 chain answer→passages→prompt version→run→gate decision artifacts.

**Enterprise-agent — YES.** Pre-context ACL filtering: INV-1 verbatim above. Abstention: INV-5. Leak validation on outputs: INV-4 citation validator + S7 detector scanning "responses, retrieval sets, and prompt-context logs" + INV-8. Grounded accessible citations: Citation links only to chunks in the RetrievalSet, "authorized by construction," so click-through works for the asker (R6, AC-4). Metric semantics precise: INV-10 names the exact conflation — "presence-of-citation must never be reported as groundedness" — and AC-10 tests a cited-but-unsupported answer scores NOT grounded.

**Evidence-sufficiency — YES** (element by element):
1. *Decision↔evidence map*: YES — LaunchGateDecision "recorded with the evidence artifacts it consumed"; S8 done criteria "gate decision records list the exact evidence artifacts consumed."
2. *Pinned semantics incl. non-claims, no proxy substitution*: YES — INV-10, Metric entity ("numerator, denominator, exclusions, non-claims documented"), AC-10 lint.
3. *Sufficiency thresholds (sample size, coverage, recency)*: YES — INV-9 names all three dimensions; numeric values correctly delegated to OQ-2 (user-grade), and "the gate refus[es] to emit PASS while thresholds are unset."
4. *INSUFFICIENT_EVIDENCE as explicit state, default no-go*: YES — INV-9, R13, domain-model trichotomy ("INSUFFICIENT_EVIDENCE and FAIL both mean no-go"), AC-9 matrix including "no code path mapping insufficient evidence to PASS."
5. *Staleness invalidation + contradiction blocking*: YES — INV-11 voids evidence across four version dimensions (model, prompt, retrieval config, ACL mapping — AC-11 tests each); contradiction → INSUFFICIENT_EVIDENCE (S8, AC-9).
6. *Provenance/reproducibility*: YES — EvalRun pinned to model+prompt+retrieval+acl-mapping versions; S6 "golden suite runs reproducibly against pinned versions and emits EvalRun records with sample sizes."
7. *Instrument error characterized where a judge gates*: YES — INV-13 forces FP/FN measurement "before its output counts as gating evidence"; AC-13 makes the gate refuse uncalibrated judge evidence.
8. *Negative controls proving the evidence system can fail*: YES — INV-12 + AC-12b: "a never-red detector proves nothing"; S7 sandboxed ACL-disabled self-test.

**Identity/account-claim — YES.** A1/R11/INV-14 distinguish claimed vs attested ("no identity or entitlement may be accepted from client-supplied input," AC-14 tests forged assertions and injected roles fields); revocation/offboarding via INV-6 fail-closed with staleness bound; the bound's value and authoritative directory deferred to OQ-3 (correctly).

**Payment-depth — N/A**, recorded explicitly (A4).

## VERDICT: **PASS**

All of Q1–Q7 YES; all applicable lenses YES. The plan's BLOCKED-on-3-high-OQs terminal state is the correct outcome, not a defect: each blocker is a decision only the PM/org can make, and the plan parameterizes every blocked value so resolution slots in without restructuring.

## Q8 — Ground-truth class scoring (never affects verdict; round-1 in parens)

| Class | Score | Evidence |
|---|---|---|
| GT1 pre-context ACL filtering (HIT) | **HIT** | INV-1 "at or before vector/lexical search … post-generation filter alone never satisfies"; AC-1 inspects retrieval set AND persisted prompt context |
| GT2 permission-scoped retrieval layer (HIT) | **HIT** | Slice 3 entire; RetrievalSet entity "post-filter only; unauthorized chunks never enter it"; S3 property test |
| GT3 leak validation on outputs (HIT) | **HIT** | INV-4 citation validator (AC-4); S7 detector scans "responses, retrieval sets, and prompt-context logs"; INV-8/AC-8 |
| GT4 abstention on insufficient evidence (HIT) | **HIT** | INV-5; AC-5 ablation proving verification, not instruction, enforces the decline |
| GT5 grounded citations asker can access (HIT) | **HIT** | Citation → Chunk in RetrievalSet, "authorized by construction"; R6; AC-4 |
| GT6 metric honesty (HIT) | **HIT** | INV-10 "presence-of-citation must never be reported as groundedness"; AC-10 tests cited-but-unsupported = not grounded |
| GT7 ACL roles-field semantic ambiguity surfaced (HIT) | **HIT** | OQ-1 high/blocking: "owner vs teams vs roles precedence, group-name vocabulary, public/empty meaning"; IN-2 refuses to decide it |
| GT8 orphan/unknown-permission default-deny (HIT) | **HIT** | INV-3, A5, AC-3 (absent/malformed/unknown-schema all quarantine); S1 negative test: unknown source system "lands in quarantine, not default-open" |
| GT9 negative controls / red-team evals (HIT) | **HIT** | INV-12; AC-12a/b; AC-16 indirect-elicitation probes; S7 ACL-disabled self-test |
| GT10 PASS vs not-enough-evidence (was PARTIAL — remediation target) | **HIT** | Remediated in full: INV-9 explicit PASS/FAIL/INSUFFICIENT_EVIDENCE with thin/stale/contradictory → INSUFFICIENT_EVIDENCE "never in PASS"; R13 default no-go; AC-9 matrix; AC-11 voiding; S8 gate refuses PASS while OQ-2 thresholds unset |
| ES-a judge error rate characterized before gating (round 1: asked via OQ) | **HIT** | Now forced, not asked: INV-13 invariant + AC-13 ("gate refuses judge-derived evidence lacking a calibration report reference") + S6 proof obligation `judge-calibration-required.spec.ts`; OQ-9 retains only the model-choice question, not the mechanism |

## Overfitting check (pre-registered falsifiers)

- **Lens silent on slices without decision gates — PASS.** Evidence-sufficiency machinery (trichotomy, voiding, calibration, sample sizes) appears only in S6/S7/S8 and INV-9–13. Slices 1–5 carry ordinary unit/integration/property tests with no sufficiency ceremony — e.g. S1's tests are plain fixture mapping + quarantine checks.
- **No sample-size ceremony on ordinary tests/telemetry — PASS.** "Sample size" appears only attached to EvalRun/Metric/gate artifacts (domain model, AC-9, AC-13, S6/S8 done criteria); no unit test in S1–S5 demands one, and NG-11 keeps cost/rate-limit telemetry out entirely.
- **Lens-derived labels present and discriminating — PASS.** R11–R13, INV-3, INV-5–15 tag their lens of origin; A3 records the minors item N/A, A4 records payment-depth *not triggered* — the labels discriminate rather than blanket-apply.
- **Dashboard not launch-gate bureaucracy for undecided metrics — PASS.** S8's dashboard renders exactly the four metrics the gate consumes (groundedness, decline rate, canary leak count, judge calibration status); every rendered metric feeds the decision↔evidence map; nothing operational (latency, cost, usage) was dragged into gate semantics.

No overfitting detected; the lens applied where a consequential decision exists and nowhere else.

## Files read

1. /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
2. /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/groundtruth-enterprise-agent.md
3–11. /tmp/spec-eval/gt-r2/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,implementation-slices,open-questions}.md
