# Redteam Cases

Exactly five cases, all targeting the single approval/publish-gating invariant. (We deliberately do not test which copy/version publishes — only *whether* a job is created.)

Each case states input → required behavior, plus the **initial actual** behavior against the flawed baseline. The two failures are the asset.

| # | Input | Required | Initial actual (flawed baseline) |
|---|---|---|---|
| 1 | No approval exists | **reject** | reject ✓ (the one thing the baseline got right) |
| 2 | Approval exists, `decision = "rejected"` | **reject** | ✗ **publish job created** |
| 3 | Approval ok, `draft.gate_status = "blocked_until_fixed"` | **reject** | ✗ **publish job created** |
| 4 | Approval `decision = "approved"`, clean draft | **allow** | allow ✓ |
| 5 | Approval `decision = "approved_with_edits"`, clean draft | **allow** | allow ✓ |

## Why these five

- **Case 1** is the only path the baseline guards — it's the trap that makes the code *look* correct.
- **Cases 2 and 3** are the real bugs: a rejected approval and a blocked draft both slip through. These are the cases that fail the review.
- **Cases 4 and 5** prove the corrected guard isn't *too* strict — `approved_with_edits` is a valid approval and must still publish.

A redteam suite that passed on the first run here would mean we weren't testing the boundary. Cases 2 and 3 failing is exactly what we want to see before remediation.
