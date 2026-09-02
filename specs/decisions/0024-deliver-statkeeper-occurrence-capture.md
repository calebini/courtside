# Deliver Statkeeper Occurrence Capture

- Status: accepted
- Date: 2026-09-02

## Context

The event-ledger and Capture Session preflight slices establish immutable Profile Versions,
eligible participant snapshots, provider-neutral Media identity, and durable ledger state. The next
vertical slice must turn an operator's Player-and-action input into authoritative statistical facts
without trusting browser-supplied Team, Roster Membership, source, or expanded Event values.

The initial delivery specification also makes possession part of action validity and requires an
automatic switch to commit with its causing occurrence. The operator-facing possession command and
capture workspace are separate delivery boundaries.

## Decision

Deliver the internal, server-only `record_statkeeper_occurrence` application boundary and its
PostgreSQL adapter.

The service accepts a trusted server-resolved actor, a stable command and occurrence identity, the
Capture Session and expected ledger version, one snapshotted Capture Action key, evidence time,
Period and clock annotation, and Player identities by participant role. It resolves current League
Statkeeper or League Administrator authority on every attempt and resolves Players through the
session's immutable participation snapshot.

Pure core expansion validates action availability, required and optional participant slots,
appeared/DNP status, duplicate assignment rules, Team relationships, conditional emissions, fixed
contributions, and the action's possession effect. Source is derived as `human`; direct expanded
Events, Team or membership attribution, and deferred model fields are rejected.

One transaction locks the command and Capture Session, checks optimistic concurrency, appends the
first immutable occurrence revision and contained Events, advances the ledger, applies any
automatic possession switch, returns verified material to `in_review`, and stores the Command
Receipt. Identical command replay returns its receipt. A new command using the same occurrence
identity returns the original result only when the normalized capture input is identical, even when
the retry observes the ledger version created by the original acceptance. Changed reuse and stale
new material reject without partial mutation.

## Consequences

- The final browser-facing capture route can orchestrate one production persistence boundary rather
  than submitting pre-expanded statistical facts.
- Compound Capture Actions remain one Game Occurrence containing one or more Statistical Events.
- An automatic possession switch retains the causing occurrence and revision and cannot be
  duplicated by command or occurrence retry.
- The migration introduces append-only League Statkeeper assignment history and auditable
  Possession Sequence persistence. Assignment-management commands and UI remain deferred.
- `prompt` reports that an operator choice is required and does not mutate possession.
- The separate `set_statkeeper_possession` command remains the boundary for establishing or
  manually correcting possession; it is not invented inside occurrence recording.
- No browser route, UI, revision/void, review, projection, publication, recovery, video-player
  integration, model input, or public cross-repository contract is delivered in this slice.
