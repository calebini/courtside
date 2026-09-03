# Deliver Statkeeper Possession Control

- Status: accepted
- Date: 2026-09-03

## Context

Occurrence capture can switch possession automatically, but the backend needs an authorized way
to establish possession, switch it manually, and correct mistakes without rewriting events or
discarding the earlier timeline. The capture experience and delivery specification already require
these operations; this slice supplies their internal runtime and persistence boundaries.

## Decision

Deliver `set_statkeeper_possession` as a server-side application service. Its trusted actor must
currently hold League Statkeeper or League Administrator authority. Every new command checks the
expected ledger version and an editable `capturing`, `in_review`, or `verified` session under the
same session/head locks used by occurrence recording. Identical command replay acknowledges its
original acceptance; changed command reuse rejects. Unauthorized failures disclose no session
state. No browser route or public importable API is introduced.

The explicit change is one of:

- `set_current`: participant Season Team and nonnegative integer Media offset. Establish the first
  sequence or close the current sequence and open the other Team at that offset. Setting the already
  current Team is a rejected no-op, not a historical correction.
- `replace_basis`: the complete intended closed/open sequence list and a required Media offset
  anchoring the correction. The list supplies explicit interval endpoints; the anchor does not
  implicitly move them. This can correct history, override an automatic switch, leave a closed-only
  history, or explicitly restore unknown possession with an empty list. Missing fields, invalid
  Teams/offsets, duplicate sequence identities, overlapping intervals, multiple open sequences, and
  unchanged replacements reject.

Both changes accept an optional reason. Intervals may have gaps; unknown possession is not invented.
Equal timestamps allow immediate switches, including zero-duration closed intervals. Canonical
ordering remains start Media offset then normalized UUID byte order, independent of input order.
Each sequence includes explicit nullable end, ending reason, occurrence cause and cause revision.
Automatic provenance may be retained only for the same sequence identity, Team, start, occurrence,
and occurrence revision from the prior basis. Overriding those facts must explicitly make the
transition manual with null automatic cause. Closing an unchanged automatic interval retains its
start provenance. No possession edit revises, voids, or reattributes an occurrence or statistical
event, and no standalone occurrence attach/split/merge operation is introduced.

Persist each accepted material change as an immutable full `statkeeper_possession_bases` snapshot,
with working revision, accepted ledger version, previous basis identity, operation, actor, time,
Media anchor, optional reason, and complete sequences. PostgreSQL enforces scope, lineage, interval
shape, one-open-sequence and automatic-cause integrity; browser roles have no table access. Missing
basis rows mean initial unknown possession. The latest snapshot for the current working revision is
the working authority; unchanged ledger versions reuse the latest earlier possession basis.

Automatic occurrence switches append through the same basis mechanism in the occurrence transaction.
Historical occurrence replay resolves its original automatic transition from the earliest retained
snapshot containing that cause, not the possibly corrected current basis. The cutover migration
copies legacy sequence rows into one snapshot at the current ledger version and freezes the old
table as an archive. It preserves existing sequence IDs and causes without claiming to reconstruct
pre-cutover snapshots that were never stored. Existing migrations remain unchanged.

Every accepted manual change advances the ledger exactly once, moves `verified` to `in_review`,
and reports review invalidation. The basis, session state, ledger head and command receipt commit
together. No-op/rejected/failed transactions change none of them. Playback progress and its version
remain independent. Snapshot lineage provides possession history; this is not an administrative
Audit Record per click.

Return a SHA-256 basis hash using the existing canonical JSON UTF-8 encoding, with format
`courtside.statkeeper.possession-basis/v1` and the complete normalized sequence fields. This is a
possession-component hash, **not** the full ledger verification/publication hash. The latter must
still include this full sequence basis alongside the remaining required ledger inputs when that
slice is delivered.

## Consequences

- Authorized backend callers can establish and correct possession; occurrence capture consumes the
  corrected basis without direct table writes.
- Immutable full snapshots favor straightforward auditability over compact storage at this MVP
  scale. Read/resume and later publication consumers must use the snapshot authority, not the legacy
  sequence archive, and must preserve prior bases when creating a new working revision.
- Core tests cover canonical identity, interval boundaries, provenance and correction rules.
  PostgreSQL tests cover capture integration, retries, concurrent/stale commands, current authority,
  lifecycle invalidation, rollback, immutable history, browser isolation and populated cutover.
- This slice does not deliver screens, video controls, detailed workspace/resume reads, progress
  saving, occurrence revision/void, projection, review decisions, or publication/recovery. It does
  not change the immutable capture-experience authority or the Decision 0021 MVP deferral.
