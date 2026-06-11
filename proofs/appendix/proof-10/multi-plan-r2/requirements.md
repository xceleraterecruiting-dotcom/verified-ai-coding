# Requirements — team hub

## Requirements

Traceability: spec lines quoted in `risk-map.md` and `spec-intake.md` (verbatim block).

- R1: Each cohort gets a "team hub" — a shared space visible to that cohort's coaches, parents,
  and athletes. (spec: "a 'team hub' for each cohort. Parents and athletes get a shared space")
- R2: Coaches can create message-board posts in their cohort's hub. (spec: "coaches post")
- R3: Parents can comment on posts in their cohort's hub. (spec: "parents can comment")
- R4: Every comment passes a profanity filter before it is visible. (spec: "comments need a
  profanity filter")
- R5: Every visible comment carries a report button; reports are recorded and surfaced to the
  cohort's coaches. (spec: "and a report button")
- R6: An athlete under 13 can never author a comment; the rule is enforced server-side. (spec:
  "Kids under 13 can't post comments themselves (parents only)")
- R7: Coaches can upload files (practice plans, film clips) to their cohort's file area. (spec:
  "a file area for practice plans and film clips (coaches upload...)")
- R8: Uploads larger than 100MB are rejected server-side. (spec: "100MB max")
- R9: A cohort's files are visible only to that cohort's members; file delivery itself is
  access-controlled (no durable public URLs). (spec: "only that cohort can see them")
- R10: Each practice session has RSVP; coaches see a headcount per session. (spec: "RSVP for
  each session so coaches know headcount")
- R11: An automatic reminder text (SMS) is sent the morning of each session — gated on
  documented SMS consent (OQ-003) and a defined audience (OQ-006). (spec: "with an automatic
  reminder text the morning of")
- R12: Parents can buy already-stocked gear (shirts/shorts) with card payment; the charge is
  captured at order time; fulfillment happens at practice. (spec: "a small store where parents
  can buy extra gear ... with card payment — charge on order, we fulfill at practice")
- R13: Athletes earn badges for attendance streaks, computed from the canonical attendance
  source (OQ-002). (spec: "athletes earn badges for attendance streaks")
- R14: Earned badges render on the athlete's public recruiting profile — only once the
  publication gate for minors' data is resolved (OQ-001); display is default-deny until then.
  (spec: "badges show on their public recruiting profile")
- R15: Coaches can export their cohort's attendance as CSV. (spec: "the coaches want CSV export
  of attendance")
- R16: Every hub capability is cohort-isolated: no member of one cohort can read or affect
  another cohort's posts, comments, files, RSVPs, orders, or exports. (spec: "All of it should
  respect who's in which cohort — nobody sees another cohort's stuff")
