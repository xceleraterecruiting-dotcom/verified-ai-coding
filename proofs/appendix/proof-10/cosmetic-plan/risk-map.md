# Risk map

## Risk classification

Initial classification: L0
Final level: L0

## Justification

Every requested change is presentation-only — copy, an image asset, a color token, and a timed
visual cycle of existing content. The spec itself bounds the blast radius:

> Nothing else changes — same sections, same links, same forms.

> Should feel like a paint job, not a rebuild.

The headline, photo, and accent changes are pure presentation (L0 by definition). The testimonial
auto-rotation is the only behavioral addition, but it is client-side display behavior over
existing static content — no money, auth, permissions, user data, status transitions, or
AI-generated output is involved, so it does not rise to L2; and because it carries no business
rule (worst failure mode: a card cycles at the wrong speed or not at all), it stays within the
cosmetic envelope rather than L1 logic. Per-area: all four changes L0.

No downgrade occurred (Final == Initial), so no downgrade justification is required.
