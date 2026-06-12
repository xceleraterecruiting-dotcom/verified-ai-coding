# Spec intake — offer-draft orchestration

## Step 0 record — project context

No project context was readable for this compilation (contamination fence: the existing
marketing-engine codebase, CLAUDE.md, prior specs, and proofs are all out of bounds). Every
component the spec references — "our existing model pipeline", "my review queue", "the run
history … in our internal dashboard", the verified-offers store — is therefore treated as an
**interface to be confirmed**, not a known implementation. Each such interface has an explicit
contract stated in this plan (what the engine's convention MUST contain for this feature to be
sound) plus an open question to confirm it at slice Step 0 time. Nothing in this plan trusts
"the engine already does X" without naming X.

## Original spec (verbatim)

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

## Compiler paraphrase

Add an orchestration step to an existing marketing engine: a scheduled job (running every few
minutes) selects recently verified offers from the database, extracts each offer's public facts
(athlete name, athlete's school, offering college, offer date), invokes the engine's existing
model pipeline to generate a draft social post per offer, and inserts the draft into the
founder's human review queue in a non-published state. The job must be idempotent across
overlapping/repeated runs (no duplicate drafts for an offer already drafted), resilient to bad
records (per-item failure isolation, no partial drafts left behind), and observable (a run
history with sanitized, dashboard-presentable per-item failure reasons). Every draft must be
traceable to its source offer(s) and the model call that produced it. Publishing is explicitly
out of scope — nothing posts without the founder.

## Interpretation notes

- IN-1 — "produce a draft post for each one": read as **one draft per verified offer**. Rejected
  alternative: aggregating an athlete's burst of offers into one combined draft. The closing
  line's "the offer(s) it came from" (plural) weakly supports aggregation, but the explicit "for
  each one" wins; the traceability schema still allows multiple offer refs so a future
  aggregation mode is not foreclosed. Recorded as A2 and OQ-4 (medium).
- IN-2 — "recent verified offers": read as offers whose status is *verified* and which entered
  that state within a bounded lookback window, with the dedupe mechanism (not the window) as the
  correctness guarantee against re-drafting. Rejected alternative: a strict
  "since-last-run-cursor" design, which loses offers if a run crashes after cursor advance.
  Window size is OQ-5 (medium).
- IN-3 — "it has to cope with seeing the same offers again": read as requiring a durable,
  storage-enforced dedupe key, safe under *concurrent* runs (a "every few minutes" cadence plus
  slow runs means overlap is possible). Rejected alternative: in-memory or check-then-insert
  dedupe, which the burst + cadence wording makes unsafe.
- IN-4 — "a failed run shouldn't leave half-written junk in the queue": read as atomicity at the
  *item* level — a draft and its traceability links become visible together or not at all — and
  as run-level cleanup of any intermediate state. Rejected alternative: whole-batch
  all-or-nothing transactions, which would contradict "I don't want the whole batch dying" on
  one bad record.
- IN-5 — "Keep whatever errors we store presentable": read as a sanitization requirement (no
  stack traces, secrets, prompt text, or raw model output in stored run history), not merely a
  formatting preference, because the run history is rendered on an internal dashboard. Rejected
  alternative: cosmetic-only reading.
- IN-6 — "same as the rest of the engine" (traceability): the spec defers to an existing
  convention this compiler cannot read. Rather than trusting it, this plan states what the
  convention MUST contain for the drafts to be adequately traceable: source offer id(s), model
  id, **prompt version**, and an orchestration run/trace id, each resolvable from the stored
  draft. A model-call id alone is NOT sufficient unless the model-call record is itself specified
  to contain model id and prompt version. Confirming whether the engine's convention meets this
  bar is OQ-6 (medium); the requirement itself stands regardless (INV-8).
- IN-7 — "public facts": read as the four named fields (athlete name, school, offering college,
  offer date) being the *only* generation inputs from the domain — the generator must not enrich
  from other sources. Rejected alternative: treating the list as illustrative and allowing
  enrichment, which would undermine the no-fabrication boundary for content about (likely minor)
  athletes.
- IN-8 — "drafts wait in the queue for me — nothing posts by itself": read as a must-never
  invariant on this feature's code paths (no write to any publish/send surface), not just a
  default-off flag.

## Assumptions

- A1: The verified-offers store exposes a stable, durable per-offer identifier usable in a
  dedupe key. (If feeds can materialize the same real-world offer as multiple rows, offer-id
  dedupe is insufficient — that is OQ-1, high, and blocks.)
- A2: One draft per verified offer (see IN-1); the draft↔offer link is modeled many-to-many so
  this can change without schema rework.
- A3 (lens-derived, AI-output #9 fail-safe): when required source facts are missing or
  unparseable (e.g. the spec's "weird or partial dates"), the item is recorded as failed/skipped
  with a sanitized reason — no draft is generated with guessed, defaulted, or omitted-and-padded
  facts. Whether a deliberately date-less draft variant is acceptable is OQ-7 (medium).
- A4: A failed item does not permanently consume its dedupe key; only successful draft creation
  consumes it, so transiently-bad items are retried on later runs. Retry capping is OQ-8
  (medium).
- A5: The review queue is operated by the founder alone (single trusted internal principal) and
  its authentication/authorization is owned by the existing engine; this feature adds no new
  principal↔resource binding. (Identity lens consequently does not trigger — see risk-map.)
- A6: The internal dashboard already renders run history of some form ("the run history shows up
  in our internal dashboard"); this feature must conform to or extend that surface, not build a
  new dashboard. Contract to confirm: OQ-9 (low).
- A7: File paths in the slice plans use a placeholder engine layout (`src/marketing-engine/…`);
  each slice's verified-implementation run must confirm real paths at its own Step 0 before the
  allowed/forbidden lists are used as gates. Recorded as OQ-10 (medium).
- A8: "New verified offers" means offers reaching verified status going forward plus the bounded
  lookback window; bulk backfill of the historical offer corpus is a non-goal.

## Open questions

See `open-questions.md`. Three high-severity questions are open and block implementation:
offer identity/dedupe-key semantics (OQ-1), minors'/likeness rights for drafts naming athletes
(OQ-2), and offer retraction after draft creation (OQ-3).
