import {describe, expect, it} from 'vitest';

import {
  applyPreFreezeStandingsConfiguration,
  normalizeEditableStandingsInput,
  readEditableSeasonConfiguration
} from '@/courtside/core/pre-freeze-season-configuration';
import {createDefaultSeasonResultConfiguration} from '@/courtside/core/season-setup';
import {
  createSeasonConfigurationService,
  type SeasonConfigurationStore,
  type SeasonConfigurationTransaction,
  type StoredMutableSeasonConfiguration,
  type StoredSeasonConfigurationReceipt,
  type UpdateSeasonConfigurationResult
} from '@/courtside/services/update-season-configuration';

class MemorySeasonConfigurationStore
implements SeasonConfigurationStore, SeasonConfigurationTransaction {
  authorized = true;
  season: StoredMutableSeasonConfiguration | null = {
    id: 'season-1',
    leagueId: 'league-1',
    resultConfiguration: createDefaultSeasonResultConfiguration(),
    frozenConfigurationVersionId: null
  };
  readonly audits: {id: string; previousValue: unknown; newValue: unknown}[] = [];
  readonly receipts = new Map<string, StoredSeasonConfigurationReceipt>();

  async transaction<T>(work: (transaction: SeasonConfigurationTransaction) => Promise<T>) {
    return work(this);
  }

  async lockCommand() {}

  async findCommandReceipt(commandId: string) {
    return this.receipts.get(commandId) ?? null;
  }

  async findSeasonForUpdate(seasonId: string) {
    return this.season?.id === seasonId ? this.season : null;
  }

  async hasActiveLeagueAdministrator() {
    return this.authorized;
  }

  async updateResultConfiguration(_seasonId: string, resultConfiguration: unknown) {
    if (!this.season) throw new Error('Season missing');
    this.season = {...this.season, resultConfiguration};
  }

  async appendAuditRecord(input: {
    id: string;
    previousValue: unknown;
    newValue: unknown;
  }) {
    this.audits.push(input);
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: UpdateSeasonConfigurationResult;
  }) {
    this.receipts.set(input.commandId, input);
  }
}

const ranking = [
  'point_differential',
  'league_points',
  'points_scored',
  'random_draw'
] as const;

describe('pre-freeze Season configuration core', () => {
  it('changes only editable standings values and preserves all other accepted rules', () => {
    const current = {
      ...createDefaultSeasonResultConfiguration(),
      custom_future_rule: {enabled: true},
      standings: {
        ...createDefaultSeasonResultConfiguration().standings,
        future_standings_rule: 'preserve-me'
      },
      playoffs: {
        rounds: [{id: 'final', games_per_matchup: 2}],
        future_playoff_rule: 'preserve-me'
      }
    };

    const next = applyPreFreezeStandingsConfiguration(current, {
      winPoints: 3,
      lossPoints: 1,
      ranking
    });

    expect(next).toEqual({
      ...current,
      standings: {
        ...current.standings,
        points: {win: 3, loss: 1},
        ranking: [...ranking]
      }
    });
    expect(readEditableSeasonConfiguration(next)).toMatchObject({
      winPoints: 3,
      lossPoints: 1,
      ranking: [...ranking],
      playoffRoundCount: 1
    });
  });

  it('rejects unsafe points and anything other than the exact supported ranking permutation', () => {
    expect(() => normalizeEditableStandingsInput({
      winPoints: -1,
      lossPoints: 0,
      ranking
    })).toThrow(/nonnegative safe integers/);
    expect(() => normalizeEditableStandingsInput({
      winPoints: 1,
      lossPoints: 1,
      ranking
    })).toThrow(/more League Points/);
    expect(() => normalizeEditableStandingsInput({
      winPoints: 2,
      lossPoints: 0,
      ranking: ['league_points', 'league_points', 'points_scored', 'random_draw']
    })).toThrow(/every supported score criterion once/);
    expect(() => normalizeEditableStandingsInput({
      winPoints: 2,
      lossPoints: 0,
      ranking: ['league_points', 'point_differential', 'random_draw', 'points_scored']
    })).toThrow(/followed by random_draw/);
  });
});

describe('pre-freeze Season configuration service', () => {
  it('accepts one audited change and reuses its command receipt', async () => {
    const store = new MemorySeasonConfigurationStore();
    const update = createSeasonConfigurationService(store, {
      now: () => new Date('2026-08-16T07:00:00Z'),
      newId: () => 'audit-1'
    });
    const command = {
      commandId: 'command-1',
      actorAccountId: 'admin-1',
      seasonId: 'season-1',
      winPoints: 3,
      lossPoints: 1,
      ranking
    };

    const first = await update(command);
    expect(first).toMatchObject({
      receiptReused: false,
      seasonId: 'season-1',
      configuration: {winPoints: 3, lossPoints: 1, ranking: [...ranking]},
      auditRecordId: 'audit-1'
    });
    expect(store.audits).toHaveLength(1);
    await expect(update(command)).resolves.toEqual({...first, receiptReused: true});
    expect(store.audits).toHaveLength(1);
  });

  it('rejects unauthorized, unchanged, and frozen updates without authoritative mutation', async () => {
    const store = new MemorySeasonConfigurationStore();
    const update = createSeasonConfigurationService(store, {newId: () => 'audit-unused'});
    const command = {
      commandId: 'command-rejected',
      actorAccountId: 'admin-1',
      seasonId: 'season-1',
      winPoints: 3,
      lossPoints: 1,
      ranking
    };
    const original = store.season?.resultConfiguration;

    store.authorized = false;
    await expect(update(command)).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });
    expect(store.season?.resultConfiguration).toBe(original);

    store.authorized = true;
    await expect(update({
      ...command,
      commandId: 'command-unchanged',
      winPoints: 2,
      lossPoints: 0,
      ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw']
    })).rejects.toMatchObject({
      report: {violatedRule: 'season.configuration_change_required'}
    });
    expect(store.season?.resultConfiguration).toBe(original);

    store.season = {...store.season!, frozenConfigurationVersionId: 'version-1'};
    await expect(update({...command, commandId: 'command-frozen'})).rejects.toMatchObject({
      report: {violatedRule: 'season.configuration_mutable_required'}
    });
    expect(store.season.resultConfiguration).toBe(original);
    expect(store.audits).toHaveLength(0);
    expect(store.receipts).toHaveLength(0);
  });
});
