# Eval Plan

Use this **only when AI behavior is part of the feature at runtime** — a model makes a decision, generates content, classifies, or routes. If there is no model in the runtime path, skip this file and note "no AI in runtime path; no evals."

## What the AI does here

- **The AI's job in this feature:**
- **What a good output looks like:**
- **What a harmful / wrong output looks like:**

## Eval cases

| # | Input | Expected behavior | Scoring (pass/fail or rubric) |
|---|---|---|---|
| E1 |  |  |  |

## Scoring method

- **Automated check, human check, or model-graded:**
- **Threshold to pass the gate:**
- **What happens on a borderline score:**

## Guardrails vs. evals

Evals measure quality and behavior; they are not a substitute for a hard invariant. If a model output could violate a MUST NEVER, that invariant must still be enforced **deterministically below the model**, not left to an eval score.
