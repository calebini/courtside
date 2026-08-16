import {describe, expect, it} from 'vitest';

import {
  createDefaultSeasonResultConfiguration,
  normalizeSeasonName
} from '@/courtside/core/season-setup';
import {
  createSeasonService,
  type CreateSeasonResult,
  type CreateSeasonStore,
  type CreateSeasonTransaction,
  type StoredCreateSeasonReceipt
} from '@/courtside/services/create-season';

class MemoryCreateSeasonStore implements CreateSeasonStore, CreateSeasonTransaction {
  authorized = true;
  readonly seasons: {id: string; leagueId: string; name: string; resultConfiguration: unknown}[] = [];
  readonly audits: {id: string}[] = [];
  readonly receipts = new Map<string, StoredCreateSeasonReceipt>();

  async transaction<T>(work: (transaction: CreateSeasonTransaction) => Promise<T>) {
    return work(this);
  }

  async lockCommand() {}

  async findCommandReceipt(commandId: string) {
    return this.receipts.get(commandId) ?? null;
  }

  async findLeagueForUpdate(leagueId: string) {
    return leagueId === 'league-1' ? {id: leagueId} : null;
  }

  async hasActiveLeagueAdministrator() {
    return this.authorized;
  }

  async findSeasonByName(leagueId: string, name: string) {
    return this.seasons.find(
      (season) => season.leagueId === leagueId && season.name.toLowerCase() === name.toLowerCase()
    ) ?? null;
  }

  async insertSeason(input: {
    id: string;
    leagueId: string;
    name: string;
    resultConfiguration: unknown;
  }) {
    this.seasons.push(input);
  }

  async appendAuditRecord(input: {id: string}) {
    this.audits.push(input);
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: CreateSeasonResult;
  }) {
    this.receipts.set(input.commandId, input);
  }
}

describe('Season setup core', () => {
  it('normalizes names and installs only accepted default rules', () => {
    expect(normalizeSeasonName('  2026   Season ')).toBe('2026 Season');
    expect(createDefaultSeasonResultConfiguration()).toEqual({
      standings: {
        points: {win: 2, loss: 0},
        ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw'],
        eligible_phases: ['regular'],
        eligible_statuses: ['final', 'forfeit'],
        adjustments_enabled: false,
        forfeit_treatment: 'explicit_score'
      },
      playoffs: {rounds: []}
    });
    expect(() => normalizeSeasonName('x')).toThrow(/between 2 and 120/);
  });
});

describe('Season creation service', () => {
  it('creates one audited Season and reuses an identical command', async () => {
    const store = new MemoryCreateSeasonStore();
    const ids = ['season-1', 'audit-1'];
    const createSeason = createSeasonService(store, {
      now: () => new Date('2026-08-16T04:00:00Z'),
      newId: () => ids.shift()!
    });
    const command = {
      commandId: 'command-1',
      actorAccountId: 'admin-1',
      leagueId: 'league-1',
      name: ' 2026  Season '
    };

    const first = await createSeason(command);
    expect(first).toMatchObject({
      receiptReused: false,
      season: {id: 'season-1', leagueId: 'league-1', name: '2026 Season'},
      auditRecordId: 'audit-1'
    });
    expect(store.seasons).toHaveLength(1);
    expect(store.audits).toHaveLength(1);

    await expect(createSeason(command)).resolves.toEqual({...first, receiptReused: true});
    expect(store.seasons).toHaveLength(1);
    expect(store.audits).toHaveLength(1);
  });

  it('rejects missing authority and a case-insensitive duplicate', async () => {
    const store = new MemoryCreateSeasonStore();
    const createSeason = createSeasonService(store, {newId: () => 'generated-id'});
    store.authorized = false;
    await expect(createSeason({
      commandId: 'command-unauthorized',
      actorAccountId: 'outsider-1',
      leagueId: 'league-1',
      name: '2026 Season'
    })).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });

    store.authorized = true;
    store.seasons.push({
      id: 'season-existing',
      leagueId: 'league-1',
      name: '2026 Season',
      resultConfiguration: {}
    });
    await expect(createSeason({
      commandId: 'command-duplicate',
      actorAccountId: 'admin-1',
      leagueId: 'league-1',
      name: '2026 SEASON'
    })).rejects.toMatchObject({
      report: {violatedRule: 'season.name_unique_per_league'}
    });
  });
});
