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

Path: /Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/member-box-score-audit-001/audit-notes.md
Hash: cc9409ce53eb58ff1fb48619483a48317c1e5708d47fa3ecc6ea2299a56dcd19

# Courtside Member Box Score Contained Audit

## Authorization

The user explicitly approves sending this audit-notes file, every specification listed under
Authoritative Inputs, and Whetstone's built-in `consistency` profile context to the nested Codex
Reviewer. This approval is limited to this contained audit. Do not inspect or send unlisted
repository files. Do not mutate source specs.

## Audit Mode

Run a lightweight Whetstone `audit-change` consistency review, not Phase 1, Phase 2, a convergence
review, or an Editor workflow. The audit is assessment-only and must not mutate source specs.

Whetstone may label the nested schema-valid Reviewer invocation with runner metadata such as
`Phase: phase_1`. That is an internal label for the single Reviewer pass, not the active workflow.
The governing workflow is `audit_change`; it does not enter the Phase 1 scheduler, invoke an
Editor, or produce Phase 1 stability state. Do not report that internal label as a source-spec or
scope inconsistency.

## Change Intent

Extend the accepted authenticated member-statistics experience with a game-centric points-first box
score for every member-visible final or forfeited Game. Show both participating Teams and each
eligible Player's points recording state without inventing appearance, reconciling Player values to
the Team result, or weakening the public and mutation boundaries.

## Authoritative Inputs

- `specs/member-statistics.md` as the member visibility, aggregation, box-score, and delivery
  authority.
- `specs/decisions/0019-deliver-member-player-statistics.md` as the accepted delivery decision.
- `specs/invariants.md` as the cross-implementation Game, Player-stat, and authorization authority.
- `specs/player-stat-lines.md` as Player-stat identity, eligibility, verification, and mutation
  authority.
- `specs/architecture.md` as the server-mediated read-projection boundary.
- `specs/lifecycle.md` as competition eligibility anchor and transfer-history authority.
- `specs/rosters.md` as effective membership and non-overlap authority.
- `specs/public-portal.md` as the unauthenticated disclosure boundary.

## Expected Boundary

- Only admitted authenticated League members may read a member box score; the public portal remains
  Team-level.
- Every member-visible `final` or `forfeit` Game has one game-centric box-score projection.
- The header uses the authoritative Game status and score without deriving, replacing, or
  reconciling it from Player Stat Lines.
- Rows are grouped under the participating Season Team established by each effective Roster
  Membership at the Game competition eligibility anchor.
- The eligible-Player row set describes statistic-recording coverage and does not assert lineup or
  Game appearance.
- A missing Player Stat Line and unknown points display as `not recorded`. Any known points value,
  including zero, displays numerically and independently carries its applicable `provisional` or
  `confirmed` verification label.
- Later transfers do not change historical box-score Team attribution.
- The initial box score exposes no derived Player-points Team total. Any later subtotal or coverage
  value must be explicitly distinguished from the authoritative Team result.
- The same box score may add separately accepted Stage Two fields without creating parallel
  performance records or interpreting unknown as zero.
- Box-score reads grant no profile or statistic mutation authority and expose no Account, email,
  management-relationship, audit, command-receipt, or correction-history data.

## Reviewer Questions

1. Is the eligible row-set rule deterministic for final and forfeited Games under the accepted
   competition-anchor and Roster Membership lifecycles?
2. Can the box score safely distinguish eligibility, a Player Stat Line, a known points value, and
   actual Game appearance without collapsing those concepts?
3. Are absent, unknown, zero, provisional, and confirmed states consistent across the member spec,
   Player Stat Line rules, and invariants?
4. Does any wording allow Player points to replace, reconcile, or be mistaken for the authoritative
   Team score?
5. Is historical Team attribution preserved across transfers and later roster changes?
6. Does the box-score addition preserve member authorization, the public disclosure boundary, and
   League Administrator-only mutation authority?
7. Can Stage Two detailed fields extend this same view without contradicting the points-first
   partial-stat model?
8. Does any blocker, major, or minor correction require a product decision rather than an editorial
   consistency fix?

## Out Of Scope

- Phase 1 or Phase 2 convergence.
- Editor use, automatic editing, or source mutation.
- Implementation code, database migrations, route naming, navigation layout, or styling.
- Tracking starters, substitutions, minutes, lineup, attendance, or actual appearance.
- Stage Two statistic vocabulary, validation formulas, rates, or leaderboards.
- Derived Player-points Team subtotals in the initial delivery.
- Public Player statistics or public box scores.
- Broader member-home information architecture and unrelated member features.
- Cosmetic cleanup with no effect on authorization, privacy, determinism, or implementability.

## Requested Report

Report the audit verdict, `boundary_preserved`, feedback counts, and every in-scope blocker, major,
and minor finding. Separate informational suggestions and out-of-scope observations. For any
finding that cannot be corrected without changing product policy, identify the exact user decision
required. Do not mutate any source specification.

## Specs To Check

### Spec 1: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/member-statistics.md

Hash: eb774a925e5259ce2e5dc11d3f9bf6ee6d93e9dfa28ad88d94717e4eb0cf142e

```markdown
# Authenticated Member Player Statistics

- Status: accepted
- Spec version: 0.2.0
- Last updated: 2026-08-18

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
  and verification state; and
- a completed-Game box score showing both participating Teams and their Player points recording
  status.

The newest available Season may be the initial selection, but the UI must not call it active or
current unless Courtside later accepts such a lifecycle concept. Members may select another
available Season when historical data exists. A transferred Player retains the Team attribution of
each Game; a Season summary may span multiple Season Teams and must not rewrite that history.

Member statistics use completed `final` and `forfeit` Games only. Schedule, authoritative result,
and standings views remain Team-level and continue to use authoritative Game scores rather than
Player Stat Line aggregates.

## Completed-Game Box Scores

Every member-visible `final` or `forfeit` Game has a game-centric box score. Its header shows the
Game date, participating Teams, terminal status, and authoritative final score. The authoritative
Game score is the only Team result value; it is never calculated, reconciled, or replaced by
summing Player Stat Lines.

For each participating Season Team, the box score groups every Player whose Roster Membership was
effective at the Game competition eligibility anchor. This row set describes statistic-recording
coverage among eligible Players, not a lineup or appearance record. The UI must not say or imply
that every listed Player participated in the Game.

Each Player row displays points availability and value separately from verification:

- no Player Stat Line or unknown points displays as `not recorded`;
- any known points value displays numerically, including known zero as `0`; and
- every known value also displays its independent `provisional` or `confirmed` verification label.

Verification never changes the numeric display, and a numeric value never implies a verification
state. In particular, both provisional zero and confirmed zero display as `0` with their applicable
verification label.

A Player Stat Line remains attributed through the Roster Membership that established Game
eligibility, including after a later transfer. The box score must not substitute a Player's current
Season Team for that historical attribution.

The points-first box score does not display a derived Player-points Team total because partial and
unknown collection could make it appear comparable to the authoritative Game score. A later UI may
show an explicitly labeled recording subtotal or coverage indicator only if it cannot be mistaken
for the Team result.

The member experience provides a path to the same box score from completed Game context and from a
Player Game-log entry. Exact route naming and presentation layout remain delivery choices.

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

A known provisional value may appear in the Player Game log or completed-Game box score with a
clear `provisional` label. It is excluded from confirmed totals, averages, and leaderboard rank. A
UI may show a separate pending subtotal, but it must not combine provisional and confirmed values
into an apparently authoritative total.

## Stage Two: Detailed Statistics

Detailed basketball statistics are a later additive stage. Stage Two extends the existing Player
Stat Line identity rather than creating a second performance record. Each added statistic remains
nullable so unknown differs from known zero, and the line may remain partial while only some fields
are available.

The member UI must reveal detailed fields only after their vocabulary, validation, aggregation,
and collection workflow are separately accepted and delivered. The same completed-Game box score
may then add the accepted detailed-stat columns; it must not create a parallel performance record
or render unavailable fields as zero. Each aggregate must define and expose its own known-value
coverage. Detailed leaderboards, appearance counts, minimum sample sizes, and derived rates require
explicit rules and must not be inferred from the points-first leaderboard.

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
leaderboard, Player discovery, Player Game logs, and completed-Game box scores. English and French
labels are required, and Game dates render in the League timezone. The read model may aggregate
authoritative records for delivery but does not become an editable source of truth.

Member home-page organization, notifications, comparisons, badges, charts, exports, fantasy-style
features, public Player pages, detailed statistics, and member statistic corrections remain
deferred. Future member features must reuse this admission and read-authorization boundary unless a
later accepted specification changes it.
```

### Spec 2: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/decisions/0019-deliver-member-player-statistics.md

Hash: 24ce43bccb0e01a2d8ce59a95534042e3272ee828317405721348c98dc975109

```markdown
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
```

### Spec 3: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/invariants.md

Hash: 170536661d43dab83e3598c5947898ba79244be031d99758ca0fe3092a01c9c0

```markdown
# Courtside Domain Invariants

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

These rules must remain true across implementations, schemas, APIs, recalculations, imports, corrections, and administrative operations.

## Identity and Participation

A User Account and Player are distinct. A Player exists independently of User Accounts and team participation. A Team persists independently of any one Season. Season-specific roster, captain authority, Games, and performance attach to Season Team rather than directly to Team. At most one Season Team connects the same Team and Season. A Player may not have overlapping effective Roster Memberships for different Season Teams in the same Season. Transfers preserve historical membership, Game, and Player Stat Line attribution. A User Account may manage a Player only through an approved Player Management Relationship. Player management is many-to-many. Player Stat Line eligibility is evaluated against the Game competition eligibility anchor, and later scheduling, finalization, forfeiture, or result correction does not change historical attribution.

## Authorization

League Administrator authority is scoped to one League and persists across Seasons until revoked. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap, and the final active League Administrator cannot be revoked. Team Captain authority is scoped to exactly one Season Team. Only a League Administrator may delete an eligible unused Season, approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign or revoke League Administrator authority after bootstrap, assign or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts. Approved Player Management Relationships grant authority only to update the linked Player's `display_name` and `profile_photo`; this includes an individual member updating the photo of their own linked Player. Team Captain authority grants no independent core mutation authority in Phase 1. An authenticated and provisioned Account with an active League Administrator Assignment, active Team Captain Assignment, or approved Player Management Relationship may read every Player's member-visible statistics in the same League; open registration and `requested` or `revoked` relationships grant no such access, including declined requests persisted as `revoked`. Read visibility never grants Player profile or statistic mutation authority. Role and management-relationship changes are audited. Unauthorized mutations and unpermitted lifecycle transitions are rejected without mutation and produce the required rejection report.

## Season Retention

A Season with any dependent domain record cannot be deleted. Season deletion never cascades to
Season Teams, Games, Roster Memberships, configuration versions, Team Captain assignments, durable
League records, or append-only history. An accepted unused-Season deletion preserves the complete
prior Season value in one append-only Audit Record, and concurrent attempts produce at most one
material deletion. Used Seasons remain authoritative records until a separately accepted retention
or archival lifecycle applies.

## Games and Results

A Game belongs to exactly one Season. Home and away Season Teams are distinct and belong to the Game Season. A `final` or `forfeit` Game has authoritative non-tied score and a winning team consistent with that score. Non-authoritative statuses do not contribute to standings or completed playoff aggregates. Tied Games are prohibited; regulation ties continue through overtime until resolved. A `forfeit` has an explicit official score; derived systems never invent one. Correcting an authoritative result preserves previous value in append-only audit history and recomputes every affected projection. Regular-season and playoff Games are the same entity type distinguished by phase and optional Matchup association. `cancelled`, `final`, and `forfeit` are terminal except that authoritative result corrections may modify score or declared winner of `final` or `forfeit` Games while preserving status. A playoff correction conflict must be resolved in the same administrative action as the correction or the correction is rejected without mutation. Accepted halted correction resolutions make affected slots or Matchups halted in the current projection, exclude conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resume only when replacement authoritative outcomes exist under corrected bracket participants.

## Player Statistics

A Player Stat Line belongs to exactly one Game, Player, and Roster Membership establishing eligibility. Unknown and known zero are distinct. Completeness and verification are independent. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown. Player-stat completeness never affects standings eligibility or playoff advancement. Team points for, points against, and result-derived Team Statistics use authoritative Game score, not the sum of Player Stat Lines. A member box score uses the authoritative Game score unchanged, groups Players by eligibility-attributed Season Team, distinguishes absent, unknown, provisional, and confirmed recording states, and never treats its eligible-Player row set as proof of appearance. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action. Member totals, rates, and leaderboard rank use confirmed known values only; provisional values remain visibly provisional and unknown values contribute neither a numeric value nor a denominator observation. Roster eligibility alone never counts as a Player appearance.

## Standings

Standings are derived and cannot be directly edited. Only eligible authoritative regular-season Game outcomes and explicit configuration-permitted adjustment records may influence standings. Under defaults, games played equals wins plus losses, league points equal wins times two, and point differential equals points for minus points against. Default descending ranking order is league points, point differential, points scored, then random draw. A loss awards zero League Points. Random draw is used only when all earlier criteria remain tied. A random-draw result is persisted and audited and must not change because standings are viewed or recomputed from unchanged inputs. Exactly one persisted random-draw result may exist for a stable tie context. An idempotent retry, replay, duplicate request, or recalculation returns the existing result and artifact identity. An attempt to persist a different result for the same tie context is rejected without another draw or authoritative mutation. A standings projection identifies the frozen Season configuration version used. Playoff Games do not affect regular-season standings.

## Playoffs

A Playoff Bracket uses a fixed advancement graph and does not reseed. Initial Matchup participants resolve from seeds; later participants resolve from winners of fixed prior Matchups. A Matchup contains the Round-configured number of ordinary Games. Every configured Matchup Game is played to an authoritative outcome; early series termination based on Games won is prohibited. Advancement is determined by aggregate authoritative points, not Games won. The aggregate winner is the participating team with greater sum of authoritative Game points after configured Games and any aggregate-tiebreak overtime. Default aggregate-tiebreak overtime continues the final configured Game until the aggregate tie is broken. Aggregate-tiebreak points are part of the authoritative final Game score. A Matchup advances only from authoritative Game scores. A Matchup with incomplete outcomes must not advance automatically, and an attempted correction creating unresolved participant conflict is rejected before authoritative state changes. Accepted correction resolutions that halt advancement are deterministic by canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy resume conditions.

## Configuration and Reproducibility

The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

An ordinary pre-freeze standings update may alter only the accepted point values and ranking order. It must preserve all non-edited and unknown accepted configuration fields exactly, must leave `random_draw` last, and must not award a win less than or equal to a loss. No ordinary write path may alter mutable result configuration after the Season has a frozen configuration version.

## Localization

English and French are supported languages. The League default is exactly one supported language. A saved supported user preference overrides the League default. Missing requested localized content falls back to the League default. UI strings and authored content are localizable; proper names remain language-neutral. Dates and times render in the selected language but use the League configured timezone unless a future accepted specification introduces viewer-local scheduling.

## Venues, Media, and Audit

A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries. Accepted playoff-configuration amendment resolution reports identify the prior and amended configuration versions, changed playoff result-affecting fields, halted or affirmed slots or Matchups, conflicted downstream Games retained as historical records, current advancement effect, resume condition when halted, and canonicalized amendment-resolution identity used for deterministic retries.
```

### Spec 4: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/player-stat-lines.md

Hash: 86ad4027f0fb9db3a4e02d831a83d93bfc1fa21e5e0a1f7fe343b8e763223ed1

```markdown
# Courtside Points-First Player Stat Lines

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This slice delivers League Administrator entry and verification of Player points for an eligible
Game participant. It establishes the durable Player Stat Line lifecycle without pretending that
the later detailed-stat vocabulary is already available.

## Identity and Eligibility

A Player Stat Line belongs to exactly one Game, Player, Season Team, and Roster Membership. The
Roster Membership must connect that Player and Season Team, must be effective at the Game
competition eligibility anchor, and must belong to one of the Game participants. At most one
Player Stat Line exists for the same Player and Game.

Only Games with a competition eligibility anchor may receive a Player Stat Line. The initial
delivery surface exposes entry after a Game becomes `final` or `forfeit`, although the domain and
persistence rules also support an anchored `in_progress` Game for a later live workflow.

## Points, Completeness, and Verification

`points` is an optional nonnegative integer. A missing value is unknown and is never interpreted as
zero. Known zero is stored explicitly. The initial points-only line is always `partial`; adding a
points value does not claim that rebounds, assists, or another later statistic are known.

Verification is independent of completeness. A League Administrator may save changed points as
`provisional` or explicitly verify the submitted values as `confirmed`. Changing or clearing a
confirmed points value returns the line to `provisional` unless that same authorized command
explicitly confirms the replacement. A confirmed partial line therefore means only that its known
values have been checked.

Player point totals are not required to equal the authoritative Team score. Missing participants,
partial collection, score-sheet adjustments, and future statistic categories must not block an
official Game result. Team points for, points against, standings, and playoff advancement continue
to use the authoritative Game score exclusively.

## Mutation and Audit

An active League Administrator for the Game League may submit one idempotent batch containing
eligible Roster Membership identities and their points values. The service re-reads the Game,
authority, eligibility anchor, memberships, and current lines in one transaction. Duplicate,
ineligible, cross-League, unanchored, unauthorized, invalid, and unchanged submissions reject
without mutation.

Every changed line writes an append-only Audit Record containing its prior and new points,
completeness, verification status, version, actor, timestamp, and optional batch reason. The batch
and all of its line changes commit atomically with one Command Receipt. Retrying identical accepted
content reuses the receipt; reusing its command identity for different content is rejected.

## Delivery and Privacy Boundary

The initial UI is an expandable Player-points form attached to each completed Game in the
authenticated Games workspace. It groups eligible Players by participating Team, shows unknown as
a blank input and known zero as `0`, and shows the saved verification state. This slice does not
publish Player names, profile photos, Player Stat Lines, or game logs to the public portal and does
not grant Team Captains or approved Player managers statistics mutation authority. Authenticated
member visibility is separately governed by [`member-statistics.md`](member-statistics.md).

Detailed statistics, complete-line marking, live entry, spreadsheet import, Player aggregation,
and public Player pages remain deferred. The accepted member read experience may aggregate and
rank the delivered points field and present eligibility-aware completed-Game box scores without
changing this mutation boundary or deriving the authoritative Team score from Player values.
```

### Spec 5: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/architecture.md

Hash: 5845c283b9ec441a854201e1729faf8c72f0d6bbdf073c3297e8b5b5e29fef35

```markdown
# Courtside Initial Architecture

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This specification translates the accepted domain and technology declarations into the initial modular-monolith boundaries. It owns implementation dependency direction and the first executable vertical slice; it does not define a public API.

## Dependency Direction

`src/courtside/core` contains deterministic domain values and calculations. It may depend on the TypeScript and Node.js standard libraries but not on Next.js, React, Vercel, Supabase, PostgreSQL clients, environment variables, or network APIs.

`src/courtside/services` coordinates authorized use cases and transactions through explicit internal ports. It may depend on the core but not on concrete adapters or Next.js delivery code.

`src/courtside/adapters` implements service ports for PostgreSQL and later external systems. Adapters may depend on services and core. PostgreSQL constraints and triggers protect cross-path integrity but do not become an alternate location for orchestration policy.

`src/app` is the Next.js delivery surface. It may invoke application services but does not own domain rules. No write-capable HTTP endpoint is exposed before Supabase Auth session verification and scoped League Administrator authorization are integrated.

## Transaction Strategy

Authoritative server-side mutations use `node-postgres` with parameterized SQL and an explicitly checked-out client for the full transaction. Runtime connections use a bounded pool configured by the PostgreSQL adapter. Supabase Data API calls are not combined to approximate an authoritative transaction, and PostgreSQL RPC functions are not used as a parallel application-service layer in this slice.

The PostgreSQL adapter connects with a server-only credential. Browser code cannot import the adapter or receive its connection string. Supabase Row Level Security remains enabled with no direct browser domain-table write policies.

## First Vertical Slice

The first slice begins with an existing `in_progress` regular-season Game and an active League Administrator. It accepts one command to finalize that Game with a non-tied authoritative score. In one transaction it:

1. serializes duplicate command handling and reuses an existing receipt for an identical retry;
2. verifies current League Administrator authority;
3. locks the Game and Season records;
4. validates the `in_progress` to `final` transition and authoritative score;
5. creates or reuses the single frozen result-affecting Season configuration version;
6. rejects a configuration-basis conflict without mutation;
7. persists the final Game result and the configuration version used;
8. appends the Game-finalization Audit Record;
9. reads authoritative regular-season outcomes inside the transaction and recomputes standings through the pure domain engine; and
10. persists an idempotent command receipt before commit.

The returned standings projection identifies the frozen configuration version. If every configured numeric criterion remains tied and no persisted random-draw order is supplied, the engine exposes an unresolved stable tie context instead of inventing an order. Performing and auditing the random draw is a later slice; callers must not present an unresolved projection as final ranked standings.

## Persistence Boundary

The initial migration contains only records exercised by the slice: League, User Account, League Administrator Assignment, Season, Team, Season Team, frozen Season Configuration Version, Game, Audit Record, and Command Receipt. It includes participant, status, score, winner, configuration-version, append-only-history, and direct-browser-access protections.

Standings are calculated projections and are not stored as editable rows. This slice recomputes them from authoritative Games on demand. A future cache or persisted projection must remain disposable and identify its configuration version.

## Failure Semantics

Domain, lifecycle, authorization, and idempotency failures roll back the transaction. Rejections identify the entity, current state or condition, requested mutation, actor, violated rule, and that authoritative state was preserved. Infrastructure errors also roll back but remain operational failures rather than domain rejections.

## Deferred Surfaces

The second slice adds the authenticated delivery boundary defined in `specs/authentication.md`: verified Supabase sessions, User Account resolution, current scoped League Administrator checks, a server-mediated Game-finalization action, and a read-only standings projection. Disposable local fixtures make the path demonstrable without serving as production bootstrap.

The third slice adds League Administrator delivery for regular-season Game scheduling and pre-result lifecycle management. Application services own scheduling, rescheduling, postponement, cancellation, and start orchestration through PostgreSQL transaction ports. League-local wall-clock input is resolved by a timezone adapter with ambiguous and nonexistent times rejected. Reusable League-owned Venues are persisted separately from optional Game-specific venue instructions. Every accepted operation is idempotent, rechecks current authority, locks the affected scope, and appends its audit history in the same transaction.

The fourth slice unifies finalization, forfeiture, and correction under the authoritative Game-result transaction. It accepts explicit-score forfeits, preserves terminal status during corrections, requires correction reasons, records a competition eligibility anchor, appends prior and replacement result values, and recomputes standings atomically. The administrative read model exposes completed Games and their result audit history.

The fifth slice adds a public, read-only League portal for schedule, official results, and standings. One PostgreSQL adapter supplies an explicit public projection to fresh localized Server Components. It reuses the pure standings engine, exposes no administrative or identity records, and creates no browser database access or public mutation endpoint.

The sixth slice adds League-owned Player identity and time-effective Roster Membership history. A pure core models name and interval transitions; an application service owns current authorization, timezone resolution, idempotency, audit, addition, ending, and atomic same-Season transfer; PostgreSQL enforces same-League ownership, half-open non-overlap, and terminal closed history. A localized protected roster desk exposes the workflow without publishing Player records or granting member and Team Captain authority.

The implementation now includes a staging-only League Administrator bootstrap service and PostgreSQL adapter behind a guarded, plan-first operator command. It still defers production authorization for that command, playoff correction conflicts, configuration amendment, persisted random draw, playoffs, detailed and public Player statistics, public Player profiles, media, spreadsheet import, public mutation APIs, and production deployment. Points-first Player Stat Lines extend the same pure-core, application-service, transactional PostgreSQL, authenticated Server Action, and append-only audit boundaries without affecting authoritative Game results or standings. Player Management Relationships, private member profile management, authenticated League-wide points visibility, Account onboarding, and initial staging authority extend the accepted boundaries through their dedicated specifications. Remaining surfaces must extend rather than bypass them.

The accepted member-statistics delivery boundary reuses server-verified authentication and derives a
read-only League-scoped projection from authoritative Games, Roster Membership attribution, and
Player Stat Lines. It admits only Accounts with a current trusted League relationship, exposes no
browser database access, and keeps public League projections Team-level. Confirmed known points
drive totals and rank; provisional and unknown values retain their distinct states at delivery.
The same projection supplies completed-Game box scores grouped by eligibility-attributed Season
Team while preserving the authoritative Game score independently of Player-stat coverage.

Initial Season setup follows the same delivery shape: pure name validation and normative defaults in core, current scoped authorization and idempotent orchestration in a service, one PostgreSQL transaction for Season, Audit Record, and Command Receipt persistence, and a server-derived actor at the bilingual administrator boundary. It deliberately leaves Team participation and playoff Rounds empty rather than copying local fixture data into a real League.

Post-bootstrap role administration follows the same authority boundary. Exact registered email resolves a provisioned target Account inside the transaction; the service owns current administrator authorization, idempotency, final-administrator preservation, atomic captain reassignment, and audit; PostgreSQL independently serializes final-administrator revocations and permits at most one active captain per Season Team. Team Captain assignments remain markers and do not grant new mutation paths.

Unused Season deletion follows the same delivery and transaction boundaries. The service owns exact
typed-name confirmation, current scoped authorization, dependency rejection, idempotency, and the
deletion audit. The PostgreSQL adapter locks the Season, checks current dependent records, deletes no
related rows, and relies on restrictive foreign keys to reject a racing or alternate-path delete that
would orphan history. League Setup exposes only the server-mediated operation.

Team setup extends that boundary with batch reconciliation of durable League Teams and Season Team participation. The service serializes changes through the affected Season or Season Team, reuses existing Team identity, audits each material creation or removal, and rejects removal when authoritative dependencies exist. PostgreSQL independently enforces Team-name and Season-participation uniqueness plus dependent-record referential integrity.

Venue administration extends the same boundary with durable League-owned Venue creation, audited correction, and terminal archival. Archived Venues remain available to existing Game read models but are excluded by the scheduling adapter from new or replacement schedules. PostgreSQL enforces normalized field bounds, immutable League ownership, and case-insensitive active-name uniqueness.

Pre-freeze Season configuration follows the same dependency direction. A pure core validates and merges only the accepted standings controls without dropping future configuration fields. The service owns current League Administrator authorization, Season locking, frozen-state and no-op rejection, full-value audit, and command idempotency. The PostgreSQL adapter performs the mutation transaction, and a database trigger independently prevents ordinary `result_configuration` changes once a frozen version is attached. The bilingual administrator surface becomes read-only at freeze and does not expose the deferred versioned-amendment workflow.

Administrator delivery is organized through a shared authenticated layout and route-specific Server Components. League Desk is a bounded state-driven overview; Games owns recurring competition operations; People and access retain their dedicated workflows; and League Setup owns infrequent configuration. These routes may reuse internal read models, but they invoke the same application services and do not become new domain or persistence boundaries. Active-Season selection is derived only from the authenticated administrator projection.
```

### Spec 6: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/lifecycle.md

Hash: a3b8aada9d4b9b24f152d43d0678f46f8b5f537e0d63b36748f0f57a1404886a

```markdown
# Courtside Domain Lifecycles

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This specification defines state transitions and authority timing for Season configuration, rosters, Games, Player Stat Lines, permissions, standings, and playoff Matchups.

## General Lifecycle Failure Rule

For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, current state or condition, requested state or mutation, actor, and violated lifecycle rule. In-scope invariant, configuration validation, and authorization failures follow the same preserve-state rule and must identify the affected scope, attempted mutation, violated rule, and confirmation that authoritative records, persisted projections, and configuration versions remain unchanged. Auditing rejected attempts is not required unless the audit policy for that surface explicitly requires it.

Terminal states named in a lifecycle have no outgoing transitions except separately listed post-terminal corrections or administrative amendments. A post-terminal correction preserves terminal status unless this specification explicitly says otherwise.

## Core Mutation Authority

Mutation authority is evaluated at request time and scoped to the affected League, Season, Season Team, Player, or Game. League Administrators may create or delete an eligible unused Season; create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap, and an attempted revocation that would leave the League without an active League Administrator is rejected without mutation. Team Captain assignments are auditable scoped role markers and grant no independent core mutation authority in Phase 1. Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are deterministic projections and are not directly edited by any actor.

An approved Player Management Relationship grants authority to update only the linked Player's `display_name` and `profile_photo`. The approved account may belong to the Player themself or to another authorized manager, so an individual member linked to their own Player may update that Player's photo. League Administrators may update the same two fields for administrative support. No Player Management Relationship grants authority over identity linkage, roster membership, eligibility, statistics, Game outcomes, standings, playoff advancement, Season configuration, roles, or account credentials. Attempts outside this surface use the general authorization-failure rule.

For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field write an Audit Record preserving the prior and new value with actor, timestamp, action, and optional reason. The Audit Record is the required operational artifact for inspecting accepted Player profile field changes; no separate profile-change history substitutes for that mandatory audit surface in Phase 1.

## Season Configuration Lifecycle

A Season begins with mutable configuration derived from League defaults and Season overrides. The first accepted transition of any Season Game to `final` or `forfeit` freezes a single versioned snapshot of all result-affecting Season configuration for that Season. The freeze operation is idempotent per Season; later or retried authoritative Game transitions reuse the existing frozen version rather than creating another first version. Concurrent first-freeze attempts accept exactly one snapshot. A competing attempt reuses the created snapshot when it depends on the same result-affecting configuration basis, or is rejected without mutation when it depends on a different mutable configuration basis. All standings and playoff calculations identify the frozen configuration version they use. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record. Recalculation under an amended version is deterministic and applies to every affected derived projection, while historical versions remain available.

While `frozen_configuration_version_id` is absent, an active League Administrator may submit an audited ordinary configuration update limited to the accepted pre-freeze surface. The action locks the Season, preserves every configuration field outside that surface, and commits the changed configuration, complete prior/new audit values, and idempotent command receipt atomically. An unchanged, unauthorized, unsupported, or concurrently frozen request is rejected without mutation. Once a frozen version exists, both the application service and persistence boundary reject an ordinary `result_configuration` change; a direct record edit is not a substitute for a versioned amendment.

For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of exact result-affecting values captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that do not affect standings or playoff outcomes. Equal canonical basis identities reuse the existing frozen version. Unequal canonical basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.

## Unused Season Deletion Lifecycle

A Season created in error may be deleted only by an active League Administrator for its League and
only while it has no dependent domain records. Season Teams, Games, Roster Memberships, frozen
configuration versions, Team Captain assignments, and any later Season-owned record make deletion
ineligible. The operation requires exact typed confirmation of the current Season name, performs no
cascading cleanup, and never deletes durable League data or append-only audit history.

An accepted deletion locks and rechecks the Season and dependency state, appends a `season.deleted`
Audit Record containing the prior Season value and optional reason, deletes the Season, and persists
the idempotent Command Receipt in one transaction. The deleted name becomes available for reuse.
Concurrent requests accept at most one material deletion. Used Seasons have no deletion transition;
their future end or archive lifecycle requires a separate accepted specification.

## Roster Membership Lifecycle

A Roster Membership has an effective start and may have an effective end. A Player becomes eligible for a Season Team when a membership becomes effective. A Player may not have overlapping effective memberships for different Season Teams in the same Season. A transfer ends the prior membership before the new membership begins. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective. A Player Stat Line must reference the membership that established eligibility for that Game.

A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change expected timing but does not create Player Stat Line eligibility. Finalization and later authoritative result corrections do not change the anchor or rewrite attribution. A closed membership interval is terminal; later participation requires a new non-overlapping interval.

## Game Lifecycle

The normative Game statuses are `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit`.

A new Game begins as `scheduled`. While it remains `scheduled`, a legal reschedule mutation may replace its scheduled instant without changing status and must preserve the required scheduling-change history. A `scheduled` Game may become `postponed`, `cancelled`, `in_progress`, or `forfeit`. A `postponed` Game may return to `scheduled` with a revised scheduled instant, become `cancelled`, or become `forfeit`. Direct rescheduling without a status change is rejected from every status other than `scheduled`; a postponed Game must use the explicit `postponed` to `scheduled` transition. A `cancelled` Game has no authoritative competitive outcome and does not affect standings or playoff aggregates. `cancelled` is terminal and replacement competition requires a new or separately scheduled Game.

Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Administrative scheduled-instant entry, including initial scheduling and rescheduling, must identify exactly one instant in the League configured IANA timezone before the Game is mutated. A local scheduled value that is ambiguous during a daylight-saving overlap, nonexistent during a daylight-saving gap, or otherwise cannot identify one unambiguous instant is rejected without mutation unless the administrative input supplies enough offset or disambiguation information to identify exactly one instant. The rejection report must identify the Game, attempted scheduled value, League timezone, actor, violated scheduling rule, and confirmation that authoritative Game state and schedule history remain unchanged. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

An `in_progress` Game may become `final` after an authoritative non-tied score is recorded. An `in_progress` Game tied at the end of regulation continues through overtime until one team wins. A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and official non-tied score. `final` and `forfeit` are authoritative terminal outcome statuses and do not return to prior statuses. Detailed Player statistics are not required for `final` or `forfeit`.

## Authoritative Result Corrections

A League Administrator may correct the score or declared winner of a `final` or `forfeit` Game. A correction preserves authoritative status, writes an Audit Record containing actor, timestamp, action, previous value, new value, and mandatory reason, triggers deterministic recomputation of affected standings, Season-Team result statistics, playoff aggregates, and playoff advancement, and never silently rewrites prior audit history.

If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. A correction action that cannot resolve every affected downstream participant slot is rejected without mutating authoritative state, and no unresolved participant-resolution conflict state is persisted. Existing downstream authoritative Game records remain historically visible and are not silently changed.

The resolution report for an accepted correction must identify the corrected Game, affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are to apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under corrected bracket participants, or to apply the correction and explicitly affirm the existing downstream participant path as an audited administrative exception. Every accepted resolution writes an Audit Record, and the correction is rejected unless the chosen resolution is applied to every affected downstream participant slot in the same administrative action.

When the chosen resolution halts affected downstream advancement, the halted condition is observable in the current playoff projection and resolution report rather than as a new Matchup lifecycle state. The projection must mark each affected participant slot or dependent Matchup as halted by the accepted correction resolution, identify the corrected participant source that must be replayed, and exclude conflicted downstream authoritative Games from current advancement calculations for the corrected path while retaining those Games as historical authoritative records. A halted path resumes only when replacement authoritative outcomes exist for every affected configured downstream Game whose participant slots match the corrected bracket participants and fixed slot sources. Recomputations before that condition is satisfied must continue to report the same halted slots and must not advance through them.

The deterministic identity of an accepted correction resolution is composed of the corrected Game, the prior authoritative result value, the prior authoritative result audit or version identity being corrected, the corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same material correction action must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. A later correction of the same Game back to a previously used authoritative value is a distinct resolution identity when it corrects a different prior authoritative result value or prior result audit or version identity. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.

## Player Stat Line Lifecycle

Verification and completeness are independent. A Player Stat Line may be created or updated as `provisional` before or after the Game result becomes authoritative. A line becomes `confirmed` when its currently known values have been verified. A confirmed line may remain partial. Updating a confirmed value returns the changed line to `provisional` unless the same authorized action explicitly verifies the replacement. `confirmed` is not terminal; the only permitted post-confirmation mutation is an authorized value update that returns the changed line to `provisional` unless explicitly verified in the same action.

Each statistical value is either known, including known zero, or unknown because it has not been recorded. Human-readable completeness labels are derived from which expected values are known and are not substitutes for field-level known/unknown state. Adding later details does not change Game-result authority. Material stat changes are audited with actor, timestamp, action, previous value, new value, and optional reason.

## Player Management Lifecycle

A User Account-to-Player management relationship follows `requested -> approved -> revoked`. A User Account may create a `requested` relationship for itself and a Player. A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action. Only an approved relationship grants management authority. League Administrators approve and revoke relationships. Approval and revocation are audited. Multiple approved accounts may manage one Player, and one account may manage multiple Players. Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutation. `revoked` is terminal for that relationship; later access requires a new request and approval.

## Role Assignment Lifecycle

League Administrator assignment is scoped to one League and persists across Seasons until revoked. After bootstrap, League Administrators assign, reassign, and revoke League Administrator assignments for that League, but an assignment mutation that would leave the League without an active League Administrator is rejected without mutation. A Team Captain assignment is scoped to one Season Team, and League Administrators assign, reassign, and revoke Team Captain authority. Role assignment changes are audited. Ending a Season does not convert Team Captain assignment into authority over a later Season Team. A revoked role assignment is terminal; later authority requires a new assignment or reassignment under League Administrator authority.

## Standings Lifecycle

Standings are recomputed projections, not independently mutable records. Only eligible `final` and `forfeit` regular-season Games contribute. Any authoritative eligible result or permitted adjustment change invalidates the prior projection. Recalculation uses the applicable frozen Season configuration version. A random-draw tiebreak is performed only after all preceding ranking criteria remain tied. Each draw result is persisted and audited; rendering or recalculating unchanged inputs reuses it.

A random-draw tie context has a stable identity composed of Season, frozen Season configuration version, ranking step or criterion that invoked `random_draw`, tied Season Teams in canonical identity order before the draw, and equal preceding criterion values. Canonical identity order is ascending byte order of each Season Team immutable canonical domain identity as assigned when the Season Team is created. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result is rejected as a deterministic conflict without another draw. League Administrators do not override or replace the persisted draw in Phase 1.

## Playoff Matchup Lifecycle

Initial fixed-bracket Matchup slots resolve from configured Season seeds. Later Matchup slots resolve from winners of named prior Matchups. A Matchup contains the number of Games configured for its Round, and every configured Game must reach `final` or `forfeit` before normal advancement. The Matchup aggregate is the sum of authoritative scores. The team with greater aggregate advances through the fixed bracket. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into aggregate-tiebreak overtime until the aggregate tie is broken, even when the regulation score of that individual Game was not tied. Overtime points remain part of the final Game score and therefore the Matchup aggregate. Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or unknown tiebreak policy must not advance automatically and must report the violated rule.
```

### Spec 7: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/rosters.md

Hash: 3cecf79cfc74ee5d8c7bfbd14f67b2c786760ba3bb1e42708a10f5ba8e32482c

```markdown
# Courtside Players and Rosters

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-08

## Purpose

This slice delivers League Administrator management of durable Player identity and Season-specific Roster Membership history. It does not connect Players to User Accounts, grant Team Captain mutation authority, publish Player information, or implement profile photos and Player statistics.

## Player Identity

A Player belongs to one League and persists independently of any User Account, Team, Season, or Roster Membership. `display_name` is required, language-neutral, trimmed, free of control characters, and at most 120 Unicode code points. Player names are not unique because different people may share a name.

An active League Administrator for the Player League may create a Player or replace its display name. Accepted creation and display-name replacement are audited. A replacement must change the normalized value.

## Roster Membership Intervals

A Roster Membership connects one Player to one Season Team and carries an effective interval. `effective_from` is inclusive and `effective_until` is exclusive. An open membership has no `effective_until`. Ending requires an instant strictly after `effective_from`. A closed membership is terminal and is never reopened or rewritten.

Season Team participation is established by the separately accepted Team setup workflow. It may be removed only before any Roster Membership, Team Captain assignment, Game, or other authoritative record depends on it. Removing participation never deletes the durable Team identity.

A Player may not have overlapping Roster Membership intervals within the same Season, including duplicate overlap on the same Season Team. This database-enforced invariant prevents both conflicting team participation and duplicate active membership. The Player and Season Team must belong to the same League.

Adding a membership opens a new interval. Ending closes an open interval. Transferring atomically closes one open interval and opens a new interval for a different Season Team in the same Season at the identical effective instant. A transfer is rejected if another interval would overlap the new membership. Historical memberships remain visible to League Administrators.

## Authority, Time, and Audit

Every command re-resolves the authenticated User Account and active League Administrator assignment. Local effective date-times are interpreted in the League timezone and rejected when they identify no instant or more than one instant. Commands are idempotent through persisted command receipts.

Accepted Player and Roster Membership mutations write append-only Audit Records containing the actor, timestamp, action, prior value, new value, and optional reason. Unauthorized or invalid commands reject without mutation and preserve authoritative state.

## Delivery Boundary

The initial delivery surface is the authenticated `/{locale}/admin/rosters` route in English and French. It supports Player creation and display-name replacement, membership addition, ending, transfer, current roster inspection, and historical interval inspection.

Public Player profiles, public Team rosters, User Account-to-Player Management Relationships, member self-service, profile-photo storage, Team Captain workflows, roster imports, and Player Stat Lines remain deferred.
```

### Spec 8: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/public-portal.md

Hash: 692f56c6e79427c3b97c6b3d194b6d37b70bcf901aedc9040065c7fa327d71e7

```markdown
# Courtside Public Portal

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-08

## Purpose

The public portal provides read-only League information without requiring a User Account. It is a delivery surface over authoritative Courtside records and derived projections, not a separate source of truth.

## Public Information

Every League and Season in the current product phase is public by default. Public pages may expose League and Season names, League timezone, neutral Team names, Game schedule and lifecycle status, competition phase, Venue name and address, Game-specific venue instructions, authoritative final or forfeit scores, and derived standings.

Schedule dates and times render in the selected English or French interface language and the League configured timezone. A postponed or cancelled Game remains visible with its current status. An `in_progress` Game is identified as in progress, but Courtside does not invent or expose a live score before an authoritative result exists.

Results expose only `final` and `forfeit` Games with their current authoritative scores. Corrections appear as the corrected current result. The public portal does not expose prior result values, correction reasons, Audit Records, actors, User Accounts, assignments, command receipts, configuration internals, or rejection reports.

Standings are the same deterministic projections used by administrative surfaces. They use authoritative eligible regular-season results and identify unresolved final tiebreak contexts as provisional rather than inventing a rank.

## Routes and Freshness

English and French routes provide a public home, schedule, results, and standings. The initial route shape is `/{locale}`, `/{locale}/schedule`, `/{locale}/results`, and `/{locale}/standings`. It displays all public Leagues and their Seasons because League slugging and an explicit current-Season lifecycle are not yet accepted domain concepts.

The initial implementation renders fresh database-backed Server Components on each request. Browser code receives rendered public values but no database credential or direct domain-table access. A later cache may be introduced only with explicit invalidation that preserves observable freshness after accepted Game mutations.

## Deferred Privacy Surface

Public Player profiles, profile photos, Player Stat Lines, Player game logs, Media, and member identity are not part of this slice. The authenticated points-entry workflow does not change that boundary. Their publication requires an accepted privacy and visibility policy before delivery. Private Leagues or Seasons, tenant hostnames, League slugs, and custom public branding are also deferred.

The authenticated member visibility defined in [`member-statistics.md`](member-statistics.md) does
not expand this public boundary. Member Player statistics require an authenticated, provisioned
Account with a trusted League relationship.
```
