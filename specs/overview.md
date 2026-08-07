# Courtside Core Domain Overview

- Status: proposed
- Spec version: 0.1.0
- Last updated: 2026-08-04

## Purpose

Courtside owns the core domain for operating a recreational basketball league across seasons. It defines durable league, team, player, account, competition, standings, playoff, media, venue, localization, authorization, and audit concepts without prescribing a database, API style, framework, or deployment architecture.

This specification family is authoritative for domain terminology and behavior. `README.md` remains orientation only.

## Scope

Courtside covers persistent league, team, player, and user-account identity; season-specific team participation, rosters, schedules, results, standings, and playoffs; provisional, partial, confirmed, and corrected player game statistics; configurable score-based standings and round-specific playoff series; league-scoped administration and season-team captain authority; simple venues and reusable media associations; English and French user-interface and authored-content localization; and simple audit records for material administrative changes.

## Canonical Concepts

A League is the persistent organization that owns seasons, league defaults, supported languages, the league timezone, administrator assignments, venues, and the league gallery. Courtside currently assumes one organizational league boundary; cross-league identity and competition are out of scope.

A Season is a competition cycle within a League. It owns participating Season Teams, Games, standings configuration, playoff configuration, and frozen configuration versions needed to reproduce historical outcomes.

A Team is a durable team identity that persists across Seasons. Season roster and Season results belong to Season Team participation, not directly to Team.

A Season Team is one Team participating in one Season. It owns that Season roster memberships, Season-specific captain assignments, schedule participation, and derived Season performance. At most one Season Team may connect the same Team and Season.

A Player is a durable participant identity within the League history and exists independently of team participation and authentication.

A Roster Membership is a Player membership in one Season Team over an effective period. Transfers close the prior membership and open a new one without rewriting historical Games or Player Stat Lines. A Player may not have overlapping active memberships in more than one Season Team in the same Season.

A User Account is a login identity and is never the same domain entity as a Player. Accounts may exist without Players, Players may exist without accounts, one account may manage multiple Players, and multiple accounts may manage one Player through separately approved relationships.

A Player Management Relationship is an approval-controlled relationship authorizing a User Account to manage a Player profile. Approval and revocation are performed by a League Administrator and are audited.

Authorization is expressed through scoped assignments. League Administrator assignments apply to one League and persist across Seasons until revoked. After the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics. Team Captain assignments apply to exactly one Season Team and are assigned, reassigned, or revoked by a League Administrator. In Phase 1, Team Captain is a scoped domain authority marker and does not independently grant authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

A Game is a scheduled basketball match between two distinct Season Teams in the same Season. It records schedule, venue, competition phase, lifecycle status, authoritative score when available, optional Player Stat Lines, and optional Media associations. Regular-season and playoff Games share the same Game concept.

A Player Stat Line is a Player statistical performance in a Game, attributed through the Roster Membership that made the Player eligible for one participating Season Team. Every statistical value distinguishes unknown from known zero. A line may be partial and has an independent verification status of provisional or confirmed.

Team Statistics are derived Season-Team performance calculated from authoritative Game results and, where explicitly needed, aggregated Player Stat Lines. The authoritative Game score remains the source for points for, points against, and result-based standings calculations.

Standings are derived rankings of Season Teams under the Season frozen standings configuration. They are never directly edited and are recomputed from eligible authoritative Game outcomes plus explicit, audited adjustment records if configuration permits adjustments.

A Playoff Bracket is a fixed advancement structure composed of ordered Rounds and Matchups. Initial Matchup slots are filled by seeds; later slots reference winners of fixed prior Matchups. Matchups contain a round-configured number of Games and advance the team with the greater aggregate score under the configured aggregate-tiebreak policy.

A Venue is a reusable League-owned location with a name, address, and optional notes. A Game may reference one Venue and may add Game-specific court or arrival instructions.

Media are optional photo records or YouTube links. The same Media item may be associated with Games, the League Gallery, or both. Association is independent of Media identity.

Courtside supports English and French localization. UI strings and authored content are localizable. Team names, Player names, and other proper names remain language-neutral. A saved account preference selects a supported language; otherwise the League default language is used. Missing requested content falls back to the League default.

An Audit Record is an append-only explanation of a material administrative change. The minimum record contains actor, timestamp, action, previous value, new value, and an optional reason. A reason is mandatory for correcting a finalized or forfeited Game result.

## Derived Data Authority

Authoritative Game outcomes produce regular-season standings, Season-Team result statistics, playoff aggregate scores, and playoff advancement. Player Stat Lines produce Player game logs and optional detailed Team Statistics. Player-stat availability or completeness must never block an authoritative Game result, standings recomputation, or playoff advancement.

## Non-goals

Non-goals include database tables, identifiers, indexes, API endpoints, event schemas, transport formats, programming language, framework, authentication provider, media host, deployment platform, divisions, conferences, inter-league competition, cross-league Player identity, automatic proper-name translation, treating detailed Player statistics as a prerequisite for standings, and directly editing derived standings or playoff advancement.
