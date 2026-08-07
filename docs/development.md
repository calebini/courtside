# Courtside Development

## Prerequisites

- Node.js `24.18.0`, matching `.nvmrc`
- npm, using the committed lockfile
- Docker Desktop or another Docker-compatible runtime for local PostgreSQL integration tests

## Install and Verify

```sh
npm ci
npm run verify
```

`npm run verify` checks repository invariants, lint, TypeScript, unit tests, and the production Next.js build. Integration tests are separate because they require PostgreSQL.

## Local PostgreSQL

The project-scoped Supabase CLI is installed as a development dependency. Start the local stack and replay all migrations:

```sh
npm run db:start
npm run db:reset
```

The first slice disables local Auth, Storage, Realtime, Edge Runtime, Studio, and analytics services in `supabase/config.toml`; only PostgreSQL is required. As later slices exercise those services, enable them deliberately with their tests.

Run the transactional integration suite against the local database:

```sh
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:integration
```

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

The localized foundation page is available at `/en` and `/fr`. The first authoritative slice is intentionally service-only: it exposes no write-capable HTTP route until authentication and scoped authorization are integrated.

## First Slice

The first slice is implemented by:

- `src/courtside/core` for configuration identity, Game finalization rules, and standings;
- `src/courtside/services/finalize-game.ts` for authorization, freeze, audit, idempotency, and orchestration;
- `src/courtside/adapters/postgres` for the concrete transaction;
- `supabase/migrations/20260807190000_initial_game_result_slice.sql` for persistence invariants; and
- `tests/unit` and `tests/integration` for executable expectations.

The application service starts from an existing `in_progress` Game. Game start, public mutation delivery, persisted random draws, corrections, forfeits, and the remaining domain surfaces are later slices.
