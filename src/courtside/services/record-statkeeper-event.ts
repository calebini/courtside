import {RuleViolation} from '@/courtside/core/errors';
import {
  buildStatkeeperOccurrenceLedgerRecord,
  normalizeStatkeeperOccurrenceInput,
  statkeeperOccurrenceCommandValue,
  type StatkeeperEventDefinition,
  type StatkeeperLedgerContext,
  type StatkeeperLedgerParticipant,
  type StatkeeperOccurrenceInput,
  type StatkeeperOccurrenceLedgerRecord
} from '@/courtside/core/statkeeper-event-ledger';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import type {GameStatus} from '@/courtside/core/game';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface RecordStatkeeperLedgerOccurrenceCommand {
  readonly type: 'record_statkeeper_ledger_occurrence';
  readonly commandId: string;
  /** Trusted server-resolved actor. This internal service has no browser/API binding. */
  readonly actorAccountId: string;
  readonly captureSessionId: string;
  readonly expectedLedgerVersion: number;
  readonly occurrence: StatkeeperOccurrenceInput;
}

export interface RecordStatkeeperLedgerOccurrenceResult {
  readonly receiptReused: boolean;
  readonly occurrenceReused: boolean;
  readonly operation: 'record_statkeeper_ledger_occurrence';
  readonly captureSessionId: string;
  readonly occurrenceId: string;
  readonly occurrenceRevisionId: string;
  readonly eventIds: readonly string[];
  readonly contentHash: string;
  readonly ledgerVersion: number;
}

export interface StatkeeperLedgerRejectionReport {
  readonly entityType: string;
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: 'record Statkeeper ledger occurrence';
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class StatkeeperLedgerRecordRejected extends Error {
  readonly report: StatkeeperLedgerRejectionReport;

  constructor(message: string, report: StatkeeperLedgerRejectionReport) {
    super(message);
    this.name = 'StatkeeperLedgerRecordRejected';
    this.report = report;
  }
}

export interface StoredStatkeeperLedgerHead {
  readonly captureSessionId: string;
  readonly gameId: string;
  readonly gameStatus: GameStatus;
  readonly competitionEligibilityAt: Date | null;
  readonly profileVersionId: string;
  readonly profileContentHash: string;
  readonly mediaId: string;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly regulationPeriodCount: number;
  readonly regulationPeriodDurationMs: number;
  readonly overtimePeriodDurationMs: number;
  readonly eventDefinitions: readonly StatkeeperEventDefinition[];
  readonly ledgerVersion: number;
}

export interface StoredStatkeeperOccurrence {
  readonly occurrenceId: string;
  readonly occurrenceRevisionId: string;
  readonly contentHash: string;
  readonly eventIds: readonly string[];
  readonly acceptedLedgerVersion: number;
}

export interface StoredStatkeeperLedgerReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: RecordStatkeeperLedgerOccurrenceResult;
}

export interface StatkeeperEventLedgerTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredStatkeeperLedgerReceipt | null>;
  findLedgerHeadForUpdate(captureSessionId: string): Promise<StoredStatkeeperLedgerHead | null>;
  hasUserAccount(accountId: string): Promise<boolean>;
  listParticipants(captureSessionId: string): Promise<StatkeeperLedgerParticipant[]>;
  findOccurrence(
    captureSessionId: string,
    occurrenceId: string
  ): Promise<StoredStatkeeperOccurrence | null>;
  advanceLedgerVersion(captureSessionId: string, expectedVersion: number, updatedAt: Date): Promise<number>;
  appendOccurrence(input: {
    record: StatkeeperOccurrenceLedgerRecord;
    context: StoredStatkeeperLedgerHead;
    actorAccountId: string;
    acceptedLedgerVersion: number;
    createdAt: Date;
  }): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: RecordStatkeeperLedgerOccurrenceResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface StatkeeperEventLedgerStore {
  transaction<T>(work: (transaction: StatkeeperEventLedgerTransaction) => Promise<T>): Promise<T>;
}

export interface StatkeeperEventLedgerDependencies {
  readonly now?: () => Date;
}

function rejection(
  command: RecordStatkeeperLedgerOccurrenceCommand,
  input: {
    entityType?: string;
    entityId?: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new StatkeeperLedgerRecordRejected(input.message, {
    entityType: input.entityType ?? 'CaptureSession',
    entityId: input.entityId ?? command.captureSessionId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'record Statkeeper ledger occurrence',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function contextFor(
  head: StoredStatkeeperLedgerHead,
  participants: readonly StatkeeperLedgerParticipant[]
): StatkeeperLedgerContext {
  return {
    captureSessionId: head.captureSessionId,
    gameId: head.gameId,
    profileVersionId: head.profileVersionId,
    profileContentHash: head.profileContentHash,
    mediaId: head.mediaId,
    homeSeasonTeamId: head.homeSeasonTeamId,
    awaySeasonTeamId: head.awaySeasonTeamId,
    regulationPeriodCount: head.regulationPeriodCount,
    regulationPeriodDurationMs: head.regulationPeriodDurationMs,
    overtimePeriodDurationMs: head.overtimePeriodDurationMs,
    eventDefinitions: head.eventDefinitions,
    participants
  };
}

function resultFor(
  record: StatkeeperOccurrenceLedgerRecord,
  captureSessionId: string,
  ledgerVersion: number,
  occurrenceReused: boolean
): RecordStatkeeperLedgerOccurrenceResult {
  return {
    receiptReused: false,
    occurrenceReused,
    operation: 'record_statkeeper_ledger_occurrence',
    captureSessionId,
    occurrenceId: record.occurrenceId,
    occurrenceRevisionId: record.occurrenceRevisionId,
    eventIds: record.events.map((event) => event.id),
    contentHash: record.contentHash,
    ledgerVersion
  };
}

export function createStatkeeperEventLedgerService(
  store: StatkeeperEventLedgerStore,
  dependencies: StatkeeperEventLedgerDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());

  return async function recordStatkeeperLedgerOccurrence(
    command: RecordStatkeeperLedgerOccurrenceCommand
  ): Promise<RecordStatkeeperLedgerOccurrenceResult> {
    let normalizedOccurrence;
    let normalizedCommandId: string;
    let normalizedActorAccountId: string;
    let normalizedCaptureSessionId: string;
    try {
      if (command.type !== 'record_statkeeper_ledger_occurrence') {
        throw new RuleViolation(
          'statkeeper.ledger.command_type',
          'Statkeeper ledger command type is unsupported'
        );
      }
      if (typeof command.commandId !== 'string' || !UUID.test(command.commandId)) {
        throw new RuleViolation('command.identity', 'Command identity must be a UUID');
      }
      if (typeof command.actorAccountId !== 'string' || !UUID.test(command.actorAccountId)) {
        throw new RuleViolation(
          'statkeeper.ledger.actor',
          'Recording actor identity must be a UUID'
        );
      }
      if (typeof command.captureSessionId !== 'string' || !UUID.test(command.captureSessionId)) {
        throw new RuleViolation(
          'statkeeper.ledger.session',
          'Capture Session identity must be a UUID'
        );
      }
      normalizedCommandId = command.commandId.toLowerCase();
      normalizedActorAccountId = command.actorAccountId.toLowerCase();
      normalizedCaptureSessionId = command.captureSessionId.toLowerCase();
      if (!Number.isSafeInteger(command.expectedLedgerVersion) || command.expectedLedgerVersion < 1) {
        throw new RuleViolation(
          'statkeeper.ledger.version',
          'Expected ledger version must be a positive safe integer'
        );
      }
      normalizedOccurrence = normalizeStatkeeperOccurrenceInput(command.occurrence);
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      throw rejection(command, {
        currentStateOrCondition: 'invalid occurrence input',
        violatedRule: error.rule,
        message: error.message
      });
    }

    const commandType = 'record_statkeeper_ledger_occurrence';
    let payloadHash: string;
    try {
      payloadHash = statkeeperCanonicalHash({
        actor_account_id: normalizedActorAccountId,
        capture_session_id: normalizedCaptureSessionId,
        expected_ledger_version: command.expectedLedgerVersion,
        occurrence: statkeeperOccurrenceCommandValue(normalizedOccurrence)
      });
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      throw rejection(command, {
        currentStateOrCondition: 'invalid command identity or canonical content',
        violatedRule: error.rule,
        message: error.message
      });
    }

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(normalizedCommandId);
      const receipt = await transaction.findCommandReceipt(normalizedCommandId);
      if (receipt) {
        if (receipt.commandType !== commandType || receipt.payloadHash !== payloadHash) {
          throw rejection(command, {
            entityType: 'CommandReceipt',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency',
            message: 'Command identity cannot be reused for different Statkeeper content'
          });
        }
        return {...receipt.result, receiptReused: true};
      }

      const head = await transaction.findLedgerHeadForUpdate(normalizedCaptureSessionId);
      if (!head) {
        throw rejection(command, {
          currentStateOrCondition: 'ledger head not found',
          violatedRule: 'statkeeper.ledger.exists',
          message: 'The Statkeeper event ledger has not been initialized by session preflight'
        });
      }
      if (!['final', 'forfeit'].includes(head.gameStatus) || !head.competitionEligibilityAt) {
        throw rejection(command, {
          entityType: 'Game',
          entityId: head.gameId,
          currentStateOrCondition: head.gameStatus,
          violatedRule: 'statkeeper.ledger.game_anchored',
          message: 'Statkeeper ledger recording requires a completed, eligibility-anchored Game'
        });
      }
      if (!await transaction.hasUserAccount(normalizedActorAccountId)) {
        throw rejection(command, {
          entityType: 'UserAccount',
          entityId: command.actorAccountId,
          currentStateOrCondition: 'not provisioned',
          violatedRule: 'statkeeper.ledger.actor',
          message: 'Recording actor must be a provisioned User Account'
        });
      }

      let record: StatkeeperOccurrenceLedgerRecord;
      try {
        record = buildStatkeeperOccurrenceLedgerRecord(
          contextFor(head, await transaction.listParticipants(head.captureSessionId)),
          normalizedActorAccountId,
          normalizedOccurrence
        );
      } catch (error) {
        if (!(error instanceof RuleViolation)) throw error;
        throw rejection(command, {
          currentStateOrCondition: 'occurrence violates the snapshotted ledger context',
          violatedRule: error.rule,
          message: error.message
        });
      }

      const existing = await transaction.findOccurrence(
        head.captureSessionId,
        record.occurrenceId
      );
      const acceptedAt = now();
      if (existing) {
        if (existing.contentHash !== record.contentHash) {
          throw rejection(command, {
            entityType: 'GameOccurrence',
            entityId: record.occurrenceId,
            currentStateOrCondition: 'occurrence identity already records different content',
            violatedRule: 'statkeeper.occurrence.identity',
            message: 'Occurrence identity cannot be reused for different content'
          });
        }
        const result: RecordStatkeeperLedgerOccurrenceResult = {
          receiptReused: false,
          occurrenceReused: true,
          operation: 'record_statkeeper_ledger_occurrence',
          captureSessionId: head.captureSessionId,
          occurrenceId: existing.occurrenceId,
          occurrenceRevisionId: existing.occurrenceRevisionId,
          eventIds: existing.eventIds,
          contentHash: existing.contentHash,
          ledgerVersion: existing.acceptedLedgerVersion
        };
        await transaction.saveCommandReceipt({
          commandId: normalizedCommandId,
          commandType,
          payloadHash,
          result,
          createdAt: acceptedAt
        });
        return result;
      }

      if (head.ledgerVersion !== command.expectedLedgerVersion) {
        throw rejection(command, {
          currentStateOrCondition: `ledger version ${head.ledgerVersion}`,
          violatedRule: 'statkeeper.ledger.stale_version',
          message: 'Statkeeper ledger changed before this occurrence could be recorded'
        });
      }
      const nextLedgerVersion = await transaction.advanceLedgerVersion(
        head.captureSessionId,
        command.expectedLedgerVersion,
        acceptedAt
      );
      await transaction.appendOccurrence({
        record,
        context: head,
        actorAccountId: normalizedActorAccountId,
        acceptedLedgerVersion: nextLedgerVersion,
        createdAt: acceptedAt
      });
      const result = resultFor(record, head.captureSessionId, nextLedgerVersion, false);
      await transaction.saveCommandReceipt({
        commandId: normalizedCommandId,
        commandType,
        payloadHash,
        result,
        createdAt: acceptedAt
      });
      return result;
    });
  };
}
