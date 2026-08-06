# Courtside Core Domain Contained Audit

## Authorization

The user explicitly requested this Whetstone review. I explicitly authorize sending this audit-notes file and only the following listed specification files to the configured nested Codex Reviewer client for this Whetstone audit-change run:

- `whetstone_runs/core-domain-spec-audit-001/audit-notes.md`
- `specs/overview.md`
- `specs/lifecycle.md`
- `specs/invariants.md`
- `specs/config.md`
- `specs/decisions/0001-ratify-core-domain.md`

This approval is limited to this audit. Do not inspect or send unlisted repository files. Do not mutate source specs.

## Audit Mode

Run a lightweight Whetstone multi-document seed-spec `audit-change` assessment, not Phase 1, Phase 2, convergence review, or an Editor workflow.

Whetstone may label the nested schema-valid Reviewer invocation with runner metadata such as `Phase: phase_1`. That is the runner phase label for the single Reviewer pass, not the audit workflow. The governing workflow is `audit_change`; it does not enter the Phase 1 scheduler, invoke an Editor, or produce Phase 1 stability state.

## Change Intent

Ratify the conceptual core domain for Courtside, a recreational basketball league system, before schema, API, runtime, persistence, or deployment choices. The bundle must form one coherent and implementable domain boundary while remaining technology-neutral.

## Authoritative Inputs

- `specs/overview.md`
- `specs/lifecycle.md`
- `specs/invariants.md`
- `specs/config.md`
- `specs/decisions/0001-ratify-core-domain.md`

## Expected Boundary

- League is the organizational root and Season is the competition container.
- Team and Player identities persist across Seasons.
- Season Team and Roster Membership own season-specific participation and history.
- User Account and Player are distinct and connect through approved many-to-many management relationships.
- League Administrator authority is League-scoped and persistent; Team Captain authority is Season-Team-scoped.
- Final and forfeited Game scores are authoritative independently of detailed-stat availability.
- Tied Game outcomes are prohibited.
- Player-stat values distinguish unknown from known zero; completeness and verification are independent.
- Standings derive from eligible authoritative regular-season scores under versioned customizable rules.
- Playoffs use a fixed bracket, seeded initial slots, Round-configured Game counts, aggregate-points advancement, and configurable aggregate tiebreak defaulting to overtime in the final configured Game.
- English/French localization, League timezone, simple Venues, reusable Media associations, and minimum audit requirements are domain concerns.
- Result-affecting Season policy freezes on the first final or forfeited Game and later changes are versioned and audited.

## Reviewer Questions

1. Do the five documents express one consistent terminology and authority model?
2. Are identity, participation, role, Game, stat, standings, playoff, localization, and audit boundaries conceptually implementable without prescribing schema or API choices?
3. Are all lifecycle transitions and terminal-state effects consistent with the invariants?
4. Are standings and playoff calculations deterministic for identical authoritative inputs, configuration versions, adjustments, and persisted random draws?
5. Does the aggregate-series overtime rule resolve the Matchup aggregate without contradicting the prohibition on tied Games?
6. Are defaults clearly separated from configurable policy?
7. Are any blocker, major, or minor ambiguities still in scope for this domain ratification?
8. Does any necessary correction require a new user product decision rather than editorial clarification?

## Out Of Scope

- Phase 1 or Phase 2 convergence claims.
- Automatic editing or mutation of source specifications.
- Schema, API, event, framework, persistence, hosting, or deployment design.
- Authentication-provider details.
- Full statistics vocabulary.
- Divisions, conferences, and inter-league competition.
- Cosmetic cleanup with no effect on authority, consistency, determinism, or implementability.

## Requested Report

Report verdict, `boundary_preserved`, and all in-scope blocker, major, and minor findings. Separate informational suggestions and out-of-scope findings. If a finding cannot be corrected without changing product policy, identify the exact user decision required.
