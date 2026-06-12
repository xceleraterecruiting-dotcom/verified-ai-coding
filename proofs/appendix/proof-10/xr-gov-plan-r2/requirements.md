# Requirements

## Requirements

- R1: Detect post-worthy signal events from platform data — new/Nth college offers, commitments,
  weekly top performers — and turn them into signal-post candidates. (Spec: "signal posts
  straight from our data: 'QB so-and-so picks up his 4th offer', commitment graphics, weekly
  top-performer cards".)
- R2: Generate evergreen posts from a founder-curated idea bank — recruiting advice, how-offers-
  work education, founder takes — in the founder's voice. (Spec: "evergreen posts from our idea
  bank ... the evergreen stuff should sound like me".)
- R3: AI (Anthropic models, already used in the codebase) writes post copy; the system renders
  branded graphics using the brand's fonts/colors, including athlete photos only where a rights
  basis exists (OQ-1). (Spec: "AI writes the copy and we render branded graphics"; "We use
  athlete photos when we have them".)
- R4: Generation runs on a schedule and produces drafts into a review queue. (Spec: "it generates
  posts on a schedule".)
- R5: Every draft passes an automated verification gate (claim-vs-source check, private-data
  scan, schema validation) before it is approvable. (Spec: "no made-up stats, no fake quotes,
  nothing that could hurt a kid".)
- R6: A human reviews and approves/rejects each verified draft; the approval decision is
  recorded. Approval UX must be fast (accept/reject with light edits), per the founder's "don't
  build me something where I'm editing every caption forever". (Spec: "we'll want to check things
  at the start".)
- R7: Approved posts publish to the brand Instagram and X accounts via a dry-run-first,
  idempotent publisher. (Spec: "social content for our brand accounts (Instagram and X)".)
- R8: Full claim provenance: any factual claim in any post is resolvable to the exact source
  records and values it came from, viewable after the fact. (Spec: "if a post says a kid has 12
  offers, I want to be able to see why it said that".)
- R9: Governance: no fabricated stats/quotes/facts, no private data (internal evaluations, coach
  notes, athlete/parent contact info) in public output, no content harmful to a minor, platform-
  rule-compatible posting. Enforced by gates, not instructions. (Spec: "It must never embarrass
  us".)
- R10: Implemented inside the existing Next.js + Postgres app as a namespaced module; no
  modifications to unrelated platform features. (Spec: "same app as the platform".)
- R11: An end-to-end audit trail exists from every published post back through approval,
  verification, generation (model id, prompt version, run id), and source facts.
  (Lens-derived from R8 + AI-output depth lens item 15.)
- R12: A generator-side golden and adversarial regression harness exercises the generation +
  verification path on fixed inputs in CI. (Lens-derived: AI-output depth lens items 7–8;
  this is how "once we trust the quality" becomes measurable instead of vibes.)
