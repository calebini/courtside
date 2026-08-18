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
