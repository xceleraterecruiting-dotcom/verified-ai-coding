# Open questions

High severity = the answer changes an invariant, an auth/privacy behavior, or slice boundaries.
High + open BLOCKS implementation (plan-lint exits nonzero) — these belong to the PM/user and are
not resolved here by picking a convenient reading.

## Open questions

- OQ-1 [severity: high] [status: open] Per-source ACL mapping semantics: for EACH source system, what is the authoritative interpretation of its permission metadata (owner vs teams vs roles precedence, group-name vocabulary, public/empty meaning) into the canonical model, and who adjudicates conflicts? The spec says only "it varies by source system" — this decides what INV-1/INV-3 actually enforce and the content of Slice 1; a wrong guess is a silent leak or a silent lockout.
- OQ-2 [severity: high] [status: open] Launch thresholds and sufficiency minimums: "we launch when the numbers look good" — what are the numeric thresholds for groundedness rate, decline rate, and canary leak count (presumably zero); what minimum eval sample size, query-distribution coverage, and evidence recency window make an EvalRun sufficient; and who signs the go decision (PM? Legal?)? These values define INV-9's gate behavior and Legal's attestation.
- OQ-3 [severity: high] [status: open] Authoritative identity and entitlement source: which IdP/SSO attests employee identity, which directory (HRIS? IdP groups? both?) is authoritative for teams/roles/exec membership, and what is the acceptable entitlement staleness / revocation-propagation bound (minutes? hours?) including offboarding? This decides INV-6/INV-14 concretely and Slice 2's integration target.
- OQ-4 [severity: medium] [status: open] Audit/trace retention and access: GenerationRecords and AuditEvents necessarily contain restricted passages; what retention period applies, who may read them (security team only?), and do gateway-side logs also capture prompt content (and if so, under whose access control)?
- OQ-5 [severity: medium] [status: open] Side-channel depth of "not even a hint": is v1 required to defend against statistical/timing inference of document existence (e.g., latency differences between filtered-empty and truly-empty), or is uniform response shape sufficient for launch? Currently deferred as NG-9.
- OQ-6 [severity: medium] [status: open] ACL-change propagation target: when a document's permissions tighten upstream, what is the maximum acceptable window before the index reflects it (the reindex path in Slice 3 needs a bound to test against)?
- OQ-7 [severity: medium] [status: open] Quarantine operations: who owns the remediation queue for documents quarantined under INV-3, and is there an SLA — given fail-closed means those docs are invisible to everyone, including people who legitimately need them?
- OQ-8 [severity: low] [status: open] Serving surface: web app, Slack bot, or both for v1? Affects UI slice shape only; the answer pipeline is surface-agnostic.
- OQ-9 [severity: low] [status: open] Which model(s)/versions will the gateway route to for generation and for the groundedness judge? Affects eval pinning values, not the mechanism.
