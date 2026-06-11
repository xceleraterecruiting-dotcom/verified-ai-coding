# Spec intake — team hub (multi-slice)

## Original spec (verbatim)

> Big idea: a "team hub" for each cohort. Parents and athletes get a shared space with: a message
> board (coaches post, parents can comment, comments need a profanity filter and a report button);
> a file area for practice plans and film clips (coaches upload, 100MB max, only that cohort can
> see them); RSVP for each session so coaches know headcount, with an automatic reminder text the
> morning of; and a small store where parents can buy extra gear (shirts/shorts we already stock)
> with card payment — charge on order, we fulfill at practice.
>
> Also, badges: athletes earn badges for attendance streaks, and badges show on their public
> recruiting profile. And while you're in there, the coaches want CSV export of attendance.
>
> All of it should respect who's in which cohort — nobody sees another cohort's stuff. Kids under
> 13 can't post comments themselves (parents only).

## Compiler paraphrase

Add a per-cohort "team hub" to an existing system that already has cohorts, coaches, parents,
athletes, practice sessions, and public recruiting profiles. The hub bundles five capabilities,
all strictly cohort-isolated:

1. **Message board** — coaches create posts; parents comment; comments pass a profanity filter
   and carry a report button; athletes under 13 may never comment themselves.
2. **File area** — coaches upload practice plans and film clips (≤100MB each); only that
   cohort's members can see them.
3. **RSVP** — per practice session, so coaches see headcount; an automatic reminder text (SMS)
   goes out the morning of each session.
4. **Gear store** — parents buy already-stocked shirts/shorts with card payment, charged at
   order time; goods are handed over at practice (no shipping).
5. **Badges + export** — athletes earn badges for attendance streaks; badges render on their
   public recruiting profile; coaches get a CSV export of attendance.

## Interpretation notes

- **Step 0 yielded no readable project context.** The plan was compiled under a contamination
  fence: no CLAUDE.md, no existing code, no prior specs were available. Every referenced
  existing component (cohort model, membership roles, session schedule, athlete DOB, public
  recruiting profile, SMS capability, inventory) is treated as an **interface to be confirmed**
  at the start of each `verified-implementation` run, not as known fact. Where the existing
  system's behavior matters to an invariant, that is an assumption or open question below.
- **"charge on order"** — read as: payment is captured at checkout time, before fulfillment.
  Rejected reading: authorize at order and capture at fulfillment (the spec's wording "charge on
  order" forces capture-at-order).
- **"attendance"** — the spec builds RSVP (stated intent to attend) but awards badges and
  exports CSVs of *attendance* (actual presence). These are not the same thing, and the spec
  never says whether the existing system tracks actual attendance. I did NOT silently equate
  RSVP with attendance; this is OQ-002 (high). Rejected reading: "attendance just means RSVP."
- **"reminder text"** — read as SMS to parents' phone numbers. Rejected reading: in-app or
  email notification ("text" forces SMS). Whether numbers are opt-in for SMS is OQ-003.
- **"badges show on their public recruiting profile"** — read as: badges render on an
  already-existing, already-public profile page. The spec is silent on whether publishing
  attendance-derived data about minors (explicitly including under-13 athletes) publicly is
  acceptable without guardian consent; per the skill, silence here is ambiguity at L2+, not
  permission — OQ-001 (high), and the badge-display invariant defaults to deny (INV-17).
- **"Kids under 13 can't post comments themselves (parents only)"** — read as a server-enforced
  rule keyed on the athlete's date of birth at submission time, not a UI-only hide. The
  authority and verification of the DOB and the parent↔athlete link is OQ-004 (identity lens).
- **"parents can comment"** — read as: only coaches and parents author content; athletes 13+
  are NOT granted comment rights by this spec (it grants commenting to parents and only bans
  under-13 athletes; whether 13+ athletes may comment is genuinely unstated → OQ-012, low,
  default: athletes do not comment at all). Rejected reading: 13+ athletes may comment.
- **"we already stock"** — read as: no procurement or shipping is in scope; whether stock
  levels are tracked/decremented at order time is unstated → OQ-010 (medium).
- **"while you're in there, the coaches want CSV export"** — read as an in-scope requirement
  (R15), but deliberately isolated into its own slice so its casual phrasing cannot smuggle it
  into an unrelated slice.

## Assumptions

- A1: The existing system provides — as confirmable interfaces — cohorts, memberships with
  coach/parent/athlete roles, a practice-session schedule, athlete date of birth, parent phone
  numbers, and a public recruiting profile page with an extension point. Each slice's first act
  under `verified-implementation` is to confirm the interfaces it consumes.
- A2: Card payment uses a hosted payment provider (Stripe-class); raw card data never touches
  our servers. Provider choice is OQ-005 (medium); the payment invariants are provider-agnostic.
- A3 (lens-derived, payment-depth #1/#2/#11): order totals are computed server-side from a
  canonical price list; entitlement is granted only after grant-time verification of captured
  amount, currency, and capture status; missing/ambiguous payment data fails closed. The spec
  does not state these; they are lens defaults the user would endorse.
- A4 (lens-derived, identity lens): store purchases bind to the authenticated parent's account
  (a verified principal in the cohort), never to a typed-in email or name.
- A5: Single currency (the existing system's local currency); currency is still verified at
  grant time per A3 rather than assumed.
- A6: Profanity-filtered comments are blocked at submission with a stored reason (not published
  then retroactively flagged). Mechanism is OQ-007 (medium).
- A7: Only coaches upload to the file area; parents and athletes have read-only access.
- A8: File-path conventions in the slice plan (`src/hub/...`, `db/migrations/`) are
  **provisional** — Step 0 had no readable repo. They encode the *boundaries* (what each slice
  may and may not touch); the concrete paths must be re-grounded against the real repo when each
  slice's `allowed-forbidden-files.md` is created, preserving the same boundaries.
- A9: "Fulfill at practice" means a coach marks the order fulfilled at handover; no shipping,
  no delivery tracking.
- A10 (lens-derived, payment-depth #9): if money is captured but the order cannot be honored
  (cancel, stock failure), a refund/manual-reconciliation signal is mandatory; "logged" is not
  a path.

## Open questions

See `open-questions.md` — 4 high (all open, blocking), 6 medium, 3 low. The high-severity set
(public badges for minors, attendance data source, SMS consent, parent/DOB identity authority)
blocks Slices 7, 12, and 13 and must be answered by the user, not resolved by the compiler.
