# Risk map

## Risk classification

Initial classification: L3
Final level: L3

## Justification

This is AI-generated public output about minors, drawn from a database that also contains private
notes and contact information, with an explicit request for eventual unattended publishing —
the L3 definition ("minors' data + public output", "AI-generated public output" at L2 escalated
by the minors dimension) is met on the spec's own words:

> The posts are about real kids — high schoolers, sometimes middle schoolers.

> We have internal evaluations and private notes from coaches in the database too, and contact
> info for athletes and parents.

> Ideally this is hands-off: it generates posts on a schedule and they go out automatically once
> we trust the quality

> It must never embarrass us: no made-up stats, no fake quotes, nothing that could hurt a kid or
> get us in trouble with the platforms.

A fabricated stat, a leaked private evaluation, or an unauthorized photo of a middle schooler on
a brand account is public, attributable, possibly legally actionable harm to a child — the
highest-consequence failure mode this platform can produce short of a data breach.

## Per-area levels

- Publishing path (publisher, approval gate, scheduler): **L3** — the never-events live here.
- Claim verification + private-data gate: **L3** — the control that makes everything else safe.
- Photo/likeness handling: **L3** — minors' likeness rights (blocked on OQ-1/OQ-3).
- Generation traceability (model/prompt/run capture): **L2** — auditability, not direct harm.
- Branded graphic templating (fonts/colors, layout): **L1** — presentation, once the photo gate
  and private-data gate are upstream of it.
- Idea-bank CRUD: **L1**.
- Engagement analytics: out of scope (NG-2).

The plan's Final level is the maximum: L3. No downgrade.
