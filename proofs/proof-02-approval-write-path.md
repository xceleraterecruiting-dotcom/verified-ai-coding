# Proof #2 — Auditable approval recording (Clean PASS)

A real, private product run of the Verified AI Coding workflow on an invariant-bearing slice whose output later governs a privileged action.

## Context

A private product needed an **auditable approval-recording path**: a human authority records a decision on a draft, and the most recent decision later governs whether that draft may be acted on downstream. Because the recorded decision is what unlocks the later privileged step, the integrity of *how* a decision is recorded matters as much as the decision itself.

## The invariant

Approval history must be:

- **Append-only** — each decision is a new entry; prior entries are never mutated or deleted (the audit trail).
- **Attributed to the authenticated actor** — never to an actor named in the request body.
- **Server-timestamped** — the governing timestamp must be server-controlled, never client-supplied (a forgeable timestamp could reorder which decision is "latest").
- **Safe against forged body fields** — a request that tries to set the actor or the timestamp must not have those values reach persisted data.

Positive approvals must be refused for non-eligible drafts; rejection stays allowed regardless; and required fields must be enforced in the service core so they bind a direct call, not only the UI/route.

## What `verified-implementation` derived

- Actor identity must come from the **authenticated session**, not the body.
- The timestamp must be **server-controlled** (database default), with no code path that accepts or sets it from input.
- Recording must be **append-only by construction**, not by a runtime check that could be bypassed.
- Positive approvals must reuse the existing canonical eligibility guard; rejection is never gated.
- Required-field rules belong in the **service core** so they hold for a direct call.

## What implementation built

- An **append-only approval-recording seam** whose transactional surface exposes only "read draft" and "append decision" — there is no update or delete path, so immutability is structural.
- A **thin owner-gated trigger** that binds the actor to the authenticated session and parses request *content* only — it never reads an actor or timestamp from the body.
- **Server-controlled timestamp** behavior: the recording payload carries no timestamp; the datastore default owns it.
- **Required-field enforcement in the service layer** (e.g. a rejection needs a reason; an approval-with-edits needs the edited text), with whitespace-only treated as missing.
- Reuse of the canonical eligibility guard for positive approvals.

## What `ship-review` checked (cold)

- Forged **actor** input in the body does **not** reach persisted data — proven by a redteam test that puts an attacker-supplied actor in the body and asserts it never lands on the row.
- Forged **timestamp** input in the body does **not** reach persisted data — proven by a redteam test that supplies a far-future client timestamp and asserts it never lands on the row.
- Prior approval entries are **not** mutated or deleted — immutability is enforced by the transaction's surface having no mutation path.
- Positive-approval gating **reuses the canonical guard**, with no inline re-implementation; rejection stays allowed.
- Required-field rules are enforced **below the route**, proven by direct-call tests.

## Result

**Clean PASS** — earned. Deterministic gates green.

## Follow-ups (not blockers)

- Add a future real-datastore test asserting the timestamp is server-set (current tests prove the value is never body-influenced or code-set; they do not assert the persisted value equals a server clock).
- Optional defense-in-depth: have the service core reject an empty actor, so the invariant holds even for a direct call that bypasses the route's authentication gate.
- Revisit "latest decision wins" tie semantics only if real duplicate conflicting decisions become observable.
