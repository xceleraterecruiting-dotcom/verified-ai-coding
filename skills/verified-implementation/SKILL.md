---
name: verified-implementation
description: Use BEFORE writing code for a feature, change, or bugfix that touches business rules, money, permissions, publishing, state transitions, or any "this must never happen" condition. Turns a feature request into a contract with must-always/must-never invariants, allowed/forbidden files, and test/eval/redteam plans before any implementation. Do not use for throwaway scripts or pure UI tweaks with no business invariant.
---

# Verified Implementation

You are about to build a feature. Before you write code, you will make explicit what must always happen and what must never happen, and you will define how that will be proven. This is the contract phase. Implementation does not start until the contract is clear.

> **Stop vibe-coding. Make AI prove the feature.** The most dangerous AI code is the code that looks right and silently violates a business rule below the UI. A disabled button is not a safety boundary.

## Step 0 — Read project context

If a project context file exists (`templates/project-context.md` filled in, a `PROJECT-CONTEXT.md`, a `CLAUDE.md`, or similar), read it first. Pull out: the domain, the critical invariants the business already cares about, the architecture layers (where do guards belong?), and the test conventions. If no context exists, note that and infer carefully from the codebase — do not assume.

## Step 1 — Write the feature contract

Use `templates/feature-contract.md`. Capture:
- **What the user actually asked for** (their words, then your restatement).
- **The behavior in one sentence**: when X, the system does Y.
- **Inputs, outputs, and the boundary** where the behavior is enforced.
- **Open questions.** If the request is ambiguous on anything that affects an invariant, ask now. **Require contract clarity before implementation** — do not paper over ambiguity with a guess.

## Step 2 — State the invariants

This is the heart of the skill. Before any code, write:

> **Before implementation, here is what must always happen and what must never happen.**

Then fill `templates/invariant-checklist.md`:
- **MUST ALWAYS** — conditions that hold after every successful path.
- **MUST NEVER** — actions or states the system must refuse, no matter the input.

Write invariants as testable predicates, not vibes. "Rejected approvals must never create a publish job" — not "handle rejection properly."

## Step 3 — Call the business-invariant risk

Ask explicitly: **is there a business rule here that, if violated, causes real harm** (money moved, content published, access granted, data exposed)? If yes, flag it as a business invariant and require it to be enforced **below the UI** — in the service or domain layer, not in a disabled button or a hidden form field. Note where the real boundary is.

## Step 4 — Identify allowed and forbidden files

List the files the implementation is **allowed** to touch and the files that are **forbidden** (schema, adapters, unrelated modules, UI redesign). This scopes the work now and scopes remediation later. Forbidden-by-default: anything not needed to satisfy the contract.

## Step 5 — Plan the proofs

- **Tests** (`templates/test-plan.md`): unit, integration, and regression tests that exercise each invariant. Every MUST NEVER gets a test that proves the system refuses it.
- **Evals** (`templates/eval-plan.md`): only when AI behavior is part of the feature (a model makes a decision, generates content, classifies). Define inputs, expected behavior, and scoring. Skip if there's no AI in the runtime path.
- **Redteam / bypass cases** (`templates/redteam-plan.md`): adversarial inputs that try to slip past the guard — the rejected approval, the blocked draft, the edited-but-not-approved state. Each case states input → required behavior.

## Step 6 — Observability and ship gates

- **Observability**: what must be logged/metered so a violation is visible in production (e.g., log every refused publish attempt with reason).
- **Ship gates**: the deterministic conditions that must be green to ship — tests pass, type checks pass, every redteam case behaves, invariant enforced below the UI. These are the gates `ship-review` will check against.

## Claim verification before remediation

**The tool's own output is a lead, not truth.** Every finding this workflow produces — and every equivalence a proposed fix relies on — must be proven against the real code before any action is taken. AI audits are confidently wrong often enough that an unverified finding is a hypothesis, not a work item. (Real session: a headline finding claimed ~20 call sites imported the wrong function; precise tracing showed zero did.)

Before recommending any change that touches **more than the single file under direct edit**, or any change that **relies on a cross-file equivalence**, each finding must carry:

- **Exact code evidence** — the file and the actual lines, quoted, not a description of what you believe they say.
- **A counter-check that could disprove the finding** — name the query or trace that would show you're wrong, and run it. If you can't name one, you haven't verified it.
- **Untraced equivalences, flagged** — any assumption the fix leans on that you have NOT traced ("same function behavior," "same identity resolution," "same case coverage"). Mark it unproven until you've followed it in the real code.
- **Revised scope** — if verification narrows or retracts the finding, say so.

If a finding is retracted or narrowed, **the remediation plan must shrink before implementation** — never proceed on the original scope just because the plan was already written.

### Anti-pattern: grep co-occurrence is not import proof

`grep "from 'X'" | xargs grep "Y"` matches files where both strings merely appear; it does **not** prove `Y` is imported from `X`. Two unrelated lines in one file satisfy it. Trace the literal import statement — and what name it actually binds — before claiming a call site is affected.

### Anti-pattern: a passing mock is not proof the real lookup works

A test that mocks a dependency to return the expected value proves the logic **given that value** — not that the real resolution (DB lookup, identity match, enum mapping) actually produces it. When a fix changes **which mechanism** resolves a value, verify the real mechanism, not just the mocked path. A green test over a mock can hide a fix that assumed two code paths resolve identity the same way when they don't.

## Output

Produce the filled artifacts (contract, invariant checklist, file lists, test/eval/redteam plans, observability + gates). State the invariants sentence explicitly. **Only then** begin implementation, staying inside the allowed files.

## Handoff

When implementation is done and you have a diff, run **`ship-review`** to verify it before shipping.
