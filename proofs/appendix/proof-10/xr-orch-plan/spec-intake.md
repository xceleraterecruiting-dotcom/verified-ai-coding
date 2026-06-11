# Spec intake — verified-offer draft orchestration

## Original spec (verbatim)

> Provenance: founder-voice spec received as `examples/spec-compiler-fixtures/xr-orchestration-offers.md`. Everything below is the founder's verbatim text.

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

Add an orchestration layer to an existing marketing engine: a scheduled job (cadence: every few
minutes) that finds recently arrived offers carrying a "verified" status, extracts four public
facts per offer (athlete name, athlete's school, offering college, offer date), invokes the
engine's existing model pipeline to generate one draft social post per offer, and inserts that
draft into the founder's existing human review queue in a non-published, pending-review state.
The job must be idempotent across overlapping/repeated runs (no duplicate drafts for offers it
already drafted), must isolate per-record failures (one bad offer record — e.g. an unparseable
date — fails alone, is recorded in run history with a reason, and does not abort the batch),
must never leave partially written drafts in the queue when a run or record fails, must store
only presentable (sanitized) error text because run history is rendered in an internal
dashboard, and must record provenance on every draft: the source offer ID(s) and the model-call
ID, following the engine's existing traceability convention. Publishing remains exclusively a
human action; this feature creates drafts only.

## Interpretation notes

- IN-1 **No readable project context (Step 0 yielded nothing).** This plan is compiled under a
  contamination fence with no access to the existing engine codebase. Every referenced existing
  component — the model pipeline, the review queue, the traceability convention ("same as the
  rest of the engine"), the internal dashboard, the offers table and its "verified" flag — is
  treated as an interface to be confirmed at handoff, not a known implementation. File paths in
  `implementation-slices.md` are proposals to be remapped onto the real repo before any
  verified-implementation run starts. Rejected alternative: guessing concrete module names and
  presenting them as facts.
- IN-2 **"a draft post for each one" → one draft per offer.** The verbatim "each one" forces
  per-offer drafts; but the closing line "the offer(s) it came from" (plural) admits a reading
  where burst offers for the same athlete are batched into one draft. I adopt per-offer as the
  explicit reading and surface the grouped-burst reading as OQ-3 rather than silently choosing
  it; the trace schema still supports many offers per draft so a later grouping decision is
  additive. Rejected alternative: grouping offers per athlete per run.
- IN-3 **"seeing the same offers again without flooding my queue with duplicates" →
  persistent ledger-based idempotency, not a time-window trick.** A "skip offers newer than the
  last run" cursor would be the cheaper reading but breaks on overlapping runs, retries, clock
  skew, and feed re-delivery; the spec's emphasis ("offer news comes in bursts", "every few
  minutes") forces durable at-most-once draft creation per offer identity. What that identity
  *is* (feed-stable offer ID? composite key?) and whether dedupe survives a reviewer rejecting
  or deleting the draft is OQ-1 (high). Rejected alternative: last-run-timestamp cursor only.
- IN-4 **"a failed run shouldn't leave half-written junk in the queue" → per-record atomicity,
  not whole-run transaction.** A whole-run transaction would conflict with the same paragraph's
  demand that one bad record not kill the batch; so the unit of atomicity is one offer→draft
  creation (draft + trace links commit together or not at all), and the run continues past
  failures. Rejected alternative: all-or-nothing run-level transaction.
- IN-5 **"Keep whatever errors we store presentable" → a sanitization/leak invariant, not a
  formatting nicety.** Stored errors render in an internal dashboard; "presentable" is read as:
  no stack traces, no secrets/connection strings, no raw upstream payload dumps, no raw model
  output — a curated human-readable message plus a correlation ID for log lookup. Rejected
  alternative: treating "presentable" as cosmetic phrasing polish only.
- IN-6 **"weird or partial dates" → never fabricate.** The draft is destined (after human
  review) for public output about a young athlete; a guessed or silently coerced offer date is
  a publishable falsehood. Default policy: a date the parser cannot represent truthfully fails
  that record (visible in run history); exact handling of *partial-but-truthful* dates
  (month/year only) is OQ-4. Rejected alternative: best-effort date coercion (e.g. defaulting
  missing day to the 1st).
- IN-7 **Identity & account-claim lens applied: no in-scope principal↔resource binding.** The
  feature binds drafts to offers and to a single-operator review queue; no user claims an
  account/record via an identifier here. The athlete↔offer binding and the "verified" status
  are produced upstream and consumed as given (A1); the dashboard/queue are assumed to sit
  behind the engine's existing internal auth (A6). Recorded here so silence is not mistaken
  for omission.
- IN-8 **"recent verified offers" → eligibility = verified status + arrival recency, with
  correctness carried by the dedupe ledger.** The lookback window is an efficiency knob, not a
  correctness mechanism (IN-3); its value and whether "lands in our database" means created-at
  or verified-at is OQ-5. Rejected alternative: treating the window itself as the duplicate
  guard.

## Assumptions

- A1: "Verified" is an existing status set upstream; this job trusts the flag and never
  verifies offers itself.
- A2: One draft per offer (per IN-2), pending OQ-3; the draft↔offer trace is modeled
  many-to-many so a grouping decision later does not require a schema migration.
- A3: An offer date that cannot be truthfully represented fails that record (recorded in run
  history) rather than being guessed (per IN-6), pending OQ-4 for partial-precision dates.
- A4: An existing review queue with a pending-review (unpublished) draft state exists; this
  feature inserts into it and does not modify queue/approval/publishing behavior.
- A5: The existing model pipeline exposes a callable interface that returns generated draft
  content plus a model-call identifier usable for traceability ("same as the rest of the
  engine"). To be confirmed at handoff (IN-1).
- A6: The internal dashboard exists and already sits behind internal auth; surfacing run
  history there adds a read-only view and no new auth surface.
- A7: All file paths in the slice plan are placeholders to be confirmed against the real
  engine repo before any slice is implemented (IN-1).
- A8: Restricting generation inputs to the four named public facts, plus the human review gate
  before anything posts, is the compliance posture for content about (often minor) athletes;
  whether an opt-out/suppression list must also gate draft creation is OQ-8.

## Open questions

See `open-questions.md` (OQ-1 through OQ-8). Two high-severity questions — OQ-1 (offer
identity / dedupe lifecycle) and OQ-2 (re-delivery with changed facts) — are open and block
implementation per plan-lint.
