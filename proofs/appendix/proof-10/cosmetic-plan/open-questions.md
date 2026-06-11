# Open questions

## Open questions

- OQ-1 [severity: low] [status: open] The new team-shot file has not been delivered yet ("I'll
  send the file"). Slice 1 can be built with a placeholder path, but cannot be called done until
  the real asset is in place. What is the file, and are there crop/aspect constraints?
- OQ-2 [severity: low] [status: open] "A deeper red" has no exact value. A2 lets the implementer
  pick a clearly darker red; does the user have a specific hex/brand value to use instead?
- OQ-3 [severity: low] [status: open] No codebase context was available to the compiler, so slice
  file paths are conventional placeholders. Confirm the actual landing-page component, stylesheet,
  and image-asset locations before running each slice (substitution is mechanical; it changes no
  slice boundary).
- OQ-4 [severity: low] [status: open] Should rotation include visible controls (dots/arrows), or
  is pure auto-advance with pause-on-hover enough? Plan assumes no new controls ("nothing else
  changes"); easy to add later if wanted.
