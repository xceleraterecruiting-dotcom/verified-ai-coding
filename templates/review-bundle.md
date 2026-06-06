# Review Bundle

The single, self-contained document handed to the cold reviewer. The reviewer reads only this — no repo access — so everything needed for the verdict must be in here. Assemble it, then paste it after the prompt in `prompts/cold-reviewer.md`.

## 1. Original request

> (the user's words)

## 2. Feature contract

> (paste the filled feature-contract.md)

## 3. Invariants (MUST ALWAYS / MUST NEVER)

> (paste the filled invariant-checklist.md, including the business-invariant risk call)

## 4. Project context (relevant slice)

> (domain, the architecture layer where invariants must be enforced, test conventions)

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
