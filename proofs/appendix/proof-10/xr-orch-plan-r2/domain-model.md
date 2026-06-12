# Domain model

## Entities

**Existing engine entities (interfaces to confirm — not readable during compilation):**

- **VerifiedOffer** (read-only to this feature) — an offer record in the database. Required
  interface: stable durable id (A1/OQ-1), status (must distinguish verified from everything
  else), athlete name, athlete school, offering college, offer date (possibly messy/partial),
  verified-at timestamp (or equivalent recency signal for the pickup window).
- **ModelCallRecord** (existing pipeline's trace record) — required interface per IN-6: a
  durable id resolvable to model id, prompt version, and the inputs given to the generation
  (source facts). If the engine's record lacks prompt version or inputs, Slice 3 must extend
  the *linkage* (not the pipeline internals) so INV-8 holds. Confirm: OQ-6.
- **ReviewQueueEntry / Draft** (existing queue) — required interface: accepts a draft in a
  non-published pending-review state; supports attached traceability references. Confirm: OQ-9.
- **InternalDashboard run-history surface** — required interface: renders run records and
  per-item failure messages. Confirm: OQ-9.

**New entities this feature owns:**

- **OrchestrationRun** — one execution of the scheduled job: id, started-at, finished-at (or
  last-heartbeat for crash detection), status, counts (picked-up, drafted, deduped, failed).
- **RunItem** — one offer processed within a run: run ref, offer ref, outcome
  (drafted | deduped | failed), sanitized failure cause code + presentable message, draft ref
  when drafted.
- **DraftProvenance** (may be fields on the draft or a join structure) — draft ref ↔ source
  offer id(s) (many-to-many per A2), model-call ref, run ref. Carries the dedupe key.
- **DedupeClaim** — the storage-level uniqueness object (e.g. a unique constraint over the
  dedupe key on draft provenance, or a dedicated claims table). Exact key definition is OQ-1
  (high, open): candidate is the durable offer id, contingent on one-row-per-real-world-offer.

## States and transitions

**VerifiedOffer (owned by the engine; this feature only reads):**
unverified → verified (entry point for pickup). verified → retracted/unverified is unspecified
in the spec — OQ-3 (high) — so no transition handling is planned yet.

**OrchestrationRun:** running → completed | completed-with-failures | crashed.
"crashed" must be inferable (stale heartbeat / no finished-at), never recorded as success and
never invisible (INV-10).

**RunItem:** picked → drafted | deduped | failed. `failed` does not consume the dedupe key
(A4/INV-14); `drafted` does, atomically with draft creation (INV-2, INV-5).

**Draft:** (created by this feature) → pending-review. All later transitions
(approved/rejected/published) belong to the existing engine and are out of scope; this
feature's code paths must be unable to move a draft past pending-review (INV-1).

```
offer(verified) → picked → [claim dedupe key]
   ├─ key taken → deduped (no draft)
   ├─ facts bad → failed (sanitized reason; key not consumed)
   └─ generate → verify vs source facts → enqueue draft(pending-review) + provenance [atomic]
```
