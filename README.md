# Verified AI Coding

**Stop vibe-coding. Make AI prove the feature.**

A Claude Code skill pack for AI-assisted builders who want to ship safer code. It wraps implementation in the things vibe-coding skips: project context, explicit invariants, tests and evals, redteam cases, a model-agnostic cold review, bounded remediation, and a ship/no-ship scorecard.

This is markdown-first, no-backend `v0.1`. There is no app, CLI, API, or dashboard. It is a workflow you run inside Claude Code.

---

## The problem

AI writes code that *looks* right and passes a glance. The failure mode isn't syntax — it's silent violation of business rules below the UI. A disabled "Publish" button feels safe, but the button is not the boundary. The boundary is the guard in the service that creates the publish job, and AI routinely writes a guard that checks too little.

> **A disabled button is not a safety boundary.** Invariants must be enforced below the UI, and proven there.

## What this pack does

Two skills carry the workflow:

| Skill | When it runs | What it produces |
|---|---|---|
| **`verified-implementation`** | You're about to build a feature | A feature contract, must-always / must-never invariants, business-invariant risk call, allowed/forbidden files, test + eval + redteam plans, observability and ship gates — *before any code* |
| **`ship-review`** | You have a diff and want to ship | A model-agnostic cold-review bundle, a PASS / NEEDS_REVIEW / FAIL verdict, blockers turned into proof obligations, a bounded remediation prompt when needed, and a ship/no-ship scorecard |

The rule that holds the whole thing together:

> **Review and scorecard are read-only. Bounded remediation is the only write step, and it runs only after a FAIL or NEEDS_REVIEW.**

## Principles

- **The reviewer model is pluggable.** GPT-5.5 is not the product. Drop in any capable model, or a fresh Claude session, as the cold reviewer.
- **Deterministic gates win; model review is advisory.** Tests, type checks, and assertions are the real gates. The cold review catches what they miss.
- **Invariants are enforced below the UI.** If the only thing stopping a bad action is a disabled button, it isn't stopped.
- **Failed reviews create proof obligations.** A blocker isn't "fix this vibe" — it's a named problem with a required proof, a minimal allowed fix, and a list of forbidden changes.
- **Bounded remediation stays bounded.** Fix only the listed blockers. One regression test per blocker. Smallest patch possible. No broad rewrites. If you discover a bigger issue, report it as a follow-up — don't silently fix it.

## Quick start

1. **Install** — copy `skills/verified-implementation` and `skills/ship-review` into your project's `.claude/skills/`. See [`docs/install.md`](docs/install.md).
2. **Plan a feature** — ask Claude Code to run `verified-implementation` on your feature request. You get a contract and invariants before code.
3. **Review a diff** — ask Claude Code to run `ship-review`. You get a cold-review bundle and a ship/no-ship call.
4. **Remediate if needed** — only on FAIL / NEEDS_REVIEW, run the bounded remediation prompt it generates.

## Repo layout

```
verified-ai-coding/
  README.md
  skills/                  # the two skills (copy into .claude/skills/ to activate)
  agents/reviewer-agent.md # internal reviewer persona spec used by ship-review
  prompts/                 # pasteable cold-review + bounded-remediation prompts
  templates/               # fill-in artifacts: contract, invariants, plans, scorecard
  examples/                # worked example, built backwards from a real failure
  docs/                    # install, workflow, philosophy
```

## The worked example

[`examples/business-invariant-publish-gate/`](examples/business-invariant-publish-gate/) is built **backwards from a failure**. A fast AI implementation writes a publish guard that checks whether an approval *exists* — but not whether it was actually approved, and not whether the draft is blocked. The result: rejected approvals and blocked drafts still create publish jobs.

The example preserves that FAIL end to end — baseline code, five redteam cases, a failed scorecard, the bounded remediation, and a final scorecard that passes only once the invariant is enforced below the UI.

> A loop that never fails proves nothing. The failure is the asset.

## Executable proof modules

The first executable proof module lives at:

`examples/multi-layer-entitlement-gate/`

It is a fixture-scoped AST checker that verifies a protected entry point routes through the canonical decision point. It is intentionally narrow and does not claim to be a general static-analysis framework — it makes one principle (*the tool's output is a lead, not truth; prove the invariant holds across the path*) runnable, with a self-verifying runner over five fixtures.

## Agentic review (fresh-context / isolated-bundle)

`skills/independent-ship-review/` runs a cold-review bundle through a fresh, tool-isolated Claude reviewer (`scripts/independent-review.mjs`) on a **probe-verified** configuration, and refuses to trust the verdict unless it confirms the isolation held at runtime. It is honestly labeled **fresh-context Claude + bundle-only (enforced standard tools), same-vendor — not adversarial-isolated, not different-vendor**. The capability probes behind it live in [`probe/`](probe/).

## Status

`v0.1` — markdown-first, no backend. This is a practical verification workflow for AI-assisted builds, not a general methodology. It does not try to be a methodology competitor. It tries to make AI prove one feature at a time.

## License

Open source. Use it, fork it, ship safer code.
