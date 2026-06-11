# Non-goals

## Non-goals

- NG1: **Engagement analytics and the learning loop.** Capturing likes/impressions and tuning
  generation from post performance is deferred by the spec itself ("Stats on engagement can come
  later if it's faster to ship without"). The published-post schema reserves room for it (R17),
  but no slice builds it.
- NG2: **Fully automated (unreviewed) publishing.** Deliberately excluded from this plan, not
  merely deferred: enabling it is a user decision recorded in OQ-1. The plan ships
  approval-gated publishing only, with review friction explicitly minimized (R11). Any future
  "graduated autonomy" phase is a new spec-compilation or at minimum a re-risked slice.
- NG3: **Posting to platforms other than Instagram and X** (TikTok, Facebook, YouTube, etc.).
- NG4: **Paid advertising, boosting, DM/community management, or comment moderation** — the
  agency is being replaced only for organic brand-account content creation/posting.
- NG5: **Athlete-facing or parent-facing features.** No notifications to athletes, no opt-in
  portal, no athlete accounts. (If OQ-2/OQ-3 resolution demands a consent-capture flow, that is
  new scope to be re-planned.)
- NG6: **Model fine-tuning / training pipelines.** Founder voice is achieved with curated
  writing samples and prompt conditioning, not a custom model.
- NG7: **Editing or enriching the platform's source data.** The engine is read-only against
  offers/commitments/rankings; data-quality fixes happen in the platform, not the engine.
- NG8: **A general-purpose CMS or multi-tenant marketing product.** Single brand, internal
  users only.
- NG9: **Video content generation.** Static branded graphics + copy only.
- NG10: **Replacing recruiting editorial judgment.** The system drafts; it does not decide what
  is newsworthy beyond configured signal triggers.
