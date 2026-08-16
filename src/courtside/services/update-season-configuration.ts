import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {
  applyPreFreezeStandingsConfiguration,
  normalizeEditableStandingsInput,
  readEditableSeasonConfiguration,
  type EditableStandingsInput,
  type EditableSeasonConfiguration
} from '@/courtside/core/pre-freeze-season-configuration';

const COMMAND_TYPE = 'season.configuration_updated';

export interface UpdateSeasonConfigurationCommand extends EditableStandingsInput {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly seasonId: string;
}

export interface UpdateSeasonConfigurationResult {
  readonly receiptReused: boolean;
  readonly seasonId: string;
  readonly previousConfigurationHash: string;
  readonly configuration: EditableSeasonConfiguration;
  readonly auditRecordId: string;
}

export interface SeasonConfigurationRejectionReport {
  readonly entityType: 'Season' | 'Command';
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: 'update pre-freeze Season configuration';
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class SeasonConfigurationRejected extends Error {
  readonly report: SeasonConfigurationRejectionReport;

  constructor(message: string, report: SeasonConfigurationRejectionReport) {
    super(message);
    this.name = 'SeasonConfigurationRejected';
    this.report = report;
  }
}

export interface StoredSeasonConfigurationReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: UpdateSeasonConfigurationResult;
}

export interface StoredMutableSeasonConfiguration {
  readonly id: string;
  readonly leagueId: string;
  readonly resultConfiguration: unknown;
  readonly frozenConfigurationVersionId: string | null;
}

export interface SeasonConfigurationTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredSeasonConfigurationReceipt | null>;
  findSeasonForUpdate(seasonId: string): Promise<StoredMutableSeasonConfiguration | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  updateResultConfiguration(seasonId: string, configuration: unknown): Promise<void>;
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
    result: UpdateSeasonConfigurationResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface SeasonConfigurationStore {
  transaction<T>(work: (transaction: SeasonConfigurationTransaction) => Promise<T>): Promise<T>;
}

export interface SeasonConfigurationDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function rejected(
  command: UpdateSeasonConfigurationCommand,
  input: {
    entityType: SeasonConfigurationRejectionReport['entityType'];
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new SeasonConfigurationRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'update pre-freeze Season configuration',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function normalizeCommand(command: UpdateSeasonConfigurationCommand) {
  try {
    return {...command, ...normalizeEditableStandingsInput(command)};
  } catch (error) {
    if (error instanceof RuleViolation) {
      throw rejected(command, {
        entityType: 'Season',
        entityId: command.seasonId,
        currentStateOrCondition: 'requested standings configuration is invalid',
        violatedRule: error.rule,
        message: error.message
      });
    }
    throw error;
  }
}

export function createSeasonConfigurationService(
  store: SeasonConfigurationStore,
  dependencies: SeasonConfigurationDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function updateSeasonConfiguration(
    rawCommand: UpdateSeasonConfigurationCommand
  ): Promise<UpdateSeasonConfigurationResult> {
    const command = normalizeCommand(rawCommand);
    const payloadHash = canonicalHash({
      actor_account_id: command.actorAccountId,
      season_id: command.seasonId,
      win_points: command.winPoints,
      loss_points: command.lossPoints,
      ranking: command.ranking
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
          message: 'Only an active League Administrator may update Season configuration'
        });
      }
      if (season.frozenConfigurationVersionId) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: season.id,
          currentStateOrCondition: 'Season configuration is frozen',
          violatedRule: 'season.configuration_mutable_required',
          message: 'Ordinary configuration editing is unavailable after freeze'
        });
      }

      let nextConfiguration: unknown;
      try {
        nextConfiguration = applyPreFreezeStandingsConfiguration(
          season.resultConfiguration,
          command
        );
      } catch (error) {
        if (error instanceof RuleViolation) {
          throw rejected(command, {
            entityType: 'Season',
            entityId: season.id,
            currentStateOrCondition: 'stored or requested configuration is unsupported',
            violatedRule: error.rule,
            message: error.message
          });
        }
        throw error;
      }

      const previousConfigurationHash = canonicalHash(season.resultConfiguration);
      const nextConfigurationHash = canonicalHash(nextConfiguration);
      if (previousConfigurationHash === nextConfigurationHash) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: season.id,
          currentStateOrCondition: 'normalized configuration is unchanged',
          violatedRule: 'season.configuration_change_required',
          message: 'A Season configuration update must change points or ranking order'
        });
      }

      const acceptedAt = now();
      const auditRecordId = newId();
      const configuration = readEditableSeasonConfiguration(nextConfiguration);
      await transaction.updateResultConfiguration(season.id, nextConfiguration);
      const result: UpdateSeasonConfigurationResult = {
        receiptReused: false,
        seasonId: season.id,
        previousConfigurationHash,
        configuration,
        auditRecordId
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: season.leagueId,
        actorAccountId: command.actorAccountId,
        action: COMMAND_TYPE,
        entityType: 'Season',
        entityId: season.id,
        previousValue: {
          configuration: season.resultConfiguration,
          configuration_hash: previousConfigurationHash
        },
        newValue: {
          configuration: nextConfiguration,
          configuration_hash: nextConfigurationHash
        },
        reason: null,
        createdAt: acceptedAt
      });
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
