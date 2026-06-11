# Non-goals — team hub

## Non-goals

Deliberately excluded from this plan (each is a named decision, not a missing thought):

- **Building a new attendance check-in system.** The plan consumes a canonical attendance
  source as an interface (OQ-002). If the user's answer is "no such source exists, build
  check-in", that is a re-plan with new slices — it is not silently inside Slice 12 or 13.
- **Shipping, delivery tracking, or procurement** for the store. Spec says "we already stock"
  and "we fulfill at practice"; only handover-at-practice is in scope.
- **Inventory/stock-level management.** Whether stock is decremented at order time is OQ-010;
  building a stock ledger is out of scope either way.
- **Self-service refunds UI.** Refunds exist only as the mandatory reconciliation path when
  money is captured but the order cannot be honored (A10); a customer-facing refund flow is
  deferred.
- **Multi-currency pricing.** Single local currency (A5); currency is verified, not configured.
- **Badge types beyond attendance streaks** (skill badges, achievements, etc.).
- **Any other change to the public recruiting profile** beyond the gated badge module.
- **Human moderation staffing/queues beyond surfacing reports to coaches**, and any ML-based
  moderation. The profanity filter is a deterministic submission gate (A6, OQ-007).
- **Email or push notifications.** The spec asks only for a morning-of SMS reminder.
- **Athlete-authored content.** The spec grants posting to coaches and commenting to parents;
  athletes (any age) author nothing in this plan (interpretation note + OQ-012).
- **Direct messaging** between any parties.
- **Changes to the existing auth/registration/membership system.** The hub consumes membership
  as an interface; if the parent↔athlete link or DOB turns out to be unverified (OQ-004), the
  fix is adjudicated with the user, not improvised here.
- **Deferred phases**: none promised by the spec; anything above re-enters only via a new spec.
