# Review Bundle

The single, self-contained document handed to the cold reviewer. The reviewer reads only this — no repo access — so everything needed for the verdict must be in here. Assemble it, then paste it after the prompt in `prompts/cold-reviewer.md`.

> **Reviewer independence note.** The reviewer must not rely on builder narrative — only on the contents below. The review result must state what inputs were actually reviewed and whether the review was **same-session, fresh-context Claude, different-Claude-model, or different-vendor**. If external API review is used, the result must record whether **code left the machine**, **which provider/model** received it, and whether **explicit egress approval** was given. (See `docs/reviewer-context.md`.)

## 1. Original request

> (the user's words)

## 2. Feature contract

> (paste the filled feature-contract.md)

## 3. Invariants (MUST ALWAYS / MUST NEVER)

> (paste the filled invariant-checklist.md, including the business-invariant risk call)

## 4. Project context (relevant slice)

> (domain, the architecture layer where invariants must be enforced, test conventions)

## 4b. Grounding evidence

Include the **actual evidence** for load-bearing existing code the slice reuses — not only prose summaries. *A summary of existing code is a claim; the grounding evidence is the proof.* Required when applicable:

- existing guard/seam code; route body; accepted request-body shape;
- repository/query behavior; actor/timestamp source; idempotency/claim logic;
- any code path the new implementation claims to reuse (and proof it routes through it, not around it).

## 4c. Client interpretation evidence

Include when a UI/client composes backend seams: route/seam response statuses and result bodies; client branching logic; multi-step partial-state behavior; stale/error handling; and tests proving the client maps each response truthfully (idempotent-success as success, refusal as not-completed, stale/error as safe refresh — never optimistic success).

## 5. The diff under review

```diff
(paste git diff)
```

## 6. Test / eval / redteam results

> Paste **actual run output**, not intentions. For each redteam case: input → required behavior → observed behavior.

```
(test runner output)
```

## 7. Rubric / ship gates

- [ ] Behavior matches contract
- [ ] Every MUST NEVER refused below the UI (name the line)
- [ ] Every MUST ALWAYS guaranteed
- [ ] Tests exist, pass, and exercise the invariants
- [ ] Every redteam case behaves as required
- [ ] Violations observable in production

## 8. Anything the reviewer should know

> Known gaps, deliberate omissions, open questions.
