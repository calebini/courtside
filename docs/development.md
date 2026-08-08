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

The browser test finalizes one fixture Game, so reset the local database afterward when you want the original demo state again.

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

The authenticated administrator slice adds `/en/sign-in`, `/fr/sign-in`, and the protected `/{locale}/admin` league desk. Resetting the local database loads a disposable fixture:

```text
Email: admin@courtside.local
Password: courtside-local-admin
```

These credentials exist only in the project-local Supabase seed and must never be reused in a deployed environment. Public sign-up is disabled.

## First Slice

The first slice is implemented by:

- `src/courtside/core` for configuration identity, Game finalization rules, and standings;
- `src/courtside/services/finalize-game.ts` for authorization, freeze, audit, idempotency, and orchestration;
- `src/courtside/adapters/postgres` for the concrete transaction;
- `supabase/migrations/20260807190000_initial_game_result_slice.sql` for persistence invariants; and
- `tests/unit` and `tests/integration` for executable expectations.

The application service starts from an existing `in_progress` Game. The second slice supplies verified login delivery and a League Administrator interface for that use case. Game start, the production bootstrap command, persisted random draws, corrections, forfeits, and the remaining domain surfaces are later slices.
