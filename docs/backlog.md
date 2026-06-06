# Backlog

Deferred improvements. None are v0.1 blockers.

## v0.2

- **Make global install fully self-contained.** Either inline required templates/prompts into each SKILL.md or provide a one-command install that copies skills, templates, prompts, and agents into a consistent reachable location. (Today, a global skills-only install activates the two skills but leaves `templates/`, `prompts/`, and `agents/` unreachable — documented as a caveat in `install.md`.)

- **`ship-review` should reconcile a new contract against existing project specs, not only the diff against the contract.** During the XR publish-job slice (Proof #1), the review traced the code correctly but did not catch that the contract's `publishingEnabled` behavior diverged from the prior marketing SPEC. The divergence was sound, but the review should surface contract↔spec drift rather than leaving it to be noticed by hand. Caught manually; logged here.
