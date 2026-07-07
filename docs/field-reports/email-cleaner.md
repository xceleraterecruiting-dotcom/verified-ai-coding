# Field report — email-cleaner

**10 slices · 159 tests (from 21) · spec-compiler → verified-implementation →
ship-review, looped once per slice**

The subject: a local-first inbox cleaner for a real Yahoo account — verified
build, moves messages to Trash only (no delete verb exists in the codebase).
The smallest field run, and the most instructive, because it is the cleanest
demonstration of **what the harness proves and what it structurally cannot**.

## The pipeline ran clean

- **Stage 1 — the spec was compiled, not assumed.** Nine planning docs: 23
  requirements, 12 non-goals, 15 invariants, 23 acceptance criteria, 6 open
  questions (all resolved before any code), risk classified L2 with quoted
  justification, four compiler lenses run. Passed `plan-lint` and a cold
  plan-review.
- **Stage 2+3 — ten slices, each cold-reviewed before shipping.** Test count
  grew monotonically 21 → 42 → 92 → 117 → 123 → 149 → 155 → 157 → 158 → 159.

The independent reviewer caught **10 real blockers across 4 slices**, each
remediated before shipping:

| Slice | Verdict | Blockers the cold review caught |
|---|---|---|
| 1 | NEEDS_REVIEW → PASS | Scope gate was RED but reported GREEN (untracked `make-bundle.mjs`) |
| 3 | FAIL → PASS | Group-level protection leaked personal mail; DKIM check trusted any server; a discussion class was unreachable; missing financial/tax/billing protections |
| 4 | NEEDS_REVIEW → PASS | Plan survived a credential change; a submission-exclusion invariant was untested |
| 6 | FAIL → PASS | A hostile `%ZZ` mailto aborted the run and falsified the report; logout mid-cleanup bricked the app; one-click POST untested |

Six mechanisms did the proving, mostly deterministic: `plan-lint`, the scope
gate, sha256-signed bundles, fresh-context cold review, STRONG_RED mutation
testing, and a full invariant↔test map.

## The honest part — and the lesson

Slices 1–7 shipped a clean, all-green, cold-reviewed app. **The first run
against the real Yahoo account exposed two production bugs:**

1. **The HEADER.FIELDS drop** — Yahoo's IMAP server silently drops
   non-standard headers from `HEADER.FIELDS` responses; the app had to fetch
   the full `BODY.PEEK[HEADER]` instead.
2. **A provider SMTP rate-limit** (`#AUTH005`) no mock had modeled.

Both were the exact anti-pattern the skill already named: **a passing mock is
not proof the real thing works.** The fakes were faithful to the contract but
not to Yahoo's quirks. The process still did its job — the app was correct
against spec, and nothing was ever unrecoverable (the move-to-Trash-only
invariant held throughout; no delete verb exists) — and slices 8–10 fixed both
bugs **with live-account verification added to the loop**.

The generalized lesson, now encoded in `ship-review`'s proof-depth rules and
`templates/operator-checklist.md`: for any slice whose runtime depends on an
external provider, `UNIT-MOCK`/`SEAM-LEVEL` evidence caps the claim at
"correct against spec." The scorecard's Runtime verification field must say
`NONE` honestly, and first contact with the real provider is a planned,
observed step — not something users discover.

## Evidence boundary

Private repo; operator-verified; same-vendor reviews. See the
[field-reports evidence boundary](README.md).
