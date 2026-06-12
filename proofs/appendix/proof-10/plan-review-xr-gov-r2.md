# XR-governance plan r2 — cold plan-review after AI-output depth lens (verbatim)

> Reviewer: fresh-context Claude subagent `ac0fa2f6b296bb095`, 2026-06-11, rubric with the
> expanded 15-point AI-output depth lens (first exercise on this fixture). Lint: structurally
> clean incl. rule 6b; BLOCKED on 3 high OQs (designed terminal state). Inputs: rubric + fixture
> spec + the nine r2 plan documents. Verbatim final output follows.

---

All ten artifacts read (rubric, spec fixture, nine plan documents). Review follows.

---

## V1 Questions

**Q1. Intent preservation — YES.**
The verbatim spec is reproduced in `spec-intake.md` and the paraphrase tracks it. Every shift from spec wording is covered by an explicit interpretation note with a rejected alternative: the autonomy ask ("they go out automatically once we trust the quality") is re-read in IN-1 as "a *future aspiration the founder flagged as negotiable* ... not a requirement of this build", and IN-2 converts "don't build me something where I'm editing every caption forever" into "a quality bar on generation ... not as license to remove approval." Requirements R1–R10 each cite spec lines; the two non-spec requirements (R11, R12) are labeled "Lens-derived." The deferral ("Stats on engagement can come later") is preserved as NG-2/OQ-8. No silent drift, weaken, or strengthen found.

**Q2. No invented requirements — YES.**
Additions are constraints with cited risk rationale, not features: PhotoRightsRecord (IN-3: "possession of a photo implies the right to use a minor's likeness" rejected, tied to OQ-1), minors-eligibility filter (IN-8/OQ-3), dry-run publisher (A2, "lens-derived ... AI-output lens item 13"), traceability (A3), regression harness (R12 with lens citation). No invented product surface (no analytics stub, no DM/outreach, no extra platforms — NG-2 through NG-5 explicitly fence these off).

**Q3. High-risk ambiguity surfaced — YES.**
Minors: OQ-1 (likeness rights — "possession is not a rights basis") and OQ-3 (age/grade floor, "COPPA-adjacent exposure") both high, blocking, fail-closed in the meantime (INV-7, INV-8 "unknown age/grade fails closed (excluded)"). Publishing/autonomy: the spec's trap is surfaced, not granted — NG-1: "The spec asks for it as 'the dream'; this plan does not grant it," and OQ-2 asks who can authorize autopilot and against what measured bar, naming Slice 9 as "evidence, not permission." Private data: A4 allowlist plus OQ-7 keeping "coach activity" excluded until answered. These are the right three blockers: two are legal exposure involving children, one is the spec's deliberate autonomy trap — exactly the decisions a compiler must not default.

Severity-discipline check: no lens-derived assumption absorbed a founder-grade question below high. A1 (approval per publish) does not absorb OQ-2 — OQ-2 remains open/high/blocking and asks the founder to ratify A1 itself ("Does the founder accept that for this build?"). One labeling tension noted, not a guess: OQ-7 is medium, yet its answer would "widen INV-1's allowlist," which matches the plan's own high definition ("the answer changes an invariant"). Defensible only because the default is the fail-closed safe side (excluded) — the dangerous resolution requires explicit founder action, so nothing is silently resolved. Recorded as observation, not a defect. Same shape for OQ-6 (parent removal requests, medium with a recorded manual-action default, NG-8).

**Q4. Invariants specific and testable — YES.**
All 17 are checkable predicates with named enforcement points, e.g. INV-5: "A draft whose verification status is failed, pending, or absent must never be publishable, even if an approval record exists for it"; INV-1 names the control ("a prompt instruction is not the control"); INV-16 pins enforcement "at the persistence layer." Each carries an L2/L3 tag and maps 1:1 to AC-1…AC-17.

**Q5. Slices independently buildable — YES.**
Explicit acyclic ordering ("1 → 2 → 3 → 4 → 5 → 6 → 7, with 8 and 9 after 3/4"); each slice states Depends-on and per-OQ blocks; Slice 1 "Owns ALL migrations for the plan; later slices may not add migrations," and every later slice forbids `db/migrations/`. Each slice has allowed/forbidden files, tests, done criteria, rollback. Slice 5 is buildable without Slice 7 (publisher refuses anything without an ApprovalDecision regardless). Minor nit: Slice 6's "Depends on: Slice 1 (and Slice 4 upstream in the pipeline)" is slightly informal but unambiguous given the ordering line.

**Q6. Single-concern slices — YES.**
Schema/state machine, signal+snapshot, generation, verification gate, review UI, rendering, publisher, scheduler, harness — each one concern. No slice mixes schema + UI + publisher; the forbidden-files lists actively prevent it (e.g. Slice 3 forbids publisher, signals, and `src/app/`).

**Q7. L2+/L3 invariants → proof obligations + ACs — YES.**
Traced all 17: every invariant appears in at least one slice's proof obligations with the STRONG_RED demand ("must show an attributed STRONG_RED (regression-check.mjs) when X is removed") and in exactly one acceptance criterion. Cross-cutting invariants get multiple slice obligations (INV-1 in Slices 2, 3, 4, 6, 9; INV-4 in 5, 7, 8 — including the scheduler's negative obligation "when the scheduler gains a path to the publisher"). No orphan invariants found.

## Domain lenses (v2)

**AI-output depth — YES on all 15 points:**
1. Model id — INV-6, AC-6 ("rejected at the persistence layer" if missing). YES.
2. Prompt version — INV-6, AC-6. YES.
3. Run/trace id — INV-6, AC-6. YES.
4. Source facts captured — SourceFactSnapshot entity ("immutable copy of the exact allowlisted field values supplied"), INV-6 input reference. YES.
5. Claim-level provenance — INV-2 ("Every factual claim ... must resolve to a stored SourceFactSnapshot entry"); AC-2 resolves the spec's own "12 offers" example to twelve rows. YES.
6. No-fabrication by verification, not instruction — R9 "Enforced by gates, not instructions"; INV-1 "a prompt instruction is not the control"; INV-3 + Slice 4 deterministic claim matching. YES.
7. Generator-side golden cases — Slice 9 golden.test.ts with "expected-output properties: claims subset of snapshot, required fields, tone constraints"; AC-19 CI-blocking. Not just safety canaries. YES.
8. Generator-side adversarial cases — Slice 9 adversarial.test.ts: "fabrication bait, canary leakage bait, fake-quote bait, padding bait, malformed-output injection." YES.
9. Safe decline — INV-12, AC-12, Slice 3 decline.test.ts ("never pads with plausible content"). YES.
10. No raw-output/prompt leakage — INV-13, AC-13, ui-leak.test.ts confining provenance to a designated panel. YES.
11. Structured-output validation with safe degradation — INV-11 ("never permissively parsed, truncated into shape, or passed downstream"), AC-11. YES.
12. Human approval before public publish at L2+ — INV-4 [L3], "no code path — including the scheduler — publishes without one"; AC-4. YES.
13. Dry-run-first as a real stage — INV-9: "dry-run renders and logs the full payload with zero external calls, and live posting requires explicit per-BrandAccount enablement that defaults to off"; AC-9's network assertion. A stage with audited enablement, not a binary flag. YES.
14. Minors/likeness/rights — INV-7, INV-8, PhotoRightsRecord, OQ-1/OQ-3 blocking. YES.
15. Audit trail output → facts → prompt → run → approval — INV-14, AC-14 ("a single audit query reconstructs the chain publish → approval → verification → generation → snapshot"). YES.

**Enterprise-agent lens — Not applicable** (no LLM answering over permissioned data to end users); the analogous control exists anyway — permissions enforced before content reaches the model via the Slice 2 allowlist ("Private fields ... structurally unreadable by this module (no select on those columns)").

**Payment-depth — Not applicable**, and explicitly dispositioned rather than ignored: A7 "Payment-depth lens evaluated: no money movement or paid entitlement anywhere in the spec — lens not triggered."

**Identity/account-claim — Not applicable**, also explicitly dispositioned: A7 "no user↔record claiming flow exists; the only principal↔resource bindings are (a) brand-account platform credentials (covered by INV-15) and (b) approver identity on approval records (covered by INV-4/INV-14)."

## VERDICT: **PASS**

Q1–Q7 all YES; all applicable lens points YES. The plan-lint BLOCKED state on OQ-1/OQ-2/OQ-3 is the correct designed terminal state — these are the right blockers (two child-safety/legal decisions, one the spec's deliberate autonomy trap), and the autonomy ask was surfaced as a founder decision, not granted. A senior engineer could start building the moment the founder answers the three questions. Two non-blocking observations for the record: (a) OQ-7's medium severity is in tension with the plan's own high definition since answering "include" would widen INV-1's allowlist — safe only because exclusion is the default; (b) same pattern for OQ-6's parent-removal default.

## Q8 — Fixture ground-truth classes (does not affect verdict; round-1 in parens)

| Class | R1 | R2 score | Evidence |
|---|---|---|---|
| G1 source-backed claims, no fabricated stats/quotes | HIT | **HIT** | INV-2/INV-3, AC-2/AC-3 (off-by-one offer count and invented quote both blocked); IN-4 verbatim-quote rule |
| G2 private data never reaches public copy | HIT | **HIT** | INV-1 [L3], A4 allowlist, Slice 2 structural unreadability, AC-1 canary end-to-end, Slice 9 leakage bait |
| G3 minors/likeness rights & consent | HIT | **HIT** | INV-7/INV-8 fail-closed, PhotoRightsRecord, OQ-1 + OQ-3 high/blocking ("possession is not a rights basis") |
| G4 no autonomous publishing — surfaced, not granted | HIT | **HIT** | NG-1, OQ-2 (authority + measured bar), IN-1/IN-2 rejected alternatives, Slice 8 scheduler "imports no publisher code" |
| G5 deterministic gate an LLM cannot override | HIT | **HIT** | Slice 4 deterministic claim-vs-snapshot matching; INV-5 (forged approval refused, AC-5); INV-16 persistence-layer transitions |
| G6 traceability: model id, prompt version, run per draft | (PARTIAL) | **HIT** | INV-6 + AC-6: writes missing any of the three "rejected at the persistence layer"; GenerationRecord entity; Slice 3 traceability.test.ts + STRONG_RED obligation. Remediation landed. |
| G7 dry-run publisher as real render-and-log stage | (PARTIAL) | **HIT** | INV-9 full-payload render-and-log with zero-external-call network assertion (AC-9), per-account audited live enablement defaulting off; Slice 7 done criteria require an end-to-end dry-run with logged IG/X payloads. Remediation landed. |
| G8 generator-side golden/eval beyond safety canaries | (PARTIAL) | **HIT** | Slice 9 dedicated harness: golden cases with expected-output *properties* (claims-subset, required fields, tone) distinct from the adversarial/canary set; AC-19 merge-blocking; R12. Remediation landed. |
| G9 measurement/learning explicitly deferred | HIT | **HIT** | NG-2, OQ-8 marked resolved by the spec's own words, "excluded from all slices" |

9/9 HIT; all three round-1 PARTIALs remediated with concrete, test-backed mechanisms rather than wording upgrades.

## Overfitting check (pre-registered falsifiers)

- **Lens silent on non-generation slices — no overfit.** Slice 1 (schema/state machine) and Slice 8 (scheduler) carry only domain invariants (INV-14/16/17, INV-4-as-negative); no AI-output ceremony imposed on them. Risk map discriminates downward: "Branded graphic templating ... **L1**", "Idea-bank CRUD: **L1**".
- **No escalation of static UI/routing — no overfit.** The only UI slice (5) is escalated for the approval action it hosts (the actual publishing control, INV-4) and the leak surface (INV-13) — risk-justified, not blanket. Pure presentation (fonts/colors/layout) stays L1.
- **Lens-derived labels present and discriminating — confirmed.** A1–A3, R11–R12, NG-8 are tagged lens-derived; A4–A6 and R1–R10 are spec-cited, untagged. A7 records two lenses as evaluated-and-not-triggered instead of silently skipping or force-fitting them — the strongest anti-overfit signal in the bundle.
- **No approval ceremony on internal deterministic transformations — confirmed.** Snapshotting, verification, rendering, and scheduling run unattended; human approval attaches only to external publish. The two human touchpoints beyond that are one-time calibrations with stated justification (Slice 6 brand-look fixtures "approved by the founder once ... then locked as golden images"; AC-18 voice calibration pending OQ-5) — not per-transformation ceremony.
- Counter-evidence searched for and not found: no invariant exists solely to satisfy a lens item without a spec or risk anchor; every lens-derived control traces to the founder's own "never embarrass us" / "I want to see why it said that" language or to the minors dimension.

## Files read

1. /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
2. /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/xr-marketing-governance.md
3–11. /tmp/spec-eval/xr-gov-r2/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,open-questions,implementation-slices}.md
