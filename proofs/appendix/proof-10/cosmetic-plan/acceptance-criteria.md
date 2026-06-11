# Acceptance criteria

## Acceptance criteria

1. AC1 — The rendered hero headline is exactly "Train with the best in the Lowcountry" (INV-5).
2. AC2 — The hero displays the new team-shot image; the old photo is no longer referenced.
3. AC3 — The accent color renders as the chosen deeper red on every element that previously
   rendered the orange accent; a visual sweep of the page finds no leftover orange accents and no
   unrelated color changes (INV-3).
4. AC4 — Left untouched, the testimonial carousel advances to the next card after ~5 seconds and
   wraps from the last card back to the first; every existing testimonial appears in the cycle
   (INV-2).
5. AC5 — With `prefers-reduced-motion: reduce` (or while the carousel is hovered/focused), cards
   do not auto-advance, and every testimonial is still reachable (INV-4).
6. AC6 — A before/after diff of the page shows no changes to sections, link hrefs, or form
   markup/handlers outside the hero headline, hero image, accent token, and testimonial rotation
   wrapper (INV-1).
