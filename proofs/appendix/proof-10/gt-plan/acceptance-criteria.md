# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV- id.

- AC-1 (INV-1): For a fixture corpus with restricted documents and a principal lacking access,
  capture the exact prompt sent to the gateway for queries targeting that content; assert zero
  occurrences of the restricted documents' content, titles, or ids in the prompt.
- AC-2 (INV-2): For the same query asked by (a) a principal where the relevant restricted
  document exists and (b) a principal in a corpus where it was never ingested, the full HTTP
  responses (status, body shape, decline text, citation list, any counts) are byte-equivalent
  modulo timestamps/ids — restricted is indistinguishable from absent.
- AC-3 (INV-3): Ingest fixtures with (a) no permission metadata, (b) malformed metadata, (c) an
  unknown source-system schema; assert each is marked non-`normalized` and is returned to no
  principal — including an admin-like principal — by the retrieval API.
- AC-4 (INV-4): A request carrying forged client-side identity/team/role claims (headers, body
  fields, JWT claims not issued by SSO) is rejected or resolved server-side to the session
  principal; the forged grants never widen retrieval (proven by a probe that would only pass
  with the forged team).
- AC-5 (INV-5): Code-level + behavioral check: the retrieval query includes the ACL predicate
  (inspected via query logging in test), and a test that disables any post-retrieval filter still
  leaks nothing because the database never returned restricted rows.
- AC-6 (INV-6): Grant a principal access, run a query that retrieves document D, re-sync D's
  metadata revoking access, repeat the query: D appears in neither retrieval nor answer, with no
  cache flush step in between.
- AC-7 (INV-7): Every non-declined answer in the eval run has ≥1 citation, and 100% of citations
  resolve to document ids present in that query's logged RetrievalSet; a synthetic answer citing
  an out-of-set id fails validation.
- AC-8 (INV-8): On a fixture set of unanswerable questions (no relevant accessible docs), the
  assistant declines for ≥ the agreed threshold (placeholder until OQ-5; test asserts decline,
  not answer, per case); declines contain no fabricated citations.
- AC-9 (INV-9): Dashboard unit tests: a dataset of N queries with d declines and g grounded
  answers yields groundedness = g/(N−d) and decline rate = d/N; a decline can never increment
  the grounded numerator; the displayed metric definitions match these formulas.
- AC-10 (INV-10): A dashboard viewer who lacks access to document D cannot see D's content,
  title, or the per-query records that embed D's content — verified by requesting every
  dashboard/eval endpoint as that viewer; aggregates remain visible.
- AC-11 (INV-11): Static check + runtime test: the only outbound model-call dependency is the
  gateway client; a network-recording test run shows no calls to model-provider hosts.
- AC-12 (INV-12): The leak-probe suite (≥ the probe matrix in Slice 7: cross-team, exec-only,
  missing-metadata, forged-identity, existence-hint probes) runs in CI against the real retrieval
  and answer path; any probe failure exits nonzero and blocks release.
- AC-13: An engineer fixture asking a parental-leave question receives an answer citing the HR
  policy document with a working click-through link (R1, R7 happy path).
