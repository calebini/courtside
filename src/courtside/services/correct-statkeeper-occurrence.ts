import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import {expandStatkeeperCaptureAction, type StatkeeperCaptureActionInput} from '@/courtside/core/statkeeper-capture';
import {
  buildStatkeeperOccurrenceLedgerRecord, buildStatkeeperVoidRevision,
  type StatkeeperOccurrenceLedgerRecord
} from '@/courtside/core/statkeeper-event-ledger';
import {normalizePossessionSequences, setCurrentPossession, type StatkeeperPossessionSequence} from '@/courtside/core/statkeeper-possession';
import {
  normalizeRecordStatkeeperOccurrenceCommand, statkeeperCaptureInputValue,
  type RecordStatkeeperOccurrenceCommand, type StoredStatkeeperCaptureSession
} from './record-statkeeper-occurrence';

type CorrectionBase = {
  readonly type: 'revise_statkeeper_occurrence' | 'void_statkeeper_occurrence';
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly captureSessionId: string;
  readonly occurrenceId: string;
  readonly expectedOccurrenceRevisionId: string;
  readonly expectedLedgerVersion: number;
  readonly reason?: string | null;
};
export type ReviseStatkeeperOccurrenceCommand = CorrectionBase & {
  readonly type: 'revise_statkeeper_occurrence';
  readonly replacement: Omit<StatkeeperCaptureActionInput, 'occurrenceId'>;
};
export type VoidStatkeeperOccurrenceCommand = CorrectionBase & {readonly type: 'void_statkeeper_occurrence'};
export type CorrectStatkeeperOccurrenceCommand = ReviseStatkeeperOccurrenceCommand | VoidStatkeeperOccurrenceCommand;

export interface CorrectStatkeeperOccurrenceResult {
  readonly receiptReused: boolean;
  readonly operation: CorrectStatkeeperOccurrenceCommand['type'];
  readonly captureSessionId: string;
  readonly occurrenceId: string;
  readonly previousOccurrenceRevisionId: string;
  readonly occurrenceRevisionId: string;
  readonly revisionNumber: number;
  readonly disposition: 'active' | 'void';
  readonly eventIds: readonly string[];
  readonly contentHash: string;
  readonly ledgerVersion: number;
  readonly lifecycleStatus: 'capturing' | 'in_review';
  readonly possessionChanged: boolean;
  readonly possessionBasisId: string | null;
  readonly reviewInvalidated: true;
}

export interface StoredCorrectionOccurrence {
  readonly record: StatkeeperOccurrenceLedgerRecord;
  readonly captureActionKey: string;
  readonly captureInputHash: string;
  readonly acceptedLedgerVersion: number;
  readonly initialAcceptedLedgerVersion: number;
}
export interface StoredCorrectionSession extends StoredStatkeeperCaptureSession {
  readonly possessionBasisId: string | null;
  readonly possessionBasisLedgerVersion: number | null;
  readonly possessionBasisOperation: 'migration' | 'manual_set' | 'manual_correction' | 'automatic_switch' | 'occurrence_correction' | null;
  readonly previousPossessionBasisId: string | null;
  readonly possessionSequences: readonly StatkeeperPossessionSequence[];
}
export interface StatkeeperOccurrenceCorrectionTransaction {
  lockCommand(commandId: string): Promise<void>;
  findReceipt(commandId: string): Promise<{commandType: string; payloadHash: string; result: CorrectStatkeeperOccurrenceResult} | null>;
  lockSession(captureSessionId: string): Promise<StoredCorrectionSession | null>;
  hasCaptureAuthority(leagueId: string, actorAccountId: string): Promise<boolean>;
  findCurrentOccurrence(captureSessionId: string, occurrenceId: string): Promise<StoredCorrectionOccurrence | null>;
  findPossessionBasis(basisId: string): Promise<{basisId: string; sequences: readonly StatkeeperPossessionSequence[]} | null>;
  hasLaterCurrentOccurrence(captureSessionId: string, occurrenceId: string, acceptedLedgerVersion: number): Promise<boolean>;
  persist(input: {
    session: StoredCorrectionSession;
    command: CorrectStatkeeperOccurrenceCommand;
    payloadHash: string;
    record: StatkeeperOccurrenceLedgerRecord;
    previous: StoredCorrectionOccurrence;
    captureActionKey: string;
    captureInputHash: string;
    acceptedAt: Date;
    result: CorrectStatkeeperOccurrenceResult;
    possession: {basisId: string; previousBasisId: string | null; sequences: readonly StatkeeperPossessionSequence[]; mediaOffsetMs: number} | null;
    auditId: string;
  }): Promise<void>;
}
export interface StatkeeperOccurrenceCorrectionStore {
  transaction<T>(work: (transaction: StatkeeperOccurrenceCorrectionTransaction) => Promise<T>): Promise<T>;
}

export class StatkeeperOccurrenceCorrectionRejected extends Error {
  constructor(message: string, readonly report: {
    entityType: 'CaptureSession' | 'GameOccurrence' | 'CommandReceipt';
    entityId: string; currentStateOrCondition: string;
    requestedMutation: CorrectStatkeeperOccurrenceCommand['type']; actorAccountId: string;
    violatedRule: string; authoritativeStatePreserved: true; currentLedgerVersion?: number;
  }) { super(message); this.name = 'StatkeeperOccurrenceCorrectionRejected'; }
}

function id(value: unknown, label: string) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new RuleViolation('statkeeper.correction.identity', `${label} must be a UUID`);
  }
  return value.toLowerCase();
}
function normalizeReason(value: unknown) {
  if (value == null) return null;
  if (typeof value !== 'string') throw new RuleViolation('statkeeper.correction.reason', 'Correction reason must be text or null');
  const reason = value.trim().normalize('NFC');
  if (!reason) return null;
  if ([...reason].length > 500) throw new RuleViolation('statkeeper.correction.reason', 'Correction reason must not exceed 500 Unicode scalar values');
  return reason;
}

function normalizeCommand(raw: CorrectStatkeeperOccurrenceCommand): {
  command: CorrectStatkeeperOccurrenceCommand; replacement: RecordStatkeeperOccurrenceCommand | null;
} {
  if (!['revise_statkeeper_occurrence', 'void_statkeeper_occurrence'].includes(raw.type)) {
    throw new RuleViolation('statkeeper.correction.command', 'Occurrence correction command is unsupported');
  }
  if (!Number.isSafeInteger(raw.expectedLedgerVersion) || raw.expectedLedgerVersion < 1) {
    throw new RuleViolation('statkeeper.ledger.version', 'Expected ledger version must be a positive safe integer');
  }
  const base = {
    type: raw.type, commandId: id(raw.commandId, 'Command'), actorAccountId: id(raw.actorAccountId, 'Actor'),
    captureSessionId: id(raw.captureSessionId, 'Capture Session'), occurrenceId: id(raw.occurrenceId, 'Occurrence'),
    expectedOccurrenceRevisionId: id(raw.expectedOccurrenceRevisionId, 'Expected occurrence revision'),
    expectedLedgerVersion: raw.expectedLedgerVersion, reason: normalizeReason(raw.reason)
  } as const;
  if (raw.type === 'void_statkeeper_occurrence') {
    if ('replacement' in raw) {
      throw new RuleViolation('statkeeper.correction.replacement', 'Void does not accept replacement Capture Action input');
    }
    return {command: {...base, type: 'void_statkeeper_occurrence'}, replacement: null};
  }
  if (!raw.replacement || typeof raw.replacement !== 'object' || Array.isArray(raw.replacement)) {
    throw new RuleViolation('statkeeper.correction.replacement', 'Revise requires complete replacement Capture Action input');
  }
  const allowedReplacementKeys = new Set([
    'actionKey', 'evidenceTimestampMs', 'evidenceWindow', 'period', 'clock',
    'participantSelections', 'operatorNote'
  ]);
  const unexpected = Object.keys(raw.replacement).find((key) => !allowedReplacementKeys.has(key));
  if (unexpected) {
    throw new RuleViolation('statkeeper.correction.replacement', `${unexpected} is not part of replacement Capture Action input`);
  }
  const replacement = normalizeRecordStatkeeperOccurrenceCommand({
    type: 'record_statkeeper_occurrence', commandId: base.commandId, actorAccountId: base.actorAccountId,
    captureSessionId: base.captureSessionId, expectedLedgerVersion: base.expectedLedgerVersion,
    occurrenceId: base.occurrenceId, actionKey: raw.replacement.actionKey,
    evidenceTimestampMs: raw.replacement.evidenceTimestampMs,
    evidenceWindow: raw.replacement.evidenceWindow, period: raw.replacement.period,
    clock: raw.replacement.clock, participantSelections: raw.replacement.participantSelections,
    operatorNote: raw.replacement.operatorNote
  });
  return {command: {...base, replacement: {
    actionKey: replacement.actionKey, evidenceTimestampMs: replacement.evidenceTimestampMs,
    evidenceWindow: replacement.evidenceWindow, period: replacement.period, clock: replacement.clock,
    participantSelections: replacement.participantSelections, operatorNote: replacement.operatorNote
  }}, replacement};
}

function commandValue(command: CorrectStatkeeperOccurrenceCommand, replacement: RecordStatkeeperOccurrenceCommand | null) {
  return {
    actor_account_id: command.actorAccountId, capture_session_id: command.captureSessionId,
    expected_ledger_version: command.expectedLedgerVersion,
    expected_occurrence_revision_id: command.expectedOccurrenceRevisionId,
    occurrence_id: command.occurrenceId, operation: command.type, reason: command.reason ?? null,
    replacement: replacement ? statkeeperCaptureInputValue(replacement) : null
  };
}

export function createStatkeeperOccurrenceCorrectionService(
  store: StatkeeperOccurrenceCorrectionStore,
  dependencies: {readonly now?: () => Date; readonly newId?: () => string} = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;
  return async (raw: CorrectStatkeeperOccurrenceCommand): Promise<CorrectStatkeeperOccurrenceResult> => {
    let command: CorrectStatkeeperOccurrenceCommand;
    let replacement: RecordStatkeeperOccurrenceCommand | null;
    let payloadHash: string;
    let session: StoredCorrectionSession | null = null;
    let authorityConfirmed = false;
    try {
      ({command, replacement} = normalizeCommand(raw));
      payloadHash = statkeeperCanonicalHash(commandValue(command, replacement));
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      throw new StatkeeperOccurrenceCorrectionRejected(error.message, {
        entityType: 'CaptureSession', entityId: raw.captureSessionId, currentStateOrCondition: 'invalid correction command',
        requestedMutation: raw.type, actorAccountId: raw.actorAccountId, violatedRule: error.rule, authoritativeStatePreserved: true
      });
    }
    try {
      return await store.transaction(async (transaction) => {
        await transaction.lockCommand(command.commandId);
        const receipt = await transaction.findReceipt(command.commandId);
        if (receipt) {
          if (receipt.commandType !== `statkeeper.occurrence_${command.type === 'revise_statkeeper_occurrence' ? 'revised' : 'voided'}`
            || receipt.payloadHash !== payloadHash) {
            throw new RuleViolation('command.idempotency', 'Command identity cannot be reused for different correction content');
          }
          return {...receipt.result, receiptReused: true};
        }
        session = await transaction.lockSession(command.captureSessionId);
        if (!session) throw new RuleViolation('statkeeper.session.exists', 'Capture Session not found');
        if (!await transaction.hasCaptureAuthority(session.leagueId, command.actorAccountId)) {
          throw new RuleViolation('authorization.statkeeper_or_league_admin_required', 'Active League Statkeeper or League Administrator authority is required');
        }
        authorityConfirmed = true;
        if (!['capturing', 'in_review', 'verified'].includes(session.lifecycleStatus)) {
          throw new RuleViolation('statkeeper.session.correction_state', 'Published correction must begin through begin_statkeeper_correction; this session is not directly editable');
        }
        if (session.ledger.ledgerVersion !== command.expectedLedgerVersion) {
          throw new RuleViolation('statkeeper.ledger.stale_version', 'Capture Session changed; reload before correcting this occurrence');
        }
        const current = await transaction.findCurrentOccurrence(session.captureSessionId, command.occurrenceId);
        if (!current) throw new RuleViolation('statkeeper.occurrence.exists', 'Game Occurrence not found');
        if (current.record.occurrenceRevisionId !== command.expectedOccurrenceRevisionId) {
          throw new RuleViolation('statkeeper.occurrence.stale_revision', 'Game Occurrence changed; reload its current revision');
        }
        if (current.record.revisionNumber === Number.MAX_SAFE_INTEGER || session.ledger.ledgerVersion === Number.MAX_SAFE_INTEGER) {
          throw new RuleViolation('statkeeper.occurrence.revision', 'Occurrence or ledger version cannot exceed the safe integer limit');
        }
        if (command.type === 'void_statkeeper_occurrence' && current.record.disposition === 'void') {
          throw new RuleViolation('statkeeper.occurrence.no_change', 'The current occurrence revision is already void');
        }
        if (replacement && current.record.disposition === 'active'
          && statkeeperCanonicalHash(statkeeperCaptureInputValue(replacement)) === current.captureInputHash) {
          throw new RuleViolation('statkeeper.occurrence.no_change', 'A revised occurrence must change its complete capture input');
        }

        let baseSequences = normalizePossessionSequences(session.possessionSequences);
        let removesAutomaticEffect = false;
        const laterCurrentOccurrence = await transaction.hasLaterCurrentOccurrence(
          session.captureSessionId, command.occurrenceId, current.initialAcceptedLedgerVersion
        );
        const caused = baseSequences.find((sequence) =>
          sequence.transitionKind === 'automatic'
          && sequence.causingOccurrenceRevisionId === current.record.occurrenceRevisionId
        );
        if (caused) {
          if (caused.endMediaOffsetMs !== null || laterCurrentOccurrence
            || session.possessionBasisOperation !== 'automatic_switch'
            || session.possessionBasisLedgerVersion !== current.acceptedLedgerVersion) {
            throw new RuleViolation('statkeeper.possession.review_conflict', 'Later occurrence or possession history depends on this automatic switch; correct possession explicitly first');
          }
          if (!session.previousPossessionBasisId) {
            throw new Error('Automatic possession basis has no immutable predecessor');
          }
          const predecessor = await transaction.findPossessionBasis(session.previousPossessionBasisId);
          if (!predecessor) throw new Error('Automatic possession basis lost its immutable predecessor');
          baseSequences = normalizePossessionSequences(predecessor.sequences);
          removesAutomaticEffect = true;
        }
        const baseOpen = baseSequences.find((sequence) => sequence.endMediaOffsetMs === null);
        const acceptedAt = now();
        const nextRevision = current.record.revisionNumber + 1;
        let record: StatkeeperOccurrenceLedgerRecord;
        let captureActionKey: string;
        let captureInputHash: string;
        let possessionSequences: readonly StatkeeperPossessionSequence[] | null = null;
        let mediaOffsetMs: number;
        if (replacement) {
          const expanded = expandStatkeeperCaptureAction({
            profile: session.profile, homeSeasonTeamId: session.ledger.homeSeasonTeamId,
            awaySeasonTeamId: session.ledger.awaySeasonTeamId, participants: session.participants,
            openPossession: baseOpen ? {sequenceId: baseOpen.sequenceId, possessingSeasonTeamId: baseOpen.possessingSeasonTeamId, startMediaOffsetMs: baseOpen.startMediaOffsetMs} : null,
            capture: replacement
          });
          record = buildStatkeeperOccurrenceLedgerRecord(session.ledger, command.actorAccountId, expanded.occurrence, {
            revisionNumber: nextRevision, previousOccurrenceRevisionId: current.record.occurrenceRevisionId,
            correctionReason: command.reason
          });
          captureActionKey = expanded.actionKey;
          captureInputHash = statkeeperCanonicalHash(statkeeperCaptureInputValue(replacement));
          mediaOffsetMs = replacement.evidenceTimestampMs;
          if (expanded.possession.effect === 'switch') {
            if (laterCurrentOccurrence) {
              throw new RuleViolation('statkeeper.possession.review_conflict', 'A later occurrence could depend on the corrected automatic switch; correct possession explicitly first');
            }
            possessionSequences = setCurrentPossession({
              context: session.ledger, sequences: baseSequences, sequenceId: id(newId(), 'Possession Sequence'),
              seasonTeamId: expanded.possession.toSeasonTeamId, mediaOffsetMs: expanded.possession.atMediaOffsetMs,
              automaticCause: {occurrenceId: record.occurrenceId, occurrenceRevisionId: record.occurrenceRevisionId}
            });
          } else if (removesAutomaticEffect) possessionSequences = baseSequences;
        } else {
          record = buildStatkeeperVoidRevision({context: session.ledger, actorAccountId: command.actorAccountId,
            current: current.record, revisionNumber: nextRevision, reason: command.reason ?? null});
          captureActionKey = current.captureActionKey;
          captureInputHash = current.captureInputHash;
          const currentPayload = JSON.parse(current.record.canonicalPayload) as {evidence_timestamp_ms: number};
          mediaOffsetMs = currentPayload.evidence_timestamp_ms;
          if (removesAutomaticEffect) possessionSequences = baseSequences;
        }
        const basisId = possessionSequences ? id(newId(), 'Possession basis') : null;
        const lifecycleStatus = session.lifecycleStatus === 'capturing' ? 'capturing' : 'in_review';
        const result: CorrectStatkeeperOccurrenceResult = {
          receiptReused: false, operation: command.type, captureSessionId: session.captureSessionId,
          occurrenceId: record.occurrenceId, previousOccurrenceRevisionId: current.record.occurrenceRevisionId,
          occurrenceRevisionId: record.occurrenceRevisionId, revisionNumber: record.revisionNumber,
          disposition: record.disposition, eventIds: record.events.map((event) => event.id), contentHash: record.contentHash,
          ledgerVersion: session.ledger.ledgerVersion + 1, lifecycleStatus,
          possessionChanged: possessionSequences !== null, possessionBasisId: basisId, reviewInvalidated: true
        };
        await transaction.persist({session, command, payloadHash, record, previous: current, captureActionKey, captureInputHash,
          acceptedAt, result, auditId: id(newId(), 'Audit Record'),
          possession: possessionSequences ? {basisId: basisId!, previousBasisId: session.possessionBasisId,
            sequences: possessionSequences, mediaOffsetMs} : null});
        return result;
      });
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      const currentSession = authorityConfirmed ? session as StoredCorrectionSession | null : null;
      throw new StatkeeperOccurrenceCorrectionRejected(error.message, {
        entityType: error.rule === 'command.idempotency' ? 'CommandReceipt' : error.rule.startsWith('statkeeper.occurrence') ? 'GameOccurrence' : 'CaptureSession',
        entityId: error.rule === 'command.idempotency' ? command.commandId : error.rule.startsWith('statkeeper.occurrence') ? command.occurrenceId : command.captureSessionId,
        currentStateOrCondition: currentSession?.lifecycleStatus ?? 'invalid or unauthorized correction request',
        requestedMutation: command.type, actorAccountId: command.actorAccountId,
        violatedRule: error.rule, authoritativeStatePreserved: true,
        ...(currentSession ? {currentLedgerVersion: currentSession.ledger.ledgerVersion} : {})
      });
    }
  };
}
