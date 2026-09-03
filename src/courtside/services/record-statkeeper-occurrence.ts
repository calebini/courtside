import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {
  expandStatkeeperCaptureAction,
  type StatkeeperCaptureActionInput,
  type StatkeeperOpenPossession
} from '@/courtside/core/statkeeper-capture';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import {
  buildStatkeeperOccurrenceLedgerRecord,
  type StatkeeperLedgerContext,
  type StatkeeperLedgerParticipant,
  type StatkeeperOccurrenceLedgerRecord
} from '@/courtside/core/statkeeper-event-ledger';
import type {NormalizedStatkeeperProfile} from '@/courtside/core/statkeeper-profile';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_KEY = /^[a-z][a-z0-9_]{0,63}$/;
const COMMAND_TYPE = 'statkeeper.occurrence_recorded';

export interface RecordStatkeeperOccurrenceCommand extends StatkeeperCaptureActionInput {
  readonly type: 'record_statkeeper_occurrence';
  readonly commandId: string;
  /** Derived from the verified server session; never accepted from an untrusted browser binding. */
  readonly actorAccountId: string;
  readonly captureSessionId: string;
  readonly expectedLedgerVersion: number;
}

export interface RecordStatkeeperOccurrenceResult {
  readonly receiptReused: boolean;
  readonly occurrenceReused: boolean;
  readonly operation: 'record_statkeeper_occurrence';
  readonly captureSessionId: string;
  readonly occurrenceId: string;
  readonly occurrenceRevisionId: string;
  readonly eventIds: readonly string[];
  readonly contentHash: string;
  readonly ledgerVersion: number;
  readonly lifecycleStatus: 'capturing' | 'in_review';
  readonly possessionEffect: 'retain' | 'switch' | 'prompt';
  readonly possessionTransition: {
    readonly sequenceId: string;
    readonly fromSeasonTeamId: string;
    readonly toSeasonTeamId: string;
    readonly atMediaOffsetMs: number;
  } | null;
  readonly possessionPromptRequired: boolean;
}

export class StatkeeperOccurrenceRecordRejected extends Error {
  constructor(
    message: string,
    readonly report: {
      readonly entityType: string;
      readonly entityId: string;
      readonly currentStateOrCondition: string;
      readonly requestedMutation: 'record Statkeeper occurrence';
      readonly actorAccountId: string;
      readonly violatedRule: string;
      readonly authoritativeStatePreserved: true;
      readonly currentLedgerVersion?: number;
    }
  ) {
    super(message);
    this.name = 'StatkeeperOccurrenceRecordRejected';
  }
}

export interface StoredStatkeeperCaptureSession {
  readonly captureSessionId: string;
  readonly leagueId: string;
  readonly lifecycleStatus: 'capturing' | 'in_review' | 'verified' | 'published' | 'abandoned';
  readonly workingRevisionId: string;
  readonly ledger: StatkeeperLedgerContext & {readonly ledgerVersion: number};
  readonly profile: NormalizedStatkeeperProfile;
  readonly participants: readonly StatkeeperLedgerParticipant[];
  readonly openPossession: StatkeeperOpenPossession | null;
}

export interface StoredCaptureOccurrence {
  readonly occurrenceId: string;
  readonly occurrenceRevisionId: string;
  readonly contentHash: string;
  readonly eventIds: readonly string[];
  readonly acceptedLedgerVersion: number;
  readonly acceptedLifecycleStatus: 'capturing' | 'in_review';
  readonly captureActionKey: string;
  readonly captureInputHash: string;
  readonly automaticPossessionSequenceId: string | null;
  readonly automaticPossessingSeasonTeamId: string | null;
  readonly automaticStartMediaOffsetMs: number | null;
}

export interface StoredCaptureReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: RecordStatkeeperOccurrenceResult;
}

export interface StatkeeperOccurrenceTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredCaptureReceipt | null>;
  findCaptureSessionForUpdate(captureSessionId: string): Promise<StoredStatkeeperCaptureSession | null>;
  hasActiveCaptureAuthority(leagueId: string, actorAccountId: string): Promise<boolean>;
  findOccurrence(captureSessionId: string, occurrenceId: string): Promise<StoredCaptureOccurrence | null>;
  advanceLedgerVersion(captureSessionId: string, expectedVersion: number, updatedAt: Date): Promise<number>;
  appendOccurrence(input: {
    record: StatkeeperOccurrenceLedgerRecord;
    context: StatkeeperLedgerContext;
    actorAccountId: string;
    acceptedLedgerVersion: number;
    captureActionKey: string;
    workingRevisionId: string;
    acceptedLifecycleStatus: 'capturing' | 'in_review';
    captureInputHash: string;
    createdAt: Date;
  }): Promise<void>;
  applyAutomaticPossessionSwitch(input: {
    acceptedLedgerVersion: number;
    closingSequenceId: string;
    newSequenceId: string;
    captureSessionId: string;
    workingRevisionId: string;
    occurrenceId: string;
    occurrenceRevisionId: string;
    fromSeasonTeamId: string;
    toSeasonTeamId: string;
    atMediaOffsetMs: number;
    actorAccountId: string;
    createdAt: Date;
  }): Promise<void>;
  updateSessionAfterRecording(input: {
    captureSessionId: string;
    previousLifecycleStatus: StoredStatkeeperCaptureSession['lifecycleStatus'];
    updatedAt: Date;
  }): Promise<'capturing' | 'in_review'>;
  saveCommandReceipt(input: {
    commandId: string;
    payloadHash: string;
    result: RecordStatkeeperOccurrenceResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface StatkeeperOccurrenceStore {
  transaction<T>(work: (transaction: StatkeeperOccurrenceTransaction) => Promise<T>): Promise<T>;
}

function rejection(
  command: RecordStatkeeperOccurrenceCommand,
  input: {
    entityType?: string;
    entityId?: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
    currentLedgerVersion?: number;
  }
) {
  return new StatkeeperOccurrenceRecordRejected(input.message, {
    entityType: input.entityType ?? 'CaptureSession',
    entityId: input.entityId ?? command.captureSessionId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'record Statkeeper occurrence',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true,
    ...(input.currentLedgerVersion === undefined
      ? {}
      : {currentLedgerVersion: input.currentLedgerVersion})
  });
}

function uuid(value: unknown, label: string) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new RuleViolation('statkeeper.capture.identity', `${label} must be a UUID`);
  }
  return value.toLowerCase();
}

function canonicalKey(value: unknown, label: string) {
  if (typeof value !== 'string' || !CANONICAL_KEY.test(value)) {
    throw new RuleViolation('statkeeper.capture.action', `${label} must be a canonical key`);
  }
  return value;
}

function normalizeNote(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new RuleViolation('statkeeper.occurrence.note', 'Operator note must be text or null');
  }
  const normalized = value.trim().normalize('NFC');
  if (!normalized) return null;
  if ([...normalized].length > 500) {
    throw new RuleViolation(
      'statkeeper.occurrence.note',
      'Operator note must not exceed 500 Unicode scalar values'
    );
  }
  return normalized;
}

function nonnegativeInteger(value: unknown, label: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RuleViolation('statkeeper.occurrence.time', `${label} must be a nonnegative safe integer`);
  }
  return value as number;
}

function positiveInteger(value: unknown, label: string) {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new RuleViolation('statkeeper.occurrence.time', `${label} must be a positive safe integer`);
  }
  return value as number;
}

function normalizeCaptureEvidence(raw: RecordStatkeeperOccurrenceCommand) {
  const evidenceTimestampMs = nonnegativeInteger(raw.evidenceTimestampMs, 'Evidence timestamp');
  let evidenceWindow = null;
  if (raw.evidenceWindow !== null) {
    if (!raw.evidenceWindow || typeof raw.evidenceWindow !== 'object') {
      throw new RuleViolation('statkeeper.occurrence.evidence_window', 'Evidence window must be an object or null');
    }
    const startMs = nonnegativeInteger(raw.evidenceWindow.startMs, 'Evidence-window start');
    const endMs = nonnegativeInteger(raw.evidenceWindow.endMs, 'Evidence-window end');
    if (startMs > evidenceTimestampMs || evidenceTimestampMs > endMs) {
      throw new RuleViolation(
        'statkeeper.occurrence.evidence_window',
        'Evidence window must contain the evidence timestamp'
      );
    }
    evidenceWindow = {startMs, endMs};
  }
  if (!raw.period || !['regulation', 'overtime'].includes(raw.period.kind)) {
    throw new RuleViolation('statkeeper.occurrence.period', 'Period kind is unsupported');
  }
  const period = {
    kind: raw.period.kind,
    ordinal: positiveInteger(raw.period.ordinal, 'Period ordinal')
  } as const;
  if (!raw.clock || !['exact', 'estimated', 'unavailable'].includes(raw.clock.state)) {
    throw new RuleViolation('statkeeper.occurrence.clock', 'Clock annotation is required');
  }
  const clock = raw.clock.state === 'unavailable'
    ? {
        state: 'unavailable' as const,
        reason: (() => {
          const reason = normalizeNote(raw.clock.reason);
          if (!reason) {
            throw new RuleViolation('statkeeper.occurrence.clock', 'Unavailable-clock reason is required');
          }
          if ([...reason].length > 240) {
            throw new RuleViolation('statkeeper.occurrence.clock', 'Clock reason must not exceed 240 Unicode scalar values');
          }
          return reason;
        })()
      }
    : raw.clock.state === 'exact'
      ? {
          state: 'exact' as const,
          remainingMs: nonnegativeInteger(raw.clock.remainingMs, 'Remaining clock time')
        }
      : {
          state: 'estimated' as const,
          remainingMs: nonnegativeInteger(raw.clock.remainingMs, 'Remaining clock time'),
          reason: (() => {
            const reason = normalizeNote(raw.clock.reason);
            if (reason && [...reason].length > 240) {
              throw new RuleViolation('statkeeper.occurrence.clock', 'Clock reason must not exceed 240 Unicode scalar values');
            }
            return reason;
          })()
        };
  return {evidenceTimestampMs, evidenceWindow, period, clock};
}

function normalizeCommand(
  raw: RecordStatkeeperOccurrenceCommand
): RecordStatkeeperOccurrenceCommand {
  const runtime = raw as RecordStatkeeperOccurrenceCommand & Record<string, unknown>;
  for (const forbidden of [
    'source',
    'model',
    'modelConfidence',
    'modelProvenance',
    'events',
    'seasonTeamId',
    'rosterMembershipId'
  ]) {
    if (forbidden in runtime) {
      throw new RuleViolation(
        'statkeeper.occurrence.deferred_inference_input',
        `${forbidden} is not accepted by the human Capture Action command`
      );
    }
  }
  if (raw.type !== 'record_statkeeper_occurrence') {
    throw new RuleViolation('statkeeper.capture.command_type', 'Capture command type is unsupported');
  }
  if (!Number.isSafeInteger(raw.expectedLedgerVersion) || raw.expectedLedgerVersion < 1) {
    throw new RuleViolation(
      'statkeeper.capture.ledger_version',
      'Expected ledger version must be a positive safe integer'
    );
  }
  if (!Array.isArray(raw.participantSelections)) {
    throw new RuleViolation('statkeeper.capture.participant', 'Participant selections must be an array');
  }
  const participantSelections = raw.participantSelections.map((selection) => ({
    roleKey: canonicalKey(selection?.roleKey, 'Participant role key'),
    playerId: uuid(selection?.playerId, 'Participant Player identity')
  }));
  if (new Set(participantSelections.map((value) => value.roleKey)).size !== participantSelections.length) {
    throw new RuleViolation(
      'statkeeper.capture.participant_role',
      'Participant role keys must be unique'
    );
  }
  participantSelections.sort((left, right) =>
    left.roleKey < right.roleKey ? -1 : left.roleKey > right.roleKey ? 1 : 0
  );
  const evidence = normalizeCaptureEvidence(raw);
  return {
    ...raw,
    commandId: uuid(raw.commandId, 'Command identity'),
    actorAccountId: uuid(raw.actorAccountId, 'Actor identity'),
    captureSessionId: uuid(raw.captureSessionId, 'Capture Session identity'),
    occurrenceId: uuid(raw.occurrenceId, 'Occurrence identity'),
    actionKey: canonicalKey(raw.actionKey, 'Capture Action key'),
    ...evidence,
    participantSelections,
    operatorNote: normalizeNote(raw.operatorNote)
  };
}

function commandValue(command: RecordStatkeeperOccurrenceCommand) {
  return {
    action_key: command.actionKey,
    actor_account_id: command.actorAccountId,
    capture_session_id: command.captureSessionId,
    clock: command.clock,
    evidence_timestamp_ms: command.evidenceTimestampMs,
    evidence_window: command.evidenceWindow,
    expected_ledger_version: command.expectedLedgerVersion,
    occurrence_id: command.occurrenceId,
    operator_note: command.operatorNote,
    participant_selections: command.participantSelections.map((selection) => ({
      player_id: selection.playerId,
      role_key: selection.roleKey
    })),
    period: command.period
  };
}

function captureInputValue(command: RecordStatkeeperOccurrenceCommand) {
  return {
    action_key: command.actionKey,
    capture_session_id: command.captureSessionId,
    clock: command.clock,
    evidence_timestamp_ms: command.evidenceTimestampMs,
    evidence_window: command.evidenceWindow,
    occurrence_id: command.occurrenceId,
    operator_note: command.operatorNote,
    participant_selections: command.participantSelections.map((selection) => ({
      player_id: selection.playerId,
      role_key: selection.roleKey
    })),
    period: command.period
  };
}

function resultFor(input: {
  command: RecordStatkeeperOccurrenceCommand;
  record: StatkeeperOccurrenceLedgerRecord;
  ledgerVersion: number;
  lifecycleStatus: 'capturing' | 'in_review';
  occurrenceReused: boolean;
  possessionSequenceId: string | null;
  expanded: ReturnType<typeof expandStatkeeperCaptureAction>;
}): RecordStatkeeperOccurrenceResult {
  const possession = input.expanded.possession;
  return {
    receiptReused: false,
    occurrenceReused: input.occurrenceReused,
    operation: 'record_statkeeper_occurrence',
    captureSessionId: input.command.captureSessionId,
    occurrenceId: input.record.occurrenceId,
    occurrenceRevisionId: input.record.occurrenceRevisionId,
    eventIds: input.record.events.map((event) => event.id),
    contentHash: input.record.contentHash,
    ledgerVersion: input.ledgerVersion,
    lifecycleStatus: input.lifecycleStatus,
    possessionEffect: possession.effect,
    possessionTransition: possession.effect === 'switch'
      ? {
          sequenceId: input.possessionSequenceId!,
          fromSeasonTeamId: possession.fromSeasonTeamId,
          toSeasonTeamId: possession.toSeasonTeamId,
          atMediaOffsetMs: possession.atMediaOffsetMs
        }
      : null,
    possessionPromptRequired: possession.effect === 'prompt'
  };
}

export function createStatkeeperOccurrenceRecordService(
  store: StatkeeperOccurrenceStore,
  dependencies: {readonly now?: () => Date; readonly newId?: () => string} = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function recordStatkeeperOccurrence(
    rawCommand: RecordStatkeeperOccurrenceCommand
  ): Promise<RecordStatkeeperOccurrenceResult> {
    let command: RecordStatkeeperOccurrenceCommand;
    let payloadHash: string;
    let captureInputHash: string;
    try {
      command = normalizeCommand(rawCommand);
      payloadHash = statkeeperCanonicalHash(commandValue(command));
      captureInputHash = statkeeperCanonicalHash(captureInputValue(command));
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      throw rejection(rawCommand, {
        currentStateOrCondition: 'invalid Capture Action command',
        violatedRule: error.rule,
        message: error.message
      });
    }

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== COMMAND_TYPE || receipt.payloadHash !== payloadHash) {
          throw rejection(command, {
            entityType: 'CommandReceipt',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency',
            message: 'Command identity cannot be reused for different capture content'
          });
        }
        return {...receipt.result, receiptReused: true};
      }

      const session = await transaction.findCaptureSessionForUpdate(command.captureSessionId);
      if (!session) {
        throw rejection(command, {
          currentStateOrCondition: 'Capture Session not found',
          violatedRule: 'statkeeper.session.exists',
          message: 'The Capture Session does not exist'
        });
      }
      if (!await transaction.hasActiveCaptureAuthority(session.leagueId, command.actorAccountId)) {
        throw rejection(command, {
          currentStateOrCondition: 'actor lacks active Capture Session authority',
          violatedRule: 'authorization.statkeeper_or_league_admin_required',
          message: 'Active League Statkeeper or League Administrator authority is required'
        });
      }
      if (!['capturing', 'in_review', 'verified'].includes(session.lifecycleStatus)) {
        throw rejection(command, {
          currentStateOrCondition: session.lifecycleStatus,
          violatedRule: 'statkeeper.session.recordable_state',
          message: 'The Capture Session lifecycle does not allow occurrence recording'
        });
      }

      const existing = await transaction.findOccurrence(
        session.captureSessionId,
        command.occurrenceId
      );
      const acceptedAt = now();
      if (existing) {
        if (
          existing.captureInputHash !== captureInputHash
          || existing.captureActionKey !== command.actionKey
        ) {
          throw rejection(command, {
            entityType: 'GameOccurrence',
            entityId: command.occurrenceId,
            currentStateOrCondition: 'occurrence identity already records different content',
            violatedRule: 'statkeeper.occurrence.identity',
            message: 'Occurrence identity cannot be reused for different Capture Action content',
            currentLedgerVersion: session.ledger.ledgerVersion
          });
        }
        const action = session.profile.definition.captureActions.find(
          (candidate) => candidate.actionKey === existing.captureActionKey
        );
        if (!action) {
          throw new Error(`Occurrence ${existing.occurrenceId} references a missing Capture Action`);
        }
        let possessionTransition: RecordStatkeeperOccurrenceResult['possessionTransition'] = null;
        if (action.possessionEffect === 'switch') {
          if (
            !existing.automaticPossessionSequenceId
            || !existing.automaticPossessingSeasonTeamId
            || existing.automaticStartMediaOffsetMs === null
          ) {
            throw new Error(`Occurrence ${existing.occurrenceId} lost its automatic possession transition`);
          }
          const toSeasonTeamId = existing.automaticPossessingSeasonTeamId;
          const fromSeasonTeamId = toSeasonTeamId === session.ledger.homeSeasonTeamId
            ? session.ledger.awaySeasonTeamId
            : session.ledger.homeSeasonTeamId;
          possessionTransition = {
            sequenceId: existing.automaticPossessionSequenceId,
            fromSeasonTeamId,
            toSeasonTeamId,
            atMediaOffsetMs: existing.automaticStartMediaOffsetMs
          };
        }
        const result: RecordStatkeeperOccurrenceResult = {
          receiptReused: false,
          occurrenceReused: true,
          operation: 'record_statkeeper_occurrence',
          captureSessionId: session.captureSessionId,
          occurrenceId: existing.occurrenceId,
          occurrenceRevisionId: existing.occurrenceRevisionId,
          eventIds: existing.eventIds,
          contentHash: existing.contentHash,
          ledgerVersion: existing.acceptedLedgerVersion,
          lifecycleStatus: existing.acceptedLifecycleStatus,
          possessionEffect: action.possessionEffect,
          possessionTransition,
          possessionPromptRequired: action.possessionEffect === 'prompt'
        };
        await transaction.saveCommandReceipt({
          commandId: command.commandId,
          payloadHash,
          result,
          createdAt: acceptedAt
        });
        return result;
      }

      let expanded: ReturnType<typeof expandStatkeeperCaptureAction>;
      let record: StatkeeperOccurrenceLedgerRecord;
      try {
        expanded = expandStatkeeperCaptureAction({
          profile: session.profile,
          homeSeasonTeamId: session.ledger.homeSeasonTeamId,
          awaySeasonTeamId: session.ledger.awaySeasonTeamId,
          participants: session.participants,
          openPossession: session.openPossession,
          capture: command
        });
        record = buildStatkeeperOccurrenceLedgerRecord(
          session.ledger,
          command.actorAccountId,
          expanded.occurrence
        );
      } catch (error) {
        if (!(error instanceof RuleViolation)) throw error;
        throw rejection(command, {
          currentStateOrCondition: 'Capture Action violates the snapshotted session context',
          violatedRule: error.rule,
          message: error.message,
          currentLedgerVersion: session.ledger.ledgerVersion
        });
      }

      if (session.ledger.ledgerVersion !== command.expectedLedgerVersion) {
        throw rejection(command, {
          currentStateOrCondition: `ledger version ${session.ledger.ledgerVersion}`,
          violatedRule: 'statkeeper.ledger.stale_version',
          message: 'The Capture Session changed before this occurrence could be recorded',
          currentLedgerVersion: session.ledger.ledgerVersion
        });
      }
      const nextLedgerVersion = await transaction.advanceLedgerVersion(
        session.captureSessionId,
        command.expectedLedgerVersion,
        acceptedAt
      );
      await transaction.appendOccurrence({
        record,
        context: session.ledger,
        actorAccountId: command.actorAccountId,
        acceptedLedgerVersion: nextLedgerVersion,
        captureActionKey: expanded.actionKey,
        workingRevisionId: session.workingRevisionId,
        acceptedLifecycleStatus: session.lifecycleStatus === 'capturing' ? 'capturing' : 'in_review',
        captureInputHash,
        createdAt: acceptedAt
      });
      let possessionSequenceId: string | null = null;
      if (expanded.possession.effect === 'switch') {
        possessionSequenceId = newId();
        await transaction.applyAutomaticPossessionSwitch({
          acceptedLedgerVersion: nextLedgerVersion,
          closingSequenceId: expanded.possession.closingSequenceId,
          newSequenceId: possessionSequenceId,
          captureSessionId: session.captureSessionId,
          workingRevisionId: session.workingRevisionId,
          occurrenceId: record.occurrenceId,
          occurrenceRevisionId: record.occurrenceRevisionId,
          fromSeasonTeamId: expanded.possession.fromSeasonTeamId,
          toSeasonTeamId: expanded.possession.toSeasonTeamId,
          atMediaOffsetMs: expanded.possession.atMediaOffsetMs,
          actorAccountId: command.actorAccountId,
          createdAt: acceptedAt
        });
      }
      const lifecycleStatus = await transaction.updateSessionAfterRecording({
        captureSessionId: session.captureSessionId,
        previousLifecycleStatus: session.lifecycleStatus,
        updatedAt: acceptedAt
      });
      const result = resultFor({
        command,
        record,
        ledgerVersion: nextLedgerVersion,
        lifecycleStatus,
        occurrenceReused: false,
        possessionSequenceId,
        expanded
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
