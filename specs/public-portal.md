# Courtside Public Portal

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-08

## Purpose

The public portal provides read-only League information without requiring a User Account. It is a delivery surface over authoritative Courtside records and derived projections, not a separate source of truth.

## Public Information

Every League and Season in the current product phase is public by default. Public pages may expose League and Season names, League timezone, neutral Team names, Game schedule and lifecycle status, competition phase, Venue name and address, Game-specific venue instructions, authoritative final or forfeit scores, and derived standings.

Schedule dates and times render in the selected English or French interface language and the League configured timezone. A postponed or cancelled Game remains visible with its current status. An `in_progress` Game is identified as in progress, but Courtside does not invent or expose a live score before an authoritative result exists.

Results expose only `final` and `forfeit` Games with their current authoritative scores. Corrections appear as the corrected current result. The public portal does not expose prior result values, correction reasons, Audit Records, actors, User Accounts, assignments, command receipts, configuration internals, or rejection reports.

Standings are the same deterministic projections used by administrative surfaces. They use authoritative eligible regular-season results and identify unresolved final tiebreak contexts as provisional rather than inventing a rank.

## Routes and Freshness

English and French routes provide a public home, schedule, results, and standings. The initial route shape is `/{locale}`, `/{locale}/schedule`, `/{locale}/results`, and `/{locale}/standings`. It displays all public Leagues and their Seasons because League slugging and an explicit current-Season lifecycle are not yet accepted domain concepts.

The initial implementation renders fresh database-backed Server Components on each request. Browser code receives rendered public values but no database credential or direct domain-table access. A later cache may be introduced only with explicit invalidation that preserves observable freshness after accepted Game mutations.

## Deferred Privacy Surface

Public Player profiles, profile photos, Player Stat Lines, Media, and member identity are not part of this slice. Their publication requires an accepted privacy and visibility policy before delivery. Private Leagues or Seasons, tenant hostnames, League slugs, and custom public branding are also deferred.
