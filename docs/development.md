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

The committed example contains only project-local connection details, Supabase's public browser key, the local site URL, and open local registration mode. Deployed environments must supply their own database connection, public project key, canonical site URL, and explicit registration mode; server credentials must never use a `NEXT_PUBLIC_` variable.

`npm run verify` checks repository invariants, lint, TypeScript, unit tests, and the production Next.js build. Integration tests are separate because they require PostgreSQL.

## Local PostgreSQL

The project-scoped Supabase CLI is installed as a development dependency. Start the local stack and replay all migrations:

```sh
npm run db:start
npm run db:reset
```

The authenticated slices enable the local API gateway, Supabase Auth, private profile-photo Storage, and Inbucket email testing. The first startup downloads the required images and can take several minutes without much terminal output.

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

The authenticated slices add localized registration, sign-in, password recovery, the protected `/{locale}/players` portal, the `/{locale}/admin` league desk, and the Player and Roster desk at `/{locale}/admin/rosters`. Registration confirmation and password-recovery messages are visible in local Inbucket at `http://127.0.0.1:54324`. Resetting the local database loads disposable fixtures:

```text
Email: admin@courtside.local
Password: courtside-local-admin
```

Member credentials are `member@courtside.local` / `courtside-local-member`. These credentials exist only in the project-local Supabase seed and must never be reused in a deployed environment. Local self-sign-up is open and requires confirmation through Inbucket; production needs an explicit registration mode, transactional email, and abuse controls.

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

The seventh slice adds Player Management Relationships, account-requested access with administrator batch review, private Player profile updates, and validated private photo Storage. The eighth slice adds open-or-closed registration configuration, confirmed-email Account provisioning, saved language preference, and non-enumerating password recovery.

The production bootstrap command, production email and abuse-control setup, Venue administration, persisted random draws, playoff correction conflicts, and the remaining domain surfaces are later slices.
