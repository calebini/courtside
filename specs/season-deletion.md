# Courtside Unused Season Deletion

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This specification defines the narrow administrative removal of a Season created in error. It does
not define Season completion, archival, retention expiry, or deletion of competition history.

## Eligibility

Only an active League Administrator for the Season League may delete a Season. The Season is
eligible only when it has no Season Teams, Games, Roster Memberships, frozen configuration versions,
Team Captain assignments, or other dependent domain records. Durable League Teams, League Venues,
User Accounts, and append-only Audit Records are not owned by the Season and are never deleted by
this operation.

The administrator must type the current Season name exactly. A mismatch, missing Season, missing
authority, command-identity conflict, or dependent record rejects the operation without mutation.
The operation never cascades, infers cleanup, or converts a used Season into an unused one.

## Transaction and Audit

Deletion locks the command identity and Season, rechecks current authority, confirmation, and
dependencies, and atomically appends one `season.deleted` Audit Record, deletes the Season row, and
persists one Command Receipt. The Audit Record preserves the deleted Season identity, League,
name, configuration, creation timestamp, and optional normalized reason. The accepted new value is
`null`.

An identical retry returns the accepted receipt without another Audit Record. Concurrent deletion
attempts may accept at most one material deletion. Existing restrictive foreign keys remain the
persistence safeguard against a dependent record racing or bypassing the application eligibility
check.

Deleting an eligible Season releases its case-insensitive League-local name for reuse. Creation and
deletion Audit Records remain append-only and retain the identities of both the deleted Season and
the acting administrator.

## Delivery

League Setup exposes this action as a danger-zone disclosure for the selected Season. It clearly
distinguishes an eligible unused Season from a protected Season with dependencies, requires typed
name confirmation, accepts an optional reason, and derives the actor from the verified server
session. A protected Season offers no delete submission.

Used Seasons are retained. A future end or archive lifecycle is a separate capability and must not
be approximated by destructive deletion.
