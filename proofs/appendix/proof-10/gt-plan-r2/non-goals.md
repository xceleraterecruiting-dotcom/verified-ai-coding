# Non-goals

## Non-goals

- NG-1: Building or modifying the upstream document sync connectors. The spec states docs "land in
  Postgres with their metadata"; this plan consumes landed rows (A8). Connector reliability and
  upstream permission correctness are out of scope (their *interpretation* is in scope — Slice 1).
- NG-2: Model training or fine-tuning. Generation uses existing models via the existing gateway.
- NG-3: External or public users. The assistant is internal-only; no public publishing surface.
  (Consequently the AI-output lens's public-publish approval requirement is adapted per A2.)
- NG-4: Per-answer human review/moderation workflow. Substituted by the launch gate plus the
  pre-launch shadow/dry-run eval phase (A2, lens-derived).
- NG-5: Automated remediation of conflicting or missing source-system permissions. Quarantine and
  surface for humans (INV-3); do not auto-resolve.
- NG-6: Multi-language support (A6). Deferred phase.
- NG-7: Document authoring/editing, summarizing whole repositories on a schedule, proactive
  notifications, or any write-back to source systems. Question answering only.
- NG-8: Personalization, memory of past conversations across sessions, or user feedback learning
  loops. Deferred; if added later they re-trigger the evidence-sufficiency lens.
- NG-9: Timing/traffic side-channel hardening beyond uniform response shape (e.g., padding
  response latency to defeat statistical existence inference) — explicitly deferred, see OQ-5.
- NG-10: Production launch itself. Launch is blocked until OQ-1, OQ-2, OQ-3 are resolved and the
  launch gate (Slice 8) reports PASS on sufficient, fresh evidence.
- NG-11: Cost optimization, caching strategy tuning, and rate limiting beyond basic abuse safety.
