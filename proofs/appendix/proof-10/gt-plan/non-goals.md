# Non-goals

## Non-goals

- Building or modifying the document sync/connectors from source systems — the spec states docs
  already land in Postgres with their metadata; this plan consumes that output (A1).
- Writing back to source systems (editing documents, changing permissions) — read-only assistant.
- Multi-turn conversation memory / chat history context — deferred; initial scope is single-turn
  Q&A (A5, OQ-7). If added later it is a new plan: carried context is a new leak surface.
- Automated launch decision — the dashboard supplies numbers; "we launch when the numbers look
  good" is a human call. Thresholds are OQ-5, and no launch-gating automation is built.
- Model fine-tuning or training on company documents — retrieval-augmented generation only;
  training would copy restricted content into weights and void the access model.
- Public or external (non-employee) access of any kind — internal, SSO-authenticated only.
- Live per-query authorization callbacks to source systems' native ACL APIs — enforcement is
  against the synced, normalized metadata in Postgres. Whether the highest-sensitivity material
  needs stronger guarantees is OQ-3/OQ-4 and is deferred until answered, not silently built.
- Mobile apps, Slack/Teams integrations, or any surface beyond a single internal web UI (OQ-9).
- Document-level redaction/summarized partial access (showing a permitted excerpt of an otherwise
  restricted document) — access is whole-document, allow or deny.
- Analytics beyond the trust dashboard (usage growth, topic clustering, per-user behavior
  profiling) — out of scope for launch.
- Latency/scale engineering beyond reasonable defaults — no SLOs are specified (OQ-10).
