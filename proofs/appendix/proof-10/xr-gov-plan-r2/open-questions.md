# Open questions

High severity = the answer changes an invariant, a privacy/publishing behavior, or slice
boundaries. The three high-severity questions below are founder-owned decisions; per the
compiler's grammar they BLOCK implementation until answered — they are deliberately not resolved
by compiler assumption.

## Open questions

- OQ-1 [severity: high] [status: open] Photo/likeness rights for minors: "We use athlete photos when we have them" — possession is not a rights basis. What basis does the platform actually have (written parental/guardian consent, athlete-submitted media with terms, public-source media, none), and what must a PhotoRightsRecord contain to satisfy INV-7? If the honest answer is "none yet", Slice 6 ships no-likeness-only.
- OQ-2 [severity: high] [status: open] Approval-free automatic posting: the spec asks for posts that "go out automatically once we trust the quality". This plan mandates a recorded human approval on every publish (INV-4; AI-output lens item 12 at L3 — minors + public output) and treats autopilot as out of scope (NG-1). Does the founder accept that for this build? If autopilot is ever to exist: who has authority to enable it, against what measured bar (Slice 9 harness results? error-free streak?), and does it apply to signal posts only, evergreen only, or both?
- OQ-3 [severity: high] [status: open] Age/grade floor: posts cover "high schoolers, sometimes middle schoolers". What is the minimum age/grade for an athlete to be featured publicly, and is parental consent required below some threshold (note: identifiable public content about under-13s carries platform-policy and COPPA-adjacent exposure)? The answer is the policy constant behind INV-8 and Slice 2's eligibility filter; unknown age/grade fails closed regardless.
- OQ-4 [severity: medium] [status: open] Platform access: which brand accounts exist, are they eligible API types (Instagram professional account via Graph API; X API tier with write access), and what platform automation/cadence rules constrain the scheduler and publisher? Affects Slice 7 implementation detail and Slice 8 cadence, not invariants.
- OQ-5 [severity: medium] [status: open] Founder voice: how is "sounds like me" supplied and judged — a corpus of past posts/writing, a style guide, founder calibration review of sample evergreen drafts? The accepted voice prompt version is recorded per INV-6; mechanics land in Slice 3/AC-18.
- OQ-6 [severity: medium] [status: open] Correction/takedown: when a published claim becomes wrong (offer rescinded, decommitment) or a parent requests removal, what is required? Lens-derived default in this plan: manual platform deletion plus an audit note (NG-8). Is an in-system correction/takedown workflow with an SLA required instead — especially for parent/guardian requests?
- OQ-7 [severity: medium] [status: open] Is "coach activity" (the spec lists it among the gold data) a publishable post source, or is coach behavior on the platform confidential signal? It is excluded from the Slice 2 allowlist until answered; including it later widens INV-1's allowlist deliberately.
- OQ-8 [severity: low] [status: resolved: the spec itself permits deferral — "Stats on engagement can come later if it's faster to ship without"; recorded as NG-2] Engagement analytics and the learn-what-works loop are out of this build.
- OQ-9 [severity: low] [status: open] Where do brand fonts/colors/templates and athlete photo assets live today, and who supplies the initial card templates for Slice 6?
