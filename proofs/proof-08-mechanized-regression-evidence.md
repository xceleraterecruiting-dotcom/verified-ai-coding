# Proof 08 — Mechanized regression evidence (make-bundle + regression-check)

**Claim under test:** evidence assembly and red/green regression verification can be mechanized so
that (a) a bundle's completeness is checkable against a hashed manifest instead of trusted, and
(b) "this regression test catches the original bug" is a tool verdict (STRONG_RED) instead of
reviewer reasoning — including correctly *refusing* to call a compile-failure strong evidence.

**Fixture:** the Charleston Passing Academy repo (`~/charleston-passing-academy`), which has real
history from a three-round money-path ship-review:

- `a867337` — FAIL state: app integrated, five money-path blockers present, suite green (75/75)
- `15e5fbb` — remediation: B1–B5 fixed + 12 regression tests added
- `652a1e2`+ — round-3 PASS state (current HEAD at validation time)

The session that produced this history also produced the motivating failures: a hand-assembled
bundle silently dropped an untracked test file (`git diff` omits untracked), and 10 of the 12
regression tests cannot compile on the pre-fix commit because the fixes changed interfaces — so
naive "RED on base" yields compile noise, not discrimination evidence.

## Pre-registered expectations (written BEFORE running the tool)

| # | Case | Mode | Expected |
|---|---|---|---|
| E1 | `m-b2-amount-guard.json`, tests=`tests/portal-blockers.test.ts` | mutations | green PASS; red **STRONG_RED**; discriminating assertions include "refuses an amount that does not match amountDueCents" and "refuses a non-usd currency" (exactly these 2) |
| E2 | `m-b5-lock-order.json`, tests=`tests/portal-blockers.test.ts` | mutations | green PASS; red **STRONG_RED**; discriminating assertion: "rejects a submission when a rival filled the last slot between findOpen and the lock" |
| E3 | `m-a5-reduced-motion.json`, tests=`tests/landing.test.ts` | mutations | green PASS; red **STRONG_RED**; discriminating assertion: "the reduced-motion reset stops infinite animations, not just shortens them" |
| E4 | base mode `--base a867337`, tests=`tests/portal-blockers.test.ts`, support=`tests/fakes.ts` | base | green PASS; red **WEAK_RED_COMPILE** (missing exports `PaymentMismatchError`/`CanceledEnrollmentPaidError` at base → module link error), with ZERO assertion-level failures — the tool must NOT claim discrimination |
| E5 | `make-bundle --base a867337 --head 15e5fbb` | bundle | `new-files/tests/portal-blockers.test.ts` present with FULL contents (the artifact the hand-assembled bundle dropped); manifest hashes verify against emitted files |

Falsifiers: any STRONG_RED in E4; any extra/missing discriminating assertion in E1–E3; a failed
green phase anywhere; manifest hash mismatch in E5.

## Results

| # | Expected | Actual | Verdict |
|---|---|---|---|
| E1 | STRONG_RED, exactly the 2 named B2 assertions | STRONG_RED — exactly "refuses an amount that does not match amountDueCents" + "refuses a non-usd currency", GREEN on HEAD | **MATCH** |
| E2 | STRONG_RED, the named B5 lock-order assertion | STRONG_RED — exactly that 1 assertion, GREEN on HEAD | **MATCH** |
| E3 | STRONG_RED, the named reduced-motion assertion | STRONG_RED — exactly that 1 assertion, GREEN on HEAD | **MATCH** |
| E4 | WEAK_RED_COMPILE, zero assertion-level failures | **FALSIFIED**: STRONG_RED, 9 assertion failures, 3 passes | **MISS — see below** |
| E5 | dropped file captured whole; hashes verify | `new-files/tests/portal-blockers.test.ts` present in full; all 10 manifest hashes verify; out-inside-repo and bad-commit both fail closed | **MATCH** |

### E4 — what the falsified expectation revealed

The predicted mechanism was wrong: esbuild/vitest does **not** enforce named exports at module
link time. Importing `PaymentMismatchError` from the base-commit `payments.ts` (which doesn't
export it) yields `undefined`, not a load error — so the tests RAN against the old code instead of
failing to compile. Inspecting the 9 failures and 3 passes:

- **8 of 9 failures are genuine behavioral discriminations** — the original bugs surfacing
  exactly: `NotFoundError` for the overwritten session (B1), promises resolving where rejection
  was required (B2 amount/currency, B3 paid-reversal, round-2 null intent), `'AWAITING_PAYMENT'`
  instead of `'CANCELED'` (B3). One (B5) is a deps-shape artifact (`TypeError` on the old
  signature), not behavioral.
- **All 3 passes are SPURIOUS**: `expect(...).rejects.toThrowError(undefined)` accepts ANY error
  (two cases — the import degraded to `undefined`), and one test exercises the head-copied fake
  rather than the service.

Conclusion: base-mode evidence is contaminated **in both directions** — it can fake failures AND
fake passes. This is strictly worse than the pre-registered model (which assumed it fails loudly).
Consequence applied to the tool: base-mode verdicts now carry a permanent
`[ADVISORY: … use --mutations for proof-grade RED]` suffix. Mutation mode (E1–E3) is the only
proof-grade mode, which the three exact-match runs support.

### Net claim status

Supported, with one model correction. STRONG_RED from mutation mode identified exactly the
pre-registered discriminating assertions in 3/3 cases with green confirmed on HEAD; the bundle
tool mechanically captured the artifact whose manual omission cost a review round, with a
verifiable hash manifest; and the pre-registration discipline itself caught a wrong assumption
about the toolchain that now lives in the tool as a permanent warning.

Run artifacts: `/tmp/vac-validate/e1..e5-bundle` (ephemeral); mutation specs in
`examples/regression-check-sample/`; unit tests `scripts/make-bundle.test.mjs` (22 checks),
`scripts/regression-check.test.mjs` (23 checks).
