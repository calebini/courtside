# Courtside Team and Season Participation Setup

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification defines League Administrator creation of durable Team identities and their participation in a Season. It does not define roster membership, Team Captain assignment, Team profile editing, imports, or scheduling.

## Team Identity

A Team belongs to one League and persists across Seasons. Its name is language-neutral, whitespace-normalized, contains 2 through 120 visible characters, and is case-insensitively unique within its League. Adding a name that matches an existing League Team reuses that durable Team identity rather than creating a duplicate.

## Season Participation

A Season Team connects one durable Team to one Season at most once. A League Administrator may submit 1 through 64 Team names as one batch. Repeated case-insensitive names within the batch are reconciled to the first normalized occurrence. Each name reuses or creates the durable League Team and reuses or creates its Season Team participation. Reconciliation is atomic: validation, authorization, or infrastructure failure preserves the entire prior state.

Season participation may be removed only while no Roster Membership, Team Captain assignment, Game, or other authoritative dependent record references it. Removal deletes only the Season Team participation; the durable Team remains available for this or later Seasons. A blocked removal is rejected without mutation.

## Authority, Audit, and Idempotency

Every command derives the actor from a verified session and rechecks an active League Administrator assignment for the affected League. The browser supplies only the command, Season or Season Team target, locale, and requested Team names.

The affected Season or Season Team and League are transactionally locked. Every created durable Team, created Season Team participation, and removed Season Team participation writes its own Audit Record. One Command Receipt records the accepted batch or removal result. An identical retry by command identity returns the prior result; conflicting identity reuse is rejected.

## Delivery

The bilingual League desk accepts one Team name per line for each Season and displays current Season Teams. A removal control is available for participation that remains dependency-free; the service remains authoritative when the rendered page becomes stale. Scheduling remains unavailable until at least two Teams participate.
