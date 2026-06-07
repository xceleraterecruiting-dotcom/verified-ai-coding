# Isolated-Bundle Review Result

Output of `independent-ship-review` (the agentic, fresh-context execution of a cold review). This is **advisory** — deterministic gates remain the source of truth. A verdict here is only valid if the launcher's toolset gate confirmed isolation actually applied.

## Verdict

**▢ PASS  ▢ NEEDS_REVIEW  ▢ FAIL  ▢ INVALID  ▢ INVALID-TOOLSET-MISMATCH**

> `INVALID` / `INVALID-TOOLSET-MISMATCH` mean the review could not be trusted (isolation not verified / output unparseable). Treat as **no review performed** — never as a PASS.

## Findings
- **Blockers (must fix):**
- **Non-blocking suggestions:**

## Reviewer context (required)

- **Reviewer context level:** Fresh-context Claude + bundle-only (enforced tools, verified config #3)
- **Reviewer mode:** headless `claude -p` · `--disallowedTools` (config #3) · `--strict-mcp-config` · `--output-format json`
- **Model / model family:** Claude `<actual/requested>` — *self-reported; may silently fall back, not independently verified*
- **Builder chat history visible?** no
- **Cold-review bundle only?** enforced for write/read/delegate/egress; **residual:** ToolSearch + deferred Task* remain
- **Tool restrictions enforced?** yes (probe-verified set) **and launcher-asserted at runtime**
- **Effective toolset (reported & gated):** `[ ... ]`
- **External API / code egress occurred?** no
- **External provider/model:** n/a (same-vendor Claude)
- **Bundle type:** sanitized / public / proprietary
- **Egress approval recorded?** n/a
- **Notes / honest caveats:**
  - **Same-vendor / same-family** — this is **not** different-vendor independence.
  - **Not adversarial-isolated** — the ToolSearch/Task* residual cannot be denied without the restriction failing open (probe #4); isolation holds for a *cooperative* reviewer, not a hostile one.
  - **Deterministic gates remain the source of truth;** this review is advisory.

## Decision
This review **informs** the ship/no-ship scorecard's "Safety/Reviewer" inputs. It does not, by itself, authorize a ship.
