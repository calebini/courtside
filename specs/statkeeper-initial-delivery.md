# Courtside Statkeeper Initial Delivery

- Status: proposed
- Spec version: 0.2.3
- Last updated: 2026-08-30

## Purpose

This specification turns the proposed [`statkeeper.md`](statkeeper.md) product and domain boundary
into an implementable first vertical slice. It defines the exact configuration primitives, domain
records, commands, lifecycle checks, concurrency rules, projection semantics, persistence
obligations, and delivery behavior for post-Game human statkeeping against one YouTube recording.

The slice replaces spreadsheet entry. It supports one canonical Capture Session per completed Game,
one active versioned League Statkeeping Profile per League, bilingual capture, mandatory video and
Game-clock annotations, a dedicated League Statkeeper assignment, deterministic Player Stat Line
projection, member-visible evidence navigation, and audited correction.

This specification does not prescribe any League's concrete statistic terms. A fixture profile may
be used for development and tests; a real League supplies its own validated profile configuration.

## Product Experience Authority

[`statkeeper-capture-experience.md`](statkeeper-capture-experience.md) is normative for the
operator and member experience delivered by this slice. The command, persistence, or projection
design in this specification is incomplete when it satisfies a backend invariant by weakening a
`CX-*` experience invariant without a separately accepted product decision.

The initial delivery maintains this traceability:

| Experience invariant | Delivery mechanism | Required acceptance evidence |
|---|---|---|
| `CX-01` one video-linked workspace | Delivery Surface and YouTube Media boundaries | Playwright capture without spreadsheet or timestamp transcription |
| `CX-02` Game-derived preflight | `start_statkeeper_session` and participation declaration | DNP and eligible-roster preflight scenario |
| `CX-03` possession-aware prominence | Possession Sequence and profile possession effect | Prominent-Team, opponent override, and reversible switch scenario |
| `CX-04` Player-then-action default | Capture Action expansion into one Game Occurrence | Pointer and keyboard paths produce the same durable event set |
| `CX-05` automatic evidence timestamp | Browser playback capture plus immutable occurrence evidence | Deterministic player test double captures current Media Time without a timestamp field |
| `CX-06` mandatory basketball time | Period and Game-clock Annotation | Exact, estimated, unavailable, regulation, and overtime tests |
| `CX-07` minimal compound input | Required and optional participant slots and Event Emissions | Optional compound credit appears only when configured and supplied |
| `CX-08` durable resume | `save_statkeeper_progress` and `progress_version` | Reload restores acknowledged playback, clock, Period, and possession context |
| `CX-09` visible persistence state | Command Receipt, optimistic concurrency, and retry behavior | Saved, pending, retryable failure, and preserved rejection states |
| `CX-10` direct review and correction | Occurrence revision, void, evidence seek, and correction Publication | Review and published-correction scenarios retain lineage |
| `CX-11` honest coverage and reconciliation | Coverage Group review and discrepancy acceptance on publication | Missing-video partial publication with nonblank reason |
| `CX-12` League vocabulary and localization | Snapshotted bilingual Profile Version | English and French labels preserve canonical identities |
| `CX-13` evidence navigation | Publication contribution mapping and authenticated member evidence navigation with provider seek or link generation | Member value-to-occurrence navigation and unavailable evidence state |
| `CX-14` training-ready human capture | Human source, evidence lineage, canonical Media timeline, and retained Coverage declarations and gap ranges | Model-input rejection and deterministic negative-evidence derivation tests without a training dataset |

## Authority and Compatibility

The accepted Game, Roster Membership, Player Stat Line, member-statistics, authentication, audit,
idempotency, and transaction rules continue to apply. This proposed delivery extends them only as
explicitly described here.

- The authoritative Game score remains independent from Statistical Events and Player Stat Lines.
- A Game must be `final` or `forfeit` and have a competition eligibility anchor before the initial
  post-Game Capture Session can start.
- Player attribution always uses the eligible Roster Membership at that anchor.
- Unknown, known zero, partial recorded subtotals, completeness, and verification have distinct
  meanings.
- A Statkeeper-managed Player Stat Line is corrected only through the ledger that produced it.
- Historical and current manual points lines remain valid until their Game is first published from
  Statkeeper; no migration fabricates occurrences or evidence for them.
- Browser clients receive no direct write access to domain tables.

## Initial Aggregate Boundaries

The implementation uses the following aggregate boundaries:

- **League Statkeeping Profile Version** owns immutable configuration used to interpret capture.
- **League Statkeeper Assignment** owns League-scoped operational authority.
- **Capture Session** owns participation, Media, possession, working ledger revision, coverage,
  review state, and the latest publication identity for exactly one Game.
- **Game Occurrence Revision** owns one observed moment, its temporal evidence, its `recorded` or
  `verified` verification state, its separate `active` or `void` disposition, and its contained
  Statistical Events.
- **Statkeeper Publication** is an immutable snapshot of one verified ledger revision and its
  deterministic Player Stat Line projection.

Stable identities survive correction. A corrected occurrence creates another immutable occurrence
revision under the same occurrence identity. A corrected session creates another immutable
publication under the same Capture Session identity.

## Canonical Keys and Localized Text

Configuration keys are language-neutral strings matching:

```text
[a-z][a-z0-9_]{0,63}
```

Keys are unique in the scope named by their definition and do not change after a profile version is
created. Display order is an integer greater than or equal to zero; ties use canonical key byte order
without changing statistical meaning.

A configured localized label contains nonblank `en` and `fr` values after trimming. An action or
statistic label is at most 80 Unicode scalar values. Optional help text is at most 240. Proper Player
and Team names remain language-neutral under the existing localization rules.

Canonical comparison and hashing trim configured localized strings and normalize them to Unicode
NFC before deterministic serialization. Canonically equivalent English or French strings with
different submitted byte sequences therefore cannot create a distinct Profile Version. This
normalization changes neither the displayed locale nor the canonical identity of the definition.
After these domain normalizations, every canonical JSON value in this specification uses the JSON
Canonicalization Scheme in RFC 8785. The complete string-escaping and UTF-8 byte rules are defined
under Idempotency, Canonicalization, and Concurrency; adapters cannot substitute a serializer with
different escaping or byte output.

## League Statkeeping Profile Version

Exactly one Statkeeping Profile Version is active for a League when that League permits a new
Capture Session to start. A profile version is immutable after creation and contains:

- immutable profile identity, League identity, positive monotonically increasing version, creation
  actor and creation time;
- regulation period count and duration;
- overtime period duration;
- Coverage Group definitions;
- projected Statistic definitions;
- Statistical Event definitions;
- Capture Action definitions; and
- a canonical content hash over all behavior-affecting values.

Creating and activating an identical canonical profile is rejected as unchanged. Activating a new
version replaces only the League's active-version pointer. Existing Capture Sessions retain their
snapshotted version. Profile versions referenced by any session or publication are never deleted or
modified.

Regulation period count, regulation period duration, and overtime duration are positive safe
integers measured in milliseconds. The initial clock counts down toward zero. Other clock
directions are outside this delivery.

### Profile Lineage Compatibility

Canonical keys form the compatibility identity across Profile Versions in the same League. Reusing
a Statistic, Event, outcome, participant-role, Coverage Group, or Capture Action key asserts that
its basketball meaning remains compatible with every prior referenced version using that key.
Localized labels, help text, and display order may change without changing identity. Changing
participant meaning, outcome meaning, aggregation meaning, semantic role, fixed contributions,
Team relationship, or possession behavior requires a new canonical key.

A new version may add or retire keys. Reintroducing a retired key must preserve its prior semantics.
The profile service compares reused keys with prior referenced definitions and rejects an
incompatible reuse. Cross-Game projections aggregate only values with the same compatible Statistic
key; they never combine similarly labeled but differently keyed values.

## Profile Definition Primitives

The profile is declarative data. It cannot contain source code, SQL, expressions, callbacks,
templates with evaluation semantics, network references, or executable formulas.

### Coverage Group

A Coverage Group identifies event categories whose full-Game observation is reviewed together. It
contains a canonical key, localized label, and display order. Every projected Statistic belongs to
exactly one Coverage Group.

### Projected Statistic

A Projected Statistic contains:

- canonical `stat_key`;
- localized full and short labels;
- display order;
- Coverage Group key;
- aggregation operation, which is `sum` in the initial delivery;
- optional semantic role; and
- whether it appears on the member Game log and box score.

The only initial semantic role is `player_points`. Exactly one projected Statistic in every active
profile has that role. The role enables Team-score reconciliation and the existing scoring
leaderboard without fixing the League's displayed term. Other projected Statistics have no
reserved semantic role.

Projected values are nonnegative safe integers. The initial delivery has no subtraction, negative
adjustment, multiplication, division, rate, average, percentage, formula, or cross-Game projection
primitive. Later derived presentation may calculate a separately accepted rate from complete base
statistics without changing the stored event projection.

### Statistical Event Definition

A Statistical Event Definition contains a canonical `event_key`, localized label, and one or more
allowed outcomes. Each outcome has a canonical key, localized label, and zero or more fixed
contributions. Every contribution identifies a projected Statistic key and a positive safe-integer
increment. One outcome cannot repeat a Statistic key. An outcome with no contribution remains
useful evidence and a model label but does not change a Player Stat Line.

### Participant Slot

A Capture Action declares one or more participant slots. Each slot contains:

- canonical role key and localized label;
- `required` or `optional` presence;
- Team relationship: `possessing`, `opposing`, or `either`; and
- whether it is the primary Player selected before the action.

Exactly one slot is primary and required. A slot accepts at most one eligible Player. An optional
slot that is not supplied emits no conditional event tied to that slot. The same Player cannot fill
two slots in one action unless the action definition explicitly permits it; the initial profile
validator defaults to rejecting duplicate Player assignment.

### Event Emission

An Event Emission inside a Capture Action contains:

- Statistical Event key;
- allowed outcome key;
- actor participant-slot key;
- `always` or `when_actor_present` emission condition.

An `always` emission must reference a required slot. A `when_actor_present` emission may reference
an optional slot and is omitted when the operator supplies no Player for it. An emission with no
projecting outcome remains useful evidence and a model label but does not change a Player Stat Line.
Multiple emissions in one occurrence may contribute to the same Statistic; the projector sums them
deterministically.

### Capture Action

A Capture Action contains:

- canonical `action_key` and localized action label;
- display order;
- availability: `offense`, `defense`, or `either`;
- participant slots;
- one or more Event Emissions; and
- possession effect: `retain`, `switch`, or `prompt`.

The initial delivery represents compound relationships through shared occurrence identity and does
not add a separate event-to-event graph. A profile definition that requires a direct relationship
from one emitted Statistical Event to another is unsupported in the initial delivery and the
profile validator must reject it. The validator also rejects unknown references, missing
localization, duplicate keys, a missing primary slot, a contribution to an unknown Statistic,
unsupported primitives, unsafe integers, and any definition that cannot expand deterministically.

## League Statkeeping Profile Commands

Only an active League Administrator may create and activate a profile version. The command contains
command identity, League identity, expected current active-version identity, and the complete
replacement definition. The service:

1. rechecks current League Administrator authority;
2. serializes profile activation for the League;
3. validates and canonicalizes the complete definition;
4. rejects a stale expected version, invalid definition, or unchanged content;
5. creates the immutable next version and changes the active pointer;
6. appends one Audit Record containing prior and new version identities and canonical hashes; and
7. stores one Command Receipt in the same transaction.

The initial League Setup delivery may render an editor from the definition primitives or install a
validated full definition through a guarded operator surface. It must invoke this same service and
cannot write configuration tables directly. A fixture or seed profile is disposable development
data, not a production default.

## League Statkeeper Assignment

A League Statkeeper Assignment connects one provisioned User Account to one League. It records
assignment identity, League, Account, assigning League Administrator, assigned time, optional
revoking League Administrator, and optional revoked time.

- Only an active League Administrator for the League may grant or revoke the assignment.
- The administrator identifies a grant target by exact registered email; the service resolves one
  provisioned User Account inside the transaction and does not expose a global Account directory.
- Several Accounts may hold active League Statkeeper assignments in one League.
- At most one active assignment exists for the same League and Account.
- Granting an already-active assignment and revoking an inactive assignment are rejected as no-ops.
- Revocation is terminal; a later grant creates a new assignment.
- Assignment history cannot be deleted.
- Grant and revocation are idempotent, transactional, and audited.

An active League Statkeeper may read the Games, participating Teams, eligibility-resolved rosters,
configured profile, Capture Sessions, occurrences, projections, and evidence needed for the
Statkeeper workspace. It may execute the Capture Session commands defined here. It gains no other
League Administrator mutation or private identity access.

An active League Statkeeper Assignment is a trusted League relationship for authenticated member
statistics. It grants the same member-statistics read admission as an active League Administrator,
Team Captain, or approved Player Management Relationship without granting Player-profile authority.

## Capture Session Identity and State

Exactly one Capture Session exists for a Game. Its durable state contains:

- session, Game, League, Season, home Season Team, and away Season Team identities;
- snapshotted Profile Version identity;
- one YouTube Game Media identity;
- lifecycle status;
- positive `ledger_version` used for material-write concurrency;
- nonnegative `progress_version` used for resume-state concurrency;
- current working ledger revision identity;
- optional latest published revision and Publication identities;
- current playback offset, active period and clock annotation, and optional open possession;
- participation declarations;
- Coverage Group declarations; and
- creation, update, verification, and publication attribution.

The lifecycle states are `capturing`, `in_review`, `verified`, `published`, and `abandoned`.
`abandoned` applies only when the Capture Session has no Publication or latest published revision.
Discarding a correction working revision returns the session to `published` and discards only that
working revision; the session never enters `abandoned` during that transition.

The Profile Version and Game identity never change. The Media identity may be replaced only before
the first occurrence is recorded. Media replacement or timeline remapping after capture begins is
outside the initial delivery.

## Session Preflight Command

`start_statkeeper_session` creates the canonical session. It accepts command identity, Game
identity, YouTube Media reference, and the complete set of eligible Roster Membership identities
marked `did_not_play`. Actor Account identity is derived from the verified server session.

The service transaction:

1. locks command handling and returns an identical prior receipt when present;
2. loads and locks the Game;
3. requires `final` or `forfeit` status and a competition eligibility anchor;
4. rechecks active League Statkeeper or League Administrator authority;
5. loads the two participant Teams and all eligible Roster Memberships at the anchor;
6. requires every supplied DNP identity to be eligible and unique;
7. declares supplied memberships `did_not_play` and every other eligible membership `appeared`;
8. loads the League's one active Profile Version;
9. validates or creates one League-owned YouTube Game Media identity and Game association;
10. enforces the unique Game-to-Capture-Session identity;
11. creates `capturing` state at ledger version one with empty occurrences and coverage initially
    `not_reviewed`; and
12. stores the receipt before commit.

An existing session is returned as an accepted command result only for an identical retry using the
same command identity and canonical content; that retry returns the original Capture Session and
Command Receipt identities. A different command identity for a Game that already has a canonical
session cannot create another session or another accepted start receipt. It returns
`existing_session_conflict`, the canonical Capture Session identity when the actor remains
authorized to access it, and safe resume guidance. If the submitted Media or DNP basis differs, the
report identifies that the existing preflight basis must be reviewed without disclosing private
operator identity. The rejection preserves the existing session and creates no material mutation,
Audit Record, or Command Receipt.

## Participation Declaration

Each eligible Roster Membership has exactly one session declaration: `appeared` or
`did_not_play`. Player and Season Team identity are copied as immutable attribution from the
eligible membership.

`replace_statkeeper_participation` supplies the complete desired DNP membership set and expected
ledger version. It is allowed in `capturing` or `in_review`. It rejects:

- an ineligible, missing, duplicate, or cross-Game membership;
- a stale ledger version;
- changing a Player to `did_not_play` while an active occurrence revision assigns that Player; or
- changing a published session before a correction working revision exists.

An accepted replacement increments the ledger version and invalidates prior review, verification,
coverage, and projection previews. It is material working history but creates a core Audit Record
only when its changed result is later published.

## YouTube Media and Evidence Time

The YouTube adapter accepts a supported YouTube URL or provider asset identity, resolves one
canonical provider asset identity, and retains the original submitted URL for operator reference.
Event records do not use a generated URL as identity.

A Media offset is a nonnegative safe integer in milliseconds. An evidence window is absent or
contains nonnegative start and end offsets satisfying:

```text
start <= evidence_timestamp <= end
```

The canonical Media Time representation is the JSON integer millisecond value. Decimal seconds,
floating-point values, formatted timestamp strings, frame numbers, generated YouTube query values,
and implementation-local player positions are not accepted as canonical Media Time. Provider-link
generation may round or convert the value as required by YouTube, but that URL form is not part of
the occurrence, receipt, ledger, or projection identity.

The browser reads the current player position and submits it with the occurrence command. The
server validates the value but cannot independently prove that it exactly matches the client player
at click time. Review and correction provide the authoritative human check.

Evidence navigation generates a provider URL or seeks the embedded player from the canonical Media
identity plus evidence timestamp. Removed or unavailable video does not remove occurrences or
published statistics.

## Period and Game-clock Annotation

Every occurrence contains exactly one Period reference:

- `regulation` with ordinal from one through the profile regulation-period count; or
- `overtime` with a positive ordinal.

Every occurrence also contains one clock annotation state:

- `exact`: nonnegative remaining milliseconds no greater than that period's configured duration;
- `estimated`: the same numeric range plus a visible estimated marker and optional reason; or
- `unavailable`: no numeric value and a nonblank reason.

The active period and clock context is resume-state assistance. Recording an occurrence copies the
submitted context into the immutable occurrence revision. Editing the workspace clock later does not
rewrite prior occurrences.

The reviewer receives warnings for media-order and clock-order combinations that appear impossible,
including a later Media offset with a higher remaining clock in the same period without an explicit
correction boundary. These warnings do not automatically reject because footage may be edited,
duplicated, or discontinuous. An absent or structurally invalid clock annotation rejects the
occurrence.

Clock synchronization anchors may be stored as operator assistance. They are not used to invent
exact occurrence clock values and are not part of Player Stat Line projection identity unless a
published occurrence uses a value derived from them.

## Possession State

A Possession Sequence identifies the possessing participant Team, start Media offset, optional end
offset, optional ending reason, and the occurrence that caused an automatic transition when one
exists. At most one sequence is open in a session.

The current working revision's possession basis is the complete ordered sequence history, not only
the open or most recent sequence. Its canonical form retains every current closed and open sequence,
including stable sequence identity, possessing participant-Team identity, start offset, explicit
end offset or null, explicit ending-reason key or null, transition kind `manual` or `automatic`, and
the causing occurrence identity for `automatic` or null for `manual`. Sequences are ordered by start
Media offset ascending and then stable sequence identity byte order. A correction replaces the
working revision's possession basis while prior published and superseded bases remain immutable
history.

`set_statkeeper_possession` starts the first sequence, switches Teams by closing the open sequence
and opening the other, or corrects the current state. It requires expected ledger version and a
Media offset. It is allowed in `capturing`, `in_review`, or `verified`; an edit to verified content
returns the session to `in_review`. Possession edits increment the ledger version and invalidate
review.

Recording a Capture Action applies its profile possession effect atomically:

- `retain` leaves the sequence open;
- `switch` closes the current sequence and opens the other participant Team at the occurrence
  evidence timestamp; and
- `prompt` returns a suggested choice without changing possession.

An automatic switch records its causing occurrence. Voiding that occurrence reverses the switch
only when no later occurrence or manual possession change depends on it; otherwise the command
returns a possession-review conflict and requires an explicit correction. Missing possession is
allowed, but actions or participant slots requiring a `possessing` or `opposing` relationship cannot
be expanded until the operator establishes or explicitly corrects possession.

## Recording a Game Occurrence

`record_statkeeper_occurrence` accepts:

- command and client-generated stable occurrence identities;
- Capture Session identity and expected ledger version;
- Capture Action key from the snapshotted Profile Version;
- evidence timestamp and optional evidence window;
- Period and clock annotation;
- Player identity for every supplied participant-slot key; and
- optional operator note of at most 500 Unicode scalar values.

The service allows `capturing`, `in_review`, or `verified` state and requires current capture
authority, active participant declarations, and a valid action expansion. Recording during review
keeps the session `in_review`; recording against a verified revision first returns it to
`in_review`. It resolves every Player to the session's immutable eligible Roster Membership
attribution rather than trusting Team or membership values from the browser.

The pure profile engine expands the action into one occurrence revision and its Statistical Events.
It validates participant requirements and Team relationships, emits conditional events, applies
fixed outcome contributions, and calculates the possession effect. The initial command records
source `human` from the authenticated operator; source is not accepted from the browser. A command
that supplies `model`, model confidence, or model provenance is rejected as
`deferred_inference_input` without mutation in the initial delivery. The accepted transaction
persists the occurrence with verification state `recorded` and disposition `active`, contained
events, possession change, new ledger
version, operational attribution, and Command Receipt atomically.

Reusing an occurrence identity within the session returns the existing result only when canonical
content is identical. Reusing it for different content is rejected. Command retries cannot create
duplicate Statistical Events or possession transitions.

## Revising and Voiding Occurrences

The initial correction surface consists of `record_statkeeper_occurrence`,
`revise_statkeeper_occurrence`, and `void_statkeeper_occurrence`. The MVP exposes no standalone
attach, split, or merge command or review action. Reviewers may use the available primitives to
produce the correct active ledger, but the application, audit, and user interface must describe the
commands and immutable revisions that actually occurred; they must not claim an attach, split, or
merge relationship or fabricate cross-occurrence lineage or contribution mappings.

`revise_statkeeper_occurrence` accepts a stable occurrence identity, expected current occurrence
revision, expected session ledger version, and a complete replacement capture input. It runs the
same validation and expansion as initial recording and creates another immutable occurrence
revision with verification state `recorded` and disposition `active`. It never edits the prior
revision in place.

`void_statkeeper_occurrence` creates a replacement revision with verification state `recorded` and
disposition `void`; void is not a third verification state. The revision contributes no active
Statistical Events. A reason is optional before the first publication and required when correcting
published evidence.

The commands are allowed in `capturing`, `in_review`, or `verified`. Editing a `verified` working
revision returns it to `in_review`. Editing a `published` session requires
`begin_statkeeper_correction`. Every accepted material edit increments the ledger version and
invalidates the prior verified ledger-basis and projection hashes. A material replacement of a
verified occurrence never inherits `verified`; only successful session verification may verify the
replacement revision.

Every accepted correction retains its ordinary actor, accepted time, command receipt, immutable
revision lineage, and required audit records. Recording an additional occurrence creates only the
identity and evidence defined by the record command; it does not imply that another occurrence was
split or that their Statistical Events were attached or merged. Standalone restructuring requires
the separately promoted contract in
[`decisions/0021-defer-statkeeper-review-restructuring.md`](decisions/0021-defer-statkeeper-review-restructuring.md).

## Operational Resume State

`save_statkeeper_progress` persists current playback offset, active period and clock context, and
UI-selected participant Team without changing ledger content. It uses `progress_version`, does not
invalidate review, and does not create a core Audit Record or Player-stat correction.

The command accepts command identity, Capture Session identity, expected progress version,
nonnegative playback Media Time, active Period and structurally valid Game-clock context, and the
selected participating Season Team or current Possession Sequence identity when present. It is
available while the canonical session is resumable, including an opened correction revision, and
requires current League Statkeeper or League Administrator authority.

The service locks the Capture Session progress record independently from the material ledger,
compares the expected progress version, persists the complete replacement progress state, increments
`progress_version` exactly once, and stores the operational receipt atomically. An identical retry
returns the same accepted progress version and state. A stale save returns `stale_progress_version`
with the current safe progress version and does not overwrite newer progress; a reused command
identity with different content returns `stale_command_identity` without mutation.

The workspace must restore the most recently acknowledged playback offset, Period, clock context,
and selected Team or possession context on reload or authorized handoff. Locally cached progress may
be offered as a clearly provisional recovery draft, but it cannot replace the last acknowledged
server state silently. Progress state never supplies authority for publication, projection,
coverage, or occurrence evidence, and losing only unacknowledged progress cannot change
authoritative occurrences or statistics.

The initial delivery requires network connectivity and server acknowledgement for material event
writes. Offline capture and later merge are outside scope.

## Review Submission and Coverage

`submit_statkeeper_for_review` changes `capturing` to `in_review`. It requires at least one active
occurrence, no unresolved participant assignment, no invalid action expansion, and no active
occurrence assigned to a DNP Player.

Each Coverage Group has one declaration in the working revision:

- `not_reviewed` with no assertion about completeness;
- `complete` with no known evidence gap; or
- `partial` with one or more nonblank gap reasons and optional period, clock, or Media ranges.

`replace_statkeeper_coverage` supplies the complete declaration set and expected ledger version. It
is allowed only in `in_review`. Every Profile Coverage Group must be present. The accepted set
records the current ledger version as its reviewed basis. A later material ledger edit makes the set
stale and requires the reviewer to submit coverage again before verification; the UI may display
the prior declarations only as stale guidance. A gap may use reason `missing_video`,
`obscured_play`, `operator_uncertainty`, or `other`; `other` requires explanatory text. An occurrence
with `unavailable` clock creates a temporal warning but does not by itself force statistical
coverage partial when the play remains visible.

The complete replacement declaration set is canonicalized by Coverage Group key in ascending byte
order. Within one partial declaration, gap entries are ordered by Period kind and ordinal, then
clock-range start and end, then Media-range start and end, then reason key, with absent ranges after
concrete ranges and normalized explanatory text as the final tie-breaker. Duplicate canonical gap
entries are rejected. Overlapping or adjacent ranges remain separate assertions rather than being
merged implicitly; two submissions with different boundaries are therefore different reviewed
bases even when their union would be equal. This closed ordering is used by unchanged-content
comparison, coverage-basis hashing, Command Receipt content, projection preview, verification, and
publication. Implementations cannot choose their own interval-union or merge policy.

The initial delivery does not persist a separate uneventful-interval or negative-example artifact.
For future provenance, it retains the canonical Media timeline, active occurrence evidence, and the
accepted Coverage Group declaration basis. A `complete` declaration supports later identification
of reviewed scope for that group. A `partial` declaration supports interval-level derivation only
where its canonical gap ranges bound the excluded evidence; a partial declaration containing only
coarse reasons cannot be reinterpreted as interval-level negative evidence. Any later dataset
builder must derive candidate reviewed uneventful spans from these retained artifacts under a
separately accepted dataset policy rather than treating event absence alone as a negative label.

The scoring Coverage Group is the group containing the `player_points` Statistic. A mismatch
between the projected recorded Player subtotal and the authoritative participant-Team score creates
a scoring-discrepancy warning and makes the effective projected scoring coverage `partial` even
when the reviewer declared the observed video complete. Preview and verification hashes include
that effective partial state. The mismatch does not mutate either score.

## Verification

`verify_statkeeper_revision` requires `in_review`, expected ledger version, current authority, a
Coverage declaration other than `not_reviewed` for every group, and successful deterministic
projection.

Every Coverage declaration must identify the current ledger version as its reviewed basis. Stale
coverage rejects verification without changing state.

Verification rejects structural errors but may retain warnings. In the accepted transaction it
marks every current Game Occurrence Revision `verified`, preserving each revision's separate
`active` or `void` disposition, and records verifier, verified time, canonical ledger basis hash,
canonical projection hash, scoring reconciliation result, and every warning. The session state
becomes `verified` without mutating Player Stat Lines. There is no standalone occurrence-
verification command or additional review interaction in this delivery.

Any later material change invalidates both hashes and returns the working revision to `in_review`.
Its newly created occurrence revision, when any, is `recorded` until the whole working revision is
verified again. Saving operational progress does not. Publication with any current `recorded`
occurrence revision is rejected. Verification with a stale expected ledger version or stale Coverage
basis is rejected without partial verification-state changes.

## Generic Player Stat Values

The existing Player Stat Line identity remains one Game, Player, Season Team, and eligible Roster
Membership. The initial delivery adds a source kind and a normalized set of projected values.
The persistence constraint for line completeness expands from the points-first `partial`-only state
to `partial` or `complete`; verification remains `provisional` or `confirmed`.

Source kind is:

- `manual_points` for a line without Statkeeper publication provenance; or
- `statkeeper` for a line controlled by one Capture Session publication.

A Statkeeper Player Stat Value contains Profile Version identity, Statistic key, nullable
nonnegative `recorded_value`, and coverage status:

- `complete`: the value is the reviewed full-Game total and may be zero;
- `partial`: the value is a reviewed recorded subtotal and must be labeled partial wherever shown;
  or
- `not_recorded`: no numeric value is stored or displayed.

A partial numeric value is not a known complete aggregate. It is excluded from complete Season
totals, rates, leaderboards, and denominators. A confirmed partial value means only that the recorded
subtotal and its incomplete coverage were reviewed.

For every Player declared `appeared`, the projection creates or reuses one Player Stat Line and one
value for every projected Statistic in the snapshotted profile:

- complete Coverage Group produces a complete sum, including known zero;
- partial Coverage Group produces the observed sum labeled partial; and
- a group that somehow remains not reviewed makes verification and publication invalid.

Because initial publication requires every Coverage Group to be reviewed, its Statkeeper projection
emits `complete` or `partial` values. `not_recorded` preserves the domain representation of unknown
for manual, historical, and later workflows; it is not synthesized from a reviewed absence.

A Player declared `did_not_play` receives no Statkeeper Player Stat Line. Statistical Events and
values are attributed only through the eligible membership captured by preflight.

Line completeness is `complete` only when every member-visible projected Statistic is complete;
otherwise it is `partial`. A verified publication writes `confirmed` verification even when the
line or a value is partial. Provisional working projections are previews and are not written to
authoritative Player Stat Lines.

## Compatibility with Manual Points

The migration preserves every existing Player Stat Line as `manual_points`, retaining its nullable
points, completeness, verification, version, audit history, and member visibility. It does not
create a Capture Session, occurrence, evidence link, Profile Version, participation declaration, or
Statkeeper Publication for historical data.

On the first Statkeeper publication for a Game:

- the service locks every existing Game Player Stat Line;
- the projected Statistic with semantic role `player_points` becomes the Statkeeper points value;
- existing lines for Players declared `appeared` are converted to `statkeeper` under the normal
  version and audit rules;
- existing lines for Players declared `did_not_play` conflict when they contain any known manual
  value and must be resolved before publication; and
- direct manual-points commands are thereafter rejected for that Game.

Conversion clears the legacy nullable `points` field on every line changed to `statkeeper`; the
generic semantic-role value becomes its only current points source. A pre-existing DNP line with
unknown manual points may remain preserved for identity and history, but it receives no Statkeeper
values, does not establish appearance, and cannot be edited through the manual-points command after
the Game becomes Statkeeper-controlled.

Member read models use the legacy points field for `manual_points` lines and the semantic-role
Statkeeper value for `statkeeper` lines. They must display partial Statkeeper recorded subtotals as
partial and exclude them from confirmed complete totals and rank. A later migration may normalize
all historical points, but it cannot fabricate evidence.

## Projection Preview

`preview_statkeeper_projection` is a read-only service over the current working revision. It returns:

- ledger basis hash, projection hash, and projector identity;
- Player lines and every projected value with coverage status;
- contribution occurrence and Statistical Event identities for each numeric value;
- Team recorded scoring subtotals;
- comparison with authoritative Game scores;
- participation, coverage, clock, possession, and validation warnings; and
- whether publication requires explicit discrepancy acceptance.

The preview does not reserve its result. Publication re-reads and recomputes the complete basis in
one transaction.

The sole initial projector identity property is `projector_identity`, with the exact canonical
string value `courtside.statkeeper.player-stat-projection/v1`. It identifies the deterministic
projection algorithm independently of the snapshotted Profile Version. It does not vary by locale,
deployment, database migration, transient application build, or mutable display label. Any later
behavioral change that could alter projected values, coverage interpretation, contribution
mapping, ordering, reconciliation, or projection hashing for the same canonical ledger basis
requires a new explicit projector identity. Historical identities and their implementations remain
available for replay of every Publication that references them.

## Publication Command

`publish_statkeeper_revision` accepts command identity, session identity, expected ledger version,
expected verified ledger-basis hash, expected projection hash, whether the actor accepts a scoring
discrepancy, and an optional reason. Actor identity comes from the verified server session.

When either Team's recorded Player-points subtotal differs from its authoritative score, publication
requires explicit acceptance and a nonblank reason. The scoring Coverage Group is published as
partial as already represented by the verified projection, even if the reviewer declared the
observed video complete. When no mismatch exists, discrepancy acceptance is ignored and does not
create an audit reason.

Discrepancy acceptance is part of the publication command and the resulting immutable Publication,
Audit Record, and Command Receipt; the initial delivery does not create a separately mutable
acceptance lifecycle. The transaction recomputes the authoritative score comparison, ledger basis,
coverage basis, and projection hash. If the submitted acceptance refers to a different basis, the
publication is rejected as `stale_discrepancy_basis` without changing an earlier Publication,
Player Stat Line, session state, Audit Record, or receipt. An identical retry of an accepted
publication returns the original artifacts.

The publication transaction:

1. serializes command identity and identical retry handling;
2. rechecks active League Statkeeper or League Administrator authority;
3. locks the Capture Session and requires `verified` state and matching ledger version;
4. locks the `final` or `forfeit` Game and rechecks its unchanged competition eligibility anchor,
   participant Teams, and authoritative score;
5. loads the immutable Profile Version, eligible memberships, participation, current occurrence
   revisions, contained events, possessions, and Coverage declarations;
6. recomputes and compares canonical ledger and projection hashes;
7. enforces discrepancy acceptance and all publication invariants;
8. locks the Game's Player Stat Lines and rejects conflicting manual or foreign publication state;
9. creates an immutable Publication snapshot and contribution mapping;
10. creates or updates every appeared Player Stat Line and normalized value under optimistic line
    versions while preserving DNP absence;
11. appends Audit Records for every materially changed Player Stat Line plus discrepancy acceptance;
12. sets the session latest published revision and Publication identities and state `published`;
13. saves the Command Receipt; and
14. commits every change atomically.

Any failure before transaction commit rolls back all Player Stat Lines, values, publication records,
session state, audits, and receipt writes. Successful cache invalidation covers affected member Game
logs, box scores, leaderboards, and evidence reads before the application intentionally confirms
success.

Transaction commit, not cache refresh, response delivery, or browser acknowledgement, establishes
publication. If the transaction commits but a later step fails, the Publication, Player Stat Lines,
session state, Audit Records, and Command Receipt remain authoritative and must not be rolled back or
recreated. The client keeps the original command identity and represents the outcome as pending
reconciliation or retryable transport failure, not as a domain rejection or a new Capture Session
lifecycle state.

Before any second publication attempt after an uncertain outcome, the application reads the
canonical Capture Session and Command Receipt for the original command identity. An existing receipt
is replayed and the browser reconciles to its Publication. If the canonical read is unavailable, the
client remains pending and does not mint a replacement command identity. If no receipt exists and
the canonical session still permits the command, the application may retry only the identical
canonical command under the original identity. Cache invalidation is independently retryable and
idempotent by Publication identity; its failure or repetition cannot duplicate a Publication,
Player Stat Line mutation, Audit Record, contribution mapping, or receipt.

## Publication Evidence and Member Reads

Every published Player Stat Value retains its contributing Statistical Event identities, parent
occurrence identities, and Publication identity. The contribution set is empty for a complete known
zero.

An admitted member can:

- open a numeric Game value to see its contributing Statistical Events;
- select an event to seek the embedded YouTube player or open its timestamped provider link; and
- see `estimated` or `unavailable` clock labels and partial-coverage labels honestly.

The member surface does not expose operator notes, confidence, model provenance, correction reason,
Audit Records, working revisions, DNP declarations beyond ordinary appearance presentation, or
unpublished occurrences.

YouTube links are shown only through the authenticated member-statistics surface. Courtside does not
claim to control a public or unlisted YouTube video after its URL is copied or shared.

If the embedded player cannot load, the provider link cannot be generated, or the canonical video
is no longer available, the member read retains the published statistic, Publication identity,
contribution identities, and occurrence evidence metadata and returns `evidence_unavailable` for
the affected target. The localized surface explains that video evidence is temporarily unavailable
or no longer accessible without exposing provider credentials, raw provider errors, private
Account data, operator notes, or unpublished correction state. Provider recovery may make the same
evidence navigable again without republishing; changing the Media identity, timestamp, or
contribution set requires the normal correction flow.

## Correction and Abandonment

`begin_statkeeper_correction` requires a `published` session, expected latest Publication identity,
current authority, and an optional reason. It creates a working revision based on the latest
published occurrence revisions, participation, possession, and coverage while leaving member reads
on the published snapshot. State becomes `in_review`.

The ordinary revise, void, participation, possession, coverage, verification, preview, and publish
commands operate on the correction revision. Published evidence voiding requires a reason.

`abandon_statkeeper_session` accepts command identity, Capture Session identity, expected ledger
version, expected absence of a latest Publication, and an optional reason while `capturing`. A
nonblank reason is required while `in_review` or `verified`. Actor identity comes from the verified
server session.

The service rechecks current League Statkeeper or League Administrator authority, locks the Capture
Session and latest-Publication slot, verifies the expected ledger version and that no Publication
has ever been produced, and changes an unpublished `capturing`, `in_review`, or `verified` session to
terminal state `abandoned`. The accepted transaction writes one abandonment terminal report and
Command Receipt atomically and increments the ledger version exactly once. It does not create,
replace, or delete Player Stat Lines, occurrences,
Statistical Events, participation, Media, possession, coverage, or review history.

The terminal report contains report, command, Capture Session, Game, working-revision, actor, and
receipt identities; prior lifecycle state; accepted time; reason when supplied or required;
confirmation that no Publication exists and no Player Stat Line changed; retained-history outcome;
and safe operator next action. The command returns the terminal report identity, receipt identity,
final ledger version, and `abandoned` state. Identical retries return the same report and receipt.
Unauthorized authority, stale ledger version, a missing required reason, any existing Publication,
an already terminal state with different command content, or a reused command identity rejects
without mutation using a stable rejection report.

`discard_statkeeper_correction` requires an `in_review` or `verified` correction working revision
based on a latest Publication. It discards only that working revision and returns the session to
`published` without changing the latest Publication or member reads. It never changes the session
to `abandoned`.

Publishing a correction creates another immutable Publication. It updates existing Player Stat
Lines under their versions, appends prior and replacement values to audit, and never erases earlier
publication or occurrence revisions.

## Idempotency, Canonicalization, and Concurrency

Every material command carries a globally unique command identity. Canonical payload hashing
includes actor, target identities, expected versions, normalized strings, ordered definition
content, semantically unordered identity sets in ascending byte order, and explicit nulls where
absence differs from a value.

Canonical hashes use SHA-256 over the exact UTF-8 bytes, with no byte-order mark, of JSON serialized
under RFC 8785 JSON Canonicalization Scheme after this specification's domain normalization and
ordering rules. Object members follow RFC 8785 ordering; all normative property names are ASCII.
Strings use RFC 8785 escaping: quotation mark, reverse solidus, and required control characters are
escaped, printable non-ASCII scalar values such as French accented text are emitted as their UTF-8
characters rather than optional `\u` escapes, solidus is not escaped, and lone UTF-16 surrogates or
otherwise invalid Unicode input are rejected before hashing. The resulting JSON text is encoded to
UTF-8 once, without a trailing newline or other framing bytes.

Configured localized strings use trim-then-NFC normalization before serialization. Integers use the
RFC 8785 number representation and remain restricted to the exact safe-integer domain defined by
this specification; Media Time uses nonnegative safe-integer milliseconds. Semantically unordered
identity sets are sorted by immutable identity byte order. Arrays retain submitted order only when
the specification assigns that order meaning. Explicit null is retained when it differs from
absence; an absent optional field is omitted before serialization. Generated provider URLs, request
time, cache state, database row order, transient UI state, and raw provider errors are excluded.

For ledger and projection folding, active occurrence revisions are ordered with regulation Periods
before overtime Periods and ordinal ascending within each kind, then evidence Media Time ascending,
evidence-window start and end ascending with absent values after concrete values, clock state
`exact`, `estimated`, then `unavailable`, remaining clock milliseconds descending for the initial
countdown clock, stable occurrence identity byte order, and immutable active revision identity byte
order. Superseded revisions do not contribute, and void revisions contribute lineage but no active
Statistical Events. Profile definitions use display order with canonical-key byte order as the
tie-breaker; semantically unordered references use canonical-key byte order. The database, capture
UI, or adapter cannot supply another tie-breaker.

The verified ledger-basis hash includes the session and working revision, Game, snapshotted Profile
Version and content hash, canonical Media identity, participation, the complete canonical ordered
Possession Sequence history and transition basis defined under Possession State, current occurrence
revisions with verification state and disposition, evidence and clock annotations, contained
Statistical Events, eligible membership assignments, canonical Coverage declarations, and effective
scoring coverage. Closed Possession Sequences are never collapsed to the current possessing Team for
this hash. Every accepted material possession correction changes the working revision and its ledger-
basis hash even when projected Player values remain identical.

The projection hash includes that ledger-basis hash, exact `projector_identity`, ordered Player and
Statistic values including explicit zero or unknown, coverage state, contribution identities,
reconciliation result, and whether discrepancy acceptance is required. The acceptance value and
reason belong to the publication command, Publication, Audit Record, and receipt rather than
changing the projected Player values or preview hash. Fixtures publish the canonical JSON text,
exact UTF-8 bytes or hexadecimal byte representation, projector identity, and expected SHA-256
digest so independent implementations can reproduce them. Required fixtures include composed and
decomposed-equivalent French accented text after NFC normalization, quotation-mark and reverse-
solidus escaping, a control character, printable non-ASCII output, explicit null, omitted optional
fields, the complete closed-and-open possession basis, and at least one material possession
correction that changes the ledger-basis hash without changing projected Player values.

An accepted retry with the same command identity and canonical content returns the prior receipt.
Reusing that identity for different content is rejected. Rejected attempts create no material state
or receipt. A committed publication whose response was not acknowledged follows the canonical
receipt reconciliation and identical-retry procedure under Publication Command; transport and cache
failures cannot convert that committed command into a rejection.

Material Capture Session writes require expected `ledger_version`. The transaction locks the session
and increments the version exactly once per accepted command. A stale writer receives a conflict
report containing current version and no sensitive competing-actor data. Optimistic concurrency,
not a long-lived browser lock, is the initial multi-tab and multi-operator control.

Profile activation serializes by League. Session creation serializes by Game. Publication locks the
session, Game, and affected Player Stat Lines in a stable order. Implementations must not use
unrelated writes or client-side sequencing to approximate these transactions.

## Rejection Reports

Domain, authorization, lifecycle, version, profile, clock, participation, occurrence, projection,
and publication rejections preserve authoritative state. Reports identify:

- entity type and identity;
- current state or version;
- requested command;
- actor Account identity;
- violated rule;
- retry or correction guidance where safe; and
- `authoritative_state_preserved: true`.

Browser responses localize safe messages and do not expose database errors, provider credentials,
private Account data, or another operator's identity.

A response-delivery, browser-acknowledgement, or cache-refresh failure after publication commit is
not a domain rejection. Its safe report identifies the original command identity and pending
reconciliation guidance without claiming that the pre-command authoritative state was preserved.

## Persistence and Database Invariants

The PostgreSQL adapter must independently protect at least:

- one active Profile Version per League and monotonic immutable versions;
- one active League Statkeeper Assignment per League and Account;
- terminal append-only assignment history;
- one Capture Session per Game;
- immutable Game, League, Profile Version, and Media identity after capture begins;
- one participation declaration per eligible Roster Membership and session;
- one stable occurrence identity per session and ordered immutable revisions;
- required `recorded` or `verified` occurrence verification state and separate `active` or `void`
  disposition on every immutable occurrence revision;
- contained-event ownership by exactly one occurrence revision;
- nonnegative Media offsets and valid evidence windows;
- valid Period and clock-state shapes;
- one open Possession Sequence per session;
- complete retained possession bases for every working and published ledger revision, including
  closed sequences and canonical transition causes;
- monotonic session ledger, progress, occurrence, and Player Stat Line versions;
- immutable Publication identities, hashes, and contribution mappings;
- canonical versioned projector identity on every projection and Publication;
- one projected value per Player Stat Line and Profile Statistic;
- Statkeeper publication provenance on every Statkeeper-controlled line; and
- no direct browser grants for profile, assignment, capture, event, publication, or projected-value
  tables.

Database triggers may reject alternate-path structural violations but do not replace application
profile expansion, authorization, projection, or reconciliation policy.

## Delivery Surface

The localized Statkeeper destination is visible to active League Statkeepers and League
Administrators without exposing unrelated League Setup or Player-management controls.

Its Game list prioritizes resumable sessions, completed Games without a session, sessions awaiting
review, and published sessions. The preflight screen shows Game identity, authoritative score,
eligible rosters, DNP controls, active Profile Version, and YouTube Media selection.

The capture workspace provides:

- embedded YouTube playback with play, pause, scrub, and current-time capture;
- visible period and Game-clock controls;
- prominent current-possession Team and roster;
- immediately reachable opposing Team override;
- profile-ordered localized actions;
- optional participant prompts for compound occurrences;
- recent occurrence history, undo or void, and direct evidence seeking;
- autosaved resume state and acknowledged material saves;
- current coverage and reconciliation status; and
- keyboard operation for repeated Player, action, possession, and playback controls.

The default pointer flow is Player then action. Optional participant prompts appear only when the
selected action defines them. A successful action clears transient Player selection, applies the
possession effect, and leaves playback controls usable. Failed persistence remains visibly unsaved
and retries with the same command identity.

An uncertain publication outcome remains visibly pending reconciliation. The workspace reads the
canonical session and original command receipt before offering or performing an identical retry; it
never presents a transport or cache failure as proof that publication rolled back.

The initial delivery is online-only and optimized for desktop and tablet landscape use. Narrow
screens remain functional for review and evidence navigation but need not match the high-throughput
capture layout.

## Application Boundary

Pure profile validation, action expansion, clock validation, participation rules, possession
transitions, coverage semantics, canonicalization, and projection belong in `core`. They accept no
Next.js, browser, PostgreSQL, YouTube, Supabase, environment, or network dependency.

Application services own profile activation, role administration, preflight, capture commands,
review, verification, projection preview, publication, correction, authorization, idempotency,
transactions, and audit orchestration through explicit ports.

Adapters own PostgreSQL persistence, YouTube URL normalization and playback delivery, current
Supabase identity resolution, and localized Next.js delivery. Before implementing Next.js code, the
repository's installed Next.js documentation must be read as required by `AGENTS.md`.

No public API, cross-repository protocol, queue, model service, or machine-readable contract is
created by this slice. Internal TypeScript interfaces and tests may stabilize before a later need
justifies `contracts/` or public protocols.

## Migration Sequence

The implementation proceeds in dependency order:

1. introduce immutable League Profile Versions and League Statkeeper Assignments;
2. add Capture Session, participation, possession, occurrence-revision, Statistical Event, coverage,
   Publication, and contribution persistence;
3. add generic Player Stat Values and source/provenance fields while preserving manual points;
4. deliver pure profile validation, action expansion, clock, coverage, and projection tests;
5. deliver profile, role, session, occurrence, review, publication, and correction services;
6. deliver PostgreSQL integration tests and migration replay;
7. deliver the bilingual Statkeeper and League Setup surfaces;
8. extend member reads with partial-value and evidence navigation; and
9. exercise one complete Game from preflight through correction.

No migration drops existing points, audits, or member projections before the replacement reads and
rollback strategy have been exercised locally and in staging.

Migration verification replays committed migrations from an empty database and from a
representative manual-points fixture. It records applied migration identities, preserved manual
points and audit counts or hashes, first-publication conversion results, rollback exercise result,
and the failed step and state-preservation outcome when any check fails. Failure before the first
Statkeeper publication leaves the existing manual-points read and mutation path available. Failure
inside first publication rolls back the entire publication transaction to its pre-attempt state.

## Verification Requirements

Unit tests cover:

- profile canonicalization and every invalid reference or unsupported primitive;
- action expansion, optional compound credits, Team relationships, and possession effects;
- exact, estimated, unavailable, regulation, and overtime clocks;
- DNP and eligibility enforcement;
- occurrence revision and void behavior;
- occurrence verification-state and separate disposition transitions for record, revise, void,
  session verification, stale verification rejection, and later material correction;
- canonical occurrence ordering and rejection of deferred `model` source input;
- complete, partial, unknown, and known-zero projection;
- canonical Coverage declaration and gap ordering without implicit interval merging;
- deterministic identification of derivable reviewed scope and rejection of coarse partial coverage
  as interval-level negative evidence;
- scoring reconciliation and discrepancy acceptance;
- deterministic projection hashes using exact
  `courtside.statkeeper.player-stat-projection/v1` identity;
- RFC 8785 canonical JSON fixtures covering NFC-equivalent French text, escaping, control
  characters, printable non-ASCII UTF-8, explicit null, omitted fields, exact bytes, and digests;
- complete possession-basis hashing, including closed sequences and a possession-only correction
  that changes the ledger hash without changing projected values; and
- published correction, never-published abandonment, and correction-discard transitions.

PostgreSQL integration tests cover:

- active-profile, active-role, one-session, revision, participation, and publication constraints;
- different-command preflight conflict and identical-retry receipt behavior;
- current Statkeeper and League Administrator authorization;
- revoked-role rejection;
- command retry and payload-conflict behavior;
- acknowledged progress save, stale progress rejection, and reload restoration;
- stale ledger and Player Stat Line version rejection;
- atomic publication and rollback at every material failure point;
- committed-but-unacknowledged publication receipt replay, identical retry, idempotent cache
  refresh, and absence of duplicate publication side effects;
- manual-points coexistence and first Statkeeper conversion;
- append-only published evidence and audit;
- abandonment terminal report, identical retry, and existing-Publication rejection;
- no direct `anon` or `authenticated` domain-table writes; and
- migration replay from an empty database and from representative manual-points fixtures.

Playwright coverage includes:

- English and French profile labels and Statkeeper routes;
- League Administrator Statkeeper assignment;
- DNP preflight;
- YouTube timestamp capture through a deterministic player test double where provider automation is
  unreliable;
- Player/action compound occurrence entry and possession switching;
- reload restoration of acknowledged playback, Period, clock, possession, recent history, and
  visible pending or retryable state;
- review, coverage, reconciliation, verification, and publication;
- uncertain post-commit publication recovery remains visibly pending until canonical receipt replay
  confirms the committed Publication;
- review correction exposes and records only record, revise, and void semantics, without standalone
  attach, split, or merge actions or fabricated restructuring lineage;
- missing-video partial publication with `unavailable` clock and explicit discrepancy reason;
- member aggregate-to-evidence navigation including `evidence_unavailable`; and
- published correction while the prior Publication remains visible until commit.

The repository's standard lint, typecheck, unit tests, production build, and structure verification
remain required.

## Explicitly Deferred

The initial delivery excludes:

- live Game capture or official score mutation;
- offline capture and merge;
- concurrent ledger merging beyond optimistic conflict rejection;
- multiple videos or camera angles;
- video upload, transcoding, clip materialization, or frame extraction;
- spreadsheet import and initial-delivery spreadsheet export;
- public Player statistics or public evidence navigation;
- arbitrary formulas, derived rates, negative values, or cross-Game profile projection;
- direct event-to-event relationship graphs beyond shared Game Occurrence identity;
- standalone review-time attach, split, and merge operations; a successor delivery must satisfy
  [`decisions/0021-defer-statkeeper-review-restructuring.md`](decisions/0021-defer-statkeeper-review-restructuring.md)
  before exposing or recording them;
- changing a session to a later Profile Version;
- Media replacement or timeline remapping after the first occurrence;
- automatic Game-clock recognition;
- model training, inference, or model-proposed occurrence delivery;
- automatic publication;
- separate capture-only and reviewer roles;
- external integrations, public APIs, or a separate Statkeeper service; and
- production rollout before backup, restore, privacy, YouTube availability, and operational support
  requirements are exercised.
