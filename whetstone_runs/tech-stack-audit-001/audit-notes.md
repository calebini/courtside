# Change Intent

Assess the proposed Courtside technology-stack declaration before ratification and implementation. The declaration adopts a TypeScript and Next.js modular monolith on Vercel with Supabase-managed PostgreSQL, Auth, and Storage, while requiring server-mediated transactional writes, scoped domain authorization, controlled spreadsheet imports, cache correctness, environment isolation, recoverable media, and executable verification.

# Expected Boundary

- The core domain specifications remain authoritative for terminology, lifecycle, authorization, configuration, audit, standings, playoff behavior, localization, and historical reproducibility.
- Framework and vendor choices remain adapters or delivery mechanisms rather than sources of domain policy.
- User Account remains distinct from Player, and Supabase Auth supplies identity rather than global domain roles.
- Every authoritative multi-record mutation is atomic and produces required audit history.
- Spreadsheet ingestion stages and validates data before applying an idempotent authoritative transaction; AI-generated production DML is prohibited.
- Standings and playoff projections remain derived from authoritative outcomes and the frozen Season configuration version.
- Cached public views cannot knowingly outlive accepted authoritative mutations.
- The declaration should be specific enough to authorize the first implementation slice without prematurely selecting replaceable UI, query, analytics, or observability libraries.
- Repository growth remains incremental and core logic remains independent of adapters.

# Specs To Check

- `specs/tech-stack.md` as the proposed implementation declaration under review.
- `specs/overview.md` as domain scope and terminology authority.
- `specs/lifecycle.md` as mutation and transition authority.
- `specs/invariants.md` as cross-implementation correctness authority.
- `specs/config.md` as configuration, authorization, localization, and audit authority.
- `specs/decisions/0001-ratify-core-domain.md` as the core-domain decision record.

# Reviewer Questions

- Does the technology declaration preserve every material domain authority boundary?
- Are database transactions, RLS, application services, and adapter responsibilities coherent rather than competing sources of policy?
- Can the first game-finalization-to-standings slice be implemented without inventing a conflicting data or authorization model?
- Do localization, caching, media, import, migration, environment, and recovery claims contradict or weaken a domain requirement?
- Are any deferred choices actually blockers to the first write-capable vertical slice?
- Does any wording accidentally authorize direct database mutation paths that bypass lifecycle, audit, idempotency, or configuration-freeze rules?
- Which findings, if any, require a product-owner decision rather than a technical correction?

# Out Of Scope

- Phase 1 or Phase 2 convergence
- automatic editing or source mutation
- database table and column design
- public API contracts
- UI design or styling-system selection
- detailed player-stat vocabulary
- broad redesign of the converged core domain
- implementation work beyond assessing whether the declaration safely authorizes it

# Requested Result

Run a reviewer-only Whetstone `audit-change` consistency check. Report the verdict, whether the boundary is preserved, blocker/major/minor findings, out-of-scope observations, and whether any issue requires a user decision. Do not mutate any source specification.
