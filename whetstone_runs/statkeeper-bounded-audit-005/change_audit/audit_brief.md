# Whetstone Change Audit Brief

Workflow: audit_change
Profile: consistency

Reviewer instructions:
- Evaluate only the stated change intent and expected boundary.
- Do not perform a full convergence review.
- Treat unrelated polish, completeness, or future hardening concerns as out of scope.
- Report an issue only when it directly affects the change intent, expected boundary, or listed source specs.
- If a concern is outside the stated audit boundary, set in_scope=false.

## Audit Notes

Path: /Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/statkeeper-bounded-audit-005/audit-notes.md
Hash: bbf1efc841af2a0966b4539085e51b76074d1e817b10eaf476dd2e903ffa9952

# Courtside Statkeeper Bounded Audit 005

## Authorization

The user explicitly requested this bounded Whetstone re-audit after approving the same 14-file
payload for the preceding audits. The user approves sending this audit-notes file, every
specification listed under Authoritative Inputs, and Whetstone's built-in `consistency` profile
context to the nested Codex Reviewer for this read-only audit. Do not inspect or send unlisted
repository files. Do not mutate source specs.

## Audit Mode

Run one Whetstone `audit-change` consistency review. This is a reviewer-only bounded assessment,
not Phase 1, Phase 2, convergence, or an Editor workflow. Internal runner metadata must not be
reported as source-spec workflow state.

## Change Intent

Re-audit the Courtside Statkeeper capability and initial-delivery specifications after aligning the
general capability's event-relationship language with the initial delivery. The capability now
states that related Statistical Events are associated through shared Game Occurrence identity,
that direct event-to-event relationship metadata is future scope, and that the initial profile
validator rejects definitions requiring direct Statistical Event relationships.

Confirm that this patch resolves the independently repeated finding from audits 003 and 004 while
preserving the previously corrected Capture Session abandonment and correction-discard lifecycle.
Also check the full bounded Statkeeper change for regressions against accepted Courtside authority.

## Authoritative Inputs

### Target specifications

- `specs/statkeeper.md`
- `specs/statkeeper-initial-delivery.md`

### Accepted comparison authority

- `specs/overview.md`
- `specs/invariants.md`
- `specs/lifecycle.md`
- `specs/config.md`
- `specs/architecture.md`
- `specs/tech-stack.md`
- `specs/authentication.md`
- `specs/role-administration.md`
- `specs/rosters.md`
- `specs/player-stat-lines.md`
- `specs/member-statistics.md`
- `specs/public-portal.md`

## Expected Boundary

- The initial delivery has one human-operated Capture Session per anchored Game against one
  canonical YouTube recording.
- Every accepted Game Occurrence has period, Game-clock, and media evidence time and contains one
  or more projection-bearing Statistical Events.
- Initial compound Statistical Events associate only through shared Game Occurrence identity.
  Profiles requiring direct event-to-event relationships are rejected deterministically.
- Direct event-to-event relationship metadata is explicitly future capability and creates no
  ambiguity for initial profile validation, action expansion, persistence, projection, or tests.
- `abandoned` is terminal only when a Capture Session has no Publication. Discarding a correction
  is a distinct transition to `published` that preserves the latest Publication and member reads.
- League-profile versioning, stable canonical keys, bilingual presentation, dedicated League
  Statkeeper authority, secure transactions, audit lineage, concurrency, idempotency, replayable
  projection, manual-points coexistence, partial-value semantics, and evidence privacy remain
  consistent with accepted Courtside authority.
- Spreadsheet import, ML implementation, public Player statistics, multi-video capture, and all
  other explicitly deferred capabilities remain out of scope.

## Reviewer Questions

1. Is the shared-occurrence-only initial relationship model now unambiguous across both target
   specs, including profile definitions, validation, action expansion, projection, deferred scope,
   and verification?
2. Are the general future capability and the initial-delivery restriction clearly separated?
3. Are abandonment and correction-discard states, commands, preconditions, retained artifacts,
   audit behavior, and member-read effects still deterministic and mutually consistent?
4. Do aggregate ownership, temporal evidence, participation, projection, partial publication,
   authorization, localization, privacy, concurrency, idempotency, and manual-stat coexistence
   preserve the accepted authority set?
5. Does any blocker, major, or minor issue remain, and does it require a product-owner decision or
   only a narrow specification correction?

## Out Of Scope

- Phase 1, Phase 2, convergence, stability, or certification claims.
- Editor use, source mutation, automatic patching, or apply-back.
- Implementation code, migrations, UI design, spreadsheet workflows, or ML delivery.
- Reopening unrelated accepted product decisions.
- Cosmetic suggestions without determinism, authorization, privacy, consistency, or
  implementability impact.

## Requested Report

Report the verdict, `boundary_preserved`, blocker/major/minor counts, and every in-scope finding.
State whether the repeated relationship-language issue is resolved and whether the patch introduced
any regression. Separate out-of-scope observations and identify product-owner decisions only when
a narrow consistency correction cannot resolve the issue. Do not mutate source specs and do not
characterize this bounded audit as convergence.

## Specs To Check

### Spec 1: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/statkeeper.md

Hash: 5a782bbf514da2343113d9250e783024d6b1c9ede037b703ebd69f928f5e8342

```markdown
# Courtside Statkeeper Event Capture

- Status: proposed
- Spec version: 0.3.2
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
corrections, source provenance, coverage, and negative or uneventful reviewed intervals rather than
retaining only clips around positive events.

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
```

### Spec 2: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/statkeeper-initial-delivery.md

Hash: 72a0bab87fcb09281682e57828a75043502fa3bd248180d87fece3e8dcc2aed1

```markdown
# Courtside Statkeeper Initial Delivery

- Status: proposed
- Spec version: 0.1.2
- Last updated: 2026-08-29

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
- **Game Occurrence Revision** owns one observed moment, its temporal evidence, and its contained
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

An existing session is returned only for an identical idempotent retry. A different attempt to
start another session for the Game is rejected and directs the operator to resume the canonical
session.

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
source `human` from the authenticated operator; source is not accepted from the browser. The
accepted transaction persists the occurrence, contained events, possession change, new ledger
version, operational attribution, and Command Receipt atomically.

Reusing an occurrence identity within the session returns the existing result only when canonical
content is identical. Reusing it for different content is rejected. Command retries cannot create
duplicate Statistical Events or possession transitions.

## Revising and Voiding Occurrences

`revise_statkeeper_occurrence` accepts a stable occurrence identity, expected current occurrence
revision, expected session ledger version, and a complete replacement capture input. It runs the
same validation and expansion as initial recording and creates another immutable occurrence
revision. It never edits the prior revision in place.

`void_statkeeper_occurrence` creates a void revision that contributes no active Statistical Events.
A reason is optional before the first publication and required when correcting published evidence.

The commands are allowed in `capturing`, `in_review`, or `verified`. Editing a `verified` working
revision returns it to `in_review`. Editing a `published` session requires
`begin_statkeeper_correction`. Every accepted material edit increments the ledger version and
invalidates the prior projection hash.

## Operational Resume State

`save_statkeeper_progress` persists current playback offset, active period and clock context, and
UI-selected participant Team without changing ledger content. It uses `progress_version`, does not
invalidate review, and does not create a core Audit Record or Player-stat correction.

The client supplies expected progress version. A stale save is rejected or ignored with an explicit
stale result; it must not overwrite newer progress silently. Progress state never supplies authority
for publication and may be lost without changing authoritative occurrences or statistics.

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

Verification rejects structural errors but may retain warnings. It records verifier, verified time,
canonical ledger basis hash, canonical projection hash, scoring reconciliation result, and every
warning. The state becomes `verified` without mutating Player Stat Lines.

Any later material change invalidates both hashes and returns the working revision to `in_review`.
Saving operational progress does not.

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

- ledger basis hash and projection hash;
- Player lines and every projected value with coverage status;
- contribution occurrence and Statistical Event identities for each numeric value;
- Team recorded scoring subtotals;
- comparison with authoritative Game scores;
- participation, coverage, clock, possession, and validation warnings; and
- whether publication requires explicit discrepancy acceptance.

The preview does not reserve its result. Publication re-reads and recomputes the complete basis in
one transaction.

## Publication Command

`publish_statkeeper_revision` accepts command identity, session identity, expected ledger version,
expected verified ledger-basis hash, expected projection hash, whether the actor accepts a scoring
discrepancy, and an optional reason. Actor identity comes from the verified server session.

When either Team's recorded Player-points subtotal differs from its authoritative score, publication
requires explicit acceptance and a nonblank reason. The scoring Coverage Group is published as
partial as already represented by the verified projection, even if the reviewer declared the
observed video complete. When no mismatch exists, discrepancy acceptance is ignored and does not
create an audit reason.

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

Any failure rolls back all Player Stat Lines, values, publication records, session state, audits, and
receipt writes. Successful cache invalidation covers affected member Game logs, box scores,
leaderboards, and evidence reads before the application intentionally confirms success.

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

## Correction and Abandonment

`begin_statkeeper_correction` requires a `published` session, expected latest Publication identity,
current authority, and an optional reason. It creates a working revision based on the latest
published occurrence revisions, participation, possession, and coverage while leaving member reads
on the published snapshot. State becomes `in_review`.

The ordinary revise, void, participation, possession, coverage, verification, preview, and publish
commands operate on the correction revision. Published evidence voiding requires a reason.

`abandon_statkeeper_session` requires an unpublished `capturing`, `in_review`, or `verified`
session with no Publication and changes it to terminal state `abandoned`.

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

An accepted retry with the same command identity and canonical content returns the prior receipt.
Reusing that identity for different content is rejected. Rejected attempts create no material state
or receipt.

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

## Persistence and Database Invariants

The PostgreSQL adapter must independently protect at least:

- one active Profile Version per League and monotonic immutable versions;
- one active League Statkeeper Assignment per League and Account;
- terminal append-only assignment history;
- one Capture Session per Game;
- immutable Game, League, Profile Version, and Media identity after capture begins;
- one participation declaration per eligible Roster Membership and session;
- one stable occurrence identity per session and ordered immutable revisions;
- contained-event ownership by exactly one occurrence revision;
- nonnegative Media offsets and valid evidence windows;
- valid Period and clock-state shapes;
- one open Possession Sequence per session;
- monotonic session ledger, progress, occurrence, and Player Stat Line versions;
- immutable Publication identities, hashes, and contribution mappings;
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

## Verification Requirements

Unit tests cover:

- profile canonicalization and every invalid reference or unsupported primitive;
- action expansion, optional compound credits, Team relationships, and possession effects;
- exact, estimated, unavailable, regulation, and overtime clocks;
- DNP and eligibility enforcement;
- occurrence revision and void behavior;
- complete, partial, unknown, and known-zero projection;
- scoring reconciliation and discrepancy acceptance;
- deterministic projection hashes; and
- published correction, never-published abandonment, and correction-discard transitions.

PostgreSQL integration tests cover:

- active-profile, active-role, one-session, revision, participation, and publication constraints;
- current Statkeeper and League Administrator authorization;
- revoked-role rejection;
- command retry and payload-conflict behavior;
- stale ledger and Player Stat Line version rejection;
- atomic publication and rollback at every material failure point;
- manual-points coexistence and first Statkeeper conversion;
- append-only published evidence and audit;
- no direct `anon` or `authenticated` domain-table writes; and
- migration replay from an empty database and from representative manual-points fixtures.

Playwright coverage includes:

- English and French profile labels and Statkeeper routes;
- League Administrator Statkeeper assignment;
- DNP preflight;
- YouTube timestamp capture through a deterministic player test double where provider automation is
  unreliable;
- Player/action compound occurrence entry and possession switching;
- review, coverage, reconciliation, verification, and publication;
- member aggregate-to-evidence navigation; and
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
- changing a session to a later Profile Version;
- Media replacement or timeline remapping after the first occurrence;
- automatic Game-clock recognition;
- model training, inference, or model-proposed occurrence delivery;
- automatic publication;
- separate capture-only and reviewer roles;
- external integrations, public APIs, or a separate Statkeeper service; and
- production rollout before backup, restore, privacy, YouTube availability, and operational support
  requirements are exercised.
```

### Spec 3: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/overview.md

Hash: 05331723f3ac2159f97ececa1f328f92e84f76758fc07bea09fd5fac5478c4dd

```markdown
# Courtside Core Domain Overview

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

Courtside owns the core domain for operating a recreational basketball league across seasons. It defines durable league, team, player, account, competition, standings, playoff, media, venue, localization, authorization, and audit concepts without prescribing a database, API style, framework, or deployment architecture.

This specification family is authoritative for domain terminology and behavior. `README.md` remains orientation only.

Private Player profile access, photo handling, and the User Account relationship lifecycle are
further constrained by [`player-management.md`](player-management.md).
Authenticated League-wide Player-stat visibility and points aggregation are further constrained by
[`member-statistics.md`](member-statistics.md).

## Scope

Courtside covers persistent league, team, player, and user-account identity; season-specific team participation, rosters, schedules, results, standings, and playoffs; provisional, partial, confirmed, and corrected player game statistics; configurable score-based standings and round-specific playoff series; league-scoped administration and season-team captain authority; simple venues and reusable media associations; English and French user-interface and authored-content localization; and simple audit records for material administrative changes.

## Canonical Concepts

A League is the persistent organization that owns seasons, league defaults, supported languages, the league timezone, administrator assignments, venues, and the league gallery. Courtside currently assumes one organizational league boundary; cross-league identity and competition are out of scope.

A Season is a competition cycle within a League. It owns participating Season Teams, Games, standings configuration, playoff configuration, and frozen configuration versions needed to reproduce historical outcomes. A Season created in error may be deleted only while it has no dependent domain records; used Seasons are retained for a separately defined end or archive lifecycle.

A Team is a durable team identity that persists across Seasons. Season roster and Season results belong to Season Team participation, not directly to Team.

A Season Team is one Team participating in one Season. It owns that Season roster memberships, Season-specific captain assignments, schedule participation, and derived Season performance. At most one Season Team may connect the same Team and Season.

A Player is a durable participant identity within the League history and exists independently of team participation and authentication.

A Roster Membership is a Player membership in one Season Team over an effective period. Transfers close the prior membership and open a new one without rewriting historical Games or Player Stat Lines. A Player may not have overlapping active memberships in more than one Season Team in the same Season.

A User Account is a login identity and is never the same domain entity as a Player. Accounts may exist without Players, Players may exist without accounts, one account may manage multiple Players, and multiple accounts may manage one Player through separately approved relationships.

A Player Management Relationship is an approval-controlled relationship authorizing a User Account to manage a Player profile. Approval and revocation are performed by a League Administrator and are audited.

Authorization is expressed through scoped assignments. League Administrator assignments apply to one League and persist across Seasons until revoked. After the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics. Team Captain assignments apply to exactly one Season Team and are assigned, reassigned, or revoked by a League Administrator. In Phase 1, Team Captain is a scoped domain authority marker and does not independently grant authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

A Game is a scheduled basketball match between two distinct Season Teams in the same Season. It records schedule, venue, competition phase, lifecycle status, authoritative score when available, optional Player Stat Lines, and optional Media associations. Regular-season and playoff Games share the same Game concept.

A Player Stat Line is a Player statistical performance in a Game, attributed through the Roster Membership that made the Player eligible for one participating Season Team. Every statistical value distinguishes unknown from known zero. A line may be partial and has an independent verification status of provisional or confirmed.

Team Statistics are derived Season-Team performance calculated from authoritative Game results and, where explicitly needed, aggregated Player Stat Lines. The authoritative Game score remains the source for points for, points against, and result-based standings calculations.

Standings are derived rankings of Season Teams under the Season frozen standings configuration. They are never directly edited and are recomputed from eligible authoritative Game outcomes plus explicit, audited adjustment records if configuration permits adjustments.

A Playoff Bracket is a fixed advancement structure composed of ordered Rounds and Matchups. Initial Matchup slots are filled by seeds; later slots reference winners of fixed prior Matchups. Matchups contain a round-configured number of Games and advance the team with the greater aggregate score under the configured aggregate-tiebreak policy.

A Venue is a reusable League-owned location with a name, address, and optional notes. A Game may reference one Venue and may add Game-specific court or arrival instructions.

Media are optional photo records or YouTube links. The same Media item may be associated with Games, the League Gallery, or both. Association is independent of Media identity.

Courtside supports English and French localization. UI strings and authored content are localizable. Team names, Player names, and other proper names remain language-neutral. A saved account preference selects a supported language; otherwise the League default language is used. Missing requested content falls back to the League default.

An Audit Record is an append-only explanation of a material administrative change. The minimum record contains actor, timestamp, action, previous value, new value, and an optional reason. A reason is mandatory for correcting a finalized or forfeited Game result.

## Derived Data Authority

Authoritative Game outcomes produce regular-season standings, Season-Team result statistics, playoff aggregate scores, and playoff advancement. Player Stat Lines produce Player game logs and optional detailed Team Statistics. Player-stat availability or completeness must never block an authoritative Game result, standings recomputation, or playoff advancement.

## Non-goals

Non-goals include database tables, identifiers, indexes, API endpoints, event schemas, transport formats, programming language, framework, authentication provider, media host, deployment platform, divisions, conferences, inter-league competition, cross-league Player identity, automatic proper-name translation, treating detailed Player statistics as a prerequisite for standings, and directly editing derived standings or playoff advancement.
```

### Spec 4: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/invariants.md

Hash: 170536661d43dab83e3598c5947898ba79244be031d99758ca0fe3092a01c9c0

```markdown
# Courtside Domain Invariants

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

These rules must remain true across implementations, schemas, APIs, recalculations, imports, corrections, and administrative operations.

## Identity and Participation

A User Account and Player are distinct. A Player exists independently of User Accounts and team participation. A Team persists independently of any one Season. Season-specific roster, captain authority, Games, and performance attach to Season Team rather than directly to Team. At most one Season Team connects the same Team and Season. A Player may not have overlapping effective Roster Memberships for different Season Teams in the same Season. Transfers preserve historical membership, Game, and Player Stat Line attribution. A User Account may manage a Player only through an approved Player Management Relationship. Player management is many-to-many. Player Stat Line eligibility is evaluated against the Game competition eligibility anchor, and later scheduling, finalization, forfeiture, or result correction does not change historical attribution.

## Authorization

League Administrator authority is scoped to one League and persists across Seasons until revoked. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap, and the final active League Administrator cannot be revoked. Team Captain authority is scoped to exactly one Season Team. Only a League Administrator may delete an eligible unused Season, approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign or revoke League Administrator authority after bootstrap, assign or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts. Approved Player Management Relationships grant authority only to update the linked Player's `display_name` and `profile_photo`; this includes an individual member updating the photo of their own linked Player. Team Captain authority grants no independent core mutation authority in Phase 1. An authenticated and provisioned Account with an active League Administrator Assignment, active Team Captain Assignment, or approved Player Management Relationship may read every Player's member-visible statistics in the same League; open registration and `requested` or `revoked` relationships grant no such access, including declined requests persisted as `revoked`. Read visibility never grants Player profile or statistic mutation authority. Role and management-relationship changes are audited. Unauthorized mutations and unpermitted lifecycle transitions are rejected without mutation and produce the required rejection report.

## Season Retention

A Season with any dependent domain record cannot be deleted. Season deletion never cascades to
Season Teams, Games, Roster Memberships, configuration versions, Team Captain assignments, durable
League records, or append-only history. An accepted unused-Season deletion preserves the complete
prior Season value in one append-only Audit Record, and concurrent attempts produce at most one
material deletion. Used Seasons remain authoritative records until a separately accepted retention
or archival lifecycle applies.

## Games and Results

A Game belongs to exactly one Season. Home and away Season Teams are distinct and belong to the Game Season. A `final` or `forfeit` Game has authoritative non-tied score and a winning team consistent with that score. Non-authoritative statuses do not contribute to standings or completed playoff aggregates. Tied Games are prohibited; regulation ties continue through overtime until resolved. A `forfeit` has an explicit official score; derived systems never invent one. Correcting an authoritative result preserves previous value in append-only audit history and recomputes every affected projection. Regular-season and playoff Games are the same entity type distinguished by phase and optional Matchup association. `cancelled`, `final`, and `forfeit` are terminal except that authoritative result corrections may modify score or declared winner of `final` or `forfeit` Games while preserving status. A playoff correction conflict must be resolved in the same administrative action as the correction or the correction is rejected without mutation. Accepted halted correction resolutions make affected slots or Matchups halted in the current projection, exclude conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resume only when replacement authoritative outcomes exist under corrected bracket participants.

## Player Statistics

A Player Stat Line belongs to exactly one Game, Player, and Roster Membership establishing eligibility. Unknown and known zero are distinct. Completeness and verification are independent. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown. Player-stat completeness never affects standings eligibility or playoff advancement. Team points for, points against, and result-derived Team Statistics use authoritative Game score, not the sum of Player Stat Lines. A member box score uses the authoritative Game score unchanged, groups Players by eligibility-attributed Season Team, distinguishes absent, unknown, provisional, and confirmed recording states, and never treats its eligible-Player row set as proof of appearance. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action. Member totals, rates, and leaderboard rank use confirmed known values only; provisional values remain visibly provisional and unknown values contribute neither a numeric value nor a denominator observation. Roster eligibility alone never counts as a Player appearance.

## Standings

Standings are derived and cannot be directly edited. Only eligible authoritative regular-season Game outcomes and explicit configuration-permitted adjustment records may influence standings. Under defaults, games played equals wins plus losses, league points equal wins times two, and point differential equals points for minus points against. Default descending ranking order is league points, point differential, points scored, then random draw. A loss awards zero League Points. Random draw is used only when all earlier criteria remain tied. A random-draw result is persisted and audited and must not change because standings are viewed or recomputed from unchanged inputs. Exactly one persisted random-draw result may exist for a stable tie context. An idempotent retry, replay, duplicate request, or recalculation returns the existing result and artifact identity. An attempt to persist a different result for the same tie context is rejected without another draw or authoritative mutation. A standings projection identifies the frozen Season configuration version used. Playoff Games do not affect regular-season standings.

## Playoffs

A Playoff Bracket uses a fixed advancement graph and does not reseed. Initial Matchup participants resolve from seeds; later participants resolve from winners of fixed prior Matchups. A Matchup contains the Round-configured number of ordinary Games. Every configured Matchup Game is played to an authoritative outcome; early series termination based on Games won is prohibited. Advancement is determined by aggregate authoritative points, not Games won. The aggregate winner is the participating team with greater sum of authoritative Game points after configured Games and any aggregate-tiebreak overtime. Default aggregate-tiebreak overtime continues the final configured Game until the aggregate tie is broken. Aggregate-tiebreak points are part of the authoritative final Game score. A Matchup advances only from authoritative Game scores. A Matchup with incomplete outcomes must not advance automatically, and an attempted correction creating unresolved participant conflict is rejected before authoritative state changes. Accepted correction resolutions that halt advancement are deterministic by canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy resume conditions.

## Configuration and Reproducibility

The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

An ordinary pre-freeze standings update may alter only the accepted point values and ranking order. It must preserve all non-edited and unknown accepted configuration fields exactly, must leave `random_draw` last, and must not award a win less than or equal to a loss. No ordinary write path may alter mutable result configuration after the Season has a frozen configuration version.

## Localization

English and French are supported languages. The League default is exactly one supported language. A saved supported user preference overrides the League default. Missing requested localized content falls back to the League default. UI strings and authored content are localizable; proper names remain language-neutral. Dates and times render in the selected language but use the League configured timezone unless a future accepted specification introduces viewer-local scheduling.

## Venues, Media, and Audit

A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries. Accepted playoff-configuration amendment resolution reports identify the prior and amended configuration versions, changed playoff result-affecting fields, halted or affirmed slots or Matchups, conflicted downstream Games retained as historical records, current advancement effect, resume condition when halted, and canonicalized amendment-resolution identity used for deterministic retries.
```

### Spec 5: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/lifecycle.md

Hash: a3b8aada9d4b9b24f152d43d0678f46f8b5f537e0d63b36748f0f57a1404886a

```markdown
# Courtside Domain Lifecycles

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This specification defines state transitions and authority timing for Season configuration, rosters, Games, Player Stat Lines, permissions, standings, and playoff Matchups.

## General Lifecycle Failure Rule

For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, current state or condition, requested state or mutation, actor, and violated lifecycle rule. In-scope invariant, configuration validation, and authorization failures follow the same preserve-state rule and must identify the affected scope, attempted mutation, violated rule, and confirmation that authoritative records, persisted projections, and configuration versions remain unchanged. Auditing rejected attempts is not required unless the audit policy for that surface explicitly requires it.

Terminal states named in a lifecycle have no outgoing transitions except separately listed post-terminal corrections or administrative amendments. A post-terminal correction preserves terminal status unless this specification explicitly says otherwise.

## Core Mutation Authority

Mutation authority is evaluated at request time and scoped to the affected League, Season, Season Team, Player, or Game. League Administrators may create or delete an eligible unused Season; create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap, and an attempted revocation that would leave the League without an active League Administrator is rejected without mutation. Team Captain assignments are auditable scoped role markers and grant no independent core mutation authority in Phase 1. Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are deterministic projections and are not directly edited by any actor.

An approved Player Management Relationship grants authority to update only the linked Player's `display_name` and `profile_photo`. The approved account may belong to the Player themself or to another authorized manager, so an individual member linked to their own Player may update that Player's photo. League Administrators may update the same two fields for administrative support. No Player Management Relationship grants authority over identity linkage, roster membership, eligibility, statistics, Game outcomes, standings, playoff advancement, Season configuration, roles, or account credentials. Attempts outside this surface use the general authorization-failure rule.

For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field write an Audit Record preserving the prior and new value with actor, timestamp, action, and optional reason. The Audit Record is the required operational artifact for inspecting accepted Player profile field changes; no separate profile-change history substitutes for that mandatory audit surface in Phase 1.

## Season Configuration Lifecycle

A Season begins with mutable configuration derived from League defaults and Season overrides. The first accepted transition of any Season Game to `final` or `forfeit` freezes a single versioned snapshot of all result-affecting Season configuration for that Season. The freeze operation is idempotent per Season; later or retried authoritative Game transitions reuse the existing frozen version rather than creating another first version. Concurrent first-freeze attempts accept exactly one snapshot. A competing attempt reuses the created snapshot when it depends on the same result-affecting configuration basis, or is rejected without mutation when it depends on a different mutable configuration basis. All standings and playoff calculations identify the frozen configuration version they use. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record. Recalculation under an amended version is deterministic and applies to every affected derived projection, while historical versions remain available.

While `frozen_configuration_version_id` is absent, an active League Administrator may submit an audited ordinary configuration update limited to the accepted pre-freeze surface. The action locks the Season, preserves every configuration field outside that surface, and commits the changed configuration, complete prior/new audit values, and idempotent command receipt atomically. An unchanged, unauthorized, unsupported, or concurrently frozen request is rejected without mutation. Once a frozen version exists, both the application service and persistence boundary reject an ordinary `result_configuration` change; a direct record edit is not a substitute for a versioned amendment.

For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of exact result-affecting values captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that do not affect standings or playoff outcomes. Equal canonical basis identities reuse the existing frozen version. Unequal canonical basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.

## Unused Season Deletion Lifecycle

A Season created in error may be deleted only by an active League Administrator for its League and
only while it has no dependent domain records. Season Teams, Games, Roster Memberships, frozen
configuration versions, Team Captain assignments, and any later Season-owned record make deletion
ineligible. The operation requires exact typed confirmation of the current Season name, performs no
cascading cleanup, and never deletes durable League data or append-only audit history.

An accepted deletion locks and rechecks the Season and dependency state, appends a `season.deleted`
Audit Record containing the prior Season value and optional reason, deletes the Season, and persists
the idempotent Command Receipt in one transaction. The deleted name becomes available for reuse.
Concurrent requests accept at most one material deletion. Used Seasons have no deletion transition;
their future end or archive lifecycle requires a separate accepted specification.

## Roster Membership Lifecycle

A Roster Membership has an effective start and may have an effective end. A Player becomes eligible for a Season Team when a membership becomes effective. A Player may not have overlapping effective memberships for different Season Teams in the same Season. A transfer ends the prior membership before the new membership begins. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective. A Player Stat Line must reference the membership that established eligibility for that Game.

A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change expected timing but does not create Player Stat Line eligibility. Finalization and later authoritative result corrections do not change the anchor or rewrite attribution. A closed membership interval is terminal; later participation requires a new non-overlapping interval.

## Game Lifecycle

The normative Game statuses are `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit`.

A new Game begins as `scheduled`. While it remains `scheduled`, a legal reschedule mutation may replace its scheduled instant without changing status and must preserve the required scheduling-change history. A `scheduled` Game may become `postponed`, `cancelled`, `in_progress`, or `forfeit`. A `postponed` Game may return to `scheduled` with a revised scheduled instant, become `cancelled`, or become `forfeit`. Direct rescheduling without a status change is rejected from every status other than `scheduled`; a postponed Game must use the explicit `postponed` to `scheduled` transition. A `cancelled` Game has no authoritative competitive outcome and does not affect standings or playoff aggregates. `cancelled` is terminal and replacement competition requires a new or separately scheduled Game.

Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Administrative scheduled-instant entry, including initial scheduling and rescheduling, must identify exactly one instant in the League configured IANA timezone before the Game is mutated. A local scheduled value that is ambiguous during a daylight-saving overlap, nonexistent during a daylight-saving gap, or otherwise cannot identify one unambiguous instant is rejected without mutation unless the administrative input supplies enough offset or disambiguation information to identify exactly one instant. The rejection report must identify the Game, attempted scheduled value, League timezone, actor, violated scheduling rule, and confirmation that authoritative Game state and schedule history remain unchanged. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

An `in_progress` Game may become `final` after an authoritative non-tied score is recorded. An `in_progress` Game tied at the end of regulation continues through overtime until one team wins. A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and official non-tied score. `final` and `forfeit` are authoritative terminal outcome statuses and do not return to prior statuses. Detailed Player statistics are not required for `final` or `forfeit`.

## Authoritative Result Corrections

A League Administrator may correct the score or declared winner of a `final` or `forfeit` Game. A correction preserves authoritative status, writes an Audit Record containing actor, timestamp, action, previous value, new value, and mandatory reason, triggers deterministic recomputation of affected standings, Season-Team result statistics, playoff aggregates, and playoff advancement, and never silently rewrites prior audit history.

If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. A correction action that cannot resolve every affected downstream participant slot is rejected without mutating authoritative state, and no unresolved participant-resolution conflict state is persisted. Existing downstream authoritative Game records remain historically visible and are not silently changed.

The resolution report for an accepted correction must identify the corrected Game, affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are to apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under corrected bracket participants, or to apply the correction and explicitly affirm the existing downstream participant path as an audited administrative exception. Every accepted resolution writes an Audit Record, and the correction is rejected unless the chosen resolution is applied to every affected downstream participant slot in the same administrative action.

When the chosen resolution halts affected downstream advancement, the halted condition is observable in the current playoff projection and resolution report rather than as a new Matchup lifecycle state. The projection must mark each affected participant slot or dependent Matchup as halted by the accepted correction resolution, identify the corrected participant source that must be replayed, and exclude conflicted downstream authoritative Games from current advancement calculations for the corrected path while retaining those Games as historical authoritative records. A halted path resumes only when replacement authoritative outcomes exist for every affected configured downstream Game whose participant slots match the corrected bracket participants and fixed slot sources. Recomputations before that condition is satisfied must continue to report the same halted slots and must not advance through them.

The deterministic identity of an accepted correction resolution is composed of the corrected Game, the prior authoritative result value, the prior authoritative result audit or version identity being corrected, the corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same material correction action must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. A later correction of the same Game back to a previously used authoritative value is a distinct resolution identity when it corrects a different prior authoritative result value or prior result audit or version identity. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.

## Player Stat Line Lifecycle

Verification and completeness are independent. A Player Stat Line may be created or updated as `provisional` before or after the Game result becomes authoritative. A line becomes `confirmed` when its currently known values have been verified. A confirmed line may remain partial. Updating a confirmed value returns the changed line to `provisional` unless the same authorized action explicitly verifies the replacement. `confirmed` is not terminal; the only permitted post-confirmation mutation is an authorized value update that returns the changed line to `provisional` unless explicitly verified in the same action.

Each statistical value is either known, including known zero, or unknown because it has not been recorded. Human-readable completeness labels are derived from which expected values are known and are not substitutes for field-level known/unknown state. Adding later details does not change Game-result authority. Material stat changes are audited with actor, timestamp, action, previous value, new value, and optional reason.

## Player Management Lifecycle

A User Account-to-Player management relationship follows `requested -> approved -> revoked`. A User Account may create a `requested` relationship for itself and a Player. A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action. Only an approved relationship grants management authority. League Administrators approve and revoke relationships. Approval and revocation are audited. Multiple approved accounts may manage one Player, and one account may manage multiple Players. Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutation. `revoked` is terminal for that relationship; later access requires a new request and approval.

## Role Assignment Lifecycle

League Administrator assignment is scoped to one League and persists across Seasons until revoked. After bootstrap, League Administrators assign, reassign, and revoke League Administrator assignments for that League, but an assignment mutation that would leave the League without an active League Administrator is rejected without mutation. A Team Captain assignment is scoped to one Season Team, and League Administrators assign, reassign, and revoke Team Captain authority. Role assignment changes are audited. Ending a Season does not convert Team Captain assignment into authority over a later Season Team. A revoked role assignment is terminal; later authority requires a new assignment or reassignment under League Administrator authority.

## Standings Lifecycle

Standings are recomputed projections, not independently mutable records. Only eligible `final` and `forfeit` regular-season Games contribute. Any authoritative eligible result or permitted adjustment change invalidates the prior projection. Recalculation uses the applicable frozen Season configuration version. A random-draw tiebreak is performed only after all preceding ranking criteria remain tied. Each draw result is persisted and audited; rendering or recalculating unchanged inputs reuses it.

A random-draw tie context has a stable identity composed of Season, frozen Season configuration version, ranking step or criterion that invoked `random_draw`, tied Season Teams in canonical identity order before the draw, and equal preceding criterion values. Canonical identity order is ascending byte order of each Season Team immutable canonical domain identity as assigned when the Season Team is created. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result is rejected as a deterministic conflict without another draw. League Administrators do not override or replace the persisted draw in Phase 1.

## Playoff Matchup Lifecycle

Initial fixed-bracket Matchup slots resolve from configured Season seeds. Later Matchup slots resolve from winners of named prior Matchups. A Matchup contains the number of Games configured for its Round, and every configured Game must reach `final` or `forfeit` before normal advancement. The Matchup aggregate is the sum of authoritative scores. The team with greater aggregate advances through the fixed bracket. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into aggregate-tiebreak overtime until the aggregate tie is broken, even when the regulation score of that individual Game was not tied. Overtime points remain part of the final Game score and therefore the Matchup aggregate. Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or unknown tiebreak policy must not advance automatically and must report the violated rule.
```

### Spec 6: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/config.md

Hash: b37ec41c6c0373581b0b0d3d4628e5ebcd6403eeef059bb76d3062f80a1d495e

```markdown
# Courtside Domain Configuration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification defines the conceptual configuration surface and normative defaults. It does not prescribe a serialization format. YAML examples are illustrative unless a field or value is declared normative in prose.

## Authority and Precedence

Configuration resolves from normative Courtside defaults to League configuration to Season overrides to frozen Season configuration version. More specific values override less specific values only where permitted. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

The result-affecting configuration basis identity used for first-freeze comparison is canonical content identity of values captured in the frozen version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values.

Canonicalization occurs after resolving normative defaults, League configuration, and Season overrides. Omitted values equal their resolved explicit defaults. Ordered policy fields, including ranking criteria and playoff Rounds, retain their normative order. Semantically unordered identity collections are sorted by ascending byte order of immutable canonical domain identity. Enum values use their exact normative tokens; integers use exact mathematical integer values without display formatting; absent optional values remain distinct from present non-default values unless this specification declares a default. Implementations may choose serialization and hashing mechanisms, but equal canonical content must compare equal and unequal canonical content must compare unequal across implementations.

## League Configuration

A League defines one valid IANA timezone, supported languages including English and French, one default language selected from supported languages, League Administrator assignments, reusable Venues, and League-level defaults for new Seasons. The concrete timezone and default language are League data, not hard-coded product constants.

## Standings Configuration

The standings engine is configurable by Season. It defines League Points for each authoritative outcome, ordered ranking criteria, eligible competition phases and Game statuses, whether explicit standings adjustments are permitted, and how random-draw results are persisted and reused. The normative default awards two points for a win and zero for a loss; eligible Games are regular-season `final` and `forfeit`; ranking is `league_points`, `point_differential`, `points_scored`, then `random_draw`; adjustments are disabled.

All numeric ranking criteria sort descending. `random_draw` is evaluated only for teams still tied after every preceding criterion. Each performed draw records tied participants, canonical tied-participant order before the draw, preceding equal criterion values, resulting order, actor or system initiator, timestamp, applicable Season configuration version, and stable tie-context identity. The same unresolved tie context reuses the recorded result. The stable tie-context identity is composed of Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. An idempotent retry, replay, duplicate request, or recalculation returns the existing result and its artifact identity. An attempt to persist a different result for the same tie context is rejected as a deterministic conflict without another draw or authoritative mutation. League Administrators do not override or replace persisted draws in Phase 1.

The initial ranking vocabulary is `league_points`, `point_differential`, `points_scored`, and `random_draw`. Adding a ranking criterion requires a later accepted specification defining inputs, ordering direction, tie behavior, and reproducibility requirements.

Before the Season configuration freezes, a League Administrator may change the nonnegative integer win and loss League Points provided a win remains worth more than a loss, and may reorder `league_points`, `point_differential`, and `points_scored`. Each supported numeric criterion appears exactly once and `random_draw` remains the mandatory final criterion. This safe editor does not change eligible phases or statuses, adjustment policy, forfeit treatment, playoff configuration, or unknown accepted configuration fields. An accepted material change is audited; an unchanged request is rejected. Ordinary editing is unavailable after freeze, when only the separately specified versioned-amendment lifecycle may apply.

## Standing Calculations

For each Season Team under default rules: wins are eligible authoritative Games won; losses are eligible authoritative Games lost; games played equals wins plus losses; league points equal configured win and loss points; points for and against are sums of official eligible Game scores; point differential is points for minus points against; points scored is points for. A forfeit contributes its explicit official score. If standings adjustments are enabled later, each adjustment must be an explicit audited record rather than direct edit to derived standings.

## Playoff Configuration

Playoff structure is configurable per Round. Each Round defines stable Round identity and display order, fixed input slots from seeds or named prior-Matchup winners, number of Games in each Matchup, `aggregate_points` as advancement rule, and aggregate-tiebreak policy. Example Game counts are illustrative only. Season setup may initially contain no playoff Rounds, in which case no playoff schedule exists. A Season that uses playoffs must provide its actual Round list and Game count for each Round before playoff Games are created. `overtime` is the normative default aggregate-tiebreak policy and continues the final configured Game after regulation until the Matchup aggregate is no longer tied. Unknown policies are rejected rather than silently falling back. Round structure and policies are result-affecting frozen configuration and are subject to frozen amendment legality after dependent authoritative playoff Games exist.

## Game and Venue Configuration

Every Game has scheduled instant, home and away Season Teams, competition phase, optional Venue reference, and optional Game-specific venue instructions. Every Venue has stable League-local identity, name, address, and optional notes. The League timezone supplies scheduling interpretation for administrative entry and default display. Stored scheduled instants must remain unambiguous across daylight-saving transitions.

## Statistics Configuration

The concrete statistic vocabulary is deferred until the initial scorekeeping surface is specified. Any later vocabulary must preserve field-level known versus unknown state, known zero as valid value, line-level provisional or confirmed verification, confirmed partial lines, and independence between Player-stat completeness and Game-result authority. Points may be recorded before other statistics and must not imply unrecorded fields are zero.

## Localization Configuration

Language selection follows saved supported User Account preference, then League default language. If requested authored-content translation is missing, Courtside renders the League-default variant. UI and authored content must be capable of English and French variants. Proper names are stored and rendered without automatic translation. Concrete storage and editorial workflow are deferred.

## Account Onboarding Configuration

Each deployment explicitly configures registration as `open` or `closed`; missing and unknown values fail closed. The deployment also supplies one canonical HTTP or HTTPS site origin for confirmation and recovery redirects. Redirect destinations are application allowlists rather than caller-controlled URLs. Open production registration requires email confirmation, provider rate limits, and CAPTCHA or an equivalent abuse control. These deployment controls do not grant domain authority and are not part of frozen Season configuration.

## Authorization Configuration

The initial roles are `league_admin`, scoped to one League and persistent across Seasons until revoked, and `team_captain`, scoped to one Season Team. After bootstrap, existing League Administrators assign, reassign, and revoke League Administrator authority for that League, but cannot revoke the final active League Administrator. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection. Team Captain authority is a scoped role marker in Phase 1. Adding roles or changing authority requires an accepted specification update.

## Audit Configuration

Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, accepted Player `display_name` and `profile_photo` updates, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

An Audit Record for a playoff correction conflict resolution must include resolution type, prior authoritative result value, prior authoritative result audit or version identity being corrected, corrected authoritative value, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Retention duration, export format, and cryptographic tamper evidence are deferred.
```

### Spec 7: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/architecture.md

Hash: 5845c283b9ec441a854201e1729faf8c72f0d6bbdf073c3297e8b5b5e29fef35

```markdown
# Courtside Initial Architecture

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This specification translates the accepted domain and technology declarations into the initial modular-monolith boundaries. It owns implementation dependency direction and the first executable vertical slice; it does not define a public API.

## Dependency Direction

`src/courtside/core` contains deterministic domain values and calculations. It may depend on the TypeScript and Node.js standard libraries but not on Next.js, React, Vercel, Supabase, PostgreSQL clients, environment variables, or network APIs.

`src/courtside/services` coordinates authorized use cases and transactions through explicit internal ports. It may depend on the core but not on concrete adapters or Next.js delivery code.

`src/courtside/adapters` implements service ports for PostgreSQL and later external systems. Adapters may depend on services and core. PostgreSQL constraints and triggers protect cross-path integrity but do not become an alternate location for orchestration policy.

`src/app` is the Next.js delivery surface. It may invoke application services but does not own domain rules. No write-capable HTTP endpoint is exposed before Supabase Auth session verification and scoped League Administrator authorization are integrated.

## Transaction Strategy

Authoritative server-side mutations use `node-postgres` with parameterized SQL and an explicitly checked-out client for the full transaction. Runtime connections use a bounded pool configured by the PostgreSQL adapter. Supabase Data API calls are not combined to approximate an authoritative transaction, and PostgreSQL RPC functions are not used as a parallel application-service layer in this slice.

The PostgreSQL adapter connects with a server-only credential. Browser code cannot import the adapter or receive its connection string. Supabase Row Level Security remains enabled with no direct browser domain-table write policies.

## First Vertical Slice

The first slice begins with an existing `in_progress` regular-season Game and an active League Administrator. It accepts one command to finalize that Game with a non-tied authoritative score. In one transaction it:

1. serializes duplicate command handling and reuses an existing receipt for an identical retry;
2. verifies current League Administrator authority;
3. locks the Game and Season records;
4. validates the `in_progress` to `final` transition and authoritative score;
5. creates or reuses the single frozen result-affecting Season configuration version;
6. rejects a configuration-basis conflict without mutation;
7. persists the final Game result and the configuration version used;
8. appends the Game-finalization Audit Record;
9. reads authoritative regular-season outcomes inside the transaction and recomputes standings through the pure domain engine; and
10. persists an idempotent command receipt before commit.

The returned standings projection identifies the frozen configuration version. If every configured numeric criterion remains tied and no persisted random-draw order is supplied, the engine exposes an unresolved stable tie context instead of inventing an order. Performing and auditing the random draw is a later slice; callers must not present an unresolved projection as final ranked standings.

## Persistence Boundary

The initial migration contains only records exercised by the slice: League, User Account, League Administrator Assignment, Season, Team, Season Team, frozen Season Configuration Version, Game, Audit Record, and Command Receipt. It includes participant, status, score, winner, configuration-version, append-only-history, and direct-browser-access protections.

Standings are calculated projections and are not stored as editable rows. This slice recomputes them from authoritative Games on demand. A future cache or persisted projection must remain disposable and identify its configuration version.

## Failure Semantics

Domain, lifecycle, authorization, and idempotency failures roll back the transaction. Rejections identify the entity, current state or condition, requested mutation, actor, violated rule, and that authoritative state was preserved. Infrastructure errors also roll back but remain operational failures rather than domain rejections.

## Deferred Surfaces

The second slice adds the authenticated delivery boundary defined in `specs/authentication.md`: verified Supabase sessions, User Account resolution, current scoped League Administrator checks, a server-mediated Game-finalization action, and a read-only standings projection. Disposable local fixtures make the path demonstrable without serving as production bootstrap.

The third slice adds League Administrator delivery for regular-season Game scheduling and pre-result lifecycle management. Application services own scheduling, rescheduling, postponement, cancellation, and start orchestration through PostgreSQL transaction ports. League-local wall-clock input is resolved by a timezone adapter with ambiguous and nonexistent times rejected. Reusable League-owned Venues are persisted separately from optional Game-specific venue instructions. Every accepted operation is idempotent, rechecks current authority, locks the affected scope, and appends its audit history in the same transaction.

The fourth slice unifies finalization, forfeiture, and correction under the authoritative Game-result transaction. It accepts explicit-score forfeits, preserves terminal status during corrections, requires correction reasons, records a competition eligibility anchor, appends prior and replacement result values, and recomputes standings atomically. The administrative read model exposes completed Games and their result audit history.

The fifth slice adds a public, read-only League portal for schedule, official results, and standings. One PostgreSQL adapter supplies an explicit public projection to fresh localized Server Components. It reuses the pure standings engine, exposes no administrative or identity records, and creates no browser database access or public mutation endpoint.

The sixth slice adds League-owned Player identity and time-effective Roster Membership history. A pure core models name and interval transitions; an application service owns current authorization, timezone resolution, idempotency, audit, addition, ending, and atomic same-Season transfer; PostgreSQL enforces same-League ownership, half-open non-overlap, and terminal closed history. A localized protected roster desk exposes the workflow without publishing Player records or granting member and Team Captain authority.

The implementation now includes a staging-only League Administrator bootstrap service and PostgreSQL adapter behind a guarded, plan-first operator command. It still defers production authorization for that command, playoff correction conflicts, configuration amendment, persisted random draw, playoffs, detailed and public Player statistics, public Player profiles, media, spreadsheet import, public mutation APIs, and production deployment. Points-first Player Stat Lines extend the same pure-core, application-service, transactional PostgreSQL, authenticated Server Action, and append-only audit boundaries without affecting authoritative Game results or standings. Player Management Relationships, private member profile management, authenticated League-wide points visibility, Account onboarding, and initial staging authority extend the accepted boundaries through their dedicated specifications. Remaining surfaces must extend rather than bypass them.

The accepted member-statistics delivery boundary reuses server-verified authentication and derives a
read-only League-scoped projection from authoritative Games, Roster Membership attribution, and
Player Stat Lines. It admits only Accounts with a current trusted League relationship, exposes no
browser database access, and keeps public League projections Team-level. Confirmed known points
drive totals and rank; provisional and unknown values retain their distinct states at delivery.
The same projection supplies completed-Game box scores grouped by eligibility-attributed Season
Team while preserving the authoritative Game score independently of Player-stat coverage.

Initial Season setup follows the same delivery shape: pure name validation and normative defaults in core, current scoped authorization and idempotent orchestration in a service, one PostgreSQL transaction for Season, Audit Record, and Command Receipt persistence, and a server-derived actor at the bilingual administrator boundary. It deliberately leaves Team participation and playoff Rounds empty rather than copying local fixture data into a real League.

Post-bootstrap role administration follows the same authority boundary. Exact registered email resolves a provisioned target Account inside the transaction; the service owns current administrator authorization, idempotency, final-administrator preservation, atomic captain reassignment, and audit; PostgreSQL independently serializes final-administrator revocations and permits at most one active captain per Season Team. Team Captain assignments remain markers and do not grant new mutation paths.

Unused Season deletion follows the same delivery and transaction boundaries. The service owns exact
typed-name confirmation, current scoped authorization, dependency rejection, idempotency, and the
deletion audit. The PostgreSQL adapter locks the Season, checks current dependent records, deletes no
related rows, and relies on restrictive foreign keys to reject a racing or alternate-path delete that
would orphan history. League Setup exposes only the server-mediated operation.

Team setup extends that boundary with batch reconciliation of durable League Teams and Season Team participation. The service serializes changes through the affected Season or Season Team, reuses existing Team identity, audits each material creation or removal, and rejects removal when authoritative dependencies exist. PostgreSQL independently enforces Team-name and Season-participation uniqueness plus dependent-record referential integrity.

Venue administration extends the same boundary with durable League-owned Venue creation, audited correction, and terminal archival. Archived Venues remain available to existing Game read models but are excluded by the scheduling adapter from new or replacement schedules. PostgreSQL enforces normalized field bounds, immutable League ownership, and case-insensitive active-name uniqueness.

Pre-freeze Season configuration follows the same dependency direction. A pure core validates and merges only the accepted standings controls without dropping future configuration fields. The service owns current League Administrator authorization, Season locking, frozen-state and no-op rejection, full-value audit, and command idempotency. The PostgreSQL adapter performs the mutation transaction, and a database trigger independently prevents ordinary `result_configuration` changes once a frozen version is attached. The bilingual administrator surface becomes read-only at freeze and does not expose the deferred versioned-amendment workflow.

Administrator delivery is organized through a shared authenticated layout and route-specific Server Components. League Desk is a bounded state-driven overview; Games owns recurring competition operations; People and access retain their dedicated workflows; and League Setup owns infrequent configuration. These routes may reuse internal read models, but they invoke the same application services and do not become new domain or persistence boundaries. Active-Season selection is derived only from the authenticated administrator projection.
```

### Spec 8: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/tech-stack.md

Hash: debec3454308687da4c4b7abf0b5c10db466422f5d3e007caec7e874f62d0a32

```markdown
# Courtside Technology Stack Declaration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-07

## Purpose and Authority

This declaration defines the initial implementation platform and the boundaries that keep Courtside's domain behavior portable, testable, and safe to operate. It is normative for implementation choices but does not override the core domain specifications. If a platform convenience conflicts with a domain invariant, lifecycle rule, or authorization boundary, the domain specification prevails and this declaration must be amended.

## Declared Stack

| Concern | Declaration |
| --- | --- |
| Application language | TypeScript with strict type checking |
| Application runtime | A supported Node.js Active LTS release, pinned when the application scaffold is created |
| Package management | `npm` with a committed lockfile |
| Web framework | Next.js App Router |
| Application hosting | Vercel |
| Relational database | Supabase-managed PostgreSQL |
| Authentication provider | Supabase Auth, used for login identity rather than domain authorization |
| Media object storage | Supabase Storage |
| Localization | `next-intl` with English and French locale routes and translation dictionaries |
| Database lifecycle | Version-controlled SQL migrations managed through the Supabase CLI |
| Unit and domain testing | Vitest |
| Browser testing | Playwright |
| Database integration testing | A local Supabase/PostgreSQL stack rebuilt from committed migrations |

React is supplied through the supported Next.js release rather than versioned independently. Exact dependency versions are recorded by the application manifest and lockfile when implementation begins. Production dependencies must use supported stable releases and must not use unbounded version ranges.

## Application Shape

Courtside is a modular monolith with a stateless application runtime. Durable domain state lives in PostgreSQL, while media bytes live in object storage and are referenced by persistent database metadata. The initial deployment has one web application and one relational database; it does not introduce microservices, queues, event buses, or additional databases.

Core domain logic must remain independent of Next.js, Vercel, Supabase, HTTP, authentication tokens, and storage APIs. Application services coordinate use cases and authoritative mutations. Adapters own PostgreSQL, Supabase Auth, Supabase Storage, filesystem, spreadsheet, and network coupling. Next.js route handlers, Server Actions, and Server Components are delivery mechanisms and must not become competing locations for domain rules.

The initial application is server-mediated. Browser code may participate in Supabase Auth session handling and controlled media upload flows, but it must not receive a service credential or write directly to authoritative domain tables. A later proposal may allow narrowly scoped direct client access only when Row Level Security, audit behavior, and lifecycle equivalence are demonstrated by integration tests.

## Database Access and Transactions

PostgreSQL is the authoritative relational store. Database constraints enforce structural integrity and invariants that must survive every write path. Row Level Security is defense in depth, not the sole expression of domain authorization. Application services remain responsible for scoped authority, legal state transitions, audit requirements, and deterministic conflict handling.

Every authoritative mutation that changes related domain records, projections, configuration versions, or audit history must commit or roll back as one database transaction. Multi-step authoritative writes must not be implemented as unrelated Supabase Data API calls. Before the first write-capable vertical slice, the implementation must record one transaction-capable server-side query strategy; it may use parameterized PostgreSQL access or narrow transactional database functions, but it must not duplicate domain policy across both approaches.

Schema, constraints, functions, grants, and Row Level Security policies are changed through reviewed migrations committed to the repository. Production Dashboard or ad hoc SQL changes are prohibited during ordinary operation. An emergency database change must be captured immediately as a migration and reviewed for schema drift.

## Authentication and Authorization

Supabase Auth proves User Account identity and manages sessions and account recovery. It does not collapse User Account into Player and does not define a global `player` role.

League Administrator assignments, Season Team Captain assignments, and approved Player Management Relationships are persistent Courtside domain records. Authorization is evaluated from those current scoped records. Approved Player managers may update only the linked Player fields granted by the domain specifications. Team Captain assignments are scoped domain authority markers and grant no independent core mutation authority in Phase 1 unless a later accepted specification grants it. Service credentials and administrative database access must never be exposed to browser code.

The initial League Administrator bootstrap and the login methods offered to users must be specified before authentication is released. Neither choice may weaken the post-bootstrap administrator invariants.

## Localization

English and French use explicit locale routes and UI translation dictionaries managed through `next-intl`. Authored-content translations remain database content rather than UI dictionary entries. Proper names remain language-neutral.

Locale selection follows the domain configuration: a supported saved User Account preference, then the League default. Browser language detection must not override that precedence. Missing authored content falls back to the League default. Locale formatting uses the League timezone for dates and times unless a later accepted specification changes that behavior.

## Rendering and Cache Correctness

Next.js may server-render, prerender, or cache public pages when doing so preserves observable correctness. Standings, schedules, Game pages, Player records, and playoff projections are not assumed to be immutable static content.

Every accepted mutation identifies and invalidates its affected cached projections. Administrative confirmation must not report success while the application intentionally continues serving a known superseded authoritative result. A projection without a dependable invalidation path must use dynamic or uncached rendering until one exists.

## Statistical Import Boundary

The initial spreadsheet workflow is a controlled import pipeline rather than arbitrary SQL generation. It must:

1. preserve the original source file or a stable content hash;
2. parse rows into staging records without mutating authoritative data;
3. validate Game, Player, Roster Membership, statistic vocabulary, known-versus-unknown values, and duplicate identities;
4. produce a dry-run summary with row-level errors and the proposed changes;
5. apply an approved batch transactionally through the same authoritative mutation rules used by the application; and
6. persist batch identity, actor, importer version, source identity, outcome, and required audit records so retries are idempotent.

AI may assist with source-column mapping or error explanation. AI-generated SQL must not be executed directly against production domain tables.

## Media Boundary

Supabase Storage is the initial object store for Player profile photos and reusable photo Media associated with Games or the League Gallery. The database owns Media identity, associations, ownership metadata, publication state, and audit references. Upload flows enforce authenticated authority, generated object keys, supported MIME types, file-size limits, and image validation. Public delivery and upload authority must be separate concerns.

Database backup does not by itself protect stored media objects. Before production media is accepted, Courtside must define object retention, deletion behavior, export or replication, and restoration procedure. Cloudinary is not adopted initially and requires a later decision justified by concrete transformation or delivery needs.

## Environments, Deployment, and Recovery

Local development, preview or staging, and production use isolated durable data. Vercel preview deployments must not receive credentials that permit writes to the production Supabase project. Database migrations are verified from an empty local database before deployment and are applied through a controlled deployment step.

Vercel server-side compute must run in a region appropriate for the Supabase database. Runtime database access must use the connection mode appropriate to serverless execution and must not create an unbounded connection pool.

Before production launch, the project must declare its acceptable recovery point and recovery time, choose a Supabase plan or off-platform export schedule that meets them, cover both PostgreSQL and Storage objects, and complete a restore exercise. Managed backups are not treated as verified recovery until restoration has been tested.

## Verification Baseline

The first production-capable implementation must include:

- unit and property-oriented tests for standings, playoff aggregation, lifecycle rules, configuration freezing, and known-versus-unknown statistics;
- PostgreSQL integration tests for constraints, scoped authorization, Row Level Security, transactions, audit persistence, and import idempotency;
- migration replay from an empty local Supabase database;
- Playwright coverage for login, authorized profile-photo changes, core League Administrator flows, and at least one English/French route and fallback path; and
- a production build and type check in continuous integration.

Asynchronous Server Components are verified through integration or browser tests when the unit-test environment cannot execute them faithfully.

## Explicit Non-selections

The initial stack does not adopt microservices, message queues, event buses, GraphQL, Supabase Realtime, Edge Runtime database mutations, Cloudinary, a second database, direct browser domain writes, or direct AI-generated production SQL. These are not forbidden forever; each requires a concrete need and an accepted amendment.

The styling system, component library, transaction-capable query layer, external observability provider, analytics provider, email delivery provider, detailed statistics vocabulary, and final backup retention are intentionally deferred. Each must be decided before the first feature that depends on it, and none may change the architecture or domain boundaries implicitly.

## Ratification

This declaration was accepted on 2026-08-07 after the contained Whetstone consistency audit preserved the domain boundary and a corrective re-audit reported zero findings. Acceptance authorizes the application scaffold and implementation planning but does not itself define database tables, API contracts, or UI design.
```

### Spec 9: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/authentication.md

Hash: 953068fb5be61102d0b083d1d1ba0424eabb319fe6d62ecc3334ebf9159fc126

```markdown
# Courtside Authentication Delivery

- Status: accepted
- Spec version: 0.4.0
- Last updated: 2026-08-24

## Purpose

This specification defines registration, login, recovery, session verification, User Account provisioning, and the League Administrator bootstrap boundary. It does not grant domain authority through Supabase Auth and does not collapse a login identity into a User Account or Player.

## Login and Registration

The initial user-facing login method is email and password through Supabase Auth. A deployment configuration selects `open` or `closed` registration; missing or unknown configuration fails closed. The local demo selects open registration. Open registration creates authentication identity only and does not grant Player, Team, Season, or League authority.

Registration requires display name, email, language preference, and a password of 8 through 128 characters containing at least one letter and one digit. Supabase owns credentials, confirmation tokens, password policy enforcement, authentication rate limits, and recovery tokens. Courtside does not persist passwords or provider tokens.

The initial production posture is email confirmation before account provisioning. A successful registration that has no confirmed session renders the same check-email outcome whether the email is new or already registered. A later League-code or invitation policy may replace open registration without changing User Account or Player Management identities.

Local development may contain a clearly identified disposable Auth user and matching Courtside fixtures. Local credentials must not be reused outside the local Supabase stack and must never be treated as a production bootstrap mechanism.

## Session Verification

Every authenticated server-rendered page and Server Action verifies the current identity with Supabase Auth. Cookie contents or an unverified local session payload are not sufficient proof of identity. Authentication failure redirects interactive requests to the localized sign-in page without attempting a domain read or mutation.

The verified Supabase user identifier maps to at most one persistent Courtside User Account through `external_auth_id`. Email addresses and authentication-provider metadata are not domain authorization claims.

## User Account Provisioning

Provisioning is a server-side, idempotent operation following successful registration confirmation, authentication callback, or sign-in. It requires a Supabase identity verified by `getUser`, a confirmed email address, and a valid display name. It creates at most one independent Courtside User Account for `external_auth_id`, stores the normalized contact email for authorized administrator review, and stores English or French as the User Account language preference.

Repeated provisioning reuses the existing User Account, synchronizes its verified contact email and the explicitly selected supported language, and does not overwrite its Courtside display name. Provisioning does not create a Player or any Player Management Relationship. A newly provisioned Account must use the request-and-approval workflow in `specs/player-management.md`.

An authenticated but unprovisionable identity is signed out and receives a generic account-preparation failure. Server Components may resolve Accounts but do not provision them as a rendering side effect.

## Password Recovery

Password recovery accepts an email and always returns the same check-email response for invalid syntax, an unknown account, provider rejection, and an accepted request. Recovery links return through a fixed configured Courtside site origin and an allowlisted localized destination. The callback exchanges the single-use provider code for a verified server session; arbitrary `next` destinations are rejected.

Updating a password requires both the verified provider session created by the recovery callback and
a Courtside recovery authorization. The callback creates a cryptographically random authorization,
stores only its hash, binds it to the verified external identity, expires it after fifteen minutes,
and delivers the opaque value in an HttpOnly same-site cookie. The update atomically consumes that
authorization before one provider password mutation, then signs out. Ordinary authenticated
sessions, missing or mismatched cookies, expired authorizations, and replayed authorizations return
to sign-in without revealing account existence or provider details. A provider failure after
consumption requires a new recovery request.

## Authorization

Every authoritative mutation resolves the verified external identity to its Courtside User Account and evaluates current scoped assignments from PostgreSQL at request time. The browser never supplies the actor User Account identifier, and a previously rendered administrator page does not prove continuing authority.

An authenticated User Account without an active League Administrator assignment may sign in but receives no League Administrator data or mutation capability. Domain-table reads and writes remain server-mediated; Supabase `anon` and `authenticated` database roles receive no direct access to authoritative Courtside tables in this slice.

## Initial Administrator Bootstrap

Initial bootstrap is an explicit, controlled operational action that selects an already provisioned User Account by its normalized verified contact email and establishes the first League Administrator assignment in one server-side transaction. The action creates the initial League when the deployment contains none, or selects the sole existing League only when its name, IANA timezone, and default language exactly match the requested configuration. A deployment containing multiple Leagues is outside this initial command's scope.

The command is allowed only while the selected League has no League Administrator assignment history. A deployment-wide transaction lock serializes attempts before a League necessarily exists. The accepted transaction creates the League when required, creates the assignment, writes an Audit Record, and stores a Command Receipt. Retrying identical normalized bootstrap content reuses the accepted result even when the operator supplies a new command identity. Reusing a command identity for different content, changing accepted content, or attempting bootstrap after any administrator assignment history exists is rejected without mutation.

The delivered operator command is staging-only, uses the Supabase transaction pooler, verifies that an explicitly confirmed project reference matches the database connection, and performs a read-only plan unless the operator also supplies `--apply`. It does not create a Season, Team, Player, or Auth identity. Those records require separate deliberate setup. The local development fixture is not this bootstrap command. After bootstrap, all administrator assignment changes follow the accepted domain lifecycle and final-active-administrator protection. A production bootstrap remains blocked until this control is deliberately extended and exercised for a production target.

## Secure Mutation Delivery

Game scheduling, rescheduling, postponement, cancellation, start, finalization, forfeiture, and authoritative result correction are delivered through Next.js Server Actions. The actions accept only target references and requested changes from the browser, use server-generated command identities rendered with each form, derive the actor from the verified session, and invoke application services. Application services and PostgreSQL transactions remain the authority for scoped authorization, lifecycle validation, idempotency, scheduling history, configuration freezing, auditing, and standings recomputation.

Invalid input, authentication failure, authorization failure, and infrastructure failure must not leak credentials, raw database errors, or sensitive identity details to the browser.

## Deployment Requirements

Production release requires an explicit site URL, explicit registration mode, working transactional email provider, email confirmation, Supabase authentication rate limits, CAPTCHA or an equivalent abuse control for open registration, and an exercised confirmation and recovery runbook. Local Inbucket delivery is disposable development infrastructure rather than production email.

## Deferred Surface

This slice does not release production authentication, implement invitations, League codes, social login, passkeys, multi-factor authentication, authorize the bootstrap command for production, create Season or Team setup automation, grant direct browser access to domain tables, or change Team Captain and Player Management authority.
```

### Spec 10: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/role-administration.md

Hash: c0d8f78b544823fadf98cce746e2429f1f061b22d090a5db72e2cf26a2396ecd

```markdown
# Courtside Role Administration

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification delivers ordinary post-bootstrap administration of League Administrator and
Team Captain assignments. It does not expand either role's authority. League Administrators keep
their accepted League-wide authority; Team Captains remain Season-Team-scoped markers with no
independent mutation permissions in Phase 1.

## Assignment Rules

- Only an active League Administrator for the affected League may change either role.
- A target must already have a provisioned User Account. The administrator identifies the target
  by its exact registered email; the interface does not expose a global User Account directory.
- A League may have several active League Administrators. Granting an already-active assignment is
  rejected as a no-op. Revocation is terminal, and a later grant creates a new assignment.
- The final active League Administrator cannot be revoked. This safeguard is enforced in the
  service and independently in PostgreSQL, including concurrent revocation attempts.
- A Season Team has at most one active Team Captain. Assigning a different account atomically
  revokes the prior assignment and creates the replacement. Assigning the current account is
  rejected as a no-op. Revocation is terminal.
- Ending a Season does not transfer captain authority to another Season or Season Team.

## Audit and Delivery

Every accepted grant, reassignment, or revocation writes one append-only Audit Record containing
the actor, affected scope, previous and new assignment values, timestamp, and optional reason.
Commands are idempotent by command identity. The bilingual workflow lives under League Setup as
an infrequent authority control and rechecks authorization on every submission.
```

### Spec 11: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/rosters.md

Hash: 3cecf79cfc74ee5d8c7bfbd14f67b2c786760ba3bb1e42708a10f5ba8e32482c

```markdown
# Courtside Players and Rosters

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-08

## Purpose

This slice delivers League Administrator management of durable Player identity and Season-specific Roster Membership history. It does not connect Players to User Accounts, grant Team Captain mutation authority, publish Player information, or implement profile photos and Player statistics.

## Player Identity

A Player belongs to one League and persists independently of any User Account, Team, Season, or Roster Membership. `display_name` is required, language-neutral, trimmed, free of control characters, and at most 120 Unicode code points. Player names are not unique because different people may share a name.

An active League Administrator for the Player League may create a Player or replace its display name. Accepted creation and display-name replacement are audited. A replacement must change the normalized value.

## Roster Membership Intervals

A Roster Membership connects one Player to one Season Team and carries an effective interval. `effective_from` is inclusive and `effective_until` is exclusive. An open membership has no `effective_until`. Ending requires an instant strictly after `effective_from`. A closed membership is terminal and is never reopened or rewritten.

Season Team participation is established by the separately accepted Team setup workflow. It may be removed only before any Roster Membership, Team Captain assignment, Game, or other authoritative record depends on it. Removing participation never deletes the durable Team identity.

A Player may not have overlapping Roster Membership intervals within the same Season, including duplicate overlap on the same Season Team. This database-enforced invariant prevents both conflicting team participation and duplicate active membership. The Player and Season Team must belong to the same League.

Adding a membership opens a new interval. Ending closes an open interval. Transferring atomically closes one open interval and opens a new interval for a different Season Team in the same Season at the identical effective instant. A transfer is rejected if another interval would overlap the new membership. Historical memberships remain visible to League Administrators.

## Authority, Time, and Audit

Every command re-resolves the authenticated User Account and active League Administrator assignment. Local effective date-times are interpreted in the League timezone and rejected when they identify no instant or more than one instant. Commands are idempotent through persisted command receipts.

Accepted Player and Roster Membership mutations write append-only Audit Records containing the actor, timestamp, action, prior value, new value, and optional reason. Unauthorized or invalid commands reject without mutation and preserve authoritative state.

## Delivery Boundary

The initial delivery surface is the authenticated `/{locale}/admin/rosters` route in English and French. It supports Player creation and display-name replacement, membership addition, ending, transfer, current roster inspection, and historical interval inspection.

Public Player profiles, public Team rosters, User Account-to-Player Management Relationships, member self-service, profile-photo storage, Team Captain workflows, roster imports, and Player Stat Lines remain deferred.
```

### Spec 12: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/player-stat-lines.md

Hash: 86ad4027f0fb9db3a4e02d831a83d93bfc1fa21e5e0a1f7fe343b8e763223ed1

```markdown
# Courtside Points-First Player Stat Lines

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This slice delivers League Administrator entry and verification of Player points for an eligible
Game participant. It establishes the durable Player Stat Line lifecycle without pretending that
the later detailed-stat vocabulary is already available.

## Identity and Eligibility

A Player Stat Line belongs to exactly one Game, Player, Season Team, and Roster Membership. The
Roster Membership must connect that Player and Season Team, must be effective at the Game
competition eligibility anchor, and must belong to one of the Game participants. At most one
Player Stat Line exists for the same Player and Game.

Only Games with a competition eligibility anchor may receive a Player Stat Line. The initial
delivery surface exposes entry after a Game becomes `final` or `forfeit`, although the domain and
persistence rules also support an anchored `in_progress` Game for a later live workflow.

## Points, Completeness, and Verification

`points` is an optional nonnegative integer. A missing value is unknown and is never interpreted as
zero. Known zero is stored explicitly. The initial points-only line is always `partial`; adding a
points value does not claim that rebounds, assists, or another later statistic are known.

Verification is independent of completeness. A League Administrator may save changed points as
`provisional` or explicitly verify the submitted values as `confirmed`. Changing or clearing a
confirmed points value returns the line to `provisional` unless that same authorized command
explicitly confirms the replacement. A confirmed partial line therefore means only that its known
values have been checked.

Player point totals are not required to equal the authoritative Team score. Missing participants,
partial collection, score-sheet adjustments, and future statistic categories must not block an
official Game result. Team points for, points against, standings, and playoff advancement continue
to use the authoritative Game score exclusively.

## Mutation and Audit

An active League Administrator for the Game League may submit one idempotent batch containing
eligible Roster Membership identities and their points values. The service re-reads the Game,
authority, eligibility anchor, memberships, and current lines in one transaction. Duplicate,
ineligible, cross-League, unanchored, unauthorized, invalid, and unchanged submissions reject
without mutation.

Every changed line writes an append-only Audit Record containing its prior and new points,
completeness, verification status, version, actor, timestamp, and optional batch reason. The batch
and all of its line changes commit atomically with one Command Receipt. Retrying identical accepted
content reuses the receipt; reusing its command identity for different content is rejected.

## Delivery and Privacy Boundary

The initial UI is an expandable Player-points form attached to each completed Game in the
authenticated Games workspace. It groups eligible Players by participating Team, shows unknown as
a blank input and known zero as `0`, and shows the saved verification state. This slice does not
publish Player names, profile photos, Player Stat Lines, or game logs to the public portal and does
not grant Team Captains or approved Player managers statistics mutation authority. Authenticated
member visibility is separately governed by [`member-statistics.md`](member-statistics.md).

Detailed statistics, complete-line marking, live entry, spreadsheet import, Player aggregation,
and public Player pages remain deferred. The accepted member read experience may aggregate and
rank the delivered points field and present eligibility-aware completed-Game box scores without
changing this mutation boundary or deriving the authoritative Team score from Player values.
```

### Spec 13: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/member-statistics.md

Hash: eb774a925e5259ce2e5dc11d3f9bf6ee6d93e9dfa28ad88d94717e4eb0cf142e

```markdown
# Authenticated Member Player Statistics

- Status: accepted
- Spec version: 0.2.0
- Last updated: 2026-08-18

## Purpose

Courtside gives admitted League members a shared, read-only view of every Player's recorded
statistics. Public schedules, results, and standings remain Team-level surfaces. Individual Player
statistics belong to an authenticated member experience so the League can make performance visible
and enjoyable without publishing Player records to the open web.

This specification defines the visibility, aggregation, and delivery rules for the initial
points-first experience. It preserves the accepted two-stage collection model: points are delivered
first, while detailed basketball statistics are a later additive stage.

## Member Audience and Authorization

An Account may read member statistics for a League only after authentication, provisioning, and
server-side confirmation of at least one current trusted League relationship:

- an active League Administrator Assignment for that League;
- an active Team Captain Assignment for a Season Team in that League; or
- an approved Player Management Relationship to a Player owned by that League.

A `requested` or `revoked` Player Management Relationship does not grant member-statistics access.
A declined request is persisted in the terminal `revoked` state; `declined` is an administrative
outcome, not a separate authorization state. Open registration alone does not make an Account a
League member. A later general League membership concept may extend this audience only through a
separately accepted specification.

Every admitted member may view every Player's member-visible statistics within the same League.
Viewing a Player never grants management authority over that Player. Profile mutation continues to
require an approved Player Management Relationship or League Administrator authority, and official
statistic mutation remains restricted to League Administrators.

All authorization and reads are server-mediated. Browser code receives only the authorized member
projection and receives no database credentials or direct access to authoritative domain tables.

## Points-First Member Experience

The initial member-statistics surface is Season-scoped and provides:

- a scoring leaderboard across the selected Season;
- a searchable or browsable Player directory with Season Team context;
- a Player summary containing confirmed total points and the number of confirmed recorded points
  games; and
- a per-Game points log containing opponent, Game date, Team attribution, final score, known points,
  and verification state; and
- a completed-Game box score showing both participating Teams and their Player points recording
  status.

The newest available Season may be the initial selection, but the UI must not call it active or
current unless Courtside later accepts such a lifecycle concept. Members may select another
available Season when historical data exists. A transferred Player retains the Team attribution of
each Game; a Season summary may span multiple Season Teams and must not rewrite that history.

Member statistics use completed `final` and `forfeit` Games only. Schedule, authoritative result,
and standings views remain Team-level and continue to use authoritative Game scores rather than
Player Stat Line aggregates.

## Completed-Game Box Scores

Every member-visible `final` or `forfeit` Game has a game-centric box score. Its header shows the
Game date, participating Teams, terminal status, and authoritative final score. The authoritative
Game score is the only Team result value; it is never calculated, reconciled, or replaced by
summing Player Stat Lines.

For each participating Season Team, the box score groups every Player whose Roster Membership was
effective at the Game competition eligibility anchor. This row set describes statistic-recording
coverage among eligible Players, not a lineup or appearance record. The UI must not say or imply
that every listed Player participated in the Game.

Each Player row displays points availability and value separately from verification:

- no Player Stat Line or unknown points displays as `not recorded`;
- any known points value displays numerically, including known zero as `0`; and
- every known value also displays its independent `provisional` or `confirmed` verification label.

Verification never changes the numeric display, and a numeric value never implies a verification
state. In particular, both provisional zero and confirmed zero display as `0` with their applicable
verification label.

A Player Stat Line remains attributed through the Roster Membership that established Game
eligibility, including after a later transfer. The box score must not substitute a Player's current
Season Team for that historical attribution.

The points-first box score does not display a derived Player-points Team total because partial and
unknown collection could make it appear comparable to the authoritative Game score. A later UI may
show an explicitly labeled recording subtotal or coverage indicator only if it cannot be mistaken
for the Team result.

The member experience provides a path to the same box score from completed Game context and from a
Player Game-log entry. Exact route naming and presentation layout remain delivery choices.

## Unknown, Zero, and Aggregation

Unknown points and known zero remain distinct at every read boundary:

- a missing Player Stat Line or a line with unknown points displays as not recorded and contributes
  neither points nor a denominator observation;
- a confirmed line with known `0` contributes zero points and one recorded points game; and
- roster eligibility alone never proves that a Player appeared in a Game.

The UI therefore uses `recorded points games`, not `games played`, until Courtside owns an explicit
appearance statistic. Confirmed total points are the sum of confirmed known points. Points per
recorded points game are confirmed total points divided by confirmed recorded points games. Both
values must expose their recorded points game coverage so partial collection is not presented as
complete Season participation.

The initial scoring leaderboard ranks Players by confirmed total points descending. Players with
equal totals share the same rank; a stable presentation order does not break the statistical tie.
A Player appears after at least one confirmed known points value, including a confirmed zero.

A known provisional value may appear in the Player Game log or completed-Game box score with a
clear `provisional` label. It is excluded from confirmed totals, averages, and leaderboard rank. A
UI may show a separate pending subtotal, but it must not combine provisional and confirmed values
into an apparently authoritative total.

## Stage Two: Detailed Statistics

Detailed basketball statistics are a later additive stage. Stage Two extends the existing Player
Stat Line identity rather than creating a second performance record. Each added statistic remains
nullable so unknown differs from known zero, and the line may remain partial while only some fields
are available.

The member UI must reveal detailed fields only after their vocabulary, validation, aggregation,
and collection workflow are separately accepted and delivered. The same completed-Game box score
may then add the accepted detailed-stat columns; it must not create a parallel performance record
or render unavailable fields as zero. Each aggregate must define and expose its own known-value
coverage. Detailed leaderboards, appearance counts, minimum sample sizes, and derived rates require
explicit rules and must not be inferred from the points-first leaderboard.

Example future fields such as rebounds, assists, steals, blocks, and fouls are illustrative rather
than accepted Stage Two schema.

## Privacy and Disclosure

The member projection may disclose Player display name, Season Team attribution, completed Game
context, known Player statistics, completeness where relevant, and verification state. It does not
disclose User Account identity, email address, Player Management Relationships, administrative
reasons, Audit Records, Command Receipts, or prior corrected values.

This specification does not make Player profiles, profile photos, rosters, Player Stat Lines, or
game logs public. Profile-photo visibility remains governed by
[`player-management.md`](player-management.md). The unauthenticated portal remains governed by
[`public-portal.md`](public-portal.md).

## Delivery Boundary

The first delivery is a localized, protected, read-only member destination with a points
leaderboard, Player discovery, Player Game logs, and completed-Game box scores. English and French
labels are required, and Game dates render in the League timezone. The read model may aggregate
authoritative records for delivery but does not become an editable source of truth.

Member home-page organization, notifications, comparisons, badges, charts, exports, fantasy-style
features, public Player pages, detailed statistics, and member statistic corrections remain
deferred. Future member features must reuse this admission and read-authorization boundary unless a
later accepted specification changes it.
```

### Spec 14: /Users/Shared/Agent-Workspace/repos/personal/courtside/specs/public-portal.md

Hash: ee9037130703264c0858c9e94c4916bf20708eb165cea92a6fd8c617b85638d2

```markdown
# Courtside Public Portal

- Status: accepted
- Spec version: 0.2.0
- Last updated: 2026-08-25

## Purpose

The public portal provides read-only League information without requiring a User Account. It is a delivery surface over authoritative Courtside records and derived projections, not a separate source of truth.

## Public Information

Every League and Season in the current product phase is public by default. Public pages may expose League and Season names, League timezone, neutral Team names, Game schedule and lifecycle status, competition phase, Venue name and address, Game-specific venue instructions, authoritative final or forfeit scores, and derived standings.

Schedule dates and times render in the selected English or French interface language and the League configured timezone. A postponed or cancelled Game remains visible with its current status. An `in_progress` Game is identified as in progress, but Courtside does not invent or expose a live score before an authoritative result exists.

Results expose only `final` and `forfeit` Games with their current authoritative scores. Corrections appear as the corrected current result. The public portal does not expose prior result values, correction reasons, Audit Records, actors, User Accounts, assignments, command receipts, configuration internals, or rejection reports.

Standings are the same deterministic projections used by administrative surfaces. They use authoritative eligible regular-season results and identify unresolved final tiebreak contexts as provisional rather than inventing a rank.

## Routes and Freshness

English and French routes provide a public home, schedule, results, and standings. The initial route shape is `/{locale}`, `/{locale}/schedule`, `/{locale}/results`, and `/{locale}/standings`. It displays all public Leagues and their Seasons because League slugging and an explicit current-Season lifecycle are not yet accepted domain concepts.

The initial implementation renders fresh database-backed Server Components on each request. Browser code receives rendered public values but no database credential or direct domain-table access. A later cache may be introduced only with explicit invalidation that preserves observable freshness after accepted Game mutations.

## Deferred Privacy Surface

Public Player profiles, profile photos, Player Stat Lines, Player game logs, Media, and member identity are not part of this slice. The authenticated points-entry workflow does not change that boundary. Their publication requires an accepted privacy and visibility policy before delivery. Private Leagues or Seasons, tenant hostnames, League slugs, and custom public branding are also deferred.

The authenticated member visibility defined in [`member-statistics.md`](member-statistics.md) does
not expand this public boundary. Member Player statistics require an authenticated, provisioned
Account with a trusted League relationship.

## Installable Web App

The public home offers Courtside as an installable web app. Supporting browsers may launch their
native installation prompt; platforms without a programmatic prompt receive platform-appropriate
home-screen instructions. Once installed, Courtside launches in standalone display mode and enters
through locale negotiation before returning to the public portal.

Installation does not create a second data authority or weaken the portal's freshness promise.
This phase remains online-first and does not cache rendered League, Season, Game, Venue, or standings
data for offline reuse. The installed surface reads the same fresh server-rendered public records as
the browser surface.
```
