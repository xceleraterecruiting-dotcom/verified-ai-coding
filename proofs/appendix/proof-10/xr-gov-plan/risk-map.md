# Risk map

## Risk classification

Initial classification: L3
Final level: L3

## Justification

This plan is L3 on the harness's own definition — minors' data combined with public output,
plus AI-generated public content — and it sits adjacent to private data that must not leak.

The subjects are minors, published publicly:

> The posts are about real kids — high schoolers, sometimes middle schoolers.

The same database holds exactly the material a leak would turn into harm:

> We have internal evaluations and private notes from coaches in the database too, and contact
> info for athletes and parents.

The output is AI-generated public content on brand accounts:

> AI writes the copy and we render branded graphics

The spec explicitly requests removal of the human gate over time — an automated-publishing
decision about minors' content that must be surfaced, not granted:

> Ideally this is hands-off: it generates posts on a schedule and they go out automatically once
> we trust the quality

And the spec's own never-events are reputational/safety invariants:

> It must never embarrass us: no made-up stats, no fake quotes, nothing that could hurt a kid or
> get us in trouble with the platforms.

Per-area levels:

- **Publishing path, private-data boundary, claim/quote verification, minor-protection gate,
  photo usage** — L3 (minors + public output + AI generation; INV-1..INV-8).
- **Lifecycle state machine, publish idempotency, audit snapshot, read-only source access** —
  L2 (status transitions, auditability; INV-9..INV-12).
- **Branded graphic templating mechanics, brand-kit config, idea-bank CRUD UI** — L1
  presentation/logic with no business-invariant risk of their own (INV-13), but their outputs
  flow through the L3 gate regardless.

The Final level is the plan's maximum: L3. No downgrade is proposed.
