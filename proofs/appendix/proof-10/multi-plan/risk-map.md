# Risk map

## Risk classification

Initial classification: L2
Final level: L3

## Justification

Initial L2 was driven by money, permissions, and private-data handling across nearly every
capability:

> with card payment — charge on order

Real card charges with synchronous capture: money movement, double-charge and oversell hazards
(INV-12, INV-13).

> All of it should respect who's in which cohort — nobody sees another cohort's stuff.

A hard cross-cutting authorization law over user content, files, RSVPs, and orders (INV-01) —
status/permissions territory, squarely L2.

> Kids under 13 can't post comments themselves (parents only).

Age-gated posting for minors plus parent-on-behalf-of-child authority (INV-03, INV-18).

Escalation to L3 (escalation is free; no downgrade involved) is driven by one specific
interaction the spec states plainly:

> athletes earn badges for attendance streaks, and badges show on their public recruiting
> profile.

Athletes in a system with an explicit under-13 population are largely minors. Publishing
attendance-derived badges on a **public** profile is minors' data + public output — the L3
definition verbatim. A streak badge (and its absence or disappearance) leaks a minor's physical
attendance pattern to the open internet. That path carries INV-16 [L3] and is additionally
blocked on OQ-03 (guardian consent).

**Per-area levels** (Final level is the plan's maximum):

- Badge display on public recruiting profile — **L3** (minors' data + public output).
- Store/payments — L2 (money). SMS reminders — L2 (consent/regulated messaging, OQ-02).
- Cohort isolation, file access, comment age gate, CSV export — L2 (permissions, minors' data,
  private content).
- Profanity-filter internals, 100MB size check, RSVP mechanics, reminder dedup — L1.
- Hub page layout/presentation — L0.
