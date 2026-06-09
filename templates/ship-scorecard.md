# Ship / No-Ship Scorecard

Read-only output of `ship-review`. It records the verdict per dimension and a single decision. It passes only when the invariant is enforced **below the UI** and **every** redteam case behaves correctly.

## Feature

- **Feature:**
- **Diff / PR:**
- **Reviewer model used:**
- **Date:**

## Dimensions

Each evidence cell carries a **proof-depth label** (SOURCE-TRACE / UNIT-MOCK / SEAM-LEVEL / ROUTE-LEVEL / DB-REAL / LIVE-SMOKE / UI-CLIENT / OPERATOR-CHECK) so a green verdict can't hide a shallow proof. *A passing mock can prove intent while leaving the real failure mode untested.*

| Dimension | Verdict | Evidence (+ proof depth) |
|---|---|---|
| **Behavior** — does what the contract says | PASS / FAIL |  |
| **Grounding** — contract's claims about existing seams matched actual code evidence; impl routed through them, no bypass | PASS / NEEDS_REVIEW / FAIL |  |
| **Client interpretation** — client maps seam outcomes truthfully (success/idempotent-success/refusal/error distinguished; no optimistic success before the backend creates the state) | PASS / NEEDS_REVIEW / FAIL |  |
| **Scope** — diff within approved allowed/forbidden files (`check-allowed-files.mjs`) | PASS / FAIL |  |
| **Safety** — invariants enforced below the UI | PASS / FAIL |  |
| **Tests** — exist, pass, exercise invariants at adequate proof depth | PASS / FAIL |  |
| **Redteam** — every bypass case behaves | PASS / FAIL |  |
| **Observability** — violations visible in prod | PASS / FAIL |  |

> If the work came from a broad audit, link the **triage report** and name the **single selected slice** here; deferred findings stay in the queue, not in this diff.

## Reviewer context

> Required. A PASS without this section is incomplete evidence (see `docs/reviewer-context.md`).

- **Reviewer context level:** Weak / Fresh-context Claude / Different-Claude-model / Different-vendor model / Different-vendor + isolated tools
- **Reviewer mode:**
- **Model / model family, if known:**
- **Builder chat history visible?** yes / no / unknown
- **Cold-review bundle only?** yes / no / unknown
- **Tool restrictions enforced?** yes / no / unknown / not applicable
- **External API / code egress occurred?** yes / no
- **External provider/model, if any:**
- **Bundle type:** sanitized / public / proprietary / unknown
- **Egress approval recorded?** yes / no / not applicable
- **Notes:**

## Blockers

> Open proof obligations, if any. None required for SHIP.

## Decision

**▢ SHIP   ▢ DO NOT SHIP**

- **Rationale:**
- **If DO NOT SHIP:** run bounded remediation against the blockers above, re-run gates, re-review.
