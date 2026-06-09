# Proof #07 — Audit triage and scope gates (hardening note)

Like Proofs #05 and #06, this is a **production-learned hardening note, not a heroic catch**. It records what an audit-style remediation run taught the workflow about *broad* requests and *scope discipline* — the failure modes that appear when the ask is "fix everything" instead of "fix this one thing."

## What happened

A run began from a broad request — an open-ended "find and fix the issues" sweep across a production repo. Three things surfaced that the per-slice workflow hadn't been forcing:

1. **The audit produced a queue, not a diff.** A broad request yields many findings of mixed severity and mixed grounding. Going straight to implementation from that list invites a sprawling, unreviewable change that fixes several unrelated things at once — and buries any real regression in noise.
2. **Findings carried uneven grounding.** Some were read first-hand from the exact source; others were quoted from a grep, a summary, or a prior pass without re-reading the load-bearing code. A few were plausible but, on grounding, turned out to be false. Acting on an ungrounded high-severity claim is how a "fix" introduces a bug while chasing one that was never real.
3. **Scope drifted silently.** Even with an allowed/forbidden file list written into the contract, nothing *mechanically* compared the actual diff against it. A slice meant to touch a small handler could quietly edit an adjacent module, and a prose review can miss the extra file.

## The lesson

A broad request is not an implementation task; it is a **triage task that produces one approved implementation task at a time**. And an allowed-files list that is never checked against the diff is a comment, not a control.

## The hardening

- **verified-implementation:** an **Audit triage** step for broad requests — findings go into a triage report (severity + grounding + minimal fix surface + recommended slice) before any code. The model selects the smallest high-value slice, writes a contract for *that* slice only, and stops for approval. A **grounding ledger** (✅ first-hand / 📎 quoted-indirect / ❌ unproven / 🧪 reproduced / 🔁 retracted) gates which findings are actionable: high-severity findings can't be implemented from quoted or unproven grounding. Step 6 now states the allowed-files list is a **gate**, checked mechanically.
- **ship-review:** an audit & scope review — confirm the work came from a selected slice (not the whole queue), confirm load-bearing findings carry grounding appropriate to severity, and run the mechanical scope check; a diff outside the approved files is FAIL. A **proof-depth** review confirms each gate's evidence actually reaches the failure mode it claims to cover.
- **scripts/check-allowed-files.mjs:** a dependency-free, read-only-git scope check. It parses the run's allowed/forbidden lists and classifies the current diff; a file outside allowed (or under forbidden) fails the gate. It is a **scope check, not a security sandbox** — it catches drift, it does not contain a hostile process. Pure matcher/classifier covered by `check-allowed-files.test.mjs`.
- **Templates:** an `audit-triage.md`; a `test-output.md` with proof-depth labels (SOURCE-TRACE / UNIT-MOCK / SEAM-LEVEL / ROUTE-LEVEL / DB-REAL / LIVE-SMOKE / UI-CLIENT / OPERATOR-CHECK); a grounding-level column in the contract; a Scope row + proof-depth labels in the scorecard; triage/scope/proof-depth sections in the review bundle; a proof-depth column in the redteam plan.

## The point

The goal is **not** more ceremony on small changes — Light/Full mode still governs that. The goal is narrow and honest: **a broad request must converge to one grounded, scoped, proof-depth-labeled slice before code is written**, and the diff must be mechanically held to the scope that was approved. Broad audits produce queues; this workflow turns a queue into one approved diff at a time.
