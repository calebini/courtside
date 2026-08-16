# Decision 0014: Deliver Pre-Freeze Season Configuration

- Status: accepted
- Date: 2026-08-16

## Context

Season creation installs accepted defaults, but the deployed administrator cannot review or change standings points and ranking priority before the first authoritative result freezes configuration. A broad editor would prematurely expose playoff and amendment semantics that are not yet implemented.

## Decision

Deliver a structured pre-freeze editor limited to win/loss League Points and ordering of the three supported score-based criteria, with mandatory final `random_draw`. Preserve every non-edited configuration field, audit accepted changes, make commands idempotent, and reject ordinary editing after freeze in both the service and PostgreSQL.

Keep playoff configuration visible but read-only. Defer the playoff builder and post-freeze versioned amendment workflow to separate slices.

## Consequences

- Administrators can ratify regular-season rules before recording authoritative results.
- The browser cannot submit arbitrary configuration JSON or silently change eligibility and playoff rules.
- Configuration freeze becomes visible and independently protected below the application service.
- Playoff setup and post-freeze amendments remain explicit future work rather than implicit behavior.
