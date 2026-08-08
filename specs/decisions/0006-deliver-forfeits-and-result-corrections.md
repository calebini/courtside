# ADR 0006: Deliver Forfeits and Result Corrections

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-08

## Context

Courtside can schedule, start, and finalize regular-season Games, but its implemented lifecycle cannot yet represent a forfeit or correct an authoritative result. Both operations affect frozen Season configuration, standings, audit history, and future competition eligibility attribution, so they must share the existing transactional result boundary.

## Decision

Unify finalization, forfeiture, and authoritative result correction in one application-service transaction. A forfeit is accepted only from `scheduled`, `postponed`, or `in_progress` with an explicit official non-tied score and a declared winner consistent with that score. A correction is accepted only for `final` or `forfeit`, preserves that status, requires a non-blank reason, and records the complete prior and replacement result in append-only audit history.

Every accepted operation is idempotent, rechecks current League Administrator authority, locks the Game and Season, freezes or reuses the applicable result configuration, recomputes standings, and commits its command receipt and Audit Record atomically. Record a stable competition eligibility anchor at Game start or, for a pre-start forfeit, at the official forfeit decision instant.

## Consequences

The League Admin desk exposes completed regular-season Games, result history, forfeiture, and correction. Playoff participant-conflict resolution remains deferred until playoff projections exist; this slice does not accept playoff-specific destructive propagation or invent a placeholder conflict model.
