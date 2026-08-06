# Courtside Domain Invariants

- Status: proposed
- Spec version: 0.1.0
- Last updated: 2026-08-04

## Purpose

These rules must remain true across implementations, schemas, APIs, recalculations, imports, corrections, and administrative operations.

## Identity and Participation

1. A User Account and a Player are distinct identities.
2. A Player exists independently of User Accounts and team participation.
3. A Team persists independently of any one Season.
4. Season-specific roster, captain authority, Games, and performance attach to a Season Team rather than directly to the persistent Team.
5. At most one Season Team connects the same Team and Season.
6. A Player may not have overlapping effective Roster Memberships for different Season Teams in the same Season.
7. Transfers preserve historical membership, Game, and Player Stat Line attribution.
8. A User Account may manage a Player only through an approved Player Management Relationship.
9. Player management is many-to-many: one account may manage multiple Players and multiple accounts may manage one Player.

## Authorization

1. League Administrator authority is scoped to one League and persists across Seasons until revoked.
2. Team Captain authority is scoped to exactly one Season Team.
3. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, or assign Team Captain authority.
4. Role and management-relationship changes are audited.

## Games and Results

1. A Game belongs to exactly one Season.
2. Home and away Season Teams are distinct and belong to the Game's Season.
3. A `final` or `forfeit` Game has an authoritative non-tied score and a winning team consistent with that score.
4. A `cancelled`, `scheduled`, `postponed`, or `in_progress` Game does not contribute to standings or completed playoff aggregates.
5. Tied Games are prohibited; regulation ties continue through overtime until resolved.
6. A `forfeit` has an explicit official score; derived systems never invent a forfeit score.
7. Correcting an authoritative result preserves the previous value in append-only audit history and recomputes every affected derived projection.
8. A regular-season Game and a playoff Game are the same entity type distinguished by competition phase and optional Matchup association.

## Player Statistics

1. A Player Stat Line belongs to exactly one Game, one Player, and the Roster Membership establishing that Player's eligibility for a participating Season Team.
2. Unknown and known zero are semantically different and remain distinguishable in every representation.
3. Completeness and verification are independent: a partial line may be confirmed.
4. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown.
5. Player-stat completeness never affects standings eligibility or playoff advancement.
6. Team points for, points against, and result-derived Team Statistics use the authoritative Game score, not the sum of Player Stat Lines.
7. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action.

## Standings

1. Standings are derived and cannot be directly edited.
2. Only eligible authoritative regular-season Game outcomes and explicit configuration-permitted adjustment records may influence standings.
3. Under the default rules:

   ```text
   games_played = wins + losses
   league_points = wins * 2
   point_differential = points_for - points_against
   ```

4. The default descending ranking order is:

   ```text
   league_points
   point_differential
   points_scored
   random_draw
   ```

5. A loss awards zero League Points under the default configuration.
6. Random draw is used only when all earlier configured criteria remain tied.
7. A random-draw result is persisted and audited and must not change merely because standings are viewed or recomputed from unchanged authoritative inputs.
8. A standings projection identifies the frozen Season configuration version used to produce it.
9. Playoff Games do not affect regular-season standings.

## Playoffs

1. A Playoff Bracket uses a fixed advancement graph; it does not reseed between Rounds.
2. Initial Matchup participants resolve from seeds, and later participants resolve from winners of fixed prior Matchups.
3. A Playoff Matchup contains the Round-configured number of ordinary Games.
4. Every configured Matchup Game is played to an authoritative outcome; early series termination based on Games won is prohibited.
5. Matchup advancement is determined by aggregate authoritative points, not by Games won.
6. The aggregate winner is the participating team with the greater sum of authoritative Game points after the configured Games and any aggregate-tiebreak overtime.
7. Under the default aggregate-tiebreak policy, a Matchup aggregate tie after regulation in the final configured Game is resolved by continuing that Game through overtime until the aggregate tie is broken, even when the individual Game's regulation score was not tied.
8. Aggregate-tiebreak points are part of the authoritative final Game score.
9. A playoff Matchup cannot advance from incomplete, provisional, or detailed Player statistics; it advances only from authoritative Game scores.

## Configuration and Reproducibility

1. The first `final` or `forfeit` Game freezes a versioned snapshot of result-affecting Season configuration.
2. Later amendments require League Administrator authority and an Audit Record.
3. Historical configuration versions remain available to explain prior calculations.
4. Given the same authoritative outcomes, adjustment records, persisted random draws, and configuration version, standings and playoff advancement are deterministic.
5. Configuration cannot enable tied final Games.

## Localization

1. English and French are supported languages.
2. The League default is exactly one supported language.
3. A saved supported user preference overrides the League default.
4. Missing requested localized content falls back to the League default.
5. UI strings and authored content are localizable; proper names remain language-neutral.
6. Dates and times render in the selected language but use the League's configured timezone unless a future accepted specification introduces viewer-local scheduling.

## Venues, Media, and Audit

1. A Venue is reusable and League-owned; a Game may reference at most one Venue.
2. A Media item may be associated with a Game, the League Gallery, or both without duplication of Media identity.
3. Every material Audit Record contains actor, timestamp, action, previous value, and new value.
4. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory.
5. Audit history is append-only.
