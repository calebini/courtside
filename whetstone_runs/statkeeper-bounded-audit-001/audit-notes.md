# Courtside Statkeeper Bounded Audit

## Authorization

The user explicitly approves sending this audit-notes file, every specification listed under
Authoritative Inputs, and Whetstone's built-in `consistency` profile context to the nested Codex
Reviewer. This approval is limited to this bounded audit. Do not inspect or send unlisted
repository files. Do not mutate source specs.

## Audit Mode

Run one lightweight Whetstone `audit-change` consistency review. This is not Phase 1, Phase 2, a
convergence review, or an Editor workflow. The audit is assessment-only and must not mutate any
source specification.

Whetstone may label the nested schema-valid Reviewer invocation with runner metadata such as
`Phase: phase_1`. That is an internal label for the single Reviewer pass, not the active workflow.
The governing workflow is `audit_change`; it does not enter the Phase 1 scheduler, invoke an
Editor, or produce Phase 1 stability state. Do not report that internal label as a source-spec or
scope inconsistency.

## Change Intent

Add Courtside Statkeeper as the primary game-stat capture surface, replacing the current manual
Excel-entry workflow. An operator selects a scheduled Game, confirms participation, reviews a
canonical Game video, maintains possession context, and records timestamped Game Occurrences made
of one or more Statistical Events. Courtside projects those events into member-visible player
statistics and lets authorized members navigate from a statistic to its supporting video moment.

The design must support league-defined, versioned, localized statkeeping terms without baking one
league's legacy vocabulary into the product contract. It must also preserve event-linked evidence
that could support a separately governed future automated-statkeeping training pipeline, without
making machine inference part of the initial delivery.

## Target Specifications

- `specs/statkeeper.md` is the proposed capability and product-boundary authority under review.
- `specs/statkeeper-initial-delivery.md` is the proposed implementation-ready initial delivery
  authority under review.

## Accepted Comparison Authority

- `specs/overview.md` is the accepted domain terminology and scope authority.
- `specs/invariants.md` is the accepted cross-implementation identity, authorization, Game,
  statistics, configuration, localization, media, and audit authority.
- `specs/lifecycle.md` is the accepted Game, result-correction, Player Stat Line, role-assignment,
  and mutation authority.
- `specs/config.md` is the accepted League configuration, statistics, localization,
  authorization, and audit authority.
- `specs/architecture.md` is the accepted dependency, transaction, persistence, and failure
  boundary.
- `specs/tech-stack.md` is the accepted delivery, database, authentication, storage, and adapter
  boundary.
- `specs/authentication.md` is the accepted session, authorization, and secure-mutation boundary.
- `specs/role-administration.md` is the accepted scoped role-assignment authority.
- `specs/rosters.md` is the accepted effective membership and historical Team-attribution
  authority.
- `specs/player-stat-lines.md` is the accepted Player-stat identity, eligibility, completeness,
  verification, mutation, and privacy authority.
- `specs/member-statistics.md` is the accepted member visibility, missing/unknown/zero semantics,
  aggregation, box-score, and detailed-statistics authority.
- `specs/public-portal.md` is the accepted unauthenticated disclosure boundary.

## Expected Boundary

- A League owns versioned statkeeping profiles. Stable canonical keys drive storage, projection,
  validation, and audit; localized labels, including French, are presentation data.
- A dedicated League Statkeeper assignment authorizes capture for its League. Existing
  administrative assignment and secure server-mediated mutation rules remain authoritative.
- One canonical Capture Session exists per Game in the initial delivery. Session preflight derives
  the participating Teams and eligible roster from the selected Game, and the operator explicitly
  declares players who did not play before capture proceeds.
- Every accepted occurrence has mandatory period and Game-clock annotations plus a media evidence
  timestamp. The implementation distinguishes Game time from media time and binds them
  deterministically.
- Possession is explicit operator-maintained context used to optimize the capture surface. It must
  not silently invent statistical facts or weaken validation.
- A Game Occurrence is an auditable compound real-world action containing one or more atomic
  Statistical Events. Correction, voiding, projection, and evidence navigation preserve this
  relationship.
- Statistical projection is deterministic, idempotent, replayable, and transactionally consistent.
  It coexists safely with the already accepted manual points delivery without creating competing
  authoritative records or double counting.
- Missing, unknown, known zero, partial coverage, provisional values, and confirmed values remain
  distinct. An authorized reviewer may publish recorded partial statistics while explicitly
  accepting a documented discrepancy such as missing video coverage.
- Publication does not replace the authoritative Team result and does not infer Game appearance
  merely from roster eligibility. Corrections retain audit history and do not rewrite historical
  Team attribution after transfers.
- Member-visible statistics may link to their supporting video moment. YouTube is an allowed
  initial provider, but provider-specific locators and offsets remain media-reference data rather
  than statistical identity or projection semantics.
- Public-video availability does not expand Courtside's public Player-stat disclosure boundary.
  Member authorization still gates Courtside evidence navigation and statistical reads.
- The initial delivery may retain evidence metadata useful for future machine-learning datasets,
  but automated detection, model training, inference acceptance, and dataset export are separate
  later capabilities with their own governance.
- Spreadsheet import is not part of this capability. A legacy-compatible export may be added later
  but is not a priority or an initial-delivery dependency.
- The initial delivery must be specific enough to begin implementation without inventing domain
  policy, while preserving adapter independence and avoiding premature public-contract expansion.

## Reviewer Questions

1. Do the capability and delivery specs agree on the ownership and cardinality of Capture Session,
   possession, Game Occurrence, Statistical Event, evidence time, and projected statistic?
2. Are occurrence creation, revision, voiding, projection replay, publication, correction, and
   abandonment transitions deterministic and compatible with the accepted Game and Player Stat
   Line lifecycles?
3. Can an implementation distinguish roster eligibility, declared participation, occurrence
   participation, actual appearance, missing coverage, unknown, and known zero without inference?
4. Do period, Game clock, media timestamp, video offset, and evidence navigation rules define one
   unambiguous temporal model, including provider replacement or correction?
5. Are league profile versioning, canonical keys, localization, compatibility, and migration rules
   strong enough to prevent historical reinterpretation after profile edits?
6. Can generic event-derived values and existing manually recorded points coexist without parallel
   authority, double counting, or ambiguous correction ownership?
7. Is partial publication with an accepted discrepancy compatible with existing provisional,
   confirmed, completed-Game, member-visibility, and result-authority rules?
8. Do role assignment, authorization, idempotency, concurrency, audit, transaction, and rejection
   requirements fit Courtside's accepted application-service and database boundaries?
9. Does evidence linking preserve the membership wall and public-portal boundary even when the
   underlying YouTube video is publicly accessible by link?
10. Does the future automation/training boundary retain useful evidence without accidentally
    authorizing dataset creation, model output as fact, or ungoverned Player-media disclosure?
11. Are the migrations, schema invariants, command contracts, read models, and verification
    requirements sufficient to start the first implementation slice without unresolved product
    decisions?
12. Does any blocker, major, or minor correction require a product-owner decision rather than a
    consistency or implementation clarification?

## Out Of Scope

- Phase 1 or Phase 2 convergence, convergence claims, or profile stability claims.
- Editor use, automatic editing, apply-back, or source-spec mutation.
- Implementation code, database migration execution, UI styling, or detailed interaction design.
- Spreadsheet import, spreadsheet-parity validation, or prioritizing legacy export.
- A complete league-specific legacy vocabulary or hard-coded English/French labels.
- Automated computer-vision detection, model selection, model training, inference acceptance,
  dataset export, annotation pipelines, or ML evaluation policy.
- Multiple simultaneous canonical videos, live capture, offline capture, native video hosting, or
  provider-general media ingestion beyond the specified initial boundary.
- Public Player statistics, public evidence navigation, or broader member information architecture.
- New derived statistics, league formulas, leaderboards, or analytics beyond profile-defined event
  emission and aggregation.
- Cosmetic cleanup with no effect on authorization, privacy, determinism, compatibility,
  implementability, or the accepted product boundary.

## Requested Report

Report the audit verdict, `boundary_preserved`, blocker/major/minor counts, and every in-scope
finding. Separate informational suggestions and out-of-scope observations. For any finding that
cannot be corrected without changing product policy, identify the exact user decision required.
Do not mutate any source specification and do not characterize this bounded audit as convergence.
