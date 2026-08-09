# Courtside Domain Configuration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-07

## Purpose

This specification defines the conceptual configuration surface and normative defaults. It does not prescribe a serialization format. YAML examples are illustrative unless a field or value is declared normative in prose.

## Authority and Precedence

Configuration resolves from normative Courtside defaults to League configuration to Season overrides to frozen Season configuration version. More specific values override less specific values only where permitted. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

The result-affecting configuration basis identity used for first-freeze comparison is canonical content identity of values captured in the frozen version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values.

Canonicalization occurs after resolving normative defaults, League configuration, and Season overrides. Omitted values equal their resolved explicit defaults. Ordered policy fields, including ranking criteria and playoff Rounds, retain their normative order. Semantically unordered identity collections are sorted by ascending byte order of immutable canonical domain identity. Enum values use their exact normative tokens; integers use exact mathematical integer values without display formatting; absent optional values remain distinct from present non-default values unless this specification declares a default. Implementations may choose serialization and hashing mechanisms, but equal canonical content must compare equal and unequal canonical content must compare unequal across implementations.

## League Configuration

A League defines one valid IANA timezone, supported languages including English and French, one default language selected from supported languages, League Administrator assignments, reusable Venues, and League-level defaults for new Seasons. The concrete timezone and default language are League data, not hard-coded product constants.

## Standings Configuration

The standings engine is configurable by Season. It defines League Points for each authoritative outcome, ordered ranking criteria, eligible competition phases and Game statuses, whether explicit standings adjustments are permitted, and how random-draw results are persisted and reused. The normative default awards two points for a win and zero for a loss; eligible Games are regular-season `final` and `forfeit`; ranking is `league_points`, `point_differential`, `points_scored`, then `random_draw`; adjustments are disabled.

All numeric ranking criteria sort descending. `random_draw` is evaluated only for teams still tied after every preceding criterion. Each performed draw records tied participants, canonical tied-participant order before the draw, preceding equal criterion values, resulting order, actor or system initiator, timestamp, applicable Season configuration version, and stable tie-context identity. The same unresolved tie context reuses the recorded result. The stable tie-context identity is composed of Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. An idempotent retry, replay, duplicate request, or recalculation returns the existing result and its artifact identity. An attempt to persist a different result for the same tie context is rejected as a deterministic conflict without another draw or authoritative mutation. League Administrators do not override or replace persisted draws in Phase 1.

The initial ranking vocabulary is `league_points`, `point_differential`, `points_scored`, and `random_draw`. Adding a ranking criterion requires a later accepted specification defining inputs, ordering direction, tie behavior, and reproducibility requirements.

## Standing Calculations

For each Season Team under default rules: wins are eligible authoritative Games won; losses are eligible authoritative Games lost; games played equals wins plus losses; league points equal configured win and loss points; points for and against are sums of official eligible Game scores; point differential is points for minus points against; points scored is points for. A forfeit contributes its explicit official score. If standings adjustments are enabled later, each adjustment must be an explicit audited record rather than direct edit to derived standings.

## Playoff Configuration

Playoff structure is configurable per Round. Each Round defines stable Round identity and display order, fixed input slots from seeds or named prior-Matchup winners, number of Games in each Matchup, `aggregate_points` as advancement rule, and aggregate-tiebreak policy. Example Game counts are illustrative only. Every Season must provide actual Round list and Game count for each Round. `overtime` is the normative default aggregate-tiebreak policy and continues the final configured Game after regulation until the Matchup aggregate is no longer tied. Unknown policies are rejected rather than silently falling back. Round structure and policies are result-affecting frozen configuration and are subject to frozen amendment legality after dependent authoritative playoff Games exist.

## Game and Venue Configuration

Every Game has scheduled instant, home and away Season Teams, competition phase, optional Venue reference, and optional Game-specific venue instructions. Every Venue has stable League-local identity, name, address, and optional notes. The League timezone supplies scheduling interpretation for administrative entry and default display. Stored scheduled instants must remain unambiguous across daylight-saving transitions.

## Statistics Configuration

The concrete statistic vocabulary is deferred until the initial scorekeeping surface is specified. Any later vocabulary must preserve field-level known versus unknown state, known zero as valid value, line-level provisional or confirmed verification, confirmed partial lines, and independence between Player-stat completeness and Game-result authority. Points may be recorded before other statistics and must not imply unrecorded fields are zero.

## Localization Configuration

Language selection follows saved supported User Account preference, then League default language. If requested authored-content translation is missing, Courtside renders the League-default variant. UI and authored content must be capable of English and French variants. Proper names are stored and rendered without automatic translation. Concrete storage and editorial workflow are deferred.

## Account Onboarding Configuration

Each deployment explicitly configures registration as `open` or `closed`; missing and unknown values fail closed. The deployment also supplies one canonical HTTP or HTTPS site origin for confirmation and recovery redirects. Redirect destinations are application allowlists rather than caller-controlled URLs. Open production registration requires email confirmation, provider rate limits, and CAPTCHA or an equivalent abuse control. These deployment controls do not grant domain authority and are not part of frozen Season configuration.

## Authorization Configuration

The initial roles are `league_admin`, scoped to one League and persistent across Seasons until revoked, and `team_captain`, scoped to one Season Team. After bootstrap, existing League Administrators assign, reassign, and revoke League Administrator authority for that League, but cannot revoke the final active League Administrator. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection. Team Captain authority is a scoped role marker in Phase 1. Adding roles or changing authority requires an accepted specification update.

## Audit Configuration

Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, accepted Player `display_name` and `profile_photo` updates, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

An Audit Record for a playoff correction conflict resolution must include resolution type, prior authoritative result value, prior authoritative result audit or version identity being corrected, corrected authoritative value, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Retention duration, export format, and cryptographic tamper evidence are deferred.
