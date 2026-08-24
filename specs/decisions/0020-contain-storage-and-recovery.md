# Contain Profile Storage and Password Recovery

- Status: accepted
- Date: 2026-08-24

## Context

The initial private-photo delivery granted approved Player managers direct authenticated access to
the Player's Storage folder. That alternate path bypassed application image processing, generated
object keys, database metadata, and audit. Password updates also accepted any verified session even
though the authentication specification required a recovery session.

## Decision

Profile-photo Storage is server-mediated. Browser sessions receive no direct insert, select, update,
or delete policy for the private bucket. A server-only Storage adapter uses privileged credentials
only after application authorization, stores one generated current object reference in PostgreSQL,
and issues short-lived signed reads for that exact reference. Uploaded images are decoded,
orientation-normalized, re-encoded to a canonical JPEG, PNG, or WebP representation, stripped of
metadata, and rechecked against the 1 MiB limit before Storage receives them.

A successful password-recovery callback creates a random, short-lived authorization whose hash is
stored in PostgreSQL and whose opaque value is held in an HttpOnly same-site cookie. The
authorization is bound to the verified external identity, expires after fifteen minutes, and is
atomically consumed before one password update. An ordinary authenticated session, missing cookie,
expired authorization, mismatched identity, or replay cannot update a password through the recovery
surface.

## Consequences

- Deployments require a server-only Supabase service-role credential for private photo operations.
- Leaking the service credential would bypass Storage RLS, so it is never exposed through a
  `NEXT_PUBLIC_` variable or browser return value.
- A failed provider password update after authorization consumption requires a new recovery email;
  this favors fail-closed one-use behavior over retrying a sensitive authorization.
- Existing photo objects remain private. A later reconciliation job may remove historical orphans
  that predate this decision.
