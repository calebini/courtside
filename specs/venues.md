# Courtside Venue Administration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification defines League Administrator creation, correction, and archival of reusable League-owned Venues. It does not define facility booking, court inventory, availability, maps, geocoding, or per-Game arrival instructions.

## Venue Identity

A Venue belongs to exactly one League and may be reused by Games across Seasons. Its League ownership is immutable. An active Venue name is whitespace-normalized, contains 2 through 120 visible characters, and is case-insensitively unique among active Venues in its League. Its address is whitespace-normalized and contains 2 through 240 visible characters. Optional notes contain at most 1,000 visible characters.

An active League Administrator may correct an active Venue name, address, or notes in place. An update must materially change at least one normalized field. Corrections affect the reusable Venue details rendered for Games that reference it and preserve the prior value in audit history. If a physical location is replaced rather than corrected, the old Venue is archived and a new Venue is created.

## Archival and Scheduling

Archival is terminal in this slice. It sets an archival instant and never deletes the Venue or clears existing Game references. Archived Venues remain readable on historical and current Game records but are excluded from new scheduling and rescheduling selections. A materially identical later location is created as a new Venue identity; unarchive and destructive deletion are not supported.

## Authority, Audit, and Idempotency

Every command derives the actor from a verified session and rechecks an active League Administrator assignment for the affected League. The browser supplies only command identity, League or Venue target, locale, and requested Venue fields.

Creation locks the League. Correction and archival lock both the Venue and League. Each accepted operation writes one Audit Record and one Command Receipt in the same transaction. Identical retries by command identity return the accepted result, conflicting identity reuse is rejected, and invalid or unauthorized commands preserve authoritative state.

## Delivery

The bilingual League desk exposes Venue creation and lists active and archived Venues. Active Venues provide correction and archival controls. Game scheduling and rescheduling offer only active Venues while existing Games continue to render their referenced Venue after archival.
