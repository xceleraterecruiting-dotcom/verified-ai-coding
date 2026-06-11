# Open questions

## Open questions

High-severity items block implementation (plan-lint exits BLOCKED) until the user resolves them;
they change invariants, privacy behavior, or slice boundaries and must not be guessed.

- OQ-1 [severity: high] [status: open] What is the authoritative semantics of each source
  system's permission fields (what exactly do `owner`, `teams`, and `roles` grant per system —
  allow-list? deny-list? does `owner`-only mean private? does an absent `roles` field mean
  unrestricted or restricted?), and what canonical principal/group model do they map onto? The
  answer defines the Slice 1 mapping registry and the meaning of INV-3's fail-closed boundary;
  guessing here is exactly how a leak ships.
- OQ-2 [severity: high] [status: open] What is the identity source of truth: which SSO/IdP issues
  the session, and where are an employee's team/role memberships resolved from (IdP groups? HRIS?
  a directory sync?) — including how membership changes propagate? This binds the principal to
  entitlements (identity lens: verified control required) and shapes Slice 2 and INV-4.
- OQ-3 [severity: high] [status: open] What staleness is acceptable between a permission change
  in a source system and its enforcement here (sync cadence bound)? And do the most sensitive
  classes (exec-only, unannounced-deal material) require a stronger guarantee than
  enforce-on-last-sync — e.g., live verification or exclusion from the corpus? Changes INV-6 and
  possibly the Slice 3 design.
- OQ-4 [severity: medium] [status: open] Should the highest-sensitivity document classes be
  excluded from embedding/indexing entirely (defense in depth) rather than indexed and
  ACL-filtered (current assumption A7)?
- OQ-5 [severity: medium] [status: open] What numeric thresholds make "the numbers look good" for
  launch (target groundedness rate, acceptable decline rate, required probe-suite history)?
  Affects AC-8's threshold and the dashboard's launch-readiness presentation.
- OQ-6 [severity: medium] [status: open] Who are the dashboard's viewers, and do any of them lack
  access to some underlying documents? Determines how restrictive the INV-10 aggregates-only
  fallback must be in practice.
- OQ-7 [severity: medium] [status: open] Is single-turn Q&A acceptable for launch (assumption
  A5), or is multi-turn conversation required — which would add a carried-context leak surface
  and new slices?
- OQ-8 [severity: medium] [status: open] How is groundedness measured for the dashboard —
  LLM-as-judge via the gateway, NLI/heuristic overlap, sampled human labels, or a combination —
  and how is that method's own error rate characterized for Legal?
- OQ-9 [severity: low] [status: open] What is the user-facing surface for launch — internal web
  app (assumed), Slack, or both?
- OQ-10 [severity: low] [status: open] Are there latency targets or expected query volumes that
  should shape index and gateway-call design?
