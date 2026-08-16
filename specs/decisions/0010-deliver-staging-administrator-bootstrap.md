# Decision 0010: Deliver the Staging Administrator Bootstrap

- Status: accepted
- Date: 2026-08-15

## Context

Staging now supports verified registration and User Account provisioning, but no ordinary domain action may grant the first League Administrator authority because every later assignment change correctly requires an existing League Administrator. Reusing disposable local seed data or manually inserting an assignment would bypass the accepted audit, idempotency, and final-administrator boundaries.

## Decision

Deliver a server-side staging bootstrap command that selects an already provisioned User Account by normalized verified contact email, creates or exactly matches the deployment's sole initial League, and creates the first League Administrator assignment, Audit Record, and Command Receipt atomically. Serialize all attempts with a deployment-wide PostgreSQL advisory transaction lock because an empty deployment has no League identifier to lock.

The operator must explicitly supply the environment, expected Supabase project reference, League name, IANA timezone, default English or French language, and administrator email. The database connection must identify the same Supabase transaction-pooler project. The command produces a read-only plan by default and requires `--apply` for mutation. Identical accepted content is reusable; conflicting content and all post-bootstrap attempts are rejected.

## Consequences

- Initial authority is established without weakening ordinary League Administrator assignment rules.
- The command cannot silently choose an Account, database project, League identity, or language.
- Season, Team, Player, and Auth identity creation remain separate setup concerns.
- The current command is intentionally staging-only. Production authorization requires a later accepted decision and exercised production runbook.
