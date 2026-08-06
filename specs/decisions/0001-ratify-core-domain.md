# ADR 0001: Ratify the Courtside Core Domain

- Status: proposed
- Spec version: 0.1.0
- Date: 2026-08-04

## Context

Courtside needs a stable conceptual boundary before schema, API, framework, or deployment decisions. Without explicit domain authority, implementations are likely to collapse User Account and Player identity, lose roster history, treat playoff Games as a separate type, make standings depend on incomplete statistics, or encode one League's policies as inflexible implementation rules.

## Decision

Adopt the domain defined by:

- [`../overview.md`](../overview.md);
- [`../lifecycle.md`](../lifecycle.md);
- [`../invariants.md`](../invariants.md); and
- [`../config.md`](../config.md).

The ratified direction is:

1. Season is the competition container, while Team and Player identities persist across Seasons.
2. Season Team and Roster Membership represent Season-specific participation and preserve transfers historically.
3. User Account and Player remain separate, connected through many-to-many approved management relationships.
4. League Administrator authority persists across Seasons; Team Captain authority is scoped to one Season Team.
5. Games use `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit` lifecycle states; tied authoritative outcomes are prohibited.
6. League Administrators may correct authoritative outcomes with a simple append-only audit record and mandatory reason.
7. Player-stat values distinguish unknown from known zero; lines may be partial and independently provisional or confirmed.
8. Standings derive from authoritative regular-season results under a customizable, versioned engine whose default awards two points per win and ranks by League Points, point differential, points scored, then persisted random draw.
9. Playoffs use a fixed bracket with seeded initial slots, Round-configured multi-Game Matchups, aggregate-points advancement, and configurable aggregate-tiebreak policy defaulting to overtime in the final configured Game.
10. Result-affecting Season configuration freezes at the first final or forfeited Game and can change only by versioned, audited League Administrator amendment.
11. The League owns a timezone, simple reusable Venues, English/French language configuration, and a default language.
12. UI and authored content are localizable; saved user preference overrides the League default, and missing requested content falls back to that default.
13. Media identity is reusable across Game and League Gallery associations.
14. Material administrative changes use the minimum audit fields defined in `config.md`.

## Consequences

- Schema and API work must preserve participation history instead of placing a mutable team reference directly on Player.
- Derived standings and playoff advancement require reproducible configuration versions and audit-aware recomputation.
- Statistics representations must preserve missingness and verification separately.
- Playoff Matchups cannot use conventional games-won best-of logic.
- Interfaces and contracts may be designed later without reopening these concepts unless new requirements create a genuine domain conflict.
- No implementation, contract, or public protocol directories are created by this decision alone.

## Ratification

This ADR remains `proposed` while the specification bundle is drafted and reviewed. It becomes `accepted` only after the bundle contains no unresolved major or minor contained-audit findings and the user approves the audited result. Acceptance does not constitute Whetstone Phase 1 stability or Phase 2 convergence.
