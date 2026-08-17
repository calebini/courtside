import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';

const COMMAND_TYPE = 'season.delete';
const MAX_REASON_LENGTH = 1000;

export interface DeleteSeasonCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly seasonId: string;
  readonly confirmationName: string;
  readonly reason: string | null;
}

export interface DeleteSeasonResult {
  readonly receiptReused: boolean;
  readonly deletedSeason: {
    readonly id: string;
    readonly leagueId: string;
    readonly name: string;
  };
  readonly auditRecordId: string;
}

export interface DeleteSeasonRejectionReport {
  readonly entityType: 'Season' | 'Command';
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: 'delete unused Season';
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class DeleteSeasonRejected extends Error {
  readonly report: DeleteSeasonRejectionReport;

  constructor(message: string, report: DeleteSeasonRejectionReport) {
    super(message);
    this.name = 'DeleteSeasonRejected';
    this.report = report;
  }
}

export interface StoredDeleteSeasonReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: DeleteSeasonResult;
}

export interface StoredDeletableSeason {
  readonly id: string;
  readonly leagueId: string;
  readonly name: string;
  readonly resultConfiguration: unknown;
  readonly frozenConfigurationVersionId: string | null;
  readonly createdAt: Date;
}

export type SeasonDependency =
  | 'season_team'
  | 'game'
  | 'roster_membership'
  | 'configuration_version'
  | 'team_captain_assignment';

export interface DeleteSeasonTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredDeleteSeasonReceipt | null>;
  findSeasonForUpdate(seasonId: string): Promise<StoredDeletableSeason | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  listDependencies(seasonId: string): Promise<readonly SeasonDependency[]>;
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
  deleteSeason(seasonId: string): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: DeleteSeasonResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface DeleteSeasonStore {
  transaction<T>(work: (transaction: DeleteSeasonTransaction) => Promise<T>): Promise<T>;
}

export interface DeleteSeasonDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function rejected(
  command: DeleteSeasonCommand,
  input: {
    entityType: DeleteSeasonRejectionReport['entityType'];
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new DeleteSeasonRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'delete unused Season',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function normalizeReason(command: DeleteSeasonCommand) {
  const reason = command.reason?.trim() || null;
  if (reason && reason.length > MAX_REASON_LENGTH) {
    throw rejected(command, {
      entityType: 'Season',
      entityId: command.seasonId,
      currentStateOrCondition: 'deletion reason exceeds the supported length',
      violatedRule: 'season.deletion_reason_length',
      message: `A Season deletion reason may contain at most ${MAX_REASON_LENGTH} characters`
    });
  }
  return reason;
}

export function createDeleteSeasonService(
  store: DeleteSeasonStore,
  dependencies: DeleteSeasonDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function deleteSeason(rawCommand: DeleteSeasonCommand): Promise<DeleteSeasonResult> {
    const command = {...rawCommand, reason: normalizeReason(rawCommand)};
    const payloadHash = canonicalHash({
      actor_account_id: command.actorAccountId,
      season_id: command.seasonId,
      confirmation_name: command.confirmationName,
      reason: command.reason
    });

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== COMMAND_TYPE || receipt.payloadHash !== payloadHash) {
          throw rejected(command, {
            entityType: 'Command',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency_identity',
            message: 'The command identity cannot be reused for different content'
          });
        }
        return {...receipt.result, receiptReused: true};
      }

      const season = await transaction.findSeasonForUpdate(command.seasonId);
      if (!season) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: command.seasonId,
          currentStateOrCondition: 'Season not found',
          violatedRule: 'season.exists',
          message: 'The Season does not exist'
        });
      }
      if (!await transaction.hasActiveLeagueAdministrator(
        season.leagueId,
        command.actorAccountId
      )) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: season.id,
          currentStateOrCondition: 'actor has no active League Administrator assignment',
          violatedRule: 'authorization.league_admin_required',
          message: 'Only an active League Administrator may delete an unused Season'
        });
      }
      if (command.confirmationName !== season.name) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: season.id,
          currentStateOrCondition: 'typed confirmation does not exactly match the Season name',
          violatedRule: 'season.deletion_name_confirmation',
          message: 'Type the exact Season name to confirm deletion'
        });
      }

      const seasonDependencies = await transaction.listDependencies(season.id);
      if (seasonDependencies.length > 0) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: season.id,
          currentStateOrCondition: `dependent records exist: ${seasonDependencies.join(', ')}`,
          violatedRule: 'season.deletion_unused_only',
          message: 'A Season with dependent records cannot be deleted'
        });
      }

      const acceptedAt = now();
      const auditRecordId = newId();
      const previousValue = {
        id: season.id,
        league_id: season.leagueId,
        name: season.name,
        result_configuration: season.resultConfiguration,
        frozen_configuration_version_id: season.frozenConfigurationVersionId,
        created_at: season.createdAt.toISOString()
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: season.leagueId,
        actorAccountId: command.actorAccountId,
        action: 'season.deleted',
        entityType: 'Season',
        entityId: season.id,
        previousValue,
        newValue: null,
        reason: command.reason,
        createdAt: acceptedAt
      });
      await transaction.deleteSeason(season.id);

      const result: DeleteSeasonResult = {
        receiptReused: false,
        deletedSeason: {id: season.id, leagueId: season.leagueId, name: season.name},
        auditRecordId
      };
      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        commandType: COMMAND_TYPE,
        payloadHash,
        result,
        createdAt: acceptedAt
      });
      return result;
    });
  };
}
