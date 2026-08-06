# Courtside Domain Lifecycles

- Status: proposed
- Spec version: 0.1.0
- Last updated: 2026-08-04

## Purpose

This specification defines state transitions and authority timing for Season configuration, rosters, Games, Player Stat Lines, permissions, standings, and playoff Matchups.

## Season Configuration Lifecycle

1. A Season begins with a mutable configuration derived from League defaults and explicit Season overrides.
2. The first transition of any Season Game to `final` or `forfeit` freezes a versioned snapshot of all result-affecting Season configuration.
3. All standings and playoff calculations identify the frozen configuration version they use.
4. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record.
5. Recalculation under an amended version is deterministic and applies to every affected derived projection. Historical versions remain available so prior calculations can be explained.

Result-affecting configuration includes standings points, ranking criteria, Game eligibility, forfeit treatment, playoff Round structure, aggregate advancement, and aggregate-tiebreak policies. League timezone and localization changes do not retroactively change recorded Game instants or previously captured authored-content translations.

## Roster Membership Lifecycle

A Roster Membership has an effective start and may have an effective end. Whether an implementation exposes additional labels such as pending, active, or inactive does not change these normative rules:

1. A Player becomes eligible for a Season Team when a membership becomes effective.
2. A Player may not have overlapping effective memberships for different Season Teams in the same Season.
3. A transfer ends the prior membership before the new membership begins.
4. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective.
5. A Player Stat Line must reference the membership that established eligibility for that Game.

## Game Lifecycle

The normative Game statuses are:

```text
scheduled
postponed
cancelled
in_progress
final
forfeit
```

### Scheduling Transitions

- A new Game begins as `scheduled`.
- A `scheduled` Game may become `postponed`, `cancelled`, `in_progress`, or `forfeit`.
- A `postponed` Game may return to `scheduled` with a revised scheduled instant, become `cancelled`, or become `forfeit`.
- A `cancelled` Game has no authoritative competitive outcome and does not affect standings or playoff aggregates.

Every scheduled instant is interpreted in the League's configured IANA timezone and stored as an unambiguous instant. Rescheduling preserves the history required by the audit policy.

### Competition Transitions

- An `in_progress` Game may become `final` after an authoritative non-tied score is recorded.
- An `in_progress` Game that remains tied at the end of regulation continues through overtime periods until one team wins.
- A Game may become `forfeit` only with an explicit winning team and an official non-tied score. That official score is the source for standings and aggregate calculations.
- `final` and `forfeit` are authoritative outcome statuses.
- Detailed Player statistics are not required to transition a Game to `final` or `forfeit`.

### Authoritative Result Corrections

A League Administrator may correct the score or declared winner of a `final` or `forfeit` Game. A correction:

1. preserves the authoritative status;
2. writes an Audit Record containing the actor, timestamp, action, previous value, new value, and mandatory reason;
3. triggers deterministic recomputation of affected standings, Season-Team result statistics, playoff aggregates, and playoff advancement; and
4. never silently rewrites prior audit history.

If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The conflict must be surfaced for explicit League Administrator resolution and audited before the bracket can be considered internally consistent.

## Player Stat Line Lifecycle

Verification and completeness are independent.

### Verification

```text
provisional -> confirmed
```

- A Player Stat Line may be created or updated as `provisional` before or after the Game result becomes authoritative.
- A line becomes `confirmed` when its currently known values have been verified.
- A confirmed line may remain partial.
- Updating a confirmed value returns the changed line to `provisional` unless the same authorized action explicitly verifies the replacement.

### Completeness

Each statistical value is either:

- known, including a known value of zero; or
- unknown because it has not been recorded.

Human-readable completeness labels such as points-only, partial, and full are derived from which expected values are known. They are not substitutes for field-level known/unknown state. Adding later details does not change the authority of the Game result.

Material stat changes are audited with actor, timestamp, action, previous value, new value, and optional reason.

## Player Management Lifecycle

A User Account-to-Player management relationship follows:

```text
requested -> approved -> revoked
```

- Only an approved relationship grants management authority.
- League Administrators approve and revoke relationships.
- Approval and revocation are audited.
- Multiple approved accounts may manage one Player, and one account may manage multiple Players.

## Role Assignment Lifecycle

- A League Administrator assignment persists across Seasons until revoked.
- A Team Captain assignment is scoped to one Season Team.
- League Administrators assign, reassign, and revoke Team Captain authority.
- Role assignment changes are audited.
- Ending a Season does not convert a Team Captain assignment into authority over a later Season Team.

## Standings Lifecycle

Standings are recomputed projections, not independently mutable records.

1. Only eligible `final` and `forfeit` regular-season Games contribute.
2. Any authoritative eligible result or permitted adjustment change invalidates the prior projection.
3. Recalculation uses the applicable frozen Season configuration version.
4. A random-draw tiebreak is performed only after all preceding ranking criteria remain tied.
5. Each draw result is persisted and audited; rendering or recalculating unchanged inputs reuses it rather than drawing again.

## Playoff Matchup Lifecycle

1. Initial fixed-bracket Matchup slots resolve from configured Season seeds.
2. Later Matchup slots resolve from winners of named prior Matchups.
3. A Matchup contains the number of Games configured for its Round; every configured Game must reach `final` or `forfeit` before normal advancement.
4. The Matchup aggregate is the sum of the authoritative scores of its Games.
5. The team with the greater aggregate advances through the fixed bracket.
6. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into one or more aggregate-tiebreak overtime periods until the aggregate tie is broken, even when the regulation score of that individual Game was not tied.
7. The overtime points remain part of the final Game score and therefore the Matchup aggregate.
8. A Matchup's tiebreak strategy is selected by Round configuration; the default strategy is aggregate overtime.

Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings.

