# Spec intake — cosmetic landing refresh

## Original spec (verbatim)

> Hey — the landing page hero feels stale. Can we update the headline to "Train with the best in
> the Lowcountry", swap the hero photo for the new team shot (I'll send the file), change the accent
> color from orange to a deeper red, and make the testimonial cards rotate automatically every few
> seconds? Nothing else changes — same sections, same links, same forms. Should feel like a paint
> job, not a rebuild.

## Compiler paraphrase

Four presentation-only changes to the existing landing page:

1. Replace the hero headline text with exactly "Train with the best in the Lowcountry".
2. Replace the hero photo with a new team-shot image the user will supply.
3. Change the site accent color from the current orange to a deeper red.
4. Make the testimonial cards auto-rotate on a timer of a few seconds.

Everything else — sections, links, forms, structure — stays exactly as it is.

## Interpretation notes

- "change the accent color" is read as: update the accent color wherever it is defined (theme
  token / CSS variable / utility class), so every element that uses the accent changes together.
  Rejected reading: change only the hero's accent usage, leaving other accent-colored elements
  orange (the spec says "the accent color", singular and site-level, and "paint job" implies
  consistency).
- "rotate automatically every few seconds" is read as: a timed carousel that cycles through the
  existing testimonial cards, with all testimonials still present and reachable. Rejected reading:
  a visual rotation/spin animation of the cards in place — "rotate" next to "every few seconds"
  clearly means cycling.
- "Nothing else changes" is read as a hard constraint, not a vibe: no new sections, no copy edits
  beyond the headline, no link or form changes, no layout restructuring.

## Assumptions

- A1: A rotation interval of 5 seconds satisfies "every few seconds"; it can be a trivially
  adjustable constant.
- A2: The exact "deeper red" value is the implementer's pick (a clearly darker red than the
  current orange) unless the user supplies a hex; flagged as OQ-2 so they can override.
- A3: The hero photo will be delivered as an image file before or during implementation; the
  slice can proceed with a placeholder path and swap the asset in when received (OQ-1).
- A4: Auto-rotation should pause on hover/focus and respect `prefers-reduced-motion` — standard
  accessibility behavior the user would endorse for a "paint job" that doesn't degrade anything.

## Open questions

See `open-questions.md`. None are high severity; nothing blocks implementation.
