# Decision 0019: Deliver Authenticated Member Player Statistics

- Status: accepted
- Date: 2026-08-17
- Last amended: 2026-08-18

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

Deliver points-first Season leaderboards, Player discovery, Player summaries, per-Game logs, and
completed-Game box scores grouped by participating Season Team. Use confirmed known values for
totals, rates, and rank; expose known provisional values only as clearly provisional. Preserve
unknown separately from known zero and label the denominator as recorded points games rather than
inferred Games played.

## Consequences

- Viewing all League Players is independent of authority to manage any Player.
- Open registration and pending access requests do not expose member statistics.
- Individual Player statistics remain absent from the unauthenticated public portal.
- The initial leaderboard ranks confirmed total points and preserves statistical ties.
- Box-score rows describe statistic-recording coverage for Players eligible at the Game competition
  anchor and do not assert appearance.
- The authoritative Game score remains independent of Player Stat Line sums, and the initial box
  score exposes no derived Player-points Team total.
- Stage Two detailed statistics extend Player Stat Lines additively and require a separate accepted
  vocabulary and aggregation policy before delivery.
