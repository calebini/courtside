# Decision 0016: Deliver Post-Bootstrap Role Administration

- Status: accepted
- Date: 2026-08-16

## Context

Staging bootstrap can establish the first League Administrator, but the product cannot yet add a
second operator or maintain Season Team Captain markers. This leaves a League dependent on one
account despite the ratified role lifecycle.

## Decision

Deliver the workflow in `specs/role-administration.md`. Resolve targets by exact registered email,
allow several League Administrators while protecting the final active assignment, and allow one
active Team Captain per Season Team with atomic reassignment. Keep Team Captain authority unchanged
and place the infrequent controls under League Setup.

## Consequences

- Bootstrap is no longer the ordinary path for administrator changes.
- The database independently protects the final-administrator and single-active-captain rules.
- Role changes are transactional, idempotent, and audited.
- The target must register and confirm an Account before authority can be assigned.
- Team Captain permissions remain deferred; this slice must not infer them from the marker.
