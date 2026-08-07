# Courtside Technology Stack Declaration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-07

## Purpose and Authority

This declaration defines the initial implementation platform and the boundaries that keep Courtside's domain behavior portable, testable, and safe to operate. It is normative for implementation choices but does not override the core domain specifications. If a platform convenience conflicts with a domain invariant, lifecycle rule, or authorization boundary, the domain specification prevails and this declaration must be amended.

## Declared Stack

| Concern | Declaration |
| --- | --- |
| Application language | TypeScript with strict type checking |
| Application runtime | A supported Node.js Active LTS release, pinned when the application scaffold is created |
| Package management | `npm` with a committed lockfile |
| Web framework | Next.js App Router |
| Application hosting | Vercel |
| Relational database | Supabase-managed PostgreSQL |
| Authentication provider | Supabase Auth, used for login identity rather than domain authorization |
| Media object storage | Supabase Storage |
| Localization | `next-intl` with English and French locale routes and translation dictionaries |
| Database lifecycle | Version-controlled SQL migrations managed through the Supabase CLI |
| Unit and domain testing | Vitest |
| Browser testing | Playwright |
| Database integration testing | A local Supabase/PostgreSQL stack rebuilt from committed migrations |

React is supplied through the supported Next.js release rather than versioned independently. Exact dependency versions are recorded by the application manifest and lockfile when implementation begins. Production dependencies must use supported stable releases and must not use unbounded version ranges.

## Application Shape

Courtside is a modular monolith with a stateless application runtime. Durable domain state lives in PostgreSQL, while media bytes live in object storage and are referenced by persistent database metadata. The initial deployment has one web application and one relational database; it does not introduce microservices, queues, event buses, or additional databases.

Core domain logic must remain independent of Next.js, Vercel, Supabase, HTTP, authentication tokens, and storage APIs. Application services coordinate use cases and authoritative mutations. Adapters own PostgreSQL, Supabase Auth, Supabase Storage, filesystem, spreadsheet, and network coupling. Next.js route handlers, Server Actions, and Server Components are delivery mechanisms and must not become competing locations for domain rules.

The initial application is server-mediated. Browser code may participate in Supabase Auth session handling and controlled media upload flows, but it must not receive a service credential or write directly to authoritative domain tables. A later proposal may allow narrowly scoped direct client access only when Row Level Security, audit behavior, and lifecycle equivalence are demonstrated by integration tests.

## Database Access and Transactions

PostgreSQL is the authoritative relational store. Database constraints enforce structural integrity and invariants that must survive every write path. Row Level Security is defense in depth, not the sole expression of domain authorization. Application services remain responsible for scoped authority, legal state transitions, audit requirements, and deterministic conflict handling.

Every authoritative mutation that changes related domain records, projections, configuration versions, or audit history must commit or roll back as one database transaction. Multi-step authoritative writes must not be implemented as unrelated Supabase Data API calls. Before the first write-capable vertical slice, the implementation must record one transaction-capable server-side query strategy; it may use parameterized PostgreSQL access or narrow transactional database functions, but it must not duplicate domain policy across both approaches.

Schema, constraints, functions, grants, and Row Level Security policies are changed through reviewed migrations committed to the repository. Production Dashboard or ad hoc SQL changes are prohibited during ordinary operation. An emergency database change must be captured immediately as a migration and reviewed for schema drift.

## Authentication and Authorization

Supabase Auth proves User Account identity and manages sessions and account recovery. It does not collapse User Account into Player and does not define a global `player` role.

League Administrator assignments, Season Team Captain assignments, and approved Player Management Relationships are persistent Courtside domain records. Authorization is evaluated from those current scoped records. Approved Player managers may update only the linked Player fields granted by the domain specifications. Team Captain assignments are scoped domain authority markers and grant no independent core mutation authority in Phase 1 unless a later accepted specification grants it. Service credentials and administrative database access must never be exposed to browser code.

The initial League Administrator bootstrap and the login methods offered to users must be specified before authentication is released. Neither choice may weaken the post-bootstrap administrator invariants.

## Localization

English and French use explicit locale routes and UI translation dictionaries managed through `next-intl`. Authored-content translations remain database content rather than UI dictionary entries. Proper names remain language-neutral.

Locale selection follows the domain configuration: a supported saved User Account preference, then the League default. Browser language detection must not override that precedence. Missing authored content falls back to the League default. Locale formatting uses the League timezone for dates and times unless a later accepted specification changes that behavior.

## Rendering and Cache Correctness

Next.js may server-render, prerender, or cache public pages when doing so preserves observable correctness. Standings, schedules, Game pages, Player records, and playoff projections are not assumed to be immutable static content.

Every accepted mutation identifies and invalidates its affected cached projections. Administrative confirmation must not report success while the application intentionally continues serving a known superseded authoritative result. A projection without a dependable invalidation path must use dynamic or uncached rendering until one exists.

## Statistical Import Boundary

The initial spreadsheet workflow is a controlled import pipeline rather than arbitrary SQL generation. It must:

1. preserve the original source file or a stable content hash;
2. parse rows into staging records without mutating authoritative data;
3. validate Game, Player, Roster Membership, statistic vocabulary, known-versus-unknown values, and duplicate identities;
4. produce a dry-run summary with row-level errors and the proposed changes;
5. apply an approved batch transactionally through the same authoritative mutation rules used by the application; and
6. persist batch identity, actor, importer version, source identity, outcome, and required audit records so retries are idempotent.

AI may assist with source-column mapping or error explanation. AI-generated SQL must not be executed directly against production domain tables.

## Media Boundary

Supabase Storage is the initial object store for Player profile photos and reusable photo Media associated with Games or the League Gallery. The database owns Media identity, associations, ownership metadata, publication state, and audit references. Upload flows enforce authenticated authority, generated object keys, supported MIME types, file-size limits, and image validation. Public delivery and upload authority must be separate concerns.

Database backup does not by itself protect stored media objects. Before production media is accepted, Courtside must define object retention, deletion behavior, export or replication, and restoration procedure. Cloudinary is not adopted initially and requires a later decision justified by concrete transformation or delivery needs.

## Environments, Deployment, and Recovery

Local development, preview or staging, and production use isolated durable data. Vercel preview deployments must not receive credentials that permit writes to the production Supabase project. Database migrations are verified from an empty local database before deployment and are applied through a controlled deployment step.

Vercel server-side compute must run in a region appropriate for the Supabase database. Runtime database access must use the connection mode appropriate to serverless execution and must not create an unbounded connection pool.

Before production launch, the project must declare its acceptable recovery point and recovery time, choose a Supabase plan or off-platform export schedule that meets them, cover both PostgreSQL and Storage objects, and complete a restore exercise. Managed backups are not treated as verified recovery until restoration has been tested.

## Verification Baseline

The first production-capable implementation must include:

- unit and property-oriented tests for standings, playoff aggregation, lifecycle rules, configuration freezing, and known-versus-unknown statistics;
- PostgreSQL integration tests for constraints, scoped authorization, Row Level Security, transactions, audit persistence, and import idempotency;
- migration replay from an empty local Supabase database;
- Playwright coverage for login, authorized profile-photo changes, core League Administrator flows, and at least one English/French route and fallback path; and
- a production build and type check in continuous integration.

Asynchronous Server Components are verified through integration or browser tests when the unit-test environment cannot execute them faithfully.

## Explicit Non-selections

The initial stack does not adopt microservices, message queues, event buses, GraphQL, Supabase Realtime, Edge Runtime database mutations, Cloudinary, a second database, direct browser domain writes, or direct AI-generated production SQL. These are not forbidden forever; each requires a concrete need and an accepted amendment.

The styling system, component library, transaction-capable query layer, external observability provider, analytics provider, email delivery provider, detailed statistics vocabulary, and final backup retention are intentionally deferred. Each must be decided before the first feature that depends on it, and none may change the architecture or domain boundaries implicitly.

## Ratification

This declaration was accepted on 2026-08-07 after the contained Whetstone consistency audit preserved the domain boundary and a corrective re-audit reported zero findings. Acceptance authorizes the application scaffold and implementation planning but does not itself define database tables, API contracts, or UI design.
