# Risk map — team hub

## Risk classification

Initial classification: L2
Final level: L3

## Justification

Initial L2 — the spec combines money, private data of minors, and access-control boundaries:

> with card payment — charge on order

Card payment with capture at order time is squarely L2 (money movement, entitlement state).

> All of it should respect who's in which cohort — nobody sees another cohort's stuff.

Cohort isolation over posts, film clips of minors, RSVPs, and orders is permissions + private
user data — L2.

> Kids under 13 can't post comments themselves (parents only).

An age-gated rule over minors' participation is a must-never status condition — L2.

Escalated to Final L3 because of the badge-publication path:

> athletes earn badges for attendance streaks, and badges show on their public recruiting
> profile.

combined with the spec's own statement that cohorts include children under 13. Rendering
attendance-derived data about minors on a public page is minors' data + public output — the
skill's definition of L3. The escalation is owned by one path only (see per-area levels); it is
also why OQ-001 is high-severity and why INV-17 is default-deny until the user answers.

Per-area levels (Final = maximum):

- Badge public display (Slice 12): **L3** — minors' data + public output.
- Store/payments (Slices 8–11): **L2** — money, entitlement, refund paths.
- Cohort isolation, file area, under-13 rule, SMS reminders, CSV export
  (Slices 2–7, 13): **L2** — permissions, minors' private data, messaging consent.
- Hub schema and page scaffolding (Slice 1): **L1** — additive structure, no behavior.

No downgrade — Final ≥ Initial, so no downgrade justification is required.
