# Courtside Statkeeper Bounded Audit 005

## Authorization

The user explicitly requested this bounded Whetstone re-audit after approving the same 14-file
payload for the preceding audits. The user approves sending this audit-notes file, every
specification listed under Authoritative Inputs, and Whetstone's built-in `consistency` profile
context to the nested Codex Reviewer for this read-only audit. Do not inspect or send unlisted
repository files. Do not mutate source specs.

## Audit Mode

Run one Whetstone `audit-change` consistency review. This is a reviewer-only bounded assessment,
not Phase 1, Phase 2, convergence, or an Editor workflow. Internal runner metadata must not be
reported as source-spec workflow state.

## Change Intent

Re-audit the Courtside Statkeeper capability and initial-delivery specifications after aligning the
general capability's event-relationship language with the initial delivery. The capability now
states that related Statistical Events are associated through shared Game Occurrence identity,
that direct event-to-event relationship metadata is future scope, and that the initial profile
validator rejects definitions requiring direct Statistical Event relationships.

Confirm that this patch resolves the independently repeated finding from audits 003 and 004 while
preserving the previously corrected Capture Session abandonment and correction-discard lifecycle.
Also check the full bounded Statkeeper change for regressions against accepted Courtside authority.

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

- The initial delivery has one human-operated Capture Session per anchored Game against one
  canonical YouTube recording.
- Every accepted Game Occurrence has period, Game-clock, and media evidence time and contains one
  or more projection-bearing Statistical Events.
- Initial compound Statistical Events associate only through shared Game Occurrence identity.
  Profiles requiring direct event-to-event relationships are rejected deterministically.
- Direct event-to-event relationship metadata is explicitly future capability and creates no
  ambiguity for initial profile validation, action expansion, persistence, projection, or tests.
- `abandoned` is terminal only when a Capture Session has no Publication. Discarding a correction
  is a distinct transition to `published` that preserves the latest Publication and member reads.
- League-profile versioning, stable canonical keys, bilingual presentation, dedicated League
  Statkeeper authority, secure transactions, audit lineage, concurrency, idempotency, replayable
  projection, manual-points coexistence, partial-value semantics, and evidence privacy remain
  consistent with accepted Courtside authority.
- Spreadsheet import, ML implementation, public Player statistics, multi-video capture, and all
  other explicitly deferred capabilities remain out of scope.

## Reviewer Questions

1. Is the shared-occurrence-only initial relationship model now unambiguous across both target
   specs, including profile definitions, validation, action expansion, projection, deferred scope,
   and verification?
2. Are the general future capability and the initial-delivery restriction clearly separated?
3. Are abandonment and correction-discard states, commands, preconditions, retained artifacts,
   audit behavior, and member-read effects still deterministic and mutually consistent?
4. Do aggregate ownership, temporal evidence, participation, projection, partial publication,
   authorization, localization, privacy, concurrency, idempotency, and manual-stat coexistence
   preserve the accepted authority set?
5. Does any blocker, major, or minor issue remain, and does it require a product-owner decision or
   only a narrow specification correction?

## Out Of Scope

- Phase 1, Phase 2, convergence, stability, or certification claims.
- Editor use, source mutation, automatic patching, or apply-back.
- Implementation code, migrations, UI design, spreadsheet workflows, or ML delivery.
- Reopening unrelated accepted product decisions.
- Cosmetic suggestions without determinism, authorization, privacy, consistency, or
  implementability impact.

## Requested Report

Report the verdict, `boundary_preserved`, blocker/major/minor counts, and every in-scope finding.
State whether the repeated relationship-language issue is resolved and whether the patch introduced
any regression. Separate out-of-scope observations and identify product-owner decisions only when
a narrow consistency correction cannot resolve the issue. Do not mutate source specs and do not
characterize this bounded audit as convergence.
