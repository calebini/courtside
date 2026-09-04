# Deliver Statkeeper Review, Coverage, and Projection Preview

- Status: accepted
- Date: 2026-09-05

## Context

The backend can start a Capture Session, record occurrences, control possession, and revise or
void occurrences with immutable lineage. The next delivery turns the current ledger into a
reviewable box score with honest observation coverage and evidence contribution identities.
The Statkeeper authority, initial-delivery specification, and capture-experience invariants remain
the governing product contracts.

## Decision

Deliver three internal server service operations:

- `submit_statkeeper_for_review` accepts command identity, trusted actor identity, Capture Session
  identity, and expected ledger version. Only `capturing` sessions with at least one current active
  occurrence and valid attributed event expansions may advance to `in_review`.
- `replace_statkeeper_coverage` accepts the same command envelope and the complete declaration set
  for the immutable Profile's Coverage Groups. Only `in_review` sessions may accept it.
- `preview_statkeeper_projection` accepts trusted actor and Capture Session identities and returns
  a provisional projection from a consistent database snapshot, without reserving or publishing it.

Both writes serialize through the existing command and session/head locks, advance the ledger
exactly once, and persist the accepted result, attribution, and receipt atomically. Identical
accepted retries acknowledge the original result, including after authority revocation; new writes
and previews require current League Statkeeper or League Administrator authority. Changed command
reuse, stale versions, wrong lifecycle, and invalid coverage or occurrence content create no
receipt or material state. Neither command changes playback progress.

### Coverage representation

Each declaration has `coverageGroupKey`, `status` (`not_reviewed`, `complete`, or `partial`), and
`gaps`. Only partial declarations have a nonempty gap list. A gap carries `reasonKey`, normalized
`explanation` or null, `period` or null, `clockRange` or null, and `mediaRange` or null. Supported
reasons are `missing_video`, `obscured_play`, `operator_uncertainty`, and `other`; `other` requires
nonblank explanatory text. Explanations use trim-then-NFC and valid Unicode scalar strings.

Ranges contain `startMs` and `endMs`. Media ranges follow increasing playback time; clock ranges
follow countdown time (`startMs >= endMs`), require a Period, and fit its configured duration.
Absent optional gap fields normalize to explicit null. Groups and gaps follow the canonical order
in the delivery specification. Duplicate canonical gaps are rejected; overlapping or adjacent
ranges remain separate declarations. Coarse reasons never imply interval-level negative examples.

Accepted sets are append-only `statkeeper_coverage_bases`, attributed to reviewer, session, working
revision, and the resulting ledger version after the coverage write. That resulting version is the
reviewed basis, avoiding immediate self-invalidation. The existing preflight coverage rows retain
the latest declared statuses for compatibility; the immutable basis and its ledger version are the
authority for freshness and gaps. Later material ledger writes make coverage stale by version
comparison. Reaffirming unchanged declarations against a newer ledger is a valid new review;
replacing identical, already-current coverage is a rejected no-op.

### Projection and evidence

Use `projector_identity = courtside.statkeeper.player-stat-projection/v1`. The pure projector checks
immutable occurrence envelopes and profile contributions, consumes only the current revision of
each occurrence, and rejects ambiguous or DNP assignments. Superseded revisions do not contribute;
void revisions retain lineage in the ledger basis and emit no values. An appeared Player receives
one preview line with each configured Statistic; DNP Players receive no line.

Reviewed complete groups produce sums including known zero. Partial groups produce recorded sums
labeled partial. Unreviewed or stale groups produce `not_recorded` values with explicit nulls;
their current event contribution identities and Team recorded scoring subtotals remain inspectable.
These are provisional working previews, never authoritative Player Stat Lines. Scoring mismatch
with either authoritative Team score produces discrepancy warnings and effective partial scoring
coverage for reviewed scoring values, without changing either official score. Preview readiness
describes coverage/structural prerequisites for later verification, not a verified or publishable
session state.

Each numeric contribution identifies its occurrence, current revision, Statistical Event, and
increment. The canonical ledger includes provider-neutral Media identity, participant declarations,
the complete current possession sequence/transition basis (including closed sequences), ordered
current occurrence payloads, verification/disposition, canonical coverage and reviewed version,
and effective scoring coverage. Official score changes also change the reconciliation/hash basis.
The projection hash includes the ledger hash, exact projector identity, ordered Player/Statistic
values, contribution identities, reconciliation, and discrepancy-acceptance requirement. Canonical
JSON, UTF-8 hexadecimal bytes, and expected digests are published in a committed test fixture.

Missing possession and temporal inconsistencies are review warnings, not reasons to discard visible
events. Previews also report stale/unreviewed coverage and scoring discrepancies. Structural errors
reject the preview instead of returning plausible totals from invalid ledger content.

## Consequences

- Review and coverage changes preserve receipts, audit attribution, prior declarations, and
  occurrence lineage; late persistence failures roll back the entire transaction.
- A read-only repeatable-read transaction keeps ledger, coverage, possession, and official-score
  inputs consistent even while another operator writes.
- No verification/publication command, authoritative generic Player Stat Value migration, browser
  route, capture UI, or video-player control is introduced in this slice.
- Standalone attach/split/merge remains deferred under Decision 0021. Future video and member
  surfaces can use the retained event identities and provider-neutral evidence basis.
