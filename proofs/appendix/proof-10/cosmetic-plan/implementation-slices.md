# Implementation slices

No codebase context was available at compile time, so file paths below are conventional
placeholders (see OQ-3); confirm the real landing-page paths at the start of each
verified-implementation run and substitute them 1:1.

## Slice 1: Static paint job — headline, hero photo, accent color

### Scope
Apply the three static changes: set the hero headline to "Train with the best in the
Lowcountry", swap the hero photo for the supplied team shot, and change the accent color token
from orange to the chosen deeper red. No structural or behavioral changes.

### Allowed files
- src/components/landing/
- src/styles/
- public/images/

### Forbidden files
- src/api/
- src/forms/
- package.json

### Invariants touched
- INV-1, INV-3, INV-5

### Tests required
- A snapshot/string assertion that the hero headline equals the exact spec string (AC1).
- A check that the accent token resolves to the new red and no template references the old
  orange value (AC3).
- An assertion (snapshot diff or DOM check) that links and form markup are unchanged (AC6).

### Proof obligations
- AC1, AC2, AC3, AC6 demonstrated (screenshot or rendered-output check is sufficient at L0).
- No L2+ invariants exist, so no attributed STRONG_RED regression evidence is required.

### Rollback notes
Plain revert of the commit; the old hero image asset is kept in history. No data, schema, or
flag involved.

### Done criteria
AC1, AC2, AC3, and AC6 pass; visual review confirms no other visible change on the page.

## Slice 2: Testimonial auto-rotation

depends on: none (independent of Slice 1; either order works)

### Scope
Wrap the existing testimonial cards in a timed rotator that advances every ~5 seconds and wraps
around, pausing on hover/focus and disabling auto-advance under `prefers-reduced-motion`. Card
content, count, and markup are otherwise unchanged.

### Allowed files
- src/components/landing/
- src/styles/

### Forbidden files
- src/api/
- src/forms/
- public/images/
- package.json

### Invariants touched
- INV-1, INV-2, INV-4

### Tests required
- Timer test: with fake timers, the visible card advances after the interval and wraps from last
  to first (AC4).
- All existing testimonials appear across one full cycle — none dropped (AC4, INV-2).
- With reduced motion or hover/focus, no auto-advance occurs and cards remain reachable (AC5).

### Proof obligations
- AC4 and AC5 demonstrated by the tests above; AC6 re-checked so the rotator wrapper is the only
  markup change. No L2+ invariants, so no attributed STRONG_RED regression evidence is required.

### Rollback notes
Plain revert of the commit restores static cards; no data or flag involved. (Optionally the
interval constant set to 0/disabled acts as a kill switch, but revert is the rollback.)

### Done criteria
AC4 and AC5 pass; testimonial content is unchanged; sections, links, and forms unaffected.
