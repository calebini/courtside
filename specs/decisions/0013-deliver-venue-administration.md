# Decision 0013: Deliver Venue Administration

- Status: accepted
- Date: 2026-08-16

## Context

The deployed League has no disposable Venue fixtures. Games may be scheduled without a Venue, but administrators cannot create or maintain the reusable League-owned locations already supported by Game scheduling.

## Decision

Deliver authenticated, audited, and idempotent Venue creation, correction, and archival on the bilingual League desk. Keep Venue identity durable, make League ownership immutable, enforce case-insensitive uniqueness among active names, and exclude archived Venues from future scheduling without changing existing Game references.

Treat corrections as updates to the reusable record. Treat a materially different physical location as a new Venue after archiving the old one. Do not provide unarchive or destructive deletion in this slice.

## Consequences

- A real League can configure locations before scheduling Games.
- Historical Game references survive Venue retirement.
- Administrators can correct typos and operational notes without duplicating identity.
- Facility booking, court inventory, maps, geocoding, and availability remain deferred.
