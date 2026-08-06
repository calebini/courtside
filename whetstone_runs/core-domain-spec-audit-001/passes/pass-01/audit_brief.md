# Whetstone Change Audit Brief

Workflow: audit_change
Profile: consistency

Reviewer instructions:
- Evaluate only the stated change intent and expected boundary.
- Do not perform a full convergence review.
- Treat unrelated polish, completeness, or future hardening concerns as out of scope.
- Report an issue only when it directly affects the change intent, expected boundary, or listed source specs.
- If a concern is outside the stated audit boundary, set in_scope=false.

## Audit Notes

Path: /Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/core-domain-spec-audit-001/audit-notes.md
Hash: 6489cea66063acfa818e5bfd89fa84cd87971ff266b4499de54ca1bc9188f677

# Courtside Core Domain Contained Audit

## Authorization

The user explicitly requested this Whetstone review. I explicitly authorize sending this audit-notes file and only the following listed specification files to the configured nested Codex Reviewer client for this Whetstone audit-change run:

- `whetstone_runs/core-domain-spec-audit-001/audit-notes.md`
- `specs/overview.md`
- `specs/lifecycle.md`
- `specs/invariants.md`
- `specs/config.md`
- `specs/decisions/0001-ratify-core-domain.md`

This approval is limited to this audit. Do not inspect or send unlisted repository files. Do not mutate source specs.

## Audit Mode

Run a lightweight Whetstone multi-document seed-spec `audit-change` assessment, not Phase 1, Phase 2, convergence review, or an Editor workflow.

## Change Intent

Ratify the conceptual core domain for Courtside, a recreational basketball league system, before schema, API, runtime, persistence, or deployment choices. The bundle must form one coherent and implementable domain boundary while remaining technology-neutral.

## Authoritative Inputs

- `specs/overview.md`
- `specs/lifecycle.md`
- `specs/invariants.md`
- `specs/config.md`
- `specs/decisions/0001-ratify-core-domain.md`

## Expected Boundary

- League is the organizational root and Season is the competition container.
- Team and Player identities persist across Seasons.
- Season Team and Roster Membership own season-specific participation and history.
- User Account and Player are distinct and connect through approved many-to-many management relationships.
- League Administrator authority is League-scoped and persistent; Team Captain authority is Season-Team-scoped.
- Final and forfeited Game scores are authoritative independently of detailed-stat availability.
- Tied Game outcomes are prohibited.
- Player-stat values distinguish unknown from known zero; completeness and verification are independent.
- Standings derive from eligible authoritative regular-season scores under versioned customizable rules.
- Playoffs use a fixed bracket, seeded initial slots, Round-configured Game counts, aggregate-points advancement, and configurable aggregate tiebreak defaulting to overtime in the final configured Game.
- English/French localization, League timezone, simple Venues, reusable Media associations, and minimum audit requirements are domain concerns.
- Result-affecting Season policy freezes on the first final or forfeited Game and later changes are versioned and audited.

## Reviewer Questions

1. Do the five documents express one consistent terminology and authority model?
2. Are identity, participation, role, Game, stat, standings, playoff, localization, and audit boundaries conceptually implementable without prescribing schema or API choices?
3. Are all lifecycle transitions and terminal-state effects consistent with the invariants?
4. Are standings and playoff calculations deterministic for identical authoritative inputs, configuration versions, adjustments, and persisted random draws?
5. Does the aggregate-series overtime rule resolve the Matchup aggregate without contradicting the prohibition on tied Games?
6. Are defaults clearly separated from configurable policy?
7. Are any blocker, major, or minor ambiguities still in scope for this domain ratification?
8. Does any necessary correction require a new user product decision rather than editorial clarification?

## Out Of Scope

- Phase 1 or Phase 2 convergence claims.
- Automatic editing or mutation of source specifications.
- Schema, API, event, framework, persistence, hosting, or deployment design.
- Authentication-provider details.
- Full statistics vocabulary.
- Divisions, conferences, and inter-league competition.
- Cosmetic cleanup with no effect on authority, consistency, determinism, or implementability.

## Requested Report

Report verdict, `boundary_preserved`, and all in-scope blocker, major, and minor findings. Separate informational suggestions and out-of-scope findings. If a finding cannot be corrected without changing product policy, identify the exact user decision required.

## Specs To Check

### Spec 1: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/overview.md

Hash: 21b351b6c284e5e274b40f0cd74f86cbe03bbffb4fab6899b581a5155c8d9497

```markdown
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
```

### Spec 2: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/lifecycle.md

Hash: 37ee506355d89fe613721948549de9922d69aaad7ce46753fd73d4dede1534ca

```markdown
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
```

### Spec 3: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/invariants.md

Hash: 5b28ce7886a57ca2ea00147093a4fcec1796fda41f9fb375a09032eb8ed9834b

```markdown
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
7. Under the default aggregate-tiebreak policy, a tie after regulation in the final configured Game is resolved by continuing that Game through overtime until the aggregate tie is broken.
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
```

### Spec 4: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/config.md

Hash: 0b63a1f65a28f0835c1f78691b5d86765e6f93d6a47cd423b772982c16942485

```markdown
# Courtside Domain Configuration

- Status: proposed
- Spec version: 0.1.0
- Last updated: 2026-08-04

## Purpose

This specification defines the conceptual configuration surface and normative defaults. It does not prescribe a serialization format. YAML examples are illustrative unless a field or value is declared normative in prose.

## Authority and Precedence

Configuration resolves in this order:

```text
normative Courtside defaults
  -> League configuration
    -> Season overrides
      -> frozen Season configuration version
```

More specific values override less specific values only where this specification permits customization. The first authoritative Season Game outcome freezes all result-affecting values into a versioned Season snapshot.

## League Configuration

A League defines:

- one valid IANA timezone;
- supported languages, which must include English and French for this product scope;
- one default language selected from its supported languages;
- League Administrator assignments;
- reusable Venues; and
- League-level defaults for new Seasons.

Illustrative configuration:

```yaml
league:
  timezone: America/Toronto
  languages:
    supported: [en, fr]
    default: en
```

The concrete timezone and default language are League data, not hard-coded product constants.

## Standings Configuration

The standings engine is configurable by Season. Its configuration defines:

- League Points awarded for each authoritative outcome;
- the ordered ranking criteria;
- which competition phases and Game statuses are eligible;
- whether explicit standings adjustments are permitted; and
- how random-draw results are persisted and reused.

The normative default is:

```yaml
standings:
  points:
    win: 2
    loss: 0
  eligible_games:
    phase: regular_season
    statuses: [final, forfeit]
  ranking:
    - league_points
    - point_differential
    - points_scored
    - random_draw
  adjustments:
    enabled: false
```

All numeric ranking criteria above sort descending. `random_draw` is evaluated only for teams still tied after every preceding criterion. Each performed draw records the tied participants, preceding equal criterion values, resulting order, actor or system initiator, timestamp, and applicable Season configuration version. The same unresolved tie context reuses the recorded result.

The initial configurable ranking vocabulary is:

- `league_points`;
- `point_differential`;
- `points_scored`; and
- `random_draw`.

Adding a ranking criterion requires a later accepted specification defining its inputs, ordering direction, tie behavior, and reproducibility requirements.

### Standing Calculations

For each Season Team under the default rules:

```text
wins = eligible authoritative Games won
losses = eligible authoritative Games lost
games_played = wins + losses
league_points = (wins * configured win points) + (losses * configured loss points)
points_for = sum of that team's official eligible Game scores
points_against = sum of opponents' official eligible Game scores
point_differential = points_for - points_against
points_scored = points_for
```

A forfeit contributes its explicit official score. The standings engine does not synthesize one. If standings adjustments are enabled in a future Season configuration, each adjustment must be an explicit audited record rather than a direct edit to derived standings.

## Playoff Configuration

Playoff structure is configurable per Round. Each Round defines:

- a stable Round identity and display order;
- fixed input slots from seeds or named prior-Matchup winners;
- the number of Games in each Matchup;
- `aggregate_points` as the advancement rule; and
- an aggregate-tiebreak policy.

Illustrative configuration:

```yaml
playoffs:
  bracket: fixed
  rounds:
    - id: quarterfinal
      games_per_matchup: 3
      advancement: aggregate_points
      aggregate_tiebreaker: overtime
    - id: semifinal
      games_per_matchup: 5
      advancement: aggregate_points
      aggregate_tiebreaker: overtime
    - id: final
      games_per_matchup: 7
      advancement: aggregate_points
      aggregate_tiebreaker: overtime
```

The example Game counts are not normative League defaults. Every Season must provide the actual Round list and Game count for each Round.

`overtime` is the normative default aggregate-tiebreak policy. It continues the final configured Game after regulation until the Matchup aggregate is no longer tied. The configuration surface is modular so later accepted specifications may add other deterministic policies. An implementation must reject an unknown policy rather than silently falling back.

Round structure and policies become part of the frozen result-affecting Season configuration.

## Game and Venue Configuration

Every Game has:

- a scheduled instant;
- home and away Season Teams;
- a competition phase;
- an optional Venue reference; and
- optional Game-specific venue instructions.

Every Venue has:

- a stable League-local identity;
- a name;
- an address; and
- optional notes.

The League timezone supplies the scheduling interpretation for administrative entry and default display. Stored scheduled instants must remain unambiguous across daylight-saving transitions.

## Statistics Configuration

The concrete statistic vocabulary is deferred until the initial scorekeeping surface is specified. Any later vocabulary must preserve:

- field-level known versus unknown state;
- known zero as a valid value;
- line-level provisional or confirmed verification;
- confirmed partial lines; and
- independence between Player-stat completeness and Game-result authority.

Points may be recorded before other statistics and must not imply that unrecorded fields are zero.

## Localization Configuration

Language selection follows:

```text
saved supported User Account preference
  -> League default language
```

If a requested authored-content translation is missing, Courtside renders the League-default variant. UI and authored content must be capable of English and French variants. Proper names are stored and rendered without automatic translation.

The concrete storage and editorial workflow for translations are deferred to interface and implementation specifications.

## Authorization Configuration

The initial roles are:

- `league_admin`, scoped to one League and persistent across Seasons until revoked; and
- `team_captain`, scoped to one Season Team.

League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. Adding roles or changing their authority requires an accepted specification update.

## Audit Configuration

Audit Records contain:

```text
actor
timestamp
action
previous_value
new_value
reason (optional unless otherwise required)
```

Auditing is mandatory for:

- finalized or forfeited Game-result corrections, with a required reason;
- material Player-stat changes;
- Roster Membership changes;
- Player Management Relationship approvals and revocations;
- League Administrator and Team Captain assignment changes;
- frozen Season configuration amendments; and
- persisted random-draw tiebreak results.

Retention duration, export format, and cryptographic tamper evidence are deferred.
```

### Spec 5: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/decisions/0001-ratify-core-domain.md

Hash: 36a7fc71c098155e2a65d89ebce95c68824841f4c148e94174514ad310bff146

```markdown
# ADR 0001: Ratify the Courtside Core Domain

- Status: proposed
- Spec version: 0.1.0
- Date: 2026-08-04

## Context

Courtside needs a stable conceptual boundary before schema, API, framework, or deployment decisions. Without explicit domain authority, implementations are likely to collapse User Account and Player identity, lose roster history, treat playoff Games as a separate type, make standings depend on incomplete statistics, or encode one League's policies as inflexible implementation rules.

## Decision

Adopt the domain defined by:

- [`../overview.md`](../overview.md);
- [`../lifecycle.md`](../lifecycle.md);
- [`../invariants.md`](../invariants.md); and
- [`../config.md`](../config.md).

The ratified direction is:

1. Season is the competition container, while Team and Player identities persist across Seasons.
2. Season Team and Roster Membership represent Season-specific participation and preserve transfers historically.
3. User Account and Player remain separate, connected through many-to-many approved management relationships.
4. League Administrator authority persists across Seasons; Team Captain authority is scoped to one Season Team.
5. Games use scheduled, postponed, cancelled, in-progress, final, and forfeit lifecycle states; tied authoritative outcomes are prohibited.
6. League Administrators may correct authoritative outcomes with a simple append-only audit record and mandatory reason.
7. Player-stat values distinguish unknown from known zero; lines may be partial and independently provisional or confirmed.
8. Standings derive from authoritative regular-season results under a customizable, versioned engine whose default awards two points per win and ranks by League Points, point differential, points scored, then persisted random draw.
9. Playoffs use a fixed bracket with seeded initial slots, Round-configured multi-Game Matchups, aggregate-points advancement, and configurable aggregate-tiebreak policy defaulting to overtime in the final configured Game.
10. Result-affecting Season configuration freezes at the first final or forfeited Game and can change only by versioned, audited League Administrator amendment.
11. The League owns a timezone, simple reusable Venues, English/French language configuration, and a default language.
12. UI and authored content are localizable; saved user preference overrides the League default, and missing requested content falls back to that default.
13. Media identity is reusable across Game and League Gallery associations.
14. Material administrative changes use the minimum audit fields defined in `config.md`.

## Consequences

- Schema and API work must preserve participation history instead of placing a mutable team reference directly on Player.
- Derived standings and playoff advancement require reproducible configuration versions and audit-aware recomputation.
- Statistics representations must preserve missingness and verification separately.
- Playoff Matchups cannot use conventional games-won best-of logic.
- Interfaces and contracts may be designed later without reopening these concepts unless new requirements create a genuine domain conflict.
- No implementation, contract, or public protocol directories are created by this decision alone.

## Ratification

This ADR remains `proposed` while the specification bundle is drafted and reviewed. It becomes `accepted` only after the bundle contains no unresolved major or minor contained-audit findings and the user approves the audited result. Acceptance does not constitute Whetstone Phase 1 stability or Phase 2 convergence.
```
