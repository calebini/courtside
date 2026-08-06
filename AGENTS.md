# Courtside Repository Guidance

This repository follows the Cortext component standard incrementally.

## Authority Boundaries

- `README.md` provides orientation.
- `specs/` contains normative design and compatibility promises.
- `contracts/` contains machine-readable public agreements when they exist.
- `docs/` contains explanatory, operational, and developer help when README coverage is no longer enough.
- `examples/` contains working demonstrations.
- `tests/` contains executable expectations.

## Buildout Rules

- Add only the files and directories required by the current maturity of the project.
- Do not create empty implementation layers or contract placeholders.
- Put stable design intent in `specs/`, not `docs/`.
- When public importable interfaces exist, place them in `src/<package>/protocols/`.
- Keep core domain logic independent of adapters and vendor integrations.
- Cross-repo compatibility changes require a compatibility spec, relevant machine-readable contracts, contract tests, and a changelog entry.
- Update `scripts/verify_repo.py` when repository-level invariants become enforceable.

## Git Identity

Use `calebini <9826273+calebini@users.noreply.github.com>` for commits and pushes unless the user says otherwise.

