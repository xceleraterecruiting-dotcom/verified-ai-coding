# Open questions

## Open questions

High severity = the answer changes an invariant, a money/auth/privacy/publishing behavior, or
slice boundaries. High + open blocks implementation of the slices it gates (and plan-lint exits
nonzero) until the user resolves it.

- OQ-01 [severity: high] [status: open] How is "under 13" determined, and is the parent↔athlete linkage verified? Does the existing athlete record carry a trustworthy date of birth, and is the parent link provider-verified or self-asserted at signup? The answer defines how INV-03 and INV-18 can be enforced at all (gates Slice 4; identity lens question 1).
- OQ-02 [severity: high] [status: open] SMS reminders: which SMS provider, and do we hold recorded opt-in consent for parents' phone numbers (and an opt-out path)? Texting guardians without recorded consent is a regulated-messaging exposure; the answer shapes INV-10 and gates Slice 7 entirely.
- OQ-03 [severity: high] [status: open] Badges on public recruiting profiles publish attendance-derived data about minors to the open internet. Is there existing guardian consent that covers this, or must badge display be explicit opt-in per athlete? The answer defines INV-16's consent mechanism and gates Slice 11 (the plan's L3 path).
- OQ-04 [severity: high] [status: open] Card payments: which processor (is one already integrated?), and what is the policy when charge-on-order meets a fulfillment failure — athlete no-shows at practice, or stock is gone after charge? Refund/void policy is money behavior; the answer shapes INV-12 handling and gates Slices 8 and 9.
- OQ-05 [severity: medium] [status: open] May athletes aged 13+ post comments, or is commenting parents-and-coaches only? The spec says "parents can comment" but the under-13 clause implies older kids might. Plan default (A4) is the restrictive reading: athletes do not comment.
- OQ-06 [severity: medium] [status: open] Where is gear stock quantity tracked today, and should hub orders decrement that same record (shared source of truth) or a store-local copy? Affects how INV-13 is implemented; interface half is confirmed during Slice 8.
- OQ-07 [severity: medium] [status: open] What does the report button do beyond creating a record — auto-hide the comment pending review, or leave it visible and notify coaches? Plan default: visible + coach notification, no auto-hide (INV-05 as written).
- OQ-08 [severity: medium] [status: open] Who records an RSVP — the parent on the athlete's behalf, the athlete (13+), or both? Plan default: parent account, athlete attributed; headcount counts athletes.
- OQ-09 [severity: low] [status: open] "Morning of" — what send time and whose timezone? Plan default: 8:00 AM in the cohort's local timezone.
- OQ-10 [severity: low] [status: open] Profanity filter mechanism — maintained wordlist or third-party service? Either satisfies INV-04; choice is cost/maintenance.
- OQ-11 [severity: low] [status: open] CSV export columns and date range? Plan default: athlete name + per-session attendance status, all sessions to date.
- OQ-12 [severity: low] [status: open] Allowed file types for "film clips" and whether download-only is acceptable (vs. inline playback)? Plan default: common video/document types, download or browser-native playback, no transcoding (N11).
