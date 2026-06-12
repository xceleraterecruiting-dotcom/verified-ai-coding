# Spec intake — XR recruiting marketing engine

## Project context (Step 0)

Greenfield: no existing codebase was provided or read. No CLAUDE.md, PROJECT-CONTEXT.md, or
existing specs exist for this plan (contamination fence: only the spec fixture, the spec-compiler
skill, and plan-lint.mjs were read). The spec states the engine lives in "the same app as the
platform (Next.js + Postgres)"; this plan therefore defines its own module conventions
(`src/marketing-engine/`, `db/migrations/`, `tests/marketing-engine/`) and the first
verified-implementation run must reconcile them against the real repo's layout before coding.

## Original spec (verbatim)

We run a sports recruiting platform. Our database is gold: verified college offers, commitments,
athlete rankings, camp standouts, coach activity — plus years of recruiting knowledge in my head.
I want a marketing engine that turns that into social content for our brand accounts (Instagram
and X) so we stop paying an agency.

Two kinds of posts. First, signal posts straight from our data: "QB so-and-so picks up his 4th
offer", commitment graphics, weekly top-performer cards. Second, evergreen posts from our idea
bank: recruiting advice, how-offers-work education, my takes on the recruiting process.

The posts are about real kids — high schoolers, sometimes middle schoolers. We have internal
evaluations and private notes from coaches in the database too, and contact info for athletes and
parents. The public posts should use our data to be accurate and timely. AI writes the copy and
we render branded graphics (we have fonts/colors). My voice matters — the evergreen stuff should
sound like me.

Ideally this is hands-off: it generates posts on a schedule and they go out automatically once we
trust the quality — that's the dream, the whole point is saving time. Realistically I know we'll
want to check things at the start. Whatever you think is right, but don't build me something
where I'm editing every caption forever.

We need to know where any claim in a post came from — if a post says a kid has 12 offers, I want
to be able to see why it said that. And when a post does well or flops I eventually want the
system to learn what works. Stats on engagement can come later if it's faster to ship without.

It must never embarrass us: no made-up stats, no fake quotes, nothing that could hurt a kid or
get us in trouble with the platforms. We use athlete photos when we have them.

Stack: same app as the platform (Next.js + Postgres), we already call Anthropic models elsewhere
in the codebase.

## Compiler paraphrase

Build a marketing content engine inside the existing recruiting platform that (1) detects
post-worthy signals in the platform database (new offers, commitments, weekly top performers) and
generates data-grounded "signal posts", (2) generates "evergreen" advice/education posts from a
founder-curated idea bank in the founder's voice, (3) renders branded graphics (brand fonts and
colors, athlete photos where rights permit), (4) routes every draft through automated
fabrication/private-data verification and a recorded human approval decision, and (5) publishes
approved posts to the brand Instagram and X accounts via a dry-run-first publisher. Every factual
claim in a post must be traceable to the exact database records it came from. Generation runs on
a schedule but produces drafts into a review queue — nothing reaches a platform without
verification and approval. Engagement analytics and the learn-what-works loop are deferred.
Approval-free automatic posting is NOT granted by this plan: it is a high-severity open question
for the founder (OQ-2), because the posts concern minors and the spec's own "never embarrass us"
law conflicts with unreviewed publishing.

## Interpretation notes

- IN-1: "they go out automatically once we trust the quality" is read as a *future aspiration the
  founder flagged as negotiable* ("Whatever you think is right"), not a requirement of this
  build. Rejected alternative: building an auto-publish mode behind a flag now — rejected because
  unreviewed AI output about minors is an L3 publishing decision the founder must make explicitly
  (OQ-2), and a dormant bypass path would still have to be proven never-reachable.
- IN-2: "don't build me something where I'm editing every caption forever" is read as a quality
  bar on generation (approval should usually be a one-click accept, achieved via verification
  gates and golden-case regression), not as license to remove approval. Rejected alternative:
  treating it as a mandate for auto-publish after a trust period.
- IN-3: "We use athlete photos when we have them" is read as *conditional on a recorded rights
  basis*, which the spec does not establish — surfaced as OQ-1. Rejected alternative: assuming
  possession of a photo implies the right to use a minor's likeness in brand marketing.
- IN-4: "no fake quotes" is read as: quotes may appear only when they exist verbatim in a source
  record; the generator never composes quotes. Rejected alternative: allowing paraphrased
  "quote-like" copy, which is exactly the embarrassment class the founder named.
- IN-5: "coach activity" as a post source is read as ambiguous — internal coach behavior data may
  be sensitive even when offers are public. Surfaced as OQ-7 rather than silently included in or
  excluded from the publishable allowlist.
- IN-6: "Stats on engagement can come later" is read as explicit permission to defer analytics
  and the learning loop; recorded as a non-goal. Rejected alternative: shipping a metrics stub
  now (scope the founder said was droppable).
- IN-7: "same app as the platform" is read as same repo/deployment with a namespaced module and
  its own tables, not as freedom to modify existing platform features. Slice forbidden-files
  enforce this.
- IN-8: "middle schoolers" is read as raising an age/eligibility policy question the spec does
  not answer (publicly featuring children possibly under 13) — surfaced as blocking OQ-3, not
  defaulted either way.

## Assumptions

- A1: Every external publish requires a recorded human approval decision in this build
  (lens-derived: AI-output depth lens item 12 at L2+; also endorsed by the spec's "we'll want to
  check things at the start"). Removing approval is OQ-2, owned by the founder.
- A2 (lens-derived): The publisher is dry-run-first — a render-and-log stage precedes any live
  posting, and live mode is explicitly enabled per brand account (AI-output lens item 13).
- A3 (lens-derived): Generation captures model id, prompt version, and run/trace id, plus the
  exact source facts supplied — required for the founder's "I want to see why it said that".
- A4: Signal posts may use only an explicit allowlist of public-safe fields (offers, commitments,
  rankings, camp results, names/positions/schools); internal evaluations, private coach notes,
  and athlete/parent contact info are never inputs to generation. The spec marks these private by
  contrast ("We have internal evaluations and private notes ... too").
- A5: The idea bank is founder-curated content (topics/takes he supplies), not model-invented
  topics; voice calibration mechanics are OQ-5.
- A6: Platforms are exactly Instagram and X; no others in scope.
- A7: Payment-depth lens evaluated: no money movement or paid entitlement anywhere in the spec —
  lens not triggered. Identity/account-claim lens evaluated: no user↔record claiming flow exists;
  the only principal↔resource bindings are (a) brand-account platform credentials (covered by
  INV-15) and (b) approver identity on approval records (covered by INV-4/INV-14). No claiming
  surface, so no further identity invariants are derived.

## Open questions

See `open-questions.md`. Three high-severity questions (OQ-1 photo/likeness rights for minors,
OQ-2 authority and criteria for ever enabling approval-free posting, OQ-3 age/grade floor for
featuring athletes) are open and BLOCK implementation until the founder answers.
