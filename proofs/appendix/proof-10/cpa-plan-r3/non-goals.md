# Non-goals

## Non-goals

Deliberately excluded from this plan (deferred or out of scope), not forgotten:

- N1: Per-cohort renewal billing. The launch covers the first enrollment payment per kid; what
  happens when a 6-week cohort ends (re-payment, next-cohort placement, access expiry) is
  deferred (A6, OQ-4).
- N2: Plan changes after a successful payment — per-cohort→full-year upgrades, proration,
  downgrades. Plan choice is fixed at the moment of payment (A6, OQ-5).
- N3: Self-service cancellation and automated refunds. Post-payment changes of mind are handled
  manually by admins via Stripe at launch; the app only raises reconciliation signals (A7,
  OQ-3). In-app reversal exists only for unpaid enrollments (R7).
- N4: A waitlist for the capped evaluation. Full means closed (A5).
- N5: Gear inventory, sizing logistics, and fulfillment tracking. The app records the gear
  entitlement flag and sizes only (R12).
- N6: Rejection emails for not-selected kids. Status is visible in the portal; no email at
  launch (A10).
- N7: Marketing-site content management. The public site carries registration; copy is static.
- N8: SMS or phone notifications; "we'll call the family" is a human process, not a feature.
- N9: Coach/staff accounts beyond a single admin role; per-admin permissions tiers.
- N10: Attendance tracking, evaluation scoring/notes tooling, and skill-tier analytics. Tier is
  a stored label on the enrollment.
- N11: Multi-event support beyond the inaugural evaluation (recurring evaluation days, multiple
  seasons). The schema may carry an event id, but no UI for managing multiple events ships.
- N12: Guardian/multi-parent account sharing for one registration (OQ-11). One bound portal
  account per registration at launch, with audited admin relink as the escape hatch.
- N13: Email-deliverability infrastructure (retries beyond a simple queue, bounce handling,
  templates editor). Best-effort send with admin-visible failure is the launch bar (INV-18).
