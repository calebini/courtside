import {describe, expect, it} from 'vitest';

import {calculateStandings} from '@/courtside/core/standings';

const configuration = {
  points: {win: 2, loss: 0},
  ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw'] as const,
  eligiblePhases: ['regular'] as const,
  eligibleStatuses: ['final', 'forfeit'] as const,
  adjustmentsEnabled: false
};

describe('standings projection', () => {
  it('derives the default ranking from authoritative regular-season scores', () => {
    const projection = calculateStandings({
      seasonId: 'season-1',
      configurationVersionId: 'config-1',
      seasonTeamIds: ['team-a', 'team-b'],
      configuration,
      games: [
        {
          id: 'game-1',
          phase: 'regular',
          status: 'final',
          homeSeasonTeamId: 'team-a',
          awaySeasonTeamId: 'team-b',
          homeScore: 81,
          awayScore: 77
        }
      ]
    });

    expect(projection.unresolvedTies).toEqual([]);
    expect(projection.rows).toEqual([
      {
        seasonTeamId: 'team-a',
        rank: 1,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        leaguePoints: 2,
        pointsFor: 81,
        pointsAgainst: 77,
        pointDifferential: 4
      },
      {
        seasonTeamId: 'team-b',
        rank: 2,
        gamesPlayed: 1,
        wins: 0,
        losses: 1,
        leaguePoints: 0,
        pointsFor: 77,
        pointsAgainst: 81,
        pointDifferential: -4
      }
    ]);
  });

  it('exposes a stable unresolved tie instead of inventing an order', () => {
    const input = {
      seasonId: 'season-1',
      configurationVersionId: 'config-1',
      seasonTeamIds: ['team-b', 'team-a'],
      configuration,
      games: []
    };

    const first = calculateStandings(input);
    const second = calculateStandings({...input, seasonTeamIds: ['team-a', 'team-b']});

    expect(first.rows.every((row) => row.rank === null)).toBe(true);
    expect(first.unresolvedTies).toHaveLength(1);
    expect(first.unresolvedTies[0]).toEqual(second.unresolvedTies[0]);
  });

  it('ignores playoff and non-authoritative Games', () => {
    const projection = calculateStandings({
      seasonId: 'season-1',
      configurationVersionId: 'config-1',
      seasonTeamIds: ['team-a', 'team-b'],
      configuration,
      games: [
        {
          id: 'playoff',
          phase: 'playoff',
          status: 'final',
          homeSeasonTeamId: 'team-a',
          awaySeasonTeamId: 'team-b',
          homeScore: 90,
          awayScore: 80
        },
        {
          id: 'scheduled',
          phase: 'regular',
          status: 'scheduled',
          homeSeasonTeamId: 'team-a',
          awaySeasonTeamId: 'team-b',
          homeScore: 0,
          awayScore: 0
        }
      ]
    });

    expect(projection.rows.map((row) => row.gamesPlayed)).toEqual([0, 0]);
  });

  it('rejects corrupted authoritative standings input', () => {
    expect(() =>
      calculateStandings({
        seasonId: 'season-1',
        configurationVersionId: 'config-1',
        seasonTeamIds: ['team-a', 'team-b'],
        configuration,
        games: [
          {
            id: 'corrupt-game',
            phase: 'regular',
            status: 'final',
            homeSeasonTeamId: 'team-a',
            awaySeasonTeamId: 'team-b',
            homeScore: 80,
            awayScore: 80
          }
        ]
      })
    ).toThrow(/tied score/);
  });
});
