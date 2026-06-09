# Daily use (v0.4)

Verified AI Coding as a loop you run from any repo — an orchestrator that scaffolds artifacts, validates them, runs the fresh-context reviewer, and drafts the scorecard. It **never** implements code, runs tests, commits, opens PRs, merges, deploys, or calls external APIs. Git access is read-only.

## One-time install

```bash
node scripts/install-global.mjs            # install skills + support files
node scripts/install-global.mjs --dry-run  # preview, writes nothing
node scripts/install-global.mjs --uninstall
```

Copies support files to `~/.verified-ai-coding/` and installs skills to `~/.claude/skills/`, rewriting each skill's `templates/`·`prompts/`·`scripts/`·`agents/` references to absolute paths and validating every one resolves (fails loud otherwise). **Restart Claude Code** after installing. (`probe/` evidence references stay repo-relative — informational.)

## The loop (from your target repo, e.g. XR-Main)

```bash
L=~/.verified-ai-coding/scripts/verified-ai-loop.mjs

# → BROAD REQUEST ("fix all issues", "audit the repo")? triage FIRST into audit-triage.md,
#   then select ONE approved slice/cluster and run `new` for just that. Don't implement the queue.
node $L new "Recover stuck paid evaluations"   # scaffold .verified-ai/runs/<date>-<slug>/
# → fill request/contract/enforcement-path/redteam/implementation-plan/allowed-forbidden-files
# → APPROVE SCOPE  (human gate)
# → implement inside allowed files
# → paste slice-scoped output into test-output.md (label each result with its proof depth):
#     npx vitest run <slice test file>
#     npx tsc --noEmit -p tsconfig.json | grep <touched files>
node scripts/check-allowed-files.mjs <run-dir>/allowed-forbidden-files.md  # scope gate: diff ⊆ allowed
node $L status <run-dir>     # which artifacts are filled; warns on changes outside allowed list
node $L bundle <run-dir>     # validates inputs, captures git diff, assembles review-bundle.md
node $L review <run-dir>     # runs fresh-context reviewer → reviewer-result.md (fail-closed on INVALID)
# → if NEEDS_REVIEW/FAIL: bounded remediation, re-run gates, re-run review
node $L finalize <run-dir>   # drafts final-scorecard.md + pr-body.md
# → COMMIT / PR  (human gate — you do this, the loop never does)
```

`finalize` refuses a final PASS unless the reviewer returned PASS. For a NEEDS_REVIEW/FAIL you can proceed only with an explicit human override:

```bash
node $L finalize <run-dir> --override "accepted by lead: residual is out-of-scope, low risk"
```

## What's automated vs gated

- **Script-automated:** run-folder creation, artifact validation, bundle assembly, reviewer run + parse + fail-closed, scorecard/PR-body drafting.
- **Claude-automated (under the approved contract):** request/contract/enforcement/redteam/implementation, running the slice-scoped gates, bounded remediation.
- **Human-gated:** scope approval; schema change; external egress; **commit; PR; merge; deploy**; any file outside the allowed list; destructive commands.

## Safety rules (enforced / encoded)

- **Deterministic gates outrank the reviewer** — a red test/typecheck is FAIL regardless of the model's verdict.
- **Slice-scoped gates** — never a repo-wide pass/fail (XR-Main has ~600 pre-existing typecheck errors); scope to touched files.
- Reviewer `INVALID` / `INVALID-TOOLSET-MISMATCH` **blocks** a final PASS (fail closed).
- The reviewer is **fresh-context, same-vendor** — not different-vendor, not adversarial-isolated.
- Proof artifacts (the run folder) exist before commit. No schema change / egress / commit / PR / merge / deploy without explicit human approval.
