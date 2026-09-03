# Deliver Statkeeper Authority and Game Queue

- Status: accepted
- Date: 2026-09-03

## Context

The capture backend can record an authorized occurrence, but the League Statkeeper assignment table
has no administration service and session preflight still accepts any provisioned actor. The next
backend slice must establish current scoped authority and a safe Game-selection read boundary
before an operator-facing Statkeeper destination is delivered.

## Decision

Extend the existing role-assignment service and PostgreSQL adapter with League Statkeeper grant and
revocation commands. Only a current League Administrator may perform either operation. A grant
resolves one provisioned Account by normalized exact registered email inside the transaction;
missing matches fail closed without exposing an Account directory. The existing case-insensitive
registered-email uniqueness constraint prevents ambiguous role targets.

Serialize Statkeeper grants and revocations through the League. Several Accounts may hold the
role, but duplicate active grants and inactive revocations are rejected as no-ops. Revocation is
terminal; regrant creates a new assignment identity. The assignment change, full prior/new Audit
Record with attribution and optional reason, and Command Receipt commit together. Identical command
replay acknowledges its prior acceptance; changed command reuse rejects. A new migration closes
the alternate-path gap that allowed an assignment ID to change during revocation, without
rewriting existing migrations or assignment history.

Use the same current League Statkeeper-or-Administrator lookup for occurrence recording, session
creation, and the Game queue. Session creation now checks capture authority before participant,
Profile, Media, or existing-session access. Profile activation remains administrator-only.
Accepted receipt replay remains an acknowledgement of an earlier write, not a new authorization
grant. All services continue to require a trusted server-resolved actor; browser binding remains
outside this slice.

Deliver a League-scoped, read-only queue service using a consistent PostgreSQL snapshot for current
authority and its explicit projection. It includes only completed `final`/`forfeit` Games with an
eligibility anchor, their Season, participating Team names, official scores, and canonical session
summaries. Session summaries expose pinned Profile identity, lifecycle, ledger/progress versions,
acknowledged playback offset, and last update; they expose no operator Account or contact details.
Unauthorized reads return no League or Game data and load no queue projection.

The queue groups capturing sessions first, completed Games without a session second, sessions in
review or verified third, and published sessions fourth. Abandoned sessions remain visible last as
terminal history, never as a new-start opportunity. Within a group, most recent session activity or
Game completion sorts first, followed by scheduled time and stable Game identity. Missing active
Profile configuration prevents a new start but does not prevent resuming an existing session with
its pinned Profile. Queue capability flags are guidance only; commands always recheck authority and
lifecycle independently.

Active Statkeeper assignments also admit existing member-statistics reads, as required by the
Statkeeper authority specification. They do not confer administrator or Player-profile authority.

## Consequences

- Backend callers can administer Statkeeper access and obtain a scoped Game/session queue without
  direct table writes or exposing unrelated administration data.
- Team Captain, Player manager, ordinary member, and other-League authority do not grant capture
  access. Revocation takes effect on subsequent queue reads and new capture commands.
- No screen, browser route, video player, detailed workspace/resume read, progress-save command,
  manual possession control, revision/void, review, projection, or publication is delivered here.
- The existing capture experience and deferred standalone attach/split/merge boundary are unchanged.
- Internal TypeScript ports and tests are sufficient; no public API or cross-repository contract is
  introduced.
