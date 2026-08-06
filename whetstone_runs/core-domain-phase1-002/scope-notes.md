# Whetstone MVP Scope Notes

## Core Outcome

Verify that the operator-approved Courtside Phase 1 candidate is structurally complete, deterministic, and operable enough to plan schema and API work without guessing.

## Primary Actor Or Consumer

An engineer designing the first Courtside schema and API boundary from the ratified domain specifications.

## Core Flows

- must: Verify direct scheduled-Game rescheduling with required history and deterministic invalid-mutation handling.
- must: Verify the approved Player Management surface for display name and profile photo, including self-service photo updates by linked individual members.
- must: Verify administrator bootstrap follow-on governance while preventing removal of the final active League Administrator.
- must: Verify deterministic frozen-configuration identity and idempotent random-draw replay.
- must: Verify roster eligibility anchoring and both audited downstream playoff-correction resolutions.
- should: Preserve every previously stabilized identity, lifecycle, standings, playoff, audit, localization, Venue, and Media boundary.

## In Scope

- residual structural integrity findings from the prior run: required_fields
- residual determinism findings from the prior run: required_fields
- approved operator policy decisions: required_fields
- obvious operability regressions introduced by the decisions: required_fields
- preservation of the existing domain boundary: required_fields

## Deferred / Out Of Scope

- database schema and indexes
- API endpoints, transports, and event schemas
- programming language, framework, authentication provider, hosting, and deployment
- complete basketball statistics vocabulary
- UI layout and editorial translation workflow
- divisions, conferences, inter-league competition, and cross-league Player identity
- exhaustive error-code registry and operational runbooks
- Phase 2 convergence declaration
- mutation of original Courtside source specifications

## Expansion Rules

- Defer any request that prescribes schema, API, framework, vendor, deployment, or UI choices.
- Do not reopen operator-approved product policies unless they are internally contradictory or impossible to implement.
- Allow reviewer pressure on structural completeness, deterministic identity, idempotency, legal transitions, authorization boundaries, and obvious safe failure behavior.
- Require operator review before adding any domain concept, lifecycle state, role, ranking criterion, playoff policy, or authority beyond the approved candidate.

## Good Enough

The follow-up is good enough when all balanced_mvp Phase 1 profiles verify the same candidate without blocker or major findings, no approved product decision is silently changed, and Whetstone reports PHASE_1_STABLE.

