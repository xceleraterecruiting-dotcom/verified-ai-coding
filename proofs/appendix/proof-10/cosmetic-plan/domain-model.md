# Domain model

## Entities

This is presentation-only work; no business entities are created or changed.

- Landing page hero — headline text, hero image, accent-colored elements.
- Accent color token — the single theme value (CSS variable / design token) all accent usage
  derives from.
- Testimonial card — existing static content; gains a position in a rotation cycle.
- Testimonial rotator — the only new concept: a timer that advances the visible card.

## States and transitions

The testimonial rotator is the only stateful piece:

```
idle (reduced-motion or hover/focus) <-> rotating
rotating: card[i] -> card[(i+1) % n] every ~5s, wrapping forever
```

No persistence, no server state, no entity lifecycle. Everything else on the page is static and
unchanged.
