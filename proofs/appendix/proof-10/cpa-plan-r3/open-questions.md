# Open questions

## Open questions

Severity rule: high = the answer changes an invariant, money/auth/privacy behavior, or slice
boundaries. Where the lenses mandate a fail-closed default for an otherwise-high ambiguity, the
default is adopted as a labeled assumption and the confirmation question is filed at medium —
the adopted behavior is the strict reading, so a different answer can only loosen it.

- OQ-1 [severity: low] [status: open] Exact cap value and unit: is 60 the hard kid-count cap, or "around 60" meaning admins want to tune it at runtime? Adopted: configurable integer, default 60, counted in kids (A5).
- OQ-2 [severity: medium] [status: open] When a kid is placed into a cohort whose position differs from the position typed at registration, which position prices the enrollment? Adopted (A3): the cohort's position — they pay for the training they receive. A different answer changes owed amounts in edge cases but not the INV-6 mechanism.
- OQ-3 [severity: medium] [status: open] For payments landing on withdrawn/superseded/already-paid obligations (INV-8/10/11), should the system auto-refund via the Stripe API, or is hold-funds + reconciliation case + manual admin refund acceptable at launch? Adopted (A7): manual; auto-refund would add a money-moving slice.
- OQ-4 [severity: medium] [status: open] What happens when a 6-week per-cohort enrollment ends — does the family re-pay in-app for the next cohort, does access expire, is there re-selection? Deferred as non-goal N1; launch covers the first payment only (A6).
- OQ-5 [severity: medium] [status: open] Can a family that paid per-cohort upgrade to full-year later, and at what proration? Deferred as non-goal N2; plan choice is fixed at payment time (A6).
- OQ-6 [severity: medium] [status: open] When the registration email was mistyped, is unreachable, or the mailbox is recycled/reassigned after binding, what is the recovery flow? Adopted (A2): audited admin relink only — no self-service claim; confirm admins accept doing this by hand at launch.
- OQ-7 [severity: medium] [status: open] Is a typed-name waiver legally sufficient for liability covering minors in your state, and does counsel require specific waiver text retention/versioning beyond A9 (e.g., IP address, re-acceptance per season)?
- OQ-8 [severity: low] [status: open] Families with multiple selected kids: is one Stripe checkout per kid acceptable at launch (A4), or is a combined family checkout required?
- OQ-9 [severity: low] [status: open] Should not-selected families receive an email, or is portal status alone correct at launch (A10)?
- OQ-10 [severity: low] [status: open] Do admins need gear-size reporting/export for fulfillment (sizes are captured but fulfillment is non-goal N5)?
- OQ-11 [severity: medium] [status: open] Two-guardian households: should a second verified parent email be linkable to the same registration, or is one bound account per registration acceptable at launch (non-goal N12)?
- OQ-12 [severity: low] [status: open] Are announcements ever academy-wide (all cohorts), or always per-cohort (A11)?
