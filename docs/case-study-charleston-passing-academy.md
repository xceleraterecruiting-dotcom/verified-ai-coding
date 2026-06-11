# Case study — Evidence-backed AI code review on a real payments app

> One day, one repo, one session: a sports-academy web app with Stripe payments went from
> "all tests green" to "five confirmed money-path violations" to "mechanically provable fixes" —
> and the verification harness itself was upgraded twice by what the runs falsified.
>
> This is **evidence-backed AI code review for business invariants**. It is not formal
> verification, and it does not claim to be.

## The subject

Charleston Passing Academy: a Next.js/Prisma/Clerk/Stripe app — public site, evaluation
registration, admin selection back office, parent portal, Stripe Checkout + webhook. The money
funnel: register → admin selects (creates an enrollment awaiting payment) → parent pays → webhook
activates. The codebase arrived well-built: explicit state-transition tables, server-side price
derivation, ownership checks, webhook signature verification, and a disciplined 53-test suite.

## What happened, in order (every step is a commit)

**1. Green tests coexisted with violated business invariants.** A cold review of the money path
(`9f74132`) returned FAIL with five confirmed blockers while the full suite passed: a re-clicked
checkout silently orphaned a still-payable Stripe session (money captured, nothing granted, no
alert); the webhook activated enrollments without checking amount, currency, or payment status; an
admin reversing a selection left the enrollment payable by the rejected athlete's family; portal
accounts linked on unverified email match; and the capacity check was a read-then-write race.

**2. Cold context found what builder context missed — on the same model.** The builder pre-traced
four of the five and explicitly instructed the reviewer to refute them. It refuted none, hardened
one (the payment service structurally cannot see registration status), and found the worst one
(no payment verification at all) — in a file the builder had just finished tracing.

**3. Remediation introduced its own bugs.** The fix set for the five blockers (`15e5fbb`) was
itself reviewed: round 2 found an async-payment capture path that would strand money, a
read-then-write race in `markPaid` of the same shape just fixed elsewhere, and a duplicate-payment
check that failed open on missing payment intents. Written hours after the author documented those
exact failure classes.

**4. Manual proof assembly had evidence defects.** The same round was nearly derailed by the
evidence, not the code: `git diff` silently omits untracked files, so the new regression-test file
— the proof vehicle — was missing from the review bundle. A truncated diff and an empty delta
block occurred in adjacent bundles. Hand-assembled evidence drops things.

**5. So the proof chain was mechanized.** Two dependency-free tools (`scripts/make-bundle.mjs`,
`scripts/regression-check.mjs`): deterministic bundle assembly with a sha256 manifest over every
artifact, and red/green regression verification that classifies WHY a test was red —
`STRONG_RED` (assertion-level failure under a counter-mutation that reintroduces the bug under
current interfaces) vs `WEAK_RED_COMPILE` vs `INVALID_RED_ENV` vs `NOT_DISCRIMINATING`.

**6. The tools falsified one of their author's assumptions.** Validation expectations were
pre-registered before running (proof-08). Four of five matched exactly. The fifth — "old-commit
mode will fail with compile errors" — was wrong in a worse direction than predicted: esbuild does
not enforce named exports, so tests *ran* against old code, producing 8 genuine failures, one
artifact failure, and **three spurious passes** (`rejects.toThrowError(undefined)` accepts any
error). Old-commit comparison is contaminated in both directions. That correction is now a
permanent advisory in the tool itself.

**7. The harness now distinguishes proof grades — and it bit on a fresh change.** Mutation specs
require provenance (finding id, invariant, declared expected discriminators); a declared
discriminator that doesn't fail demotes the result to `EXPECTATION_MISMATCH` (nonzero exit), which
kills fabricated STRONG_REDs. Requirements are risk-tiered (Level 2 = money/auth/permissions/user
data/status transitions: hashed manifest + one attributed STRONG_RED per remediated blocker +
explicit runtime-verification field; `NONE` blocks "production-ready" language). The first
end-to-end run on a fresh Level 2 change (proof-09: the duplicate-athlete fix) produced an
adjudicated 4/4-declared STRONG_RED, a reviewer that independently verified manifest hashes —
and two evidence defects caught by the machinery itself before the scorecard was written.

## The numbers

- 9 confirmed invariant violations across the session, all in code whose tests were green
  (1 landing page, 5 portal blockers, 3 in the remediation itself)
- 0 reviewer findings refuted when checked against the code; 1 finding correctly self-downgraded
- 53 → 95 tests; 12 + 7 of them are regression guards tied to named findings
- 3 review rounds to converge the money path; ~390k reviewer-agent tokens for the portal cycle
- 2 tools, 45 unit checks, 5 pre-registered validation cases, 1 falsified assumption now encoded
  as an advisory
- overhead on the fresh-change dogfood: roughly one commit of artifacts + ~10 minutes of tool time

## What a PASS means here — and what it does not

A PASS asserts, with checkable artifacts: the bundle is complete (hashed manifest, independently
verifiable), the reviewer saw exactly that evidence (cold context, inputs listed, context level
recorded), each remediated finding has a regression test *proven* to discriminate its fix
(attributed STRONG_RED), and the runtime limits are explicit (what was never executed is named).

It does **not** assert: formal correctness, concurrency safety beyond what was exercised,
behavior against real infrastructure when `Runtime verification: NONE`, or independence beyond
the recorded reviewer context (same-vendor fresh-context unless stated otherwise; tool isolation
attested vs enforced is recorded per review).

## Honest limitations

Single session, single repo, same-vendor reviewers throughout — correlated blind spots are
untested (the recurring read-then-write race class suggests at least one). Isolation was attested,
not enforced, in every review here. All test evidence is fakes-based; nothing in this study ran
against real Postgres or Stripe. And the process detects — it does not prevent: every artifact the
builder produced this session (page, fixes, tests, evidence bundles) contained at least one defect
that a later mechanism caught. That is the argument for the harness, not against it.

## Artifacts

- Harness: `scripts/make-bundle.mjs`, `scripts/regression-check.mjs`, `skills/ship-review/SKILL.md`
  ("Mechanized regression proof"), `templates/ship-scorecard.md`
- Proofs: `proofs/proof-08-mechanized-regression-evidence.md` (pre-registered validation, one
  falsification), `proofs/proof-09-end-to-end-mechanized-run.md` (fresh-change dogfood)
- Subject repo: CPA commits `a867337` (FAIL state) → `15e5fbb` (remediation) → `652a1e2` (PASS)
  → `057330c`/`3915edd` (fresh-change dogfood), with review bundles, mutation specs, and
  scorecards under `verification/`
