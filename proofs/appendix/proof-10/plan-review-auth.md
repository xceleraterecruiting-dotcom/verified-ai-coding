# Auth-tenancy plan — cold plan-review (verbatim)

> Reviewer: fresh-context Claude subagent `a976e89e2f4b2cbb4`, 2026-06-11, rubric v2 (identity
> and payment/status lenses applied; AI-output and enterprise-agent judged not applicable).
> Inputs: rubric + fixture spec + the nine plan documents (listed at end). Verbatim final output
> follows.

---

All required files read. Review follows.

---

## v1 Questions 1–7

**Q1. Intent preservation — YES.**
The verbatim spec in `spec-intake.md` matches the fixture exactly. Every paraphrase move is either faithful or carries an interpretation note: read-only access ("The spec only ever says 'see'; I rejected the reading that coaches can edit"), strict revocation ("the next request after revocation is denied; no token/cache TTL grace window" with the rejected lenient reading stated), and multi-school ("explicit delegation; modeled as one coach account with N school memberships"). `requirements.md` carries paragraph-level traceability ("¶1 'athletes from their school only — rosters'"). No requirement weakened; the one place the paraphrase is *narrower* than it could be (evaluation scope) is deliberately not resolved — "it is **OQ-1 (high), not an assumption**."

**Q2. No invented requirements — YES.**
The two additions beyond the spec are constraints with cited risk rationale, which the rubric permits: impersonation audit logging ("The audit log is a compiler-surfaced constraint, not a spec feature — justified in `risk-map.md`"; risk-map: "un-audited impersonation over minors' data is an indefensible support tool") and invite-token hygiene (A3: "single-use, unguessable (≥128 bits entropy), and expire... table stakes for minors' data"). Password reset, exports, SSO etc. are explicitly pushed to `non-goals.md` rather than smuggled in.

**Q3. High-risk ambiguity surfaced — YES.**
The two BLOCKED high-severity OQs are the right ones. OQ-1 (evaluation scope "their own players" vs whole school) is exactly the spec's sharpest ambiguity over the most sensitive class — "changes INV-1's scope for the most sensitive data class (minors' evaluations)" — and gates Slice 4 ("Slice 4's evaluation read path must not start while OQ-1 is open"). OQ-2 (unknown auth stack) correctly blocks Slices 2+ because it "changes... possibly the session-invalidation mechanism behind INV-7 (e.g. stateless JWTs would forbid naive claims-based authorization)." Lower-grade ambiguities (email reassignment OQ-4, zero-membership login OQ-5, regulatory escalation OQ-7) are surfaced rather than guessed, and where an assumption is taken (A2 revocation), it takes the *stricter* reading with the rejected alternative recorded.

**Q4. Invariants specific and testable — YES.**
All ten are checkable predicates. E.g. INV-1: "must belong to a school where that coach holds a membership that is active at request time; a coach request for any other school's data must return an authorization denial, not an empty success"; INV-7: "the coach's very next request scoped to that school must be denied — there is no token-lifetime, cache, or replication grace window"; INV-6: "two concurrent redemptions of one token cannot both succeed." No vibes.

**Q5. Slices independently buildable — YES.**
Dependencies are explicit and acyclic (1 → 2 → 3 → 4; 5 depends on 1,3 "independent of Slice 4"; 6 depends on 4,5). The one forward reference is handled correctly: Slice 3 builds the live-membership guard so that "Revocation and move (written in Slice 5) take effect here on the next request" — Slice 3 is complete and testable without Slice 5 existing. Provisional file paths are flagged with an explicit remap step ("remap paths onto the real repo layout (keeping the same allowed/forbidden *intent*)").

**Q6. Single-concern slices — YES.**
Each slice is one concern: schema only ("No routes, no auth logic, no UI"), invite lifecycle, authn + the authorization chokepoint (deliberately with "No data endpoints yet — guard + a trivial... probe endpoint only"), scoped reads + redaction, admin management, impersonation. Slice 4 includes both endpoints and portal pages, but they serve the single concern (the coach read path) — not the schema+UI+publisher anti-pattern.

**Q7. L2 invariants → proof obligations AND acceptance criteria — YES.**
All nine L2 invariants map both ways, concretely enough to demand STRONG_RED:
- INV-1 → Slice 3 PO ("exactly one chokepoint... asserted by a route-coverage test") + Slice 4 PO ("red-team test enumerating other-school athlete ids through every endpoint"); AC1/AC2.
- INV-2/INV-3 → Slice 4 PO ("poisoned fixtures with attributed STRONG_RED required; serializers must be allowlist-based"); AC3/AC4.
- INV-4 → Slice 2 PO ("route-table audit + test that no self-registration path responds"); AC5.
- INV-5 → Slice 2 PO ("valid email + absent/wrong token never authenticates or binds — attributed STRONG_RED"); AC6.
- INV-6 → Slice 1 + Slice 2 POs (double-redeem at DB and API layers); AC7, AC13.
- INV-7 → Slice 3 PO ("if a token cache exists, the test must defeat it") + Slice 5 PO; AC8.
- INV-8 → Slice 5 PO ("injected mid-transaction failure proving atomicity — attributed STRONG_RED"); AC9.
- INV-9 → Slice 6 PO (scope-equivalence + audit-row creation, chokepoint reuse); AC10/AC11.

## v2 Domain lenses

**Applicability judgment:** Identity/account-claim applies (stated). Payment/status applies in its state-transition half (invite and membership state machines; no money flows). AI-output and enterprise-agent do not apply — no generated content, no LLM over permissioned data.

**Identity/account-claim lens — YES.**
All four points addressed. Claimed vs verified: "the email address is *admin-provided* (a claim); what proves control is *possession of the single-use invite token*... The binding requires the token, never the bare email" (intake), hardened as INV-5 and risk-mapped ("anyone who can read or guess an invite link claims a coach's access to minors' records"). Claiming another's record: INV-6 terminal/atomic redemption, AC7 concurrency. PII binds to verified principal: token-gated acceptance is the only account-creation path (INV-4). Identifier reassigned after binding: explicitly OQ-4 ("School email addresses get reassigned... should the system re-verify or alert when a *new* invite targets an email already bound...") plus OQ-6 holding the recovery flow out so the "claimed-vs-verified email surface" isn't reopened unreviewed.

**Payment/status lens (state-transition half) — YES.**
Replay/sibling-writer idempotency: INV-6 + AC7 ("two concurrent redemption attempts of one token yield exactly one created account/membership"). Check-then-act race reasoning: INV-7's live-state-per-request design defeats the revoke-vs-inflight-session race; INV-8/AC9 covers move atomicity with fault injection ("a forced mid-operation failure... never leaves C with A-access intact"). Stale-event handling: terminal invite states ("no transition re-arms a token"); resend "issuing a NEW token that invalidates the old one" (AC13). No money fields, so amount/currency verification is inapplicable.

## VERDICT: PASS

Q1–Q7 all YES; both applicable lenses YES. The two BLOCKED high OQs are the designed terminal state and are the correct two blockers, with implementation gating wired into the slices.

## Q8 — Pre-registered class scoring (does not affect verdict)

| Class | Score | Plan citation | Category if non-HIT |
|---|---|---|---|
| AT1 tenant isolation | HIT | INV-1; AC1/AC2; Slice 4 tests "cross-tenant direct-object-reference probes denied" | — |
| AT2 canonical server-side authz | HIT | Slice 3 scope: "the single authorization chokepoint"; PO: "proof that there is exactly one chokepoint and data routes (Slice 4) cannot bypass it"; Slice 6: "reuses the Slice 3 chokepoint (no second authorization implementation to drift)" | — |
| AT3 no trust of client-claimed tenant/role | HIT | Slice 3: "resolves the coach's *currently active* memberships from live state... derives the permitted school set"; OQ-2 names the trap: "stateless JWTs would forbid naive claims-based authorization"; INV-5: email claim alone never binds | — |
| AT4 IDOR probes denied and tested | HIT | AC1: "a recorded red-team probe of direct object references (athlete ids from school B) is denied"; Slice 4 PO: "red-team test enumerating other-school athlete ids through every endpoint" | — |
| AT5 authn vs unauthn distinguished | PARTIAL | AC5 (unauthenticated cannot create accounts), Slice 3 login paths and guard exist, but AC1 lumps "authorization denial (401/403-class)" and no named test probes unauthenticated requests against the *data* endpoints specifically | (4) acceptable limitation — with no codebase access the compiler reasonably declined to pin status-code semantics; the behavioral split is implied by the chokepoint design but never made an explicit test |
| AT6 role/permission boundaries | HIT | AC13: "each action is denied to non-admins"; Slice 5 tests: "denied to non-admins and to coaches"; INV-9/AC10: impersonation read-only, scope-equal, audited; AC11 revoked-coach impersonation shows zero data | — |
| AT7 fail-closed on missing/ambiguous tenant context | HIT | A4: "every record still fetched only under its own school's membership" (union, per-record gating); domain-model on zero memberships: "either way, no school data is reachable"; INV-1: denial "not an empty success"; OQ-5 keeps only the UX open, not the closure | — |
| AT8 authz at API/service layer | HIT | Slice 3 PO: "guard applied at router/middleware level, asserted by a route-coverage test"; Slice 4: allowlist serializers server-side, "structurally cannot emit" excluded fields | — |
| AT9 audit/logging for denied access | PARTIAL | Impersonation auditing is surfaced and proven (INV-9, AC10, append-only ImpersonationSession), and OQ-8 mentions "audit-log retention period" — but denied-access logging is neither present nor explicitly declined with recorded reasoning | (2) rubric-only gap — the spec never asks for it; the rubric class exceeds the spec, and the plan considered auditing only where it surfaced its own constraint |
| AT10 named tests proving cross-tenant denial | HIT | AC1/AC2 named criteria; Slice 3 tests: "permitted set equals exactly the active membership set"; Slice 4 tests: AC1–AC4 with poisoned fixtures and DOR probes, STRONG_RED-attributed | — |

8 HIT, 2 PARTIAL, 0 MISS.

## Files read

- /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
- /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/auth-coach-portal.md
- /tmp/spec-eval/auth/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,open-questions,implementation-slices}.md
