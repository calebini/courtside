# ADR 0004: Deliver the Initial Authenticated Administrator Slice

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-07

## Context

The first domain slice deliberately exposed no write-capable delivery surface. Courtside now needs a visible end-to-end path without allowing browser claims, login-provider roles, or stale page state to substitute for current scoped domain authorization. The technology declaration also requires the offered login methods and first-administrator bootstrap boundary to be specified before authentication is released.

## Decision

Adopt `specs/authentication.md`. Use Supabase email-and-password Auth with public self-sign-up disabled. Verify the current Supabase identity on the server, map it to a Courtside User Account, and read League Administrator assignments from PostgreSQL for each authoritative request. Deliver Game finalization through a localized Next.js Server Action that derives the actor and command identity on the server.

Provide disposable local Auth and League fixtures for demonstration and integration work. Do not treat those fixtures as production bootstrap. Production authentication remains unreleased until the transactional, audited bootstrap command and operator runbook are implemented.

## Consequences

Supabase Auth and its API gateway become required local services for interactive development. Authoritative domain tables retain Row Level Security and no browser grants. The admin page may show current scoped League data and calculated standings, but it cannot move policy out of the application services or PostgreSQL transaction boundary.
