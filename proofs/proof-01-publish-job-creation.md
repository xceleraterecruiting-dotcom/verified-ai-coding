# Proof #1 — Safe publish-job creation (Clean PASS)

A real, private product run of the Verified AI Coding workflow on an invariant-bearing slice.

## Context

A private product needed a safe way to create a **dry-run publish job** — the step that places an eligible draft into a publish queue. Creating that job is a privileged action: it is the gate between "a human looked at this" and "this is queued to go out."

## The invariant

A publish job must **not** be created unless the draft is eligible (not blocked) **and** it carries a valid human approval whose latest decision approves it. Critically, that authorization has to be enforced **below the UI** — a disabled button is not a safety boundary. It must hold no matter how the creation path is reached (a direct call, a replay, a race), not just through the happy-path screen.

## What `verified-implementation` derived

- The canonical safety predicate that decides eligibility already existed and was already correct and tested.
- The real risk was therefore **not** the logic — it was **wiring drift**: there was no production creation seam, so the danger was that a new path would re-implement a weaker check or trust caller-supplied state instead of reusing the canonical guard against persisted data.
- The contract fixed the enforcement layer at the service seam, required reuse of the existing guard, required the decision to be made on freshly-read persisted state inside a transaction, and scoped allowed/forbidden files so nothing canonical was modified.

## What implementation built

- A **service-layer creation seam** that re-reads the draft's eligibility and its latest approval from persisted state inside a serializable transaction and delegates the decision to the existing canonical guard, unchanged.
- A **thin owner-gated trigger** that only authenticates and forwards an identifier — no invariant logic.
- **Dry-run, queued** job creation only; live publishing stays a separate concern.
- **Active-job idempotency**: at most one non-terminal job per draft, enforced inside the transaction.
- Caller-supplied "claimed" state is advisory/observability only and never reaches the decision.

## What `ship-review` checked (cold)

- The canonical guard is reused, with no inline re-implementation of the eligibility logic.
- Authorization is decided on **persisted state read inside the transaction**, not on caller input.
- A redteam case where the caller forges "eligible/approved" state while persisted state says otherwise is **rejected** — the test contradicts the caller, so it fails if enforcement ever reads input.
- The route stayed a thin boundary; no enforcement leaked into it.
- Scope stayed bounded; no canonical or shared files were modified.

## Result

**Clean PASS** — earned. Deterministic gates green.

## Follow-ups (not blockers)

- Add deeper concurrency coverage (an integration-level test of the conflicting-create path) later; the unit layer proves the app-level guard, and isolation provides the backstop.
- Keep dry-run creation and live publishing clearly separated as the system grows.
