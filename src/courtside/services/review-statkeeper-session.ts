import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import {normalizeStatkeeperCoverage, statkeeperCoverageValue, type StatkeeperCoverageDeclaration} from '@/courtside/core/statkeeper-coverage';
import {projectStatkeeperRevision, type StatkeeperProjectionBasis} from '@/courtside/core/statkeeper-projection';

export type ReviewStatkeeperCommand = {
  readonly type: 'submit_statkeeper_for_review' | 'replace_statkeeper_coverage';
  readonly commandId: string;
  /** Trusted server identity; the browser binding must resolve this from its verified session. */
  readonly actorAccountId: string;
  readonly captureSessionId: string;
  readonly expectedLedgerVersion: number;
} & ({readonly type: 'submit_statkeeper_for_review'} | {
  readonly type: 'replace_statkeeper_coverage'; readonly declarations: readonly StatkeeperCoverageDeclaration[];
});
export interface StatkeeperReviewSession {
  readonly leagueId: string;
  readonly lifecycleStatus: 'capturing' | 'in_review' | 'verified' | 'published' | 'abandoned';
  readonly basis: StatkeeperProjectionBasis;
}
export interface StatkeeperReviewResult {
  readonly operation: ReviewStatkeeperCommand['type'];
  readonly captureSessionId: string;
  readonly ledgerVersion: number;
  readonly lifecycleStatus: 'in_review';
  readonly coverageBasisId: string | null;
  readonly coverageHash: string | null;
  readonly receiptReused: boolean;
}
export interface StatkeeperReviewTransaction {
  lockCommand(commandId: string): Promise<void>;
  findReceipt(commandId: string): Promise<{commandType: string; payloadHash: string; result: StatkeeperReviewResult} | null>;
  loadSession(captureSessionId: string): Promise<StatkeeperReviewSession | null>;
  hasAuthority(leagueId: string, actorAccountId: string): Promise<boolean>;
  persist(input: {
    session: StatkeeperReviewSession; command: ReviewStatkeeperCommand; payloadHash: string;
    declarations: readonly StatkeeperCoverageDeclaration[] | null; result: StatkeeperReviewResult;
    acceptedAt: Date; auditId: string;
  }): Promise<void>;
}
export interface StatkeeperReviewStore {
  transaction<T>(work: (transaction: StatkeeperReviewTransaction) => Promise<T>, options: {readonly readOnly: boolean}): Promise<T>;
}

export class StatkeeperReviewRejected extends Error {
  constructor(message: string, readonly report: {
    entityType: 'CaptureSession' | 'CommandReceipt'; entityId: string; currentStateOrCondition: string;
    requestedMutation: string; actorAccountId: string; violatedRule: string; authoritativeStatePreserved: true;
    currentLedgerVersion?: number;
  }) { super(message); this.name = 'StatkeeperReviewRejected'; }
}
function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new RuleViolation('statkeeper.review.identity', 'Review identities must be UUIDs');
  }
  return value.toLowerCase();
}
function reject(error: unknown, request: {captureSessionId: string; actorAccountId: string; type: string; commandId?: string}, session: StatkeeperReviewSession | null): never {
  if (!(error instanceof RuleViolation)) throw error;
  throw new StatkeeperReviewRejected(error.message, {
    entityType: error.rule === 'command.idempotency' ? 'CommandReceipt' : 'CaptureSession',
    entityId: error.rule === 'command.idempotency' ? request.commandId! : request.captureSessionId,
    currentStateOrCondition: session?.lifecycleStatus ?? 'invalid or unauthorized review request',
    requestedMutation: request.type, actorAccountId: request.actorAccountId, violatedRule: error.rule,
    authoritativeStatePreserved: true, ...(session ? {currentLedgerVersion: session.basis.context.ledgerVersion} : {})
  });
}

export function createStatkeeperReviewService(store: StatkeeperReviewStore, dependencies: {now?: () => Date; newId?: () => string} = {}) {
  const now = dependencies.now ?? (() => new Date()), newId = dependencies.newId ?? randomUUID;
  return async (raw: ReviewStatkeeperCommand): Promise<StatkeeperReviewResult> => {
    let authorizedSession: StatkeeperReviewSession | null = null;
    try {
      if (!['submit_statkeeper_for_review', 'replace_statkeeper_coverage'].includes(raw.type)) {
        throw new RuleViolation('statkeeper.review.command', 'Unsupported review command');
      }
      if (!Number.isSafeInteger(raw.expectedLedgerVersion) || raw.expectedLedgerVersion < 1) {
        throw new RuleViolation('statkeeper.ledger.version', 'Expected ledger version must be a positive safe integer');
      }
      const command: ReviewStatkeeperCommand = {...raw, commandId: uuid(raw.commandId),
        captureSessionId: uuid(raw.captureSessionId), actorAccountId: uuid(raw.actorAccountId)};
      return await store.transaction(async (transaction) => {
        await transaction.lockCommand(command.commandId);
        const session = await transaction.loadSession(command.captureSessionId);
        if (!session) throw new RuleViolation('statkeeper.session.exists', 'Capture Session not found');
        const declarations = command.type === 'replace_statkeeper_coverage'
          ? normalizeStatkeeperCoverage(command.declarations, session.basis.profile) : null;
        const payloadHash = statkeeperCanonicalHash({operation: command.type, actor_account_id: command.actorAccountId,
          capture_session_id: command.captureSessionId, expected_ledger_version: command.expectedLedgerVersion,
          declarations: declarations ? statkeeperCoverageValue(declarations) : null});
        const receipt = await transaction.findReceipt(command.commandId);
        if (receipt) {
          if (receipt.commandType !== command.type || receipt.payloadHash !== payloadHash) {
            throw new RuleViolation('command.idempotency', 'Command identity cannot be reused for different review content');
          }
          return {...receipt.result, receiptReused: true};
        }
        if (!await transaction.hasAuthority(session.leagueId, command.actorAccountId)) {
          throw new RuleViolation('authorization.statkeeper_or_league_admin_required', 'Active League Statkeeper or League Administrator authority is required');
        }
        authorizedSession = session;
        if (session.basis.context.ledgerVersion !== command.expectedLedgerVersion) {
          throw new RuleViolation('statkeeper.ledger.stale_version', 'Capture Session changed; reload before reviewing');
        }
        if (command.expectedLedgerVersion === Number.MAX_SAFE_INTEGER) {
          throw new RuleViolation('statkeeper.ledger.version', 'Ledger version cannot exceed the safe integer limit');
        }
        if (command.type === 'submit_statkeeper_for_review') {
          if (session.lifecycleStatus !== 'capturing') throw new RuleViolation('statkeeper.review.state', 'Only capturing sessions may be submitted for review');
          const preview = projectStatkeeperRevision(session.basis);
          if (!preview.activeOccurrenceCount) throw new RuleViolation('statkeeper.review.active_occurrence_required', 'Review requires at least one active occurrence');
        } else {
          if (session.lifecycleStatus !== 'in_review') throw new RuleViolation('statkeeper.review.state', 'Coverage can only be declared in review');
          if (session.basis.coverage.reviewedLedgerVersion === command.expectedLedgerVersion
            && statkeeperCanonicalHash(statkeeperCoverageValue(session.basis.coverage.declarations))
              === statkeeperCanonicalHash(statkeeperCoverageValue(declarations!))) {
            throw new RuleViolation('statkeeper.coverage.no_change', 'Current coverage already matches; stale coverage may be reaffirmed');
          }
        }
        const result: StatkeeperReviewResult = {operation: command.type, captureSessionId: command.captureSessionId,
          ledgerVersion: command.expectedLedgerVersion + 1, lifecycleStatus: 'in_review', receiptReused: false,
          coverageBasisId: declarations ? uuid(newId()) : null,
          coverageHash: declarations ? statkeeperCanonicalHash(statkeeperCoverageValue(declarations)) : null};
        await transaction.persist({session, command, payloadHash, declarations, result, acceptedAt: now(), auditId: uuid(newId())});
        return result;
      }, {readOnly: false});
    } catch (error) { reject(error, raw, authorizedSession); }
  };
}

export function createStatkeeperProjectionPreviewService(store: StatkeeperReviewStore) {
  return async (request: {captureSessionId: string; actorAccountId: string}) => {
    let authorizedSession: StatkeeperReviewSession | null = null;
    try {
      const captureSessionId = uuid(request.captureSessionId), actorAccountId = uuid(request.actorAccountId);
      return await store.transaction(async (transaction) => {
        const session = await transaction.loadSession(captureSessionId);
        if (!session) throw new RuleViolation('statkeeper.session.exists', 'Capture Session not found');
        if (!await transaction.hasAuthority(session.leagueId, actorAccountId)) {
          throw new RuleViolation('authorization.statkeeper_or_league_admin_required', 'Active League Statkeeper or League Administrator authority is required');
        }
        authorizedSession = session;
        return {...projectStatkeeperRevision(session.basis), captureSessionId, lifecycleStatus: session.lifecycleStatus};
      }, {readOnly: true});
    } catch (error) { reject(error, {...request, type: 'preview_statkeeper_projection'}, authorizedSession); }
  };
}
