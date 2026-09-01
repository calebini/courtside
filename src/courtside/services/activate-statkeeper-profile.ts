import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {
  assertStatkeeperProfileLineageCompatibility,
  normalizeStatkeeperProfileDefinition,
  statkeeperProfileCommandValue,
  type NormalizedStatkeeperProfile,
  type StatkeeperProfileDefinition
} from '@/courtside/core/statkeeper-profile';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMAND_TYPE = 'statkeeper.profile_activated';

export interface ActivateStatkeeperProfileCommand {
  readonly type: 'activate_statkeeper_profile';
  readonly commandId: string;
  /** Trusted server-resolved actor. No browser/API binding is delivered by this slice. */
  readonly actorAccountId: string;
  readonly leagueId: string;
  readonly expectedCurrentProfileVersionId: string | null;
  readonly definition: StatkeeperProfileDefinition;
}

export interface ActivateStatkeeperProfileResult {
  readonly receiptReused: boolean;
  readonly operation: 'activate_statkeeper_profile';
  readonly leagueId: string;
  readonly profileVersionId: string;
  readonly versionNumber: number;
  readonly contentHash: string;
  readonly previousProfileVersionId: string | null;
  readonly auditRecordId: string;
}

export class StatkeeperProfileActivationRejected extends Error {
  constructor(
    message: string,
    readonly report: {
      readonly entityType: string;
      readonly entityId: string;
      readonly currentStateOrCondition: string;
      readonly requestedMutation: 'activate Statkeeper Profile Version';
      readonly actorAccountId: string;
      readonly violatedRule: string;
      readonly authoritativeStatePreserved: true;
    }
  ) {
    super(message);
    this.name = 'StatkeeperProfileActivationRejected';
  }
}

export interface StoredActiveStatkeeperProfile {
  readonly id: string;
  readonly versionNumber: number;
  readonly contentHash: string;
}

export interface StoredStatkeeperProfileReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: ActivateStatkeeperProfileResult;
}

export interface StatkeeperProfileTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredStatkeeperProfileReceipt | null>;
  lockLeague(leagueId: string): Promise<boolean>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  findActiveProfile(leagueId: string): Promise<StoredActiveStatkeeperProfile | null>;
  nextProfileVersionNumber(leagueId: string): Promise<number>;
  listPriorProfiles(leagueId: string): Promise<NormalizedStatkeeperProfile[]>;
  insertProfileVersion(input: {
    id: string;
    leagueId: string;
    versionNumber: number;
    profile: NormalizedStatkeeperProfile;
    createdByAccountId: string;
    createdAt: Date;
  }): Promise<void>;
  setActiveProfile(leagueId: string, profileVersionId: string): Promise<void>;
  appendAuditRecord(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    entityId: string;
    previousValue: unknown;
    newValue: unknown;
    createdAt: Date;
  }): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    payloadHash: string;
    result: ActivateStatkeeperProfileResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface StatkeeperProfileStore {
  transaction<T>(work: (transaction: StatkeeperProfileTransaction) => Promise<T>): Promise<T>;
}

function rejected(
  command: ActivateStatkeeperProfileCommand,
  input: {
    entityType?: string;
    entityId?: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new StatkeeperProfileActivationRejected(input.message, {
    entityType: input.entityType ?? 'League',
    entityId: input.entityId ?? command.leagueId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'activate Statkeeper Profile Version',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function uuid(value: unknown, label: string) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new RuleViolation('statkeeper.profile.identity', `${label} must be a UUID`);
  }
  return value.toLowerCase();
}

export function createStatkeeperProfileActivationService(
  store: StatkeeperProfileStore,
  dependencies: {readonly now?: () => Date; readonly newId?: () => string} = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function activateStatkeeperProfile(
    rawCommand: ActivateStatkeeperProfileCommand
  ): Promise<ActivateStatkeeperProfileResult> {
    let command: ActivateStatkeeperProfileCommand;
    let profile: NormalizedStatkeeperProfile;
    try {
      if (rawCommand.type !== 'activate_statkeeper_profile') {
        throw new RuleViolation('statkeeper.profile.command_type', 'Profile command type is unsupported');
      }
      command = {
        ...rawCommand,
        commandId: uuid(rawCommand.commandId, 'Command identity'),
        actorAccountId: uuid(rawCommand.actorAccountId, 'Actor identity'),
        leagueId: uuid(rawCommand.leagueId, 'League identity'),
        expectedCurrentProfileVersionId: rawCommand.expectedCurrentProfileVersionId === null
          ? null
          : uuid(rawCommand.expectedCurrentProfileVersionId, 'Expected Profile Version identity')
      };
      profile = normalizeStatkeeperProfileDefinition(rawCommand.definition);
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      throw rejected(rawCommand, {
        currentStateOrCondition: 'invalid Profile Version command',
        violatedRule: error.rule,
        message: error.message
      });
    }

    const payloadHash = statkeeperCanonicalHash({
      actor_account_id: command.actorAccountId,
      definition: statkeeperProfileCommandValue(profile),
      expected_current_profile_version_id: command.expectedCurrentProfileVersionId,
      league_id: command.leagueId
    });

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== COMMAND_TYPE || receipt.payloadHash !== payloadHash) {
          throw rejected(command, {
            entityType: 'CommandReceipt',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency',
            message: 'Command identity cannot be reused for different profile content'
          });
        }
        return {...receipt.result, receiptReused: true};
      }
      if (!await transaction.lockLeague(command.leagueId)) {
        throw rejected(command, {
          currentStateOrCondition: 'League not found',
          violatedRule: 'league.exists',
          message: 'The League does not exist'
        });
      }
      if (!await transaction.hasActiveLeagueAdministrator(command.leagueId, command.actorAccountId)) {
        throw rejected(command, {
          currentStateOrCondition: 'actor lacks active League Administrator authority',
          violatedRule: 'authorization.league_admin_required',
          message: 'Only an active League Administrator may activate a Statkeeper profile'
        });
      }
      const current = await transaction.findActiveProfile(command.leagueId);
      if ((current?.id ?? null) !== command.expectedCurrentProfileVersionId) {
        throw rejected(command, {
          currentStateOrCondition: current ? `active Profile Version ${current.id}` : 'no active Profile Version',
          violatedRule: 'statkeeper.profile.stale_active_version',
          message: 'The active Statkeeper Profile Version changed before activation'
        });
      }
      if (current?.contentHash === profile.contentHash) {
        throw rejected(command, {
          currentStateOrCondition: 'canonical profile content is unchanged',
          violatedRule: 'statkeeper.profile.change_required',
          message: 'Profile activation must change canonical behavior or configuration'
        });
      }
      try {
        assertStatkeeperProfileLineageCompatibility(
          await transaction.listPriorProfiles(command.leagueId),
          profile
        );
      } catch (error) {
        if (!(error instanceof RuleViolation)) throw error;
        throw rejected(command, {
          currentStateOrCondition: 'canonical key meaning conflicts with prior Profile Versions',
          violatedRule: error.rule,
          message: error.message
        });
      }

      const acceptedAt = now();
      const profileVersionId = newId();
      const auditRecordId = newId();
      const versionNumber = await transaction.nextProfileVersionNumber(command.leagueId);
      await transaction.insertProfileVersion({
        id: profileVersionId,
        leagueId: command.leagueId,
        versionNumber,
        profile,
        createdByAccountId: command.actorAccountId,
        createdAt: acceptedAt
      });
      await transaction.setActiveProfile(command.leagueId, profileVersionId);
      const result: ActivateStatkeeperProfileResult = {
        receiptReused: false,
        operation: 'activate_statkeeper_profile',
        leagueId: command.leagueId,
        profileVersionId,
        versionNumber,
        contentHash: profile.contentHash,
        previousProfileVersionId: current?.id ?? null,
        auditRecordId
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: command.leagueId,
        actorAccountId: command.actorAccountId,
        entityId: profileVersionId,
        previousValue: current
          ? {profile_version_id: current.id, content_hash: current.contentHash}
          : null,
        newValue: {profile_version_id: profileVersionId, version_number: versionNumber, content_hash: profile.contentHash},
        createdAt: acceptedAt
      });
      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        payloadHash,
        result,
        createdAt: acceptedAt
      });
      return result;
    });
  };
}
