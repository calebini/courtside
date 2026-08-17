import {describe, expect, it} from 'vitest';

import {
  createDeleteSeasonService,
  type DeleteSeasonResult,
  type DeleteSeasonStore,
  type DeleteSeasonTransaction,
  type SeasonDependency,
  type StoredDeletableSeason,
  type StoredDeleteSeasonReceipt
} from '@/courtside/services/delete-season';

class MemoryDeleteSeasonStore implements DeleteSeasonStore, DeleteSeasonTransaction {
  authorized = true;
  season: StoredDeletableSeason | null = {
    id: 'season-1',
    leagueId: 'league-1',
    name: 'Accidental Season',
    resultConfiguration: {standings: {points: {win: 2, loss: 0}}},
    frozenConfigurationVersionId: null,
    createdAt: new Date('2026-08-17T10:00:00Z')
  };
  dependencies: SeasonDependency[] = [];
  readonly audits: Array<{
    id: string;
    action: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
  }> = [];
  readonly receipts = new Map<string, StoredDeleteSeasonReceipt>();

  async transaction<T>(work: (transaction: DeleteSeasonTransaction) => Promise<T>) {
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

  async listDependencies() {
    return this.dependencies;
  }

  async appendAuditRecord(input: {
    id: string;
    action: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
  }) {
    this.audits.push(input);
  }

  async deleteSeason(seasonId: string) {
    if (this.season?.id !== seasonId) throw new Error('Season missing');
    this.season = null;
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: DeleteSeasonResult;
  }) {
    this.receipts.set(input.commandId, input);
  }
}

describe('Unused Season deletion service', () => {
  it('deletes one confirmed unused Season with audit and idempotent retry', async () => {
    const store = new MemoryDeleteSeasonStore();
    const deleteSeason = createDeleteSeasonService(store, {
      now: () => new Date('2026-08-17T11:00:00Z'),
      newId: () => 'audit-1'
    });
    const command = {
      commandId: 'command-1',
      actorAccountId: 'admin-1',
      seasonId: 'season-1',
      confirmationName: 'Accidental Season',
      reason: '  Created twice  '
    };

    const first = await deleteSeason(command);
    expect(first).toEqual({
      receiptReused: false,
      deletedSeason: {
        id: 'season-1',
        leagueId: 'league-1',
        name: 'Accidental Season'
      },
      auditRecordId: 'audit-1'
    });
    expect(store.season).toBeNull();
    expect(store.audits).toEqual([
      expect.objectContaining({
        id: 'audit-1',
        action: 'season.deleted',
        newValue: null,
        reason: 'Created twice',
        previousValue: expect.objectContaining({
          id: 'season-1',
          league_id: 'league-1',
          name: 'Accidental Season'
        })
      })
    ]);

    await expect(deleteSeason({...command, reason: 'Created twice'}))
      .resolves.toEqual({...first, receiptReused: true});
    expect(store.audits).toHaveLength(1);

    await expect(deleteSeason({...command, reason: 'Different reason'})).rejects.toMatchObject({
      report: {violatedRule: 'command.idempotency_identity'}
    });
  });

  it('rejects authority, confirmation, and dependency failures without mutation', async () => {
    const store = new MemoryDeleteSeasonStore();
    const deleteSeason = createDeleteSeasonService(store, {newId: () => 'unused'});
    const command = {
      commandId: 'command-base',
      actorAccountId: 'admin-1',
      seasonId: 'season-1',
      confirmationName: 'Accidental Season',
      reason: null
    };

    store.authorized = false;
    await expect(deleteSeason({...command, commandId: 'command-authority'})).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });

    store.authorized = true;
    await expect(deleteSeason({
      ...command,
      commandId: 'command-confirmation',
      confirmationName: 'accidental season'
    })).rejects.toMatchObject({
      report: {violatedRule: 'season.deletion_name_confirmation'}
    });

    store.dependencies = ['season_team'];
    await expect(deleteSeason({...command, commandId: 'command-dependency'})).rejects.toMatchObject({
      report: {
        violatedRule: 'season.deletion_unused_only',
        currentStateOrCondition: expect.stringContaining('season_team')
      }
    });

    expect(store.season?.id).toBe('season-1');
    expect(store.audits).toHaveLength(0);
    expect(store.receipts.size).toBe(0);
  });
});
