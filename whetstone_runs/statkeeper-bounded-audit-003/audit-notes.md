# Courtside Statkeeper Bounded Audit 003

## Authorization

The user explicitly requested this bounded Whetstone re-audit after approving the same 14-file
payload for the preceding audits. The user approves sending this audit-notes file, every
specification listed under Authoritative Inputs, and Whetstone's built-in `consistency` profile
context to the nested Codex Reviewer for this read-only audit. Do not inspect or send unlisted
repository files. Do not mutate source specs.

## Audit Mode

Run one lightweight Whetstone `audit-change` consistency review. This is reviewer-only and is not
Phase 1, Phase 2, convergence, or an Editor workflow. Internal runner metadata must not be
misreported as source-spec workflow state.

## Change Intent

Re-audit the Courtside Statkeeper capability and initial-delivery specifications after the final
terminology correction from audit 002. The Capture Session lifecycle now states that `abandoned`
applies only when the Capture Session has no Publication or latest published revision. This aligns
the lifecycle precondition with `abandon_statkeeper_session`, the separate
`discard_statkeeper_correction` command, and the rule that correction disposal returns a session to
`published` without changing its latest Publication or member reads.

The earlier correction that initial delivery rejects profile definitions requiring direct
event-to-event relationships must remain intact. Initial compound actions relate emitted
Statistical Events through shared Game Occurrence identity only.

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

- One Capture Session is the initial aggregate for one anchored Game and may have immutable
  Publications over time.
- `abandoned` is a terminal state only for a Capture Session that has never published.
- A correction working revision is never abandoned. It is discarded through the distinct
  `discard_statkeeper_correction` command, returning the Capture Session to `published` while
  preserving the latest Publication and member reads.
- Lifecycle diagrams, prose, commands, preconditions, persistence invariants, audit behavior,
  member reads, migration sequencing, and verification requirements must use the same artifact
  ownership and transition semantics.
- Game Occurrence remains the compound evidence-bearing unit. Initial-delivery Statistical Events
  may be related by shared occurrence identity but not by a direct event-to-event graph.
- The initial profile validator must reject definitions requiring an unsupported direct event
  relationship rather than silently ignore or approximate them.
- The changes must preserve authorization, transactions, idempotency, concurrency, audit lineage,
  manual-points coexistence, partial-value semantics, localization, evidence privacy, and the
  future automation boundary.
- Spreadsheet import, ML implementation, public Player statistics, multi-video capture, and all
  other explicitly deferred capabilities remain out of scope.

## Reviewer Questions

1. Are Capture Session, Publication, latest published revision, Game, and working-revision
   references now used consistently throughout both target specs?
2. Is every legal abandonment and correction-discard transition deterministic, including source
   states, destination state, retained artifacts, audit effects, and member-read behavior?
3. Is the shared-occurrence-only event relationship boundary explicit and consistently enforced by
   profile validation, action expansion, deferred scope, and verification requirements?
4. Do either of the prior audit findings remain in any form?
5. Did the corrections introduce any new blocker, major, or minor inconsistency with either target
   spec or the accepted comparison authority?
6. Does any remaining issue require a product-owner decision rather than a narrow specification
   correction?

## Out Of Scope

- Phase 1, Phase 2, convergence, stability, or certification claims.
- Editor use, source mutation, automatic patching, or apply-back.
- Reopening unrelated accepted product choices.
- Implementation code, migrations, UI design, spreadsheet workflows, or ML delivery.
- Cosmetic suggestions without determinism, authorization, privacy, consistency, or
  implementability impact.

## Requested Report

Report the verdict, `boundary_preserved`, blocker/major/minor counts, and every in-scope finding.
State explicitly whether either prior issue remains or any regression was introduced. Separate
out-of-scope observations and identify exact product-owner decisions only when a narrow consistency
correction cannot resolve the issue. Do not mutate source specs and do not characterize this audit
as convergence.
