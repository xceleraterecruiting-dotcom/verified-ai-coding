---
name: ship-review
description: Use AFTER a feature is implemented and you have a diff, when you need a ship/no-ship decision. Assembles a model-agnostic cold-review bundle, produces PASS/NEEDS_REVIEW/FAIL, converts blockers into proof obligations, and generates a bounded remediation prompt only when the verdict is FAIL or NEEDS_REVIEW. Do not use to plan a feature — use verified-implementation for that.
---

# Ship Review

A feature is implemented. Before it ships, you will subject it to a cold review by a model that did not write it, decide ship/no-ship against the contract, and — only if it fails — generate a bounded fix.

> **Review and scorecard are read-only. Bounded remediation is the only write step.** Do not edit code during the review. Reviewing is for finding; remediation is for fixing, and only after a FAIL or NEEDS_REVIEW.

## Step 1 — Gather the inputs

Collect everything the reviewer needs:
- The **original request** (the user's words).
- The **feature contract** and **invariant checklist** from `verified-implementation` (must-always / must-never).
- **Project context** (domain, layers, conventions).
- The **git diff** under review (`git diff`, or the PR diff).
- **Test / eval / redteam outputs** — actual run results, not "should pass," each labeled with its **proof depth** (see `templates/test-output.md`: SOURCE-TRACE / UNIT-MOCK / SEAM-LEVEL / ROUTE-LEVEL / DB-REAL / LIVE-SMOKE / UI-CLIENT / OPERATOR-CHECK).
- If the work came from a broad audit, the **triage report** (`templates/audit-triage.md`) and the **selected slice** it was cut down to.
- The **rubric** (the ship gates from the contract).

If any of these are missing — especially the invariants or the redteam results — say so. A review without invariants is a vibe check.

**Reconcile the contract against the project's existing specs**, not only the diff against the contract. The same principle that governs findings — *the tool's own output is a lead, not truth* — applies to the contract itself: a review can trace the code perfectly and still miss that the contract diverged from prior spec language. If the contract and an existing spec disagree, surface it as a finding; don't silently assume the contract wins.

**Check the whole enforcement path, not just the edited node.** An invariant usually spans multiple nodes — the decision point plus every page, route, service, or job that should enforce it. A fix that hardens one node leaves the invariant violated end to end if a sibling node gates independently or not at all. Require the contract's enforcement-path map (see "Map the enforcement path" in `verified-implementation`) and confirm each node's status: verified correct, assumed-not-verified, or out of scope. An unverified upstream/downstream node is a blocker-worthy open risk, not a PASS — even when the edited node is perfect.

**Check for sibling-writer races.** A claim/transition guard only protects the actors that go through it. If two entry points can mutate or trigger side effects for the same entity (webhook vs cron, user action vs worker, retry vs original request), confirm the tests cover *interleavings across those different actors* — not only duplicate delivery through one path. "Idempotent against its own replay" is not "idempotent against a sibling writer." If a recovery/retry path keys on age, confirm the timestamp measures the right lifecycle state. Untested cross-entrypoint concurrency is an open risk, not a PASS.

## Grounding review

Check whether the contract's description of **existing** code is true — not just whether the diff is internally consistent. *A summary of existing code is a claim; the grounding evidence is the proof.* For every load-bearing reused seam, helper, guard, route, or repository, ask:

- Did the bundle include the actual evidence for this existing code?
- Does the cited code match the contract's summary?
- Did the implementation route through the cited seam, or create a parallel path around it?
- Did the tests exercise the seam itself, or a mock/copy of it?
- Is the safety claim based on real code, or on the builder's description of it?

**Verdict rule:** if a contract relies on an existing seam but the bundle does not include grounding evidence for that seam, return **NEEDS_REVIEW**, not PASS.

**Blocker rule:** if the implementation bypasses a seam the contract claimed it reused, return **FAIL** — unless the contract was explicitly updated and re-approved.

## Client interpretation review

When the implementation includes a UI/client layer that calls reused seams, check that the client reports the backend outcome truthfully — a correct seam can still drive a dishonest product. Ask:

- Did the bundle include the seam response statuses / result shapes?
- Did the contract define what the client displays for success, idempotent success, refusal, and stale/error?
- Does the implementation actually branch on those outcomes correctly?
- Does the client avoid optimistic success when only an earlier step succeeded?
- Does the client treat idempotent success as success, not failure?
- Does the client recover/refetch on stale/error instead of leaving a false state?

**Verdict rule:** if a client composes backend seams but the bundle does not define or prove the client's interpretation of the seam outcomes, return **NEEDS_REVIEW**, not PASS.

**Failure rule:** if the client shows success for a state the backend did not create, or treats an idempotent-success response as failure in a way that contradicts the contract, return **FAIL** — unless the contract explicitly defines that behavior and the user approved it.

## Audit & scope review

If the change originated from a broad request ("fix all issues," "audit the repo"), confirm it went through triage rather than straight to a sweeping diff:

- Is there a triage report, and was a **single approved slice/cluster** selected — not the whole queue implemented at once?
- Do the load-bearing findings behind the slice carry grounding levels (✅/🧪) appropriate to their severity? A BLOCKER/HIGH acted on from 📎 or ❌ grounding is **NEEDS_REVIEW** until upgraded.

**Scope gate (mechanical).** Run the allowed-files check against the run's declared scope:

```
node scripts/check-allowed-files.mjs <run-dir>/allowed-forbidden-files.md
```

If the changed files exceed the allowed list — or touch anything forbidden — the verdict is **FAIL** until the contract's allowed/forbidden lists are updated and re-approved. *Allowed-files is not guidance; it is a gate*, and scope creep in a diff is a finding, not a footnote. (This is a scope check, not a security sandbox.)

**Proof-depth review.** For each ship gate, confirm the evidence's proof depth actually reaches the failure mode it claims to cover. *A passing mock can prove intent while leaving the real failure mode untested.* A safety claim whose only evidence is `UNIT-MOCK` over logic whose real failure mode is `DB-REAL` or a cross-entrypoint race is **NEEDS_REVIEW**, not PASS, until exercised at the right depth or explicitly accepted as an advisory open risk.

## Step 2 — Build the cold-review bundle

Assemble `templates/review-bundle.md`: a single self-contained document a reviewer can read top to bottom with no other access. The reviewer is **pluggable** — it may be GPT-5.5, another model, or a fresh Claude session. GPT-5.5 is not the product; the bundle is model-agnostic on purpose.

**Assemble the bundle's raw materials mechanically, not by hand.** Hand-assembled evidence drops things silently — fixture-proven: `git diff` omits untracked files, which once cost a full review round (proof-08). Run:

```
node scripts/make-bundle.mjs --repo <repo> --base <commit> --head <commit> --out <dir> \
  [--include-untracked <path>]... [--capture tests:'npm test'] [--capture typecheck:'npx tsc --noEmit']
```

It emits the diff, FULL contents of files added in the range, untracked listings, captured gate outputs, and a `manifest.json` with sha256 hashes for every artifact. Paste from the bundle directory into `templates/review-bundle.md`; include the manifest so the reviewer can verify completeness. A Level 2+ review (see "Mechanized regression proof" below) without a manifest is hand-assembled evidence and must be labeled as such.

Hand the bundle to the reviewer using `prompts/cold-reviewer.md` (the pasteable cold-review prompt). The reviewer persona it embodies is specified in `agents/reviewer-agent.md`.

## Step 3 — Verdict: PASS / NEEDS_REVIEW / FAIL

The reviewer returns one verdict:
- **PASS** — every invariant is enforced below the UI, every redteam case behaves, gates are green. Ship.
- **NEEDS_REVIEW** — works on the happy path but a gate is unproven, a redteam case is untested, or an invariant relies on the UI. Not shippable as-is.
- **FAIL** — an invariant is violated, a redteam case produces the wrong behavior, or a deterministic gate is red. Do not ship.

Remember: **deterministic gates win; model review is advisory.** If a test or type check is red, the verdict is FAIL regardless of model opinion. The model's job is to catch what the gates missed.

## Step 4 — Separate blockers from suggestions

Split findings into:
- **Blockers** — must be fixed before shipping (invariant violations, failing redteam cases, red gates).
- **Non-blocking suggestions** — improvements that do not block the ship (naming, structure, nice-to-haves). Record them; don't act on them now.

## Step 5 — Convert blockers into proof obligations

For each blocker, write a proof obligation:
- **Problem** — what is wrong, precisely.
- **Why it matters** — the real-world harm.
- **Required proof** — the test or check that must turn green to consider it fixed.
- **Minimal allowed fix** — the smallest change that satisfies the proof.
- **Allowed files** — what may be touched.
- **Forbidden changes** — what must not be touched (schema, adapters, UI redesign, unrelated refactors).

Before a blocker becomes a proof obligation, it must clear **Claim verification before remediation** (see `verified-implementation`): exact code evidence (file + actual lines), a counter-check that could disprove it, and any untraced equivalence the fix assumes flagged explicitly. A finding that fails its counter-check is retracted — and the remediation scope shrinks with it, before implementation. *The tool's own output is a lead, not truth* — that applies to this review's findings too.

## Step 6 — Bounded remediation (only if FAIL / NEEDS_REVIEW)

If and only if the verdict is FAIL or NEEDS_REVIEW, generate a bounded remediation prompt from `prompts/bounded-remediation.md`, parameterized by the proof obligations. Rules carried into remediation:
- Fix **only** the listed blockers.
- One **regression test per blocker**, written first or alongside.
- **Smallest patch possible.** No broad rewrites.
- Stay inside allowed files; never touch forbidden ones.
- **No silent fixing** of larger issues discovered along the way — report them as follow-ups.

After remediation, re-run gates and re-review.

## Mechanized regression proof (risk-leveled)

"This regression test would fail on the unfixed code" is a claim; `scripts/regression-check.mjs` turns it into a tool verdict. Requirements scale with risk so the harness stays unforgiving where stakes are real without becoming bureaucracy for cosmetic changes:

| Risk level | Definition | Requirements |
|---|---|---|
| **0 — cosmetic** | presentation only, no behavior | make-bundle optional, regression-check optional |
| **1 — low-risk logic** | behavior, but no invariant from the contract's business-risk call | make-bundle required; regression-check recommended |
| **2 — money, auth, permissions, user data, status transitions** | anything the contract flags as a business-invariant risk | make-bundle + manifest required; **one STRONG_RED per confirmed-blocker remediation** required; Runtime verification field required on the scorecard |
| **3 — regulated / production-critical** | real harm at scale | all of Level 2, plus enforced reviewer isolation and runtime smoke or staging E2E before any "production-ready" language |

Classify the diff's level from the contract's business-invariant risk call. Escalating a level needs no justification; downgrading one must be argued in the scorecard.

**Proof-strength labels** (the tool emits these; never re-grade them by hand):

- **STRONG_RED** — assertion-level failure under counter-mutation mode, GREEN on fixed HEAD. The only label that proves a test discriminates.
- **WEAK_RED_COMPILE** — old/base code fails to compile, import, or link. Proves the test is new, not that it catches the bug.
- **INVALID_RED_ENV** — failure caused by setup/environment. Proves nothing; fix the harness.
- **NOT_DISCRIMINATING** — the test passes with the bug reintroduced. The test does not exercise the fix.

**Mutation validity rule:** *a mutation is valid only if it removes or weakens the claimed fix while preserving the modern test/interface shape.* The spec must carry provenance — `findingId`, `invariant`, `expectedTests` (the assertions expected to discriminate) — and the tool enforces it: a declared discriminator that doesn't fail is **EXPECTATION_MISMATCH** (exit 2), undeclared extra failures are flagged as possible over-broad mutation, and a spec without provenance is labeled **UNATTRIBUTED** and is not proof-grade. This is what stops a fabricated STRONG_RED made by mutating unrelated code until something fails.

**When a mutation comes back NOT_DISCRIMINATING, diagnose *why* before rewriting anything.** The common field case is **masking**: an upstream check, watermark, or sibling guard intercepts the mutated path before the target assertion ever sees it — the test genuinely doesn't discriminate the invariant, but the invariant may still be enforced (by the masking layer). The correct response is to **rewrite the test as a direct seam test** against the guarded code itself, below the masking layer. The wrong response is to loosen or relocate the mutation until something fails — that manufactures a STRONG_RED for a test that still doesn't guard the invariant. Field evidence: two non-discriminating mutations (a CAS test masked by a watermark check, a SQL guard shielded by an upstream check) were rejected and rewritten as direct seam tests rather than salvaged.

```
node scripts/regression-check.mjs --repo <repo> --tests <test-file>... \
  --mutations <spec.json> [--out <dir>]
```

Spec shape (see `examples/regression-check-sample/` for real ones): `{ "findingId": "...", "invariant": "...", "expectedTests": ["substring of assertion name"], "mutations": [{ "file", "find", "replace", "why" }] }`. Each `find` must occur exactly once.

**Verdict rules:**
- A PASS may **not** cite WEAK_RED_COMPILE as proof that a regression test discriminates.
- A PASS may cite STRONG_RED only when the mutation spec is included in the bundle and tied to the original finding (no UNATTRIBUTED, no EXPECTATION_MISMATCH).
- Base mode (`--base <sha>`) is permanently advisory — fixture-proven (proof-08) to fake both failures *and* passes via missing-export→undefined degradation. Use it for context, never as the proof.

## Step 7 — Ship/no-ship scorecard

Produce `templates/ship-scorecard.md`: per-dimension verdicts (Behavior, Grounding, Client-interpretation, Safety, Tests, Redteam, Observability), a **Scope** row (allowed-files gate PASS/FAIL), and a single decision — **SHIP** or **DO NOT SHIP**. Each evidence row carries its proof-depth label so a green check can't hide a shallow proof. For Level 2+ work the scorecard must also include the **Regression proof** block (one entry per remediated blocker, citing the regression-check result and mutation spec) and the **Runtime verification** field — `NONE` blocks "production-ready" language for Level 2+ regardless of how strong the static proof is. The scorecard is read-only output. It passes only when the invariant is enforced below the UI, the diff is within approved scope, and every redteam case behaves correctly.

## Operator checks — what no test suite can prove

Some failure modes live outside the code: environment values, the deploy
pipeline, and a third party's real behavior. Field record
(`docs/field-reports/`): production env vars that were all empty for a day
behind a green suite; five releases that silently failed for five hours while
the domain alias answered every health check; a provider that silently drops
headers no mock modeled. **A green suite proves the code; only an operator
check proves the world.**

When a slice touches deployment surface, configuration, external providers, or
realtime behavior, the scorecard's Runtime verification field must reference a
completed `templates/operator-checklist.md` (env values pulled and
length-verified, the deployment verified READY *by ID* not by alias, one real
request through the changed path, provider quirks observed first-hand). For a
slice whose runtime depends on an external provider, `UNIT-MOCK`/`SEAM-LEVEL`
evidence caps the claim at "correct against spec" — first contact with the
real provider is a planned, observed step, never something users discover.

## Reviewer context

Every ship review must state **reviewer context** — who (or what) actually performed the review, and from what vantage. A verdict is only as independent as the reviewer behind it, and the builder cannot grade its own work from the same context and call it independent validation.

The review result must include:
- the **reviewer context level** (scale below);
- whether the reviewer had the **builder's chat history**;
- whether the reviewer received **only the cold-review bundle**;
- whether the reviewer was **same-session, fresh-context Claude, different-Claude-model, or different-vendor model**;
- whether **tool restrictions** were enforced, merely requested, unknown, or not applicable;
- whether **external API / code egress** occurred;
- if egress occurred, **which provider/model** was used and whether the bundle was **sanitized or proprietary**.

**Reviewer context levels (weakest → strongest):**
1. **Weak** — the same session/agent that implemented the change reviewed its own work.
2. **Fresh-context Claude** — a separate Claude subagent or fresh Claude session reviewed only the cold bundle. Removes builder narrative; still Claude reviewing Claude.
3. **Different-Claude-model** — a different Claude model reviewed only the cold bundle (e.g. Opus reviewing Sonnet's work). Stronger, still same vendor/family.
4. **Different-vendor model** — a non-Claude model reviewed only the cold bundle. Stronger independence; requires explicit code-egress approval.
5. **Different-vendor + isolated tools** — strongest practical mode: different vendor, cold bundle only, explicit egress approval, and tool scope restricted/enforced where supported.

**Rules:**
- A **PASS without reviewer-context metadata is incomplete evidence.**
- A **same-session PASS** may be used for local iteration, but must **not** be represented as an independent proof artifact.
- **Fresh-context Claude** review is better than same-session review, but it is **not** different-model independence.
- **Different-Claude-model** review is stronger than same-model fresh-context review, but **still not** different-vendor review.
- **Different-vendor** review requires **explicit egress approval per bundle** before proprietary code leaves the machine.
- **Deterministic gates outrank model-review judgment** — tests, redteam, typecheck, lint, executable proof modules, CI. Different-vendor review reduces correlated blind spots; it does not become the source of truth.
- For **proof artifacts, record reviewer context honestly.**

See `docs/reviewer-context.md` for the rationale and the egress policy.
