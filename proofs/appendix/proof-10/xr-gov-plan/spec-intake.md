# Spec intake — recruiting media engine (marketing content governance)

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

Build an AI marketing content engine inside the existing Next.js + Postgres recruiting platform
that produces social posts for the company's own Instagram and X brand accounts. Two content
pipelines: (1) **signal posts** generated from verified platform data (offers, commitments,
rankings, camp standouts) with branded graphics, and (2) **evergreen posts** generated from a
founder-curated idea bank, written in the founder's voice. Every factual claim in a post must be
traceable to the source records that justify it. Content is about minors (high-school and
sometimes middle-school athletes); the same database also holds private material (internal
evaluations, coaches' private notes, athlete/parent contact info) that must never leak into
public output. The founder wants the system to become largely hands-off over time — scheduled
generation and eventually automatic posting — but acknowledges a review phase at the start.
Engagement analytics and a learn-from-performance loop are explicitly deferrable. Hard product
laws from the spec: no fabricated stats, no fake quotes, nothing harmful to a kid, nothing that
violates platform rules. Athlete photos are used when available.

## Interpretation notes

- **Step 0 yielded no project context.** This is a greenfield engagement for planning purposes:
  no CLAUDE.md, PROJECT-CONTEXT.md, existing specs, or codebase were available or read. All file
  paths in the slice plan are therefore a *proposed* module layout, to be re-anchored to the real
  repo before the first verified-implementation run.
- **"go out automatically once we trust the quality"** — I do NOT read this as authorization to
  build unreviewed automated publishing now. The spec itself hedges ("Realistically I know we'll
  want to check things at the start", "Whatever you think is right"). Rejected reading: ship
  auto-posting behind a "trust" toggle. Because AI-generated public content about minors is
  involved, removing the human gate is a publishing/privacy behavior change → high-severity open
  question (OQ-1), not a compiler decision. The plan builds a human-approval gate as the launch
  state and designs the gate so review cost falls over time (batch approval, confidence surfacing)
  to honor "don't make me edit every caption forever".
- **"generates posts on a schedule"** — interpreted as scheduled *draft generation* (safe,
  in-scope) as distinct from scheduled *publishing without review* (the OQ-1 question). The
  verbatim text conflates the two; I split them. Rejected reading: schedule implies end-to-end
  automation.
- **"We use athlete photos when we have them"** — interpreted as: attach a photo only when an
  asset exists AND there is a recorded basis to use it publicly. The verbatim text does not say
  whether photo usage rights/consent are tracked; for minors' images this is a privacy/publishing
  question (OQ-2). Rejected reading: any photo on file is fair game.
- **"sometimes middle schoolers"** — the spec asserts posts may feature middle-school athletes
  but also says "nothing that could hurt a kid". Whether middle schoolers should appear in public
  marketing at all (or under stricter rules) changes a publishing invariant → OQ-3. The plan's
  default is safe: the gate blocks posts about athletes under a configurable grade floor until
  resolved. Rejected reading: treat all minors identically.
- **"My voice matters — the evergreen stuff should sound like me"** — interpreted as
  prompt-side voice conditioning from founder-approved writing samples, not model fine-tuning
  (no training-data pipeline was requested). Rejected reading: build a fine-tuned model.
- **"no fake quotes"** — interpreted as a hard generation+gate rule: text presented as a
  quotation must match a stored verbatim quote record with a source; otherwise no quotation marks
  attributing speech to a person. Rejected reading: merely instruct the model not to invent
  quotes (instruction-only safety is not verifiable).
- **"we stop paying an agency"** — read as motivation/cost context, not a requirement to
  replicate every agency service (no paid-ads, community management, or DM handling).
- **"Stats on engagement can come later if it's faster to ship without"** — taken at its word:
  engagement capture and the learning loop are named non-goals of this plan (deferred phase),
  but the published-post record is designed so metrics can be attached later without migration
  pain.
- **"get us in trouble with the platforms"** — interpreted as: publishing path must use official
  APIs and respect each platform's automation/content policies; the gate includes a
  platform-policy checklist. Rejected reading: scraping/unofficial automation is acceptable.

## Assumptions

- A1: The existing platform database already contains the source-of-truth tables for offers,
  commitments, rankings, camp standouts, and coach activity; the engine reads them, never writes
  them.
- A2: "Brand accounts" means company-owned accounts only; the engine never posts to or as an
  athlete's account.
- A3: Reviewer/approver roles will be a small internal set (founder + staff); a full RBAC system
  is not required, but every approval must be attributable to a person.
- A4: Anthropic model access (already used elsewhere per the spec) is acceptable for copy
  generation; no new model vendor decision is needed.
- A5: Branded graphics are server-rendered from templates using the stated fonts/colors; no
  human designer is in the loop per post.
- A6: The idea bank starts as founder-entered content (topics, takes, writing samples); building
  the entry UI for it is in scope, populating it is the founder's job.
- A7: English-only copy; US-centric recruiting context.
- A8: A published post that is later found wrong must be deletable/retractable from the platform
  via the same connector (corrective capability is implied by "it must never embarrass us").

## Open questions

See `open-questions.md`. OQ-1 (automated publishing), OQ-2 (photo rights for minors), and OQ-3
(middle-schooler exposure) are high severity and block implementation until the user resolves
them.
