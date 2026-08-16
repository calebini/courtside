# Courtside Initial Architecture

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification translates the accepted domain and technology declarations into the initial modular-monolith boundaries. It owns implementation dependency direction and the first executable vertical slice; it does not define a public API.

## Dependency Direction

`src/courtside/core` contains deterministic domain values and calculations. It may depend on the TypeScript and Node.js standard libraries but not on Next.js, React, Vercel, Supabase, PostgreSQL clients, environment variables, or network APIs.

`src/courtside/services` coordinates authorized use cases and transactions through explicit internal ports. It may depend on the core but not on concrete adapters or Next.js delivery code.

`src/courtside/adapters` implements service ports for PostgreSQL and later external systems. Adapters may depend on services and core. PostgreSQL constraints and triggers protect cross-path integrity but do not become an alternate location for orchestration policy.

`src/app` is the Next.js delivery surface. It may invoke application services but does not own domain rules. No write-capable HTTP endpoint is exposed before Supabase Auth session verification and scoped League Administrator authorization are integrated.

## Transaction Strategy

Authoritative server-side mutations use `node-postgres` with parameterized SQL and an explicitly checked-out client for the full transaction. Runtime connections use a bounded pool configured by the PostgreSQL adapter. Supabase Data API calls are not combined to approximate an authoritative transaction, and PostgreSQL RPC functions are not used as a parallel application-service layer in this slice.

The PostgreSQL adapter connects with a server-only credential. Browser code cannot import the adapter or receive its connection string. Supabase Row Level Security remains enabled with no direct browser domain-table write policies.

## First Vertical Slice

The first slice begins with an existing `in_progress` regular-season Game and an active League Administrator. It accepts one command to finalize that Game with a non-tied authoritative score. In one transaction it:

1. serializes duplicate command handling and reuses an existing receipt for an identical retry;
2. verifies current League Administrator authority;
3. locks the Game and Season records;
4. validates the `in_progress` to `final` transition and authoritative score;
5. creates or reuses the single frozen result-affecting Season configuration version;
6. rejects a configuration-basis conflict without mutation;
7. persists the final Game result and the configuration version used;
8. appends the Game-finalization Audit Record;
9. reads authoritative regular-season outcomes inside the transaction and recomputes standings through the pure domain engine; and
10. persists an idempotent command receipt before commit.

The returned standings projection identifies the frozen configuration version. If every configured numeric criterion remains tied and no persisted random-draw order is supplied, the engine exposes an unresolved stable tie context instead of inventing an order. Performing and auditing the random draw is a later slice; callers must not present an unresolved projection as final ranked standings.

## Persistence Boundary

The initial migration contains only records exercised by the slice: League, User Account, League Administrator Assignment, Season, Team, Season Team, frozen Season Configuration Version, Game, Audit Record, and Command Receipt. It includes participant, status, score, winner, configuration-version, append-only-history, and direct-browser-access protections.

Standings are calculated projections and are not stored as editable rows. This slice recomputes them from authoritative Games on demand. A future cache or persisted projection must remain disposable and identify its configuration version.

## Failure Semantics

Domain, lifecycle, authorization, and idempotency failures roll back the transaction. Rejections identify the entity, current state or condition, requested mutation, actor, violated rule, and that authoritative state was preserved. Infrastructure errors also roll back but remain operational failures rather than domain rejections.

## Deferred Surfaces

The second slice adds the authenticated delivery boundary defined in `specs/authentication.md`: verified Supabase sessions, User Account resolution, current scoped League Administrator checks, a server-mediated Game-finalization action, and a read-only standings projection. Disposable local fixtures make the path demonstrable without serving as production bootstrap.

The third slice adds League Administrator delivery for regular-season Game scheduling and pre-result lifecycle management. Application services own scheduling, rescheduling, postponement, cancellation, and start orchestration through PostgreSQL transaction ports. League-local wall-clock input is resolved by a timezone adapter with ambiguous and nonexistent times rejected. Reusable League-owned Venues are persisted separately from optional Game-specific venue instructions. Every accepted operation is idempotent, rechecks current authority, locks the affected scope, and appends its audit history in the same transaction.

The fourth slice unifies finalization, forfeiture, and correction under the authoritative Game-result transaction. It accepts explicit-score forfeits, preserves terminal status during corrections, requires correction reasons, records a competition eligibility anchor, appends prior and replacement result values, and recomputes standings atomically. The administrative read model exposes completed Games and their result audit history.

The fifth slice adds a public, read-only League portal for schedule, official results, and standings. One PostgreSQL adapter supplies an explicit public projection to fresh localized Server Components. It reuses the pure standings engine, exposes no administrative or identity records, and creates no browser database access or public mutation endpoint.

The sixth slice adds League-owned Player identity and time-effective Roster Membership history. A pure core models name and interval transitions; an application service owns current authorization, timezone resolution, idempotency, audit, addition, ending, and atomic same-Season transfer; PostgreSQL enforces same-League ownership, half-open non-overlap, and terminal closed history. A localized protected roster desk exposes the workflow without publishing Player records or granting member and Team Captain authority.

The implementation now includes a staging-only League Administrator bootstrap service and PostgreSQL adapter behind a guarded, plan-first operator command. It still defers production authorization for that command, playoff correction conflicts, configuration amendment, persisted random draw, playoffs, Player statistics, public Player profiles, media, spreadsheet import, public mutation APIs, and production deployment. Player Management Relationships, private member profile management, Account onboarding, and initial staging authority now extend the accepted boundaries through their dedicated specifications. Remaining surfaces must extend rather than bypass them.

Initial Season setup follows the same delivery shape: pure name validation and normative defaults in core, current scoped authorization and idempotent orchestration in a service, one PostgreSQL transaction for Season, Audit Record, and Command Receipt persistence, and a server-derived actor at the bilingual administrator boundary. It deliberately leaves Team participation and playoff Rounds empty rather than copying local fixture data into a real League.

Team setup extends that boundary with batch reconciliation of durable League Teams and Season Team participation. The service serializes changes through the affected Season or Season Team, reuses existing Team identity, audits each material creation or removal, and rejects removal when authoritative dependencies exist. PostgreSQL independently enforces Team-name and Season-participation uniqueness plus dependent-record referential integrity.

Venue administration extends the same boundary with durable League-owned Venue creation, audited correction, and terminal archival. Archived Venues remain available to existing Game read models but are excluded by the scheduling adapter from new or replacement schedules. PostgreSQL enforces normalized field bounds, immutable League ownership, and case-insensitive active-name uniqueness.

Pre-freeze Season configuration follows the same dependency direction. A pure core validates and merges only the accepted standings controls without dropping future configuration fields. The service owns current League Administrator authorization, Season locking, frozen-state and no-op rejection, full-value audit, and command idempotency. The PostgreSQL adapter performs the mutation transaction, and a database trigger independently prevents ordinary `result_configuration` changes once a frozen version is attached. The bilingual administrator surface becomes read-only at freeze and does not expose the deferred versioned-amendment workflow.
