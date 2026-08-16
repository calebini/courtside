import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {
  validateLeagueBootstrapInput,
  type LeagueBootstrapInput,
  type LeagueLanguage
} from '@/courtside/core/league-bootstrap';
import {RuleViolation} from '@/courtside/core/errors';

const COMMAND_TYPE = 'league.bootstrap_initial_administrator';

export interface BootstrapLeagueCommand extends LeagueBootstrapInput {
  readonly commandId: string;
  readonly apply: boolean;
}

export interface BootstrapLeagueResult {
  readonly status: 'planned' | 'created' | 'reused';
  readonly receiptReused: boolean;
  readonly league: {
    readonly id: string | null;
    readonly name: string;
    readonly timezone: string;
    readonly defaultLanguage: LeagueLanguage;
    readonly willCreate: boolean;
  };
  readonly administrator: {
    readonly accountId: string;
    readonly contactEmail: string;
    readonly assignmentId: string | null;
  };
  readonly auditRecordId: string | null;
}

export interface StoredBootstrapReceipt {
  readonly commandId: string;
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: BootstrapLeagueResult;
}

export interface StoredBootstrapLeague {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
  readonly defaultLanguage: LeagueLanguage;
}

export interface StoredBootstrapAccount {
  readonly id: string;
  readonly contactEmail: string;
}

export interface BootstrapLeagueTransaction {
  lockBootstrap(): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredBootstrapReceipt | null>;
  findAcceptedBootstrap(payloadHash: string): Promise<StoredBootstrapReceipt | null>;
  listLeaguesForUpdate(): Promise<readonly StoredBootstrapLeague[]>;
  findAccountsByEmail(contactEmail: string): Promise<readonly StoredBootstrapAccount[]>;
  hasAdministratorAssignmentHistory(leagueId: string): Promise<boolean>;
  insertLeague(input: StoredBootstrapLeague & {createdAt: Date}): Promise<void>;
  insertAdministratorAssignment(input: {
    id: string;
    leagueId: string;
    accountId: string;
    assignedAt: Date;
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
    reason: string;
    createdAt: Date;
  }): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: BootstrapLeagueResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface BootstrapLeagueStore {
  transaction<T>(work: (transaction: BootstrapLeagueTransaction) => Promise<T>): Promise<T>;
}

export interface BootstrapLeagueDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function payload(input: ReturnType<typeof validateLeagueBootstrapInput>) {
  return {
    admin_email: input.adminEmail,
    league_name: input.leagueName,
    timezone: input.timezone,
    default_language: input.defaultLanguage
  };
}

function matchingLeague(
  leagues: readonly StoredBootstrapLeague[],
  requested: ReturnType<typeof validateLeagueBootstrapInput>
) {
  if (leagues.length > 1) {
    throw new RuleViolation(
      'bootstrap.single_league_deployment',
      'Initial bootstrap requires an empty deployment or exactly one matching League'
    );
  }
  const league = leagues[0] ?? null;
  if (
    league &&
    (league.name !== requested.leagueName ||
      league.timezone !== requested.timezone ||
      league.defaultLanguage !== requested.defaultLanguage)
  ) {
    throw new RuleViolation(
      'bootstrap.league_identity',
      'The existing League does not match the requested bootstrap configuration'
    );
  }
  return league;
}

export function createLeagueBootstrapService(
  store: BootstrapLeagueStore,
  dependencies: BootstrapLeagueDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function bootstrapLeague(
    command: BootstrapLeagueCommand
  ): Promise<BootstrapLeagueResult> {
    const requested = validateLeagueBootstrapInput(command);
    const payloadHash = canonicalHash(payload(requested));

    return store.transaction(async (transaction) => {
      await transaction.lockBootstrap();

      const commandReceipt = await transaction.findCommandReceipt(command.commandId);
      if (commandReceipt) {
        if (
          commandReceipt.commandType !== COMMAND_TYPE ||
          commandReceipt.payloadHash !== payloadHash
        ) {
          throw new RuleViolation(
            'command.idempotency_identity',
            'The command identity cannot be reused for different content'
          );
        }
        return {...commandReceipt.result, status: 'reused', receiptReused: true};
      }

      const acceptedBootstrap = await transaction.findAcceptedBootstrap(payloadHash);
      if (acceptedBootstrap) {
        return {...acceptedBootstrap.result, status: 'reused', receiptReused: true};
      }

      const league = matchingLeague(await transaction.listLeaguesForUpdate(), requested);
      if (league && await transaction.hasAdministratorAssignmentHistory(league.id)) {
        throw new RuleViolation(
          'bootstrap.already_completed',
          'The League already has League Administrator assignment history'
        );
      }
      const accounts = await transaction.findAccountsByEmail(requested.adminEmail);
      if (accounts.length !== 1) {
        throw new RuleViolation(
          'bootstrap.account_selection',
          accounts.length === 0
            ? 'No provisioned User Account matches the supplied email'
            : 'The supplied email does not identify exactly one User Account'
        );
      }
      const account = accounts[0];

      const planned: BootstrapLeagueResult = {
        status: 'planned',
        receiptReused: false,
        league: {
          id: league?.id ?? null,
          name: requested.leagueName,
          timezone: requested.timezone,
          defaultLanguage: requested.defaultLanguage,
          willCreate: league === null
        },
        administrator: {
          accountId: account.id,
          contactEmail: account.contactEmail,
          assignmentId: null
        },
        auditRecordId: null
      };
      if (!command.apply) {
        return planned;
      }

      const acceptedAt = now();
      const leagueId = league?.id ?? newId();
      const assignmentId = newId();
      const auditRecordId = newId();
      if (!league) {
        await transaction.insertLeague({
          id: leagueId,
          name: requested.leagueName,
          timezone: requested.timezone,
          defaultLanguage: requested.defaultLanguage,
          createdAt: acceptedAt
        });
      }
      await transaction.insertAdministratorAssignment({
        id: assignmentId,
        leagueId,
        accountId: account.id,
        assignedAt: acceptedAt
      });

      const result: BootstrapLeagueResult = {
        status: 'created',
        receiptReused: false,
        league: {...planned.league, id: leagueId},
        administrator: {...planned.administrator, assignmentId},
        auditRecordId
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId,
        actorAccountId: account.id,
        action: 'league.administrator_bootstrapped',
        entityType: 'LeagueAdministratorAssignment',
        entityId: assignmentId,
        previousValue: null,
        newValue: {
          league_id: leagueId,
          user_account_id: account.id,
          assignment_id: assignmentId
        },
        reason: 'Initial controlled League Administrator bootstrap',
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
