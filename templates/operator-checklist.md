# Operator checklist (post-ship reality checks)

Some failures are structurally invisible to any test suite: they live in the
environment, the deploy pipeline, or a third party's real behavior. Field
evidence (see `docs/field-reports/sasha.md` §operator-checks and
`docs/field-reports/email-cleaner.md`): production env vars that were all
empty for a day, five releases that silently failed for five hours behind a
healthy-looking domain alias, a realtime echo that only appeared when realtime
started working, and a mail provider that silently drops headers no mock
modeled.

Run this after merge/deploy for any slice that touches deployment surface,
configuration, external providers, or realtime behavior. Each check is
`OPERATOR-CHECK` proof depth — record results in the scorecard's Runtime
verification field.

> **A green suite proves the code; only an operator check proves the world.**

## Environment & secrets

- [ ] Every env var the slice reads exists in the target environment **and is
      non-empty** — verify by *pulling and length-checking the value*, not by
      listing names. (Piped `env add` can silently store empty strings.)
- [ ] Fail-closed behavior confirmed: with the var absent/short, the app
      refuses rather than degrades silently (if that's the contract).

## Deploy reality

- [ ] The deployment that contains this change actually reached
      READY/serving — verified by **deployment ID**, not by the domain alias
      (an alias keeps answering health checks from the previous deploy).
- [ ] The release script/pipeline surfaces a non-zero exit — confirm your own
      piping doesn't eat the exit code.
- [ ] One real request exercises the changed path in the deployed
      environment (not just `/health`).

## Third-party / provider reality

- [ ] First contact with the real provider (IMAP/SMTP quirks, rate limits,
      webhook echo/duplication, pagination limits) is a planned, observed
      step — never discovered by users.
- [ ] Echo/duplication behavior checked where the provider reflects your own
      writes back (realtime channels, webhooks): does the client blind-append
      its own echo?

## Results

| Check | Evidence (command / dashboard / transcript) | Result |
|---|---|---|
|  |  |  |
