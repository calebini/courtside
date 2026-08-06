# Courtside Repository Standard

This repository applies the Cortext component standard incrementally.

## Classification

- `README.md` is orientation.
- `specs/` is normative human-readable design and compatibility promises.
- `contracts/` is machine-readable public agreements.
- `docs/` is explanatory, operational, and developer help.
- `examples/` is working demonstrations.
- `tests/` is executable expectations.
- `notes/` may contain scratch thinking but must not define durable behavior.

## Incremental Buildout

Create the smallest repository shape that honestly supports the current work:

- Always include orientation and the current source of truth.
- Add normative specs as ownership, lifecycle, invariants, configuration, or compatibility commitments become real.
- Add `contracts/` only for machine-readable public agreements.
- Add `docs/` only for help that does not belong in the README.
- Add `examples/` only for runnable demonstrations.
- Add `tests/` only when there are executable expectations.
- Add `src/<package>/protocols/` only when public importable interfaces exist.
- Add `core/`, `adapters/`, `services/`, and `models/` only as those implementation boundaries become real.

Do not create empty architecture solely to anticipate the full component shape.

## Mature Component Shape

When the component has real public interfaces and multiple implementation boundaries, grow toward:

```text
specs/
contracts/
docs/
examples/
scripts/
src/<package>/
  core/
  protocols/
  adapters/
  services/
  models/
tests/
  unit/
  integration/
  contract/
```

## Dependency Rules

- `core/` must remain independent of adapters.
- External services, databases, filesystems, networks, and vendor coupling belong in `adapters/`.
- Orchestration belongs in `services/`.
- Stable public interfaces belong in `protocols/`.
- Schemas, events, API definitions, and compatibility fixtures belong in `contracts/`.
- Cross-repository compatibility changes require updates to the compatibility spec, relevant contracts, contract tests, and changelog.

## Git Identity

Unless explicitly overridden, use:

```text
user.name: calebini
user.email: 9826273+calebini@users.noreply.github.com
```

