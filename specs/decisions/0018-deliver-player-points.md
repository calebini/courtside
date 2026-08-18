# Decision 0018: Deliver Points-First Player Stat Lines

- Status: accepted
- Date: 2026-08-17

## Context

Courtside has durable Players, time-effective rosters, competition eligibility anchors, and
authoritative Game results, but it does not yet retain individual performance. The accepted domain
requires unknown to differ from zero, permits partial and provisional statistics, and prohibits
Player-stat completeness from affecting official results or standings.

## Decision

Adopt [`../player-stat-lines.md`](../player-stat-lines.md). Persist one eligibility-attributed Player
Stat Line per Player and Game, initially containing nullable nonnegative points, `partial`
completeness, and independent `provisional` or `confirmed` verification. Deliver an idempotent,
audited League Administrator batch workflow inside completed Games. Continue to derive Team scores
and standings exclusively from authoritative Game results.

## Consequences

- A blank points value remains unknown while `0` is an explicit known value.
- Confirmed values may be corrected without losing history; replacements become provisional unless
  explicitly confirmed in the same command.
- The schema can add detailed nullable statistics later without redefining Player Stat Line identity.
- Public and member-facing Player statistics remain unavailable under this decision alone. Decision
  0019 separately accepts the authenticated member visibility policy while preserving the public
  boundary.
