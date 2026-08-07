# ADR 0002: Adopt the Initial Courtside Technology Stack

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-07

## Context

Courtside needs an implementation platform that can preserve relational history, authoritative transactions, derived standings, delayed statistics, scoped authorization, bilingual presentation, and simple operation by a small administrative team. A framework or managed service must not become a competing source of domain policy or create write paths that bypass lifecycle, audit, configuration-freeze, and idempotency rules.

## Decision

Adopt the platform and boundaries defined in `specs/tech-stack.md`: TypeScript on a pinned supported Node.js Active LTS release; Next.js App Router deployed to Vercel; Supabase-managed PostgreSQL, Auth, and Storage; `next-intl` for English and French localization; version-controlled Supabase SQL migrations; Vitest for unit and domain tests; Playwright for browser tests; and a local Supabase/PostgreSQL stack for database integration tests.

Courtside is implemented as a modular monolith with a pure vendor-independent domain core, application-service orchestration, and explicit adapters. Authoritative browser writes are server-mediated. Related authoritative mutations are transactional, audit-aware, and subject to the accepted lifecycle and authorization rules. Spreadsheet imports use a staged, validated, dry-run-capable, idempotent pipeline rather than direct AI-generated production SQL.

## Consequences

The first implementation slice must choose and record one transaction-capable server-side query strategy before it writes authoritative data. Database schema, constraints, functions, grants, and Row Level Security policies are committed as migrations and verified from an empty local database. Vercel preview deployments cannot write to production data. Public caching requires mutation-linked invalidation. Database and Storage recovery must both be defined and tested before production launch.

Replaceable concerns such as styling, component libraries, detailed statistics, external observability, analytics, and email delivery remain deferred until a concrete feature needs them. Microservices, queues, GraphQL, Realtime, Edge Runtime database mutations, Cloudinary, direct browser domain writes, and direct AI-generated production SQL are not part of the initial stack.

## Ratification

Accepted on 2026-08-07 after the contained Whetstone consistency audit reported the domain boundary preserved. Two minor terminology and media-scope clarifications were applied, and the corrective re-audit returned `pass` with zero blocker, major, minor, or nit findings. This ADR records the decision; `specs/tech-stack.md` remains the normative implementation declaration.
