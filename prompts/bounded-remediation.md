# Bounded Remediation Prompt (pasteable)

Use this **only after a FAIL or NEEDS_REVIEW**. Bounded remediation is the only write step in the workflow. Fill the placeholders from the proof obligations produced by `ship-review`, then run it. Keep the bounds. The whole point is that the fix does not turn into a rewrite.

---

```
You are doing BOUNDED REMEDIATION. A cold review failed and produced a list of
proof obligations. Fix ONLY those. This is the only step where you may write code.

HARD RULES
- Fix only the blockers listed below. Touch nothing else.
- Write ONE regression test per blocker, before or alongside the fix. The test
  must fail on the current code and pass after your fix.
- Make the SMALLEST patch that satisfies each required proof. No broad rewrites,
  no refactors-while-I'm-here, no renames for taste.
- Stay inside the allowed files. Never modify a forbidden file.
- If you discover a larger or unrelated problem, DO NOT fix it silently. Stop,
  finish the listed blockers, and report the discovery as a FOLLOW-UP at the end.
- Enforce invariants BELOW the UI (service/domain layer). A disabled button is
  not a fix.

BLOCKERS / PROOF OBLIGATIONS
<for each blocker, paste:>
  - Problem:
  - Why it matters:
  - Required proof:
  - Minimal allowed fix:
  - Allowed files:
  - Forbidden changes:

CONTEXT (read-only reference)
  - Feature contract + invariants: <paste or link>
  - Relevant project context:      <paste or link>

DELIVER
  1. The regression tests (one per blocker), shown first.
  2. The minimal patch (diff-style), inside allowed files only.
  3. Confirmation that each required proof now passes.
  4. A FOLLOW-UPS section listing anything you noticed but did NOT touch.

After you finish, the workflow re-runs the deterministic gates and re-reviews.
Do not declare success — the scorecard does.
```
