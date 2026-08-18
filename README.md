# Courtside

Courtside is a seed-stage project in the Cortext ecosystem. Its core domain and initial technology stack are accepted; its public interfaces will grow from executable vertical slices.

## Source of Truth

- [`specs/overview.md`](specs/overview.md) records the component's current scope and non-goals.
- [`specs/lifecycle.md`](specs/lifecycle.md) defines domain state transitions and authority timing.
- [`specs/invariants.md`](specs/invariants.md) defines rules every implementation must preserve.
- [`specs/config.md`](specs/config.md) defines configurable policy and normative defaults.
- [`specs/tech-stack.md`](specs/tech-stack.md) declares the accepted implementation platform and its safety boundaries.
- [`specs/architecture.md`](specs/architecture.md) defines dependency direction and the first transactional vertical slice.
- [`specs/authentication.md`](specs/authentication.md) defines registration, login, recovery, session verification, account provisioning, authorization delivery, and bootstrap boundaries.
- [`specs/public-portal.md`](specs/public-portal.md) defines the unauthenticated schedule, results, standings, and public-data boundary.
- [`specs/member-statistics.md`](specs/member-statistics.md) defines authenticated League-wide Player statistics and the points-first aggregation boundary.
- [`specs/rosters.md`](specs/rosters.md) defines durable Player identity and historical Season roster participation.
- [`specs/role-administration.md`](specs/role-administration.md) defines post-bootstrap League Administrator and Team Captain assignment workflows.
- [`specs/season-deletion.md`](specs/season-deletion.md) defines the protected removal of an unused Season created in error.
- [`specs/repo-standard.md`](specs/repo-standard.md) defines how this repository grows as its boundaries become real.
- `README.md` is orientation, not normative design.

## Repository Shape

The project has accepted domain and technology foundations. Implementation, contract, operational, and test structure is added only as a working vertical slice requires it.

## Verify

Run the complete local static and unit verification gate:

```sh
npm ci
npm run verify
```

PostgreSQL integration setup and test commands are documented in [`docs/development.md`](docs/development.md).

## Local Demo

The current end-to-end workflow provides a bilingual public schedule, results, and standings portal plus registration, email/password sign-in and recovery, private Player access requests, authenticated League-wide Player statistics and box scores, and protected League Administrator desks for timezone-safe Game operations, authoritative results, live standings, durable Players, and audited roster history. Start the local Supabase stack, reset its disposable fixtures, and run the web application using [`docs/development.md`](docs/development.md).
