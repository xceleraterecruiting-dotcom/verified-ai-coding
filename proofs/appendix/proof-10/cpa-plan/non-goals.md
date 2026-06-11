# Non-goals

## Non-goals

What this plan deliberately excludes at launch:

- **Refunds and post-payment changes in-app.** Reversal of decisions is required only before
  payment (spec: "we sometimes change our minds before payment happens"). Refunds, post-payment
  un-enrollment, and plan changes are handled manually via the Stripe dashboard / offline (A4,
  OQ-5).
- **Cohort-to-cohort renewal and full-year auto-placement flows.** How a paid per-cohort family
  pays for the *next* cohort, and what cohorts a full-year purchase covers, are open questions
  (OQ-1, OQ-2). No renewal/auto-placement feature is sliced until they are answered; the launch
  plan covers the first payment per child only.
- **Waitlist.** "When it's full it's full" — capacity rejection only, no waitlist.
- **Multiple evaluation events.** One inaugural evaluation day (A1).
- **Payment plans / installments / non-card payment.** Card via Stripe only; no cash/check
  recording in-app.
- **In-app price administration.** Prices are fixed constants at launch (A6, OQ-9).
- **Sibling or multi-child discounts.** Not mentioned in the spec; not built.
- **Email reliability infrastructure.** No retry queues, delivery dashboards, or guaranteed
  delivery — best-effort send with failure logging only (P6, A9).
- **Marketing/content site beyond the registration flow.** The public site's non-registration
  content (copy, photos) is out of plan scope.
- **Roster/coach-facing tooling, attendance, messaging, mobile apps, data export/reporting.**
  Not requested.
- **Custom authentication.** Hosted auth provider only; no password storage in-app.
- **Admin role tiers.** A single admin role; no granular admin permissions.
