# Decision 0019: Deliver Authenticated Member Player Statistics

- Status: accepted
- Date: 2026-08-17

## Context

Courtside now records points-first Player Stat Lines, but only League Administrators can consume
them through the entry workflow. Public League results and standings intentionally remain
Team-level. The League wants individual performance to be visible and social among its admitted
members without publishing Player data to unrestricted visitors.

## Decision

Adopt [`../member-statistics.md`](../member-statistics.md). Every authenticated, provisioned Account
with a trusted relationship to the League may view every Player's member-visible statistics for
that League. Initially, a trusted relationship is an active League Administrator Assignment, an
active Team Captain Assignment, or an approved Player Management Relationship.

Deliver points-first Season leaderboards, Player discovery, Player summaries, and per-Game logs.
Use confirmed known values for totals, rates, and rank; expose known provisional values only as
clearly provisional. Preserve unknown separately from known zero and label the denominator as
recorded points games rather than inferred Games played.

## Consequences

- Viewing all League Players is independent of authority to manage any Player.
- Open registration and pending access requests do not expose member statistics.
- Individual Player statistics remain absent from the unauthenticated public portal.
- The initial leaderboard ranks confirmed total points and preserves statistical ties.
- Stage Two detailed statistics extend Player Stat Lines additively and require a separate accepted
  vocabulary and aggregation policy before delivery.
