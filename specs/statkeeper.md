# Courtside Statkeeper Event Capture

- Status: proposed
- Spec version: 0.3.4
- Last updated: 2026-08-29

## Purpose

Courtside Statkeeper is the proposed primary surface for recording detailed Player statistics from
Game video. It replaces the current split workflow in which an operator reviews YouTube playback
and separately records events in a spreadsheet. Statkeeper presents the Game participants,
possession-aware actions, and video playback in one resumable workspace; every recorded occurrence
is bound to the supporting moment in the video.

The spreadsheet is not an input to this workflow. Statkeeper replaces it as the place where Game
events are recorded, reviewed, and published.

Statkeeper produces an evidence-backed Game Event Ledger. Reviewed Statistical Events are
projected into the existing Player Stat Lines used by Courtside. For a Statkeeper-managed Game, the
verified ledger is the correction source and the Player Stat Lines are its authoritative published
projection consumed by Game logs, box scores, and Season aggregates. The ledger preserves the
finer-grained observations and media evidence from which those records were produced.

This specification defines the product and domain boundary. It accepts a dedicated League
Statkeeper role and a versioned, localized League Statkeeping Profile. It does not prescribe any
League's configured statistic terms, select a video-processing provider, or implement model
training.

The proposed first production-oriented vertical slice is specified in
[`statkeeper-initial-delivery.md`](statkeeper-initial-delivery.md).
The normative operator and member experience invariants for that slice are specified in
[`statkeeper-capture-experience.md`](statkeeper-capture-experience.md). Those invariants protect the
high-throughput video-linked workflow from being weakened by an otherwise valid implementation
refinement.

## Relationship to Existing Authority

The accepted Game, Roster Membership, Player Stat Line, member-statistics, Media, authorization,
audit, and transaction rules remain authoritative. In particular:

- the authoritative Game score remains independent from the sum of Statistical Events or Player
  Stat Lines;
- Player-stat availability, completeness, or disagreement never blocks an authoritative Game
  result, standings, or playoff advancement;
- Player attribution uses the Roster Membership that established eligibility at the Game
  competition eligibility anchor;
- unknown and known zero remain distinct;
- Player Stat Line completeness and verification remain independent; and
- Team Captains, Player managers, and ordinary members gain no Statkeeper mutation authority.

Once a Player Stat Line has a Statkeeper publication basis, a material value correction must
originate in the underlying ledger and be republished. A separate direct edit that would make the
published projection disagree with its occurrence and event evidence is rejected. Historical
Player Stat Lines that predate Statkeeper or have no Statkeeper publication basis remain governed by
their existing mutation workflow.

Statkeeper initially belongs inside the Courtside modular monolith as a separately named bounded
capability. A separate deployment, repository, or public integration contract is deferred until an
independent lifecycle or a stable cross-boundary interface exists.

## Capability Model

Statkeeper is divided by responsibility rather than by required process, deployment, or directory:

```text
Game + eligible rosters + video
              |
              v
        Capture Workspace
              |
              v
 Possessions + Game Occurrences
              |
              v
       Statistical Events
              |
              v
       Review and Correction
              |
              v
      Verified Event Ledger
              |
              v
    Projection and Publication
              |
              v
     Courtside Player Stat Lines
```

The Capture Workspace owns resumable operator work and media synchronization. Possessions organize
the workflow. A Game Occurrence binds one observed basketball moment to its time and video evidence;
one or more Statistical Events inside it express the separate statistical facts and credits. Review
establishes trustworthy labels. Projection derives aggregate Player values, and publication applies
an accepted projection through the ordinary Player Stat Line mutation boundary.

## Capture Workspace

A Capture Session is one resumable stat-keeping effort for exactly one Game. It identifies:

- the Game and League;
- the authenticated operator;
- the attached Game Media;
- the participating Season Teams and eligibility-resolved roster context;
- the confirmed participants and Players marked `did_not_play`;
- the snapshotted League Statkeeping Profile version;
- the current playback position and current possession when work is resumable;
- the covered portions of the Game and statistic categories;
- the current working revision and last published revision, when one exists; and
- lifecycle status.

The Game remains the competition identity. The Capture Session exists separately because capture
may be interrupted, reviewed by another authorized actor, or corrected after publication. The MVP
permits exactly one canonical Capture Session per Game. Re-review, model proposals, and
post-publication corrections create working revisions within that session rather than competing
sessions or ledgers.

The initial workflow assumes one primary video timeline per session. Supporting multiple camera
angles may later attach additional synchronized timelines without changing Game Occurrence
identity.

## Session Preflight and Participation

Starting a Capture Session is a deliberate preflight step. The operator selects an anchored Game;
Courtside derives its two participating Season Teams and the Players eligible through their Roster
Memberships at the Game competition eligibility anchor.

Before event capture begins, the operator marks every eligible Player who did not play. Proceeding
from preflight confirms that every remaining eligible Player appeared in the Game. The resulting
participation state is therefore `appeared` or `did_not_play`, not an inference from roster
eligibility or event totals.

The participation declaration may be corrected during review. A correction is attributed to the
actor and causes every affected projection to be recalculated. A `did_not_play` Player cannot be
assigned to a publishable Statistical Event; assigning that Player during draft capture must first
change the participation declaration or produce a review conflict.

## Media and Timeline Binding

Game Media has a stable Courtside identity and provider-specific locator. YouTube is the initial
playback source: Courtside retains the source or canonical YouTube identity needed to load the video
and generate a timestamped URL. Provider details belong to the Media boundary; an occurrence refers
to a Media identity and structured time value rather than using a URL string as its only evidence
identity.

A Media Time is a nonnegative offset on one Media timeline with sufficient precision for accurate
seeking and later clip extraction. Every publishable Game Occurrence has:

- a Media identity;
- an evidence timestamp;
- an optional evidence-window start and end; and
- the initially captured playback timestamp when the evidence timestamp has been corrected.

When the operator records an occurrence, the current playback position becomes both the captured
and evidence timestamp. Review may move the evidence timestamp or evidence window while preserving
the original capture value and correction lineage. The occurrence remains directly navigable:
Courtside can seek the embedded player or open the provider's timestamped link at the evidence time.

Video time and basketball Game-clock time are distinct. Every Game Occurrence requires a Game Time
annotation containing the period and the Game-clock state. The clock state is one of:

- `exact`, with the observed clock value;
- `estimated`, with the best defensible value and an explicit estimated marker; or
- `unavailable`, with a reason such as missing footage, an unreadable scoreboard, or the camera not
  covering the action.

An absent clock annotation is invalid. The `unavailable` state exists so missing footage does not
force the operator to invent a value or prevent an authorized partial publication. It prevents the
affected temporal coverage from being described as complete.

A session may record synchronization anchors that associate a video offset with period and
Game-clock time. Multiple anchors are allowed because recording and Game clocks may pause or drift
independently. The workspace maintains the active period and clock context so new occurrences can
inherit it, but the operator can correct the inherited annotation during capture or review.

Replacing or trimming the underlying video must not silently move occurrence evidence. The
replacement must preserve the old Media association or apply an explicit, reviewable timeline
remapping before the replacement becomes the occurrence evidence source.

## Possession Sequences

A Possession Sequence is an ordered interval in a Capture Session during which one participating
Season Team is treated as possessing the ball. It contains a start Media Time, an optional end
Media Time while open, the possessing Season Team, and an optional ending reason.

Possession exists primarily to accelerate capture and add useful temporal structure:

- the possessing Team's roster is visually prominent;
- offensive actions are presented as the primary action set;
- the defending Team and defensive actions remain immediately available;
- actions such as a made basket or turnover may suggest the next possession; and
- actions such as an offensive rebound may retain the current possession.

Only one Possession Sequence may be open at a time on one session timeline. Closed canonical
sequences on the same timeline must be ordered and non-overlapping. An occurrence may be
temporarily unassigned while capture is incomplete or possession is disputed. Unknown possession
must not prevent recording an otherwise valid occurrence.

Suggested or automatic possession changes are operator conveniences, not authoritative basketball
judgments. Every change must be visible, immediately reversible, and correctable during review.
Possession inconsistency may produce a review warning but must not silently rewrite an occurrence,
Statistical Event, Team, Player, action, or outcome.

## Game Occurrences and Statistical Events

A Game Occurrence is the stable-identity record of one observed basketball moment or play. It owns
the shared evidence and context:

- Capture Session and therefore Game;
- Media identity, evidence timestamp, and optional evidence window;
- period and Game-clock annotation;
- optional Possession Sequence;
- source type: `human` or `model`;
- optional source confidence or model provenance;
- verification and voiding state; and
- creation and revision lineage.

A publishable Game Occurrence contains one or more Statistical Events. Each Statistical Event is
one typed statistical fact or credit within that occurrence. It owns:

- canonical event type and outcome under the snapshotted League Statkeeping Profile;
- participating Season Team;
- required and optional Player assignments with explicit roles;
- association with related Statistical Events through shared Game Occurrence identity; direct
  event-to-event relationship metadata is a future capability outside the initial delivery; and
- its contribution to Player Stat Line projection.

For example, one made-shot occurrence may contain a field-goal-attempt event with a shooter and
made outcome plus an assist event credited to another Player. One turnover occurrence may contain
a turnover event charged to one Player and a steal event credited to an opponent. A later rebound
is a separate occurrence because it has its own moment and evidence.

The occurrence abstraction prevents related statistical facts from duplicating timestamps,
possession context, clock state, and video evidence. Statistical Events remain separate so each
credit has an explicit actor, validation rule, projection effect, and future model label.

A Player assignment is publishable only when the Player is declared `appeared` and is eligible for
a participating Season Team through the Roster Membership at the Game competition eligibility
anchor. Capture may retain an unresolved or unidentified participant during draft work, but
unresolved attribution cannot produce a Player-specific published value.

An occurrence's `source` describes how it entered the ledger, not its authority. Model-proposed
occurrences and Statistical Events follow the same validation and review requirements as human
input. A confidence score never substitutes for human verification or accepted
automatic-publication policy.

Occurrences and Statistical Events used by a published projection are not hard-deleted. A
correction creates revision lineage, and an erroneous occurrence or event is voided or superseded
so prior publication, evidence, and training provenance remain inspectable.

An occurrence is at minimum `recorded` or `verified`; voiding is a separate disposition that
excludes its active Statistical Events from the current projection without erasing them. A material
change to a verified occurrence or contained event returns the replacement revision to `recorded`
unless the same authorized action explicitly verifies it.

## League Statkeeping Profile and Localization

The League owns one active, versioned League Statkeeping Profile. It defines the statistical
vocabulary and capture behavior used by new Capture Sessions. Every session snapshots the active
profile version at preflight so a later League configuration change cannot reinterpret historical
occurrences, Statistical Events, projections, or evidence.

Canonical event, outcome, and participant-role identifiers are stable and language-neutral. Every
operator-facing name, action label, outcome, instruction, validation message, and member-facing
statistic label is localized in English and French. The normal Courtside locale preference and
League-default fallback rules select the displayed label; changing locale never changes canonical
event identity or projection behavior.

Changing an active profile creates a new version rather than mutating one already referenced by a
Capture Session. Concrete Statistical Event definitions and localized labels are League-owned
configuration values rather than normative Courtside vocabulary. The profile must define, for each
Statistical Event type:

- required and optional participant roles;
- allowed Teams and possession relationships;
- outcomes and numeric contribution rules;
- whether the event suggests ending or retaining possession;
- compound action emissions grouped through shared Game Occurrence identity;
- projection targets in the Player Stat Line; and
- completeness requirements for deriving known zero.

Initial-delivery profiles cannot require a direct relationship from one Statistical Event to
another. The initial profile validator rejects any definition that requires such a relationship;
support for explicit event-to-event relationship metadata requires a later capability extension.

Profile definitions use a constrained, machine-readable form that Courtside validates. They may
select supported outcomes, participant roles, possession hints, and deterministic projection
operations; they cannot contain or invoke arbitrary executable code. Activating a profile version
requires every definition to have a unique stable identifier, English and French labels, valid
projection behavior, known-value coverage rules, and member presentation metadata consistent with
[`member-statistics.md`](member-statistics.md).

The capture interaction may create multiple Statistical Events inside one occurrence from a single
operator action. Interface click count must not determine the durable event model.

## Review and Correction

Capture favors speed; review establishes accuracy. An authorized reviewer can:

- seek to and replay the evidence around an occurrence;
- adjust the evidence timestamp or window;
- change occurrence clock state, event type, outcome, Team, Player, or participant role;
- attach, split, merge, void, or supersede occurrences and Statistical Events under profile rules;
- correct possession boundaries and ending reasons;
- resolve unidentified participants;
- inspect source and correction lineage;
- correct the preflight participation declaration;
- declare capture coverage; and
- compare projected values with the authoritative Game score.

The initial recorded value and every material accepted correction remain attributable to an actor
and timestamp. Published-value corrections follow the existing Player Stat Line rule: a changed
confirmed value returns to `provisional` unless the replacement is explicitly verified in the same
authorized publication.

Reconciliation is diagnostic. A difference between projected Player points and the authoritative
Team score must be visible, but it does not change the official score, invent missing events, block
standings, or require the operator to falsely attribute points. An authorized reviewer may publish
partial statistics while explicitly accepting the discrepancy with a reason. The affected scoring
coverage remains partial, and Courtside must not present it as a complete reconciliation.

## Session and Publication Lifecycle

A Capture Session follows:

```text
capturing -> in_review -> verified -> published
capturing | in_review | verified --when no Publication exists--> abandoned
verified --material change--> in_review
published --new correction revision--> in_review
in_review | verified --discard correction revision--> published
```

- `capturing` is resumable occurrence and event entry and may contain unresolved or incomplete
  observations.
- `in_review` indicates that primary capture is complete but corrections or reconciliation remain.
- `verified` means the current working revision has passed the required human review and is eligible
  for projection.
- `published` means a projection revision has been applied through the authoritative Player Stat
  Line mutation boundary.
- `abandoned` is terminal only for a session that has never produced a Publication. It closes that
  unpublished session without creating or changing Player Stat Lines.

Any material change to a verified but unpublished working revision returns it to `in_review` unless
the same authorized action explicitly re-verifies the replacement. A correction to a published
session creates a new working revision and preserves the last published projection until the
replacement revision is transactionally accepted. Discarding that correction working revision
returns the session to `published` without entering `abandoned` and without removing or altering
the last published revision.

The implementation may autosave frequently, but autosave does not verify or publish. A browser
confirmation, client state, or uploaded file alone never establishes publication.

## Coverage, Appearance, and Known Zero

Event absence is not evidence of zero. Roster eligibility is not evidence that a Player appeared.
Projection therefore requires explicit coverage semantics.

A verified session declares which video intervals and statistic categories were reviewed. A
verified occurrence establishes that its contained Statistical Events happened, but it does not by
itself establish that every occurrence needed for an aggregate was captured. A projected aggregate,
whether positive or zero, may be published as known only when the League Statkeeping Profile and
reviewed coverage establish that the relevant category was completely observed for a Player
declared `appeared`. Otherwise, the aggregate remains unknown even though its verified contributing
events remain visible as evidence.

Participation comes from Session preflight rather than event inference. A Player declared
`did_not_play` receives no appearance and no zero-filled Player Stat Line. A Player declared
`appeared` may receive known zero for a statistic only when the reviewed category coverage is
complete. Correcting participation recalculates the projection and may invalidate previously known
zeros.

Partial temporal or category coverage remains representable and must not be presented as complete.
The projection records enough coverage identity to explain why each published value is known,
provisional, or unknown.

## Stat-Line Projection

A Stat-Line Projection deterministically folds the current verified, non-void occurrences and
their active Statistical Events under the session's snapshotted League Statkeeping Profile version
into proposed Player Stat Line values. The projection identifies:

- Capture Session and working revision;
- League Statkeeping Profile and projector version;
- contributing occurrence and Statistical Event identities;
- coverage and participation basis;
- proposed known, unknown, completeness, and verification states;
- reconciliation warnings; and
- the existing Player Stat Line version it intends to create or replace.

The same canonical occurrence revision, Statistical Event revision, profile version, participation
declaration, and coverage basis must produce the same projection content. Projection does not
mutate authoritative records. Publication re-reads Game, authority, eligibility, current Player
Stat Lines, ledger revision, and projection basis inside the authoritative transaction. A stale or
conflicting basis is rejected without partial mutation.

Publication is idempotent and atomic across the affected Player Stat Lines, audit history, Capture
Session publication revision, and command receipt. It reuses the existing Player Stat Line identity
for the same Player and Game; it does not create a parallel performance record. A later profile or
projector version cannot silently reinterpret a historical published revision.

## Courtside Evidence Navigation

Courtside exposes evidence navigation from the existing membership-protected Player-statistics
surface:

- an individual Statistical Event opens or seeks directly to its parent occurrence evidence
  timestamp;
- a Game-level aggregate exposes the contributing occurrence and event set with their timestamps;
- a Player Game-log value exposes its contributing occurrences for that Game; and
- an aggregate without occurrence evidence remains a statistic and must not display a fabricated
  link.

The initial Media sources are YouTube videos viewable by anyone who has their link. Courtside limits
where it displays the timestamped references through the existing member-statistics authorization
wall but does not claim to revoke or enforce access after a YouTube link is copied or shared.
Unavailable or removed video is represented honestly even when its derived statistic remains
visible.

## Legacy Spreadsheet Export

Spreadsheet import is outside the Statkeeper boundary. Statkeeper is the event source rather than
a staging surface for a separately maintained sheet.

A later compatibility export may render published Player Stat Lines into the spreadsheet shape
used for prior Seasons. That export is a read-only projection for historical continuity: it does
not mutate Statkeeper or Courtside, become a second source of truth, or imply support for importing
an edited copy. Spreadsheet export is not part of the initial delivery.

## Training and Model-Inference Boundary

The event ledger is intentionally suitable for future model development. It preserves occurrence
evidence, Statistical Event labels, period and clock annotations, possession context, human
corrections, source provenance, and the coverage basis needed to identify negative or uneventful
reviewed spans rather than retaining only clips around positive events. In the initial delivery,
that basis is the canonical Media timeline together with accepted occurrences and Coverage Group
declarations, including supplied gap ranges; it is not a separately materialized training dataset.

Operational collection does not by itself authorize model training. Dataset admission requires a
separately accepted policy covering video rights, Player privacy, minors where applicable,
retention, deletion, dataset versioning, permitted uses, and reproducible train/evaluation splits.

A future model may propose occurrences, Statistical Events, participant assignments, possession
boundaries, clock annotations, or evidence windows. Model output enters as non-authoritative source
material and remains distinguishable from human input and verification. Automatic publication
requires a later accepted policy with explicit per-event accuracy, coverage, confidence,
monitoring, fallback, and rollback requirements.

## Authorization and Audit

League Statkeeper is a dedicated League-scoped assignment that persists until revoked. An active
League Statkeeper for the Game League may create, edit, review, verify, and publish Capture
Sessions, accept a scoring discrepancy with a reason, and correct published Statkeeper-managed
statistics through a new ledger revision. An active League Administrator for the Game League has
the same Statkeeper authority and exclusively assigns or revokes League Statkeeper assignments.

League Statkeeper grants no authority to create or change Games, authoritative scores, Season
configuration, Teams, rosters, Player identity, Player profiles, account relationships, other role
assignments, standings, or playoff advancement. Team Captains, Player managers, and ordinary
members receive no Statkeeper mutation authority unless they separately hold an active League
Statkeeper or League Administrator assignment.

League Statkeeper assignment and revocation, material publication, correction, voiding of published
evidence, Media replacement or remapping, and acceptance of a reconciliation discrepancy are
audited. High-frequency draft entry and autosave may use operational revision history rather than
one core Audit Record per click, provided published lineage remains attributable and append-only
audit requirements are satisfied at the authoritative boundary.

## Architecture Boundary

Within the modular monolith:

- pure occurrence, event, profile, possession, participation, coverage, lifecycle, and projection
  rules belong in `core`;
- capture, review, verification, and publication orchestration belongs in `services`;
- PostgreSQL persistence, YouTube or other player integration, video storage, and future inference
  providers belong in `adapters`; and
- the localized Statkeeper workspace belongs in the Next.js delivery surface and invokes the same
  server-verified application services as other administrative mutations.

The browser may control playback and report the current media time, but it does not receive direct
domain-table write access. Authoritative publication occurs server-side through a transaction. The
initial specification creates no cross-repository API or machine-readable public contract.

## Initial Delivery Boundary

The smallest useful delivery is post-Game, human-operated YouTube review:

1. select an anchored Game and load its eligibility-resolved participating rosters;
2. mark the eligible Players who did not play and confirm every remaining Player as appeared;
3. snapshot the active localized League Statkeeping Profile;
4. attach or select one YouTube Game Media item;
5. play, pause, scrub, and resume from saved progress;
6. maintain the period and Game-clock context, select current possession, select a Player, and
   record an occurrence and its Statistical Events at the automatic video timestamp;
7. review and correct occurrences and events through direct video seeking;
8. preview the derived Player Stat Lines and reconciliation warnings; and
9. publish an authorized, idempotent batch through the existing Player Stat Line boundary.

The interface must be keyboard-operable and optimized for repeated player/action entry. It must
keep the possessing Team prominent without making the other Team or an override inaccessible.
The default pointer interaction selects a Player from the prominent roster and then selects an
action. That interaction creates one occurrence containing the profile-defined Statistical Events
and records it against the current video, period, and Game-clock state without another timestamp
entry step. Keyboard shortcuts may provide the equivalent or faster path. Undo, recent-occurrence
inspection, clock and timestamp adjustment, and clear provisional state are required for a
high-throughput workflow.

## Deferred Decisions and Non-goals

The following remain deferred from this proposal:

- separate capture-only and reviewer roles beyond League Statkeeper;
- live recording and live official scoring;
- multi-camera synchronization;
- automatic Game-clock recognition or scoreboard OCR;
- video upload, transcoding, clip materialization, and long-term video storage;
- spreadsheet import and initial-delivery spreadsheet export;
- public Player-stat or evidence disclosure;
- model selection, dataset infrastructure, training, evaluation, and inference deployment;
- automatic event publication;
- replacing the authoritative Game score with an event-derived score;
- direct event-to-event relationship graphs in the initial delivery; compound initial-delivery
  relationships use shared Game Occurrence identity;
- a separate Statkeeper repository or service; and
- external or cross-League Statkeeper integrations.
