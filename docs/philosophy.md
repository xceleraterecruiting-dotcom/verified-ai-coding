# Philosophy

Short version: **stop vibe-coding; make AI prove the feature.** This page is the reasoning behind the workflow. It's deliberately brief — this is a practical pack, not a manifesto.

## The failure mode we target

AI writes code that looks right. It compiles, it reads cleanly, it handles the case you were thinking about. The danger isn't the bug you can see — it's the business rule silently violated below the UI. The publish guard that checks an approval *exists* but not whether it was *approved*. The transfer that checks a balance but not a hold. These pass a glance and fail in production.

## A disabled button is not a safety boundary

This is the load-bearing idea. UIs *suggest* what's allowed; they don't *enforce* it. A disabled button, a hidden field, a client-side check — all of them vanish the moment anything reaches the service by another path: a retry, a direct call, a different client, a race, a future refactor. The boundary is the guard in the service or domain layer. **Invariants must be enforced below the UI, and proven there.**

## Invariants over intentions

"Handle rejection properly" is an intention. "A rejected approval must never create a publish job" is an invariant — testable, falsifiable, redteamable. The workflow forces intentions into invariants before any code, because you can't prove an intention.

## Deterministic gates win; model review is advisory

Tests, type checks, and assertions are the real gates: they're repeatable and they don't have opinions. The cold review is there to catch what the gates *missed* — the unenforced invariant, the untested bypass, the boundary that lives in the UI. If a gate is red, the verdict is FAIL no matter what any model says. The model is a second set of eyes, not the judge.

## The reviewer is pluggable; no model is the product

The cold reviewer can be a fresh Claude session, GPT-5.5, or any capable model. We name GPT-5.5 only as an example — it is not the product. The product is the contract-driven, model-agnostic review. Swapping models should change nothing about the discipline.

## Failed reviews create proof obligations

A blocker isn't "this feels off." It's a structured obligation: the problem, why it matters, the proof required to close it, the minimal fix, and the files that may and may not change. This is what keeps a failed review from turning into an open-ended rewrite.

## Bounded remediation, not redemption arcs

When something fails, fix exactly what failed: only the listed blockers, one regression test each, the smallest patch, inside allowed files. Discovered a bigger problem? Report it as a follow-up — don't silently fold it in. Scope creep during a "fix" is how a one-line correction becomes a new set of unverified changes.

## The failure is the asset

The worked example fails on purpose and keeps the failure. A verification loop that never catches anything is indistinguishable from no verification at all. The value isn't the green scorecard — it's the red one that came first, and the proof that the loop turned red into green for the right reason.
