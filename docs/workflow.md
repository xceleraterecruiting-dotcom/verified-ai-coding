# Workflow

The full loop, end to end. Two skills, one rule: everything before remediation is read-only; remediation is the only write step, and only after a FAIL or NEEDS_REVIEW.

```
        ┌─────────────────────────── verified-implementation ───────────────────────────┐
        │                                                                                │
 feature request → read context → contract → invariants → business-invariant risk        │
        │              → allowed/forbidden files → test/eval/redteam plans → gates        │
        │                              → "what must always / never happen" → IMPLEMENT     │
        └────────────────────────────────────────────────────────────────────────────────┘
                                              │  (diff exists)
                                              ▼
        ┌──────────────────────────────── ship-review ──────────────────────────────────┐
        │  gather inputs → cold-review bundle → COLD REVIEW (pluggable model)             │
        │       → PASS / NEEDS_REVIEW / FAIL → split blockers vs suggestions               │
        │       → blockers become proof obligations → scorecard                            │
        └────────────────────────────────────────────────────────────────────────────────┘
                 │ PASS                              │ FAIL / NEEDS_REVIEW
                 ▼                                   ▼
              SHIP                          bounded remediation (only write step)
                                            fix listed blockers · 1 regression test each
                                            smallest patch · allowed files only
                                                     │
                                                     ▼
                                            re-run gates → re-review → scorecard
```

## Phase 1 — Plan (verified-implementation)

1. **Read project context** if present.
2. **Write the feature contract.** Resolve any ambiguity that touches an invariant *before* coding.
3. **State invariants** — MUST ALWAYS / MUST NEVER, as testable predicates.
4. **Call business-invariant risk** — does a violation cause real harm? If so, enforce below the UI.
5. **Scope files** — allowed vs forbidden.
6. **Plan proofs** — tests always; evals if AI is in the runtime path; redteam/bypass cases for every MUST NEVER.
7. **Define observability and ship gates.**
8. **Say it out loud:** "Before implementation, here is what must always happen and what must never happen." Then implement inside allowed files.

## Phase 2 — Verify (ship-review)

1. **Gather** request, contract, invariants, context, diff, test/eval/redteam *results*, rubric.
2. **Build the cold-review bundle** — self-contained, model-agnostic.
3. **Cold review** with a pluggable model (fresh Claude, GPT-5.5, etc.). Deterministic gates outrank the model.
4. **Verdict:** PASS / NEEDS_REVIEW / FAIL.
5. **Split** blockers from non-blocking suggestions.
6. **Proof obligations** for each blocker.
7. **Scorecard** — per-dimension, single SHIP / DO NOT SHIP decision.

## Phase 3 — Remediate (only on FAIL / NEEDS_REVIEW)

1. Run the **bounded remediation** prompt against the proof obligations.
2. **One regression test per blocker.** Smallest patch. Allowed files only.
3. **No silent fixing** of bigger discoveries — report as follow-ups.
4. **Re-run gates, re-review, re-score.** The scorecard declares success, not you.

## When to skip pieces

- **No AI at runtime?** Skip the eval plan; note it.
- **No business invariant** (pure cosmetic change)? You may not need this workflow at all — it's built for changes where something must never happen.
- **PASS on first review?** Ship. But if you *never* see a FAIL across many features, suspect your redteam cases aren't testing the boundary.
