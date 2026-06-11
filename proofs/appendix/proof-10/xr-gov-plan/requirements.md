# Requirements

## Requirements

Each requirement cites the spec language that forces it (paraphrased pointers; verbatim spec is
in `spec-intake.md`).

- R1: Generate **signal posts** from platform data — offer announcements ("picks up his 4th
  offer"), commitment graphics, weekly top-performer cards — for the brand's Instagram and X
  accounts. (Spec: "Two kinds of posts. First, signal posts straight from our data…"; "social
  content for our brand accounts (Instagram and X)".)
- R2: Generate **evergreen posts** from a founder-curated idea bank: recruiting advice,
  how-offers-work education, founder takes. (Spec: "Second, evergreen posts from our idea
  bank…".)
- R3: Evergreen copy must be conditioned on the founder's voice (founder-approved writing
  samples drive style). (Spec: "My voice matters — the evergreen stuff should sound like me.")
- R4: AI writes the copy; the system renders branded graphics using the brand's fonts/colors.
  (Spec: "AI writes the copy and we render branded graphics (we have fonts/colors).")
- R5: **Claim provenance**: every factual claim in a post must be traceable to the source
  records that justify it, inspectable per post ("if a post says a kid has 12 offers, I want to
  be able to see why it said that"). (Spec: "We need to know where any claim in a post came
  from…")
- R6: **Accuracy**: posts must reflect current platform data at the time they are approved —
  "accurate and timely"; no made-up stats. (Spec: "The public posts should use our data to be
  accurate and timely"; "no made-up stats".)
- R7: **No fake quotes**: text presented as a quotation must correspond to a stored verbatim
  quote with a source; otherwise it must not be rendered as a quote. (Spec: "no fake quotes".)
- R8: **Private-data boundary**: internal evaluations, coaches' private notes, and
  athlete/parent contact info must never appear in generated or published content. (Spec: "We
  have internal evaluations and private notes from coaches in the database too, and contact info
  for athletes and parents" + "It must never embarrass us… nothing that could hurt a kid".)
- R9: **Minor-safety gate**: every post passes an automated safety gate (private-data scan,
  claim verification, quote verification, minor-protection rules, platform-policy checklist)
  before it is eligible for approval. (Spec: "nothing that could hurt a kid or get us in trouble
  with the platforms".)
- R10: **Human approval before publish** at launch: no post reaches Instagram or X without a
  recorded human approval (approver + timestamp). Fully automated publishing is a separate,
  user-gated decision (OQ-1). (Spec: "Realistically I know we'll want to check things at the
  start"; "they go out automatically once we trust the quality" — the trust transition is the
  founder's call, not the compiler's.)
- R11: **Low-friction review**: the review experience must be batch-oriented (approve/reject
  many drafts quickly, light edits in place) so the founder is not "editing every caption
  forever". (Spec: "don't build me something where I'm editing every caption forever".)
- R12: **Scheduled draft generation**: the engine generates candidate posts on a configurable
  schedule without manual prompting. (Spec: "it generates posts on a schedule".)
- R13: **Publishing connector**: approved posts are published to Instagram and X via official
  APIs, with scheduling of approved posts, idempotent delivery (no duplicate posting), and the
  ability to delete/retract a published post. (Spec: "they go out"; "get us in trouble with the
  platforms" forces official APIs; retraction per assumption A8.)
- R14: **Audit record**: every published post stores an immutable snapshot — final copy,
  rendered graphic, claim bindings, approver, publish time, platform post id. (Spec: provenance
  requirement R5 extended through publish; "I want to be able to see why it said that" must
  survive after posting.)
- R15: **Photo attachment with recorded basis**: athlete photos are attached only when an asset
  exists and a usage-rights/consent basis is recorded for public marketing use (exact basis
  pending OQ-2). (Spec: "We use athlete photos when we have them" + minors' images.)
- R16: Runs inside the existing Next.js + Postgres app, using the Anthropic model integration
  already present in the codebase. (Spec: "Stack: same app as the platform…")
- R17: The published-post data model must be forward-compatible with engagement metrics and a
  learn-from-performance loop, which are deferred. (Spec: "when a post does well or flops I
  eventually want the system to learn what works. Stats on engagement can come later…")
