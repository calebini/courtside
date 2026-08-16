# Decision 0011: Deliver Initial Season Setup

- Status: accepted
- Date: 2026-08-16

## Context

The first controlled bootstrap deliberately creates only the League and first League Administrator. The administrator desk can now recognize that valid empty League, but no authorized workflow creates its first Season. Reusing disposable seed data or inserting a Season manually would bypass authorization, audit, idempotency, and configuration-default guarantees.

## Decision

Deliver authenticated Season creation through a pure validation/default boundary, an application service, and a PostgreSQL transaction adapter. Install the normative standings defaults, leave playoff Rounds explicitly unconfigured rather than inventing League rules, and write the Season, Audit Record, and Command Receipt atomically.

Expose the action on the bilingual League desk. Show the installed defaults before submission and show an explicit empty-Team state afterward. Defer Team and Season Team setup to the next slice.

## Consequences

- The staging League can begin deliberate competition setup without manual SQL.
- A later rules editor extends the same configuration rather than replacing a hidden seed assumption.
- Once configuration freezes, normal changes require the accepted versioned and audited amendment lifecycle.
- Operational database access remains a recovery mechanism, not a way to bypass domain history.
