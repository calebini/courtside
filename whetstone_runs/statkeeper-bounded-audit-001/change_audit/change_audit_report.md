# Change Audit Report

- verdict: needs_revision
- boundary_preserved: False
- failure_reason: None
- recommended_next_action: manual_patch
- source_feedback_path: /Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/statkeeper-bounded-audit-001/change_audit/change_audit_feedback.json

## In-Scope Feedback Counts

- blocker: 0
- major: 1
- minor: 1
- nit: 0

## In-Scope Findings

### fb_lifecycle_abandon_correction - major

- claim: The two target specs use the `abandoned` lifecycle term inconsistently for a post-publication correction working revision.
- evidence: `statkeeper.md` lists `capturing | in_review | verified -> abandoned` and says abandoned closes an unpublished working revision while not removing an earlier published revision. The delivery spec says `abandoned` applies only when the Game has no published revision, and abandoning an unpublished correction returns the session to `published`.
- recommended_change: Align the lifecycle wording so `abandoned` is only a terminal state for never-published sessions, and use a distinct phrase such as `discard correction working revision` for returning a published session from correction review back to `published`.

### fb_event_relationship_primitive - minor

- claim: The capability spec requires profile-defined relationships between Statistical Events when needed, but the initial delivery excludes a separate event-to-event graph without explicitly saying how such profile definitions are handled.
- evidence: `statkeeper.md` says each Statistical Event owns relationships to other Statistical Events in the same occurrence when the vocabulary requires them, and that the profile must define relationships to another event when required. `statkeeper-initial-delivery.md` says compound relationships are represented through shared occurrence identity and does not add a separate event-to-event graph.
- recommended_change: State that the initial delivery profile validator rejects event definitions requiring event-to-event relationships beyond shared occurrence identity, or move explicit event-to-event relationship support to the initial delivery primitives.
