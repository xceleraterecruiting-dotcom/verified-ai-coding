# Risk map

## Risk classification
Initial classification: L2
Final level: L2

## Justification

This is L2 work: AI-generated content destined (after human review) for public output, a
status-bearing queue, durable data-integrity guarantees, and error storage rendered to an
internal surface. The spec lines that drove the level:

> when new verified offers land in our database, the system should automatically produce a
> draft post for each one and put it in my review queue.

AI-generated output about real, named (often minor) athletes, on a path that ends in public
posting — L2 per the "AI-generated public output" criterion, held below L3 only by the human
gate the spec itself mandates:

> Drafts wait in the queue for me — nothing posts by itself.

Idempotency / data integrity under concurrency and re-delivery is a business invariant, not a
convenience:

> it has to cope with seeing the same offers again without flooding my queue with duplicates
> of drafts it already made.

Atomicity of queue writes:

> a failed run shouldn't leave half-written junk in the queue.

Stored-error content rendered on an internal dashboard (leak surface):

> Keep whatever errors we store presentable; the run history shows up in our internal
> dashboard.

**Why not L3:** the L3 trigger "minors' data + public output" was considered seriously — the
subjects are high-school athletes, frequently minors. It does not bind here because (a) this
feature produces *drafts only* into a human review queue and has no publish capability
(INV-1); (b) generation inputs are restricted to four already-public facts (INV-9); (c) the
spec explicitly retains the human gate ("nothing posts by itself"). If OQ-8 reveals an
opt-out/consent obligation that must gate *draft creation itself*, or if any later spec gives
this job publish capability, this classification escalates to L3 and the plan must be
re-compiled.

**Per-area levels:** dedupe ledger + atomic draft creation L2; publish-prevention boundary L2;
error sanitization/storage L2; date parsing policy L2 (feeds public content truthfulness);
per-record failure isolation and run bookkeeping L1; dashboard read-only run-history view L1.
Final level is the maximum: L2.
