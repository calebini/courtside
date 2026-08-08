import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {
  endRosterMembershipState,
  normalizePlayerDisplayName,
  renamePlayerState,
  transferRosterMembershipState,
  type PlayerState,
  type RosterMembershipState
} from '@/courtside/core/roster';

interface BaseRosterCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly reason?: string | null;
}

export interface CreatePlayerCommand extends BaseRosterCommand {
  readonly type: 'create_player';
  readonly leagueId: string;
  readonly displayName: string;
}

export interface RenamePlayerCommand extends BaseRosterCommand {
  readonly type: 'rename_player';
  readonly playerId: string;
  readonly displayName: string;
}

export interface AddRosterMembershipCommand extends BaseRosterCommand {
  readonly type: 'add_membership';
  readonly playerId: string;
  readonly seasonTeamId: string;
  readonly localEffectiveAt: string;
}

export interface EndRosterMembershipCommand extends BaseRosterCommand {
  readonly type: 'end_membership';
  readonly membershipId: string;
  readonly localEffectiveAt: string;
}

export interface TransferRosterMembershipCommand extends BaseRosterCommand {
  readonly type: 'transfer_membership';
  readonly membershipId: string;
  readonly targetSeasonTeamId: string;
  readonly localEffectiveAt: string;
}

export type RosterManagementCommand =
  | CreatePlayerCommand
  | RenamePlayerCommand
  | AddRosterMembershipCommand
  | EndRosterMembershipCommand
  | TransferRosterMembershipCommand;

export interface RosterManagementResult {
  readonly receiptReused: boolean;
  readonly operation: RosterManagementCommand['type'];
  readonly player: {
    readonly id: string;
    readonly leagueId: string;
    readonly displayName: string;
    readonly version: number;
  };
  readonly membership: {
    readonly id: string;
    readonly seasonId: string;
    readonly seasonTeamId: string;
    readonly effectiveFrom: string;
    readonly effectiveUntil: string | null;
    readonly version: number;
  } | null;
  readonly previousMembership: RosterManagementResult['membership'];
  readonly auditRecordId: string;
}

export interface RosterManagementRejectionReport {
  readonly entityType: string;
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: string;
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class RosterManagementRejected extends Error {
  readonly report: RosterManagementRejectionReport;

  constructor(message: string, report: RosterManagementRejectionReport) {
    super(message);
    this.name = 'RosterManagementRejected';
    this.report = report;
  }
}

export interface StoredRosterReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: RosterManagementResult;
}

export interface StoredRosterLeague {
  readonly id: string;
  readonly timezone: string;
}

export type StoredRosterPlayer = PlayerState;

export interface StoredRosterSeasonTeam {
  readonly id: string;
  readonly seasonId: string;
  readonly leagueId: string;
  readonly leagueTimezone: string;
}

export interface StoredRosterMembership extends RosterMembershipState {
  readonly leagueId: string;
  readonly leagueTimezone: string;
  readonly player: StoredRosterPlayer;
}

export interface RosterManagementTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredRosterReceipt | null>;
  findLeagueForUpdate(leagueId: string): Promise<StoredRosterLeague | null>;
  findPlayerForUpdate(playerId: string): Promise<StoredRosterPlayer | null>;
  findSeasonTeamForUpdate(seasonTeamId: string): Promise<StoredRosterSeasonTeam | null>;
  findMembershipForUpdate(membershipId: string): Promise<StoredRosterMembership | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  hasOverlappingMembership(input: {
    playerId: string;
    seasonId: string;
    effectiveFrom: Date;
    effectiveUntil: Date | null;
    excludeMembershipId?: string;
  }): Promise<boolean>;
  insertPlayer(player: StoredRosterPlayer): Promise<void>;
  updatePlayerDisplayName(input: {
    playerId: string;
    expectedVersion: number;
    displayName: string;
  }): Promise<void>;
  insertMembership(membership: RosterMembershipState): Promise<void>;
  closeMembership(input: {
    membershipId: string;
    expectedVersion: number;
    effectiveUntil: Date;
  }): Promise<void>;
  appendAuditRecord(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: RosterManagementResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface RosterManagementStore {
  transaction<T>(work: (transaction: RosterManagementTransaction) => Promise<T>): Promise<T>;
}

export interface RosterEffectiveInstantResolver {
  resolve(localDateTime: string, timeZone: string): Date | null;
}

export interface RosterManagementDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function commandEntity(command: RosterManagementCommand) {
  switch (command.type) {
    case 'create_player':
      return {type: 'League', id: command.leagueId};
    case 'rename_player':
    case 'add_membership':
      return {type: 'Player', id: command.playerId};
    default:
      return {type: 'RosterMembership', id: command.membershipId};
  }
}

function rejection(
  command: RosterManagementCommand,
  violatedRule: string,
  message: string,
  currentStateOrCondition: string,
  entity = commandEntity(command)
) {
  return new RosterManagementRejected(message, {
    entityType: entity.type,
    entityId: entity.id,
    currentStateOrCondition,
    requestedMutation: command.type,
    actorAccountId: command.actorAccountId,
    violatedRule,
    authoritativeStatePreserved: true
  });
}

function normalizeReason(value: string | null | undefined) {
  return value?.trim() || null;
}

function commandPayload(command: RosterManagementCommand) {
  const base = {
    actor_account_id: command.actorAccountId,
    reason: normalizeReason(command.reason)
  };
  switch (command.type) {
    case 'create_player':
      return {...base, league_id: command.leagueId, display_name: command.displayName.trim()};
    case 'rename_player':
      return {...base, player_id: command.playerId, display_name: command.displayName.trim()};
    case 'add_membership':
      return {
        ...base,
        player_id: command.playerId,
        season_team_id: command.seasonTeamId,
        local_effective_at: command.localEffectiveAt
      };
    case 'end_membership':
      return {
        ...base,
        membership_id: command.membershipId,
        local_effective_at: command.localEffectiveAt
      };
    case 'transfer_membership':
      return {
        ...base,
        membership_id: command.membershipId,
        target_season_team_id: command.targetSeasonTeamId,
        local_effective_at: command.localEffectiveAt
      };
  }
}

function playerResult(player: PlayerState) {
  return {
    id: player.id,
    leagueId: player.leagueId,
    displayName: player.displayName,
    version: player.version
  };
}

function membershipResult(membership: RosterMembershipState) {
  return {
    id: membership.id,
    seasonId: membership.seasonId,
    seasonTeamId: membership.seasonTeamId,
    effectiveFrom: membership.effectiveFrom.toISOString(),
    effectiveUntil: membership.effectiveUntil?.toISOString() ?? null,
    version: membership.version
  };
}

function resolveEffectiveInstant(
  command: AddRosterMembershipCommand | EndRosterMembershipCommand | TransferRosterMembershipCommand,
  resolver: RosterEffectiveInstantResolver,
  timezone: string
) {
  const instant = resolver.resolve(command.localEffectiveAt, timezone);
  if (!instant) {
    throw rejection(
      command,
      'roster_membership.effective_instant_unambiguous',
      'The local effective time does not identify one unambiguous instant',
      `effective value ${command.localEffectiveAt} in ${timezone}`
    );
  }
  return instant;
}

export function createRosterManagementService(
  store: RosterManagementStore,
  effectiveInstantResolver: RosterEffectiveInstantResolver,
  dependencies: RosterManagementDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function manageRoster(
    command: RosterManagementCommand
  ): Promise<RosterManagementResult> {
    const commandType = `roster.${command.type}`;
    const payloadHash = canonicalHash(commandPayload(command));

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== commandType || receipt.payloadHash !== payloadHash) {
          throw rejection(
            command,
            'command.idempotency_identity',
            'The command identity cannot be reused for different content',
            'command identity already accepted with different content',
            {type: 'Command', id: command.commandId}
          );
        }
        return {...receipt.result, receiptReused: true};
      }

      const acceptedAt = now();
      const reason = normalizeReason(command.reason);
      const auditRecordId = newId();
      let leagueId: string;
      let action: string;
      let entityType: string;
      let entityId: string;
      let previousValue: unknown;
      let newValue: unknown;
      let player: StoredRosterPlayer;
      let membership: RosterMembershipState | null = null;
      let previousMembership: RosterMembershipState | null = null;

      if (command.type === 'create_player') {
        const league = await transaction.findLeagueForUpdate(command.leagueId);
        if (!league) {
          throw rejection(command, 'league.exists', 'The League does not exist', 'not found');
        }
        leagueId = league.id;
        if (!(await transaction.hasActiveLeagueAdministrator(leagueId, command.actorAccountId))) {
          throw rejection(
            command,
            'authorization.league_admin_required',
            'Only an active League Administrator may create a Player',
            'actor has no active League Administrator assignment'
          );
        }
        let displayName: string;
        try {
          displayName = normalizePlayerDisplayName(command.displayName);
        } catch (error) {
          if (error instanceof RuleViolation) {
            throw rejection(command, error.rule, error.message, 'requested display name is invalid');
          }
          throw error;
        }
        player = {id: newId(), leagueId, displayName, version: 0};
        await transaction.insertPlayer(player);
        action = 'player.created';
        entityType = 'Player';
        entityId = player.id;
        previousValue = null;
        newValue = playerResult(player);
      } else if (command.type === 'rename_player') {
        const storedPlayer = await transaction.findPlayerForUpdate(command.playerId);
        if (!storedPlayer) {
          throw rejection(command, 'player.exists', 'The Player does not exist', 'not found');
        }
        leagueId = storedPlayer.leagueId;
        if (!(await transaction.hasActiveLeagueAdministrator(leagueId, command.actorAccountId))) {
          throw rejection(
            command,
            'authorization.league_admin_required',
            'Only an active League Administrator may update a Player',
            'actor has no active League Administrator assignment'
          );
        }
        try {
          player = renamePlayerState(storedPlayer, command.displayName);
        } catch (error) {
          if (error instanceof RuleViolation) {
            throw rejection(command, error.rule, error.message, 'requested display name is invalid');
          }
          throw error;
        }
        await transaction.updatePlayerDisplayName({
          playerId: player.id,
          expectedVersion: storedPlayer.version,
          displayName: player.displayName
        });
        action = 'player.display_name_updated';
        entityType = 'Player';
        entityId = player.id;
        previousValue = playerResult(storedPlayer);
        newValue = playerResult(player);
      } else if (command.type === 'add_membership') {
        const [storedPlayer, seasonTeam] = await Promise.all([
          transaction.findPlayerForUpdate(command.playerId),
          transaction.findSeasonTeamForUpdate(command.seasonTeamId)
        ]);
        if (!storedPlayer) {
          throw rejection(command, 'player.exists', 'The Player does not exist', 'not found');
        }
        if (!seasonTeam) {
          throw rejection(
            command,
            'season_team.exists',
            'The Season Team does not exist',
            'not found',
            {type: 'SeasonTeam', id: command.seasonTeamId}
          );
        }
        if (storedPlayer.leagueId !== seasonTeam.leagueId) {
          throw rejection(
            command,
            'roster_membership.same_league',
            'The Player and Season Team must belong to the same League',
            'cross-League membership requested'
          );
        }
        leagueId = storedPlayer.leagueId;
        if (!(await transaction.hasActiveLeagueAdministrator(leagueId, command.actorAccountId))) {
          throw rejection(
            command,
            'authorization.league_admin_required',
            'Only an active League Administrator may add a Roster Membership',
            'actor has no active League Administrator assignment'
          );
        }
        const effectiveFrom = resolveEffectiveInstant(
          command,
          effectiveInstantResolver,
          seasonTeam.leagueTimezone
        );
        if (await transaction.hasOverlappingMembership({
          playerId: storedPlayer.id,
          seasonId: seasonTeam.seasonId,
          effectiveFrom,
          effectiveUntil: null
        })) {
          throw rejection(
            command,
            'roster_membership.no_overlap',
            'The Player already has an overlapping Roster Membership in this Season',
            'overlapping membership exists'
          );
        }
        player = storedPlayer;
        membership = {
          id: newId(),
          playerId: player.id,
          seasonId: seasonTeam.seasonId,
          seasonTeamId: seasonTeam.id,
          effectiveFrom,
          effectiveUntil: null,
          version: 0
        };
        try {
          await transaction.insertMembership(membership);
        } catch (error) {
          if (error instanceof RuleViolation) {
            throw rejection(command, error.rule, error.message, 'overlapping membership exists');
          }
          throw error;
        }
        action = 'roster_membership.created';
        entityType = 'RosterMembership';
        entityId = membership.id;
        previousValue = null;
        newValue = membershipResult(membership);
      } else {
        const storedMembership = await transaction.findMembershipForUpdate(command.membershipId);
        if (!storedMembership) {
          throw rejection(
            command,
            'roster_membership.exists',
            'The Roster Membership does not exist',
            'not found'
          );
        }
        leagueId = storedMembership.leagueId;
        if (!(await transaction.hasActiveLeagueAdministrator(leagueId, command.actorAccountId))) {
          throw rejection(
            command,
            'authorization.league_admin_required',
            'Only an active League Administrator may change a Roster Membership',
            'actor has no active League Administrator assignment'
          );
        }
        player = storedMembership.player;
        const effectiveAt = resolveEffectiveInstant(
          command,
          effectiveInstantResolver,
          storedMembership.leagueTimezone
        );
        previousMembership = storedMembership;

        if (command.type === 'end_membership') {
          try {
            membership = endRosterMembershipState(storedMembership, effectiveAt);
          } catch (error) {
            if (error instanceof RuleViolation) {
              throw rejection(command, error.rule, error.message, 'membership cannot be ended');
            }
            throw error;
          }
          await transaction.closeMembership({
            membershipId: membership.id,
            expectedVersion: storedMembership.version,
            effectiveUntil: membership.effectiveUntil!
          });
          action = 'roster_membership.ended';
          entityType = 'RosterMembership';
          entityId = membership.id;
          previousValue = membershipResult(storedMembership);
          newValue = membershipResult(membership);
        } else {
          const targetTeam = await transaction.findSeasonTeamForUpdate(command.targetSeasonTeamId);
          if (!targetTeam) {
            throw rejection(
              command,
              'season_team.exists',
              'The target Season Team does not exist',
              'not found',
              {type: 'SeasonTeam', id: command.targetSeasonTeamId}
            );
          }
          if (targetTeam.seasonId !== storedMembership.seasonId) {
            throw rejection(
              command,
              'roster_membership.transfer_same_season',
              'A transfer target must belong to the same Season',
              'target belongs to another Season'
            );
          }
          let transferred: ReturnType<typeof transferRosterMembershipState>;
          try {
            transferred = transferRosterMembershipState(
              storedMembership,
              targetTeam.id,
              effectiveAt,
              newId()
            );
          } catch (error) {
            if (error instanceof RuleViolation) {
              throw rejection(command, error.rule, error.message, 'membership cannot be transferred');
            }
            throw error;
          }
          if (await transaction.hasOverlappingMembership({
            playerId: storedMembership.playerId,
            seasonId: storedMembership.seasonId,
            effectiveFrom: effectiveAt,
            effectiveUntil: null,
            excludeMembershipId: storedMembership.id
          })) {
            throw rejection(
              command,
              'roster_membership.no_overlap',
              'The transfer would overlap another Roster Membership in this Season',
              'overlapping membership exists'
            );
          }
          await transaction.closeMembership({
            membershipId: transferred.closedMembership.id,
            expectedVersion: storedMembership.version,
            effectiveUntil: effectiveAt
          });
          try {
            await transaction.insertMembership(transferred.newMembership);
          } catch (error) {
            if (error instanceof RuleViolation) {
              throw rejection(command, error.rule, error.message, 'overlapping membership exists');
            }
            throw error;
          }
          previousMembership = transferred.closedMembership;
          membership = transferred.newMembership;
          action = 'roster_membership.transferred';
          entityType = 'RosterMembership';
          entityId = membership.id;
          previousValue = membershipResult(storedMembership);
          newValue = {
            closed_membership: membershipResult(transferred.closedMembership),
            new_membership: membershipResult(transferred.newMembership)
          };
        }
      }

      const result: RosterManagementResult = {
        receiptReused: false,
        operation: command.type,
        player: playerResult(player),
        membership: membership ? membershipResult(membership) : null,
        previousMembership: previousMembership ? membershipResult(previousMembership) : null,
        auditRecordId
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId,
        actorAccountId: command.actorAccountId,
        action,
        entityType,
        entityId,
        previousValue,
        newValue,
        reason,
        createdAt: acceptedAt
      });
      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        commandType,
        payloadHash,
        result,
        createdAt: acceptedAt
      });
      return result;
    });
  };
}
