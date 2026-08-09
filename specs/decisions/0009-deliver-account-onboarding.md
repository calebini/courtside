# Decision 0009: Deliver Account Onboarding

- Status: accepted
- Date: 2026-08-09

## Context

The Player access-request workflow requires a real Account to exist before a person can request an existing Player. Seed-only Accounts prevent that workflow from operating outside the local fixtures. Binding registration directly to Players would also require reliable Player-specific contact information that the League does not currently hold.

## Decision

Deliver provider-owned email/password registration, email-confirmation-aware and idempotent Courtside User Account provisioning, non-enumerating password recovery, and saved English or French preference. Registration mode and site origin are explicit deployment configuration. The initial local mode is open; production must deliberately select its mode and configure abuse controls.

Registration never creates or selects a Player. After provisioning, the Account searches existing Players and submits the already accepted management request for administrator approval. Credentials and recovery tokens remain in Supabase; PostgreSQL stores the independent User Account, verified contact email, and language preference.

## Consequences

- Account onboarding unlocks the existing Player request workflow without weakening administrator approval.
- A later League code or invitation gate can change registration admission without replacing Account, Player, or Player Management identities.
- Production remains blocked on email delivery, abuse controls, and the administrator bootstrap runbook.
- Authorized administrators may see the confirmed requester email in the Player-access queue; it remains absent from public projections.
