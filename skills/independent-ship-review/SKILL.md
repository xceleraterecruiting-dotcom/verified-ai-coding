---
name: independent-ship-review
description: Use to run a cold-review bundle through a FRESH-CONTEXT Claude reviewer that is tool-isolated to a probe-verified configuration, when you want a review by a reviewer that did not write the code and cannot read beyond the bundle. Produces PASS/NEEDS_REVIEW/FAIL — or INVALID if isolation can't be confirmed. This is same-vendor (Claude reviewing Claude), NOT different-vendor and NOT adversarial-proof. Do not use for different-vendor/external review or to plan a feature.
---

# Independent Ship Review (fresh-context, isolated-bundle)

Runs `ship-review`'s cold review **agentically**: a fresh headless Claude reviewer receives only the bundle, runs with a tool-isolated configuration, and returns a verdict — and the launcher refuses to trust that verdict unless it can confirm, at runtime, that the isolation actually held.

> **Honest label — never drop the qualifiers.** Fresh-context Claude + bundle-only enforced for standard write/read/delegate/egress tools (verified config #3). **Same-vendor.** **Not adversarial-isolated.** **Not different-vendor.** Deterministic gates remain the source of truth; this review is advisory. Do not call it "fully independent."

## Why this exists (and what the probes proved)

A same-session review (builder grading its own work) is the weakest reviewer. This skill removes the builder's narrative (fresh context) and strips the reviewer's tools so it cannot read beyond the bundle. The exact configuration is not guesswork — it is what the capability probes verified:

- Stock "read-only" agent types still **wrote via Bash** → not safe.
- The **expanded denylist + `--strict-mcp-config` (config #3)** removed write/read/delegate/egress tools and held → this is the configuration used here.
- Pushing the denylist further **failed open** (full tools restored, silently) → so the config must NOT be extended, and the launcher MUST verify the effective toolset at runtime.

See `probe/results-*.md` for the evidence.

## How to run

```bash
node scripts/independent-review.mjs <path-to-bundle.md> [--model <claude-model>]
```

The launcher (`scripts/independent-review.mjs`):
1. Reads the bundle and embeds its text into the reviewer prompt (`prompts/independent-reviewer.md`).
2. Spawns a fresh `claude -p` with **verified config #3**:
   `--disallowedTools Bash Edit Write NotebookEdit Read Grep Glob WebFetch WebSearch Agent Workflow Skill --strict-mcp-config --output-format json`.
3. Parses the reviewer's machine-readable result block.
4. **Deterministically gates on the toolset** (see below) before accepting any verdict.

## The fail-closed toolset gate (non-negotiable)

The reviewer reports its directly-callable `effective_toolset`. The launcher then enforces, in code — not by trusting prose:

- result block missing or unparseable → **INVALID**
- `effective_toolset` missing / malformed → **INVALID-TOOLSET-MISMATCH**
- `effective_toolset` contains **any** tool outside the allowed residual set (`AskUserQuestion`, `ScheduleWakeup`, `ToolSearch`) → **INVALID-TOOLSET-MISMATCH** (isolation failed open)
- verdict missing / not in `{PASS, NEEDS_REVIEW, FAIL}` → **INVALID**

`INVALID` / `INVALID-TOOLSET-MISMATCH` mean **no trustworthy review happened** — treat as no review, never as a PASS. This directly encodes the probe-#4 fail-open lesson: never trust a restricted run without verifying the restriction applied.

## Output

Fill `templates/independent-review-result.md`: verdict, blockers vs suggestions, and the **reviewer-context** block (level, model caveat, effective toolset, residual caveat). Record the residual every time: **ToolSearch + deferred Task\* remain and cannot be denied without failing open**, so isolation is enforced for a *cooperative* reviewer, not a hostile one.

## Boundaries

- **Same-vendor only.** For different-vendor (OpenAI/Gemini) review, that's a separate, egress-gated path — not this skill.
- **Advisory.** A PASS here never overrides a red deterministic gate, and never by itself authorizes a ship.
- No external (non-Claude) API, no dependencies, no hooks.

## Verify it works

- Guard (deterministic, no live reviewer): `node scripts/independent-review-smoke.mjs` — asserts the gate fails closed on missing/malformed/forbidden toolsets.
- End-to-end (live): `node scripts/independent-review.mjs examples/independent-review-sample/bundle.md` — expect a verdict plus an `effective_toolset` limited to the allowed residual set.
