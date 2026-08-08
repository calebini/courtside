# ADR 0007: Deliver the Public League Portal

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-08

## Context

Courtside has an authenticated League Admin desk and authoritative Game, result, audit, and standings behavior, but no audience-facing surface. Schedule, result, and standings reads can now be delivered without adding mutation authority or exposing administrative records.

## Decision

Add localized, unauthenticated schedule, results, and standings routes in the existing Next.js application. Use one PostgreSQL public read adapter and the existing pure standings engine. Render database-backed Server Components dynamically on each request so accepted administrative mutations are immediately observable without introducing cache invalidation policy in this slice.

Expose only the allowlisted fields in `specs/public-portal.md`. Do not grant browser table access, create a public API, expose audit history or account data, or introduce League slugs and current-Season semantics before those concepts are specified.

## Consequences

Courtside now has a useful public product surface while retaining one modular monolith and one source of authoritative data. Players and Rosters remain the next domain buildout; member-managed profiles and public Player visibility remain later privacy-dependent slices.
