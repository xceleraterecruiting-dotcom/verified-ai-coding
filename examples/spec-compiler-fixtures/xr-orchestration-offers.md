# Fixture spec — offer-draft orchestration (expected: Level 2, idempotency/data-integrity)

> Provenance: founder-voice paraphrase of the XR slice 1.10b request (end-to-end verified-offer
> draft orchestration), written WITHOUT the issues that run's review surfaced — the dedupe-key,
> date-handling, and error-leak findings are the pre-registered ground truth (proof-10). Builder
> is contaminated; compilation and scoring run in fresh contexts.

Next piece of the marketing engine: when new verified offers land in our database, the system
should automatically produce a draft post for each one and put it in my review queue.

The flow I want: a scheduled job picks up recent verified offers, pulls the public facts (athlete
name, school, the offering college, offer date), and generates the draft through our existing
model pipeline. Drafts wait in the queue for me — nothing posts by itself.

Details that matter to me: a kid often has several offers, and offer news comes in bursts — the
job will run every few minutes, so it has to cope with seeing the same offers again without
flooding my queue with duplicates of drafts it already made. Offer data is sometimes messy
(feeds give us weird or partial dates). If a run hits a bad record I don't want the whole batch
dying silently — I want to see what failed and why in the run history, and a failed run shouldn't
leave half-written junk in the queue. Keep whatever errors we store presentable; the run history
shows up in our internal dashboard.

Every draft should trace back to the offer(s) it came from and the model call that wrote it, same
as the rest of the engine.
