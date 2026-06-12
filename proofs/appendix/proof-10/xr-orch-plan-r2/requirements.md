# Requirements

## Requirements

Each requirement cites the spec wording that forces it (see `spec-intake.md` verbatim section).

- R1 — A scheduled job runs every few minutes and selects recently verified offers from the
  database. ("a scheduled job picks up recent verified offers"; "the job will run every few
  minutes")
- R2 — For each selected offer, the job extracts exactly the public facts: athlete name,
  athlete's school, offering college, offer date. ("pulls the public facts (athlete name,
  school, the offering college, offer date)")
- R3 — For each offer, the job generates one draft post through the engine's existing model
  pipeline. ("produce a draft post for each one"; "generates the draft through our existing
  model pipeline") — interface contract: the pipeline invocation must return or record a
  model-call reference resolvable to model id and prompt version (see INV-8, OQ-6).
- R4 — Each generated draft is placed into the founder's review queue in a non-published,
  pending-review state; no code path in this feature publishes, posts, or sends anything
  externally. ("put it in my review queue"; "Drafts wait in the queue for me — nothing posts by
  itself")
- R5 — Re-encountering an already-drafted offer on a later (or concurrently overlapping) run
  creates no duplicate draft. ("it has to cope with seeing the same offers again without
  flooding my queue with duplicates of drafts it already made")
- R6 — Distinct offers for the same athlete each get their own draft; dedupe distinguishes
  offers, not athletes. ("a kid often has several offers" + "a draft post for each one")
- R7 — A bad record (e.g. weird/partial date, missing fact) fails only its own item; the run
  continues over remaining offers. ("If a run hits a bad record I don't want the whole batch
  dying silently")
- R8 — Every run writes a durable run-history record with outcome counts and per-item failures
  (what failed and why), including runs that crash mid-way. ("I want to see what failed and why
  in the run history")
- R9 — A failed item or failed/crashed run leaves no partial draft or orphaned trace data in
  the review queue. ("a failed run shouldn't leave half-written junk in the queue")
- R10 — Stored errors in run history are presentable for the internal dashboard: sanitized
  (no stack traces, secrets, prompt text, raw model output), bounded length, with a structured
  cause code. ("Keep whatever errors we store presentable; the run history shows up in our
  internal dashboard")
- R11 — Every draft stores resolvable traceability to its source offer id(s), the model call
  that wrote it, the model id, the prompt version, and the orchestration run that produced it.
  ("Every draft should trace back to the offer(s) it came from and the model call that wrote
  it, same as the rest of the engine" — with the convention's required minimum stated per IN-6)
- R12 — Drafts are generated only from offers in verified status; the four public facts are the
  only domain inputs to generation (no enrichment from other sources). ("verified offers";
  "pulls the public facts" per IN-7)
- R13 (lens-derived, AI-output #6/#11) — Generated drafts are programmatically verified against
  source facts before enqueue (no fabricated names/schools/colleges/dates), and model output
  failing structural validation degrades to a recorded item failure, never into the queue.
- R14 (lens-derived, AI-output #7/#8) — A generator-side regression harness exists: golden cases
  (fixed offer inputs → expected draft properties) and adversarial cases (inputs crafted to
  elicit fabrication, leakage, or off-policy output).
- R15 — Run history (counts + sanitized per-item failures) is visible in the existing internal
  dashboard. ("the run history shows up in our internal dashboard")
