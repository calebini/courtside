import {describe, expect, it} from 'vitest';

import {normalizeTeamName, normalizeTeamNameBatch} from '@/courtside/core/team-setup';
import {
  createSeasonTeamService,
  type SeasonTeamResult,
  type SeasonTeamStore,
  type SeasonTeamTransaction,
  type StoredLeagueTeam,
  type StoredSeasonTeamReceipt
} from '@/courtside/services/manage-season-teams';

class MemorySeasonTeamStore implements SeasonTeamStore, SeasonTeamTransaction {
  authorized = true;
  blocked = false;
  readonly teams: Array<StoredLeagueTeam & {leagueId: string}> = [];
  readonly participations: Array<{id: string; seasonId: string; teamId: string}> = [];
  readonly audits: Array<{id: string; action: string}> = [];
  readonly receipts = new Map<string, StoredSeasonTeamReceipt>();

  async transaction<T>(work: (transaction: SeasonTeamTransaction) => Promise<T>) {
    return work(this);
  }

  async lockCommand() {}

  async findCommandReceipt(commandId: string) {
    return this.receipts.get(commandId) ?? null;
  }

  async findSeasonForUpdate(seasonId: string) {
    return seasonId === 'season-1' ? {id: seasonId, leagueId: 'league-1'} : null;
  }

  async findSeasonTeamForUpdate(seasonTeamId: string) {
    const participation = this.participations.find((item) => item.id === seasonTeamId);
    const team = participation
      ? this.teams.find((item) => item.id === participation.teamId)
      : null;
    return participation && team
      ? {
          id: participation.id,
          seasonId: participation.seasonId,
          leagueId: team.leagueId,
          teamId: team.id,
          name: team.name
        }
      : null;
  }

  async hasActiveLeagueAdministrator() {
    return this.authorized;
  }

  async findLeagueTeamsByNames(leagueId: string, names: readonly string[]) {
    const identities = new Set(names.map((name) => name.toLowerCase()));
    return this.teams.filter(
      (team) => team.leagueId === leagueId && identities.has(team.name.toLowerCase())
    );
  }

  async findSeasonParticipations(seasonId: string, teamIds: readonly string[]) {
    const accepted = new Set(teamIds);
    return new Map(
      this.participations
        .filter((item) => item.seasonId === seasonId && accepted.has(item.teamId))
        .map((item) => [item.teamId, item.id])
    );
  }

  async insertTeam(input: {id: string; leagueId: string; name: string}) {
    this.teams.push(input);
  }

  async insertSeasonTeam(input: {id: string; seasonId: string; teamId: string}) {
    this.participations.push(input);
  }

  async hasSeasonTeamDependencies() {
    return this.blocked;
  }

  async deleteSeasonTeam(seasonTeamId: string) {
    const index = this.participations.findIndex((item) => item.id === seasonTeamId);
    if (index >= 0) {
      this.participations.splice(index, 1);
    }
  }

  async appendAuditRecord(input: {id: string; action: string}) {
    this.audits.push(input);
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: SeasonTeamResult;
  }) {
    this.receipts.set(input.commandId, input);
  }
}

describe('Team setup core', () => {
  it('normalizes, ignores blank lines, and deduplicates names case-insensitively', () => {
    expect(normalizeTeamName('  Left   Bank Hoops ')).toBe('Left Bank Hoops');
    expect(normalizeTeamNameBatch([
      ' Left Bank Hoops ',
      '',
      'left bank hoops',
      'Canal Street'
    ])).toEqual(['Left Bank Hoops', 'Canal Street']);
    expect(() => normalizeTeamName('x')).toThrow(/2 through 120/);
    expect(() => normalizeTeamNameBatch([' ', '\n'])).toThrow(/at least one/);
  });
});

describe('Season Team management service', () => {
  it('creates missing Teams and participations, then reuses an identical command', async () => {
    const store = new MemorySeasonTeamStore();
    store.teams.push({id: 'team-existing', leagueId: 'league-1', name: 'Canal Street'});
    const ids = ['team-new', 'audit-team', 'season-team-existing', 'audit-existing', 'season-team-new', 'audit-new'];
    const manage = createSeasonTeamService(store, {
      now: () => new Date('2026-08-16T05:00:00Z'),
      newId: () => ids.shift()!
    });
    const command = {
      type: 'add_teams' as const,
      commandId: 'command-add',
      actorAccountId: 'admin-1',
      seasonId: 'season-1',
      names: ['Canal Street', 'Belleville Ballers', 'belleville ballers']
    };

    const first = await manage(command);
    expect(first.teams).toEqual([
      {
        seasonTeamId: 'season-team-existing',
        teamId: 'team-existing',
        name: 'Canal Street',
        teamCreated: false,
        participationCreated: true
      },
      {
        seasonTeamId: 'season-team-new',
        teamId: 'team-new',
        name: 'Belleville Ballers',
        teamCreated: true,
        participationCreated: true
      }
    ]);
    expect(store.teams).toHaveLength(2);
    expect(store.participations).toHaveLength(2);
    expect(store.audits.map((audit) => audit.action)).toEqual([
      'team.created',
      'season_team.added',
      'season_team.added'
    ]);

    await expect(manage(command)).resolves.toEqual({...first, receiptReused: true});
    expect(store.teams).toHaveLength(2);
    expect(store.participations).toHaveLength(2);
  });

  it('rejects unauthorized addition without mutation', async () => {
    const store = new MemorySeasonTeamStore();
    store.authorized = false;
    const manage = createSeasonTeamService(store);

    await expect(manage({
      type: 'add_teams',
      commandId: 'command-no-access',
      actorAccountId: 'outsider-1',
      seasonId: 'season-1',
      names: ['Canal Street']
    })).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });
    expect(store.teams).toHaveLength(0);
  });

  it('removes only dependency-free participation and preserves the durable Team', async () => {
    const store = new MemorySeasonTeamStore();
    store.teams.push({id: 'team-1', leagueId: 'league-1', name: 'Canal Street'});
    store.participations.push({id: 'season-team-1', seasonId: 'season-1', teamId: 'team-1'});
    const manage = createSeasonTeamService(store, {newId: () => 'audit-remove'});
    const command = {
      type: 'remove_team' as const,
      commandId: 'command-remove',
      actorAccountId: 'admin-1',
      seasonTeamId: 'season-team-1'
    };

    store.blocked = true;
    await expect(manage(command)).rejects.toMatchObject({
      report: {violatedRule: 'season_team.removal_without_dependencies'}
    });
    expect(store.participations).toHaveLength(1);

    store.blocked = false;
    const result = await manage(command);
    expect(result.operation).toBe('remove_team');
    expect(store.participations).toHaveLength(0);
    expect(store.teams).toHaveLength(1);
    expect(store.audits.map(({id, action}) => ({id, action}))).toEqual([
      {id: 'audit-remove', action: 'season_team.removed'}
    ]);
  });
});
