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

Path: /Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/member-statistics-audit-001/audit-notes.md
Hash: a36153af84c6492ccab87b7d4a71f0f68d14b7fa612fa811179756d6af175c32

# Courtside Member Statistics Contained Audit

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

Accept a protected member experience in which every admitted member of a League may view every
Player's member-visible statistics for that League. Preserve the public portal as a Team-level
schedule, result, and standings surface. Deliver points-first aggregation now while keeping
detailed basketball statistics as a later additive stage.

## Authoritative Inputs

- `specs/member-statistics.md` as the new visibility, aggregation, and delivery authority.
- `specs/decisions/0019-deliver-member-player-statistics.md` as the ratification record.
- `specs/authentication.md` as authentication, provisioning, and open-registration authority.
- `specs/player-management.md` as approved relationship and private-profile authority.
- `specs/role-administration.md` as League Administrator and Team Captain assignment authority.
- `specs/player-stat-lines.md` as Player-stat identity, eligibility, verification, and mutation
  authority.
- `specs/public-portal.md` as the unauthenticated disclosure boundary.
- `specs/invariants.md` as cross-implementation identity, authorization, and statistic authority.
- `specs/decisions/0018-deliver-player-points.md` as the points-first delivery decision.

## Expected Boundary

- Authentication and Account provisioning are necessary but not sufficient for member-statistics
  access.
- Initial admission requires an active League Administrator Assignment, an active Team Captain
  Assignment in the League, or an approved Player Management Relationship to a League Player.
- `requested` and `revoked` relationships plus open registration alone reveal no member statistics;
  a declined request is an outcome persisted as `revoked`, not a separate state.
- Every admitted League member can read every Player's member-visible statistics in that League.
- Read visibility grants no Player management or statistic mutation authority.
- Public schedules, results, and standings remain Team-level and disclose no Player Stat Lines or
  game logs.
- The initial member experience is Season-scoped and includes a confirmed-points leaderboard,
  Player discovery, Player summaries, and completed-Game points logs.
- Confirmed known points drive totals, rates, and rank. Known provisional values may be visible only
  when clearly labeled and remain excluded from confirmed aggregates.
- Unknown contributes neither points nor a denominator observation; known zero contributes zero and
  one recorded points Game.
- Roster eligibility does not prove appearance, so the initial denominator is recorded points Games
  rather than Games played.
- Transfer history preserves per-Game Season Team attribution while Player Season totals may span
  multiple Season Teams.
- Stage Two extends the same Player Stat Line identity with nullable detailed fields and requires a
  separately accepted vocabulary, validation, aggregation, and collection policy.
- Member projections exclude Accounts, emails, management relationships, audit history, command
  receipts, correction reasons, and prior corrected values. Existing profile-photo privacy remains
  unchanged.

## Reviewer Questions

1. Is the admitted-member test implementable and consistent with current Account provisioning,
   Player Management Relationship, League Administrator, and Team Captain lifecycles?
2. Does any current spec accidentally grant access to an open registrant or deny an intended
   admitted member?
3. Are read visibility, profile management, and official statistic mutation cleanly separated?
4. Do the public and member disclosure boundaries contradict each other anywhere?
5. Are confirmed, provisional, unknown, and known-zero values handled consistently across entry,
   aggregation, ranking, and display?
6. Are recorded-game denominators and Player transfer attribution deterministic without inventing
   appearance data?
7. Does the points-first member surface remain compatible with a later partial detailed-stat stage?
8. Does any blocker, major, or minor correction require a product decision rather than an editorial
   consistency fix?

## Out Of Scope

- Phase 1 or Phase 2 convergence.
- Editor use, automatic editing, or source mutation.
- Implementation code, database migrations, route naming, or UI styling.
- Broader member-home information architecture and unspecified future member features.
- A general League membership entity beyond the accepted initial trusted relationships.
- Detailed Stage Two statistic vocabulary, formulas, rate qualifications, or leaderboards.
- Public Player pages or public individual statistics.
- Cosmetic cleanup with no effect on authorization, privacy, determinism, or implementability.

## Requested Report

Report the audit verdict, `boundary_preserved`, feedback counts, and every in-scope blocker, major,
and minor finding. Separate informational suggestions and out-of-scope observations. For any
finding that cannot be corrected without changing product policy, identify the exact user decision
required. Do not mutate any source specification.

## Specs To Check

### Spec 1: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/member-statistics.md

Hash: fe1d1e53272afc80a858062743e600235ecce0033c2188bc3885c024421e06cc

```markdown
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
- a Player summary containing confirmed recorded points and recorded-game count; and
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
- a confirmed line with known `0` contributes zero points and one recorded points Game; and
- roster eligibility alone never proves that a Player appeared in a Game.

The UI therefore uses `recorded points games`, not `games played`, until Courtside owns an explicit
appearance statistic. Confirmed total points are the sum of confirmed known points. Points per
recorded game are confirmed total points divided by confirmed recorded points games. Both values
must expose their recorded-game coverage so partial collection is not presented as complete Season
participation.

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
```

### Spec 2: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/decisions/0019-deliver-member-player-statistics.md

Hash: 9bcf2b0cd198fb15d216e3af96605ca005a9fba17aefbec8d5ce80337c06922e

```markdown
# Decision 0019: Deliver Authenticated Member Player Statistics

- Status: accepted
- Date: 2026-08-17

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

Deliver points-first Season leaderboards, Player discovery, Player summaries, and per-Game logs.
Use confirmed known values for totals, rates, and rank; expose known provisional values only as
clearly provisional. Preserve unknown separately from known zero and label the denominator as
recorded points games rather than inferred Games played.

## Consequences

- Viewing all League Players is independent of authority to manage any Player.
- Open registration and pending access requests do not expose member statistics.
- Individual Player statistics remain absent from the unauthenticated public portal.
- The initial leaderboard ranks confirmed total points and preserves statistical ties.
- Stage Two detailed statistics extend Player Stat Lines additively and require a separate accepted
  vocabulary and aggregation policy before delivery.
```

### Spec 3: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/authentication.md

Hash: f1a76c8703604f6ffe0230390e8f79d5fbd497a97e5017bf6c6341eb67bb58b1

```markdown
# Courtside Authentication Delivery

- Status: accepted
- Spec version: 0.3.0
- Last updated: 2026-08-15

## Purpose

This specification defines registration, login, recovery, session verification, User Account provisioning, and the League Administrator bootstrap boundary. It does not grant domain authority through Supabase Auth and does not collapse a login identity into a User Account or Player.

## Login and Registration

The initial user-facing login method is email and password through Supabase Auth. A deployment configuration selects `open` or `closed` registration; missing or unknown configuration fails closed. The local demo selects open registration. Open registration creates authentication identity only and does not grant Player, Team, Season, or League authority.

Registration requires display name, email, language preference, and a password of 8 through 128 characters containing at least one letter and one digit. Supabase owns credentials, confirmation tokens, password policy enforcement, authentication rate limits, and recovery tokens. Courtside does not persist passwords or provider tokens.

The initial production posture is email confirmation before account provisioning. A successful registration that has no confirmed session renders the same check-email outcome whether the email is new or already registered. A later League-code or invitation policy may replace open registration without changing User Account or Player Management identities.

Local development may contain a clearly identified disposable Auth user and matching Courtside fixtures. Local credentials must not be reused outside the local Supabase stack and must never be treated as a production bootstrap mechanism.

## Session Verification

Every authenticated server-rendered page and Server Action verifies the current identity with Supabase Auth. Cookie contents or an unverified local session payload are not sufficient proof of identity. Authentication failure redirects interactive requests to the localized sign-in page without attempting a domain read or mutation.

The verified Supabase user identifier maps to at most one persistent Courtside User Account through `external_auth_id`. Email addresses and authentication-provider metadata are not domain authorization claims.

## User Account Provisioning

Provisioning is a server-side, idempotent operation following successful registration confirmation, authentication callback, or sign-in. It requires a Supabase identity verified by `getUser`, a confirmed email address, and a valid display name. It creates at most one independent Courtside User Account for `external_auth_id`, stores the normalized contact email for authorized administrator review, and stores English or French as the User Account language preference.

Repeated provisioning reuses the existing User Account, synchronizes its verified contact email and the explicitly selected supported language, and does not overwrite its Courtside display name. Provisioning does not create a Player or any Player Management Relationship. A newly provisioned Account must use the request-and-approval workflow in `specs/player-management.md`.

An authenticated but unprovisionable identity is signed out and receives a generic account-preparation failure. Server Components may resolve Accounts but do not provision them as a rendering side effect.

## Password Recovery

Password recovery accepts an email and always returns the same check-email response for invalid syntax, an unknown account, provider rejection, and an accepted request. Recovery links return through a fixed configured Courtside site origin and an allowlisted localized destination. The callback exchanges the single-use provider code for a verified server session; arbitrary `next` destinations are rejected.

Updating a password requires the active recovery session, repeats the registration password policy, and signs out after success. Missing, invalid, or expired recovery state sends the user back to sign-in without revealing account existence or provider details.

## Authorization

Every authoritative mutation resolves the verified external identity to its Courtside User Account and evaluates current scoped assignments from PostgreSQL at request time. The browser never supplies the actor User Account identifier, and a previously rendered administrator page does not prove continuing authority.

An authenticated User Account without an active League Administrator assignment may sign in but receives no League Administrator data or mutation capability. Domain-table reads and writes remain server-mediated; Supabase `anon` and `authenticated` database roles receive no direct access to authoritative Courtside tables in this slice.

## Initial Administrator Bootstrap

Initial bootstrap is an explicit, controlled operational action that selects an already provisioned User Account by its normalized verified contact email and establishes the first League Administrator assignment in one server-side transaction. The action creates the initial League when the deployment contains none, or selects the sole existing League only when its name, IANA timezone, and default language exactly match the requested configuration. A deployment containing multiple Leagues is outside this initial command's scope.

The command is allowed only while the selected League has no League Administrator assignment history. A deployment-wide transaction lock serializes attempts before a League necessarily exists. The accepted transaction creates the League when required, creates the assignment, writes an Audit Record, and stores a Command Receipt. Retrying identical normalized bootstrap content reuses the accepted result even when the operator supplies a new command identity. Reusing a command identity for different content, changing accepted content, or attempting bootstrap after any administrator assignment history exists is rejected without mutation.

The delivered operator command is staging-only, uses the Supabase transaction pooler, verifies that an explicitly confirmed project reference matches the database connection, and performs a read-only plan unless the operator also supplies `--apply`. It does not create a Season, Team, Player, or Auth identity. Those records require separate deliberate setup. The local development fixture is not this bootstrap command. After bootstrap, all administrator assignment changes follow the accepted domain lifecycle and final-active-administrator protection. A production bootstrap remains blocked until this control is deliberately extended and exercised for a production target.

## Secure Mutation Delivery

Game scheduling, rescheduling, postponement, cancellation, start, finalization, forfeiture, and authoritative result correction are delivered through Next.js Server Actions. The actions accept only target references and requested changes from the browser, use server-generated command identities rendered with each form, derive the actor from the verified session, and invoke application services. Application services and PostgreSQL transactions remain the authority for scoped authorization, lifecycle validation, idempotency, scheduling history, configuration freezing, auditing, and standings recomputation.

Invalid input, authentication failure, authorization failure, and infrastructure failure must not leak credentials, raw database errors, or sensitive identity details to the browser.

## Deployment Requirements

Production release requires an explicit site URL, explicit registration mode, working transactional email provider, email confirmation, Supabase authentication rate limits, CAPTCHA or an equivalent abuse control for open registration, and an exercised confirmation and recovery runbook. Local Inbucket delivery is disposable development infrastructure rather than production email.

## Deferred Surface

This slice does not release production authentication, implement invitations, League codes, social login, passkeys, multi-factor authentication, authorize the bootstrap command for production, create Season or Team setup automation, grant direct browser access to domain tables, or change Team Captain and Player Management authority.
```

### Spec 4: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/player-management.md

Hash: 17c57056e6e72f081e9208b7b7fbda5c9009d0090d5392d3411d3407f9c0e4d7

```markdown
# Player Management and Private Profiles

- Status: accepted
- Last updated: 2026-08-08

## Scope

This slice introduces the many-to-many relationship between User Accounts and Players without
making Players or profile photos public. A User Account may manage several Players and a Player
may be managed by several User Accounts.

## Authority and lifecycle

- A Player Management Relationship has exactly one of `requested`, `approved`, or `revoked`.
- A revoked relationship is terminal. A later grant is a new relationship with a new identity.
- At most one requested or approved relationship may exist for an Account and Player pair.
- User-requested access is the normal workflow. An authenticated Account searches the deployment's
  single League Player directory and requests one existing Player created by a League Administrator.
- Player discovery returns no rows until the Account enters a non-empty Player display-name or
  Team-name query. Matching results expose only display name, current Team, and Season context.
  They do not expose profile photos or other private Player data.
- A League Administrator may approve or decline a requested relationship and may revoke an
  approved relationship for a Player in their League. Direct create-and-approve remains a domain
  capability for exceptional administration but is not the primary product workflow.
- Only an approved relationship grants the Account authority to view and update that Player's
  private profile. League Administrators retain equivalent authority for Players in their League.
  This private-profile authority is distinct from the League-wide authenticated statistics
  visibility defined in [`member-statistics.md`](member-statistics.md).
- Initial managed fields are `display_name` and `profile_photo` only.
- Requests, approvals, declines, revocations, display-name changes, and photo changes are audited.
- The League desk may approve or decline selected pending requests as a batch. Each request is
  authorized, committed, and audited independently so a stale or invalid request does not prevent
  valid selections from completing. The result reports successful and failed counts.
- A declined request uses the terminal `revoked` persistence state. A later attempt creates a new
  relationship rather than reopening the declined record.

## Profile photos

- Profile photos are private and are not part of public schedules, results, standings, or rosters.
- Accepted uploads are JPEG, PNG, or WebP images from 1 byte through 1 MiB inclusive.
- Validation checks both the declared media type and the file signature. Original filenames are
  not authoritative and are not retained in object keys.
- Object keys are generated as `<player-id>/<random-id>.<canonical-extension>` in the private
  `player-profile-photos` bucket.
- The database owns the stable object reference, content type, byte size, and update timestamp.
- Delivery uses short-lived signed URLs after application authorization succeeds.
- Upload is completed before the database transaction. If the database write fails, the new
  object is deleted on a best-effort basis. The prior object is deleted only after the new
  database reference commits, also on a best-effort basis. Storage reconciliation remains an
  operational responsibility.

## Initial delivery boundary

The member portal provides My Players, searchable Player access requests, display-name changes,
and photo set, replace, and clear. The League desk centers pending requests with selected batch
approval or decline, shows the confirmed requester email to authorized administrators, and retains
relationship history. Account provisioning is defined in `specs/authentication.md`. Invitations,
multi-League account membership, public Player pages, crop tools, and image transformations are
deferred. Until multi-League account membership exists, the deployment contains one searchable
League boundary.
```

### Spec 5: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/role-administration.md

Hash: c0d8f78b544823fadf98cce746e2429f1f061b22d090a5db72e2cf26a2396ecd

```markdown
# Courtside Role Administration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification delivers ordinary post-bootstrap administration of League Administrator and
Team Captain assignments. It does not expand either role's authority. League Administrators keep
their accepted League-wide authority; Team Captains remain Season-Team-scoped markers with no
independent mutation permissions in Phase 1.

## Assignment Rules

- Only an active League Administrator for the affected League may change either role.
- A target must already have a provisioned User Account. The administrator identifies the target
  by its exact registered email; the interface does not expose a global User Account directory.
- A League may have several active League Administrators. Granting an already-active assignment is
  rejected as a no-op. Revocation is terminal, and a later grant creates a new assignment.
- The final active League Administrator cannot be revoked. This safeguard is enforced in the
  service and independently in PostgreSQL, including concurrent revocation attempts.
- A Season Team has at most one active Team Captain. Assigning a different account atomically
  revokes the prior assignment and creates the replacement. Assigning the current account is
  rejected as a no-op. Revocation is terminal.
- Ending a Season does not transfer captain authority to another Season or Season Team.

## Audit and Delivery

Every accepted grant, reassignment, or revocation writes one append-only Audit Record containing
the actor, affected scope, previous and new assignment values, timestamp, and optional reason.
Commands are idempotent by command identity. The bilingual workflow lives under League Setup as
an infrequent authority control and rechecks authorization on every submission.
```

### Spec 6: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/player-stat-lines.md

Hash: c214ff8e94db748fa5b0a1bc90ceab78644009ad6c1d1363566069799f21248f

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
rank the delivered points field without changing this mutation boundary.
```

### Spec 7: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/public-portal.md

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

### Spec 8: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/invariants.md

Hash: ebce767091d54eff123a400d2db0225185c32646c34a42bffe84199818e133be

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

A Player Stat Line belongs to exactly one Game, Player, and Roster Membership establishing eligibility. Unknown and known zero are distinct. Completeness and verification are independent. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown. Player-stat completeness never affects standings eligibility or playoff advancement. Team points for, points against, and result-derived Team Statistics use authoritative Game score, not the sum of Player Stat Lines. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action. Member totals, rates, and leaderboard rank use confirmed known values only; provisional values remain visibly provisional and unknown values contribute neither a numeric value nor a denominator observation. Roster eligibility alone never counts as a Player appearance.

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

### Spec 9: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/decisions/0018-deliver-player-points.md

Hash: 54e3bcced9355fb8db23d52cf433266e24fb7281a4e87bb857fcecaee2dd476a

```markdown
# Decision 0018: Deliver Points-First Player Stat Lines

- Status: accepted
- Date: 2026-08-17

## Context

Courtside has durable Players, time-effective rosters, competition eligibility anchors, and
authoritative Game results, but it does not yet retain individual performance. The accepted domain
requires unknown to differ from zero, permits partial and provisional statistics, and prohibits
Player-stat completeness from affecting official results or standings.

## Decision

Adopt [`../player-stat-lines.md`](../player-stat-lines.md). Persist one eligibility-attributed Player
Stat Line per Player and Game, initially containing nullable nonnegative points, `partial`
completeness, and independent `provisional` or `confirmed` verification. Deliver an idempotent,
audited League Administrator batch workflow inside completed Games. Continue to derive Team scores
and standings exclusively from authoritative Game results.

## Consequences

- A blank points value remains unknown while `0` is an explicit known value.
- Confirmed values may be corrected without losing history; replacements become provisional unless
  explicitly confirmed in the same command.
- The schema can add detailed nullable statistics later without redefining Player Stat Line identity.
- Public and member-facing Player statistics remain unavailable under this decision alone. Decision
  0019 separately accepts the authenticated member visibility policy while preserving the public
  boundary.
```
