# Open questions — team hub

## Open questions

High severity = the answer changes an invariant, a money/auth/privacy/publishing behavior, or
slice boundaries. High + open blocks implementation of the slices listed; the compiler does not
resolve these by picking the convenient reading.

**High (blocking)**

- OQ-001 [severity: high] [status: open] May attendance-streak badges for athletes — a
  population the spec says includes children under 13 — be rendered on PUBLIC recruiting
  profiles, and under what consent regime (guardian consent per athlete? cohort-level policy?
  age threshold?)? This is minors' data + public output (the L3 driver). Until answered,
  INV-17 is default-deny and Slice 12's public-render step cannot ship.
- OQ-002 [severity: high] [status: open] What is the canonical source of "attendance"? The
  spec builds RSVP (declared intent) but awards badges and exports CSV of attendance (actual
  presence). Does the existing system record actual attendance/check-in? If yes, what is the
  interface? If no, is RSVP an acceptable proxy, or must a check-in capability be built (a
  re-plan: new slices)? Changes slice boundaries for Slices 12 and 13.
- OQ-003 [severity: high] [status: open] Do parents' phone numbers carry documented SMS
  opt-in consent usable for automated reminder texts (and is there an existing SMS provider
  integration)? Sending automated texts without recorded consent is a privacy/compliance
  behavior the compiler will not default to. Blocks Slice 7's send path (INV-07 fails closed
  meanwhile).
- OQ-004 [severity: high] [status: open] What is the authoritative, verified source for (a)
  the parent↔athlete link and (b) athlete date of birth — provided-at-signup claims, or
  verified records? The under-13 ban (INV-02), comment authorship rules, and order binding
  (INV-16) all key off it (identity lens: a provided identifier is a claim, not evidence). If
  these are unverified claims, the enforcement story for INV-02 changes.

**Medium**

- OQ-005 [severity: medium] [status: open] Which payment provider, and what is the refund
  mechanism for the mandatory money-captured-but-order-refused path (A10/INV-14) — automatic
  provider refund or manual with alert?
- OQ-006 [severity: medium] [status: open] Who receives the morning-of reminder — parents who
  RSVP'd yes, everyone un-responded, or all cohort parents — and at what local time/timezone?
  Provisional default (lens-free, needs confirmation): parents of yes-RSVPs.
- OQ-007 [severity: medium] [status: open] Profanity filter mechanism (static blocklist vs
  service) and locale; is there an appeal/override path for false positives (coach can
  unblock)?
- OQ-008 [severity: medium] [status: open] CSV export columns — does it include athlete names
  or other minor PII, per-session detail or aggregates, and a date range?
- OQ-009 [severity: medium] [status: open] Allowed file types for the file area, and is
  malware scanning required before a file becomes downloadable?
- OQ-010 [severity: medium] [status: open] Is stock decremented at order time (can the store
  oversell shirts/shorts), and what happens to a paid order that cannot be fulfilled for stock
  reasons (feeds the INV-14 refund/reconciliation path)?

**Low**

- OQ-011 [severity: low] [status: open] Badge streak definitions — thresholds (e.g., 5/10/20
  consecutive sessions), and whether streaks reset on absence vs missed RSVP.
- OQ-012 [severity: low] [status: open] May athletes 13+ comment? Spec grants commenting to
  parents and bans under-13 athletes; the plan defaults to "athletes never comment".
- OQ-013 [severity: low] [status: open] Per-cohort storage quota or file-count limit beyond
  the 100MB per-file cap; retention policy for film clips.
