import {describe, expect, it} from 'vitest';

import type {StatkeeperOccurrenceLedgerRecord} from '@/courtside/core/statkeeper-event-ledger';
import {
  createStatkeeperEventLedgerService,
  StatkeeperLedgerRecordRejected,
  type RecordStatkeeperLedgerOccurrenceCommand,
  type RecordStatkeeperLedgerOccurrenceResult,
  type StatkeeperEventLedgerStore,
  type StatkeeperEventLedgerTransaction,
  type StoredStatkeeperLedgerHead,
  type StoredStatkeeperLedgerReceipt,
  type StoredStatkeeperOccurrence
} from '@/courtside/services/record-statkeeper-event';

const ids = {
  session: 'c1000000-0000-4000-8000-000000000001',
  game: 'c1000000-0000-4000-8000-000000000002',
  profile: 'c1000000-0000-4000-8000-000000000003',
  media: 'c1000000-0000-4000-8000-000000000004',
  homeTeam: 'c1000000-0000-4000-8000-000000000005',
  awayTeam: 'c1000000-0000-4000-8000-000000000006',
  player: 'c1000000-0000-4000-8000-000000000007',
  membership: 'c1000000-0000-4000-8000-000000000008',
  actor: 'c1000000-0000-4000-8000-000000000009',
  occurrence: 'c1000000-0000-4000-8000-000000000010'
};

function head(): StoredStatkeeperLedgerHead {
  return {
    captureSessionId: ids.session,
    gameId: ids.game,
    gameStatus: 'final',
    competitionEligibilityAt: new Date('2026-08-30T18:00:00Z'),
    profileVersionId: ids.profile,
    profileContentHash: 'b'.repeat(64),
    mediaId: ids.media,
    homeSeasonTeamId: ids.homeTeam,
    awaySeasonTeamId: ids.awayTeam,
    regulationPeriodCount: 4,
    regulationPeriodDurationMs: 600_000,
    overtimePeriodDurationMs: 300_000,
    eventDefinitions: [{
      eventKey: 'shot',
      participantRoleKeys: ['shooter'],
      outcomes: [{
        outcomeKey: 'made_two',
        contributions: [{statKey: 'points', increment: 2}]
      }]
    }],
    ledgerVersion: 1
  };
}

function command(commandId: string, occurrenceId = ids.occurrence): RecordStatkeeperLedgerOccurrenceCommand {
  return {
    type: 'record_statkeeper_ledger_occurrence',
    commandId,
    actorAccountId: ids.actor,
    captureSessionId: ids.session,
    expectedLedgerVersion: 1,
    occurrence: {
      occurrenceId,
      evidenceTimestampMs: 42_000,
      evidenceWindow: null,
      period: {kind: 'regulation', ordinal: 1},
      clock: {state: 'exact', remainingMs: 558_000},
      events: [{
        eventKey: 'shot',
        outcomeKey: 'made_two',
        seasonTeamId: ids.homeTeam,
        assignments: [{roleKey: 'shooter', rosterMembershipId: ids.membership}]
      }],
      operatorNote: null
    }
  };
}

class MemoryStore implements StatkeeperEventLedgerStore, StatkeeperEventLedgerTransaction {
  currentHead = head();
  readonly receipts = new Map<string, StoredStatkeeperLedgerReceipt>();
  readonly occurrences = new Map<string, StoredStatkeeperOccurrence>();
  actorExists = true;

  async transaction<T>(work: (transaction: StatkeeperEventLedgerTransaction) => Promise<T>) {
    return work(this);
  }

  async lockCommand() {}

  async findCommandReceipt(commandId: string) {
    return this.receipts.get(commandId) ?? null;
  }

  async findLedgerHeadForUpdate(captureSessionId: string) {
    return captureSessionId === this.currentHead.captureSessionId ? this.currentHead : null;
  }

  async hasUserAccount() {
    return this.actorExists;
  }

  async listParticipants() {
    return [{
      rosterMembershipId: ids.membership,
      playerId: ids.player,
      seasonTeamId: ids.homeTeam,
      participationStatus: 'appeared' as const
    }];
  }

  async findOccurrence(captureSessionId: string, occurrenceId: string) {
    return this.occurrences.get(`${captureSessionId}:${occurrenceId}`) ?? null;
  }

  async advanceLedgerVersion(_captureSessionId: string, expectedVersion: number) {
    if (this.currentHead.ledgerVersion !== expectedVersion) throw new Error('concurrent write');
    const next = expectedVersion + 1;
    this.currentHead = {...this.currentHead, ledgerVersion: next};
    return next;
  }

  async appendOccurrence(input: {
    record: StatkeeperOccurrenceLedgerRecord;
    context: StoredStatkeeperLedgerHead;
    actorAccountId: string;
    acceptedLedgerVersion: number;
    createdAt: Date;
  }) {
    this.occurrences.set(`${input.context.captureSessionId}:${input.record.occurrenceId}`, {
      occurrenceId: input.record.occurrenceId,
      occurrenceRevisionId: input.record.occurrenceRevisionId,
      contentHash: input.record.contentHash,
      eventIds: input.record.events.map((event) => event.id),
      acceptedLedgerVersion: input.acceptedLedgerVersion
    });
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: RecordStatkeeperLedgerOccurrenceResult;
    createdAt: Date;
  }) {
    this.receipts.set(input.commandId, {
      commandType: input.commandType,
      payloadHash: input.payloadHash,
      result: input.result
    });
  }
}

describe('Statkeeper event ledger service', () => {
  it('records one atomic occurrence and reuses its command receipt', async () => {
    const store = new MemoryStore();
    const record = createStatkeeperEventLedgerService(store, {
      now: () => new Date('2026-08-30T20:00:00Z')
    });
    const submitted = command('c2000000-0000-4000-8000-000000000001');

    const accepted = await record(submitted);
    expect(accepted).toMatchObject({
      receiptReused: false,
      occurrenceReused: false,
      ledgerVersion: 2,
      occurrenceId: ids.occurrence
    });
    await expect(record(submitted)).resolves.toEqual({...accepted, receiptReused: true});
    expect(store.currentHead.ledgerVersion).toBe(2);
    expect(store.occurrences.size).toBe(1);
  });

  it('returns identical occurrence content without duplicating or advancing the ledger', async () => {
    const store = new MemoryStore();
    const record = createStatkeeperEventLedgerService(store);
    const first = await record(command('c2000000-0000-4000-8000-000000000011'));
    const duplicate = await record(command('c2000000-0000-4000-8000-000000000012'));

    expect(duplicate).toEqual({...first, occurrenceReused: true});
    expect(store.currentHead.ledgerVersion).toBe(2);
    expect(store.occurrences.size).toBe(1);
  });

  it('rejects stale writes and changed reuse while preserving accepted state', async () => {
    const store = new MemoryStore();
    const record = createStatkeeperEventLedgerService(store);
    await record(command('c2000000-0000-4000-8000-000000000021'));

    const original = command('c2000000-0000-4000-8000-000000000022');
    const changed = {
      ...original,
      occurrence: {...original.occurrence, evidenceTimestampMs: 43_000}
    };
    await expect(record(changed)).rejects.toMatchObject({
      report: {violatedRule: 'statkeeper.occurrence.identity', authoritativeStatePreserved: true}
    });
    await expect(record(command(
      'c2000000-0000-4000-8000-000000000023',
      'c1000000-0000-4000-8000-000000000099'
    ))).rejects.toBeInstanceOf(StatkeeperLedgerRecordRejected);
    expect(store.currentHead.ledgerVersion).toBe(2);
    expect(store.occurrences.size).toBe(1);
  });
});
