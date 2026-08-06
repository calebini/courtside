# Courtside Core Domain Overview

- Status: proposed
- Spec version: 0.1.0
- Last updated: 2026-08-04

## Purpose

Courtside owns the core domain for operating a recreational basketball league across seasons. It defines durable league, team, player, account, competition, standings, playoff, media, venue, localization, authorization, and audit concepts without prescribing a database, API style, framework, or deployment architecture.

This specification family is authoritative for domain terminology and behavior. `README.md` remains orientation only.

## Scope

Courtside covers:

- persistent league, team, player, and user-account identity;
- season-specific team participation, rosters, schedules, results, standings, and playoffs;
- provisional, partial, confirmed, and corrected player game statistics;
- configurable score-based standings and round-specific playoff series;
- league-scoped administration and season-team captain authority;
- simple venues and reusable media associations;
- English and French user-interface and authored-content localization; and
- simple audit records for material administrative changes.

## Canonical Domain Map

```text
League
  ├── Seasons
  │     ├── Season Teams ── Roster Memberships ── Players
  │     ├── Games ── Player Stat Lines
  │     ├── Standings
  │     └── Playoff Bracket ── Rounds ── Matchups ── Games
  ├── Teams
  ├── Players
  ├── Venues
  ├── League Gallery
  └── League Administrator Assignments

User Account
  ├── approved Player Management relationships
  ├── League Administrator Assignments
  └── Team Captain Assignments scoped to one Season Team

Media
  ├── Game associations
  └── League Gallery associations
```

## Canonical Concepts

### League

The persistent organization that owns seasons, league defaults, supported languages, the league timezone, administrator assignments, venues, and the league gallery. Courtside currently assumes one organizational league boundary; cross-league identity and competition are out of scope.

### Season

A competition cycle within a League. A Season owns its participating Season Teams, Games, standings configuration, playoff configuration, and the frozen configuration versions needed to reproduce historical outcomes.

### Team

A durable team identity that persists across Seasons. A Team does not acquire a Season roster or Season results directly; those belong to its Season Team participation.

### Season Team

The participation of one Team in one Season. It owns that Season's roster memberships, Season-specific captain assignments, schedule participation, and derived Season performance. At most one Season Team may connect the same Team and Season.

### Player

A durable participant identity within the League's history. A Player exists independently of team participation and authentication. Moving between teams or seasons does not replace the Player record.

### Roster Membership

A Player's membership in one Season Team over an effective period. Transfers close the prior membership and open a new one without rewriting historical Games or Player Stat Lines. A Player may not have overlapping active memberships in more than one Season Team in the same Season.

### User Account

A login identity. A User Account is never the same domain entity as a Player. Accounts may exist without Players, Players may exist without accounts, one account may manage multiple Players, and multiple accounts may manage one Player through separately approved relationships.

### Player Management Relationship

An approval-controlled relationship authorizing a User Account to manage a Player profile. Approval and revocation are performed by a League Administrator and are audited.

### Role Assignment

Authorization is expressed through scoped assignments:

- a League Administrator assignment applies to its League and persists across Seasons until revoked;
- a Team Captain assignment applies to exactly one Season Team and is assigned, reassigned, or revoked by a League Administrator.

### Game

A scheduled basketball match between two distinct Season Teams in the same Season. A Game records schedule, venue, competition phase, lifecycle status, authoritative score when available, optional Player Stat Lines, and optional Media associations. Regular-season and playoff Games share the same Game concept.

### Player Stat Line

A Player's statistical performance in a Game, attributed through the Roster Membership that made the Player eligible for one of the participating Season Teams. Every statistical value distinguishes unknown from a known zero. A line may be partial and has an independent verification status of provisional or confirmed.

### Team Statistics

Derived Season-Team performance calculated from authoritative Game results and, where explicitly needed, aggregated Player Stat Lines. The authoritative Game score remains the source for points for, points against, and result-based standings calculations.

### Standings

A derived ranking of Season Teams under the Season's frozen standings configuration. Standings are never directly edited. They are recomputed from eligible authoritative Game outcomes plus explicit, audited adjustment records if the Season configuration permits adjustments.

### Playoff Bracket

A fixed advancement structure composed of ordered Rounds and Matchups. Initial Matchup slots are filled by seeds; later slots reference winners of fixed prior Matchups. Matchups contain a round-configured number of Games and advance the team with the greater aggregate score under the configured aggregate-tiebreak policy.

### Venue

A reusable League-owned location with a name, address, and optional notes. A Game may reference one Venue and may add Game-specific court or arrival instructions.

### Media

Optional photo records or YouTube links. The same Media item may be associated with Games, the League Gallery, or both. Association is independent of Media identity.

### Localization

Courtside supports English and French. UI strings and authored content are localizable. Team names, Player names, and other proper names remain language-neutral. A saved account preference selects a supported language; otherwise the League default language is used. Missing requested content falls back to the League default.

### Audit Record

An append-only explanation of a material administrative change. The minimum record contains actor, timestamp, action, previous value, new value, and an optional reason. A reason is mandatory for correcting a finalized or forfeited Game result.

## Derived Data Authority

```text
Authoritative Game outcomes
  ├── regular-season standings
  ├── Season-Team result statistics
  └── playoff aggregate scores and advancement

Player Stat Lines
  ├── Player game logs
  └── optional detailed Team Statistics
```

Player-stat availability or completeness must never block an authoritative Game result, standings recomputation, or playoff advancement.

## Non-goals

- Database tables, identifiers, indexes, API endpoints, event schemas, or transport formats.
- Selecting a programming language, framework, authentication provider, media host, or deployment platform.
- Divisions, conferences, inter-league competition, or cross-league Player identity.
- Automatically translating proper names.
- Treating detailed Player statistics as a prerequisite for standings.
- Directly editing derived standings or playoff advancement.

## Governing Specifications

- [`lifecycle.md`](lifecycle.md) defines state transitions and authority timing.
- [`invariants.md`](invariants.md) defines rules all implementations must preserve.
- [`config.md`](config.md) defines the configurable policy surface and defaults.
- [`decisions/0001-ratify-core-domain.md`](decisions/0001-ratify-core-domain.md) records the ratification decision.

