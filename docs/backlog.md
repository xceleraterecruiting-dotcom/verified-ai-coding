# Backlog

Deferred improvements. None are v0.1 blockers.

## v0.7+ Tooling Backlog

- [ ] **BACKLOG — make-bundle: cannot ingest an untracked directory (EISDIR).** See [issue #1](https://github.com/xceleraterecruiting-dotcom/verified-ai-coding/issues/1). Do not implement before explicit approval.
- [ ] **BACKLOG — scope/allowed-files evidence is bound to tree state at capture time.** See [issue #2](https://github.com/xceleraterecruiting-dotcom/verified-ai-coding/issues/2). Do not implement before explicit approval.

## v0.3 — reviewer independence

- [x] **Reviewer context metadata:** every ship-review result must state Weak / Fresh-context Claude / Different-Claude-model / Different-vendor model / Different-vendor + isolated tools. — *Addressed: `skills/ship-review/SKILL.md` (## Reviewer context), `templates/ship-scorecard.md`, `templates/review-bundle.md`, and `docs/reviewer-context.md`.*
- [~] **Capability preflight:** verify what this Claude Code version supports for subagents, context isolation, skill forking, model selection, and tool restrictions. — *Read-only preflight run; findings recorded. Enforcement of tool restrictions and model selection is documented/configurable but not test-verified.*
- [~] **External-review egress policy:** require explicit recording of provider/model, bundle type, and egress approval. — *Policy + recording fields added (`docs/reviewer-context.md`, scorecard); enforcing tooling not built.*
- [x] **Agentic review — fresh-context / isolated-bundle (same-vendor):** built on probe-verified config #3 (`skills/independent-ship-review/`, `scripts/independent-review.mjs`). Launcher fails closed via a deterministic toolset gate. Honest label: Fresh-context Claude + bundle-only (enforced standard tools), same-vendor, **not** adversarial-isolated, **not** different-vendor. — *Capability preflight items D/F/H now test-verified by `probe/results-*.md`.*
- [ ] **Different-vendor review path:** build an explicit-egress external reviewer using env-based API keys, sanitized bundles by default, and per-bundle approval for proprietary code.
- [ ] **Different-vendor + isolated-tools mode:** investigate whether external review can be paired with local read-only tooling without leaking more context than intended.
- [ ] **Optional hooks:** only after reviewer isolation is proven.
- [ ] **Bounded remediation agent:** only after an independent/fresh-context review path is real.

## v0.2

- [~] **v0.2 executable proof gates: partially addressed** by `examples/multi-layer-entitlement-gate/`, a fixture-scoped AST enforcement-path checker with a self-verifying runner. Remaining: CI integration, generalized import tracing, contract schema/linter, and broader enforcement-path verification.

- [ ] **Make global install fully self-contained.** Either inline required templates/prompts into each SKILL.md or provide a one-command install that copies skills, templates, prompts, and agents into a consistent reachable location. (Today, a global skills-only install activates the two skills but leaves `templates/`, `prompts/`, and `agents/` unreachable — documented as a caveat in `install.md`.) — *Open; not touched by the claim-verification patch.*

- [x] **`ship-review` should reconcile a new contract against existing project specs, not only the diff against the contract.** During the XR publish-job slice (Proof #1), the review traced the code correctly but did not catch that the contract's `publishingEnabled` behavior diverged from the prior marketing SPEC. The divergence was sound, but the review should surface contract↔spec drift rather than leaving it to be noticed by hand. Caught manually; logged here. — *Addressed in `skills/ship-review/SKILL.md` (Step 1: reconcile the contract against existing specs and surface drift as a finding), under the "Claim verification before remediation" principle in `skills/verified-implementation/SKILL.md`.*

- [x] **Trace the full enforcement path before declaring an invariant satisfied — invariants span multiple layers.** Real production hit: a two-layer entitlement bug where one session fixed the decision function and another fixed the page that calls it; neither diagnosed that the bug was two-layered, each treating the invariant as satisfied because its own layer was correct. A single-node fix can ship a correct call to a still-broken node and leave the invariant violated end to end. — *Addressed in `skills/verified-implementation/SKILL.md` (new "Step 4 — Map the enforcement path": the contract must map the decision point + every entry point and each node's verification status, flagging unverified nodes as open risk) and cross-referenced in `skills/ship-review/SKILL.md` (Step 1).*
