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

