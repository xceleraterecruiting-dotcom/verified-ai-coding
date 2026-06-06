# Project Context

Fill this once per project and keep it current. `verified-implementation` reads it before planning a feature so invariants and file scopes are grounded in how *this* system actually works. Drop the filled copy at your repo root (e.g. `PROJECT-CONTEXT.md`) or alongside `CLAUDE.md`.

## Domain

- **What the product does:**
- **Who the users are:**
- **The high-stakes actions** (money, publishing, access, data exposure):

## Critical invariants the business already cares about

List the rules that must never break, in plain language. These outrank features.

- MUST NEVER:
- MUST ALWAYS:

## Architecture layers

Where does enforcement belong? Name the layers so guards land below the UI.

- **UI / client:**
- **API / controller:**
- **Service / domain layer (where invariants are enforced):**
- **Data / persistence:**
- **External adapters / integrations:**

## Conventions

- **Language / framework:**
- **Test framework and how to run it:**
- **Where tests live:**
- **Lint / type check commands:**
- **Observability** (logging, metrics, how violations surface):

## Known soft spots

Places AI has gotten this codebase wrong before, or rules that are easy to violate by accident.

-
