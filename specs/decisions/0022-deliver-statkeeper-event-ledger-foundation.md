# Deliver the Statkeeper Event Ledger Foundation

- Status: accepted
- Date: 2026-08-30

## Context

The audited Statkeeper specifications require a Game Occurrence to own shared evidence and context,
and require every contained Statistical Event to retain explicit Player attribution, fixed profile
contributions, deterministic identity, immutable provenance, and append-only persistence. Courtside
needs that durable boundary before it can safely add the capture workspace, review, projection, or
publication.

## Decision

Deliver an internal, server-only event-ledger append boundary. It records the first immutable
revision of one human-sourced Game Occurrence, containing one or more already-expanded Statistical
Events. It validates canonical keys, profile event and outcome membership, fixed contributions,
Period and clock shape, Media offsets, participating Teams, appeared Roster Memberships, and
provisioned actor identity. It derives stable occurrence-revision and event identities, serializes
the complete record using the Statkeeper RFC 8785 canonical JSON rules, and advances the ledger
version with the occurrence, contained events, assignments, contributions, and Command Receipt in
one PostgreSQL transaction.

The persistence foundation includes an internal ledger head and participation snapshot that later
session preflight will create. No production route creates those records in this slice. The append
service accepts a trusted server-resolved actor and already-expanded event facts; it is not the
final `record_statkeeper_occurrence` capture command and must not be exposed directly to a browser.
The later capture service remains responsible for authorization, Capture Action expansion,
possession effects, and orchestration through this boundary.

No public API or cross-repository machine-readable contract is created. The internal TypeScript
service and store interfaces are the implementation contract for this slice.

## Consequences

- Event ownership is durable without collapsing compound occurrences into unrelated event rows.
- Identical command retries and identical stable-occurrence reuse cannot duplicate events.
- Changed reuse, stale ledger versions, DNP attribution, unknown profile vocabulary, invalid time,
  and cross-Team attribution reject without partial persistence.
- Exact canonical payload text and its SHA-256 hash remain available for deterministic fixtures and
  future ledger-basis construction.
- Revision, void, projection, publication, post-commit recovery, video-player integration, capture
  UI, role authorization, and member reads remain unimplemented.
- The ledger head and participant snapshot must be integrated into canonical Capture Session
  preflight before any operator-facing recording surface is delivered.
