# Decision 0017: Deliver Unused Season Deletion

- Status: accepted
- Date: 2026-08-17

## Context

League Administrators can create Seasons but cannot remove a setup mistake. General Season deletion
would risk erasing competition history, while requiring operator SQL for an empty accidental Season
bypasses the ordinary authorization and audit boundary.

## Decision

Deliver the workflow in `specs/season-deletion.md`. Permit hard deletion only for a Season with no
dependent domain records, require exact typed-name confirmation, preserve an append-only deletion
Audit Record, and perform no cascading cleanup. Release the deleted name for reuse.

## Consequences

- Accidental empty Seasons can be corrected through League Setup without database intervention.
- Any participating Team or historical competition dependency protects the Season from deletion.
- Used Seasons remain visible until a separately specified end or archive lifecycle is delivered.
- The operation is authorized, transactional, idempotent, auditable, and race-safe.
