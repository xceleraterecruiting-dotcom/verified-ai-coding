# Open questions

## Open questions

Format: `- OQ-<id> [severity: high|medium|low] [status: open|resolved: how] question`.
High severity = the answer changes an invariant, money/auth/privacy behavior, or slice
boundaries. The two high-severity questions below are **open and block implementation** of
Slices 6–7 (plan-lint will report BLOCKED until the founder answers; that is the intended
state — these are the founder's calls, not the compiler's).

- OQ-1 [severity: high] [status: open] What happens after payment? The spec makes decisions reversible only "before payment happens". Can an admin unenroll a paid kid, and if so is there a refund (full, prorated, manual via Stripe dashboard)? The answer changes INV-5/INV-10's post-payment branches, the enrollment state machine, and whether a refund slice exists — money behavior, so the compiler must not pick a default.
- OQ-2 [severity: high] [status: open] What exactly does "full year upfront" buy, and how do subsequent cohorts work for per-cohort payers? Does a per-cohort kid need a new selection + payment each 6-week cohort, or do they continue automatically with a new charge? Does full-year auto-place the kid in successive cohorts? The answer changes the charge model (one-time vs repeated), enrollment↔cohort cardinality, and Slice 7's scope — money behavior and slice boundaries.
- OQ-3 [severity: medium] [status: open] When a parent's portal email differs from the registration email (typo at registration, family uses a different address, email later recycled or changed), what is the supported recovery path? Plan assumes admin-mediated manual linking (A1) — confirm, and confirm whether parents may self-initiate a re-verification flow.
- OQ-4 [severity: medium] [status: open] Is the cap exactly 60 kids, and should admins be able to change it while registration is open ("around 60" suggests flexibility)? Also: when a multi-kid family submission straddles the remaining capacity, refuse the whole family or accept partial? Plan default: configurable cap, default 60, refuse the whole submission (atomic per family).
- OQ-5 [severity: medium] [status: open] If a kid's position at selection differs from the registered position (e.g., evaluated as a DB after registering as WR), which position prices the enrollment? Plan assumes the position on the selection/enrollment record at payment time (A4) — confirm, since QB vs non-QB is a $700–$2,300 difference.
- OQ-6 [severity: medium] [status: open] Is gear entitlement purely recorded data (sizes + flag, fulfillment offline — A9), or does the app need any fulfillment tracking (ordered/delivered states)?
- OQ-7 [severity: low] [status: open] Are there legal requirements for the waiver beyond typed name + timestamp (version display, re-acceptance on text changes, IP capture, retention period)? Plan stores name + timestamp + waiver version (INV-7).
- OQ-8 [severity: low] [status: open] Are announcements always cohort-scoped, or do admins also need academy-wide announcements visible to all enrolled families? Plan builds cohort-scoped only.
- OQ-9 [severity: medium] [status: open] How are admin accounts provisioned (invite-only list in the auth provider, env-configured allowlist, first-user bootstrap)? A10 assumes an explicit admin role in the hosted auth provider; confirm the mechanism before Slice 4 ships.
- OQ-10 [severity: low] [status: open] Should not-selected families receive any automated communication, or is that intentionally manual ("we'll call")? Plan sends nothing (non-goal 6).
- OQ-11 [severity: medium] [status: open] Free evaluation day: does anything gate attendance besides registration (check-in list for admins on the day)? Plan provides the registration list as the de facto roster; confirm no check-in feature is expected at launch.
