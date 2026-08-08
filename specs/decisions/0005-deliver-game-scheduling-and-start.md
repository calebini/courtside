# ADR 0005: Deliver Game Scheduling and Start

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-07

## Context

Courtside can authenticate a League Administrator and finalize an existing `in_progress` Game, but creating that state still requires database fixtures. The accepted lifecycle requires timezone-safe schedule entry, explicit pre-result transitions, League-owned reusable Venues, scheduling history, current scoped authorization, and rejection without mutation.

## Decision

Add one server-mediated regular-season Game operations slice covering initial scheduling, rescheduling while `scheduled`, explicit `postponed` to `scheduled` rescheduling, postponement, cancellation, and start. Store scheduled instants as `timestamptz`, reusable Venue identity separately from Game-specific instructions, and every accepted operation in append-only Audit Records and idempotent command receipts.

Use `@js-temporal/polyfill` only in a timezone adapter to interpret a League-local wall-clock value. Resolve with `disambiguation: reject`, so daylight-saving gaps and overlaps fail before authoritative mutation. Core Game lifecycle logic remains independent of this library, PostgreSQL, Supabase, and Next.js.

## Consequences

The League Admin desk can carry a regular-season Game from `scheduled` through `in_progress` into the existing finalization workflow. The browser supplies requested entity references and changes but not actor identity or authority. Venue creation and editing remain deferred; the slice can select an existing League Venue or no Venue.
