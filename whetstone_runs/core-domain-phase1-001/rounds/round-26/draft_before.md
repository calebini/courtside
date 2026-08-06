# Courtside Core Domain — Isolated Phase 1.06 Composite

- Run purpose: MVP Phase 1 technical stabilization
- Review mode: vertical
- Profile set: balanced_mvp
- Source status: proposed
- Generated from the five authoritative Courtside domain documents on 2026-08-04

## Provenance and Editing Boundary

This file is an isolated Whetstone candidate assembled from the source documents named below. Reviewer and Editor clients may critique and revise this composite only. They must not inspect or mutate the original repository specs. Source-document markers preserve the apply-back boundary.

The composite must remain technology-neutral. Database schema, API shape, authentication provider, implementation framework, deployment, complete statistics vocabulary, UI design, divisions, conferences, and inter-league behavior are deferred by the approved scope contract.


---

<!-- SOURCE DOCUMENT: specs/overview.md -->

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
- after the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League;
- the initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority; and
- a Team Captain assignment applies to exactly one Season Team and is assigned, reassigned, or revoked by a League Administrator.

For Phase 1, Team Captain is a scoped domain authority marker. It does not by itself grant independent authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

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

---

<!-- SOURCE DOCUMENT: specs/lifecycle.md -->

# Courtside Domain Lifecycles

- Status: proposed
- Spec version: 0.1.0
- Last updated: 2026-08-04

## Purpose

This specification defines state transitions and authority timing for Season configuration, rosters, Games, Player Stat Lines, permissions, standings, and playoff Matchups.

## General Lifecycle Failure Rule

For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.

In-scope invariant and configuration validation failures are rejected under the same preserve-state rule. The rejection report must identify the affected entity or configuration surface, the submitted value or attempted mutation, the actor when applicable, the violated invariant or configuration rule, and confirm that existing authoritative records, persisted projections, and configuration versions remain unchanged.

Authorization failures are rejected under the same preserve-state reporting semantics. The rejection report must identify the actor, affected League, Season, Season Team, Player, or Game scope when applicable, attempted mutation, missing or insufficient authority, violated authority rule, and confirmation that authoritative state and derived projections remain unchanged.

Terminal states named in a lifecycle have no outgoing transitions except those separately listed as post-terminal corrections or administrative amendments. A post-terminal correction preserves the terminal status unless this specification explicitly says otherwise.

## Core Mutation Authority

Mutation authority is evaluated at the time the mutation is requested and is scoped to the League, Season, Season Team, Player, or Game named by the affected record.

- League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.
- Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League. The initial League Administrator bootstrap boundary for a League is outside Phase 1 domain mutation semantics and does not create a general unauthenticated role-assignment path.
- Approved Player Management Relationships grant authority to manage the associated Player profile within later interface specifications. They do not grant authority to approve relationships, change rosters, mutate Game lifecycle status, correct authoritative results, amend Season configuration, or resolve playoff conflicts.
- Team Captain assignments are scoped to one Season Team and are auditable role assignments. In Phase 1 they do not independently authorize core domain mutations unless a later accepted specification grants a specific Team Captain permission.
- Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are produced by deterministic recomputation from authoritative inputs. They are not directly edited by any actor.
- System-initiated recomputation may update derived projections and may reuse or create persisted random-draw results only as allowed by the standings random-draw rules.

## Season Configuration Lifecycle

1. A Season begins with a mutable configuration derived from League defaults and explicit Season overrides.
2. The first accepted transition of any Season Game to `final` or `forfeit` freezes a single versioned snapshot of all result-affecting Season configuration for that Season.
3. The freeze operation is idempotent per Season. Later or retried authoritative Game transitions for that Season must reference the existing frozen version rather than creating another first version.
4. If concurrent first-freeze attempts occur, exactly one snapshot creation is accepted. A competing attempt must reuse the created snapshot when it depends on the same result-affecting configuration basis, or be rejected without mutating authoritative state when it depends on a different mutable configuration basis.
5. All standings and playoff calculations identify the frozen configuration version they use.
6. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record.
7. Recalculation under an amended version is deterministic and applies to every affected derived projection. Historical versions remain available so prior calculations can be explained.

For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of the exact result-affecting values that would be captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that this specification says do not affect standings or playoff outcomes. The canonical basis identity is derived from normalized domain values, not from serialization format, storage order, display labels, or implementation-specific identifiers except stable canonical domain identities where the specification requires them. Collections use their configured order when order is result-affecting and canonical identity order otherwise. Equal canonical basis identities mean the attempted freeze depends on the same result-affecting value set and must reuse the existing frozen version. Unequal canonical basis identities mean the attempted freeze depends on a different mutable configuration basis and must be rejected without mutating authoritative state, persisted projections, or configuration versions.

Result-affecting configuration includes standings points, ranking criteria, Game eligibility, forfeit treatment, playoff Round structure, aggregate advancement, and aggregate-tiebreak policies. League timezone and localization changes do not retroactively change recorded Game instants or previously captured authored-content translations.

After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same action can apply the amendment through the playoff conflict-resolution semantics already required for authoritative result corrections. An amendment action that would change participant slots, Matchup completion, aggregate outcome, or downstream advancement without either preserving the existing authoritative path as an audited administrative exception or halting affected downstream advancement until replacement authoritative outcomes are recorded is rejected without mutating authoritative state.

## Roster Membership Lifecycle

A Roster Membership has an effective start and may have an effective end. Whether an implementation exposes additional labels such as pending, active, or inactive does not change these normative rules:

1. A Player becomes eligible for a Season Team when a membership becomes effective.
2. A Player may not have overlapping effective memberships for different Season Teams in the same Season.
3. A transfer ends the prior membership before the new membership begins.
4. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective.
5. A Player Stat Line must reference the membership that established eligibility for that Game.

A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant for that Game. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant recorded with the forfeiture. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change when the Game is expected to occur, but it does not create Player Stat Line eligibility until the anchor is established. Finalization and later authoritative result corrections do not change the anchor or rewrite existing Player Stat Line attribution. A Player Stat Line is valid only when its referenced Roster Membership was effective for one of the Game's participating Season Teams at the competition eligibility anchor.

A closed membership interval is terminal for that interval. Later participation by the same Player requires a new non-overlapping membership interval rather than reopening historical eligibility.

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
- `cancelled` is terminal. A replacement competition requires a new or separately scheduled Game rather than changing the cancelled Game to another status.

Every scheduled instant is interpreted in the League's configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history, but it must be available to explain rescheduling, postponement, cancellation, and start transitions.

### Competition Transitions

- An `in_progress` Game may become `final` after an authoritative non-tied score is recorded.
- An `in_progress` Game that remains tied at the end of regulation continues through overtime periods until one team wins.
- A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and an official non-tied score. That official score is the source for standings and aggregate calculations.
- `final` and `forfeit` are authoritative outcome statuses.
- `final` and `forfeit` are terminal lifecycle statuses. They do not return to `scheduled`, `postponed`, `cancelled`, or `in_progress`.
- Detailed Player statistics are not required to transition a Game to `final` or `forfeit`.

### Authoritative Result Corrections

A League Administrator may correct the score or declared winner of a `final` or `forfeit` Game. A correction:

1. preserves the authoritative status;
2. writes an Audit Record containing the actor, timestamp, action, previous value, new value, and mandatory reason;
3. triggers deterministic recomputation of affected standings, Season-Team result statistics, playoff aggregates, and playoff advancement; and
4. never silently rewrites prior audit history.

If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. A correction action that cannot resolve every affected downstream participant slot is rejected without mutating authoritative state, and no unresolved participant-resolution conflict state is persisted. Existing downstream authoritative Game records remain historically visible and are not silently changed.

The resolution report for an accepted correction must identify the corrected Game, the affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are:

- apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under the corrected bracket participants; or
- apply the correction and explicitly affirm the existing downstream participant path as an audited administrative exception.

Every accepted resolution writes an Audit Record, and the correction is rejected unless the chosen resolution is applied to every affected downstream participant slot in the same administrative action.

When the chosen resolution halts affected downstream advancement, the halted condition is observable in the current playoff projection and resolution report rather than as a new Matchup lifecycle state. The projection must mark each affected participant slot or dependent Matchup as halted by the accepted correction resolution, identify the corrected participant source that must be replayed, and exclude conflicted downstream authoritative Games from current advancement calculations for the corrected path while retaining those Games as historical authoritative records. A halted path resumes only when replacement authoritative outcomes exist for every affected configured downstream Game whose participant slots match the corrected bracket participants and fixed slot sources. Recomputations before that condition is satisfied must continue to report the same halted slots and must not advance through them.

The deterministic identity of an accepted correction resolution is composed of the corrected Game, the corrected authoritative value, the affected participant slots, the downstream authoritative Games that create the conflict, and the chosen resolution type. Affected participant slots are canonicalized by their fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within the fixed bracket order. Identity equality is based on that canonicalized content, not on traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, or concurrent recomputations for the same resolution identity must return the same projection effect and resolution report. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

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
- `confirmed` is not terminal; the only permitted post-confirmation mutation is an authorized value update that returns the changed line to `provisional` unless explicitly verified in the same action.

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

- A User Account may create a `requested` relationship for itself and a Player.
- A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action.
- Only an approved relationship grants management authority.
- League Administrators approve and revoke relationships.
- Approval and revocation are audited.
- Multiple approved accounts may manage one Player, and one account may manage multiple Players.
- Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutating authoritative state.
- `revoked` is terminal for that relationship. Later access by the same User Account requires a new requested relationship and a new League Administrator approval.

## Role Assignment Lifecycle

- A League Administrator assignment is scoped to one League and persists across Seasons until revoked.
- After the initial League Administrator bootstrap boundary for a League, League Administrators assign, reassign, and revoke League Administrator assignments for that League.
- The initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority.
- A Team Captain assignment is scoped to one Season Team.
- League Administrators assign, reassign, and revoke Team Captain authority.
- Role assignment changes are audited.
- Ending a Season does not convert a Team Captain assignment into authority over a later Season Team.
- A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.

## Standings Lifecycle

Standings are recomputed projections, not independently mutable records.

1. Only eligible `final` and `forfeit` regular-season Games contribute.
2. Any authoritative eligible result or permitted adjustment change invalidates the prior projection.
3. Recalculation uses the applicable frozen Season configuration version.
4. A random-draw tiebreak is performed only after all preceding ranking criteria remain tied.
5. Each draw result is persisted and audited; rendering or recalculating unchanged inputs reuses it rather than drawing again.

A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

## Playoff Matchup Lifecycle

1. Initial fixed-bracket Matchup slots resolve from configured Season seeds.
2. Later Matchup slots resolve from winners of named prior Matchups.
3. A Matchup contains the number of Games configured for its Round; every configured Game must reach `final` or `forfeit` before normal advancement.
4. The Matchup aggregate is the sum of the authoritative scores of its Games.
5. The team with the greater aggregate advances through the fixed bracket.
6. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into one or more aggregate-tiebreak overtime periods until the aggregate tie is broken, even when the regulation score of that individual Game was not tied.
7. The overtime points remain part of the final Game score and therefore the Matchup aggregate.
8. A Matchup's tiebreak strategy is selected by Round configuration; the default strategy is aggregate overtime.

Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or an unknown tiebreak policy must not advance automatically and must report the violated rule. An attempted correction that would create an unresolved participant-resolution conflict is rejected before authoritative state changes.

---

<!-- SOURCE DOCUMENT: specs/invariants.md -->

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
10. Player Stat Line eligibility is evaluated against the Game's competition eligibility anchor, and later rescheduling, finalization, forfeiture completion, or result correction does not change historical Player Stat Line attribution.

## Authorization

1. League Administrator authority is scoped to one League and persists across Seasons until revoked.
2. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after the initial League Administrator bootstrap boundary, which is outside Phase 1 domain mutation semantics.
3. Team Captain authority is scoped to exactly one Season Team.
4. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign, reassign, or revoke League Administrator authority after bootstrap, assign, reassign, or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.
5. An approved Player Management Relationship grants Player-profile management authority only; it does not grant authority over rosters, Game outcomes, standings, playoff advancement, Season configuration, or role assignment.
6. Team Captain authority is an auditable scoped role marker in Phase 1 and grants no independent core mutation authority until a later accepted specification defines such permissions.
7. Role and management-relationship changes are audited.
8. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state and must produce the required rejection report.

## Games and Results

1. A Game belongs to exactly one Season.
2. Home and away Season Teams are distinct and belong to the Game's Season.
3. A `final` or `forfeit` Game has an authoritative non-tied score and a winning team consistent with that score.
4. A `cancelled`, `scheduled`, `postponed`, or `in_progress` Game does not contribute to standings or completed playoff aggregates.
5. Tied Games are prohibited; regulation ties continue through overtime until resolved.
6. A `forfeit` has an explicit official score; derived systems never invent a forfeit score.
7. Correcting an authoritative result preserves the previous value in append-only audit history and recomputes every affected derived projection.
8. A regular-season Game and a playoff Game are the same entity type distinguished by competition phase and optional Matchup association.
9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.
10. A playoff correction conflict caused by an authoritative result correction must be resolved in the same administrative action as the correction; otherwise the correction is rejected without mutating authoritative state.
11. A `forfeit` transition is legal only from `scheduled`, `postponed`, or `in_progress`.
12. An accepted halted playoff correction resolution makes affected slots or Matchups halted in the current projection, excludes conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resumes only when replacement authoritative outcomes exist under the corrected bracket participants.

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
8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw. League Administrators do not replace or override that result in Phase 1.
9. A standings projection identifies the frozen Season configuration version used to produce it.
10. Playoff Games do not affect regular-season standings.

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
10. A playoff Matchup with incomplete authoritative Game outcomes must not advance automatically, and an attempted correction that would create an unresolved participant conflict is rejected before authoritative state changes.
11. Accepted correction resolutions that halt advancement are deterministic by their canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.

## Configuration and Reproducibility

1. The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes for the same Season reuse that frozen version.
2. Concurrent or retried first-freeze attempts compare the canonical result-affecting configuration basis identity; equal identities reuse the existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions.
3. Later amendments require League Administrator authority and an Audit Record.
4. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.
5. Historical configuration versions remain available to explain prior calculations.
6. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic.
7. Configuration cannot enable tied final Games.
8. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

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
6. Required rejection reports identify the entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome.
7. Accepted playoff correction resolution reports identify any halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, the resume condition, and the canonicalized resolution identity used for deterministic retries.

---

<!-- SOURCE DOCUMENT: specs/config.md -->

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

More specific values override less specific values only where this specification permits customization. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions for that Season reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

The result-affecting configuration basis identity used for concurrent or retried first-freeze comparison is the canonical content identity of the values that would be captured in the frozen Season configuration version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values. Equal basis identities reuse the existing frozen version. Unequal basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

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

All numeric ranking criteria above sort descending. `random_draw` is evaluated only for teams still tied after every preceding criterion. Each performed draw records the tied participants, the canonical tied-participant order before the draw, preceding equal criterion values, resulting order, actor or system initiator, timestamp, applicable Season configuration version, and the stable tie-context identity. The same unresolved tie context reuses the recorded result.

The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

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

Round structure and policies become part of the frozen result-affecting Season configuration. After dependent authoritative playoff Games exist, amendments to Round structure, configured Games per Matchup, slot sources, advancement rule, or aggregate-tiebreak policy are subject to the frozen configuration amendment legality rule in `lifecycle.md`.

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

After the initial League Administrator bootstrap boundary for a League, existing League Administrators assign, reassign, and revoke League Administrator authority for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

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
- frozen Season configuration amendments;
- persisted random-draw tiebreak results;
- playoff correction conflict resolutions; and
- scheduling changes, unless the implementation preserves the required scheduling-change history outside Audit Records.

An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.

Retention duration, export format, and cryptographic tamper evidence are deferred.

---

<!-- SOURCE DOCUMENT: specs/decisions/0001-ratify-core-domain.md -->

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
5. Games use `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit` lifecycle states; tied authoritative outcomes are prohibited.
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