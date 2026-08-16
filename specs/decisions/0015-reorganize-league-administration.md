# Decision 0015: Reorganize League Administration Around Recurring Work

- Status: accepted
- Date: 2026-08-16

## Context

The League Desk accumulated controls in slice-delivery order. One page rendered League setup, Season setup, Game operations, standings, and complete history together, making recurring tasks harder to find and causing the page to grow with every completed Game.

## Decision

Adopt the administrator information architecture in `specs/admin-information-architecture.md`. Use one shared authenticated shell and active-Season context. Make League Desk a bounded state-driven overview, place the complete recurring Game workflow under Games, retain visible People and access destinations, and move infrequent League and Season controls under League Setup.

This is a delivery-layer refactor. Existing core, services, PostgreSQL adapters, mutation authority, audit, and lifecycle rules do not move into route components and are not duplicated.

## Consequences

- Common work is promoted according to authoritative state rather than entity implementation order.
- Setup controls remain available without dominating daily operations.
- Completed history no longer grows unbounded on the default Desk.
- Existing actions must redirect to their owning route while retaining active-Season context.
- The first implementation may reuse the broad administrator read model; route-specific read optimization remains a later concern.
