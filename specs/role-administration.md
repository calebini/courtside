# Courtside Role Administration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification delivers ordinary post-bootstrap administration of League Administrator and
Team Captain assignments. It does not expand either role's authority. League Administrators keep
their accepted League-wide authority; Team Captains remain Season-Team-scoped markers with no
independent mutation permissions in Phase 1.

## Assignment Rules

- Only an active League Administrator for the affected League may change either role.
- A target must already have a provisioned User Account. The administrator identifies the target
  by its exact registered email; the interface does not expose a global User Account directory.
- A League may have several active League Administrators. Granting an already-active assignment is
  rejected as a no-op. Revocation is terminal, and a later grant creates a new assignment.
- The final active League Administrator cannot be revoked. This safeguard is enforced in the
  service and independently in PostgreSQL, including concurrent revocation attempts.
- A Season Team has at most one active Team Captain. Assigning a different account atomically
  revokes the prior assignment and creates the replacement. Assigning the current account is
  rejected as a no-op. Revocation is terminal.
- Ending a Season does not transfer captain authority to another Season or Season Team.

## Audit and Delivery

Every accepted grant, reassignment, or revocation writes one append-only Audit Record containing
the actor, affected scope, previous and new assignment values, timestamp, and optional reason.
Commands are idempotent by command identity. The bilingual workflow lives under League Setup as
an infrequent authority control and rechecks authorization on every submission.
