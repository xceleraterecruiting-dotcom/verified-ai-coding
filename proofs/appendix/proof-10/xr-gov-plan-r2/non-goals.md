# Non-goals

## Non-goals

- NG-1: Approval-free automatic publishing. The spec asks for it as "the dream"; this plan does
  not grant it. Every publish in this build requires a recorded human approval (INV-4). Whether
  an auto-publish mode ever exists, who can authorize it, and against what measured quality bar
  is OQ-2 (high, blocking) — a founder decision, not a compiler default.
- NG-2: Engagement analytics and the learn-what-works loop. Explicitly deferrable per the spec
  ("Stats on engagement can come later if it's faster to ship without"); excluded from all
  slices. A later phase may add metrics ingestion and feedback — nothing in this plan depends on
  it. (OQ-8, resolved by the spec itself.)
- NG-3: Platforms other than Instagram and X (no TikTok, Facebook, YouTube, etc.).
- NG-4: Direct messages, comment management, replies, or any outreach to athletes, parents, or
  coaches. This engine writes brand-account posts only; contact info in the database is never an
  input (A4/INV-1).
- NG-5: Paid promotion, ad placement, or boosting.
- NG-6: Changes to existing platform features, schemas of existing tables (beyond additive
  foreign keys from new tables), or any non-marketing-engine code paths.
- NG-7: Model fine-tuning or training on platform data; voice is achieved via prompting and
  curated examples (mechanics pending OQ-5).
- NG-8: Automated takedown/correction of already-published posts when underlying data changes.
  The default in this build is manual platform action plus an audit note (lens-derived); whether
  an automated correction workflow is required is OQ-6.
