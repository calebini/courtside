import {RuleViolation} from './errors';

export interface PlayerState {
  readonly id: string;
  readonly leagueId: string;
  readonly displayName: string;
  readonly version: number;
}

export interface RosterMembershipState {
  readonly id: string;
  readonly playerId: string;
  readonly seasonId: string;
  readonly seasonTeamId: string;
  readonly effectiveFrom: Date;
  readonly effectiveUntil: Date | null;
  readonly version: number;
}

function validInstant(value: Date) {
  return Number.isFinite(value.getTime());
}

export function normalizePlayerDisplayName(value: string) {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    [...normalized].length > 120 ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new RuleViolation(
      'player.display_name_supported',
      'A Player display name must be non-empty, contain no control characters, and use at most 120 characters'
    );
  }
  return normalized;
}

export function renamePlayerState(player: PlayerState, requestedName: string): PlayerState {
  const displayName = normalizePlayerDisplayName(requestedName);
  if (displayName === player.displayName) {
    throw new RuleViolation(
      'player.display_name_changes_value',
      'A Player display-name update must change the normalized value'
    );
  }
  return {...player, displayName, version: player.version + 1};
}

export function endRosterMembershipState(
  membership: RosterMembershipState,
  effectiveUntil: Date
): RosterMembershipState {
  if (membership.effectiveUntil !== null) {
    throw new RuleViolation(
      'roster_membership.open_required',
      'Only an open Roster Membership may be ended'
    );
  }
  if (!validInstant(effectiveUntil) || effectiveUntil <= membership.effectiveFrom) {
    throw new RuleViolation(
      'roster_membership.end_after_start',
      'A Roster Membership must end after it begins'
    );
  }
  return {...membership, effectiveUntil, version: membership.version + 1};
}

export function transferRosterMembershipState(
  membership: RosterMembershipState,
  targetSeasonTeamId: string,
  effectiveAt: Date,
  nextMembershipId: string
) {
  if (!targetSeasonTeamId || targetSeasonTeamId === membership.seasonTeamId) {
    throw new RuleViolation(
      'roster_membership.transfer_changes_team',
      'A Roster Membership transfer requires a different Season Team'
    );
  }
  const closedMembership = endRosterMembershipState(membership, effectiveAt);
  const newMembership: RosterMembershipState = {
    id: nextMembershipId,
    playerId: membership.playerId,
    seasonId: membership.seasonId,
    seasonTeamId: targetSeasonTeamId,
    effectiveFrom: effectiveAt,
    effectiveUntil: null,
    version: 0
  };
  return {closedMembership, newMembership};
}

export function rosterIntervalsOverlap(
  left: Pick<RosterMembershipState, 'effectiveFrom' | 'effectiveUntil'>,
  right: Pick<RosterMembershipState, 'effectiveFrom' | 'effectiveUntil'>
) {
  const leftEnd = left.effectiveUntil?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightEnd = right.effectiveUntil?.getTime() ?? Number.POSITIVE_INFINITY;
  return left.effectiveFrom.getTime() < rightEnd && right.effectiveFrom.getTime() < leftEnd;
}
