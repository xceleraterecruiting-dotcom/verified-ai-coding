# Proof 09 — First end-to-end run of the mechanized harness on a fresh change

> **Executive summary.** The updated ship-review flow ran end-to-end on a fresh risk-Level-2
> change (a traced harm path that could allow duplicate selection/payment of one child via
> duplicate registration rows) — not the historical fixture the tools were validated on. Outcome:
> an attributed STRONG_RED with 4/4 pre-declared discriminators (0 missing, 0 unexpected), a
> hashed bundle whose manifest the cold reviewer independently spot-checked, and a merge-grade
> PASS whose scorecard's `Runtime verification: NONE` explicitly blocked production-ready
> language. The new rules bit three times: missing build-gate evidence caught, an unhashed
> mutation spec caught, and verdict language constrained by the runtime field. Authored by the
> builder; the independently checkable artifacts are
> `appendix/proof-09/portal-F1-regression-result.json`, the fixture repo's
> `verification/dedup-followup/` (scorecard, manifest, mutation spec), and
> `verification/transcripts/dedup-cold-review.md` (verbatim reviewer output).

**Claim under test:** the updated `ship-review` flow (mechanical bundles, attributed mutation
specs, risk-leveled regression proof, Runtime-verification field) works on a **fresh, unknown
Level 2 change** — not just the historical portal fixture it was validated against in proof-08 —
and the new rules actually bite in practice rather than decorating the scorecard.

**Subject:** portal follow-up F1 in the Charleston Passing Academy repo — duplicate athlete rows
on registration resubmit (distinct ids defeat `@@unique(athleteId, cohortId)`: a traced harm path
that could allow one child to be selected and paid for twice; dupes also consume evaluation
capacity. Traced, never demonstrated — this code has not run in production). Recorded as a follow-up by the
proof-08-era money-path review; never previously fixed or reviewed. Risk Level 2.

## The run (commits `057330c` fix, `3915edd` artifacts, in the CPA repo)

1. **Contract first** — invariants A1–A4 / N1–N3, identity key, allowed/forbidden files, an
   explicit deferral (no DB-level unique; functional case-insensitive index unsupported by
   `db push`) with its compensating control (the dedup runs inside the event-lock transaction).
2. **Implementation** — plan/lookup/create split in `registerForEvaluation`; 7 new tests; gates
   95/95 + typecheck + build green.
3. **Attributed mutation spec** — `findingId: portal-F1`, invariant stated, **4 expectedTests
   declared before running**. `regression-check` returned STRONG_RED: exactly the 4 declared
   discriminators failed, 0 missing, 0 unexpected, GREEN on HEAD — and the tests that should NOT
   depend on the mutated lookup (cross-parent, in-submission collapse, capacity reject) stayed
   green under mutation, which is what genuine discrimination looks like.
4. **Mechanical bundle** — `make-bundle` with gate captures and hashed manifest.
5. **Cold review** — fresh-context reviewer, package-only, which **independently verified three
   manifest hashes via shasum** before trusting the evidence.
6. **Scorecard** — new template: Regression proof block + `Runtime verification: NONE`.

## Did the new rules bite? (the point of the dogfood)

Yes, three times:

- **The reviewer caught two evidence defects through the new machinery.** The contract's ship
  gates declared `next build` but the bundle's `captures` showed only tests/typecheck — visible
  precisely because captures are manifest entries, not prose claims. And the mutation spec was
  flagged as the one untracked, **unhashed** file in the bundle. Both were closed (bundle-v2:
  build captured exit 0, spec embedded + hashed) before the scorecard was written.
- **The mutation-validity rule was actually adjudicated, not rubber-stamped.** The reviewer
  accepted the STRONG_RED on specific grounds: surgical removal of exactly the claimed fix,
  interfaces preserved, declared discriminators matched 4/4, non-dependent tests green under
  mutation. (Negative path separately verified in proof-08-era validation: a wrong declared
  discriminator demotes to EXPECTATION_MISMATCH, exit 2.)
- **`Runtime verification: NONE` changed the language of the verdict.** The PASS is recorded as
  **merge-grade**, with an explicit list of what has never executed (Prisma case-insensitive
  matching vs the fake's `toLowerCase()`, rollback of the pre-check parent create, the event lock
  under real concurrency, the route's handling of the new response shape). Without the field,
  this would have read as "production-ready" — it is not.

The review also produced two findings of the kind only cold context surfaces: the contract's A3
wording ("lookups precede all creates") is inaccurate for the parent row, and the concurrency
claim silently assumes a single open event. Both recorded on the scorecard.

## Verdict on the claim

Supported. On a fresh change, the harness produced: a hashed, reviewer-verified bundle; an
attributed, adjudicated STRONG_RED; a scorecard whose runtime limits are explicit; and two
evidence defects caught *by the machinery* rather than by luck. Cost: roughly one extra commit's
worth of artifacts and ~10 minutes of tool time on top of the fix itself.

Honest limits, unchanged: the reviewer is same-vendor fresh-context (level 2) with attested — not
enforced — tool isolation; all test evidence is fakes-based; and this is **evidence-backed AI code
review for business invariants**, not formal verification.
