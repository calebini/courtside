# Deliver Statkeeper Occurrence Corrections

- Status: accepted
- Date: 2026-09-04

## Context

Courtside can record a Capture Action and correct possession explicitly, but it cannot yet revise
or void a mistaken occurrence through the ledger. The authority specifications require immutable
revision lineage: a correction must preserve the originally captured evidence and events rather
than update or delete them. The MVP correction vocabulary remains record, revise, and void; it must
not imply standalone attach, split, or merge behavior.

## Decision

Deliver server-side `revise_statkeeper_occurrence` and `void_statkeeper_occurrence` services under
the existing Capture Session transaction boundary. Both require a trusted current League
Statkeeper or League Administrator, stable occurrence identity, expected current occurrence
revision identity, expected session ledger version, and optional trim-then-NFC reason of at most
500 Unicode scalar values. They are available only in `capturing`, `in_review`, or `verified`.
Direct correction of `published` is rejected until the separately specified
`begin_statkeeper_correction` creates an editable working revision; `abandoned` remains terminal.

Revise requires a complete replacement Capture Action input: action, evidence timestamp and
window, Period, clock, participant selections, and operator note. It resolves Player selections
through the snapshotted session participants, reuses the same immutable League Profile Version and
pure action-expansion rules as initial recording, and creates the next deterministic occurrence
revision and event identities. An unchanged active replacement is a rejected no-op. Revising a
current void revision is the explicit way to reactivate that occurrence with new active events.

Void retains the current revision's evidence fields in a replacement revision with verification
state `recorded`, disposition `void`, and no active Statistical Events. It does not delete the
earlier events. Voiding an already-current void revision is a rejected no-op. Disposition remains
separate from verification state. Every revision stores and hashes its immediate predecessor and
explicit correction reason or null in the canonical occurrence payload. Initial revision-one
payloads and hashes remain byte-for-byte compatible.

PostgreSQL permits ordered revision numbers greater than one only when they extend the latest
revision for the same session and occurrence. Prior revisions, their events, assignments, and
contributions stay append-only. Current-ledger consumers select the greatest revision number per
occurrence; superseded active revisions no longer contribute merely because their immutable row
retains its historical `active` disposition. Void revisions contribute lineage but no events.

Correct automatic possession consequences in the same transaction. If the current possession
basis is still the untouched automatic switch caused by the occurrence, revise/void may reverse it
to that snapshot's immutable predecessor only when the caused sequence remains open, that switch
is still the latest possession change, and no later current occurrence exists. A revised switching
action is then applied from the restored basis with its new revision as cause. A revised
non-switching action or void retains the restored predecessor. If a later occurrence or possession
change depends on the switch, return `statkeeper.possession.review_conflict`; the operator must use
the explicit possession correction command first. Likewise, an older non-switching occurrence may
not be revised to introduce an automatic switch behind a later occurrence. When an explicit manual
correction has already removed the occurrence's automatic cause, revise/void does not override that
manual possession decision.

Each accepted correction advances the ledger exactly once, invalidates review, changes `verified`
to `in_review`, and otherwise preserves `capturing` or `in_review`. It atomically appends the
occurrence revision, replacement events when active, any necessary immutable possession-basis
snapshot, a core Audit Record with prior/replacement revision facts and attribution, and the
Command Receipt. Failure rolls everything back. Identical accepted retries replay the receipt;
changed command reuse, stale ledger, stale occurrence revision, unauthorized authority, invalid
replacement input, and possession conflicts create no receipt or material state.

## Consequences

- The backend now supports the complete MVP occurrence mutation vocabulary: record, revise, and
  void, while truthfully preserving what each command did.
- Original timestamps, notes, events, contribution facts, automatic possession snapshots, actor,
  and acceptance times remain inspectable for review and future training provenance.
- The component keeps pure revision/canonicalization logic in core, orchestration in services, and
  transactional/structural enforcement in PostgreSQL adapters and migrations.
- No attach/split/merge operation, browser route, video control, review verification, coverage,
  projection, publication, published-correction opening, or member-facing behavior is delivered.
