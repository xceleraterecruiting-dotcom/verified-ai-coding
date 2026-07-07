# Field report — Five Star

**36 verified runs · 80 AI-authored commits · 397 tests across 50 files · 2
compiled spec plans · ~20 cold-review blockers caught and fixed pre-ship**

The subject: a recruiting life-sim game — and the harness's first full **L3**
run, because it combines minors' data with public AI-generated output and real
money. This is the only field run to date that exercised all three skills in
sequence: `spec-compiler` → `verified-implementation` per slice → `ship-review`
per slice. It is also the strongest evidence for the harness's AI-safety
claim: the cold reviews caught ~13 fabrication/leak/forge holes in the
AI-generation cluster alone, every one before ship.

## Headline numbers

| Metric | Value | Where |
|---|---|---|
| Commits, all AI-authored | 80 | every one carries an AI co-author trailer (verified 80/80) |
| Verified-implementation runs | 36 | `.verified-ai/runs/` |
| Contracts / invariant checklists / scorecards | 52 / 31 / 48 | file counts |
| Compiled spec plans | 2 (five-star-v1 at L3, story-layer) | `.verified-ai/specs/` |
| Research docs (adversarially verified) | 5 | `.verified-ai/research/` |
| Automated tests passing | 397 across 50 files | `pnpm vitest run` |
| Cold-review blockers caught → fixed | ~20 | scorecards |
| Invariants formally tracked | 31 `INV-` + per-slice IDs | `invariants.md` + checklists |

## The planning layer worked as designed

`spec-compiler` turned the game-design doc into 10 canonical docs gated by
`plan-lint.mjs`: 50 requirements, 14 non-goals, 18 slices, 18 open questions,
**31 invariants**, risk classified **L3 with no downgrade**, justified verbatim
in the risk map ("AI-generated public artifacts, shared on social, produced
for and by 16–18-year-olds, alongside in-app purchases — the textbook L3
profile").

Open questions actually gated the build: `plan-lint.mjs` exits 2 ("BLOCKED")
while a high-severity OQ stays open, and the high-severity ones (build-now,
App-Store/minors, AI cost) were resolved with recorded decisions before code.
Five research docs each grounded a design constant (rating thresholds, the
"forfeit unvested only" flip mechanic, pacing curves) with adversarial
verification.

The load-bearing invariants, verbatim:

- **INV-1 [L2]** — star rating, attributes, buzz, rep, and NIL valuation are
  written only by server-side computation; client-supplied values rejected.
- **INV-5 [L2]** — every resource grant/spend is an append-only ledger entry;
  balance is always derivable from the ledger (no mutable counter that can
  drift).
- **INV-14 [L3]** — generated content must never assert a stat, amount,
  ranking, school, coach, or person-fact not present in the source-fact
  inputs; **enforced by validation, not by prompt instruction alone**.
- **INV-29 [L3]** — no AI-generated public artifact publishes until it passes
  a human-approval queue; validation + moderation alone are not sufficient for
  public AI output by/about minors.

## Invariants enforced in code, not prose

Each invariant traces to an enforcing line:

- **INV-1** — an anticheat module recursively strips server-derived keys from
  any client payload, case-insensitive, at any depth (`stars`, `buzz`, `rep`,
  `nilvalue`, …). Live smoke: "created … stars=3 (cheat 5 ignored)".
- **INV-5** — the ledger table has **no balance column**; balance is
  `Σ delta` by construction.
- **INV-14** — the model returns `{skeletonId, slots}`; a fact slot always
  renders the canonical fact and **the model's value is discarded**.
  Fabrication is structurally impossible, not discouraged.
- **INV-29** — the review queue's `release()` returns shareable content only
  if APPROVED, returns a `structuredClone` so a caller can't mutate the
  approved artifact, and a decided item is immutable ("a human's REJECTED can
  never later become APPROVED").
- **No-pay-to-win** — the agent's modifier enum simply has no member for a
  power grant: the violation is *unrepresentable*.
- **Races** — three compare-and-set sites (camp, game-day, hard-commit) where
  the extended `where` makes a double-write match zero rows → clean refusal.

## What cold review caught (the AI-safety cluster)

Every one of these was a real hole caught by a fresh-context reviewer and
fixed before ship:

- **Fabrication bypasses:** a noun-regex let bare "LSU/Bama" through;
  unit-stripping let "$28K" reuse fact digits; lowercase "texas" evaded the
  scrub; digits smuggled through archetype fields; an unknown-beat path
  skipped the name scrub entirely.
- **Leak channel:** a validator echoed a rejected flag into `result.reason` —
  a live channel back into model-visible text. Fixed to a non-reflective
  token.
- **The forgeable gate (the most dangerous find):** the human-review queue
  returned items **by mutable reference**, so `item.status = "APPROVED"`
  anywhere in the codebase bypassed human review of AI content about minors.
  Fixed with defensive copies on both enqueue and release. This is now a
  standard redteam case in `verified-implementation` and a check in the cold-
  reviewer prompt.
- **Data loss:** declining a hard commitment orphaned the pointer and bricked
  the career.
- **Concurrency:** unconditional day-advance → compare-and-swap.
- **Calibration hidden by a clamp:** a `[2,3]`★ output clamp masked a
  miscalibrated rating model — the clamp made every test pass while the model
  underneath was wrong.

## Proof depth was risk-shaped

Engine slices (deterministic core) proved out at unit level with hand-traced
money identities ("`forfeited = total − kept`, not independently rounded → the
sum is algebraic"). API slices were proven **DB-REAL against live Supabase**
("submit#1 applied=true, submit#2 applied=false, idempotent=true,
cheatIgnored=true"). Client slices ran under the client-interpretation
contract with live walkthrough transcripts ("camp#2 SAME wk → 400, no write;
play game → week=1 → available again").

## Honest caveats (stated in the artifacts)

- Most reviews are Level 2 (fresh-context Claude), several different-model —
  none different-vendor.
- Two slices have contracts/invariants but no scorecard in the tree.
- Several early "server-write-only" guarantees were type/schema conventions
  until the API slices forced them through payload sanitization — the
  checklists say so explicitly.
- The game is feature-complete and invariant-proven, but **never
  human-playtested for fun** — the harness proves invariants, not product
  quality.

## Evidence boundary

Private repo; operator-verified numbers; same-vendor reviews. See the
[field-reports evidence boundary](README.md).
