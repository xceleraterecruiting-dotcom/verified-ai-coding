# Spec intake — team hub for cohorts

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

Add a per-cohort "team hub" to an existing youth-sports system. The hub bundles six capabilities,
all hard-scoped to cohort membership:

1. **Message board** — coaches create posts; parents comment; every comment passes a profanity
   filter and carries a report button; athletes under 13 may never comment themselves (their
   parents comment instead).
2. **File area** — coaches upload practice plans and film clips, max 100MB per file; only that
   cohort's members can see/download them.
3. **RSVP** — per-session RSVP so coaches see headcount; an automatic reminder text (SMS) goes
   out the morning of each session.
4. **Store** — parents buy already-stocked gear (shirts/shorts) with a card; the card is charged
   at order time; fulfillment is handing the item over at practice.
5. **Badges** — athletes earn badges for attendance streaks; earned badges are displayed on the
   athlete's existing public recruiting profile.
6. **Attendance CSV export** — coaches can export attendance as CSV.

Cross-cutting law: nobody sees another cohort's content, and under-13 children cannot post.

## Interpretation notes

Step 0 yielded **no readable project context**: this plan is compiled without access to the
existing codebase. Every existing-system component the spec leans on — cohorts and cohort
membership, athlete/parent/coach accounts and their linkage, sessions and attendance records,
public recruiting profiles, gear stock records, auth — is treated as an **interface to be
confirmed** at the start of the slice that first touches it. All file paths in
`implementation-slices.md` are provisional for the same reason (see A8).

- **"nobody sees another cohort's stuff"** — interpreted as server-side authorization on every
  read and write (data never leaves the server for non-members). Rejected reading: UI-level
  hiding/filtering only, which would leak via direct URL or API access.
- **"charge on order"** — interpreted as capturing the card payment synchronously at checkout.
  Rejected reading: authorize at order and capture at fulfillment (pickup at practice), which the
  phrase "charge on order" rules out.
- **"automatic reminder text"** — interpreted as SMS to a phone number. Rejected readings: push
  notification or email. SMS to guardians of minors raises a consent question (OQ-02).
- **"Kids under 13 can't post comments themselves (parents only)"** — interpreted as: under-13
  athletes are blocked from authoring comments; their parents comment on their behalf. The
  parenthetical "(parents only)" leaves open whether athletes **13 and over** may comment, or
  whether commenting is parents-and-coaches only for everyone. The plan defaults to the
  restrictive reading (A4) and records the ambiguity (OQ-05). Rejected silent choice: letting all
  13+ athletes comment without asking.
- **"badges show on their public recruiting profile"** — interpreted as adding a badge section to
  an existing public profile. Rejected reading: building recruiting profiles themselves (they
  already exist). Public display of attendance-derived data about minors is the plan's highest
  risk and is gated on OQ-03.
- **"And while you're in there, the coaches want CSV export of attendance"** — interpreted as
  in-scope but a separate, independent capability; "while you're in there" does not make it part
  of the message-board work. It gets its own slice.
- **"shirts/shorts we already stock"** — interpreted as: the store sells existing stocked SKUs;
  no new inventory-management capability is requested (non-goal). How stock counts are tracked
  and decremented is unconfirmed (OQ-06).
- **"so coaches know headcount"** — interpreted as a per-session count of "yes" RSVPs visible to
  that cohort's coaches; who records the RSVP (parent vs. athlete) is OQ-08.

## Assumptions

- A1: Cohort membership (which athletes, parents, coaches belong to which cohort) already exists
  in the system and is authoritative; the hub reuses it rather than duplicating it.
- A2: The store sells only existing stocked shirts/shorts; no SKU-management UI is built.
- A3: "Charge on order" means a synchronous card charge at checkout; fulfillment is a manual
  "handed over at practice" status change by staff.
- A4: Pending OQ-05, commenting is restricted to coaches and verified parents of cohort athletes;
  athletes (any age) do not comment. This is the restrictive default; relaxing it is a one-way
  question for the user.
- A5: Badges are limited to attendance-streak badges; no other badge types.
- A6: CSV export is per-cohort, coach-initiated, on demand — not scheduled or emailed.
- A7: Reminder texts go to parents/guardians' phone numbers (athletes may be minors), pending
  OQ-02 on consent and provider.
- A8: All file paths in the slice plan are provisional; each slice's first task is to confirm them
  against the real repository and re-issue the allowed/forbidden lists before any code is written.
- A9: Parent↔athlete account linkage in the existing system is treated as the only acceptable
  authority for "this parent speaks/buys for this child" (identity lens, INV-18); the hub never
  accepts a self-asserted linkage. Whether the existing linkage is actually verified is part of
  OQ-01.

## Open questions

See `open-questions.md`. Four high-severity questions (OQ-01 through OQ-04) are open and block
implementation of the slices they gate.
