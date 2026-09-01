# Deliver Statkeeper Profile and Capture Session Preflight

- Status: accepted
- Date: 2026-08-31

## Context

The Statkeeper event-ledger foundation requires an authoritative preflight path to create its
ledger head and participant snapshot. The audited Statkeeper specification also requires each
Capture Session to retain the completed Game context, an immutable League Profile Version, one
provider-neutral Game Media identity, explicit appeared/DNP declarations, initial review coverage,
and independent material-ledger and operational-progress concurrency state.

The League's historical Evaluation column is not yet defined well enough to implement as a
deterministic rule. The accepted profile contract already excludes arbitrary expressions and
formula execution from the initial delivery.

## Decision

Deliver a server-only Statkeeper Profile activation boundary and Capture Session preflight
boundary.

Profile activation validates the complete declarative definition, bilingual labels, constrained
sum-based projection primitives, fixed event contributions, capture-action expansion references,
period configuration, exactly one `player_points` semantic, canonical content hash, and compatible
reuse of established canonical keys. It stores a monotonically versioned immutable Profile Version,
updates the League's active pointer, and writes its Audit Record and Command Receipt atomically.
It does not install a production default profile or accept executable formulas.

Session preflight accepts a trusted server-resolved actor, a completed eligibility-anchored Game,
one supported YouTube reference, and the complete DNP membership set. It resolves a canonical
provider asset identity, snapshots every eligible Roster Membership as `appeared` or
`did_not_play`, snapshots the active Profile Version, and atomically creates:

- one canonical Capture Session in `capturing` state;
- one provider-neutral Game Media identity and immutable Game association;
- the existing event-ledger head at ledger version one;
- independent progress state at version zero;
- one participation row for every eligible membership; and
- one `not_reviewed` row for every Profile Coverage Group.

Session creation serializes through the locked Game and is idempotent through the shared Command
Receipt boundary. A different command for a Game with an existing canonical session reports the
existing-session conflict without creating another receipt or material mutation.

No browser route is delivered. The internal preflight service verifies that its trusted actor is a
provisioned account; the future authenticated Statkeeper surface remains responsible for binding
the verified server session and rechecking active League Statkeeper or League Administrator
authority before invoking it.

## Consequences

- The event ledger now has one production-capable canonical creation path rather than relying on
  direct fixture inserts.
- Existing sessions remain bound to their immutable Profile Version when the League activates a
  later version.
- YouTube URLs are retained for operator reference while durable evidence identity remains
  provider plus provider asset identity.
- Profile vocabulary remains League-owned and bilingual. This slice does not create a global
  Courtside event catalog.
- The exact League Evaluation rule can be promoted later as an explicitly accepted deterministic
  projection primitive; no placeholder calculation or free-form formula engine is introduced.
- Statkeeper assignment management, authenticated browser binding, operator UI, final capture
  command/action expansion, revision/void, projection, publication/recovery, and video-player
  integration remain outside this slice.
