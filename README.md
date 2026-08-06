# Courtside

Courtside is a seed-stage project in the Cortext ecosystem. Its product scope, ownership boundaries, runtime, and public interfaces have not been ratified yet.

## Source of Truth

- [`specs/overview.md`](specs/overview.md) records the component's current scope and non-goals.
- [`specs/lifecycle.md`](specs/lifecycle.md) defines domain state transitions and authority timing.
- [`specs/invariants.md`](specs/invariants.md) defines rules every implementation must preserve.
- [`specs/config.md`](specs/config.md) defines configurable policy and normative defaults.
- [`specs/repo-standard.md`](specs/repo-standard.md) defines how this repository grows as its boundaries become real.
- `README.md` is orientation, not normative design.

## Repository Shape

The project is at the proposed-domain-spec stage. Directories for implementation, contracts, examples, operational docs, and tests should be added only when the project has real content for them.

## Verify

Run the dependency-free repository check:

```sh
python3 scripts/verify_repo.py
```
