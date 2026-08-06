# Whetstone MVP Scope Notes

## Core Outcome

Stabilize the proposed Courtside core domain so an engineer can produce schema and API implementation plans without guessing about domain identity, state legality, authority, deterministic derivation, or obvious failure behavior.

## Primary Actor Or Consumer

An engineer designing the first Courtside schema and API boundary from the ratified domain specifications.

## Core Flows

- must: Preserve durable League, Team, Player, and User Account identity while representing Season Team and Roster Membership participation without historical rewrites.
- must: Finalize, forfeit, correct, and recompute Game-derived standings and playoff advancement deterministically under a frozen versioned Season configuration.
- must: Record partial Player Stat Lines while preserving unknown versus known zero and provisional versus confirmed status independently.
- must: Resolve fixed-bracket aggregate-points playoff Matchups, including aggregate overtime in the final configured Game.
- should: Preserve scoped League Administrator, Team Captain, and approved Player Management authority with the required audit trail.
- should: Preserve League timezone, English/French fallback, simple Venue, and reusable Media boundaries without expanding their implementation surface.

## In Scope

- canonical domain terminology and ownership: required_fields
- identity and participation boundaries: required_fields
- lifecycle states and legal authority transitions: required_fields
- standings inputs, ranking, random draw, and reproducibility: required_fields
- playoff aggregate calculation and tiebreak behavior: required_fields
- frozen configuration amendment and correction cascades: required_fields
- partial statistics semantics: required_fields
- scoped authorization and minimum audit behavior: required_fields
- localization, timezone, Venue, and Media domain boundaries: mention
- obvious domain failure categories and acceptance criteria: required_fields

## Deferred / Out Of Scope

- database schema and indexes
- API endpoints, transports, and event schemas
- programming language, framework, authentication provider, hosting, and deployment
- complete basketball statistics vocabulary
- UI layout and editorial translation workflow
- divisions, conferences, inter-league competition, and cross-league Player identity
- exhaustive error-code registry and operational runbooks
- implementation-specific observability, retry, timeout, and recovery design
- Phase 2 convergence declaration
- mutation of original Courtside source specifications

## Expansion Rules

- Defer reviewer requests that prescribe schema, API, framework, vendor, deployment, or UI choices.
- Defer exhaustive error matrices and runbooks unless a missing failure category prevents domain determinism or safe administrative behavior.
- Allow reviewer pressure on canonical terms, source-of-truth rules, legal transitions, correction cascades, deterministic calculations, configuration versioning, authorization boundaries, and acceptance criteria.
- Require an operator decision before adding a new persistent domain concept, lifecycle state, role, ranking criterion, playoff policy, or authority boundary.
- Preserve every explicit product decision recorded in ADR 0001 unless a contradiction makes implementation impossible.

## Good Enough

Phase 1 is good enough when the composite has no unresolved blocker or major findings across structural integrity, determinism, and operability; all accepted edits remain within the scope contract; any requirement-strength, authority, scope, enum, or error-vocabulary change is surfaced as an operator decision; and the resulting candidate is explicit enough to plan schema and API work without selecting those implementations.

