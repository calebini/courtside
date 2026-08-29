# Courtside

Courtside is a bilingual web application for operating a recreational basketball league. It
provides public schedules, results, and standings; authenticated Player statistics and profiles;
and a protected administration area for the people who run the league.

[Staging site](https://courtside-cyan.vercel.app/en) ·
[French interface](https://courtside-cyan.vercel.app/fr) ·
[Development guide](docs/development.md) ·
[Domain specifications](specs/overview.md)

> Courtside is under active development. The linked deployment is a staging environment, not a
> production service.

## Features

### Public league information

- English and French interfaces
- Season schedule with game status, venue, and league-local time
- Official results, including forfeits
- Standings derived from authoritative game results

### Member experience

- Email registration, confirmation, sign-in, and password recovery
- Account-requested access to existing Player profiles
- League Administrator approval and revocation of Player access
- Private Player display-name and profile-photo management
- League-wide scoring leaderboard for admitted members
- Season Player directory, individual game logs, and completed-game box scores
- Explicit distinction between unknown statistics, known zero, provisional values, and confirmed
  values

### League administration

- Season setup and League-wide administration
- Configurable standings points and ranking criteria before the first authoritative result
- Durable Team identities and Season participation
- Reusable Venue creation, correction, and archival
- Game scheduling, rescheduling, postponement, cancellation, and start
- Final scores, forfeits, and audited result corrections
- Immediate standings recomputation after authoritative results
- Durable Player identities and historical roster membership
- Roster additions, endings, and transfers without rewriting history
- Batch Player-points entry with provisional or confirmed verification
- League Administrator and Season Team Captain assignments
- Protection against revoking the final active League Administrator
- Dependency-safe deletion of unused Seasons created in error
- Append-only audit history for material administrative changes

## Roles

Courtside keeps authentication identity separate from basketball participation:

- A **User Account** is a login identity.
- A **Player** is a durable league participant and can exist without an account.
- An approved **Player Management Relationship** lets an account manage a Player profile.
- A **League Administrator** operates the League across Seasons.
- A **Team Captain** is assigned to one Season Team. Its current authority is deliberately limited.

An account does not become a Player merely by registering, and registration alone grants no league
authority.

## Domain rules

The implementation preserves several rules that are easy to lose in a simpler league application:

- Team and Player identities persist across Seasons.
- Roster transfers preserve historical team attribution.
- Playoff games use the same Game model as regular-season games.
- Standings depend on official results, never on the completeness of Player statistics.
- Official Team scores remain independent of summed Player points.
- Tied authoritative game results are prohibited.
- Result-affecting Season rules freeze when the first authoritative result is accepted.
- Player statistics preserve missingness: “not recorded” is different from zero.

The complete, normative rules live in [`specs/`](specs/). This README is orientation only.

## Technology

| Area | Choice |
| --- | --- |
| Application | TypeScript, React, Next.js App Router |
| Hosting | Vercel |
| Database | Supabase-managed PostgreSQL |
| Authentication | Supabase Auth |
| Photo storage | Private Supabase Storage |
| Localization | `next-intl` |
| Date and time handling | Temporal polyfill with League IANA timezone rules |
| Unit tests | Vitest |
| Browser tests | Playwright |
| Database lifecycle | Version-controlled Supabase SQL migrations |

Courtside is a modular monolith. Pure domain rules live in `core`, use-case orchestration lives in
`services`, and PostgreSQL, Supabase, Temporal, image-processing, and framework coupling live in
`adapters`.

```text
Browser
  └─ Next.js pages and Server Actions
       └─ Application services
            ├─ Core domain rules
            └─ Adapters
                 ├─ PostgreSQL
                 ├─ Supabase Auth and Storage
                 ├─ Temporal
                 └─ Sharp image processing
```

Authoritative mutations are server-mediated and transactional. Browser sessions never receive a
database credential or Storage secret.

## Local development

### Prerequisites

- Node.js `24.18.0` (see [`.nvmrc`](.nvmrc))
- npm
- Docker Desktop or a compatible Docker runtime

### Setup

```bash
git clone https://github.com/calebini/courtside.git
cd courtside
npm ci
cp .env.example .env.local
npm run db:start
```

After Supabase starts, obtain the local server credential:

```bash
npx supabase status -o env
```

Copy the reported `SERVICE_ROLE_KEY` value into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then
rebuild the disposable local database and start the application:

```bash
npm run db:reset
npm run dev
```

Open [http://127.0.0.1:3000/en](http://127.0.0.1:3000/en) or
[http://127.0.0.1:3000/fr](http://127.0.0.1:3000/fr).

The local seed provides disposable accounts:

| Access | Email | Password |
| --- | --- | --- |
| League Administrator | `admin@courtside.local` | `courtside-local-admin` |
| Member | `member@courtside.local` | `courtside-local-member` |

These credentials work only with the local Supabase stack and must never be reused in a deployed
environment. Confirmation and recovery emails are available through local Inbucket at
[http://127.0.0.1:54324](http://127.0.0.1:54324).

See [`docs/development.md`](docs/development.md) for environment details and the complete local
workflow.

## Verification

Run repository checks, lint, TypeScript, unit tests, and the production build:

```bash
npm run verify
```

Run PostgreSQL integration tests against the disposable local database:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  npm run test:integration
```

Run the browser suite:

```bash
npx playwright install chromium
npm run db:reset
npm run test:e2e
```

The browser suite mutates the seeded local League. Run `npm run db:reset` afterward to restore the
original demo state.

## Repository structure

```text
messages/                    English and French UI dictionaries
specs/                       Normative domain and delivery specifications
specs/decisions/             Architecture and delivery decisions
docs/                        Development and operational guidance
src/app/                     Next.js routes and delivery components
src/courtside/core/          Framework-independent domain rules
src/courtside/services/      Use-case orchestration and ports
src/courtside/adapters/      PostgreSQL, Supabase, Temporal, and image adapters
supabase/migrations/         Ordered database migrations
supabase/seed.sql            Disposable local demonstration data
tests/unit/                  Fast domain and service tests
tests/integration/           PostgreSQL transaction and persistence tests
tests/e2e/                   Authenticated browser workflows
scripts/                     Repository and staging bootstrap tools
```

## Specifications

Stable design intent belongs in `specs/`, not in implementation comments or this README. Useful
starting points are:

- [`specs/overview.md`](specs/overview.md) — domain concepts and scope
- [`specs/invariants.md`](specs/invariants.md) — rules every implementation must preserve
- [`specs/lifecycle.md`](specs/lifecycle.md) — game, roster, statistics, and configuration lifecycle
- [`specs/config.md`](specs/config.md) — configurable league and competition policy
- [`specs/architecture.md`](specs/architecture.md) — application boundaries and dependency direction
- [`specs/authentication.md`](specs/authentication.md) — accounts, authorization, and recovery
- [`specs/public-portal.md`](specs/public-portal.md) — unauthenticated information boundary
- [`specs/member-statistics.md`](specs/member-statistics.md) — authenticated Player-stat visibility
- [`specs/statkeeper.md`](specs/statkeeper.md) — proposed video-linked event capture and stat projection
- [`specs/statkeeper-initial-delivery.md`](specs/statkeeper-initial-delivery.md) — proposed implementable Statkeeper vertical slice

Accepted implementation decisions are recorded in [`specs/decisions/`](specs/decisions/).

## Deployment status

The current Vercel deployment and Supabase project are staging resources. A production release
still requires separate durable environments, production email delivery, registration-abuse
controls, recovery exercises, and production authorization for the initial administrator bootstrap.

Operational bootstrap guidance is documented in [`docs/operations.md`](docs/operations.md).
