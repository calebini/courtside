# Courtside Statkeeper Capture Experience

- Status: proposed
- Spec version: 0.1.1
- Last updated: 2026-08-29

## Purpose

This specification protects the operator experience that makes Courtside Statkeeper useful. It is
normative for the initial post-Game capture workspace and complements the product and domain
authority in [`statkeeper.md`](statkeeper.md) and the engineering contract in
[`statkeeper-initial-delivery.md`](statkeeper-initial-delivery.md).

Statkeeper is not a generic data-entry form placed beside a video. It replaces the split workflow
of reviewing YouTube and separately maintaining a spreadsheet with one high-throughput,
possession-aware, resumable workspace. The operator should be able to watch a Game, identify a
Player and action, and create evidence-backed statistical records without manually copying video
timestamps or repeatedly reconstructing Game context.

When an implementation choice satisfies a backend command contract but weakens an invariant in
this specification, the initial delivery is not product-complete. A deliberate later product
decision is required to relax an invariant here.

## Actor and Operating Context

The primary actor is an authorized League Statkeeper or League Administrator reviewing one
completed Game against one canonical YouTube timeline. The initial workspace is online-only and is
optimized for desktop and tablet-landscape use where video, rosters, actions, recent history, and
review state can remain immediately reachable.

The operator may be interrupted, may hand review to another currently authorized operator, and may
need to publish partial statistics when the recording is incomplete. The workspace therefore
favors fast entry without treating transient browser state as authoritative.

## Experience Invariants

The identifiers in this section are stable traceability keys for delivery requirements and
acceptance tests.

### `CX-01` One Video-linked Workspace

Video playback and statistical capture occur in the same workspace. The operator can play, pause,
scrub, seek, and inspect recent occurrences without moving data through a spreadsheet or a second
entry surface.

Spreadsheet import is not part of capture. A later read-only compatibility export does not become
a second source of truth.

### `CX-02` Game-derived Preflight

Starting a session begins by selecting one anchored completed Game. Courtside derives the League,
participating Season Teams, eligibility-resolved rosters, authoritative score, and active League
Statkeeping Profile. The operator marks Players who did not play and confirms every remaining
eligible Player as appeared before entering the capture workspace.

The preflight surface must make the selected Game, Teams, roster basis, Profile Version, and
canonical YouTube Media clear enough for the operator to catch a wrong selection before recording
an occurrence.

### `CX-03` Possession-aware Prominence

The possessing Team and its eligible appeared roster are visually prominent. Profile-ordered
offensive actions are the primary action set for that Team. The opposing Team, defensive actions,
and an explicit Team or possession override remain immediately accessible; possession is an
accelerator, not a barrier to recording a valid observation.

A profile action may retain possession, visibly suggest a change, or apply an automatic
operator-convenience change. Every suggested or automatic change is visible, immediately
reversible, and reviewable. Possession behavior must not silently rewrite the Player, Team, action,
outcome, occurrence, or Statistical Events already recorded.

### `CX-04` Player-then-action Default

The default pointer flow selects a Player from the prominent roster and then selects a Capture
Action. The equivalent keyboard path may be faster but must create the same durable result.

The successful action creates one Game Occurrence containing the Statistical Events defined by the
snapshotted League Statkeeping Profile. Interface click count does not determine the durable event
model.

### `CX-05` Automatic Evidence Timestamp

When an action is submitted, the workspace captures the current position of the canonical video
timeline automatically. The operator is not asked to copy or type the timestamp as an additional
normal entry step.

The accepted occurrence retains the captured playback timestamp and initial evidence timestamp.
Review may correct the evidence timestamp or add an evidence window without erasing the original
capture value or correction lineage. The server validates the submitted Media Time but does not
claim to independently prove the exact browser playback position at the click instant.

### `CX-06` Mandatory Basketball Time

Every publishable occurrence records one Period and one Game-clock annotation. The annotation is
`exact`, `estimated`, or `unavailable`; estimated values are visibly marked, and unavailable values
require a reason. Missing footage or an unreadable scoreboard must not force the operator to invent
a clock value or prevent an authorized partial publication.

An unavailable clock makes the affected temporal clock coverage incomplete. It does not by itself
make a visible statistical category partial when the play and its statistical facts remain fully
reviewable; temporal and statistical coverage are reported separately and honestly.

The workspace keeps the active Period and Game-clock context ready for repeated entry. An operator
can adjust inherited context before capture and can correct an occurrence during review without
rewriting unrelated occurrences.

### `CX-07` Minimal Compound Input

A Capture Action may emit multiple Statistical Events inside one occurrence. Optional participant
prompts appear only when the selected profile action requires or permits them. A made shot may, for
example, prompt for an optional assisting Player without forcing a separate timestamped entry.

After a successful entry, transient selection clears only as needed for the next rapid action;
playback, possession, Period, and clock controls remain usable.

### `CX-08` Durable Resume

An accepted Capture Session durably retains the current playback position, active Period and clock
context, and current possession or selected participant Team needed to resume the workflow. These
progress values are operational state rather than ledger evidence: saving them does not verify,
publish, or rewrite prior occurrences.

Reloading or resuming the canonical session restores the most recently acknowledged progress and
the current authoritative ledger. Locally retained values may be offered as a clearly provisional
recovery draft but must not be mistaken for accepted content.

### `CX-09` Visible Persistence State

The workspace distinguishes saved, pending, failed-and-retryable, and rejected-with-state-preserved
actions. A transient failure keeps the provisional entry visible and retries with the same command
identity and content. Success is not shown until an authoritative receipt acknowledges the
material write.

Concurrent or stale updates never disappear silently. The operator receives enough safe context to
reload, retry, or make a corrective choice without exposing another operator's private identity.

### `CX-10` Direct Review and Correction

Recent occurrence history is reachable during capture. Selecting an occurrence seeks the video to
its evidence, and review can revise or void the occurrence, correct its Statistical Events, adjust
the timestamp or clock, resolve attribution, and correct possession through immutable lineage.

Undo is not a destructive deletion path. Once evidence has contributed to a Publication, correction
uses a new working revision while the prior Publication remains visible until replacement commit.

### `CX-11` Honest Coverage and Reconciliation

The review surface shows coverage, unresolved attribution, temporal warnings, projection preview,
and Team scoring reconciliation without claiming that the event ledger controls the authoritative
Game score.

An authorized reviewer may publish reviewed partial statistics while accepting a scoring
discrepancy with a nonblank reason. Missing video, obscured play, an unavailable clock, or operator
uncertainty remains visible as partial or unavailable evidence rather than being converted into a
fabricated event, Player assignment, clock value, or known zero.

### `CX-12` League Vocabulary and Localization

Actions, outcomes, participant roles, help, validation messages, and member-facing Statistic labels
come from the session's snapshotted League Statkeeping Profile and are available in English and
French. Changing locale changes presentation, not canonical identity, action expansion, or
projection behavior.

The initial delivery does not hard-code a League's legacy statistic terms into this specification.

### `CX-13` Evidence Navigation after Publication

An admitted member can move from an exposed Player Game value to its contributing occurrences and
Statistical Events and then seek the embedded player or open the corresponding timestamped YouTube
link. The statistical record stores structured Media identity and time; a generated URL is a
navigation form, not the statistical identity.

Unavailable or removed video does not erase the statistic or evidence lineage. Courtside reports
the evidence as unavailable and does not fabricate a working link.

### `CX-14` Training-ready, Human-authoritative Capture

The ledger preserves occurrence evidence, event labels, Period and clock annotations, possession,
human corrections, source provenance, the canonical Media timeline, and Coverage Group
declarations with any supplied gap ranges. These artifacts support later derivation of only those
reviewed uneventful spans that can be established honestly from the retained basis; the initial
delivery does not materialize a separate negative-interval artifact or training dataset. A partial
declaration without bounded gap ranges preserves coarse coverage only and cannot later be treated
as interval-level negative evidence. This preservation goal must not add extra routine clicks to
human capture solely for a speculative model.

Operational collection does not authorize dataset admission, training, evaluation, inference, or
automatic publication. Those capabilities require separately accepted privacy, rights, retention,
quality, monitoring, fallback, and rollback policy. The initial delivery capture workspace accepts
human input only.

## Reference Interaction

The ordinary high-throughput entry path is:

1. resume playback with the accepted Period, clock, and possession context visible;
2. scrub or play to the observed moment;
3. select the Player from the prominent roster;
4. select the localized action;
5. supply only profile-required outcome or optional participant information;
6. submit one occurrence at the automatically captured video timestamp;
7. receive visible save acknowledgement; and
8. continue with possession and playback controls immediately available.

The implementation may combine or reorder transient UI gestures when it preserves the same
durable result and does not add routine timestamp transcription or hide the opposing Team.

## Acceptance Evidence

The initial delivery must exercise at least these end-to-end scenarios:

- English and French capture render the same profile identities with localized labels.
- DNP preflight establishes appeared and did-not-play participation before capture.
- Player-then-action creates one compound occurrence at the player test double's current Media Time
  without a separate timestamp field.
- A possession-changing action visibly updates or suggests the next prominent Team and is
  immediately reversible.
- Reload restores acknowledged playback, Period, clock, possession, recent occurrences, and
  material save state without treating an unsaved local draft as accepted.
- Review seeks directly to evidence, corrects timestamp or attribution through lineage, and leaves
  prior published reads visible until correction publication commits.
- Missing footage can produce an `unavailable` clock annotation, partial coverage, explicit
  discrepancy acceptance, and an honest member evidence state.
- A published member Game value navigates to each contributing occurrence and handles unavailable
  YouTube evidence without removing the statistic.

## Deferred Experience Scope

The initial experience excludes live official scoring, offline capture and merge, multiple
synchronized camera angles, native video upload or transcoding, clip materialization, automatic
Game-clock recognition, scoreboard OCR, spreadsheet import, initial-delivery spreadsheet export,
public Player statistics, model-assisted entry, model training, inference deployment, and automatic
publication. It also excludes a separate capture-only role, reviewer-only role, Statkeeper service,
or public integration API.

These deferrals must remain explicit in delivery specifications. A technical design must not add a
deferred capability merely to make the architecture appear future-proof.
