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
  one recorded points game.
- Roster eligibility does not prove appearance, so the initial denominator is recorded points games
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
6. Are recorded points game denominators and Player transfer attribution deterministic without inventing
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
