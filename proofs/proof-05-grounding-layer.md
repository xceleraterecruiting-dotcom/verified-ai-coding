# Proof #05 — Grounding layer (a hardening proof, not a live catch)

This one is different from Proof #04. Proof #04 records a **real** catch: the fresh-context reviewer found an actual concurrency race in production code. **Proof #05 is a hardening note** — it records a risk we recognized and closed by changing the workflow, plus the *partial receipt* that showed the risk is real. It is not a live save; it is the reason a new gate exists.

## The risk

A verified run produced polished, internally-consistent planning artifacts — contract, invariants, enforcement-path map. The slice depended heavily on **existing safety seams**: it claimed to "reuse the canonical guard," "re-read from the database," and "ignore caller-supplied state." Every one of those is a claim about code that already exists, not about the diff under review.

The failure mode: if the agent **misread** one of those existing seams — summarized it instead of verifying it — the polished contract would *launder a wrong premise*. The plan would look complete and the review would pass against it, while the real, load-bearing assumption ("the seam actually does X") was never checked. A correct-looking call to a seam that doesn't behave as assumed is still a broken invariant.

## The partial receipt (why this isn't hypothetical)

During an earlier slice's survey step, the workflow caught that a lifecycle timestamp the recovery design depended on was **not actually populated** by the existing code path — the premise "the timestamp is set when work starts" was false until a one-line change made it true. That was a misread premise that would have broken an otherwise polished plan, surfaced only because the existing code was inspected rather than summarized. Small, but a real instance of the exact risk above.

## The hardening

- **Grounding verification gate** (`verified-implementation`): before contract approval, every claim about existing code the slice depends on must be backed by actual evidence — exact file/function/route, what it reads, what caller input it ignores, whether actor/timestamp are server- or caller-controlled, and whether the new path routes through the seam or bypasses it. A contract that leans on an existing seam is **not approval-ready** until that evidence is present. It is framed as an extension of the pack's spine — *the tool's output is a lead, not truth* — applied to premises: **a summary of existing code is a claim; the grounding evidence is the proof.**
- **Grounding review** (`ship-review`): the reviewer checks whether the contract's description of existing code is *true* — not just whether the diff is consistent. No grounding evidence for a relied-on seam → **NEEDS_REVIEW**. Implementation bypasses a seam the contract claimed it reused → **FAIL** (unless the contract was updated and re-approved).
- **Templates** carry a grounding table (contract), a grounding-evidence section (bundle), and a grounding row (scorecard), so every invariant-bearing run has a place for the load-bearing premise to be made auditable.
- **Slice mode** (Full vs Light) keeps this from becoming ceremony on low-risk changes: *ceremony is not rigor.*

## The point

The goal is not more paperwork. It is to make the **load-bearing premise auditable** — so a polished plan can no longer rest on an unverified or misread belief about the code it depends on. Deterministic gates remain the source of truth; grounding makes the *assumptions under* the plan visible before anyone trusts it.
