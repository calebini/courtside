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

A Player may not have overlapping Roster Membership intervals within the same Season, including duplicate overlap on the same Season Team. This database-enforced invariant prevents both conflicting team participation and duplicate active membership. The Player and Season Team must belong to the same League.

Adding a membership opens a new interval. Ending closes an open interval. Transferring atomically closes one open interval and opens a new interval for a different Season Team in the same Season at the identical effective instant. A transfer is rejected if another interval would overlap the new membership. Historical memberships remain visible to League Administrators.

## Authority, Time, and Audit

Every command re-resolves the authenticated User Account and active League Administrator assignment. Local effective date-times are interpreted in the League timezone and rejected when they identify no instant or more than one instant. Commands are idempotent through persisted command receipts.

Accepted Player and Roster Membership mutations write append-only Audit Records containing the actor, timestamp, action, prior value, new value, and optional reason. Unauthorized or invalid commands reject without mutation and preserve authoritative state.

## Delivery Boundary

The initial delivery surface is the authenticated `/{locale}/admin/rosters` route in English and French. It supports Player creation and display-name replacement, membership addition, ending, transfer, current roster inspection, and historical interval inspection.

Public Player profiles, public Team rosters, User Account-to-Player Management Relationships, member self-service, profile-photo storage, Team Captain workflows, roster imports, and Player Stat Lines remain deferred.
