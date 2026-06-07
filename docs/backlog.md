# Backlog

Deferred improvements. None are v0.1 blockers.

## v0.2

- [~] **v0.2 executable proof gates: partially addressed** by `examples/multi-layer-entitlement-gate/`, a fixture-scoped AST enforcement-path checker with a self-verifying runner. Remaining: CI integration, generalized import tracing, contract schema/linter, and broader enforcement-path verification.

- [ ] **Make global install fully self-contained.** Either inline required templates/prompts into each SKILL.md or provide a one-command install that copies skills, templates, prompts, and agents into a consistent reachable location. (Today, a global skills-only install activates the two skills but leaves `templates/`, `prompts/`, and `agents/` unreachable — documented as a caveat in `install.md`.) — *Open; not touched by the claim-verification patch.*

- [x] **`ship-review` should reconcile a new contract against existing project specs, not only the diff against the contract.** During the XR publish-job slice (Proof #1), the review traced the code correctly but did not catch that the contract's `publishingEnabled` behavior diverged from the prior marketing SPEC. The divergence was sound, but the review should surface contract↔spec drift rather than leaving it to be noticed by hand. Caught manually; logged here. — *Addressed in `skills/ship-review/SKILL.md` (Step 1: reconcile the contract against existing specs and surface drift as a finding), under the "Claim verification before remediation" principle in `skills/verified-implementation/SKILL.md`.*

- [x] **Trace the full enforcement path before declaring an invariant satisfied — invariants span multiple layers.** Real production hit: a two-layer entitlement bug where one session fixed the decision function and another fixed the page that calls it; neither diagnosed that the bug was two-layered, each treating the invariant as satisfied because its own layer was correct. A single-node fix can ship a correct call to a still-broken node and leave the invariant violated end to end. — *Addressed in `skills/verified-implementation/SKILL.md` (new "Step 4 — Map the enforcement path": the contract must map the decision point + every entry point and each node's verification status, flagging unverified nodes as open risk) and cross-referenced in `skills/ship-review/SKILL.md` (Step 1).*
