# Audit triage

Produced **before** any implementation when the request is broad — "identify all issues," "fix all issues," "audit the repo," "solve everything," "remediate everything."

> **Broad audits produce queues, not diffs.**
> **Verified AI Coding fixes one approved issue cluster at a time.**

## Findings

| ID | Severity | Claim | File/function | Grounding | Evidence | Impact/invariant | Reproducible? | Minimal fix surface | Tests required | Mode | Recommended slice? |
|----|----------|-------|---------------|-----------|----------|------------------|---------------|---------------------|----------------|------|--------------------|
| 1  |          |       |               |           |          |                  |               |                     |                |      |                    |

**Severity:** `BLOCKER` (security, data loss, payment, authz, deploy-breaking, outage, invariant violation) · `HIGH` (real prod bug, clear user/business impact, not immediate data/security loss) · `MEDIUM` (correctness/reliability/observability/maintainability) · `LOW` (cleanup/style/perf/docs/speculative) · `INVALID / RETRACTED` (proven false) · `NEEDS GROUNDING` (not proven from source).

**Grounding level (ledger):** ✅ FIRST-HAND SOURCE (model read the exact file/function/route this run) · 📎 QUOTED/INDIRECT (another agent/tool/grep/summary/prior run quoted it; current model did not re-read the load-bearing code) · ❌ UNPROVEN · 🧪 REPRODUCED (behavior reproduced via test/command/local-or-live run) · 🔁 RETRACTED (disproven — include the disproof; must not be remediated).

> **A finding is not actionable until its grounding level matches its risk.** BLOCKER/HIGH cannot be implemented from 📎 or ❌; upgrade to ✅ or 🧪 first. A claim may stay queued as `NEEDS GROUNDING` but cannot enter implementation.

## Slicing rules
- Do not combine unrelated findings into one implementation.
- Do not implement directly from this report — select the **smallest high-value slice**, then write a contract for that slice only and stop for approval.
- Any auth / payment / webhook / cron / data-write / schema finding → **Full mode**.
- Multiple BLOCKER/HIGH findings → still fix **one issue cluster per run**, unless the user explicitly approves a bundled remediation **and** the contract proves the findings share one invariant and one fix surface.

## Selected slice (after approval)
- **Cluster:** (which finding ID(s), and the single shared invariant + fix surface)
- **Mode:** Full / Light
- **Contract:** link to the per-slice `feature-contract.md`
- **Deferred to queue:** (the findings explicitly NOT in this run)
