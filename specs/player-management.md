# Player Management and Private Profiles

- Status: accepted
- Last updated: 2026-08-08

## Scope

This slice introduces the many-to-many relationship between User Accounts and Players without
making Players or profile photos public. A User Account may manage several Players and a Player
may be managed by several User Accounts.

## Authority and lifecycle

- A Player Management Relationship has exactly one of `requested`, `approved`, or `revoked`.
- A revoked relationship is terminal. A later grant is a new relationship with a new identity.
- At most one requested or approved relationship may exist for an Account and Player pair.
- An Account may request access using the exact Player reference supplied out of band by the
  League desk. The product does not expose an authenticated Player directory for discovery.
- A League Administrator may request, approve, create-and-approve, or revoke a relationship for
  a Player in their League.
- Only an approved relationship grants the Account authority to view and update that Player's
  private profile. League Administrators retain equivalent authority for Players in their League.
- Initial managed fields are `display_name` and `profile_photo` only.
- Requests, approvals, revocations, display-name changes, and photo changes are audited.

## Profile photos

- Profile photos are private and are not part of public schedules, results, standings, or rosters.
- Accepted uploads are JPEG, PNG, or WebP images from 1 byte through 1 MiB inclusive.
- Validation checks both the declared media type and the file signature. Original filenames are
  not authoritative and are not retained in object keys.
- Object keys are generated as `<player-id>/<random-id>.<canonical-extension>` in the private
  `player-profile-photos` bucket.
- The database owns the stable object reference, content type, byte size, and update timestamp.
- Delivery uses short-lived signed URLs after application authorization succeeds.
- Upload is completed before the database transaction. If the database write fails, the new
  object is deleted on a best-effort basis. The prior object is deleted only after the new
  database reference commits, also on a best-effort basis. Storage reconciliation remains an
  operational responsibility.

## Initial delivery boundary

The member portal provides My Players, exact-reference access requests, display-name changes,
and photo set, replace, and clear. The League desk provides relationship approval and revocation.
Account provisioning, invitations, public Player pages, crop tools, and image transformations are
deferred.
