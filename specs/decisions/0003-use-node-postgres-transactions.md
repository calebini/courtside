# ADR 0003: Use Server-side node-postgres Transactions

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-07

## Context

The first authoritative slice must lock related records, freeze Season configuration exactly once, persist a Game result and audit history atomically, recompute standings from the same transactional view, and make command retries idempotent. Multiple independent Supabase Data API calls cannot provide that transaction boundary. Moving the whole use case into PostgreSQL RPC would make database functions a competing application-service layer before that tradeoff is justified.

## Decision

Use `node-postgres` (`pg`) as the initial server-only PostgreSQL driver. Application services own orchestration through internal ports. The PostgreSQL adapter checks out one client, begins a transaction, performs parameterized queries and required row or advisory locks, and commits or rolls back the complete use case.

The pool is bounded and created only in server code. Local and long-lived administration may use a direct PostgreSQL connection. Vercel runtime configuration must use the Supabase connection mode appropriate to serverless execution and keep compute near the database.

## Consequences

The browser cannot invoke the driver or receive its credentials. Row Level Security remains defense in depth rather than the transaction coordinator. Repository integration tests run against real PostgreSQL migrations. Any future query builder must wrap this same transaction boundary and requires an accepted amendment if it changes dependency direction or moves policy into another layer.

## Ratification

Accepted as the transaction-capable query strategy required by the technology declaration before the first write-capable vertical slice.
