# Defer Standalone Statkeeper Review Restructuring

- Status: accepted
- Date: 2026-08-30

## Context

The Statkeeper MVP needs trustworthy correction without expanding the first delivery into a full
ledger-restructuring system. Record, revise, and void already let an authorized reviewer correct
evidence, attribution, outcome, clock, possession context, and active statistical contributions
through immutable history. The product capability previously named attach, split, and merge beside
those operations without defining their distinct lineage, projection, possession, publication, or
retry semantics. Treating an arbitrary sequence of existing commands as though one of those
operations had occurred would create authority and audit claims that the MVP cannot substantiate.

## Decision

The MVP exposes only record, revise, and void as occurrence-correction primitives. It does not
expose standalone attach, split, or merge commands or review actions.

Every accepted MVP correction preserves the immutable revisions, actor, accepted time, command
receipt, and audit records required by its actual command. Courtside must not label a sequence of
record, revise, or void commands as attach, split, or merge, and it must not invent source-to-target
lineage or contribution mappings that those commands do not create.

Attach, split, and merge remain explicit candidates for future promotion rather than rejected
capabilities. A successor delivery may promote one or more of them only through a separately
accepted specification update.

## Required Future-Promotion Contract

Before any promoted action is exposed or recorded, its specification must define:

- the exact source and replacement occurrence and Statistical Event identities, immutable lineage,
  and atomic source-to-target mapping;
- contribution mappings for projected Player Stat Values and the treatment of prior mappings;
- Profile rules and validation that make attachment, splitting, or merging legal;
- possession-sequence boundaries, ending reasons, automatic-transition causes, and correction
  conflicts affected by the operation;
- occurrence verification, Capture Session review state, coverage staleness, projection invalidation,
  and re-verification behavior;
- behavior before publication and during a correction after publication, including retained prior
  Publications and member evidence navigation;
- command identity, canonical payload, optimistic concurrency, transaction rollback, retry receipt,
  and idempotency rules; and
- actor attribution, reason requirements, audit presentation, authorization, and executable
  acceptance evidence.

If promotion changes the operator interaction rather than only the correction contract, the
capture-experience authority must receive a separately accepted update before implementation.

## Consequences

- The MVP remains buildable through its existing correction primitives without implying unsupported
  restructuring semantics.
- Audit and training provenance describe what actually happened instead of inferring a higher-level
  operation from a command sequence.
- Future restructuring remains visible and promotable, with its minimum semantic contract recorded
  before product or implementation work begins.
- Deferring these actions does not weaken direct evidence seeking, revision, voiding, possession
  correction, published correction, or immutable lineage required by the capture experience.
