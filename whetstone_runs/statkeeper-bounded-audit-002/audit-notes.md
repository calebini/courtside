# Courtside Statkeeper Bounded Re-audit

## Authorization

The user explicitly requested another bounded Whetstone audit after approving the same 14-file
payload for the immediately preceding bounded audit. The user approves sending this audit-notes
file, every specification listed under Authoritative Inputs, and Whetstone's built-in
`consistency` profile context to the nested Codex Reviewer for this re-audit. Do not inspect or send
unlisted repository files. Do not mutate source specs.

## Audit Mode

Run one lightweight Whetstone `audit-change` consistency review. This is a reviewer-only recheck,
not Phase 1, Phase 2, convergence, or an Editor workflow. Whetstone runner metadata may internally
label the invocation `phase_1`; that does not change the governing `audit_change` workflow and must
not be reported as a source-spec inconsistency.

## Change Intent

Re-audit the Courtside Statkeeper capability and initial-delivery specifications after two narrow
consistency corrections:

1. `abandoned` is now terminal only for never-published Capture Sessions. Discarding a correction
   working revision is a distinct transition that returns the session to `published` without
   changing the latest Publication or member reads.
2. The initial delivery now explicitly rejects League Statkeeping Profiles that require direct
   event-to-event relationship graphs. Initial compound actions relate emitted Statistical Events
   through shared Game Occurrence identity only.

The recheck must verify that both corrections are internally complete, agree between the two target
specs, preserve the accepted Courtside authority boundaries, and introduce no new lifecycle,
command, profile-validation, projection, or test ambiguity.

## Authoritative Inputs

### Target specifications

- `specs/statkeeper.md`
- `specs/statkeeper-initial-delivery.md`

### Accepted comparison authority

- `specs/overview.md`
- `specs/invariants.md`
- `specs/lifecycle.md`
- `specs/config.md`
- `specs/architecture.md`
- `specs/tech-stack.md`
- `specs/authentication.md`
- `specs/role-administration.md`
- `specs/rosters.md`
- `specs/player-stat-lines.md`
- `specs/member-statistics.md`
- `specs/public-portal.md`

## Expected Boundary

- The broader product boundary remains post-Game, human-operated capture against one canonical
  YouTube recording, with mandatory period, Game clock, and media evidence time.
- A Game Occurrence remains the compound evidence-bearing unit; one or more atomic Statistical
  Events remain the projection-bearing facts within it.
- The general capability may support explicit event-to-event relationships in a future delivery,
  but the initial-delivery profile primitives do not. The initial validator must deterministically
  reject any definition that requires such a relationship rather than ignoring or approximating
  it.
- `abandoned` must be reachable only when no Publication exists and must never conceal or replace
  an earlier Publication.
- Beginning a correction preserves the published snapshot while creating a working revision.
  Discarding that correction must be a distinct command and state transition back to `published`,
  valid from every correction working state from which the spec intends disposal.
- Command names, preconditions, persistence invariants, audit behavior, member-read continuity,
  lifecycle prose, transition diagrams, migration sequencing, and verification requirements must
  describe the same behavior.
- The corrections must not weaken dedicated League Statkeeper authorization, server-mediated
  transactions, idempotency, concurrency, audit lineage, manual-points coexistence, partial-value
  semantics, localization, evidence privacy, or the future automation boundary.
- Spreadsheet import, ML implementation, public Player statistics, multi-video capture, and other
  explicitly deferred capabilities remain out of scope.

## Reviewer Questions

1. Is `abandoned` now used consistently as a terminal never-published state everywhere in both
   target specs?
2. Is correction disposal consistently modeled as a distinct return to `published`, including
   command identity, legal source states, retained Publication, audit effects, and member reads?
3. Can an implementer determine whether a correction in each possible working state may be
   discarded, or does any state transition remain underspecified or contradictory?
4. Does the initial profile validator now have an explicit deterministic result for definitions
   requiring direct event-to-event relationships?
5. Do action expansion, projection, migration, deferred-scope, and verification sections preserve
   the shared-occurrence-only initial relationship model?
6. Did either patch create a blocker, major, or minor inconsistency with the accepted comparison
   authority or with another part of the target specs?
7. Does any remaining issue require a product-owner decision rather than a narrow specification
   correction?

## Out Of Scope

- Phase 1, Phase 2, convergence, stability, or certification claims.
- Editor use, automatic patching, source mutation, or apply-back.
- Reopening accepted product choices unrelated to the two corrections.
- Implementation code, migrations, UI design, spreadsheet workflows, or ML delivery.
- Cosmetic changes that do not affect determinism, authorization, privacy, consistency, or
  implementability.

## Requested Report

Report the verdict, `boundary_preserved`, blocker/major/minor counts, every in-scope finding, and
any out-of-scope observation. State whether either original issue remains and whether any new issue
was introduced. Identify exact product-owner decisions only when a narrow consistency correction
cannot resolve the finding. Do not mutate source specs and do not characterize this bounded audit
as convergence.
