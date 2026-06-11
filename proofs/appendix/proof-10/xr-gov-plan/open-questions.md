# Open questions

## Open questions

- OQ-1 [severity: high] [status: open] Automated (unreviewed) publishing: the spec asks for
  posts to "go out automatically once we trust the quality." This plan ships human-approval-
  gated publishing only (INV-3, NG2) and minimizes review friction (R11/AC-12). Do you (a)
  accept approval-gated publishing as the launch state with autonomy revisited later as its own
  re-risked change, or (b) require a defined path to automation now (e.g. graduated autonomy:
  auto-publish only for signal-post templates with N consecutive clean approvals, evergreen
  always reviewed)? This is AI-generated public content about minors; the answer changes INV-3
  and Slice 9's boundaries, so it is yours to make, not the compiler's.
- OQ-2 [severity: high] [status: open] Athlete photo rights for minors: "We use athlete photos
  when we have them" — what is the recorded basis for public marketing use of these photos
  (parental consent on file? platform ToS grant? photographer license)? Does any basis exist
  per-photo today? Until answered, INV-7 is deny-by-default: no recorded basis ⇒ no photo. The
  answer defines the PhotoAsset basis taxonomy and may add a consent-capture scope (currently
  NG5).
- OQ-3 [severity: high] [status: open] Middle schoolers in public marketing: the spec says
  posts are "sometimes middle schoolers" AND "nothing that could hurt a kid." Should
  middle-school athletes appear in public brand posts at all, and if so under what stricter
  rules (no photos? no school/location? parent sign-off per post?)? Until answered, INV-8
  blocks all posts about athletes below 9th grade by default. The answer changes a publishing
  invariant.
- OQ-4 [severity: medium] [status: open] Voice corpus: which founder writing samples seed the
  VoiceSamples set (existing posts? dictated takes?), and who curates them? Affects evergreen
  quality (R3/AC-11) but not invariants — generation refuses without samples, so this can be
  answered during Slice 5.
- OQ-5 [severity: medium] [status: open] Platform API access: is the Instagram account a
  Business/Creator account connected to a Facebook Page (required for the official content
  publishing API), and what X API tier is available for posting? Affects Slice 9 feasibility
  and cost, not invariants.
- OQ-6 [severity: medium] [status: open] Naming/identification policy for minors in posts:
  full name + school + position is standard public recruiting practice and the spec's examples
  imply it ("QB so-and-so picks up his 4th offer"), so the plan assumes it for high schoolers;
  confirm whether any identification elements should be withheld (e.g. hometown, jersey
  number). Medium because the default follows established public recruiting-media practice and
  the spec's own examples; flips to high only if the answer restricts identification, which
  would tighten (never loosen) the gate.
- OQ-7 [severity: medium] [status: open] Correction/retraction policy: when a published post is
  found wrong, is platform deletion enough, or do you want a posted correction? Slice 9 builds
  deletion+snapshot (A8/AC-9); a correction workflow would be added scope.
- OQ-8 [severity: low] [status: open] Engagement metrics timing: deferred per the spec (NG1,
  R17 reserves schema room). When you want it, it is a new compilation — flag if you expect it
  sooner than post-launch.
- OQ-9 [severity: low] [status: open] Weekly top-performer card criteria: what defines "top
  performer" for the weekly card (ranking delta? camp results? offers gained)? Needed before
  Slice 4 builds that trigger; any answer stays inside existing invariants.
