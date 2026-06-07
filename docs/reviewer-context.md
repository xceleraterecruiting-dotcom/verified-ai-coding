# Reviewer context

A ship-review verdict is only as trustworthy as the reviewer behind it. This page explains why Verified AI Coding records **reviewer context** on every review, and why the labels are deliberately honest about how independent a review actually was.

The core principle: **the builder cannot grade its own work from the same context and call it independent validation.**

## Why reviewer context matters

A "PASS" means very different things depending on who produced it. The same agent that wrote the code, holding the whole persuasive implementation narrative in its context, is the least independent possible reviewer. A different vendor's model that saw only the cold bundle is the most independent practical reviewer. If both are labeled "reviewed: PASS," the label hides the difference that matters. Recording reviewer context makes that difference visible instead of letting a weak review masquerade as a strong one.

## The levels, weakest to strongest

1. **Weak — same session.** The session/agent that implemented the change reviewed its own work. It still carries the builder's chat history and its own rationalizations. Fine for local iteration; not proof.
2. **Fresh-context Claude.** A separate Claude subagent or fresh Claude session reviewed only the cold bundle. This strips the builder narrative — the reviewer can't be swayed by "as I explained, this is safe because…" — but it is still Claude reviewing Claude. **Fresh-context review removes the builder's narrative; it does not make the reviewer a different model.**
3. **Different-Claude-model.** A different Claude model reviewed only the cold bundle (e.g. Opus reviewing Sonnet's work). Stronger than same-model fresh context, because the two models don't share identical weights — but it is still the same vendor and model family, so it shares much of the same training and the same blind spots.
4. **Different-vendor model.** A non-Claude model (e.g. OpenAI or Gemini) reviewed only the cold bundle. This is the first level that breaks model-family correlation, so it can catch classes of error a Claude reviewer is systematically prone to miss. It is stronger independence — but it sends code to a third party.
5. **Different-vendor + isolated tools.** The strongest practical mode: different vendor, cold bundle only, explicit egress approval, and the reviewer's tool scope restricted/enforced where the platform supports it.

## Why same-session review is weak

The builder has already decided the code is correct — that's why it wrote it that way. Asked to review its own work in the same context, it tends to confirm its own narrative. It is the most prone to false green. A same-session PASS is a useful smoke check during iteration; it is not evidence of independence.

## Why fresh-context Claude is useful but not different-model

Removing the chat history is a real improvement: the reviewer must reason from the artifact, not from the builder's framing. But two Claude sessions still share the same model family, so they share the same systematic blind spots. A bug both instances are equally likely to overlook will be overlooked twice. Fresh context buys independence *of narrative*, not independence *of model*.

## Why different-Claude-model is stronger but still same family

A different Claude model won't make exactly the same mistakes as the builder model, so it catches more. But same-vendor models are trained on overlapping data with related methods, so their blind spots correlate. It's better — not independent.

## Why different-vendor review is stronger

A model from a different vendor has different training data, different methods, and therefore *different* blind spots. Where Claude-reviewing-Claude misses a whole category twice, a cross-vendor reviewer is more likely to catch it. **Different-vendor review reduces correlated blind spots, but it creates a code-egress decision.**

## Why different-vendor review creates a code-egress decision

Handing the cold bundle to an external API means sending the diff and code under review to that provider. For sanitized or public fixtures that is fine. For proprietary code it is a real intellectual-property and privacy decision that must be made deliberately, per bundle — not by default, and never silently.

## Why deterministic gates still matter more

All five levels are *model judgment*, which is advisory. **Deterministic gates remain the source of truth; model review is advisory.** Tests, redteam cases, typecheck, lint, executable proof modules, and CI are repeatable and opinion-free. A cross-vendor reviewer that says "looks good" does not override a red test, and a glowing review never substitutes for a missing gate. Model review's job is to catch what the gates missed, not to outrank them.

## Why we avoid fake independence labels

It is easy to spin up a second instance of the same model, call it "the independent reviewer," and present its PASS as validation. That is theater. **Do not create a fake independent reviewer that is really just the same model in a new costume.** And remember: **Configurable is not the same as enforceable.** A reviewer that is *asked* to ignore tool access or *configured* for a different model, but could silently fall back, has not actually provided the isolation it claims. Label what was truly achieved, not what was requested.

## How this ties to the core principle

Verified AI Coding's spine is: *the tool's own output is a lead, not truth.* Reviewer context is that principle pointed at the review step itself. A review is also tool output — so its independence is a claim to be verified, not assumed. Recording reviewer context is how we keep the review honest about its own strength.

## Existing proof artifacts

Existing proof artifacts produced before this metadata standard should be treated as **not independently validated** unless they explicitly record reviewer context.

Proofs #1–#3 from the initial production use were produced before this standard and should be described honestly as **same-session or fresh-context Claude review, not different-model independent review**. (The cold-review discipline was followed, but the reviewer was the same model family as the builder, and in practice the same session — so those PASSes are valid local iteration evidence, not independent validation.)

> This task does not edit those artifacts in their home repository. It only sets the standard by which they should be described going forward.

## External review and egress policy

External review is allowed **by default only for sanitized/public bundles**.

Real proprietary code bundles require **explicit per-bundle approval** before any external API call.

External-review tooling must:
- read API keys **only from environment variables**;
- **never** commit or print secrets;
- avoid logging full sensitive bundle contents unnecessarily;
- clearly **label when code leaves the machine**;
- record the **provider/model** used;
- preserve **deterministic gates as the source of truth**.
