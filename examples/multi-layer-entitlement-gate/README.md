# Executable proof: multi-layer entitlement gate

The first **executable** proof module in Verified AI Coding. The rest of the pack is markdown that asks you to be rigorous; this one *makes the repository accumulate proof that rigor happened* — a runnable, AST-based check with a self-verifying runner.

It is intentionally narrow: a fixture-scoped checker for one invariant pattern, correct **within its supported fixtures**. It is not a general static-analysis framework.

## The invariant

> A protected page should only render if the **canonical entitlement decision** says the user is entitled.

- **Canonical decision point:** `canonical-entitlement.ts` exports `async function isUserEntitled(userId: string): Promise<boolean>`.
- **Entry point:** `page.ts` — the protected page.
- **What the checker proves:** the entry point *routes through* the canonical decision before allowing access.

## Why this is pre-context ACL thinking

In RAG, a document can be **relevant and still forbidden** — so the permission check has to happen *before* the document becomes context, not after. Relevance is not permission.

AI-assisted coding has the same shape: code can be **functional and still violate the business invariant**. A page that renders correctly can still be skipping the entitlement decision entirely. So the executable proof gate belongs *before ship*, the same way the ACL check belongs before context. Looking right is not being authorized.

## Why grep/string search is not enough

The primary fixture, `bad-imported-unused`, imports **and calls** `isUserEntitled` — then ignores the result and gates on a shortcut. A grep for `isUserEntitled` (even `isUserEntitled(`) matches, so a string check says "the canonical decision is used here." It is not: the computed value never reaches the gate. Only walking the AST — tracking the binding and checking whether its result actually flows into the guard — catches it. (This is the pack's "grep co-occurrence is not import proof" anti-pattern, made executable.)

## The fixtures

| Fixture | Shape | Expected |
|---|---|---|
| `bad-missing-import` | canonical exists but the page never imports it; gates on a shortcut | **FAIL** |
| `bad-imported-unused` | imports **and calls** the canonical decision, but never uses the result in the gate (primary) | **FAIL** |
| `bad-dead-branch` | imports and calls it, but only after an unconditional return (unreachable) | **NON-PASS** |
| `good` | imports, calls before the gate, uses the result to allow/deny | **PASS** |
| `good-aliased-import` | same as `good`, but imported under an alias (`isUserEntitled as checkEntitlement`) | **PASS** |

## Run it

Install the scoped dependency once, then run the self-verifying runner:

```bash
cd examples/multi-layer-entitlement-gate
npm install
npm run check          # runs all five fixtures, asserts expected outcomes
```

Or check a single fixture (from the repo root):

```bash
node examples/multi-layer-entitlement-gate/scripts/check-enforcement-path.mjs \
  examples/multi-layer-entitlement-gate/fixtures/bad-imported-unused
# FAIL, non-zero exit
```

`PASS` exits 0; `FAIL` / `NON-PASS` / usage errors exit non-zero. The checker **fails closed**: if it cannot verify the canonical decision gates access, it does not return PASS.

## What the checker proves — and does not

**This checker proves that the entry point routes through the canonical decision point. It does not prove the canonical decision point is itself correct.** Correctness of `isUserEntitled` is a *separate node* on the enforcement path and must be verified on its own (its own tests, its own review).

It also does **not** prove:

- that the whole entitlement system is correct;
- anything about repositories other than these fixtures.

**Passing these fixtures proves the technique works on controlled inputs, not that this checker works on arbitrary repositories.**

## Scope and honesty

- **Fixture-scoped.** It is production-quality *within its supported fixture pattern*, but it is not a general import resolver or static-analysis engine.
- **Heuristic and controlled.** "Used in the gating path" is a deliberately simple AST heuristic (the canonical result, directly or via a derived variable, appears in a reachable `if` before the allow path). The `bad-dead-branch` fixture is intentionally dumb: the checker detects that the call sits after an unconditional return and reports that it *cannot verify* gating — it does **not** perform full reachability or control-flow analysis.
- **This is a one-off executable proof module, not a general static-analysis framework.** It demonstrates that *one* Verified AI Coding principle can become an executable gate. It is not a commitment to mechanize every lesson or build a framework.

## Future work

If this pattern is ever generalized (deliberately out of scope here): path aliases, barrels, re-exports, renamed modules, complex control flow, framework-specific route/page conventions, CI integration, a contract schema/linter, and generalized import tracing.
