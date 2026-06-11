# Non-goals

## Non-goals

Deliberately excluded from this plan (each is a decision, not an oversight):

1. **Refund and post-payment cancellation flows.** The spec defines reversibility only before
   payment. No refund UI, proration, or Stripe refund automation is planned until OQ-1 is
   answered; until then, post-payment corrections are manual (Stripe dashboard + admin note).
2. **Recurring/subscription billing and auto-renewal across cohorts.** Per-cohort continuation
   mechanics are unspecified (OQ-2). This plan implements single one-time charges only; no Stripe
   subscriptions.
3. **Waitlist for the capped evaluation.** "When it's full it's full" — registrations are refused
   at capacity; no waitlist, standby, or over-subscription handling.
4. **Self-service registration editing.** Families cannot edit kid details after submitting;
   corrections go through admins at launch.
5. **Marketing-site content management.** The public site's informational content is static; no
   CMS. Only the registration flow is dynamic.
6. **Notification of non-selected families.** The spec specifies email only for selection. Any
   "not selected" communication is manual at launch (OQ-10 records the question).
7. **Gear fulfillment workflow.** Gear entitlement is recorded as data (sizes + entitlement
   flag); ordering, inventory, and distribution are offline (A9, OQ-6).
8. **Coach-facing accounts and tools.** Only parents and admins have accounts; coaches, rosters
   for coaches, and attendance tracking are out of scope.
9. **In-app messaging / SMS.** Announcements are one-way portal content; no chat, no SMS at
   launch ("we'll call the family" is a human process).
10. **Multi-academy tenancy.** Single academy; no tenant model.
11. **Payment methods beyond card via Stripe.** No ACH, cash recording, or payment plans /
    installments.
12. **Analytics, reporting, and exports.** Beyond the admin lists needed to operate, no
    reporting layer at launch.
13. **Native mobile apps.** Responsive web only.
14. **Future evaluation events UX.** The data model permits more events (A7), but launch builds
    only the inaugural event's flow; multi-event admin UX is deferred.
