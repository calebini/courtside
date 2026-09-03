import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import {
  correctPossessionBasis, normalizePossessionSequences, possessionBasisHash, possessionBasisValue,
  possessionOffset, possessionUuid, setCurrentPossession, type StatkeeperPossessionSequence
} from '@/courtside/core/statkeeper-possession';
import type {StatkeeperSessionStatus} from '@/courtside/core/statkeeper-game-queue';

export type StatkeeperPossessionChange = {
  readonly kind: 'set_current'; readonly seasonTeamId: string; readonly mediaOffsetMs: number;
} | {
  readonly kind: 'replace_basis'; readonly mediaOffsetMs: number; readonly sequences: readonly StatkeeperPossessionSequence[];
};
export interface SetStatkeeperPossessionCommand {
  readonly type: 'set_statkeeper_possession';
  readonly commandId: string;
  /** Server-resolved identity, never a browser-supplied actor. */
  readonly actorAccountId: string;
  readonly captureSessionId: string;
  readonly expectedLedgerVersion: number;
  readonly change: StatkeeperPossessionChange;
  readonly reason?: string | null;
}
export interface SetStatkeeperPossessionResult {
  readonly operation: 'set_statkeeper_possession';
  readonly receiptReused: boolean;
  readonly captureSessionId: string;
  readonly basisId: string;
  readonly previousBasisId: string | null;
  readonly basisHash: string;
  readonly ledgerVersion: number;
  readonly lifecycleStatus: 'capturing' | 'in_review';
  readonly openSequence: StatkeeperPossessionSequence | null;
  readonly reviewInvalidated: true;
}
export interface StoredPossessionSession {
  readonly captureSessionId: string; readonly leagueId: string; readonly workingRevisionId: string;
  readonly homeSeasonTeamId: string; readonly awaySeasonTeamId: string;
  readonly lifecycleStatus: StatkeeperSessionStatus; readonly ledgerVersion: number;
  readonly basisId: string | null; readonly sequences: readonly StatkeeperPossessionSequence[];
}
export interface StatkeeperPossessionTransaction {
  lockCommand(commandId: string): Promise<void>;
  findReceipt(commandId: string): Promise<{commandType: string; payloadHash: string; result: SetStatkeeperPossessionResult} | null>;
  lockSession(captureSessionId: string): Promise<StoredPossessionSession | null>;
  hasCaptureAuthority(leagueId: string, actorAccountId: string): Promise<boolean>;
  persist(input: {
    session: StoredPossessionSession; sequences: readonly StatkeeperPossessionSequence[];
    basisId: string; command: SetStatkeeperPossessionCommand; payloadHash: string;
    result: SetStatkeeperPossessionResult; acceptedAt: Date;
  }): Promise<void>;
}
export interface StatkeeperPossessionStore {
  transaction<T>(work: (transaction: StatkeeperPossessionTransaction) => Promise<T>): Promise<T>;
}
export class StatkeeperPossessionRejected extends Error {
  constructor(message: string, readonly report: {
    entityType: 'CaptureSession'; entityId: string; currentStateOrCondition: string;
    requestedMutation: 'set_statkeeper_possession'; actorAccountId: string; violatedRule: string;
    authoritativeStatePreserved: true; currentLedgerVersion?: number;
  }) { super(message); this.name = 'StatkeeperPossessionRejected'; }
}

function normalizeCommand(raw: SetStatkeeperPossessionCommand): SetStatkeeperPossessionCommand {
  if (raw.type !== 'set_statkeeper_possession') throw new RuleViolation('statkeeper.possession.command', 'Unsupported possession command');
  if (!Number.isSafeInteger(raw.expectedLedgerVersion) || raw.expectedLedgerVersion < 1) {
    throw new RuleViolation('statkeeper.ledger.version', 'Expected ledger version must be a positive safe integer');
  }
  let change: StatkeeperPossessionChange;
  if (raw.change?.kind === 'set_current') {
    change = {kind: 'set_current', seasonTeamId: possessionUuid(raw.change.seasonTeamId, 'Possessing Team'), mediaOffsetMs: possessionOffset(raw.change.mediaOffsetMs)};
  } else if (raw.change?.kind === 'replace_basis') {
    change = {kind: 'replace_basis', mediaOffsetMs: possessionOffset(raw.change.mediaOffsetMs), sequences: normalizePossessionSequences(raw.change.sequences)};
  } else throw new RuleViolation('statkeeper.possession.change', 'Choose current possession or an explicit full-basis correction');
  if (raw.reason != null && typeof raw.reason !== 'string') throw new RuleViolation('statkeeper.possession.reason', 'Reason must be text or null');
  const reason = raw.reason?.trim().normalize('NFC') || null;
  if (reason && [...reason].length > 500) throw new RuleViolation('statkeeper.possession.reason', 'Reason must not exceed 500 Unicode scalar values');
  return {
    type: raw.type, commandId: possessionUuid(raw.commandId, 'Command'),
    actorAccountId: possessionUuid(raw.actorAccountId, 'Actor'),
    captureSessionId: possessionUuid(raw.captureSessionId, 'Capture Session'),
    expectedLedgerVersion: raw.expectedLedgerVersion, change, reason
  };
}

export function createStatkeeperPossessionService(store: StatkeeperPossessionStore, dependencies: {now?: () => Date; newId?: () => string} = {}) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;
  return async (raw: SetStatkeeperPossessionCommand): Promise<SetStatkeeperPossessionResult> => {
    let session: StoredPossessionSession | null = null;
    try {
      const command = normalizeCommand(raw);
      const payloadHash = statkeeperCanonicalHash({
        actor_account_id: command.actorAccountId, capture_session_id: command.captureSessionId,
        expected_ledger_version: command.expectedLedgerVersion, reason: command.reason,
        change: command.change.kind === 'set_current' ? command.change
          : {kind: 'replace_basis', mediaOffsetMs: command.change.mediaOffsetMs, sequences: possessionBasisValue(command.change.sequences)}
      });
      return await store.transaction(async (transaction) => {
        await transaction.lockCommand(command.commandId);
        const receipt = await transaction.findReceipt(command.commandId);
        if (receipt) {
          if (receipt.commandType !== 'statkeeper.possession_set' || receipt.payloadHash !== payloadHash) {
            throw new RuleViolation('command.idempotency', 'Command identity cannot be reused for different possession content');
          }
          return {...receipt.result, receiptReused: true};
        }
        const current = await transaction.lockSession(command.captureSessionId);
        if (!current) throw new RuleViolation('statkeeper.session.exists', 'Capture Session not found');
        // Do not include session details in a rejection until current authority has been checked.
        if (!await transaction.hasCaptureAuthority(current.leagueId, command.actorAccountId)) {
          throw new RuleViolation('authorization.statkeeper_or_league_admin_required', 'Active League Statkeeper or League Administrator authority is required');
        }
        session = current;
        if (!['capturing', 'in_review', 'verified'].includes(current.lifecycleStatus)) {
          throw new RuleViolation('statkeeper.session.editable_state', 'This Capture Session does not allow possession edits');
        }
        if (current.ledgerVersion !== command.expectedLedgerVersion) {
          throw new RuleViolation('statkeeper.ledger.stale_version', 'Capture Session changed; reload its current possession basis before retrying');
        }
        if (current.ledgerVersion === Number.MAX_SAFE_INTEGER) throw new RuleViolation('statkeeper.ledger.version', 'Ledger version cannot exceed the safe integer limit');
        const sequences = command.change.kind === 'set_current'
          ? setCurrentPossession({context: current, sequences: current.sequences, sequenceId: newId(), ...command.change})
          : correctPossessionBasis({context: current, previous: current.sequences, replacement: command.change.sequences});
        const result: SetStatkeeperPossessionResult = {
          operation: 'set_statkeeper_possession', receiptReused: false, captureSessionId: current.captureSessionId,
          basisId: possessionUuid(newId(), 'Possession basis'), previousBasisId: current.basisId,
          basisHash: possessionBasisHash(sequences), ledgerVersion: current.ledgerVersion + 1,
          lifecycleStatus: current.lifecycleStatus === 'capturing' ? 'capturing' : 'in_review',
          openSequence: sequences.find((sequence) => sequence.endMediaOffsetMs === null) ?? null,
          reviewInvalidated: true
        };
        await transaction.persist({session: current, sequences, basisId: result.basisId, command, payloadHash, result, acceptedAt: now()});
        return result;
      });
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      const current = session as StoredPossessionSession | null;
      throw new StatkeeperPossessionRejected(error.message, {
        entityType: 'CaptureSession', entityId: raw.captureSessionId,
        currentStateOrCondition: current?.lifecycleStatus ?? 'invalid or unauthorized possession request',
        requestedMutation: 'set_statkeeper_possession', actorAccountId: raw.actorAccountId,
        violatedRule: error.rule, authoritativeStatePreserved: true,
        ...(current ? {currentLedgerVersion: current.ledgerVersion} : {})
      });
    }
  };
}
