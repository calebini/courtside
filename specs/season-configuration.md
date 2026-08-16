# Courtside Pre-Freeze Season Configuration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification defines the first safe administrator surface for reviewing and changing mutable Season standings configuration before the Season freezes. It does not configure playoffs, standings adjustments, eligible Game phases or statuses, forfeit treatment, persisted random draws, or post-freeze amendments.

## Editable Surface

An active League Administrator may change nonnegative integer League Points for a win and loss while the win value remains strictly greater than the loss value. The administrator may reorder `league_points`, `point_differential`, and `points_scored`. Each appears exactly once. `random_draw` is mandatory, appears exactly once, and remains the final fallback.

The update replaces only standings point values and ordered ranking criteria. It preserves eligible phases, eligible statuses, adjustment enablement, forfeit treatment, playoff configuration, and every other accepted configuration field. A normalized request identical to current configuration is rejected without mutation.

## Freeze Boundary

Ordinary editing is allowed only while `frozen_configuration_version_id` is absent. Scheduled, postponed, cancelled, and in-progress Games do not independently prevent editing. The first accepted `final` or `forfeit` freezes configuration under the existing Season lifecycle. Once frozen, this surface is read-only and any attempted ordinary update is rejected. A later post-freeze amendment requires its own versioned, reasoned, conflict-aware specification and workflow.

PostgreSQL independently rejects a change to mutable `result_configuration` after a Season is frozen. Frozen configuration versions and historical audit records are never rewritten by this workflow.

## Authority, Audit, and Idempotency

The server derives the actor from a verified session and rechecks an active League Administrator assignment for the Season League. The affected Season and League are locked. An accepted update writes the new mutable configuration, one Audit Record preserving complete prior and new configuration values and canonical hashes, and one Command Receipt in the same transaction.

Identical retries by command identity reuse the accepted result. Conflicting identity reuse, invalid values, unsupported or duplicate ranking criteria, unchanged requests, missing authority, missing Season, and frozen Seasons reject without mutation.

## Delivery

The bilingual League desk renders the current point values, ordered criteria, fixed eligibility and forfeit rules, playoff Round count, and mutable or frozen status. Mutable Seasons expose a structured form rather than arbitrary JSON. Frozen Seasons show the applied configuration read-only and explain that ordinary editing is unavailable.
