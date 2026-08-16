# Decision 0012: Deliver Team and Season Participation Setup

- Status: accepted
- Date: 2026-08-16

## Context

Authenticated Season creation now reaches an explicit empty-Team state. Scheduling and rosters require Season Team identities, while directly seeding them would confuse durable Team identity with one-Season participation and bypass audit and authorization.

## Decision

Deliver a reconciliation-style administrator action that accepts one Team name per line, reuses case-insensitively matching durable League Teams, creates missing Teams, and ensures each participates in the selected Season. Make the batch atomic, audited per material entity change, and idempotent by command identity.

Allow removal of only the Season participation while it has no roster, captain, Game, or other authoritative dependency. Preserve the durable Team for future use. Enforce case-insensitive Team-name uniqueness in PostgreSQL.

## Consequences

- Initial League entry is fast without sacrificing durable identity.
- Repeated or overlapping entry does not create duplicate Teams or participation.
- Historical and dependent competition data prevents unsafe removal.
- Roster entry becomes the next usable setup step once Teams participate.
