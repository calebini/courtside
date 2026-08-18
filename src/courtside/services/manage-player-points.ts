import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {
  assertPlayerPoints,
  transitionPlayerPoints,
  type PlayerPointState,
  type PlayerStatVerification
} from '@/courtside/core/player-stat-line';
import type {GameStatus} from '@/courtside/core/game';

export interface PlayerPointEntry {
  readonly rosterMembershipId: string;
  readonly points: number | null;
}

export interface RecordPlayerPointsCommand {
  readonly type: 'record_player_points';
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly gameId: string;
  readonly verificationStatus: PlayerStatVerification;
  readonly entries: readonly PlayerPointEntry[];
  readonly reason: string | null;
}

export interface PlayerPointMutationResult {
  readonly receiptReused: boolean;
  readonly operation: 'record_player_points';
  readonly gameId: string;
  readonly changedLineCount: number;
  readonly verificationStatus: PlayerStatVerification;
  readonly auditRecordIds: readonly string[];
  readonly lines: readonly {
    readonly id: string;
    readonly playerId: string;
    readonly rosterMembershipId: string;
    readonly points: number | null;
    readonly completenessStatus: 'partial';
    readonly verificationStatus: PlayerStatVerification;
    readonly version: number;
  }[];
}

export interface PlayerPointsRejectionReport {
  readonly entityType: string;
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: 'record Player points';
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class PlayerPointsRejected extends Error {
  readonly report: PlayerPointsRejectionReport;

  constructor(message: string, report: PlayerPointsRejectionReport) {
    super(message);
    this.name = 'PlayerPointsRejected';
    this.report = report;
  }
}

export interface StoredPlayerPointsGame {
  readonly id: string;
  readonly seasonId: string;
  readonly leagueId: string;
  readonly status: GameStatus;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly competitionEligibilityAt: Date | null;
}

export interface EligiblePlayerMembership {
  readonly id: string;
  readonly playerId: string;
  readonly seasonTeamId: string;
}

export interface StoredPlayerStatLine extends PlayerPointState {
  readonly id: string;
  readonly gameId: string;
  readonly playerId: string;
  readonly rosterMembershipId: string;
  readonly seasonTeamId: string;
}

export interface StoredPlayerPointsReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: PlayerPointMutationResult;
}

export interface PlayerPointsTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredPlayerPointsReceipt | null>;
  findGameForUpdate(gameId: string): Promise<StoredPlayerPointsGame | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  listEligibleMemberships(gameId: string): Promise<EligiblePlayerMembership[]>;
  listStatLinesForUpdate(gameId: string): Promise<StoredPlayerStatLine[]>;
  insertStatLine(input: {
    id: string;
    gameId: string;
    playerId: string;
    rosterMembershipId: string;
    seasonId: string;
    seasonTeamId: string;
    points: number | null;
    verificationStatus: PlayerStatVerification;
    occurredAt: Date;
  }): Promise<void>;
  updateStatLine(input: {
    id: string;
    expectedVersion: number;
    points: number | null;
    verificationStatus: PlayerStatVerification;
    occurredAt: Date;
  }): Promise<void>;
  appendAudit(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    playerStatLineId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: PlayerPointMutationResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface PlayerPointsStore {
  transaction<T>(work: (transaction: PlayerPointsTransaction) => Promise<T>): Promise<T>;
}

export interface PlayerPointsDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function normalizeReason(reason: string | null) {
  const normalized = reason?.trim() ?? '';
  return normalized || null;
}

function reject(
  command: RecordPlayerPointsCommand,
  input: {
    entityType: string;
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new PlayerPointsRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'record Player points',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function canonicalEntries(entries: readonly PlayerPointEntry[]) {
  return [...entries]
    .map((entry) => ({
      roster_membership_id: entry.rosterMembershipId,
      points: entry.points
    }))
    .sort((left, right) => left.roster_membership_id.localeCompare(right.roster_membership_id));
}

function auditValue(line: StoredPlayerStatLine | null, next?: PlayerPointState) {
  if (!line && !next) return {};
  const value = next ?? line!;
  return {
    points: value.points,
    completeness_status: value.completenessStatus,
    verification_status: value.verificationStatus,
    version: value.version
  };
}

export function createPlayerPointsService(
  store: PlayerPointsStore,
  dependencies: PlayerPointsDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function recordPlayerPoints(
    command: RecordPlayerPointsCommand
  ): Promise<PlayerPointMutationResult> {
    if (command.verificationStatus !== 'provisional' && command.verificationStatus !== 'confirmed') {
      throw reject(command, {
        entityType: 'Game',
        entityId: command.gameId,
        currentStateOrCondition: 'unsupported verification status',
        violatedRule: 'player_stat_line.verification',
        message: 'Player Stat Line verification status is unsupported'
      });
    }
    const membershipIds = command.entries.map((entry) => entry.rosterMembershipId);
    if (membershipIds.length === 0 || new Set(membershipIds).size !== membershipIds.length) {
      throw reject(command, {
        entityType: 'Game',
        entityId: command.gameId,
        currentStateOrCondition: 'invalid or duplicate Player entries',
        violatedRule: 'player_stat_line.batch_entries',
        message: 'Player points require at least one unique Roster Membership entry'
      });
    }
    for (const entry of command.entries) {
      try {
        assertPlayerPoints(entry.points);
      } catch {
        throw reject(command, {
          entityType: 'RosterMembership',
          entityId: entry.rosterMembershipId,
          currentStateOrCondition: 'invalid Player points value',
          violatedRule: 'player_stat_line.points',
          message: 'Player points must be unknown or a nonnegative whole number'
        });
      }
    }

    const commandType = 'record_player_points';
    const payloadHash = canonicalHash({
      actor_account_id: command.actorAccountId,
      game_id: command.gameId,
      verification_status: command.verificationStatus,
      entries: canonicalEntries(command.entries),
      reason: normalizeReason(command.reason)
    });

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== commandType || receipt.payloadHash !== payloadHash) {
          throw reject(command, {
            entityType: 'CommandReceipt',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency',
            message: 'Command identity cannot be reused for different Player points'
          });
        }
        return {...receipt.result, receiptReused: true};
      }

      const game = await transaction.findGameForUpdate(command.gameId);
      if (!game) {
        throw reject(command, {
          entityType: 'Game',
          entityId: command.gameId,
          currentStateOrCondition: 'not found',
          violatedRule: 'game.exists',
          message: 'Game not found'
        });
      }
      if (!await transaction.hasActiveLeagueAdministrator(game.leagueId, command.actorAccountId)) {
        throw reject(command, {
          entityType: 'League',
          entityId: game.leagueId,
          currentStateOrCondition: 'actor lacks active League Administrator assignment',
          violatedRule: 'authorization.league_admin',
          message: 'League Administrator authority is required'
        });
      }
      if (!game.competitionEligibilityAt || !['in_progress', 'final', 'forfeit'].includes(game.status)) {
        throw reject(command, {
          entityType: 'Game',
          entityId: game.id,
          currentStateOrCondition: game.status,
          violatedRule: 'player_stat_line.game_anchored',
          message: 'Player points require an anchored competitive Game'
        });
      }

      const eligibleMemberships = new Map(
        (await transaction.listEligibleMemberships(game.id)).map((membership) => [membership.id, membership])
      );
      for (const entry of command.entries) {
        if (!eligibleMemberships.has(entry.rosterMembershipId)) {
          throw reject(command, {
            entityType: 'RosterMembership',
            entityId: entry.rosterMembershipId,
            currentStateOrCondition: 'not eligible for this Game at its competition anchor',
            violatedRule: 'player_stat_line.roster_eligibility',
            message: 'Player points can only be attributed through an eligible Roster Membership'
          });
        }
      }

      const existingByMembership = new Map(
        (await transaction.listStatLinesForUpdate(game.id)).map((line) => [line.rosterMembershipId, line])
      );
      const occurredAt = now();
      const changedLines: PlayerPointMutationResult['lines'][number][] = [];
      const auditRecordIds: string[] = [];

      for (const entry of command.entries) {
        const membership = eligibleMemberships.get(entry.rosterMembershipId)!;
        const existing = existingByMembership.get(entry.rosterMembershipId) ?? null;
        const transition = transitionPlayerPoints(existing, entry.points, command.verificationStatus);
        if (!transition || !transition.changed) continue;

        const lineId = existing?.id ?? newId();
        if (existing) {
          await transaction.updateStatLine({
            id: lineId,
            expectedVersion: existing.version,
            points: transition.next.points,
            verificationStatus: transition.next.verificationStatus,
            occurredAt
          });
        } else {
          await transaction.insertStatLine({
            id: lineId,
            gameId: game.id,
            playerId: membership.playerId,
            rosterMembershipId: membership.id,
            seasonId: game.seasonId,
            seasonTeamId: membership.seasonTeamId,
            points: transition.next.points,
            verificationStatus: transition.next.verificationStatus,
            occurredAt
          });
        }

        const auditRecordId = newId();
        await transaction.appendAudit({
          id: auditRecordId,
          leagueId: game.leagueId,
          actorAccountId: command.actorAccountId,
          action: `player_stat_line.${transition.kind}`,
          playerStatLineId: lineId,
          previousValue: auditValue(existing),
          newValue: auditValue(null, transition.next),
          reason: normalizeReason(command.reason),
          createdAt: occurredAt
        });
        auditRecordIds.push(auditRecordId);
        changedLines.push({
          id: lineId,
          playerId: membership.playerId,
          rosterMembershipId: membership.id,
          points: transition.next.points,
          completenessStatus: 'partial',
          verificationStatus: transition.next.verificationStatus,
          version: transition.next.version
        });
      }

      if (changedLines.length === 0) {
        throw reject(command, {
          entityType: 'Game',
          entityId: game.id,
          currentStateOrCondition: 'submitted points and verification already match',
          violatedRule: 'player_stat_line.material_change',
          message: 'No Player point changes were submitted'
        });
      }

      const result: PlayerPointMutationResult = {
        receiptReused: false,
        operation: 'record_player_points',
        gameId: game.id,
        changedLineCount: changedLines.length,
        verificationStatus: command.verificationStatus,
        auditRecordIds,
        lines: changedLines
      };
      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        commandType,
        payloadHash,
        result,
        createdAt: occurredAt
      });
      return result;
    });
  };
}
