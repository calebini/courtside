# ADR 0001: Ratify the Courtside Core Domain

- Status: proposed
- Spec version: 0.1.0
- Date: 2026-08-04

## Context

Courtside needs a stable conceptual boundary before schema, API, framework, or deployment decisions. Without explicit domain authority, implementations are likely to collapse User Account and Player identity, lose roster history, treat playoff Games as a separate type, make standings depend on incomplete statistics, or encode one League policy as inflexible implementation rules.

## Decision

Adopt the domain defined by overview, lifecycle, invariants, and configuration. The ratified direction is that Season is the competition container while Team and Player identities persist across Seasons; Season Team and Roster Membership preserve Season participation and transfers historically; User Account and Player remain separate and connected through many-to-many approved management relationships; League Administrator authority persists across Seasons; Team Captain authority is scoped to one Season Team; Games use `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit`; tied authoritative outcomes are prohibited; League Administrators may correct authoritative outcomes with append-only audit and mandatory reason; Player-stat values distinguish unknown from known zero and may be partial and independently provisional or confirmed; standings derive from authoritative regular-season results under customizable versioned configuration; playoffs use fixed aggregate-points brackets with configurable aggregate-tiebreak defaulting to overtime in the final configured Game; result-affecting Season configuration freezes at first final or forfeited Game and changes only by versioned audited League Administrator amendment; the League owns timezone, reusable Venues, English/French language configuration, default language, localizable UI and authored content, and reusable Media identity; and material administrative changes use the minimum audit fields defined in configuration.

## Consequences

Schema and API work must preserve participation history instead of placing a mutable team reference directly on Player. Derived standings and playoff advancement require reproducible configuration versions and audit-aware recomputation. Statistics representations must preserve missingness and verification separately. Playoff Matchups cannot use conventional games-won best-of logic. Interfaces and contracts may be designed later without reopening these concepts unless new requirements create a genuine domain conflict. No implementation, contract, or public protocol directories are created by this decision alone.

## Ratification

This ADR remains `proposed` while the specification bundle is drafted and reviewed. It becomes `accepted` only after the bundle contains no unresolved major or minor contained-audit findings and the user approves the audited result. Acceptance does not constitute Whetstone Phase 1 stability or Phase 2 convergence.
