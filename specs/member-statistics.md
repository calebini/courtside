# Authenticated Member Player Statistics

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

Courtside gives admitted League members a shared, read-only view of every Player's recorded
statistics. Public schedules, results, and standings remain Team-level surfaces. Individual Player
statistics belong to an authenticated member experience so the League can make performance visible
and enjoyable without publishing Player records to the open web.

This specification defines the visibility, aggregation, and delivery rules for the initial
points-first experience. It preserves the accepted two-stage collection model: points are delivered
first, while detailed basketball statistics are a later additive stage.

## Member Audience and Authorization

An Account may read member statistics for a League only after authentication, provisioning, and
server-side confirmation of at least one current trusted League relationship:

- an active League Administrator Assignment for that League;
- an active Team Captain Assignment for a Season Team in that League; or
- an approved Player Management Relationship to a Player owned by that League.

A `requested` or `revoked` Player Management Relationship does not grant member-statistics access.
A declined request is persisted in the terminal `revoked` state; `declined` is an administrative
outcome, not a separate authorization state. Open registration alone does not make an Account a
League member. A later general League membership concept may extend this audience only through a
separately accepted specification.

Every admitted member may view every Player's member-visible statistics within the same League.
Viewing a Player never grants management authority over that Player. Profile mutation continues to
require an approved Player Management Relationship or League Administrator authority, and official
statistic mutation remains restricted to League Administrators.

All authorization and reads are server-mediated. Browser code receives only the authorized member
projection and receives no database credentials or direct access to authoritative domain tables.

## Points-First Member Experience

The initial member-statistics surface is Season-scoped and provides:

- a scoring leaderboard across the selected Season;
- a searchable or browsable Player directory with Season Team context;
- a Player summary containing confirmed total points and the number of confirmed recorded points
  games; and
- a per-Game points log containing opponent, Game date, Team attribution, final score, known points,
  and verification state.

The newest available Season may be the initial selection, but the UI must not call it active or
current unless Courtside later accepts such a lifecycle concept. Members may select another
available Season when historical data exists. A transferred Player retains the Team attribution of
each Game; a Season summary may span multiple Season Teams and must not rewrite that history.

Member statistics use completed `final` and `forfeit` Games only. Schedule, authoritative result,
and standings views remain Team-level and continue to use authoritative Game scores rather than
Player Stat Line aggregates.

## Unknown, Zero, and Aggregation

Unknown points and known zero remain distinct at every read boundary:

- a missing Player Stat Line or a line with unknown points displays as not recorded and contributes
  neither points nor a denominator observation;
- a confirmed line with known `0` contributes zero points and one recorded points game; and
- roster eligibility alone never proves that a Player appeared in a Game.

The UI therefore uses `recorded points games`, not `games played`, until Courtside owns an explicit
appearance statistic. Confirmed total points are the sum of confirmed known points. Points per
recorded points game are confirmed total points divided by confirmed recorded points games. Both
values must expose their recorded points game coverage so partial collection is not presented as
complete Season participation.

The initial scoring leaderboard ranks Players by confirmed total points descending. Players with
equal totals share the same rank; a stable presentation order does not break the statistical tie.
A Player appears after at least one confirmed known points value, including a confirmed zero.

A known provisional value may appear in the Player Game log with a clear `provisional` label. It is
excluded from confirmed totals, averages, and leaderboard rank. A UI may show a separate pending
subtotal, but it must not combine provisional and confirmed values into an apparently authoritative
total.

## Stage Two: Detailed Statistics

Detailed basketball statistics are a later additive stage. Stage Two extends the existing Player
Stat Line identity rather than creating a second performance record. Each added statistic remains
nullable so unknown differs from known zero, and the line may remain partial while only some fields
are available.

The member UI must reveal detailed fields only after their vocabulary, validation, aggregation,
and collection workflow are separately accepted and delivered. It must not render unavailable
fields as zero. Each aggregate must define and expose its own known-value coverage. Detailed
leaderboards, appearance counts, minimum sample sizes, and derived rates require explicit rules and
must not be inferred from the points-first leaderboard.

Example future fields such as rebounds, assists, steals, blocks, and fouls are illustrative rather
than accepted Stage Two schema.

## Privacy and Disclosure

The member projection may disclose Player display name, Season Team attribution, completed Game
context, known Player statistics, completeness where relevant, and verification state. It does not
disclose User Account identity, email address, Player Management Relationships, administrative
reasons, Audit Records, Command Receipts, or prior corrected values.

This specification does not make Player profiles, profile photos, rosters, Player Stat Lines, or
game logs public. Profile-photo visibility remains governed by
[`player-management.md`](player-management.md). The unauthenticated portal remains governed by
[`public-portal.md`](public-portal.md).

## Delivery Boundary

The first delivery is a localized, protected, read-only member destination with a points
leaderboard, Player discovery, and Player Game logs. English and French labels are required, and
Game dates render in the League timezone. The read model may aggregate authoritative records for
delivery but does not become an editable source of truth.

Member home-page organization, notifications, comparisons, badges, charts, exports, fantasy-style
features, public Player pages, detailed statistics, and member statistic corrections remain
deferred. Future member features must reuse this admission and read-authorization boundary unless a
later accepted specification changes it.
