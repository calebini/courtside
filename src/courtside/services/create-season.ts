import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {
  createDefaultSeasonResultConfiguration,
  normalizeSeasonName
} from '@/courtside/core/season-setup';

const COMMAND_TYPE = 'season.create';

export interface CreateSeasonCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly leagueId: string;
  readonly name: string;
}

export interface CreateSeasonResult {
  readonly receiptReused: boolean;
  readonly season: {
    readonly id: string;
    readonly leagueId: string;
    readonly name: string;
    readonly configurationHash: string;
  };
  readonly auditRecordId: string;
}

export interface CreateSeasonRejectionReport {
  readonly entityType: 'League' | 'Season' | 'Command';
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: 'create Season';
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class CreateSeasonRejected extends Error {
  readonly report: CreateSeasonRejectionReport;

  constructor(message: string, report: CreateSeasonRejectionReport) {
    super(message);
    this.name = 'CreateSeasonRejected';
    this.report = report;
  }
}

export interface StoredCreateSeasonReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: CreateSeasonResult;
}

export interface CreateSeasonTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredCreateSeasonReceipt | null>;
  findLeagueForUpdate(leagueId: string): Promise<{id: string} | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  findSeasonByName(leagueId: string, name: string): Promise<{id: string; name: string} | null>;
  insertSeason(input: {
    id: string;
    leagueId: string;
    name: string;
    resultConfiguration: unknown;
    createdAt: Date;
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
    result: CreateSeasonResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface CreateSeasonStore {
  transaction<T>(work: (transaction: CreateSeasonTransaction) => Promise<T>): Promise<T>;
}

export interface CreateSeasonDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function rejected(
  command: CreateSeasonCommand,
  input: {
    entityType: CreateSeasonRejectionReport['entityType'];
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new CreateSeasonRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'create Season',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

export function createSeasonService(
  store: CreateSeasonStore,
  dependencies: CreateSeasonDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function createSeason(command: CreateSeasonCommand): Promise<CreateSeasonResult> {
    let name: string;
    try {
      name = normalizeSeasonName(command.name);
    } catch (error) {
      if (error instanceof RuleViolation) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: command.leagueId,
          currentStateOrCondition: 'requested Season name is invalid',
          violatedRule: error.rule,
          message: error.message
        });
      }
      throw error;
    }

    const resultConfiguration = createDefaultSeasonResultConfiguration();
    const configurationHash = canonicalHash(resultConfiguration);
    const payloadHash = canonicalHash({
      actor_account_id: command.actorAccountId,
      league_id: command.leagueId,
      name,
      result_configuration: resultConfiguration
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

      const league = await transaction.findLeagueForUpdate(command.leagueId);
      if (!league) {
        throw rejected(command, {
          entityType: 'League',
          entityId: command.leagueId,
          currentStateOrCondition: 'League not found',
          violatedRule: 'league.exists',
          message: 'The League does not exist'
        });
      }
      if (!await transaction.hasActiveLeagueAdministrator(league.id, command.actorAccountId)) {
        throw rejected(command, {
          entityType: 'League',
          entityId: league.id,
          currentStateOrCondition: 'actor has no active League Administrator assignment',
          violatedRule: 'authorization.league_admin_required',
          message: 'Only an active League Administrator may create a Season'
        });
      }

      const duplicate = await transaction.findSeasonByName(league.id, name);
      if (duplicate) {
        throw rejected(command, {
          entityType: 'Season',
          entityId: duplicate.id,
          currentStateOrCondition: `Season named ${duplicate.name} already exists`,
          violatedRule: 'season.name_unique_per_league',
          message: 'A Season with that name already exists in this League'
        });
      }

      const acceptedAt = now();
      const seasonId = newId();
      const auditRecordId = newId();
      await transaction.insertSeason({
        id: seasonId,
        leagueId: league.id,
        name,
        resultConfiguration,
        createdAt: acceptedAt
      });

      const result: CreateSeasonResult = {
        receiptReused: false,
        season: {
          id: seasonId,
          leagueId: league.id,
          name,
          configurationHash
        },
        auditRecordId
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: league.id,
        actorAccountId: command.actorAccountId,
        action: 'season.created',
        entityType: 'Season',
        entityId: seasonId,
        previousValue: null,
        newValue: {
          id: seasonId,
          league_id: league.id,
          name,
          result_configuration: resultConfiguration,
          configuration_hash: configurationHash
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
