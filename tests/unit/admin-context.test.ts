import {describe, expect, it} from 'vitest';

import type {AdminLeague} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {selectAdminContext} from '@/app/[locale]/admin/admin-context';

function league(id: string, seasonIds: readonly string[]): AdminLeague {
  return {
    id,
    name: id,
    timezone: 'Europe/Paris',
    venues: [],
    seasons: seasonIds.map((seasonId) => ({
      id: seasonId,
      name: seasonId,
      configurationFrozen: false,
      configuration: {
        winPoints: 2,
        lossPoints: 0,
        ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw'],
        playoffRoundCount: 0,
        configurationHash: seasonId
      },
      teams: [],
      scheduledGames: [],
      postponedGames: [],
      inProgressGames: [],
      completedGames: [],
      standings: [],
      unresolvedTieCount: 0
    }))
  };
}

describe('admin context selection', () => {
  it('selects an explicitly authorized Season and its owning League', () => {
    const leagues = [league('league-1', ['season-1']), league('league-2', ['season-2'])];
    expect(selectAdminContext(leagues, 'season-2')).toMatchObject({
      league: {id: 'league-2'},
      season: {id: 'season-2'}
    });
  });

  it('falls back to the newest loaded Season and handles an empty scope', () => {
    expect(selectAdminContext([league('league-1', []), league('league-2', ['newest'])]))
      .toMatchObject({league: {id: 'league-2'}, season: {id: 'newest'}});
    expect(selectAdminContext([])).toEqual({league: null, season: null});
  });
});
