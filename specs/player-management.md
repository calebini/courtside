# Player Management and Private Profiles

- Status: accepted
- Last updated: 2026-08-24

## Scope

This slice introduces the many-to-many relationship between User Accounts and Players without
making Players or profile photos public. A User Account may manage several Players and a Player
may be managed by several User Accounts.

## Authority and lifecycle

- A Player Management Relationship has exactly one of `requested`, `approved`, or `revoked`.
- A revoked relationship is terminal. A later grant is a new relationship with a new identity.
- At most one requested or approved relationship may exist for an Account and Player pair.
- User-requested access is the normal workflow. An authenticated Account searches the deployment's
  single League Player directory and requests one existing Player created by a League Administrator.
- Player discovery returns no rows until the Account enters a non-empty Player display-name or
  Team-name query. Matching results expose only display name, current Team, and Season context.
  They do not expose profile photos or other private Player data.
- A League Administrator may approve or decline a requested relationship and may revoke an
  approved relationship for a Player in their League. Direct create-and-approve remains a domain
  capability for exceptional administration but is not the primary product workflow.
- Only an approved relationship grants the Account authority to view and update that Player's
  private profile. League Administrators retain equivalent authority for Players in their League.
  This private-profile authority is distinct from the League-wide authenticated statistics
  visibility defined in [`member-statistics.md`](member-statistics.md).
- Initial managed fields are `display_name` and `profile_photo` only.
- Requests, approvals, declines, revocations, display-name changes, and photo changes are audited.
- The League desk may approve or decline selected pending requests as a batch. Each request is
  authorized, committed, and audited independently so a stale or invalid request does not prevent
  valid selections from completing. The result reports successful and failed counts.
- A declined request uses the terminal `revoked` persistence state. A later attempt creates a new
  relationship rather than reopening the declined record.

## Profile photos

- Profile photos are private and are not part of public schedules, results, standings, or rosters.
- Accepted uploads are JPEG, PNG, or WebP images from 1 byte through 1 MiB inclusive. The server
  decodes the image, rejects malformed or excessive-pixel input, applies encoded orientation,
  strips metadata, re-encodes it in the detected canonical format, and rechecks the resulting size.
  The declared media type must agree with the decoded format. Original filenames are not
  authoritative and are not retained in object keys.
- Object keys are generated as `<player-id>/<random-id>.<canonical-extension>` in the private
  `player-profile-photos` bucket.
- The database owns the stable object reference, content type, byte size, and update timestamp.
- Browser sessions have no direct Storage policy. A server-only adapter performs upload, deletion,
  reconciliation, and short-lived signed delivery only after application authorization succeeds.
- Signed delivery references only the exact current object key stored by PostgreSQL. A Player has
  at most one authoritative current profile-photo reference.
- Upload is completed before the database transaction. If the database write fails, the new
  object is deleted on a best-effort basis. The prior object is deleted only after the new
  database reference commits, also on a best-effort basis. Storage reconciliation remains an
  operational responsibility. Server-mediated replacement and clear operations also prune known
  objects in the Player folder other than the authoritative current reference.

## Initial delivery boundary

The member portal provides My Players, searchable Player access requests, display-name changes,
and photo set, replace, and clear. The League desk centers pending requests with selected batch
approval or decline, shows the confirmed requester email to authorized administrators, and retains
relationship history. Account provisioning is defined in `specs/authentication.md`. Invitations,
multi-League account membership, public Player pages, crop tools, and image transformations are
deferred. Until multi-League account membership exists, the deployment contains one searchable
League boundary.
