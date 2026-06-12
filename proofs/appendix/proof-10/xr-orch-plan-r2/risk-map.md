# Risk map

## Risk classification
Initial classification: L2
Final level: L2

## Justification

The feature produces AI-generated marketing content about real athletes — predominantly high
schoolers, i.e. likely minors — destined (after human approval) for public posting, and it
performs status transitions and data-integrity-critical writes into a production queue. That is
squarely L2 ("money, auth, permissions, user data, status transitions, private data,
AI-generated public output"):

> when new verified offers land in our database, the system should automatically produce a
> draft post for each one and put it in my review queue.

> a kid often has several offers, and offer news comes in bursts — the job will run every few
> minutes, so it has to cope with seeing the same offers again without flooding my queue with
> duplicates of drafts it already made.

> Every draft should trace back to the offer(s) it came from and the model call that wrote it

Two factors hold this at L2 rather than L3 (which requires "regulated, minors' data + public
output"):

> Drafts wait in the queue for me — nothing posts by itself.

Output in this feature's scope never reaches the public without explicit human approval in the
existing engine, and the inputs are restricted to public facts of already-verified offers. The
human gate plus draft-only scope is the L2/L3 boundary here.

**This Final level is provisional on OQ-2 (high, open):** if the founder's answer reveals no
minors'/likeness/rights control anywhere between this queue and public posting, the
generation-and-content area escalates to L3 and its slices inherit that level. Escalation is
free; no downgrade is being made (Initial = Final), so no downgrade justification is required.

Per-area levels:

- Dedupe/atomicity/run-lifecycle (Slices 1–2): L2 — queue integrity and status transitions.
- Generation, fact verification, traceability (Slices 3–4): L2, provisionally L3 per OQ-2 —
  model output about likely minors.
- Dashboard surfacing of run history (Slice 5): L2 only via INV-9 (sanitization of stored,
  rendered errors); the rendering itself is otherwise low-risk internal UI.

## Lens applicability

- **AI-output depth lens: triggers** (model-generated content about real people that will, post
  -approval, reach the public). Items mapped: model id/prompt version/run id/source facts →
  INV-8, INV-13; provenance & no-fabrication → INV-7; goldens/adversarial → Slice 4 (R14); safe
  failure → INV-6; no leakage to user-visible surfaces → INV-9; schema validation → INV-11;
  human approval before publish → satisfied by spec design (INV-1) at L2; dry-run-first →
  inapplicable here because no slice posts externally (publishing is a non-goal); minors/
  likeness/rights → OQ-2 (high, open); end-to-end audit trail → INV-8 + INV-10.
- **Identity & account-claim lens: does not trigger.** No principal↔resource binding is created:
  athletes are content *subjects*, not principals claiming anything; the queue belongs to the
  single founder-operator under the engine's existing auth (A5). If multi-operator queues ever
  arrive, that is a new plan.
- **Payment-depth lens: does not trigger.** No money movement, entitlement, or paid state
  appears anywhere in the spec.
