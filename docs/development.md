# Courtside Development

## Prerequisites

- Node.js `24.18.0`, matching `.nvmrc`
- npm, using the committed lockfile
- Docker Desktop or another Docker-compatible runtime for local Supabase and PostgreSQL integration tests

## Install and Verify

```sh
npm ci
cp .env.example .env.local
npm run verify
```

The committed example contains only project-local connection details and Supabase's public browser key. Deployed environments must supply their own database connection and public project key; server credentials must never use a `NEXT_PUBLIC_` variable.

`npm run verify` checks repository invariants, lint, TypeScript, unit tests, and the production Next.js build. Integration tests are separate because they require PostgreSQL.

## Local PostgreSQL

The project-scoped Supabase CLI is installed as a development dependency. Start the local stack and replay all migrations:

```sh
npm run db:start
npm run db:reset
```

The authenticated administrator slice enables the local API gateway and Supabase Auth. Storage, Realtime, Studio, and analytics remain disabled. The first startup downloads the required images and can take several minutes without much terminal output.

Run the transactional integration suite against the local database:

```sh
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:integration
```

Run the authenticated browser slice against a freshly reset local stack:

```sh
npx playwright install chromium
npm run db:reset
npm run test:e2e
```

The browser tests exercise the complete Game lifecycle plus Player creation, display-name replacement, roster addition, transfer, ending, audit history, and English/French delivery. Reset the local database afterward when you want the original demo state again.

Stop the local stack when finished:

```sh
npm run db:stop
```

Never use a production connection string for integration tests. The suite truncates its database between cases.

## Application

Start the Next.js development server:

```sh
npm run dev
```

The localized public portal is available at `/en` and `/fr`, with schedule, results, and standings at `/{locale}/schedule`, `/{locale}/results`, and `/{locale}/standings`. These routes require no login and render fresh authoritative data in the League timezone.

The authenticated administrator slices add `/en/sign-in`, `/fr/sign-in`, the protected `/{locale}/admin` league desk, and the Player and Roster desk at `/{locale}/admin/rosters`. Resetting the local database loads a disposable fixture:

```text
Email: admin@courtside.local
Password: courtside-local-admin
```

These credentials exist only in the project-local Supabase seed and must never be reused in a deployed environment. Public sign-up is disabled.

## Implemented Slices

The first slice is implemented by:

- `src/courtside/core` for configuration identity, Game finalization rules, and standings;
- `src/courtside/services/finalize-game.ts` for authorization, freeze, audit, idempotency, and orchestration;
- `src/courtside/adapters/postgres` for the concrete transaction;
- `supabase/migrations/20260807190000_initial_game_result_slice.sql` for persistence invariants; and
- `tests/unit` and `tests/integration` for executable expectations.

The second slice supplies verified login delivery and a protected League Administrator interface. The third slice adds reusable Venue reads plus scheduling, rescheduling, postponement, cancellation, and Game start. League-local wall-clock input is resolved through the Temporal adapter and rejects ambiguous or nonexistent daylight-saving times.

The fourth slice unifies finalization, explicit-score forfeiture, and terminal-status-preserving result correction in one authoritative transaction. It records the competition eligibility anchor, requires a reason for correction, preserves prior values in append-only audit history, and recomputes standings immediately.

The fifth slice adds the unauthenticated bilingual public portal. A dedicated PostgreSQL read adapter exposes only allowlisted League competition data and reuses the standings engine; User Accounts, audit actors, correction reasons, and administrative configuration remain private.

The sixth slice adds durable Players and non-overlapping, half-open Roster Membership intervals. League Administrators can create and rename Players, add and end memberships, and atomically transfer a Player within a Season while PostgreSQL and append-only audit preserve history.

The production bootstrap command, Venue administration, persisted random draws, playoff correction conflicts, Player Management Relationships, member profile photos, and the remaining domain surfaces are later slices.
