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
not grant Team Captains or approved Player managers statistics authority. Public or member-facing
game logs require a separately accepted visibility policy.

Detailed statistics, complete-line marking, live entry, spreadsheet import, Player aggregation,
leaderboards, and public Player pages remain deferred.
